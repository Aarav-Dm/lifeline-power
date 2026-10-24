import type { HandoffView } from "@/types"
import { handoffText, type HandoffLang } from "@/state/handoff-text"

/** One US Letter page, plain black on white. Renders only derive().handoff via handoffText (R4). */
export function Handoff({ h, preview = false, lang = "en" }: { h: HandoffView; preview?: boolean; lang?: HandoffLang }) {
  const t = handoffText(h, lang)
  return (
    <article
      id={preview ? undefined : "handoff"}
      lang={lang}
      className={
        preview
          ? "mx-auto w-full max-w-[8.5in] rounded-md border border-border bg-white p-8 text-[11pt] leading-snug text-black shadow-md"
          : "hidden text-[11pt] leading-snug"
      }
      aria-label={preview ? "Handoff preview" : "Printable handoff"}
    >
      <h1 className="text-[15pt] font-bold">{t.title}</h1>
      {t.sections.map((s, i) => (
        <section key={i} className={i === 0 ? "mt-2 border border-black p-2" : "mt-2"}>
          {s.heading && <p className="font-bold">{s.heading}</p>}
          {s.original && t.originalNotice && <p className="text-[9pt] italic">{t.originalNotice}:</p>}
          <ul className={s.original ? "break-all" : undefined} lang={s.original && t.originalNotice ? "en" : undefined}>
            {s.lines.map((l) => (
              <li key={l} className={s.bold ? "font-bold" : undefined}>
                {l}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  )
}
