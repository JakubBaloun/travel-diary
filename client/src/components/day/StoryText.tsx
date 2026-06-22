import { type ReactNode } from "react"

interface Props {
  text: string
  className?: string
}

/** Tiny markdown: **bold**, *italic*, blank line → paragraph. No links/lists/headers. */
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let buf = ""
  let key = 0
  let i = 0

  function flushBuf() {
    if (buf) {
      out.push(buf)
      buf = ""
    }
  }

  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2)
      if (end > i + 2) {
        flushBuf()
        out.push(<strong key={key++}>{text.slice(i + 2, end)}</strong>)
        i = end + 2
        continue
      }
    }
    if (text[i] === "*") {
      const end = text.indexOf("*", i + 1)
      if (end > i + 1) {
        flushBuf()
        out.push(<em key={key++}>{text.slice(i + 1, end)}</em>)
        i = end + 1
        continue
      }
    }
    if (text[i] === "\n") {
      buf += " "
      i++
      continue
    }
    buf += text[i]
    i++
  }
  flushBuf()
  return out
}

function StoryText({ text, className }: Props) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (paragraphs.length === 0) return null

  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className="mb-4 text-base leading-relaxed text-foreground/85 last:mb-0">
          {renderInline(p)}
        </p>
      ))}
    </div>
  )
}

export default StoryText
