// Regression tests for .kiro/specs/lifeline-qa-bugs (Oscar's QA batch, Q1-Q5 + polish b).
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { Ctx, RecordId } from "../src/types"
import { loadKits } from "../src/lib/kits"
import { PROGRAMS, recordById } from "../src/rules/programs"
import { derive } from "../src/state/derive"
import { handoffText } from "../src/state/handoff-text"
import { initialState, reduce } from "../src/state/reducer"

const ROOT = join(import.meta.dirname, "..")
// FINAL-idea.md lives outside the public repo (D:\Hackathon\research); skip that check when absent.
const FINAL = join(ROOT, "..", "research", "FINAL-idea.md")
const ctx: Ctx = { kits: loadKits(["mvp", "tier1"]), enabledTiers: ["mvp", "tier1"] }

const NG_LIMIT_TERMINATION =
  "It is important to understand that participation in the Life Support Program does not protect your account from termination of service for non-payment of arrears. We encourage you to pay any arrears on your account as soon as possible. If you require protection from termination on your account due to the presence of a serious or chronic illness in the household, please apply separately with our Customer Protections Form."
const NG_LIMIT_PRIORITY =
  "Also note- Outage Life Support does not sign your account up for a higher priority for restoration if there is an outage."
const LETTER_CONTENTS = [
  "The document is on the letterhead of a registered physician, physician assistant, nurse practitioner, or local board of health, with that office's address and phone.",
  "It states the patient's name and address and whether the illness is serious (90 days) or chronic (180 days).",
  "If the account is not on a discount rate, a financial-hardship statement is also required.",
]

function open(town: string, id: RecordId) {
  let s = reduce(initialState, { type: "SELECT_TOWN", key: town }, ctx)
  s = reduce(s, { type: "PICK_PROGRAM", id }, ctx)
  return derive(s, ctx)
}

describe("lifeline-qa-bugs", () => {
  it("Q1 no string on any Unitil record says 'demo time'", () => {
    for (const r of PROGRAMS.filter((p) => p.id.startsWith("unitil-"))) {
      expect(JSON.stringify(r)).not.toContain("demo time")
      expect(r.unverified).toContain(
        "When the Unitil page was opened on 24 Oct 2026 it said MyUnitil forms were unavailable; whether that is still true is not verified.",
      )
    }
  })

  it("Q2 Unitil companyNameOnPage is 'Unitil' and appears in FINAL-idea.md", () => {
    for (const id of ["unitil-lifesupport", "unitil-protection"] as const) {
      expect(recordById(id)!.companyNameOnPage).toBe("Unitil")
    }
    if (existsSync(FINAL)) expect(readFileSync(FINAL, "utf8")).toContain("Unitil")
    expect(JSON.stringify(PROGRAMS)).not.toContain("Fitchburg Gas and Electric Light Company")
  })

  it("Q3 ProgramCard no longer heads limits 'What this program does not do'", () => {
    const t = readFileSync(join(ROOT, "src", "components", "ProgramCard.tsx"), "utf8")
    expect(t).not.toContain("What this program does not do")
    expect(t).toContain("From the source")
  })

  it("Q4 Lawrence ng-outage handoff prints both National Grid warnings and a Not verified section", () => {
    const h = open("LAWRENCE", "ng-outage").handoff!
    const en = handoffText(h, "en")
    const all = en.sections.flatMap((s) => s.lines)
    expect(all).toContain(NG_LIMIT_TERMINATION)
    expect(all).toContain(NG_LIMIT_PRIORITY)
    const nv = en.sections[en.sections.length - 1]
    expect(nv.heading).toBe("Not verified")
    expect(nv.original).toBe(true)
    expect(nv.lines.length).toBeGreaterThan(0)
    for (const l of nv.lines) expect(l.startsWith("UNVERIFIED: ")).toBe(true)
    expect(handoffText(h, "es").sections.at(-1)!.heading).toBe("No verificado")
  })

  it("Q4 Chelsea ev-letter handoff prints the Bedford currency note as an UNVERIFIED line", () => {
    const en = handoffText(open("CHELSEA", "ev-letter").handoff!, "en")
    const nv = en.sections.find((s) => s.heading === "Not verified")!
    expect(nv.lines).toContain("UNVERIFIED: Bedford copy, May 2023 filename — currency UNVERIFIED")
  })

  it("Q5 ng-medical card and handoff carry the three letter-content sentences exactly", () => {
    const vm = open("LAWRENCE", "ng-medical")
    expect(vm.card!.contents!.map((c) => c.text)).toEqual(LETTER_CONTENTS)
    for (const c of vm.card!.contents!) expect(c.sourceId).toBe("ng-protect")
    const en = handoffText(vm.handoff!, "en")
    const sec = en.sections.find((s) => s.heading === "The letter must state")!
    expect(sec.lines).toEqual(LETTER_CONTENTS)
    expect(sec.original).toBe(true)
    expect(handoffText(vm.handoff!, "es").sections.some((s) => s.heading === "La carta debe indicar")).toBe(true)
  })

  it("Q5 FINAL-idea.md contains each letter-content sentence", () => {
    if (!existsSync(FINAL)) return
    const t = readFileSync(FINAL, "utf8")
    for (const c of LETTER_CONTENTS) expect(t).toContain(c)
  })

  it("polish b: no UNVERIFIED badge when the channel text already says UNVERIFIED", () => {
    const t = readFileSync(join(ROOT, "src", "components", "ProgramCard.tsx"), "utf8")
    expect(t).toContain('c.unverified && !c.text.includes("UNVERIFIED")')
  })
})
