import { BanIcon, CircleHelpIcon, TriangleAlertIcon } from "lucide-react"

import type { ViewModel } from "@/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface CompanyPanelProps {
  vm: ViewModel
  pickedCode: string | null
  onPickCompany: (code: string) => void
}

/** Renders only derive() output: company badges, the mixed-town pick, blocked and not-found. */
export function CompanyPanel({ vm, pickedCode, onPickCompany }: CompanyPanelProps) {
  if (vm.status === "not-found" && vm.notFoundMessage) {
    return (
      <Alert>
        <CircleHelpIcon aria-hidden="true" />
        <AlertTitle>{vm.notFoundMessage}</AlertTitle>
      </Alert>
    )
  }
  if (!vm.town) return null

  return (
    <section aria-labelledby="company-heading" className="flex flex-col gap-3">
      <h2 id="company-heading" className="font-heading text-lg font-semibold">
        {vm.town.display}: electric company
      </h2>
      <ul className="flex flex-wrap gap-2" aria-label="Companies named in the state table">
        {vm.town.companyCodes.map((c) => (
          <li key={c}>
            <Badge variant="outline" className="h-auto px-2.5 py-1 text-sm">
              {c}
            </Badge>
          </li>
        ))}
      </ul>

      {vm.mixed && (
        <Alert>
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>{vm.mixed.prompt}</AlertTitle>
          <AlertDescription>
            <RadioGroup
              aria-label={vm.mixed.prompt}
              value={pickedCode ?? ""}
              onValueChange={(v) => onPickCompany(String(v))}
              className="mt-2"
            >
              {vm.mixed.companyCodes.map((c, i) => (
                <div key={c} className="flex min-h-11 items-center gap-3">
                  <RadioGroupItem value={c} id={`company-${i}`} />
                  <Label htmlFor={`company-${i}`} className="cursor-pointer text-base text-foreground">
                    {c}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </AlertDescription>
        </Alert>
      )}

      {vm.blocked && (
        <Alert variant="warning">
          <BanIcon aria-hidden="true" />
          {/* Company name is already in the badge above (QA polish a: no repeat). */}
          <AlertTitle className="text-base">{vm.blocked.message}</AlertTitle>
          <AlertDescription className="text-base">Check the company printed on the bill and contact that company directly.</AlertDescription>
        </Alert>
      )}
    </section>
  )
}
