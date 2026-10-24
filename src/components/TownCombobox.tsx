import { useEffect, useMemo, useState } from "react"
import { ChevronsUpDownIcon, InfoIcon } from "lucide-react"

import type { TownListItem } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TownComboboxProps {
  townList: TownListItem[]
  selectedDisplay?: string
  onSelectTown: (key: string) => void
  onSubmitUnmatched: (query: string) => void
  /** Each change to a value > 0 opens the list with an empty filter (Ctrl K, top-bar search). */
  openSignal?: number
}

type SortMode = "az" | "ej"

const EMPTY_TEXT = "Not in the saved 351-town table"
const EJ_TOOLTIP = "Unweighted mean of the limited-English household rate across the town's environmental-justice block groups in the state file. Not a town-wide rate."

/** Plain sentence for the selected town only (no raw stats in list rows). */
function ejPlainText(item: TownListItem): string | null {
  const ej = item.ej
  if (ej == null) return null
  if (ej.kind === "none") return ej.label
  const areas = ej.n === 1 ? "environmental-justice area" : "environmental-justice areas"
  return `Limited-English households: ${ej.meanPct.toFixed(1)}% average across ${ej.n} ${areas} (not a town-wide rate)`
}

/** Sort key for the EJ-mean sort: mean desc, towns with no mean last. */
function meanOrNull(item: TownListItem): number | null {
  const ej = item.ej
  if (ej == null || ej.kind === "none") return null
  return ej.meanPct
}

function sortTowns(list: TownListItem[], mode: SortMode): TownListItem[] {
  if (mode === "az") {
    return [...list].sort((a, b) => a.display.localeCompare(b.display))
  }
  return [...list].sort((a, b) => {
    const ma = meanOrNull(a)
    const mb = meanOrNull(b)
    if (ma == null && mb == null) return a.display.localeCompare(b.display)
    if (ma == null) return 1
    if (mb == null) return -1
    return mb - ma
  })
}

/**
 * Tier 1 (task 14a). Replaces the MVP typed field with a Popover + Command
 * combobox over all 351 towns: type to filter, arrow keys, Enter to select.
 * Unmatched text + Enter submits as an unmatched query (CommandEmpty shows the
 * not-found message). The EJ mean beside each town is a block-group statistic,
 * labelled once above the list (ban 9).
 */
export function TownCombobox({ townList, selectedDisplay, onSelectTown, onSubmitUnmatched, openSignal }: TownComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortMode>("az")

  useEffect(() => {
    if (openSignal != null && openSignal > 0) {
      setQuery("")
      setOpen(true)
    }
  }, [openSignal])

  const sorted = useMemo(() => sortTowns(townList, sort), [townList, sort])
  const hasEj = useMemo(() => townList.some((t) => t.ej != null), [townList])
  const selectedItem = selectedDisplay ? townList.find((t) => t.display === selectedDisplay) : undefined
  const selectedEj = selectedItem ? ejPlainText(selectedItem) : null

  const submitUnmatched = () => {
    const typed = query.trim()
    if (typed === "") return
    setOpen(false)
    onSubmitUnmatched(typed)
  }

  return (
    <section className="flex flex-col gap-2">
      <Label id="town-label" htmlFor="town" className="font-heading text-base font-semibold">
        Town
      </Label>
      <p id="town-hint" className="text-sm text-muted-foreground">
        Type a Massachusetts town, or pick from the list.
      </p>

      <Popover
        open={open}
        onOpenChange={(o) => {
          if (o) setQuery("")
          setOpen(o)
        }}
      >
        <PopoverTrigger
          render={
            <Button
              id="town"
              type="button"
              variant="outline"
              aria-labelledby="town-label"
              aria-describedby="town-hint"
              className="h-11 w-full justify-between bg-card text-base font-normal sm:w-96"
            >
              <span className={selectedDisplay ? "" : "text-muted-foreground"}>
                {selectedDisplay ?? "Choose a town"}
              </span>
              <ChevronsUpDownIcon aria-hidden="true" className="size-4 shrink-0 opacity-60" />
            </Button>
          }
        />
        <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] p-0">
          <div className="flex flex-col gap-2 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Order</span>
              <RadioGroup
                aria-label="Sort towns"
                value={sort}
                onValueChange={(v) => setSort(v as SortMode)}
                className="flex flex-row flex-wrap gap-4"
              >
                <div className="flex min-h-9 items-center gap-2">
                  <RadioGroupItem value="az" id="sort-az" />
                  <Label htmlFor="sort-az" className="cursor-pointer text-sm">
                    A–Z
                  </Label>
                </div>
                <div className="flex min-h-9 items-center gap-2">
                  <RadioGroupItem value="ej" id="sort-ej" disabled={!hasEj} />
                  <Label htmlFor="sort-ej" className="cursor-pointer text-sm">
                    Sort by language need
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Command
            shouldFilter
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // When nothing matches, Enter submits the typed text as unmatched.
                const anyVisible = sorted.some((t) => t.display.toLowerCase().includes(query.trim().toLowerCase()))
                if (!anyVisible) {
                  e.preventDefault()
                  submitUnmatched()
                }
              }
            }}
          >
            <CommandInput
              value={query}
              onValueChange={setQuery}
              autoFocus
              placeholder="Filter towns"
              aria-label="Filter towns"
            />
            <CommandList>
              <CommandEmpty>{EMPTY_TEXT}</CommandEmpty>
              <CommandGroup>
                {sorted.map((t) => {
                  return (
                    <CommandItem
                      key={t.key}
                      value={t.display}
                      onSelect={() => {
                        setOpen(false)
                        onSelectTown(t.key)
                      }}
                      className="flex min-h-11 items-center justify-between gap-3 text-base"
                    >
                      <span>{t.display}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedEj && (
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <span>{selectedEj}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button type="button" aria-label="About this number" className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <InfoIcon aria-hidden="true" className="size-4" />
                  </button>
                }
              />
              <TooltipContent className="max-w-xs">{EJ_TOOLTIP}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
      )}
    </section>
  )
}

