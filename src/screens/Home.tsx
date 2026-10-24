import { Building2Icon, FileTextIcon, MapPinnedIcon, PlusIcon, UsersRoundIcon } from "lucide-react"

import type { Coverage } from "@/lib/coverage"
import type { Ctx, RecordId } from "@/types"
import { loadKits } from "@/lib/kits"
import { ENABLED_TIERS, PROGRAMS } from "@/rules/programs"
import { derive } from "@/state/derive"
import { initialState, reduce } from "@/state/reducer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const OWNER_ROLE = { coordinator: "Coordinator", clinician: "Clinician", utility: "Utility" } as const
const ctx: Ctx = { kits: loadKits(ENABLED_TIERS), enabledTiers: ENABLED_TIERS }
const RECORDS = PROGRAMS.filter((p) => ENABLED_TIERS.includes(p.tier))
const COMPANIES = [...new Set(RECORDS.map((r) => r.companyNameOnPage))]

// "The other towns" line under the Programs-ready KPI, counted from the utilities kit (no typed numbers).
const LOADED = new Set(RECORDS.map((r) => r.companyCode))
const ROWS = ctx.kits.utilities
const MIXED = ROWS.filter((t) => t.utilityCode.includes(", "))
const SINGLE_NOT_LOADED = ROWS.filter((t) => !t.utilityCode.includes(", ") && !LOADED.has(t.utilityCode))
const MUNI = SINGLE_NOT_LOADED.filter((t) => t.utility === "Municipal").length
const OTHER = SINGLE_NOT_LOADED.length - MUNI
const ALL_TWO = MIXED.every((t) => t.utilityCode.split(", ").length === 2)
const OTHERS_LINE = [
  `${MIXED.length + SINGLE_NOT_LOADED.length} others: ${MUNI} use a local municipal light plant (no form opened yet)`,
  OTHER > 0 ? `, ${OTHER} ${OTHER === 1 ? "uses" : "use"} another company with no form opened yet` : "",
  `, and ${MIXED.length} have ${ALL_TWO ? "two companies" : "more than one company"} (pick the one on the bill)`,
].join("")

// Demo rows computed from the real reducer + view model (synthetic households, no typed rule text).
const DEMO_ROWS = ["FITCHBURG", "LAWRENCE", "CHELSEA"].flatMap((key) => {
  let s = reduce(initialState, { type: "SELECT_TOWN", key }, ctx)
  const first = derive(s, ctx)
  const id: RecordId | undefined = first.choices?.[0]?.id ?? first.card?.recordId
  if (id) s = reduce(s, { type: "PICK_PROGRAM", id }, ctx)
  const vm = derive(s, ctx)
  if (!vm.town || !vm.card) return []
  return [
    {
      town: vm.town.display,
      company: vm.town.companyCodes.join(" / "),
      program: vm.card.programName,
      next: vm.card.firstOpenStep.label,
      owner: OWNER_ROLE[vm.card.firstOpenStep.owner],
      status: vm.tracker?.word ?? "Not started",
    },
  ]
})

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof MapPinnedIcon; label: string; value: string; sub?: string }) {
  return (
    <Card className="rounded-xl shadow-sm animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
      <CardContent className="flex items-start gap-4">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-3xl leading-tight font-bold tabular-nums">{value}</p>
          <p className="text-sm font-medium">{label}</p>
          {sub && <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground" title={sub}>{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function statusBadge(status: string) {
  if (status.startsWith("Submitted")) return <Badge>{status}</Badge>
  if (status === "Prepared") return <Badge variant="outline" className="border-amber text-amber">{status}</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

export function Home({ coverage, onNew }: { coverage?: Coverage; onNew: () => void }) {
  const max = coverage ? Math.max(1, ...coverage.nextForms.slice(0, 5).map((f) => f.ejBlockGroups)) : 1
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[32px] leading-tight font-bold tracking-tight">Home</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Find a town's electric company and its medical programs, then print a one-page handoff.
          </p>
        </div>
        <Button type="button" className="h-11 cursor-pointer gap-2 px-5 text-[15px]" onClick={onNew}>
          <PlusIcon aria-hidden="true" />
          New handoff
        </Button>
      </div>

      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={MapPinnedIcon} label="Programs ready" value={coverage ? `${coverage.towns} towns` : "Not loaded in this build"} sub={coverage ? OTHERS_LINE : undefined} />
        <Kpi
          icon={UsersRoundIcon}
          label="Environmental-justice block groups covered"
          value={coverage ? `${coverage.ejBlockGroupsPct}%` : "Not loaded in this build"}
          sub={coverage ? `${coverage.ejBlockGroups.toLocaleString("en-US")} of ${coverage.ejBlockGroupsTotal.toLocaleString("en-US")}` : undefined}
        />
        <Kpi icon={FileTextIcon} label="Program records" value={String(RECORDS.length)} />
        <Kpi icon={Building2Icon} label="Electric companies loaded" value={String(COMPANIES.length)} sub={COMPANIES.join(", ")} />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl shadow-sm xl:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-heading text-lg font-semibold">Recent handoffs</CardTitle>
              <Badge variant="outline">Demo data — synthetic</Badge>
            </div>
            <CardDescription>Example packets built by the app from three demo towns. No real household.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Town</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Next step</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_ROWS.map((r) => (
                  <TableRow key={r.town}>
                    <TableCell className="font-medium">{r.town}</TableCell>
                    <TableCell className="max-w-48 whitespace-normal">{r.company}</TableCell>
                    <TableCell className="max-w-72 whitespace-normal">
                      <span className="line-clamp-2" title={r.next}>{r.next}</span>
                      <span className="block text-xs text-muted-foreground">{r.program}</span>
                    </TableCell>
                    <TableCell><Badge variant="outline">{r.owner}</Badge></TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-semibold">Next forms to open</CardTitle>
            <CardDescription>Single-company towns with no program loaded yet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {coverage ? (
              <ol className="flex flex-col gap-3">
                {coverage.nextForms.slice(0, 5).map((f, i) => (
                  <li key={f.town} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="mr-2 font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                        <span className="font-semibold">{f.town}</span>
                        <span className="ml-2 text-muted-foreground">{f.utilityCode}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">n={f.ejBlockGroups}</span>
                    </div>
                    <div aria-hidden="true" className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary/80" style={{ width: `${(f.ejBlockGroups / max) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Not loaded in this build.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Ranked by number of environmental-justice block groups (n). Mixed-company towns are not counted.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

