import { useState } from "react"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TownSearchProps {
  onSubmit: (typed: string) => void
}

/** MVP town input (R1.2a): type a town, press Enter or Find. No list, scroll or sort. */
export function TownSearch({ onSubmit }: TownSearchProps) {
  const [text, setText] = useState("")
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim() !== "") onSubmit(text)
      }}
    >
      <Label htmlFor="town" className="font-heading text-base font-semibold">
        Town
      </Label>
      <p id="town-hint" className="text-sm text-muted-foreground">
        Type a Massachusetts town and press Enter.
      </p>
      <div className="flex gap-2">
        <Input
          id="town"
          name="town"
          aria-describedby="town-hint"
          autoComplete="off"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-11 flex-1 bg-card text-base"
        />
        <Button type="submit" className="h-11 cursor-pointer px-5 text-base">
          <SearchIcon aria-hidden="true" />
          Find
        </Button>
      </div>
    </form>
  )
}
