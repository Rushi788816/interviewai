# InterviewAI Codebase Analysis - Comprehensive Feature Overview

**Updated:** Current snapshot of the full project structure, tech stack, and **all features** with detailed descriptions. Focus on *what the app does* (no code listings). Based on file structure, key files (package.json, README.md, Prisma schema, core components/hooks/APIs), and component analysis.

**Current Working Dir:** \`c:/Vibe Coading/interviewai\`  
**Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma (PostgreSQL) + Groq AI (Llama 3.3 70B) + NextAuth + Zustand + Electron (desktop app with overlay) + Stripe/Razorpay payments.

## 🚀 Core Product: Real-Time AI Interview Assistant (Invisible to Screen Share)

**Tagline:** \"Ace Every Interview with AI on Your Side — completely invisible to your interviewer.\"

### 1. **Live Interview Coaching (Primary Feature)**
   - **Real-time speech-to-text**: Listens to interviewer questions via microphone or **system audio** (captures Zoom/Teams speaker output). Supports 52+ languages, **Desi Mode** (natural Indian English).
   - **AI Answers**: Streams private, personalized responses using Groq AI. Formats answers as **\"SAY THIS FIRST | DETAIL | RESULT\"** (verbal mode) or **code blocks** (coding mode). Context-aware (job role, resume, chat history).
   - **Stealth/Invisible Mode**: 
     - Electron desktop app: OS-level invisible overlay window.
     - Web: Picture-in-Picture (PiP) or overlay hidden from screen share.
     - Global shortcuts (Ctrl+Shift+Q stop, Ctrl+Shift+S screenshot+AI, Ctrl+Shift+E send).
   - **Visual Question Capture**: Screenshot screen share (e.g., coding problems), auto-analyze with vision AI.
   - **Session Tracking**: Timer, credits used, QA history saved to DB.
   - **Components**: \`InterviewAssistant.tsx\` (core UI), \`useSpeechRecognition.ts\` (STT with silence detection/VAD), \`useSystemAudio.ts\`, \`useDocumentPiP.ts\`.
   - **APIs**: \`/api/ai/interview-answer\`, \`/api/ai/transcribe\` (Whisper chunks), \`/api/sessions/save\`.
   - **Modes**: Technical/Behavioral/Coding, mic vs system audio toggle.

### 2. **Mock Interviews**
   - **Generate Questions**: AI creates 5 tailored questions (role, company type, difficulty).
   - **Record & Evaluate**: User answers via voice/text, AI scores (clarity/relevance/structure) + feedback + better answer.
   - **Reports**: Overall score, session history, stats.
   - **APIs**: \`/api/ai/mock-interview\` (generate/evaluate), \`/api/sessions/save-mock\`.
   - **Components**: \`MockInterviewSession.tsx\`, \`QuestionCard.tsx\`, \`FeedbackReport.tsx\`, \`VoiceRecorder.tsx\`.

### 3. **AI Resume Builder & Tailoring**
   - **Multi-Step Builder**: 6 steps (personal info, summary, experience, education, skills, projects). AI \"enhance\" buttons (2 credits each) for bullet points/summaries.
   - **Parse & Import**: Upload PDF/DOCX, extract text.
   - **Tailor to JD**: AI customizes resume for specific job descriptions.
   - **Templates**: 8 professional templates (Bold, Classic, Compact, Creative, Executive, Minimal, Modern, Professional).
   - **Export**: PDF/DOCX download.
   - **APIs**: \`/api/ai/resume-generate\`, \`/api/ai/tailor-resume\`, \`/api/ai/parse-resume\`, \`/api/resume/*\`.
   - **Components**: \`ResumeBuilder.tsx\`, \`ResumePreview.tsx\`, \`TemplateSelector.tsx\`, \`templates/*\`.

### 4. **Payments & Credits**
   - **Credit System**: 30 free on signup. 1 credit/min live, 5 for mock questions, 2 for AI enhance.
   - **Payments**: Stripe checkout + webhooks, Razorpay support.
   - **Plans**: Free, paid upgrades.
   - **APIs**: \`/api/credits/*\`, \`/api/stripe/*\`.
   - **Components**: \`CreditsBadge.tsx\`, \`LowCreditBanner.tsx\`.

### 5. **Authentication & User Management**
   - **NextAuth**: Email/password + social? (forgot/reset/register/validate-session).
   - **Onboarding**: Job role/goal setup.
   - **Profile**: User data, resume storage.
   - **Sessions**: Temporary tokens for stateless access.
   - **APIs**: \`/api/auth/*\`, \`/api/user/*\`.
   - **Prisma Models**: User (credits/plan/onboarded), UserResume, InterviewSession, MockSession, Payment, Session.

### 6. **Marketing & Landing**
   - **Hero**: Live demo mockup, \"REAL-TIME AI · INVISIBLE TO SCREEN SHARE\" badge.
   - **Sections**: Features grid, Desi Mode highlight, platforms, stats (5K+ users), testimonials, CTA banner.
   - **Components**: \`Navbar.tsx\`, \`HeroSection.tsx\`, \`FeaturesGrid.tsx\`, \`DesiModeSection.tsx\`, etc.
   - **Pages**: \`app/(marketing)/page.tsx\` (main landing).

### 7. **Dashboard & Other**
   - **Sidebar**: Navigation (interviews, resume, mock, settings).
   - **Sessions**: Recent/history/stats (\`/api/sessions/*\`).
   - **Onboarding**: \`app/onboarding/page.tsx\`.
   - **Interview Overlay**: \`app/interview/overlay/page.tsx\`.
   - **Contact**: Form submission.
   - **Debug**: \`/api/debug\`.

### 8. **Advanced Features**
   - **Multilingual**: 52+ languages via speech hooks (\`lib/speechLanguages.ts\`).
   - **Keyboard Shortcuts**: Font resize, send, screenshot, clear, scroll.
   - **Toast Notifications**: \`useToast.ts\`.
   - **Rate Limiting**: All AI endpoints.
   - **Electron Desktop**: \`electron/main.js\`, overlay.html, entitlements.mac.plist, auto-updates.
   - **Hooks**: \`useCredits.ts\`, Zustand stores (\`interviewStore.ts\`).

## 📊 Database Schema (Prisma)
- **User**: credits, plan, onboarded, jobRole/goal.
- **UserResume**: JSON data.
- **InterviewSession**: duration, creditsUsed, transcript/QA (JSON).
- **MockSession**: questions/answers/scores (JSON).
- **Payment**: razorpayId, amount.
- **Session**: auth tokens.

## 🛠 Build & Deployment
- **Scripts**: \`npm run dev/build/electron:dev/build\`.
- **Electron**: Windows/Mac builds, NSIS/DMG.
- **Vercel**: \`vercel.json\`.
- **Dependencies**: Groq SDK, Stripe, pdf-parse, mammoth (DOCX), html2canvas/jspdf (PDF export), framer-motion.

## 🔮 TODO (from TODO.md)
- Fix multi-listening in speech recognition.
- PDF extraction improvements.
- Test sessions.

**Status**: Production-ready MVP with live coaching, mocks, resumes. Dark theme (Bitcoin/DeFi orange). Run \`npm run dev\` for web, \`npm run electron:dev\` for desktop. 🚀
