/**
 * Converts an uploaded DOCX to HTML via mammoth, replaces tailored sections
 * (summary, skills, experience bullets) in the HTML, then downloads as a
 * Word-compatible .doc file — preserving the original document structure.
 */

interface TailoredSections {
  summary?: { original?: string; tailored?: string }
  skills?: { original?: string; tailored?: string }
  experience?: { title?: string; original?: string; tailored?: string }[]
}

/** Normalize text for comparison: trim, collapse whitespace, strip bullets */
function norm(text: string): string {
  return text
    .replace(/^[\s\-•*–—]+/gm, '')   // strip bullet chars at line start
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Find the best-matching substring in `haystack` for `needle` using
 * a sliding window with normalized comparison.
 * Returns the original (un-normalized) matched slice or null.
 */
function findBestMatch(haystack: string, needle: string): string | null {
  const normNeedle = norm(needle)
  if (!normNeedle || normNeedle.length < 10) return null

  // Try direct substring match first (fast path)
  const normHaystack = norm(haystack)
  const idx = normHaystack.indexOf(normNeedle)
  if (idx !== -1) {
    // Find the corresponding slice in original haystack
    // Walk character by character to map normalized position back
    let origIdx = 0
    let normIdx = 0
    while (normIdx < idx && origIdx < haystack.length) {
      if (norm(haystack[origIdx]) !== '') normIdx++
      origIdx++
    }
    const start = origIdx
    let matchLen = 0
    let normMatched = 0
    while (normMatched < normNeedle.length && origIdx < haystack.length) {
      const nc = norm(haystack[origIdx])
      if (nc !== '') normMatched += nc.length
      matchLen++
      origIdx++
    }
    return haystack.slice(start, start + matchLen)
  }

  // Fallback: first 80 chars of needle as a shorter search
  const shortNeedle = normNeedle.slice(0, 80)
  const shortIdx = normHaystack.indexOf(shortNeedle)
  if (shortIdx !== -1) {
    // Return from that index to end of next sentence/line
    let origPos = 0
    let nPos = 0
    while (nPos < shortIdx && origPos < haystack.length) {
      if (norm(haystack[origPos]) !== '') nPos++
      origPos++
    }
    // Grab ~needle.length chars from there
    return haystack.slice(origPos, origPos + needle.length + 50)
  }

  return null
}

/** Split a bullet block into individual lines */
function splitBullets(text: string): string[] {
  return text
    .split(/\n/)
    .map(l => l.replace(/^[\s\-•*–—]+/, '').trim())
    .filter(Boolean)
}

/** Escape text for use in RegExp */
function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Replace first occurrence of `from` in `html` with `to`, safely */
function safeReplace(html: string, from: string, to: string): string {
  if (!from || !to || from === to) return html
  const fromTrimmed = from.trim()
  if (fromTrimmed.length < 8) return html
  try {
    return html.replace(new RegExp(escRe(fromTrimmed), 'i'), to)
  } catch {
    return html
  }
}

export async function downloadDocxOriginalFormat(
  fileBuffer: ArrayBuffer,
  tailored: TailoredSections,
  originalFileName: string,
): Promise<void> {
  // Dynamically import mammoth (browser-safe)
  const mammoth = (await import('mammoth')).default

  const { value: html, messages } = await mammoth.convertToHtml(
    { arrayBuffer: fileBuffer },
    {
      styleMap: [
        "p[style-name='Section Title'] => h2:fresh",
        "p[style-name='Subsection Title'] => h3:fresh",
      ],
    },
  )

  if (!html) {
    throw new Error('Could not read DOCX content' + (messages?.[0]?.message ? `: ${messages[0].message}` : ''))
  }

  let modified = html

  // ── Replace summary ───────────────────────────────────────────────────────
  const origSummary = tailored.summary?.original?.trim()
  const newSummary  = tailored.summary?.tailored?.trim()
  if (origSummary && newSummary) {
    const match = findBestMatch(modified, origSummary)
    if (match) {
      modified = safeReplace(modified, match, newSummary)
    } else {
      // Fallback: replace just the first 60 chars if found
      const snippet = origSummary.slice(0, 60)
      const snippetMatch = findBestMatch(modified, snippet)
      if (snippetMatch) modified = safeReplace(modified, snippetMatch, newSummary)
    }
  }

  // ── Replace skills ────────────────────────────────────────────────────────
  const origSkills = tailored.skills?.original?.trim()
  const newSkills  = tailored.skills?.tailored?.trim()
  if (origSkills && newSkills) {
    const match = findBestMatch(modified, origSkills)
    if (match) {
      modified = safeReplace(modified, match, newSkills)
    } else {
      const snippet = origSkills.slice(0, 60)
      const snippetMatch = findBestMatch(modified, snippet)
      if (snippetMatch) modified = safeReplace(modified, snippetMatch, newSkills)
    }
  }

  // ── Replace experience bullet by bullet ───────────────────────────────────
  for (const exp of (tailored.experience || [])) {
    const origBullets     = splitBullets(exp.original || '')
    const tailoredBullets = splitBullets(exp.tailored || '')
    for (let i = 0; i < Math.min(origBullets.length, tailoredBullets.length); i++) {
      const orig = origBullets[i]
      const repl = tailoredBullets[i]
      if (orig.length > 8 && repl) {
        const match = findBestMatch(modified, orig)
        if (match) modified = safeReplace(modified, match, repl)
      }
    }
    // Handle extra tailored bullets that have no original counterpart — append after last match
    if (tailoredBullets.length > origBullets.length && origBullets.length > 0) {
      const lastOrig = origBullets[origBullets.length - 1]
      const match = findBestMatch(modified, lastOrig)
      if (match) {
        const extras = tailoredBullets
          .slice(origBullets.length)
          .map(b => `<li>${b}</li>`)
          .join('')
        modified = modified.replace(safeReplace('', '', '') || match, `${match}${extras}`)
      }
    }
  }

  // ── Build Word-compatible HTML document ───────────────────────────────────
  const doc = `<html
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Tailored Resume</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
  <![endif]-->
  <style>
    body  { font-family: Calibri, Arial, sans-serif; font-size: 11pt; margin: 1in; color: #111; }
    h1   { font-size: 18pt; margin: 0 0 4px; }
    h2   { font-size: 13pt; border-bottom: 1px solid #333; margin: 14px 0 6px; }
    h3   { font-size: 11pt; margin: 10px 0 4px; }
    p    { margin: 0 0 6px; line-height: 1.4; }
    ul   { margin: 4px 0 8px; padding-left: 18px; }
    li   { margin-bottom: 3px; }
    table{ border-collapse: collapse; width: 100%; }
    td   { border: none; padding: 0; vertical-align: top; }
  </style>
</head>
<body>
${modified}
</body>
</html>`

  const blob = new Blob([doc], { type: 'application/msword' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = originalFileName.replace(/\.(docx?)$/i, '-tailored.doc')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
