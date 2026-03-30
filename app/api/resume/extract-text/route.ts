import { NextRequest } from "next/server"
import { sanitizeReadableText, looksLikeCorruptedExtract } from "@/lib/sanitizeText"
import { inflateSync, inflateRawSync } from "zlib"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Max 10MB resume file
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File too large (max 10MB)" }, { status: 413 })
    }

    const fileName = file.name.toLowerCase()

    // TXT files — read directly
    if (fileName.endsWith(".txt")) {
      const raw = await file.text()
      const text = sanitizeReadableText(raw, 5000)
      return Response.json({ text })
    }

    // PDF files — custom extractor (no external deps needed)
    if (fileName.endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const extracted = extractPdfText(buffer)
      const cleaned = sanitizeReadableText(extracted, 5000)

      if (cleaned.length > 100 && !looksLikeCorruptedExtract(cleaned)) {
        return Response.json({
          text: cleaned,
          note: "✅ PDF text extracted successfully",
        })
      }

      return Response.json({
        text: "",
        warning: "Could not extract clean text from this PDF — please paste your resume text below",
      })
    }

    // DOC/DOCX
    if (fileName.match(/\.(doc|docx)$/)) {
      return Response.json({
        text: "",
        warning: "DOC/DOCX not supported — convert to PDF or paste your resume text below",
      })
    }

    return Response.json({
      text: "",
      warning: "Unsupported file type. Please upload a PDF or TXT file.",
    })
  } catch (error: any) {
    console.error("Extract text error:", error.message)
    return Response.json({ error: "Processing error: " + error.message, text: "" }, { status: 500 })
  }
}

/**
 * Extracts readable text from a PDF buffer using Node.js built-ins only.
 * Handles FlateDecode compressed streams and both Tj and TJ text operators.
 */
function extractPdfText(pdfBuffer: Buffer): string {
  const pdfStr = pdfBuffer.toString("binary")
  const allText: string[] = []

  let pos = 0
  while (pos < pdfStr.length) {
    const streamStart = pdfStr.indexOf("stream", pos)
    if (streamStart === -1) break

    const endStreamPos = pdfStr.indexOf("endstream", streamStart)
    if (endStreamPos === -1) break

    // Get dict snippet before stream to check FlateDecode and skip image streams
    const dictSnippet = pdfStr.slice(Math.max(0, streamStart - 500), streamStart).toLowerCase()

    // Skip image/form XObject streams
    const isImage =
      dictSnippet.includes("/subtype/image") ||
      dictSnippet.includes("/subtype /image") ||
      dictSnippet.includes("/imagemask")
    if (!isImage) {
      // Stream content starts after the newline following 'stream'
      const nlPos = pdfStr.indexOf("\n", streamStart + 6)
      const contentStart = nlPos + 1
      let streamBuf = pdfBuffer.slice(contentStart, endStreamPos)

      // Strip trailing \r\n
      if (streamBuf[streamBuf.length - 1] === 10) streamBuf = streamBuf.slice(0, -1)
      if (streamBuf[streamBuf.length - 1] === 13) streamBuf = streamBuf.slice(0, -1)

      // Decompress if FlateDecode
      if (dictSnippet.includes("flatedecode")) {
        try {
          streamBuf = inflateSync(streamBuf)
        } catch {
          try { streamBuf = inflateRawSync(streamBuf) } catch { /* skip */ }
        }
      }

      const streamText = streamBuf.toString("latin1")
      const pageText = parseTextFromStream(streamText)
      if (pageText.trim().length > 3) allText.push(pageText)
    }

    pos = endStreamPos + 9
  }

  return allText.join("\n")
}

/**
 * Parses PDF text operators (BT/ET, Tj, TJ, Td, T*) from a decompressed stream.
 */
function parseTextFromStream(content: string): string {
  const parts: string[] = []
  let inText = false
  let i = 0
  const n = content.length

  while (i < n) {
    // Begin/End text block
    if (content[i] === "B" && content.slice(i, i + 2) === "BT") { inText = true; i += 2; continue }
    if (content[i] === "E" && content.slice(i, i + 2) === "ET") { inText = false; i += 2; continue }

    if (!inText) { i++; continue }

    // Line break operators: Td TD T*
    if (content[i] === "T") {
      const next = content[i + 1]
      if (next === "d" || next === "D" || next === "*") {
        parts.push(" ")
        i += 2
        continue
      }
    }

    // String literal: (...)Tj or (...)' or (...)''
    if (content[i] === "(") {
      const { str, end } = readPdfString(content, i)
      i = end
      // Skip whitespace then check operator
      while (i < n && (content[i] === " " || content[i] === "\r" || content[i] === "\n")) i++
      const op = content.slice(i, i + 2)
      if (op[0] === "T" && (op[1] === "j" || op[1] === "J")) {
        parts.push(str)
        i += 2
      } else if (op[0] === "'") {
        parts.push(" " + str)
        i++
      }
      continue
    }

    // Array: [(str1) offset (str2)...]TJ
    if (content[i] === "[") {
      const { text, end } = readTjArray(content, i)
      i = end
      while (i < n && (content[i] === " " || content[i] === "\r" || content[i] === "\n")) i++
      if (content.slice(i, i + 2) === "TJ") {
        parts.push(text)
        i += 2
      }
      continue
    }

    i++
  }

  return parts
    .join("")
    .replace(/[\r\n]+/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

/** Reads a PDF string literal starting at index i (the opening paren). */
function readPdfString(s: string, i: number): { str: string; end: number } {
  let result = ""
  let depth = 0
  i++ // skip opening (
  while (i < s.length) {
    const c = s[i]
    if (c === "\\") {
      const next = s[i + 1]
      if (next === "n") result += "\n"
      else if (next === "r") result += "\r"
      else if (next === "t") result += "\t"
      else if (next === "(" || next === ")" || next === "\\") result += next
      else if (next >= "0" && next <= "7") {
        // Octal escape
        const oct = s.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || ""
        result += String.fromCharCode(parseInt(oct, 8))
        i += oct.length
        continue
      }
      i += 2
      continue
    }
    if (c === "(") depth++
    if (c === ")") {
      if (depth === 0) { i++; break }
      depth--
    }
    result += c
    i++
  }
  // Filter to printable ASCII + space
  result = result.replace(/[^\x20-\x7E]/g, " ").replace(/\s{2,}/g, " ")
  return { str: result, end: i }
}

/** Reads a TJ array [...] and returns combined text (negative kerning > 250 adds a space). */
function readTjArray(s: string, i: number): { text: string; end: number } {
  let text = ""
  i++ // skip [
  while (i < s.length && s[i] !== "]") {
    // Skip whitespace
    if (s[i] === " " || s[i] === "\r" || s[i] === "\n") { i++; continue }
    if (s[i] === "(") {
      const { str, end } = readPdfString(s, i)
      text += str
      i = end
      continue
    }
    // Kerning number — negative large values mean word space
    if (s[i] === "-" || (s[i] >= "0" && s[i] <= "9")) {
      let numStr = ""
      if (s[i] === "-") { numStr = "-"; i++ }
      while (i < s.length && ((s[i] >= "0" && s[i] <= "9") || s[i] === ".")) { numStr += s[i++] }
      const kern = parseFloat(numStr)
      if (kern < -200) text += " " // large negative kern = word separator
      continue
    }
    i++
  }
  return { text, end: i + 1 } // +1 to skip ]
}
