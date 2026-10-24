// Landing / About content. Sourced facts live here, not in components (R13.3).
// HHS emPOWER figure: pitch / About panel only, never in program logic (PRD §1).
// Source: research/lifeline-sources.md §4 (HHS emPOWER state layer, FeatureServer/3,
// lastEditDate 2026-10-07), checked live by god on 24 Oct 2026.

export const ABOUT = {
  problem: [
    "Massachusetts electric companies publish how to register someone who depends on powered medical equipment, but each company runs its own programs with its own forms and renewal rules.",
    "The failure is filling the wrong company's form, or reading one company's renewal rule onto another company's form.",
  ],
  hhs: {
    figure: "45,895",
    text: "Massachusetts Medicare beneficiaries rely on electricity-dependent medical equipment, out of 1,520,183 Medicare beneficiaries in the state.",
    caveat: "Medicare beneficiaries only; people with other insurance are not counted.",
    sourceTitle: "HHS emPOWER program, state layer (edited 2026-10-07)",
    sourceUrl: "https://empowerprogram.hhs.gov/about-empowermap.html",
  },
  data: [
    { title: "MassGIS electric utility by town (351 towns, saved 2026-10-18)", url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/ElectricityProviders/MapServer/0" },
    { title: "MassGIS environmental-justice block groups (saved 2026-10-18)", url: "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0" },
  ],
  limits: [
    "Does not submit anything to a utility.",
    "Does not confirm enrollment; only the utility can.",
    "Not medical, legal or eligibility advice.",
    "Demo household data is synthetic.",
  ],
} as const
