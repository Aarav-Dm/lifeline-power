// Read-only queries over public/data. Does not decide eligibility or set a language.

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseCsv } from "./csv.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

export const HOLYOKE_CODE = "Holyoke Gas & Electric Department"
export const NO_FORM_OPENED = "No form opened. No checklist."
export const NO_FORM_LOADED = "No form loaded for this company in this build. No checklist."
export const EJ_LABEL = "unweighted mean across EJ block groups — not a town-wide rate"

const SOURCES = {
  "unitil-pdf": {
    title: "Unitil Massachusetts Medical Alert form (MALFORM-MA.pdf)",
    url: "https://unitil.com/sites/default/files/2021-08/MALFORM-MA.pdf",
  },
  "unitil-page": {
    title: "Unitil Life Support Customers page",
    url: "https://unitil.com/outages-emergencies/life-support-customers",
  },
  "cmr-25-03": {
    title: "220 CMR 25.03 (Cornell mirror)",
    url: "https://www.law.cornell.edu/regulations/massachusetts/220-CMR-25-03",
  },
  "ng-live": {
    title: "National Grid MA Electric Outage Life Support Form",
    url: "https://www.nationalgridus.com/Form/MA-Electric-Outage-Life-Support-Form",
  },
  "ng-protect": {
    title: "National Grid MA special protections",
    url: "https://www.nationalgrid.com/us/ma/electric/home/billing-payments/bill-help/special-protections",
  },
  "ev-bedford": {
    title: "Eversource Eastern MA life-support letter (Bedford copy)",
    url: "https://bedfordma.gov/DocumentCenter/View/5556/EMA-Life-Support-Equipment-Certification-5-2023",
  },
  "ev-illness-pdf": {
    title: "Eversource Medical Certification of Illness (Spanish/English PDF)",
    url: "https://www.eversource.com/docs/default-source/spanish/medical-certification-of-illness-form-egma-span.pdf?sfvrsn=46e9f0a5_1",
  },
  "mgl-164-124a": {
    title: "M.G.L. c.164 §124A",
    url: "https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXXII/Chapter164/Section124a",
  },
  wmlp: {
    title: "Wellesley WMLP Critical Health Need for Electricity form",
    url: "https://www.wellesleyma.gov/FormCenter/Municipal-Light-Plant-5/Critical-Health-Need-for-Electricity-118",
  },
}

// Copied from src/rules/programs.ts. ng-paper is intentionally absent.
const RECORDS = [
  {
    id: "unitil-lifesupport",
    companyCode: "Unitil (Fitchburg Gas & Electric)",
    programName: "Massachusetts Medical Alert / Life Support",
    purpose: "outage-notify",
    sourceIds: ["unitil-pdf", "unitil-page", "cmr-25-03"],
  },
  {
    id: "unitil-protection",
    companyCode: "Unitil (Fitchburg Gas & Electric)",
    programName: "Massachusetts physician certificate — account protection",
    purpose: "shutoff-protection",
    sourceIds: ["unitil-pdf", "unitil-page", "cmr-25-03"],
  },
  {
    id: "ng-outage",
    companyCode: "National Grid (Massachusetts Electric)",
    programName: "Outage Life Support",
    purpose: "outage-notify",
    sourceIds: ["ng-live", "ng-protect"],
  },
  {
    id: "ng-medical",
    companyCode: "National Grid (Massachusetts Electric)",
    programName: "Medical Protection (Customer Protections)",
    purpose: "shutoff-protection",
    sourceIds: ["ng-protect"],
  },
  {
    id: "ev-letter",
    companyCode: "Eversource Energy (NSTAR Electric)",
    programName: "Eastern MA Life Support Equipment Certification",
    purpose: "outage-notify",
    sourceIds: ["ev-bedford"],
  },
  {
    id: "ev-illness",
    companyCode: "Eversource Energy (NSTAR Electric)",
    programName: "Medical Certification of Illness",
    purpose: "shutoff-protection",
    sourceIds: ["ev-illness-pdf", "mgl-164-124a"],
  },
  {
    id: "wmlp-chn",
    companyCode: "Wellesley Municipal Light Plant",
    programName: "Critical Health Need for Electricity",
    purpose: "outage-notify",
    sourceIds: ["wmlp"],
  },
]

function norm(s) {
  return String(s).trim().replace(/\s+/g, " ").toUpperCase()
}

function loadCsv(rel) {
  const text = readFileSync(join(root, rel), "utf8")
  return parseCsv(text)
}

let cache
function kits() {
  if (cache) return cache
  const utilities = loadCsv("public/data/utilities/data.csv")
  const ej = loadCsv("public/data/ej/data.csv")
  cache = { utilities, ej }
  return cache
}

export function townCompany(town) {
  const { utilities } = kits()
  const key = norm(town)
  const row = utilities.rows.find((r) => norm(r[0] ?? "") === key)
  if (!row) return { found: false, town: String(town), note: "No row for that town." }
  const utilityCode = row[1] ?? ""
  return {
    found: true,
    town: row[0],
    utility_code: utilityCode,
    companies: utilityCode.split(", ").filter((s) => s.length > 0),
  }
}

export function ejMean(town) {
  const { ej } = kits()
  const key = norm(town)
  let n = 0
  let sum = 0
  let count = 0
  for (const r of ej.rows) {
    if ((r[5] ?? "") !== "Yes") continue
    if (norm(r[0] ?? "") !== key) continue
    n += 1
    const cell = r[3]
    if (cell !== null && cell !== "") {
      sum += Number(cell)
      count += 1
    }
  }
  if (n === 0) {
    return { found: false, town: String(town), note: "not reported", setsLanguage: false }
  }
  if (count === 0) {
    return { found: false, town: String(town), n, note: "not reported", setsLanguage: false }
  }
  return {
    found: true,
    town: String(town),
    n,
    meanPct: Math.round((sum / count) * 100) / 100,
    label: EJ_LABEL,
    setsLanguage: false,
  }
}

function withSources(record) {
  return {
    id: record.id,
    programName: record.programName,
    purpose: record.purpose,
    sources: record.sourceIds.map((id) => ({ id, ...SOURCES[id] })),
  }
}

export function programSources(companyCode) {
  const code = String(companyCode).trim()
  const records = RECORDS.filter((r) => r.companyCode === code).map(withSources)
  if (records.length > 0) {
    return { found: true, companyCode: code, records }
  }
  if (code === HOLYOKE_CODE) {
    return { found: false, companyCode: code, records: [], sentence: NO_FORM_OPENED }
  }
  return { found: false, companyCode: code, records: [], sentence: NO_FORM_LOADED }
}

export function toolNames() {
  return ["town_company", "ej_mean", "program_sources"]
}
