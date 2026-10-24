import type { ViewModel } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const OWNER_ROLE = { coordinator: "Coordinator", clinician: "Clinician", utility: "Utility" } as const

/** Wide-screen summary of the current packet. Renders only derive() output. */
export function SummaryCard({ vm }: { vm: ViewModel }) {
  const rows: [string, string][] = [
    ["Town", vm.town?.display ?? "Not chosen yet"],
    ["Company", vm.town ? vm.town.companyCodes.join(" / ") : "—"],
    ["Program", vm.card?.programName ?? (vm.blocked ? "None loaded (blocked)" : "Not chosen yet")],
    ["Next step", vm.card?.firstOpenStep.label ?? "—"],
    ["Owner", vm.card ? OWNER_ROLE[vm.card.firstOpenStep.owner] : "—"],
  ]
  if (vm.tracker) rows.push(["Status", vm.tracker.word])
  return (
    <Card aria-labelledby="summary-h" className="sticky top-6">
      <CardHeader>
        <CardTitle id="summary-h" className="font-heading text-base font-semibold">This packet</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="font-semibold text-muted-foreground">{k}</dt>
              <dd className="text-base break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
