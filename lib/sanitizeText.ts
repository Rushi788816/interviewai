/** C0 controls except tab/newline */
const CTRL_EXCEPT_WHITESPACE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

/**
 * Normalizes user/resume text for storage and API: valid UTF-8 string hygiene,
 * no BOM, no replacement chars, no binary control characters.
 */
export function sanitizeReadableText(input: string, maxLen: number): string {
  if (!input) return ''
  let s = input
    .replace(/^\uFEFF/, '')
    .replace(/\uFFFD/g, '')
    .replace(CTRL_EXCEPT_WHITESPACE, '')
    .replace(/\r\n/g, '\n')
  s = s.replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  return s.slice(0, maxLen)
}

/** Latin extended + Devanagari + Bengali + Gujarati + Tamil + Telugu + Kannada + Malayalam */
const LETTERISH =
  /[a-zA-Z\u00C0-\u024F\u0900-\u097F\u0980-\u09FF\u0A80-\u0AFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/g

/**
 * True if the string looks like corrupted extraction (mostly non-letters / noise).
 */
export function looksLikeCorruptedExtract(text: string): boolean {
  const t = text.replace(/\s/g, '')
  if (t.length < 24) return false
  const letters = (t.match(LETTERISH) || []).length
  const letterRatio = letters / t.length
  if (letterRatio < 0.1) return true
  let ctrlChars = 0
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i)
    if (c < 32 && c !== 9) ctrlChars++
  }
  return ctrlChars / t.length > 0.04
}

/** Strip common leaked chat-template prefixes from model output */
export function stripLeakedRolePrefix(text: string): string {
  return text.replace(/^(?:[\s\uFFFD\u200B-\u200D\uFEFF]*)(?:assistant|user)\s*[:\n]+\s*/i, '')
}

export function stripReplacementAndControls(text: string): string {
  return text.replace(/\uFFFD/g, '').replace(CTRL_EXCEPT_WHITESPACE, '')
}

/** Use when an LLM stream completes (drops, control chars, leaked "assistant:" prefixes). */
export function finalizeAssistantAnswer(text: string): string {
  return stripLeakedRolePrefix(stripReplacementAndControls(text)).trim()
}
