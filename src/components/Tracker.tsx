import { CheckCircle2Icon, CircleIcon, LockIcon } from "lucide-react"

import type { CardView, TrackerView } from "@/types"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface TrackerProps {
  tracker: TrackerView
  card: CardView
  onAttested: (value: boolean) => void
}

/**
 * Tier 1 (task 11). Three labelled stages — Prepared, Submitted, Confirmed —
 * with the current state shown in text (tracker.word). Confirmed is never a
 * control: it is always muted text (tracker.confirmedLabel) with a lock icon,
 * because only the utility can confirm (ban 10). The attestation checkbox uses
 * the record's own wording and is disabled until the packet is Prepared.
 */
export function Tracker({ tracker, card, onAttested }: TrackerProps) {
  const current = tracker.word
  return (
    <section aria-labelledby="tracker-heading" className="flex flex-col gap-4">
      <h3 id="tracker-heading" className="font-heading font-semibold">
        Where this packet stands
      </h3>

      <ol className="flex flex-col gap-2 sm:flex-row sm:gap-3" aria-label="Packet stages">
        {(["prepared", "submitted"] as const).map((stage) => {
          const reached = stage === "prepared" ? tracker.state !== "not-started" : tracker.state === "submitted"
          const isNow = tracker.state === stage
          return (
            <li
              key={stage}
              aria-current={isNow ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors",
                isNow ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wide uppercase">
                {reached ? (
                  <CheckCircle2Icon aria-hidden="true" className="size-4 text-success" />
                ) : (
                  <CircleIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                )}
                {stage === "prepared" ? "Prepared" : "Submitted"}
              </span>
              <span className="text-sm">{reached ? "Done" : "Not yet"}</span>
            </li>
          )
        })}
        <li className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border border-dashed border-border bg-muted px-3 py-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            <LockIcon aria-hidden="true" className="size-3.5" />
            Confirmed
          </span>
          <span className="text-sm text-muted-foreground">{tracker.confirmedLabel}</span>
        </li>
      </ol>

      <p className="text-base">
        <span className="font-semibold">Now:</span> {current}
      </p>

      {card.sendAttestation && (
        <div className="flex min-h-11 items-start gap-3">
          <Checkbox
            id="attest-sent"
            className="mt-1"
            checked={card.attested === true}
            disabled={card.canAttest !== true}
            onCheckedChange={(c) => onAttested(c === true)}
          />
          <Label htmlFor="attest-sent" className="cursor-pointer text-base text-foreground">
            {card.sendAttestation}
          </Label>
        </div>
      )}
    </section>
  )
}
