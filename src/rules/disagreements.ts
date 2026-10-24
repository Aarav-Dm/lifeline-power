// Where an official source disagrees with the state utilities table. The tool follows the
// state table (kit company wins; bans 8 and 12). Data only; Stanley renders it.
//
// Source: Unitil life-support page, towns in its Massachusetts dropdown (FINAL-idea.md:277,
// lifeline-sources.md:51). Opened 2026-10-24. The state table is the saved `utilities` kit.

export const UNITIL_PAGE_URL = "https://unitil.com/outages-emergencies/life-support-customers"
export const STATE_TABLE_URL =
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/ElectricityProviders/MapServer/0/query?where=1%3D1&outFields=TOWN,ELEC,ELEC_LABEL&returnGeometry=false&f=json"

export interface Disagreement {
  /** town as written on Unitil's page */
  town: string
  /** the company the state table names (exact `utility_code`), or null when the town is not in the table */
  stateTableCode: string | null
  pageUrl: typeof UNITIL_PAGE_URL
  stateTableUrl: typeof STATE_TABLE_URL
  openedAt: "2026-10-24"
}

const NATIONAL_GRID = "National Grid (Massachusetts Electric)"

const row = (town: string, stateTableCode: string | null): Disagreement => ({
  town,
  stateTableCode,
  pageUrl: UNITIL_PAGE_URL,
  stateTableUrl: STATE_TABLE_URL,
  openedAt: "2026-10-24",
})

export const UNITIL_DISAGREEMENTS: Disagreement[] = [
  row("Gardner", NATIONAL_GRID),
  row("Leominster", NATIONAL_GRID),
  row("Shirley", NATIONAL_GRID),
  row("Westminster", NATIONAL_GRID),
  row("West Townsend", null),
]

/** The notice for a town Unitil lists but the state table assigns elsewhere. Undefined for any other town. */
export function disagreementNotice(town: string): string | undefined {
  const d = UNITIL_DISAGREEMENTS.find((x) => x.town.toUpperCase() === town.trim().toUpperCase())
  if (!d) return undefined
  return d.stateTableCode
    ? `Unitil's life-support page also lists ${d.town}. The state table assigns it to ${d.stateTableCode}. This tool follows the state table.`
    : `Unitil's life-support page lists ${d.town}. The state table has no town by that name. This tool follows the state table.`
}
