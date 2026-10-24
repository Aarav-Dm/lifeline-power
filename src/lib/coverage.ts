// Coverage and equity ledger: how much of the state table has a loaded program, and which
// single-company towns without one hold the most EJ block groups. Pure, no React.
//
// Counts are of towns, EJ block groups and people living in EJ block groups. They say nothing
// about who uses medical equipment. Mixed-company towns (more than one company in `utility_code`)
// are never counted as covered, so every figure is a lower bound.

import type { ProgramRecord, Tier } from "../types.ts"

export interface CoverageTown {
  /** norm(town) */
  key: string
  town: string // display value as in the kit (uppercase in `utilities`)
  /** the raw `utility_code` cell; a comma-separated cell means a mixed town */
  utilityCode: string
}

export interface CoverageEjRow {
  /** norm(municipality) */
  key: string
  /** block-group population; null when blank (never read as 0) */
  population: number | null
}

export interface NextForm {
  town: string // display value as in the kit (uppercase in `utilities`)
  utilityCode: string
  /** number of EJ block groups in the town (the "n") */
  ejBlockGroups: number
  /** people living in those block groups */
  people: number
}

export interface Coverage {
  towns: number
  townsTotal: number
  ejBlockGroups: number
  ejBlockGroupsTotal: number
  /** percent of all EJ block groups, one decimal */
  ejBlockGroupsPct: number
  people: number
  peopleTotal: number
  peoplePct: number
  /** single-company towns with no loaded program and at least one EJ block group, largest first */
  nextForms: NextForm[]
}

const pct1 = (part: number, whole: number): number => (whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10)

/** Company codes that have at least one program record in the given tiers. */
export function loadedCompanyCodes(tiers: readonly Tier[], programs: readonly ProgramRecord[]): Set<string> {
  return new Set(programs.filter((p) => tiers.includes(p.tier)).map((p) => p.companyCode))
}

/** A single-company town is covered when its one company is loaded. Mixed towns are not counted. */
const isCovered = (t: CoverageTown, loaded: ReadonlySet<string>): boolean => loaded.has(t.utilityCode)
const isMixed = (t: CoverageTown): boolean => t.utilityCode.includes(", ")

export function coverage(
  towns: readonly CoverageTown[],
  ej: readonly CoverageEjRow[],
  loaded: ReadonlySet<string>,
): Coverage {
  const covered = new Set(towns.filter((t) => isCovered(t, loaded)).map((t) => t.key))
  const townByKey = new Map(towns.map((t) => [t.key, t]))

  let bg = 0
  let people = 0
  let peopleTotal = 0
  const perTown = new Map<string, { n: number; people: number }>()
  for (const r of ej) {
    const p = r.population ?? 0 // ponytail: a blank population adds no people; the block group is still counted
    peopleTotal += p
    const cur = perTown.get(r.key) ?? { n: 0, people: 0 }
    cur.n += 1
    cur.people += p
    perTown.set(r.key, cur)
    if (covered.has(r.key)) {
      bg += 1
      people += p
    }
  }

  const nextForms: NextForm[] = []
  for (const [key, v] of perTown) {
    const t = townByKey.get(key)
    if (!t || isMixed(t) || isCovered(t, loaded)) continue
    nextForms.push({ town: t.town, utilityCode: t.utilityCode, ejBlockGroups: v.n, people: v.people })
  }
  nextForms.sort((a, b) => b.ejBlockGroups - a.ejBlockGroups || a.town.localeCompare(b.town))

  return {
    towns: covered.size,
    townsTotal: towns.length,
    ejBlockGroups: bg,
    ejBlockGroupsTotal: ej.length,
    ejBlockGroupsPct: pct1(bg, ej.length),
    people,
    peopleTotal,
    peoplePct: pct1(people, peopleTotal),
    nextForms,
  }
}
