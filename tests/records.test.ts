import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import fc from "fast-check"
import { describe, expect, it } from "vitest"
import type { Field, ProgramRecord, Sourced } from "../src/types"
import { NO_INTERVAL } from "../src/types"
import { SOURCES } from "../src/rules/sources"
import {
  ENABLED_TIERS,
  HOLYOKE_CODE,
  isAnswered,
  PROGRAMS,
  PURPOSE_TEXT,
  recordById,
  recordsFor,
} from "../src/rules/programs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const RULES_DIR = resolve(__dirname, "../src/rules")

const UNITIL_CODE = "Unitil (Fitchburg Gas & Electric)"
const NG_CODE = "National Grid (Massachusetts Electric)"
const EVERSOURCE_CODE = "Eversource Energy (NSTAR Electric)"

const unitil = recordById("unitil-lifesupport") as ProgramRecord
const ng = recordById("ng-outage") as ProgramRecord

/** Every Sourced string carried anywhere on a record, with where it came from. */
function allSourcedOn(r: ProgramRecord): Sourced[] {
  const out: Sourced[] = [r.signer, r.renewal]
  if (r.signerAlso) out.push(r.signerAlso)
  if (r.regulationContext) out.push(r.regulationContext)
  if (r.formBoxNote) out.push(r.formBoxNote)
  if (r.noGuarantee) out.push(r.noGuarantee)
  if (r.cpapSentence) out.push(r.cpapSentence)
  out.push(...r.returnChannels, ...r.quotes, ...r.limits)
  return out
}

/** Every plain string the record renders, for substring/regex scans. */
function allStringsOn(r: ProgramRecord): string[] {
  const out: string[] = [
    r.companyCode,
    r.companyNameOnPage,
    r.programName,
    r.renewalLabel,
    r.sendAttestation,
    PURPOSE_TEXT[r.purpose],
    `${r.renewalLabel}: ${r.renewal.text}${r.renewal.scope ? " " + r.renewal.scope : ""}`,
  ]
  for (const s of allSourcedOn(r)) out.push(s.text)
  for (const f of r.fields) {
    out.push(f.label)
    if (f.note) out.push(f.note.text)
    if (f.unansweredText) out.push(f.unansweredText)
    if (f.options) out.push(...f.options)
  }
  for (const st of r.steps) out.push(st.label)
  if (r.regulationContext) out.push(r.regulationContext.label)
  out.push(...r.unverified)
  return out
}

// ---------------------------------------------------------------------------
// P10 (MVP part): sources are dated by when opened; provenance; unique strings
// ---------------------------------------------------------------------------

describe("P10 (MVP) every source is dated by when it was opened", () => {
  it("each MVP record has >=1 https source opened 2026-10-24", () => {
    for (const r of PROGRAMS) {
      const https = r.sources.filter((s) => s.url.startsWith("https://"))
      expect(https.length).toBeGreaterThanOrEqual(1)
      for (const s of r.sources) {
        expect(s.openedAt).toBe("2026-10-24")
        expect(s).not.toHaveProperty("savedAt")
      }
    }
  })

  it("every sourceId on a record resolves to a source on that same record", () => {
    for (const r of PROGRAMS) {
      const ids = new Set(r.sources.map((s) => s.id))
      for (const s of allSourcedOn(r)) {
        expect(ids.has(s.sourceId)).toBe(true)
        // and it must be a real source in the global table
        expect(SOURCES[s.sourceId]).toBeDefined()
      }
    }
  })

  it("every quote is verbatim; cpapSentence is verbatim", () => {
    for (const r of PROGRAMS) {
      for (const q of r.quotes) expect(q.verbatim).toBe(true)
      if (r.cpapSentence) expect(r.cpapSentence.verbatim).toBe(true)
    }
  })

  it("National Grid quotes are copied character for character", () => {
    expect(ng.quotes[0].text).toBe(
      "Outage Life Support provides phone notification to households where life sustaining equipment is in use so that Life Support Customers can make all necessary arrangements to plan for possible disruption to their electric service during an extended planned or unplanned electric outage.",
    )
    expect(ng.quotes).toHaveLength(1)
    // QA Q4: the non-termination and no-priority paragraphs live in limits (still verbatim).
    expect(ng.limits.every((l) => l.verbatim)).toBe(true)
    expect(ng.limits[0].text).toBe(
      "It is important to understand that participation in the Life Support Program does not protect your account from termination of service for non-payment of arrears. We encourage you to pay any arrears on your account as soon as possible. If you require protection from termination on your account due to the presence of a serious or chronic illness in the household, please apply separately with our Customer Protections Form.",
    )
    expect(ng.limits[1].text).toBe(
      "Also note- Outage Life Support does not sign your account up for a higher priority for restoration if there is an outage.",
    )
    expect(ng.cpapSentence?.text).toBe(
      "The Following are generally not considered life-sustaining: oxygen PRN, sleep apnea machines for patients over 6 months of age (CPAP, BiPAP, APAP, VPAP), nebulizer, ICD, AED, pacemaker, spinal cord stimulator, life alert, air conditioning, refrigerated medication, electric bed, electric air mattress, electric lift, electric wheelchair/lift. A doctor can certify you require electric or gas service due to one of these by submitting our Medical Protection application.",
    )
  })

  it("the cpapSentence is held separately, not inside quotes", () => {
    for (const r of PROGRAMS) {
      for (const q of r.quotes) {
        expect(q.text).not.toContain("generally not considered life-sustaining")
      }
    }
  })

  it("603-227-4784 appears only on Unitil records (both uses of MALFORM-MA)", () => {
    for (const r of PROGRAMS) {
      const hit = allStringsOn(r).some((s) => s.includes("603-227-4784"))
      expect(hit).toBe(r.id.startsWith("unitil-"))
    }
  })

  it("no `new Date(` or `Date.now(` in src/rules/ files", () => {
    for (const file of ["sources.ts", "programs.ts"]) {
      const text = readFileSync(resolve(RULES_DIR, file), "utf8")
      expect(text).not.toMatch(/new Date\(/)
      expect(text).not.toMatch(/Date\.now\(/)
    }
  })
})

// ---------------------------------------------------------------------------
// P7 (MVP part): renewal belongs to its record
// ---------------------------------------------------------------------------

describe("P7 (MVP) renewal belongs to its record", () => {
  it("renewal kind none-stated <=> text === NO_INTERVAL for both MVP records", () => {
    for (const r of PROGRAMS) {
      const isNoneStated = r.renewal.kind === "none-stated"
      const isNoIntervalText = r.renewal.text === NO_INTERVAL
      expect(isNoneStated).toBe(isNoIntervalText)
    }
    // both MVP records are none-stated
    expect(unitil.renewal.kind).toBe("none-stated")
    expect(ng.renewal.kind).toBe("none-stated")
  })

  it("unitil renewal renders to the expected line", () => {
    const rendered = `${unitil.renewalLabel}: ${unitil.renewal.text} ${unitil.renewal.scope}`
    expect(rendered).toBe(
      "Outage-list renewal: No interval stated in the opened sources",
    )
  })

  it("the 220 CMR text lives in regulationContext only, never in the renewal", () => {
    expect(unitil.regulationContext?.text).toContain(
      "serious illness renewed quarterly; chronic every six months",
    )
    expect(unitil.renewal.text).not.toContain("quarterly")
    expect(unitil.renewal.text).not.toContain("six months")
    expect(unitil.renewal.text).toBe(NO_INTERVAL)
  })
})

// ---------------------------------------------------------------------------
// P8: Unitil's 3/6/12 box and regulation never become an outage-list term
// ---------------------------------------------------------------------------

describe("P8 Unitil box and regulation never read as a protection term", () => {
  const PROTECTION_TERM = /protected for (3|6|12) months|12[- ]month protection/i

  it("no string on the Unitil record matches the protection-term ban", () => {
    for (const s of allStringsOn(unitil)) {
      expect(s).not.toMatch(PROTECTION_TERM)
    }
  })

  it("formBoxNote reads as the clinician's anticipated length, not a protection period", () => {
    expect(unitil.formBoxNote?.text).toContain(
      "clinician's anticipated length of the condition, not a protection period",
    )
  })

  it("no Unitil field relates to a 3/6/12 coordinator entry", () => {
    for (const f of unitil.fields) {
      expect(f.label).not.toMatch(/3\s*\/\s*6\s*\/\s*12|anticipated length|3, 6 or 12/i)
      if (f.options) {
        for (const o of f.options) {
          expect(o).not.toMatch(/3 months|6 months|12 months/i)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// P21: structure + isAnswered
// ---------------------------------------------------------------------------

describe("P21 structure + isAnswered", () => {
  it("each record has exactly one send and one utility-wait step, wait last", () => {
    for (const r of PROGRAMS) {
      const sends = r.steps.filter((s) => s.kind === "send")
      const waits = r.steps.filter((s) => s.kind === "utility-wait")
      expect(sends.length).toBe(1)
      expect(waits.length).toBe(1)
      expect(r.steps[r.steps.length - 1].kind).toBe("utility-wait")
    }
  })

  it("every field step has >=1 required field", () => {
    for (const r of PROGRAMS) {
      const byKey = new Map(r.fields.map((f) => [f.key, f]))
      for (const step of r.steps) {
        if (step.kind !== "field") continue
        const hasRequired = step.fields.some((k) => byKey.get(k)?.required === true)
        expect(hasRequired).toBe(true)
      }
    }
  })

  it("the utility-wait step label matches the typed template", () => {
    for (const r of PROGRAMS) {
      const wait = r.steps.find((s) => s.kind === "utility-wait")!
      expect(wait.label.startsWith("Waiting for ")).toBe(true)
      expect(wait.label.endsWith(" to confirm")).toBe(true)
      expect(wait.owner).toBe("utility")
    }
  })

  const yesNoField: Field = {
    key: "unitil-lifesupport.equipment-used",
    label: "x",
    kind: "yes-no",
    options: ["Yes", "No"],
    required: true,
  }
  const textField: Field = {
    key: "unitil-lifesupport.customer-name",
    label: "x",
    kind: "text",
    required: true,
  }
  const consentField: Field = {
    key: "unitil-lifesupport.intent-to-file",
    label: "x",
    kind: "consent",
    required: false,
  }

  it("yes-no: any chosen option incl. 'No' is answered; null/'' not", () => {
    fc.assert(
      fc.property(fc.constantFrom("Yes", "No"), (opt) => {
        expect(isAnswered(yesNoField, opt)).toBe(true)
      }),
    )
    expect(isAnswered(yesNoField, null)).toBe(false)
    expect(isAnswered(yesNoField, "")).toBe(false)
    expect(isAnswered(yesNoField, undefined)).toBe(false)
  })

  it("consent: answered only when exactly true", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.string(),
        ),
        (v) => {
          expect(isAnswered(consentField, v)).toBe(v === true)
        },
      ),
    )
  })

  it("text: whitespace-only is not answered; non-empty after trim is", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(isAnswered(textField, s)).toBe(s.trim().length > 0)
      }),
    )
    expect(isAnswered(textField, "   ")).toBe(false)
    expect(isAnswered(textField, null)).toBe(false)
  })

  it("age-months: finite number >= 0 answered; negatives/NaN/null not", () => {
    const ageField: Field = {
      key: "ng-outage.age-months",
      label: "x",
      kind: "age-months",
      required: false,
    }
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1440 }), (n) => {
        expect(isAnswered(ageField, n)).toBe(true)
      }),
    )
    expect(isAnswered(ageField, -1)).toBe(false)
    expect(isAnswered(ageField, Number.NaN)).toBe(false)
    expect(isAnswered(ageField, null)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Extra required checks: claims, ENABLED_TIERS, recordsFor, PURPOSE_TEXT
// ---------------------------------------------------------------------------

describe("claims, tiers, selectors", () => {
  it("claims.restorationPriority is false on all records", () => {
    for (const r of PROGRAMS) {
      expect(r.claims.restorationPriority).toBe(false)
    }
  })

  it("MVP outage-notify records do not claim shutoff protection", () => {
    for (const r of PROGRAMS) {
      if (r.purpose === "outage-notify") {
        expect(r.claims.shutoffProtection).toBe(false)
      }
    }
  })

  it("ENABLED_TIERS is the tier-1 build switch ['mvp','tier1']", () => {
    expect(ENABLED_TIERS).toEqual(["mvp", "tier1"])
  })

  it("recordsFor(Unitil, ['mvp']) is [unitil-lifesupport]", () => {
    expect(recordsFor(UNITIL_CODE, ["mvp"]).map((r) => r.id)).toEqual([
      "unitil-lifesupport",
    ])
  })

  it("recordsFor(National Grid, ['mvp']) is [ng-outage]", () => {
    expect(recordsFor(NG_CODE, ["mvp"]).map((r) => r.id)).toEqual(["ng-outage"])
  })

  it("recordsFor(Eversource, ['mvp']) is []", () => {
    expect(recordsFor(EVERSOURCE_CODE, ["mvp"])).toEqual([])
  })

  it("recordById resolves and misses correctly", () => {
    expect(recordById("unitil-lifesupport")?.id).toBe("unitil-lifesupport")
    expect(recordById("ng-outage")?.id).toBe("ng-outage")
    expect(recordById("ng-paper")).toBeUndefined()
  })

  it("PURPOSE_TEXT maps each purpose", () => {
    expect(PURPOSE_TEXT["outage-notify"]).toBe("Outage notification")
    expect(PURPOSE_TEXT["shutoff-protection"]).toBe(
      "Shutoff protection (financial hardship + clinician certificate)",
    )
    expect(PURPOSE_TEXT.UNVERIFIED).toBe(
      "Purpose not stated on the opened page — UNVERIFIED",
    )
  })

  it("HOLYOKE_CODE is the Holyoke company code", () => {
    expect(HOLYOKE_CODE).toBe("Holyoke Gas & Electric Department")
  })
})



