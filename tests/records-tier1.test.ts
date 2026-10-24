import { describe, expect, it } from "vitest"
import type { ProgramRecord, Sourced, Tier } from "../src/types"
import { NO_INTERVAL } from "../src/types"
import { SOURCES } from "../src/rules/sources"
import {
  ENABLED_TIERS,
  PROGRAMS,
  PURPOSE_TEXT,
  recordById,
  recordsFor,
} from "../src/rules/programs"

const NG_CODE = "National Grid (Massachusetts Electric)"
const EVERSOURCE_CODE = "Eversource Energy (NSTAR Electric)"
const WMLP_CODE = "Wellesley Municipal Light Plant"

const MVP_T1: Tier[] = ["mvp", "tier1"]

const ngMedical = recordById("ng-medical") as ProgramRecord
const evLetter = recordById("ev-letter") as ProgramRecord
const evIllness = recordById("ev-illness") as ProgramRecord
const wmlpChn = recordById("wmlp-chn") as ProgramRecord

/** The four records this stage owns. */
const TIER1_RECORDS: ProgramRecord[] = [ngMedical, evLetter, evIllness, wmlpChn]

/** Every record enabled under ["mvp","tier1"] (MVP + tier-1). */
const ENABLED_RECORDS: ProgramRecord[] = PROGRAMS.filter((r) =>
  MVP_T1.includes(r.tier),
)

/** Every Sourced string carried anywhere on a record, with where it came from. */
function allSourcedOn(r: ProgramRecord): Sourced[] {
  const out: Sourced[] = [r.signer, r.renewal]
  if (r.signerAlso) out.push(r.signerAlso)
  if (r.regulationContext) out.push(r.regulationContext)
  if (r.formBoxNote) out.push(r.formBoxNote)
  if (r.noGuarantee) out.push(r.noGuarantee)
  if (r.cpapSentence) out.push(r.cpapSentence)
  out.push(...r.returnChannels, ...r.quotes, ...r.limits)
  for (const f of r.fields) if (f.note) out.push(f.note)
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
    if (f.unansweredText) out.push(f.unansweredText)
    if (f.options) out.push(...f.options)
  }
  for (const st of r.steps) out.push(st.label)
  if (r.regulationContext) out.push(r.regulationContext.label)
  out.push(...r.unverified)
  return out
}

/** Every return-channel string on a record. */
function returnChannelStrings(r: ProgramRecord): string[] {
  return r.returnChannels.map((c) => c.text)
}

// ---------------------------------------------------------------------------
// P10 (tier-1 part): sources dated by opening; provenance; unique phone/address
// ---------------------------------------------------------------------------

describe("P10 (tier 1) every source is dated by when it was opened", () => {
  it("each tier-1 record has >=1 https source opened 2026-10-24; no savedAt", () => {
    for (const r of TIER1_RECORDS) {
      const https = r.sources.filter((s) => s.url.startsWith("https://"))
      expect(https.length).toBeGreaterThanOrEqual(1)
      for (const s of r.sources) {
        expect(s.openedAt).toBe("2026-10-24")
        expect(s).not.toHaveProperty("savedAt")
      }
    }
  })

  it("every sourceId on an enabled record resolves on that record and in SOURCES", () => {
    for (const r of ENABLED_RECORDS) {
      const ids = new Set(r.sources.map((s) => s.id))
      for (const s of allSourcedOn(r)) {
        expect(ids.has(s.sourceId)).toBe(true)
        expect(SOURCES[s.sourceId]).toBeDefined()
      }
    }
  })

  it("every quote on a tier-1 record is verbatim === true", () => {
    for (const r of TIER1_RECORDS) {
      for (const q of r.quotes) expect(q.verbatim).toBe(true)
    }
  })

  it("Eversource letter quotes are copied character for character", () => {
    expect(evLetter.quotes.map((q) => q.text)).toEqual([
      "Please have your physician certify, in writing, that equipment is being used for life support. The letter must specifically state: That electric powered life-sustaining equipment is being used by you or a member of your household. The type of electric powered equipment being used. The patient's name, address, and a primary and alternate contact number.",
      "The letter must be signed by a medical doctor, on letterhead and mailed to: Eversource, 247 Station Drive SW200. Westwood, MA 02090",
      "When the letter is received, your household will be enrolled in our life support notification program. To maintain this enrollment, certification must be updated annually.",
      "Please note that certification does not prioritize your service for faster restoration in the event of a power outage. We encourage you to have an alternate source of energy in the event of a prolonged electric interruption. This certification has no impact to medical protection already applied to your account.",
    ])
  })

  it("Eversource illness quotes are verbatim incl. the doubled phrase and the statute", () => {
    expect(evIllness.quotes[0].text).toBe(
      "Eversource will provide protection from service shut-off if there is a financial hardship in the home and a Registered Physician, Board of Health official, Advanced Practice Registered Nurse (APRN) or Physician Assistant (PA) certifies the patient listed below is suffering from a serious illness or a chronic serious illness or a chronic serious illness. See M.G.L. Chapter 164 Section 124A.",
    )
    // The doubled phrase is unedited (ban 12): "or a chronic serious illness" twice.
    const doubled =
      evIllness.quotes[0].text.split("or a chronic serious illness").length - 1
    expect(doubled).toBe(2)
    expect(evIllness.quotes[1].text).toBe(
      "Serious Illness – This form must be completed and returned to Eversource every 90 days.",
    )
    expect(evIllness.quotes[2].text).toBe(
      "Serious Chronic Illness – This form must be completed and returned to Eversource every 180 days.",
    )
    expect(evIllness.quotes[3].text).toBe(
      "Does your patient have life support equipment at home?",
    )
    expect(evIllness.quotes[4].text).toBe(
      "Please return the completed form by fax to 413-746-6495 or online at eversource.com/upload.",
    )
  })

  it("the statute sentence is a verbatim quote on ev-illness only, sourced mgl-164-124a", () => {
    const statute =
      "No gas or electric company shall shut off or fail to restore gas or electric service in any residence during such time as there is a serious illness therein; provided, however, that a registered physician or the local board of health certifies in writing to the company that such serious illness exists; and provided, further, that the customer cannot afford to pay any overdue bill because of a financial hardship."
    const onEvIllness = evIllness.quotes.find((q) => q.text === statute)
    expect(onEvIllness).toBeDefined()
    expect(onEvIllness?.verbatim).toBe(true)
    expect(onEvIllness?.sourceId).toBe("mgl-164-124a")
    // signerAlso cites the statute's narrower certifier list.
    expect(evIllness.signerAlso?.sourceId).toBe("mgl-164-124a")
    // Nowhere else.
    for (const r of ENABLED_RECORDS) {
      if (r.id === "ev-illness") continue
      for (const s of allStringsOn(r)) expect(s).not.toBe(statute)
    }
  })

  it("every quoted string appears on exactly one enabled record", () => {
    const seen = new Map<string, string>()
    for (const r of ENABLED_RECORDS) {
      for (const q of r.quotes) {
        const prev = seen.get(q.text)
        expect(prev === undefined || prev === r.id).toBe(true)
        seen.set(q.text, r.id)
      }
    }
  })

  it("noGuarantee only on ev-letter and wmlp-chn; wmlp verbatim:false", () => {
    for (const r of ENABLED_RECORDS) {
      const hasNoGuarantee = r.noGuarantee !== undefined
      expect(hasNoGuarantee).toBe(r.id === "ev-letter" || r.id === "wmlp-chn")
    }
    expect(evLetter.noGuarantee?.verbatim).toBe(true)
    expect(wmlpChn.noGuarantee?.verbatim).toBe(false)
    expect(wmlpChn.noGuarantee?.text).toBe(
      "no utility can guarantee electricity 24 hours a day",
    )
  })

  it("ng-medical email return channel is masked, unverified, and carries no address", () => {
    const email = ngMedical.returnChannels.find((c) => c.kind === "email")
    expect(email).toBeDefined()
    expect(email?.text).toBe("masked on the opened page — UNVERIFIED")
    expect(email?.unverified).toBe(true)
    // No @-address is stored anywhere on the record.
    for (const s of allStringsOn(ngMedical)) {
      expect(s).not.toMatch(/@/)
    }
  })

  it("ev-bedford source note renders and is in ev-letter's unverified list", () => {
    const bedford = evLetter.sources.find((s) => s.id === "ev-bedford")
    expect(bedford?.note).toBe(
      "Bedford copy, May 2023 filename — currency UNVERIFIED",
    )
    expect(evLetter.unverified).toContain(
      "Bedford copy, May 2023 filename — currency UNVERIFIED",
    )
  })

  // Phone / address / fax strings appear only on records whose sources contain them.
  it("603-227-4784 only on unitil (never on a tier-1 record)", () => {
    for (const r of TIER1_RECORDS) {
      for (const s of allStringsOn(r)) expect(s).not.toContain("603-227-4784")
    }
  })

  it("413-746-6495 only on ev-illness", () => {
    for (const r of ENABLED_RECORDS) {
      const hit = allStringsOn(r).some((s) => s.includes("413-746-6495"))
      expect(hit).toBe(r.id === "ev-illness")
    }
  })

  it("1-866-460-8549 only on ng-medical", () => {
    for (const r of ENABLED_RECORDS) {
      const hit = allStringsOn(r).some((s) => s.includes("1-866-460-8549"))
      expect(hit).toBe(r.id === "ng-medical")
    }
  })

  it("Westwood only on ev-letter", () => {
    for (const r of ENABLED_RECORDS) {
      const hit = allStringsOn(r).some((s) => s.includes("Westwood"))
      expect(hit).toBe(r.id === "ev-letter")
    }
  })

  it("Syracuse only on ng-medical", () => {
    for (const r of ENABLED_RECORDS) {
      const hit = allStringsOn(r).some((s) => s.includes("Syracuse"))
      expect(hit).toBe(r.id === "ng-medical")
    }
  })

  it("781-441-3686 never appears as a return channel anywhere", () => {
    for (const r of ENABLED_RECORDS) {
      for (const c of returnChannelStrings(r)) {
        expect(c).not.toContain("781-441-3686")
      }
    }
  })
})

// ---------------------------------------------------------------------------
// P7 (tier-1 part): renewal belongs to its record
// ---------------------------------------------------------------------------

describe("P7 (tier 1) renewal belongs to its record", () => {
  it("none-stated <=> text === NO_INTERVAL on every enabled record", () => {
    for (const r of ENABLED_RECORDS) {
      const isNoneStated = r.renewal.kind === "none-stated"
      const isNoIntervalText = r.renewal.text === NO_INTERVAL
      expect(isNoneStated).toBe(isNoIntervalText)
    }
  })

  it("ng-medical renewal is days-90-180, not NO_INTERVAL", () => {
    expect(ngMedical.renewal.kind).toBe("days-90-180")
    expect(ngMedical.renewal.text).not.toBe(NO_INTERVAL)
  })

  it("the calendar-year text appears on wmlp-chn only", () => {
    const CAL = /calendar year/i
    for (const r of ENABLED_RECORDS) {
      const hit = allStringsOn(r).some((s) => CAL.test(s))
      expect(hit).toBe(r.id === "wmlp-chn")
    }
    expect(wmlpChn.renewal.kind).toBe("calendar-year-or-need")
  })

  it("renewal renders as `${renewalLabel}: ${text}` for each tier-1 record", () => {
    expect(`${wmlpChn.renewalLabel}: ${wmlpChn.renewal.text}`).toBe(
      "Renewal: The rest of this calendar year, or until the need ends, whichever is first; renew with the same form",
    )
    expect(`${ngMedical.renewalLabel}: ${ngMedical.renewal.text}`).toBe(
      "Renewal: Serious illness 90 days; chronic illness 180 days",
    )
    expect(evLetter.renewal.kind).toBe("annual")
  })
})

// ---------------------------------------------------------------------------
// P6 (tier-1 records): purpose claims
// ---------------------------------------------------------------------------

describe("P6 (tier 1) claims by purpose", () => {
  it("outage-notify records set shutoffProtection false", () => {
    for (const r of ENABLED_RECORDS) {
      if (r.purpose === "outage-notify") {
        expect(r.claims.shutoffProtection).toBe(false)
      }
    }
  })

  it("shutoff-protection records set outageNotification false", () => {
    for (const r of ENABLED_RECORDS) {
      if (r.purpose === "shutoff-protection") {
        expect(r.claims.outageNotification).toBe(false)
      }
    }
  })

  it("restorationPriority is false everywhere", () => {
    for (const r of ENABLED_RECORDS) {
      expect(r.claims.restorationPriority).toBe(false)
    }
  })

  it("ng-medical/ev-illness are shutoff-protection; ev-letter/wmlp-chn are outage-notify", () => {
    expect(ngMedical.purpose).toBe("shutoff-protection")
    expect(evIllness.purpose).toBe("shutoff-protection")
    expect(evLetter.purpose).toBe("outage-notify")
    expect(wmlpChn.purpose).toBe("outage-notify")
  })
})

// ---------------------------------------------------------------------------
// P21 (tier-1): step contract — one send, one wait last, field steps required
// ---------------------------------------------------------------------------

describe("P21 (tier 1) step completion contract", () => {
  it("each tier-1 record: exactly one send and one utility-wait step, wait last", () => {
    for (const r of TIER1_RECORDS) {
      const sends = r.steps.filter((s) => s.kind === "send")
      const waits = r.steps.filter((s) => s.kind === "utility-wait")
      expect(sends.length).toBe(1)
      expect(waits.length).toBe(1)
      expect(r.steps[r.steps.length - 1].kind).toBe("utility-wait")
    }
  })

  it("every field step has >=1 required field (requiredWhen counts)", () => {
    for (const r of TIER1_RECORDS) {
      const byKey = new Map(r.fields.map((f) => [f.key, f]))
      for (const step of r.steps) {
        if (step.kind !== "field") continue
        const hasRequired = step.fields.some((k) => {
          const f = byKey.get(k)
          return f?.required === true || f?.requiredWhen !== undefined
        })
        expect(hasRequired).toBe(true)
      }
    }
  })

  it("the utility-wait step label matches the typed template and names the company", () => {
    const expected: Record<string, string> = {
      "ng-medical": "Waiting for National Grid to confirm",
      "ev-letter": "Waiting for Eversource to confirm",
      "ev-illness": "Waiting for Eversource to confirm",
      "wmlp-chn": "Waiting for WMLP to confirm",
    }
    for (const r of TIER1_RECORDS) {
      const wait = r.steps.find((s) => s.kind === "utility-wait")!
      expect(wait.label).toBe(expected[r.id])
      expect(wait.owner).toBe("utility")
    }
  })

  it("clinician document steps are field steps owned by the signer with a consent field", () => {
    const clinicianConsent: Record<string, string> = {
      "ng-medical": "ng-medical.letter-in-hand",
      "ev-letter": "ev-letter.letter-in-hand",
      "ev-illness": "ev-illness.certificate-in-hand",
    }
    for (const id of Object.keys(clinicianConsent)) {
      const r = recordById(id as ProgramRecord["id"]) as ProgramRecord
      const step = r.steps.find(
        (s) => s.kind === "field" && s.owner === "clinician",
      )
      expect(step).toBeDefined()
      if (step && step.kind === "field") {
        expect(step.ownerText).toBe(r.signer.text)
        expect(step.fields).toContain(clinicianConsent[id])
        const consent = r.fields.find((f) => f.key === clinicianConsent[id])
        expect(consent?.kind).toBe("consent")
        expect(consent?.required).toBe(true)
      }
    }
    // wmlp-chn has no clinician step: the customer submits, verification is a limit.
    const wmlpClinician = wmlpChn.steps.find((s) => s.owner === "clinician")
    expect(wmlpClinician).toBeUndefined()
  })

  it("the clinician consent labels read exactly as the contract requires", () => {
    const letterLabel = (id: string, key: string) => {
      const r = recordById(id as ProgramRecord["id"]) as ProgramRecord
      return r.fields.find((f) => f.key === key)?.label
    }
    expect(letterLabel("ng-medical", "ng-medical.letter-in-hand")).toBe(
      "Signed letter is in hand",
    )
    expect(letterLabel("ev-letter", "ev-letter.letter-in-hand")).toBe(
      "Signed letter is in hand",
    )
    expect(
      letterLabel("ev-illness", "ev-illness.certificate-in-hand"),
    ).toBe("Completed certificate is in hand")
  })

  it("ng-medical: hardship-statement is required unless discount rate is 'Yes'", () => {
    const hardship = ngMedical.fields.find(
      (f) => f.key === "ng-medical.hardship-statement",
    )
    expect(hardship?.kind).toBe("consent")
    expect(hardship?.requiredWhen).toEqual({
      key: "ng-medical.discount-rate",
      notEquals: "Yes",
    })
    const discount = ngMedical.fields.find(
      (f) => f.key === "ng-medical.discount-rate",
    )
    expect(discount?.kind).toBe("select")
    expect(discount?.options).toEqual(["Yes", "No", "Not known"])
  })

  it("every field key is namespaced to its own record", () => {
    for (const r of TIER1_RECORDS) {
      for (const f of r.fields) {
        expect(f.key.startsWith(`${r.id}.`)).toBe(true)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// recordsFor / tiers (selectors)
// ---------------------------------------------------------------------------

describe("recordsFor under tier gating", () => {
  it("ENABLED_TIERS is the tier-1 build switch", () => {
    expect(ENABLED_TIERS).toEqual(["mvp", "tier1"])
  })

  it("recordsFor(NG, [mvp,tier1]) = [ng-outage, ng-medical]", () => {
    expect(recordsFor(NG_CODE, MVP_T1).map((r) => r.id)).toEqual([
      "ng-outage",
      "ng-medical",
    ])
  })

  it("recordsFor(Eversource, [mvp,tier1]) = [ev-letter, ev-illness]", () => {
    expect(recordsFor(EVERSOURCE_CODE, MVP_T1).map((r) => r.id)).toEqual([
      "ev-letter",
      "ev-illness",
    ])
  })

  it("recordsFor(WMLP, [mvp,tier1]) = [wmlp-chn]", () => {
    expect(recordsFor(WMLP_CODE, MVP_T1).map((r) => r.id)).toEqual(["wmlp-chn"])
  })

  it("with ['mvp'] only: NG = [ng-outage], Eversource = [], WMLP = [] (MVP unchanged)", () => {
    expect(recordsFor(NG_CODE, ["mvp"]).map((r) => r.id)).toEqual(["ng-outage"])
    expect(recordsFor(EVERSOURCE_CODE, ["mvp"])).toEqual([])
    expect(recordsFor(WMLP_CODE, ["mvp"])).toEqual([])
  })
})

