// Builds the printed handoff as plain sections, in English or Spanish.
// Spanish translates only app-authored labels (src/i18n/handoff-es.ts). Every string that comes
// from a program record or a source (step labels, owner text, renewal, return channels, limits,
// URLs) stays in English, inside a block labelled "Texto original en inglés".
// Pam's generic no-guarantee and 220 CMR notices are NOT printed: ban 15 allows a no-guarantee line
// only from the record's own source, and 220 CMR 25.03 is not every company's rule.

import type { HandoffView } from "../types"
import { HANDOFF_LABELS_ES } from "../i18n/handoff-es"

export type HandoffLang = "en" | "es"

export interface HandoffSection {
  heading?: string
  lines: string[]
  bold?: boolean
  /** true when every line is copied unchanged from the record or a source */
  original?: boolean
}

export interface HandoffText {
  title: string
  originalNotice?: string
  sections: HandoffSection[]
}

export function handoffText(h: HandoffView, lang: HandoffLang): HandoffText {
  const es = lang === "es" ? HANDOFF_LABELS_ES : null
  const L = {
    title: es ? es.headings.title : `LifeLine Power handoff${h.householdLabel ? ` — ${h.householdLabel}` : ""}`,
    next: es ? es.nextStep.label : "Next step",
    owner: es ? es.nextStep.ownerPrefix : "Owner",
    town: es ? es.headings.town : "Town",
    company: es ? es.headings.company : "Company",
    program: es ? es.headings.program : "Program",
    purpose: es ? es.headings.purpose : "Purpose",
    status: es ? es.headings.tracker : "Status",
    language: es ? "Idioma del hogar" : "Household language",
    steps: es ? es.steps.heading : "Steps and owners",
    done: es ? es.steps.statusDone : "Done",
    open: es ? es.steps.statusPending : "Open",
    renewal: es ? es.headings.renewal : undefined,
    answers: es ? es.headings.answers : "Recorded answers",
    send: es ? es.sendItTo.heading : "Send it to",
    fromSource: es ? "Lo que dice la fuente" : "From the source",
    sources: es ? es.sources.heading : "Sources",
    letter: es ? "La carta debe indicar" : "The letter must state",
    notVerified: es ? "No verificado" : "Not verified",
  }
  const sections: HandoffSection[] = [
    { lines: [`${L.next}: ${h.firstOpenStep.label}`, `${L.owner}: ${h.firstOpenStep.ownerText}`], bold: true },
    {
      lines: [
        `${L.town}: ${h.town}`,
        `${L.company}: ${h.companyCode}`,
        `${L.program}: ${h.programName}`,
        `${L.purpose}: ${h.purposeText}`,
        ...(h.trackerWord ? [`${L.status}: ${h.trackerWord}`] : []),
        ...(h.language ? [`${L.language}: ${h.language.value} (${es ? es.headings.languageSetBy : h.language.label})`] : []),
      ],
    },
    { heading: L.steps, lines: h.steps.map((s) => `${s.label} — ${L.owner}: ${s.ownerText} — ${s.done ? L.done : L.open}`) },
    {
      heading: L.renewal,
      lines: [h.renewal, ...(h.regulationContext ? [h.regulationContext] : []), ...(h.formBoxNote ? [h.formBoxNote] : [])],
      original: true,
    },
    ...(h.answers.length > 0 ? [{ heading: L.answers, lines: h.answers.map((a) => `${a.label}: ${a.value}`) }] : []),
    { heading: L.send, lines: h.returnChannels, original: true },
    ...(h.contents && h.contents.length > 0 ? [{ heading: L.letter, lines: h.contents, original: true }] : []),
    ...(h.limits.length > 0 || h.noGuarantee
      ? [{ heading: L.fromSource, lines: [...h.limits, ...(h.noGuarantee ? [h.noGuarantee] : [])], original: true }]
      : []),
    { heading: L.sources, lines: h.sourceUrls, original: true },
    ...(h.unverified.length > 0
      ? [{ heading: L.notVerified, lines: h.unverified.map((u) => `UNVERIFIED: ${u}`), original: true }]
      : []),
  ]
  return { title: L.title, originalNotice: es ? es.sources.originalTextNotice : undefined, sections }
}
