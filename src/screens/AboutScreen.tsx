import type { Coverage } from "@/lib/coverage"
import { Landing } from "@/components/Landing"

/** About: the problem, the HHS emPOWER figure with its source, the honest limits, coverage. */
export function AboutScreen({ coverage, onStart }: { coverage?: Coverage; onStart: () => void }) {
  return <Landing onStart={onStart} coverage={coverage} />
}
