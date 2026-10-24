import { useMemo } from "react"
import { ExternalLink } from "lucide-react"

import { KIT_SOURCES } from "@/lib/kit-sources"
import { ENABLED_TIERS, PROGRAMS } from "@/rules/programs"
import type { ProgramRecord, Source, Tier } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const TIER_LABEL: Record<Tier, string> = { mvp: "MVP", tier1: "Tier 1", tier2: "Tier 2" }

interface SourceRow {
  source: Source
  records: ProgramRecord[]
  unverified: string[]
}

/** One row per unique Source id across the enabled program records, in first-seen order. */
function buildSourceRows(): SourceRow[] {
  const byId = new Map<string, SourceRow>()
  for (const record of PROGRAMS) {
    if (!ENABLED_TIERS.includes(record.tier)) continue
    for (const source of record.sources) {
      const row = byId.get(source.id) ?? { source, records: [], unverified: [] }
      if (!row.records.includes(record)) row.records.push(record)
      for (const item of record.unverified) if (!row.unverified.includes(item)) row.unverified.push(item)
      byId.set(source.id, row)
    }
  }
  return [...byId.values()]
}

function UnverifiedBadge() {
  return <Badge className="shrink-0 bg-warning text-amber ring-1 ring-amber/30">UNVERIFIED</Badge>
}

/** Sources: every source behind a rule on screen, with its link and the day it was opened. */
export function SourcesScreen() {
  const rows = useMemo(buildSourceRows, [])

  return (
    <section aria-labelledby="sources-heading" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 id="sources-heading" className="font-heading text-3xl font-bold tracking-tight">
          Sources
        </h1>
        <p className="max-w-3xl text-[15px] text-muted-foreground">
          Every rule on screen links to the page it came from. Anything that was not confirmed on that page is
          marked UNVERIFIED.
        </p>
      </header>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg font-semibold">Program sources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[56rem]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Used by</TableHead>
                <TableHead className="font-semibold">Link</TableHead>
                <TableHead className="font-semibold">Date opened</TableHead>
                <TableHead className="font-semibold">
                  Unverified items
                  <span className="block text-xs font-normal text-muted-foreground">on the programs using this source</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ source, records, unverified }) => (
                <TableRow key={source.id} className="align-top">
                  <TableCell className="w-56 align-top whitespace-normal">
                    <span className="font-medium">{source.title}</span>
                    {source.note ? (
                      <span className="mt-1 block text-xs text-muted-foreground">{source.note}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="w-48 align-top whitespace-normal">
                    <ul className="flex flex-col gap-1">
                      {records.map((r) => (
                        <li key={r.id}>
                          {r.programName}
                          <span className="block text-xs text-muted-foreground">{r.companyNameOnPage}</span>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="w-72 align-top whitespace-normal">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-start gap-1 rounded-sm py-2 break-all text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span>{source.url}</span>
                      <ExternalLink aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </TableCell>
                  <TableCell className="align-top tabular-nums">
                    <time dateTime={source.openedAt}>{source.openedAt}</time>
                  </TableCell>
                  <TableCell className="align-top whitespace-normal">
                    {unverified.length === 0 ? (
                      <span className="text-muted-foreground">None listed</span>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {unverified.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <UnverifiedBadge />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg font-semibold">Saved data files</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">File</TableHead>
                <TableHead className="font-semibold">Saved</TableHead>
                <TableHead className="font-semibold">Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {KIT_SOURCES.map((kit) => (
                <TableRow key={kit.name}>
                  <TableCell>
                    <span className="font-medium">{kit.name}</span>
                    <span className="block text-xs break-all whitespace-normal text-muted-foreground">{kit.path}</span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <time dateTime={kit.savedAt}>{kit.savedAt}</time>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {TIER_LABEL[kit.tier]}
                      {ENABLED_TIERS.includes(kit.tier) ? (
                        <Badge variant="outline">Loaded</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Not loaded in this build
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
