import type { Language } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HouseholdLanguageProps {
  value: Language
  other: string
  onLanguage: (value: Language) => void
  onLanguageOther: (value: string) => void
}

/**
 * Tier 1 (task 12). Household language is never inferred (ban 9): it starts
 * "Not chosen" and changes only when the coordinator changes it. The EJ mean is
 * a block-group statistic, not a language — this control is visually separated
 * from the town sort for that reason.
 */
const OPTIONS: { value: Language; label: string }[] = [
  { value: "not-chosen", label: "Not chosen" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "Other", label: "Other" },
]

export function HouseholdLanguage({ value, other, onLanguage, onLanguageOther }: HouseholdLanguageProps) {
  return (
    <section aria-labelledby="household-heading" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <h3 id="household-heading" className="font-heading font-semibold">
        Household
      </h3>
      <div className="flex flex-col gap-2">
        <Label htmlFor="household-language" className="text-base">
          Household language
        </Label>
        <Select value={value} onValueChange={(v) => onLanguage(v as Language)}>
          <SelectTrigger id="household-language" className="h-11 w-full bg-card text-base sm:w-72">
            <SelectValue>{(v: Language) => OPTIONS.find((o) => o.value === v)?.label ?? "Not chosen"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value === "Other" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="household-language-other" className="text-base">
            Other language
          </Label>
          <Input
            id="household-language-other"
            value={other}
            onChange={(e) => onLanguageOther(e.target.value)}
            className="h-11 bg-card text-base sm:w-72"
          />
        </div>
      )}
    </section>
  )
}
