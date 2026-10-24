/// <reference types="vite/client" />
// The only module that imports the five kit CSVs. `?raw` bundles the text into JS;
// the app never fetches. Importing a string does not parse it (loadKits does that).

import type { KitSource } from "../types.ts"

import utilitiesCsv from "../../public/data/utilities/data.csv?raw"
import ejCsv from "../../public/data/ej/data.csv?raw"
import hospitalsCsv from "../../public/data/hospitals/data.csv?raw"
import cmsHospitalsCsv from "../../public/data/cms-hospitals/data.csv?raw"
import femaCsv from "../../public/data/fema/data.csv?raw"

export const KIT_SOURCES: KitSource[] = [
  { name: "utilities", path: "public/data/utilities/data.csv", savedAt: "2026-10-18", tier: "mvp", text: utilitiesCsv },
  { name: "ej", path: "public/data/ej/data.csv", savedAt: "2026-10-18", tier: "tier1", text: ejCsv },
  { name: "hospitals", path: "public/data/hospitals/data.csv", savedAt: "2026-10-18", tier: "tier2", text: hospitalsCsv },
  {
    name: "cms-hospitals",
    path: "public/data/cms-hospitals/data.csv",
    savedAt: "2026-10-18",
    tier: "tier2",
    text: cmsHospitalsCsv,
  },
  { name: "fema", path: "public/data/fema/data.csv", savedAt: "2026-10-18", tier: "tier2", text: femaCsv },
]
