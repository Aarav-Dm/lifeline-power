// Feeds Oscar's coverage ledger (src/lib/coverage.ts) from the loaded kits.
// EjRow has no population, so CoverageEjRow is built from the raw ej CSV, as coverage.test.ts does.
// Only runs when the ej kit loaded (tier 1); otherwise there is nothing honest to show.

import type { LoadedKits, Tier } from "../types"
import { PROGRAMS } from "../rules/programs"
import { coverage, loadedCompanyCodes, type Coverage, type CoverageEjRow, type CoverageTown } from "./coverage"
import { parseCsv } from "./csv"
import { KIT_SOURCES } from "./kit-sources"
import { norm } from "./kits"

export function aboutCoverage(kits: LoadedKits, tiers: Tier[]): Coverage | undefined {
  if (!kits.ej.ok || kits.utilities.length === 0) return undefined
  const towns: CoverageTown[] = kits.utilities.map((r) => ({ key: r.key, town: r.town, utilityCode: r.utilityCode }))
  const ejText = KIT_SOURCES.find((s) => s.name === "ej")?.text ?? ""
  const ej: CoverageEjRow[] = parseCsv(ejText).rows.map((r) => ({
    key: norm(r[0] ?? ""),
    population: r[1] === null || r[1] === "" ? null : Number(r[1]),
  }))
  return coverage(towns, ej, loadedCompanyCodes(tiers, PROGRAMS))
}
