import { useMemo, useState } from "react"
import { ArrowDownWideNarrow, ArrowUpDown, ArrowUpNarrowWide, ChevronLeft, ChevronRight } from "lucide-react"

import type { Coverage } from "@/lib/coverage"
import { companyCodes, ejStats, norm } from "@/lib/kits"
import { recordsFor } from "@/rules/programs"
import type { Ctx, EjView, UtilityRow } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const PAGE_SIZE = 50

type Filter = "all" | "loaded" | "blocked" | "mixed"
type SortKey = "town" | "ej"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All towns" },
  { value: "loaded", label: "Program loaded" },
  { value: "blocked", label: "Blocked" },
  { value: "mixed", label: "Mixed (pick on the bill)" },
]

/** Typed against EjView so the header label can never drift from the view model's label. */
const EJ_LABEL: Extract<EjView, { kind: "mean" }>["label"] =
  "unweighted mean across EJ block groups — not a town-wide rate"

interface CoverageRow {
  row: UtilityRow
  codes: string[]
  mixed: boolean
  programs: number
  ej: EjView | undefined
  /** null sorts last */
  ejMean: number | null
}

function ejText(ej: EjView | undefined): string {
  if (!ej) return "EJ file not loaded"
  if (ej.kind === "none") return ej.label
  return `${ej.meanPct.toFixed(2)}% · n=${ej.n}`
}

function matchesFilter(r: CoverageRow, f: Filter): boolean {
  if (f === "all") return true
  if (f === "mixed") return r.mixed
  if (r.mixed) return false
  return f === "loaded" ? r.programs > 0 : r.programs === 0
}

function ProgramsBadge({ r }: { r: CoverageRow }) {
  if (r.mixed) return <Badge variant="outline">Pick on the bill</Badge>
  if (r.programs === 0) return <Badge variant="secondary" className="text-muted-foreground">None — blocked</Badge>
  return <Badge>{r.programs === 1 ? "1 program" : `${r.programs} programs`}</Badge>
}

/** Coverage: every town in the saved utilities kit, its company line, loaded programs and EJ mean. */
export function CoverageScreen(props: { ctx: Ctx; coverage?: Coverage }) {
  const { ctx, coverage } = props
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<SortKey>("town")
  const [page, setPage] = useState(0)

  // Derived once per kit / tier set; independent of filter and sort.
  const rows = useMemo<CoverageRow[]>(
    () =>
      ctx.kits.utilities.map((row) => {
        const codes = companyCodes(row)
        const ej = ejStats(ctx.kits, row.key)
        return {
          row,
          codes,
          mixed: codes.length > 1,
          programs: codes.reduce((sum, code) => sum + recordsFor(code, ctx.enabledTiers).length, 0),
          ej,
          ejMean: ej && ej.kind === "mean" ? ej.meanPct : null,
        }
      }),
    [ctx.kits, ctx.enabledTiers],
  )

  const visible = useMemo(() => {
    const q = norm(query)
    const out = rows.filter((r) => matchesFilter(r, filter) && (q === "" || r.row.key.includes(q)))
    if (sort === "town") return out.sort((a, b) => a.row.key.localeCompare(b.row.key))
    return out.sort((a, b) => {
      if (a.ejMean !== null && b.ejMean !== null) return b.ejMean - a.ejMean || a.row.key.localeCompare(b.row.key)
      if (a.ejMean !== null) return -1
      if (b.ejMean !== null) return 1
      return a.row.key.localeCompare(b.row.key)
    })
  }, [rows, query, filter, sort])

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const pageRows = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const first = visible.length === 0 ? 0 : current * PAGE_SIZE + 1
  const last = current * PAGE_SIZE + pageRows.length

  const sortBy = (key: SortKey) => {
    setSort(key)
    setPage(0)
  }

  return (
    <section aria-labelledby="coverage-heading" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 id="coverage-heading" className="font-heading text-3xl font-bold tracking-tight">
          Coverage
        </h1>
        {coverage ? (
          <p className="text-[15px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {coverage.towns} of {coverage.townsTotal}
            </span>{" "}
            towns have a program loaded ·{" "}
            <span className="font-semibold text-foreground">{coverage.ejBlockGroupsPct}%</span> of{" "}
            {coverage.ejBlockGroupsTotal} EJ block groups are in those towns. Mixed-company towns are not counted.
          </p>
        ) : (
          <p className="text-[15px] text-muted-foreground">
            Coverage totals need the saved EJ file, which is not loaded in this build.
          </p>
        )}
      </header>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="coverage-filter-text">Filter towns</Label>
              <Input
                id="coverage-filter-text"
                type="search"
                className="h-11"
                placeholder="Town name"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coverage-filter-kind">Show</Label>
              <Select
                value={filter}
                onValueChange={(v) => {
                  setFilter(v as Filter)
                  setPage(0)
                }}
              >
                <SelectTrigger id="coverage-filter-kind" className="h-11 w-full sm:w-64">
                  <SelectValue>{(v: Filter) => FILTERS.find((f) => f.value === v)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {visible.length === 0
              ? "No towns match this filter."
              : `Showing ${first}–${last} of ${visible.length} towns, sorted ${
                  sort === "town" ? "A–Z" : "by limited-English average, highest first"
                }.`}
          </p>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead aria-sort={sort === "town" ? "ascending" : "none"} className="px-0">
                  <Button variant="ghost" className="h-11 px-2 font-semibold" onClick={() => sortBy("town")}>
                    Town
                    {sort === "town" ? <ArrowUpNarrowWide aria-hidden /> : <ArrowUpDown aria-hidden className="opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Programs loaded</TableHead>
                <TableHead aria-sort={sort === "ej" ? "descending" : "none"} className="px-0">
                  <Button
                    variant="ghost"
                    className="h-auto min-h-11 flex-col items-start gap-0 px-2 py-1 text-left"
                    onClick={() => sortBy("ej")}
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      Limited-English average
                      {sort === "ej" ? (
                        <ArrowDownWideNarrow aria-hidden className="size-4" />
                      ) : (
                        <ArrowUpDown aria-hidden className="size-4 opacity-50" />
                      )}
                    </span>
                    <span className="text-xs font-normal whitespace-normal text-muted-foreground">{EJ_LABEL}</span>
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => (
                <TableRow key={r.row.key}>
                  <TableCell className="font-medium">{r.row.town}</TableCell>
                  <TableCell className="whitespace-normal">{r.codes.join(" / ")}</TableCell>
                  <TableCell>
                    <ProgramsBadge r={r} />
                  </TableCell>
                  <TableCell className={r.ejMean === null ? "text-muted-foreground" : "tabular-nums"}>
                    {ejText(r.ej)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <nav aria-label="Coverage table pages" className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              className="h-11"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft aria-hidden />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {current + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              className="h-11"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
              <ChevronRight aria-hidden />
            </Button>
          </nav>
        </CardContent>
      </Card>
    </section>
  )
}
