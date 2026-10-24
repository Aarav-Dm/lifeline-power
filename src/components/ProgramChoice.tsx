import type { Purpose, RecordId, ViewModel } from "@/types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ProgramChoiceProps {
  choices: NonNullable<ViewModel["choices"]>
  pickedId: RecordId | null
  onPick: (id: RecordId) => void
}

/**
 * Tier 1 (task 8): when a company offers more than one record, the coordinator
 * picks the program before any card opens. Each row names the program and its
 * purpose in the app's own words. Rows are 44 px tall touch targets.
 */
const PURPOSE_CHOICE_TEXT: Record<Purpose, string> = {
  "outage-notify": "Outage notification",
  "shutoff-protection": "Shutoff protection (financial hardship + clinician certificate)",
  UNVERIFIED: "Purpose not verified",
}

export function ProgramChoice({ choices, pickedId, onPick }: ProgramChoiceProps) {
  return (
    <section aria-labelledby="program-choice-heading" className="flex flex-col gap-3">
      <h2 id="program-choice-heading" className="font-heading text-lg font-semibold">
        Choose the program
      </h2>
      <RadioGroup
        aria-labelledby="program-choice-heading"
        value={pickedId ?? ""}
        onValueChange={(v) => onPick(v as RecordId)}
        className="grid gap-3 sm:grid-cols-2"
      >
        {choices.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              "relative flex min-h-11 items-start gap-3 rounded-xl border p-4 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              pickedId === c.id ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/60",
            )}
          >
            <RadioGroupItem value={c.id} id={`program-${i}`} className="mt-1" />
            <Label
              htmlFor={`program-${i}`}
              className="flex cursor-pointer flex-col items-start gap-1 text-left text-base text-foreground after:absolute after:inset-0 after:content-['']"
            >
              <span className="font-heading font-semibold">{c.programName}</span>
              <span className="text-sm font-normal text-muted-foreground">{PURPOSE_CHOICE_TEXT[c.purpose]}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </section>
  )
}

