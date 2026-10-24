# LifeLine Power

A Massachusetts care coordinator types a town, sees that town's electric utility and the form to file for a household that depends on electricity, and prints the unfinished step.

**Track:** Healthcare & Biotech.

**Live URL:** `https://<owner>.github.io/<repo>/` (placeholder until the first GitHub Pages deploy).

## Demo video

`https://youtu.be/<id>` (placeholder). Public, under 3:00, showing the app running. Replace `<id>` after the upload.

## Run

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

`pnpm dev` serves the local app. `pnpm test` runs `vitest run`. `pnpm build` is `tsc -b && vite build` and writes `dist/`. Vite `base` is `./`, so the built site works on GitHub Pages without a guessed repo name.

## Data sources

The app reads the local copies under `public/data/`. It does not fetch these URLs at runtime. Licences are the ones recorded in `research/lifeline-sources.md` when each page was opened.

| Data | Local copy | Source | Licence |
|---|---|---|---|
| Town to utility | `public/data/utilities/data.csv` | [MassGIS Electricity Providers](https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/ElectricityProviders/MapServer/0/query?where=1%3D1&outFields=TOWN,ELEC,ELEC_LABEL&returnGeometry=false&f=json) | MassGIS Open Data / Commonwealth of MA (Public) |
| Environmental justice | `public/data/ej/data.csv` | [MassGIS EJ 2020](https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&outFields=MUNICIPALITY,TOTAL_POP,PCT_MINORITY,LIMENGHHPCT,BG_MHHI,EJ,EJ_CRIT_DESC&returnGeometry=false&resultRecordCount=100&f=json) | MassGIS Open Data / Commonwealth of MA (Public) |
| Hospitals | `public/data/hospitals/data.csv` | [MassGIS Hospitals](https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Hospitals/MapServer/0/query?where=1%3D1&outFields=FACILITY_NAME,FACILITY_TYPE,MUNICIPALITY,COUNTY,ICU,MED_SURG,PEDIATRIC&returnGeometry=false&resultRecordCount=200&f=json) | MassGIS Open Data / Commonwealth of MA (Public) |
| CMS hospitals | `public/data/cms-hospitals/data.csv` | [CMS Hospital General Information](https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0?limit=100&conditions[0][property]=state&conditions[0][value]=MA&conditions[0][operator]==) | CMS / Healthdata.gov Public Domain (U.S. Govt) |
| FEMA declarations | `public/data/fema/data.csv` | [OpenFEMA Disaster Declarations](https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state%20eq%20%27MA%27&$top=100&$select=disasterNumber,declarationTitle,declarationDate,incidentType,designatedArea,declarationType&$orderby=declarationDate%20desc) | OpenFEMA / DHS Public Domain (U.S. Govt) |
| National Grid outage form | program record | [MA Electric Outage Life Support Form](https://www.nationalgridus.com/Form/MA-Electric-Outage-Life-Support-Form) | National Grid public web form |
| Unitil life-support page and PDF | program record | [Life support customers](https://unitil.com/outages-emergencies/life-support-customers), [MALFORM-MA.pdf](https://unitil.com/sites/default/files/2021-08/MALFORM-MA.pdf) | Unitil public page and PDF |
| Shutoff rule | shown beside the Unitil card | [220 CMR 25.03](https://www.law.cornell.edu/regulations/massachusetts/220-CMR-25-03), [M.G.L. c.164 §124A](https://malegislature.gov/Laws/GeneralLaws/PartI/TitleXXII/Chapter164/Section124a) | Legal public domain |

HHS emPOWER (45,895 MA Medicare beneficiaries with electricity-dependent equipment) is a pitch-only source in `research/lifeline-sources.md`, not loaded by the app.

Other opened forms (Eversource, Wellesley, National Grid medical and paper notice) are listed with their URLs in `research/lifeline-sources.md`. Open-source libraries come from `pnpm-lock.yaml` and stay under each package's own licence.

## Kiro

Specs, steering, hooks, and skills are in `.kiro/`. The write-up log is [`docs/kiro-notes.md`](docs/kiro-notes.md). Claim only what that log records.

## Local kit MCP

`mcp/server.mjs` is a local read-only server over the committed kits. It does not use the network and it does not write. Kiro loads it from `.kiro/settings/mcp.json` as `lifeline-kits`.

- `town_company` returns `utility_code` and the company names for one town, split on `, `.
- `ej_mean` returns the unweighted limited-English mean and n for that town's EJ block groups. It does not set a language.
- `program_sources` returns the opened source title and URL for one company code. Records stay separate.

From this directory, this listed those three tools:

```
kiro-cli chat --no-interactive --trust-workspace --require-mcp-startup --trust-tools= "Reply with only the names of the lifeline-kits MCP tools, one per line. Do not call any tool. Do not edit files."
```

In an interactive session, `/mcp` shows the same server. `node mcp/self-check.mjs` checks the tools. It is not part of `pnpm test`.

`.kiro/steering/programs.md` is fileMatch steering. It loads only when `src/rules/programs.ts` or `src/rules/sources.ts` is in play.

## Synthetic demo data

Dana Okonkwo, James Pell, and Robert Pell are synthetic. Robert uses an oxygen concentrator in Fitchburg, and the bill says Unitil. There is no real account number.

## Roadmap

1. **Multilingual Handoff:** Parallel Spanish-mirrored routing slips (`src/i18n/handoff-es.ts`) for limited-English households.
2. **Municipal Expansion:** Verify and load the remaining 40 Massachusetts municipal utilities without guessing.
3. **Interstate Scaling:** Expand across New England (e.g. Unitil NH footprint) while isolating NH PUC 1203.11 from MA 220 CMR 25.03.
4. **Clinician Portal:** Generate secure, pre-filled verification links for physicians to sign within the 7-day window.
5. **Form-Drafting Agent:** Pre-fills the company form from checklist answers for coordinator review, patient consent, and clinician signature.
   People still sign and send, and only the utility confirms (not built tonight).
