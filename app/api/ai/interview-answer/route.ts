import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { groq } from '@/lib/groq'
import { sanitizeReadableText } from '@/lib/sanitizeText'
import { rateLimit } from '@/lib/rateLimit'
import type { SessionContext } from '@/types'

export async function GET() {
  return Response.json({
    status: 'ok',
    groqKeyPresent: !!process.env.GROQ_API_KEY?.trim(),
  })
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`answer:${session.user.id}`, 30, 60_000)
    if (!rl.allowed) {
      return Response.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
    }

    const body = await req.json()
    const {
      question,
      images,
      isDesiMode,
      interviewType,
      sessionContext,
      qaHistory,
    } = body as {
      question?: string
      images?: string[]
      isDesiMode?: boolean
      interviewType?: string
      language?: string
      sessionContext?: SessionContext | null
      qaHistory?: { question: string; answer: string }[]
    }

    if (!process.env.GROQ_API_KEY?.trim()) {
      return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
    }

    const hasImages = Array.isArray(images) && images.length > 0

    if (!hasImages && (!question || question.trim().length < 3)) {
      return Response.json({ error: 'Question too short' }, { status: 400 })
    }

    // ── Context blocks ────────────────────────────────────────────────────────
    const sc = sessionContext
    const roleLabel = sc?.jobRole || ''
    const resume = sc?.resumeText ? sanitizeReadableText(sc.resumeText, 2500) : ''
    const jd = sc?.jobDescription ? sanitizeReadableText(sc.jobDescription, 1500) : ''

    const identityLines: string[] = []
    if (roleLabel) identityLines.push(`Target role: ${roleLabel}`)
    if (jd)        identityLines.push(`Job description:\n${jd}`)
    if (resume)    identityLines.push(`Candidate resume / background:\n${resume}`)
    const identityBlock = identityLines.join('\n\n')

    const recentHistory = (qaHistory ?? []).slice(-4)
    const historyBlock = recentHistory.length > 0
      ? '\n\nCONVERSATION SO FAR:\n' +
        recentHistory.map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`).join('\n\n')
      : ''

    const q = (question ?? '').toLowerCase().trim()

    // ── Intent classification ────────────────────────────────────────────────
    //
    // Priority order (first match wins):
    //  1. hasImages          → screenshot analysis (always needs code/visual answer)
    //  2. isWriteCode        → write/implement actual code
    //  3. isExplainWithCode  → explain a concept with a code example
    //  4. isDebug            → find/fix a bug or error
    //  5. isSystemDesign     → design a system / architecture
    //  6. isBehavioral       → STAR-format story
    //  7. isFollowUp         → expand on previous answer
    //  8. isTechnical        → explain a concept (no code needed)
    //  9. (default)          → general / HR

    // Asks to write/implement/create actual code
    const isWriteCode = /\b(write|show me|give me|create|make|build|code)\b.{0,30}\b(code|function|program|script|snippet|method|class|solution|algorithm)\b|\bimplement\b|\bhow (to|do (you|i|we)) (write|code|implement|build|create)\b/i.test(q)

    // Asks to explain a concept AND include a code example
    const isExplainWithCode = /with (a |an )?(code |working |simple )?example|explain.{0,40}(with |using )?(an? )?example|show.{0,30}(me |us )?(a |an )?example|(what|how).{0,30}(with code|using code|code example)|give.{0,30}(a |an )?(code )?example|(example|demo|illustration) of (how|this|the|a )\b/i.test(q)

    // Debugging / fixing / error diagnosis
    const isDebug = /\b(debug|fix|bug|error|exception|issue|problem|crash|not working|doesn'?t work|fails?|broken|wrong (with|here|in)|what'?s wrong|find the (bug|issue|error)|help (me )?(fix|debug)|why (is|does|am|isn'?t|doesn'?t|won'?t)|correct (the|this|my)|resolve|trace)\b/i.test(q)

    // System design / architecture
    const isSystemDesign = /\b(design|architect|how would you (design|build|scale|architect)|system design|high.?level design|scalable|microservice|distributed|database schema|api design|design pattern|how to scale|architecture (of|for))\b/i.test(q)

    // Behavioral story (STAR format)
    const isBehavioral = /tell me about (a time|yourself|your|when)|\bdescribe (a time|a situation|an experience|your)\b|\bwalk me through\b|situation where|how did you handle|what did you do when|greatest (strength|weakness)|why should (we|i) hire|why do you want (to|this|the)|biggest (challenge|mistake|achievement|failure)|most (difficult|challenging|proud|significant)|talk about a time/i.test(q)

    // Follow-up / elaboration
    const isFollowUp = /\b(tell me more|elaborate|can you (explain|clarify|expand|go deeper)|go deeper|expand on|what do you mean|give me an example of that|say more about|clarify|could you (explain|clarify)|more detail|and then|what happened|how exactly|be more specific)\b/i.test(q)

    // Needs actual code (any of the above code-related types, or coding session, or has images)
    const needsCode = hasImages || isWriteCode || isExplainWithCode || isDebug ||
      interviewType === 'coding'

    // ── Model selection ───────────────────────────────────────────────────────
    const model = hasImages
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile'

    // ── Build system prompt based on intent ───────────────────────────────────
    let systemPrompt: string
    let maxTokens: number
    let temperature: number
    let answerMode: 'code' | 'verbal'

    const desiNote = isDesiMode
      ? '\nSpeak the way Indian engineers naturally explain things — clear, direct, practical.'
      : ''

    if (needsCode) {
      // ── CODE MODE ─────────────────────────────────────────────────────────
      // Real code output, markdown code blocks, no verbal story structure.
      answerMode = 'code'
      maxTokens = 1600
      temperature = 0.15

      const codeContext = identityBlock
        ? `\nContext about the candidate:\n${identityBlock}\n`
        : ''

      systemPrompt = `You are a senior software engineer demonstrating your skills in a technical interview.${desiNote}
${codeContext}${historyBlock ? historyBlock + '\n' : ''}
INSTRUCTIONS — follow exactly:

${hasImages ? `SCREENSHOT ANALYSIS:
You have been given one or more screenshots. Look at them carefully.
- If the screenshot shows a CODING PROBLEM (LeetCode, HackerRank, whiteboard, etc.) → write the complete working solution in code.
- If the screenshot shows CODE WITH A BUG or ERROR → identify the exact problem, explain it in 1-2 sentences, then provide the corrected code.
- If the screenshot shows an ERROR MESSAGE → diagnose the root cause, explain what it means, and provide the fix.
- If the screenshot shows a SYSTEM DESIGN DIAGRAM → describe the architecture and suggest improvements or implementation.
- Always include a code block with the solution or fix.
` : ''}
WRITING CODE:
- Write actual, complete, working code. Never write pseudocode or just describe what you'd write.
- Use a proper markdown code block: \`\`\`language\\ncode here\\n\`\`\`
- Use the specific language/technology the question asks for. If not specified, choose the most appropriate one (e.g. Python for algorithms, JavaScript for web, Java/C++ for systems).
- The code must run correctly, handle basic edge cases, and be properly indented.

EXPLAINING WITH EXAMPLES:
- Give a short explanation first (2–3 sentences maximum).
- Then provide a working code example in a code block.
- After the code, add 1 sentence on time complexity / edge cases only if genuinely relevant.

AFTER THE CODE:
- 1–2 sentences max. Mention: time/space complexity, important edge cases, or a key decision.
- Do NOT write paragraphs of explanation after the code. The code should speak for itself.

FORMATTING:
- Never start with "Sure!", "Great question!", "Certainly!", or any filler phrase.
- Never output "Assistant:" or "User:" labels.
- If there are multiple approaches, show the optimal one first.`

    } else if (isBehavioral) {
      // ── BEHAVIORAL MODE ───────────────────────────────────────────────────
      answerMode = 'verbal'
      maxTokens = 650
      temperature = 0.55

      systemPrompt = `You are a job candidate answering a behavioral interview question in your own voice.${desiNote}

${identityBlock}${historyBlock}

RULES:
- Answer in FIRST PERSON as "I" — you ARE the candidate, not a coach.
- Use the STAR method strictly: Situation → Task → Action → Result.
- Reference a specific project or experience from the resume — real company names, real technology, real outcomes.
- ONLY use technologies, companies, and facts explicitly written in the resume above. Do not invent, assume, or add anything.
- Sound confident and human — not like a scripted template.
- Structure your answer in EXACTLY 3 parts separated by " | ":
  PART 1 (1 sentence): Set the situation — what was happening and what was at stake.
  PART 2 (2 sentences max): The specific actions you personally took — real tech stack, real decisions, what you built or changed.
  PART 3 (1 sentence): The concrete outcome — a number, metric, or clear result that proves the impact.
- Every sentence must add new information. No repetition, no filler.
- Keep the full answer under 130 words total.
- Never start with "Sure!", "Great question!", "Certainly!", or any filler phrase.
- Never output role labels.`

    } else if (isFollowUp) {
      // ── FOLLOW-UP MODE ────────────────────────────────────────────────────
      answerMode = 'verbal'
      maxTokens = 600
      temperature = 0.5

      systemPrompt = `You are a job candidate answering a follow-up interview question in your own voice.${desiNote}

${identityBlock}${historyBlock}

RULES:
- Answer in FIRST PERSON as "I".
- This is a follow-up — the interviewer wants MORE depth. Provide genuinely new information:
  a specific example, a metric, a technical detail, or a deeper insight NOT already covered.
- Do NOT repeat or rephrase anything already said in the conversation above.
- ONLY use technologies and facts from the resume.
- Structure as EXACTLY 3 parts separated by " | ":
  PART 1: The new specific point or example (1 sentence)
  PART 2: The technical detail or context behind it (1–2 sentences)
  PART 3: The result or takeaway (1 sentence)
- Keep under 120 words total.
- Never start with "Sure!", "Great question!", or filler.`

    } else if (isSystemDesign) {
      // ── SYSTEM DESIGN MODE ────────────────────────────────────────────────
      answerMode = 'verbal'
      maxTokens = 800
      temperature = 0.4

      systemPrompt = `You are a senior software engineer answering a system design interview question.${desiNote}

${identityBlock ? identityBlock + '\n\n' : ''}${historyBlock ? historyBlock + '\n\n' : ''}RULES:
- Structure your answer in EXACTLY 3 parts separated by " | ":
  PART 1: Core architecture — the key components and how they connect (2 sentences).
  PART 2: Critical design decisions — database choice, caching, API design, or scaling strategy with specific reasoning (2 sentences).
  PART 3: Trade-offs and what you'd prioritize first in production (1–2 sentences).
- Be specific — mention real technologies (Redis, Kafka, PostgreSQL, etc.) where appropriate.
- You are NOT restricted to technologies in the resume for system design concepts.
- Keep total answer under 180 words.
- Never start with filler phrases. Never repeat yourself.`

    } else {
      // ── TECHNICAL CONCEPT MODE (default) ─────────────────────────────────
      answerMode = 'verbal'
      maxTokens = 700
      temperature = 0.45

      systemPrompt = `You are a job candidate answering a technical interview question in your own voice.${desiNote}

${identityBlock}${historyBlock}

RULES:
- Answer in FIRST PERSON as "I" — you ARE the candidate, not a coach.
- Start with the clear, correct definition or direct answer — no preamble.
- Then connect it to your own real experience using specific details from the resume.
- ONLY use technologies, companies, and facts explicitly in the resume. Do not invent anything.
- Sound confident and knowledgeable — not like a textbook definition.
- Structure your answer in EXACTLY 3 parts separated by " | ":
  PART 1 (1 sentence): The direct answer — the definition or key concept, stated confidently.
  PART 2 (2 sentences max): How you personally applied or encountered this — real project, real tech from resume.
  PART 3 (1 sentence): The outcome, result, or insight from that experience.
- Every sentence must add new information. No filler, no repetition.
- Keep the full answer under 140 words.
- Never start with "Sure!", "Great question!", "Certainly!", or any filler phrase.
- Never output role labels.`
    }

    // ── Build user message ────────────────────────────────────────────────────
    const userContent = hasImages
      ? [
          {
            type: 'text' as const,
            text: question?.trim()
              ? `Interview question / task: "${question}"\n\nPlease analyze the attached screenshot(s) and provide a complete answer with code as needed.`
              : 'Please analyze the attached screenshot(s) and provide a complete answer — identify what is shown and provide the solution or fix with working code.',
          },
          ...images!.map(img => ({
            type: 'image_url' as const,
            image_url: { url: img },
          })),
        ]
      : (`Interview question: "${question ?? ''}"` as string)

    // ── Stream response ───────────────────────────────────────────────────────
    const stream = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      max_tokens: maxTokens,
      temperature,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // First event: tell the client which rendering mode to use
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ mode: answerMode })}\n\n`))

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          console.error('Stream error:', err)
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('interview-answer error:', error)
    return Response.json({ error: message }, { status: 500 })
  }
}
