// Sources for LifeLine Power program records. design.md §3 "Sources" table.
// Every openedAt is the literal "2026-10-24" — the day each artifact was opened.
// Never computed from a clock. See P10's static check.

import type { Source } from "../types"

export const SOURCES: Record<string, Source> = {
  "unitil-pdf": {
    id: "unitil-pdf",
    title: "Unitil Massachusetts Medical Alert form (MALFORM-MA.pdf)",
    url: "https://unitil.com/sites/default/files/2021-08/MALFORM-MA.pdf",
    openedAt: "2026-10-24",
  },
  "unitil-page": {
    id: "unitil-page",
    title: "Unitil Life Support Customers page",
    url: "https://unitil.com/outages-emergencies/life-support-customers",
    openedAt: "2026-10-24",
  },
  "cmr-25-03": {
    id: "cmr-25-03",
    title: "220 CMR 25.03 (Cornell mirror)",
    url: "https://www.law.cornell.edu/regulations/massachusetts/220-CMR-25-03",
    openedAt: "2026-10-24",
  },
  "ng-live": {
    id: "ng-live",
    title: "National Grid MA Electric Outage Life Support Form",
    url: "https://www.nationalgridus.com/Form/MA-Electric-Outage-Life-Support-Form",
    openedAt: "2026-10-24",
  },
  "ng-protect": {
    id: "ng-protect",
    title: "National Grid MA special protections",
    url: "https://www.nationalgrid.com/us/ma/electric/home/billing-payments/bill-help/special-protections",
    openedAt: "2026-10-24",
  },
  "ng-paper": {
    id: "ng-paper",
    title: "National Grid paper notice of life-sustaining equipment (CM10226)",
    url: "https://www.nationalgridus.com/media/pdfs/storms-outages/ma-notice-of-life-sustaining-equipment.pdf",
    openedAt: "2026-10-24",
  },
  "ev-bedford": {
    id: "ev-bedford",
    title: "Eversource Eastern MA life-support letter (Bedford copy)",
    url: "https://bedfordma.gov/DocumentCenter/View/5556/EMA-Life-Support-Equipment-Certification-5-2023",
    openedAt: "2026-10-24",
    note: "Bedford copy, May 2023 filename — currency UNVERIFIED",
  },
  "ev-illness-pdf": {
    id: "ev-illness-pdf",
    title: "Eversource Medical Certification of Illness (Spanish/English PDF)",
    url: "https://www.eversource.com/docs/default-source/spanish/medical-certification-of-illness-form-egma-span.pdf?sfvrsn=46e9f0a5_1",
    openedAt: "2026-10-24",
  },
  "mgl-164-124a": {
    id: "mgl-164-124a",
    title: "M.G.L. c.164 §124A",
    url: "https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXXII/Chapter164/Section124a",
    openedAt: "2026-10-24",
  },
  wmlp: {
    id: "wmlp",
    title: "Wellesley WMLP Critical Health Need for Electricity form",
    url: "https://www.wellesleyma.gov/FormCenter/Municipal-Light-Plant-5/Critical-Health-Need-for-Electricity-118",
    openedAt: "2026-10-24",
  },
}
