// Kit validation, tier-gated loading, and the town -> company selectors.
// Pure, no React. Reads the real kits through kit-sources.ts.

import type {
  EjRow,
  EjView,
  KitCheckFailure,
  KitDisabled,
  KitName,
  KitSource,
  LoadedKits,
  Tier,
  UtilityRow,
} from "../types.ts"
import { parseCsv } from "./csv.ts"
import { KIT_SOURCES } from "./kit-sources.ts"

export function norm(s: string): string {
  return String(s).trim().replace(/\s+/g, " ").toUpperCase()
}

// Exact header + row count per design.md §2. The failure `file` is the committed kit path.
const KIT_SPEC: Record<KitName, { header: string[]; rows: number; file: `public/data/${string}/data.csv` }> = {
  utilities: {
    header: ["town", "utility_code", "utility"],
    rows: 351,
    file: "public/data/utilities/data.csv",
  },
  ej: {
    header: ["municipality", "population", "minority_pct", "limited_english_hh_pct", "block_group_income", "ej", "criteria"],
    rows: 2604,
    file: "public/data/ej/data.csv",
  },
  hospitals: {
    header: ["name", "facility_type", "municipality", "county", "icu_beds", "med_surg_beds", "pediatric_beds"],
    rows: 103,
    file: "public/data/hospitals/data.csv",
  },
  "cms-hospitals": {
    header: ["facility_id", "facility_name", "city", "county", "hospital_type", "ownership", "emergency", "overall_rating"],
    rows: 84,
    file: "public/data/cms-hospitals/data.csv",
  },
  fema: {
    header: ["declarationDate", "disasterNumber", "incidentType", "declarationTitle", "designatedArea", "declarationType"],
    rows: 415,
    file: "public/data/fema/data.csv",
  },
}

export function validateKit(
  name: KitName,
  text: string,
): { ok: true; header: string[]; rows: (string | null)[][] } | KitCheckFailure {
  const spec = KIT_SPEC[name]
  const { header, rows } = parseCsv(text)

  const expectedHeader = spec.header
  if (header.length !== expectedHeader.length || header.some((h, i) => h !== expectedHeader[i])) {
    return {
      ok: false,
      file: spec.file,
      check: `header must be "${expectedHeader.join(",")}" but was "${header.join(",")}"`,
    }
  }

  if (rows.length !== spec.rows) {
    return {
      ok: false,
      file: spec.file,
      check: `expected ${spec.rows} rows but found ${rows.length}`,
    }
  }

  return { ok: true, header, rows }
}

// Fallback tier for a stretch kit missing from the provided source list (matches KitSource defaults).
const KIT_SPEC_TIER: Record<KitName, Tier> = {
  utilities: "mvp",
  ej: "tier1",
  hospitals: "tier2",
  "cms-hospitals": "tier2",
  fema: "tier2",
}

function toUtilityRows(rows: (string | null)[][]): UtilityRow[] {
  return rows.map((r) => {
    const town = r[0] ?? ""
    const utilityCode = r[1] ?? ""
    const utility = r[2] ?? ""
    return { town, key: norm(town), utilityCode, utility }
  })
}

// ej header: municipality,population,minority_pct,limited_english_hh_pct,block_group_income,ej,criteria
// A blank (null) limited_english_hh_pct stays null — never 0 (ban 12). A literal "0" cell parses to 0.
function toEjRows(rows: (string | null)[][]): EjRow[] {
  return rows.map((r) => {
    const municipality = r[0] ?? ""
    const leCell = r[3]
    const limitedEnglishHhPct = leCell === null || leCell === "" ? null : Number(leCell)
    return { municipality, key: norm(municipality), limitedEnglishHhPct, ej: r[5] }
  })
}

export function loadKits(enabledTiers: Tier[], sources: KitSource[] = KIT_SOURCES): LoadedKits {
  const byName = new Map<KitName, KitSource>()
  for (const s of sources) byName.set(s.name, s)

  const tierEnabled = (t: Tier) => enabledTiers.includes(t)

  // --- utilities: always parsed; failure is fatal and leaves utilities empty. ---
  const kits: LoadedKits = {
    utilities: [],
    ej: { ok: false, reason: "tier-disabled" },
    hospitals: { ok: false, reason: "tier-disabled" },
    "cms-hospitals": { ok: false, reason: "tier-disabled" },
    fema: { ok: false, reason: "tier-disabled" },
  }

  const utilitiesSource = byName.get("utilities")
  const utilitiesText = utilitiesSource ? utilitiesSource.text : ""
  const utilitiesCheck = validateKit("utilities", utilitiesText)
  if (!utilitiesCheck.ok) {
    kits.fatal = { file: utilitiesCheck.file, check: utilitiesCheck.check }
    kits.utilities = []
  } else {
    kits.utilities = toUtilityRows(utilitiesCheck.rows)
  }

  // --- stretch kits: parsed only when their tier is enabled; otherwise never parsed. ---
  type StretchName = "ej" | "hospitals" | "cms-hospitals" | "fema"
  type StretchValue = KitDisabled | KitCheckFailure | { ok: true; rows: (string | null)[][] }

  const resolveStretch = (name: StretchName): StretchValue => {
    const source = byName.get(name)
    const tier = source?.tier ?? KIT_SPEC_TIER[name]
    if (!tierEnabled(tier)) {
      // Disabled tier: never parse, never validate.
      return { ok: false, reason: "tier-disabled" }
    }
    const check = validateKit(name, source ? source.text : "")
    if (!check.ok) return { ok: false, file: check.file, check: check.check }
    return { ok: true, rows: check.rows }
  }

  // ej maps raw rows to EjRow so a blank limited_english_hh_pct is null (never 0); other
  // stretch kits keep their raw rows until their own tasks type them.
  const ejResolved = resolveStretch("ej")
  kits.ej = ejResolved.ok ? { ok: true, rows: toEjRows(ejResolved.rows) } : ejResolved
  kits.hospitals = resolveStretch("hospitals")
  kits["cms-hospitals"] = resolveStretch("cms-hospitals")
  kits.fema = resolveStretch("fema")

  return kits
}

// ---------- Town -> company selectors ----------

/** The UtilityRow whose key === the given norm(town) key, or undefined. */
export function townRow(kits: LoadedKits, key: string): UtilityRow | undefined {
  return kits.utilities.find((r) => r.key === key)
}

/** Company codes from utility_code, split on ", " only. Never reads the `utility` column. */
export function companyCodes(row: UtilityRow): string[] {
  return row.utilityCode.split(", ")
}

/** All 351 town keys in file order. */
export function townKeys(kits: LoadedKits): string[] {
  return kits.utilities.map((r) => r.key)
}

/** Exact normalized match only — never a loosened or partial match. */
export function matchTown(kits: LoadedKits, typed: string): UtilityRow | undefined {
  return townRow(kits, norm(typed))
}

// ---------- EJ (tier 1) ----------

/**
 * Unweighted mean of non-null `limitedEnglishHhPct` over ej "Yes" rows whose key === townKey,
 * with n = count of those rows. Returns undefined when the ej kit did not load. A missing value
 * is excluded from the mean (ban 9, 12): the mean is a block-group mean, never a town-wide rate.
 */
const ejCache = new WeakMap<EjRow[], Map<string, EjView>>()

function ejIndex(rows: EjRow[]): Map<string, EjView> {
  const hit = ejCache.get(rows)
  if (hit) return hit
  const acc = new Map<string, { sum: number; count: number; n: number }>()
  for (const r of rows) {
    if (r.ej !== "Yes") continue
    const a = acc.get(r.key) ?? { sum: 0, count: 0, n: 0 }
    a.n += 1
    if (r.limitedEnglishHhPct !== null) {
      a.sum += r.limitedEnglishHhPct
      a.count += 1
    }
    acc.set(r.key, a)
  }
  const out = new Map<string, EjView>()
  for (const [key, a] of acc) {
    out.set(
      key,
      a.count === 0
        ? { kind: "none", label: "No EJ block groups" }
        : { kind: "mean", meanPct: a.sum / a.count, n: a.n, label: "unweighted mean across EJ block groups — not a town-wide rate" },
    )
  }
  ejCache.set(rows, out)
  return out
}

export function ejStats(kits: LoadedKits, townKey: string): EjView | undefined {
  const ej = kits.ej
  if (!ej.ok) return undefined
  return ejIndex(ej.rows).get(townKey) ?? { kind: "none", label: "No EJ block groups" }
}

/**
 * Utility rows in display order for the town list. "az" is file order. "ej" is EJ mean descending;
 * towns with no mean (kind "none", or the ej kit not loaded) sort after every town with a mean,
 * ties broken A–Z by key.
 */
export function sortTowns(kits: LoadedKits, mode: "az" | "ej"): UtilityRow[] {
  const rows = kits.utilities
  if (mode === "az") return rows.slice()

  const meanOf = (row: UtilityRow): number | null => {
    const view = ejStats(kits, row.key)
    return view && view.kind === "mean" ? view.meanPct : null
  }

  return rows
    .map((row, index) => ({ row, index, mean: meanOf(row) }))
    .sort((a, b) => {
      if (a.mean !== null && b.mean !== null) {
        if (a.mean !== b.mean) return b.mean - a.mean
        return a.row.key < b.row.key ? -1 : a.row.key > b.row.key ? 1 : a.index - b.index
      }
      if (a.mean !== null) return -1
      if (b.mean !== null) return 1
      // Both have no mean: A–Z by key (stable on the file index for equal keys).
      return a.row.key < b.row.key ? -1 : a.row.key > b.row.key ? 1 : a.index - b.index
    })
    .map((e) => e.row)
}
