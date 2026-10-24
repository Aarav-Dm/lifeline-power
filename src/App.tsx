import { useEffect, useMemo, useReducer, useState } from "react"
import {
  ClipboardListIcon,
  HomeIcon,
  InfoIcon,
  LibraryIcon,
  MapIcon,
  MenuIcon,
  MoonIcon,
  OctagonXIcon,
  PlugZapIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "lucide-react"

import type { Action, Ctx, State } from "@/types"
import { aboutCoverage } from "@/lib/coverage-view"
import { loadKits } from "@/lib/kits"
import { ENABLED_TIERS } from "@/rules/programs"
import { initialState, reduce } from "@/state/reducer"
import { derive } from "@/state/derive"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from "@/components/theme-provider"
import { Handoff } from "@/components/Handoff"
import { AboutScreen } from "@/screens/AboutScreen"
import { CoverageScreen } from "@/screens/CoverageScreen"
import { Home } from "@/screens/Home"
import { SourcesScreen } from "@/screens/SourcesScreen"
import { Workspace } from "@/screens/Workspace"

const ctx: Ctx = { kits: loadKits(ENABLED_TIERS), enabledTiers: ENABLED_TIERS }
const COVERAGE = aboutCoverage(ctx.kits, ENABLED_TIERS)

export type View = "home" | "workspace" | "coverage" | "sources" | "about"
const NAV: { id: View; label: string; icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "workspace", label: "New handoff", icon: ClipboardListIcon },
  { id: "coverage", label: "Coverage", icon: MapIcon },
  { id: "sources", label: "Sources", icon: LibraryIcon },
  { id: "about", label: "About", icon: InfoIcon },
]

function viewFromHash(): View {
  const id = window.location.hash.replace(/^#\/?/, "")
  return NAV.some((n) => n.id === id) ? (id as View) : "home"
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <PlugZapIcon className="size-5" />
      </span>
      <span className="font-heading text-lg leading-tight font-bold tracking-tight">LifeLine Power</span>
    </div>
  )
}

function NavList({ view, onGo }: { view: View; onGo: (v: View) => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = view === n.id
        return (
          <Button
            key={n.id}
            type="button"
            variant="ghost"
            aria-current={active ? "page" : undefined}
            onClick={() => onGo(n.id)}
            className={`h-11 cursor-pointer justify-start gap-3 rounded-lg px-3 text-[15px] ${active ? "bg-accent font-semibold text-accent-foreground hover:bg-accent" : "text-muted-foreground hover:text-foreground"}`}
          >
            <n.icon aria-hidden="true" className="size-5" />
            {n.label}
          </Button>
        )
      })}
    </nav>
  )
}

export function App() {
  const [state, dispatch] = useReducer((s: State, a: Action) => reduce(s, a, ctx), initialState)
  const vm = useMemo(() => derive(state, ctx), [state])
  const [view, setView] = useState<View>(viewFromHash)
  const [townOpenSignal, setTownOpenSignal] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [printLang, setPrintLang] = useState<"en" | "es">("en")
  const { theme, setTheme } = useTheme()
  const dark = theme === "dark"

  // Keep the URL in step with the screen (web-design-guidelines: URL reflects state), so Back and links work.
  useEffect(() => {
    if (window.location.hash !== `#/${view}`) {
      // First load (no screen in the URL) replaces, so Back does not land on a blank entry.
      const first = !window.location.hash.startsWith("#/")
      window.history[first ? "replaceState" : "pushState"](null, "", `#/${view}`)
    }
    const label = NAV.find((n) => n.id === view)?.label
    document.title = view === "home" || !label ? "LifeLine Power" : `${label} · LifeLine Power`
  }, [view])
  useEffect(() => {
    const onPop = () => {
      // Ignore in-page anchors such as the skip link (#main); only "#/<screen>" changes the screen.
      if (window.location.hash === "" || window.location.hash.startsWith("#/")) setView(viewFromHash())
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const go = (v: View) => {
    setView(v)
    setMenuOpen(false)
  }
  const openTownSearch = () => {
    setView("workspace")
    setTownOpenSignal((n) => n + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setView("workspace")
        setTownOpenSignal((n) => n + 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (vm.fatal) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <Alert variant="destructive">
          <OctagonXIcon aria-hidden="true" />
          <AlertTitle>Saved town table failed to load: {vm.fatal.file}</AlertTitle>
          <AlertDescription>Check that failed: {vm.fatal.check}</AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <>
      <a href="#main" className="no-print sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">Skip to main content</a>
      <div className="no-print flex min-h-svh bg-background">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 border-r border-border bg-card px-3 py-5 lg:flex">
          <Brand />
          <NavList view={view} onGo={go} />
          <p className="mt-auto px-3 text-xs leading-relaxed text-muted-foreground">
            Does not submit or confirm anything. Not medical or legal advice. Demo data is synthetic.
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button type="button" variant="outline" size="icon" className="size-11 cursor-pointer lg:hidden" aria-label="Open menu">
                    <MenuIcon aria-hidden="true" />
                  </Button>
                }
              />
              <SheetContent side="top" className="p-4">
                <SheetHeader className="p-0 pb-3">
                  <SheetTitle>
                    <Brand />
                  </SheetTitle>
                </SheetHeader>
                <NavList view={view} onGo={go} />
              </SheetContent>
            </Sheet>
            <button
              type="button"
              onClick={openTownSearch}
              className="flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-3 text-left text-[15px] text-muted-foreground transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:max-w-xl"
            >
              <SearchIcon aria-hidden="true" className="size-5 shrink-0" />
              <span className="truncate">Search a Massachusetts town…</span>
              <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-xs sm:inline">Ctrl K</kbd>
            </button>
            <Button type="button" className="hidden h-11 cursor-pointer gap-2 px-4 text-[15px] sm:inline-flex" onClick={() => go("workspace")}>
              <PlusIcon aria-hidden="true" />
              New handoff
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 cursor-pointer"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(dark ? "light" : "dark")}
            >
              {dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
            </Button>
          </header>

          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 outline-none sm:px-6 lg:px-8">
            {view === "home" && <Home coverage={COVERAGE} onNew={() => go("workspace")} />}
            {view === "workspace" && <Workspace state={state} vm={vm} dispatch={dispatch} ctx={ctx} townOpenSignal={townOpenSignal} printLang={printLang} setPrintLang={setPrintLang} />}
            {view === "coverage" && <CoverageScreen ctx={ctx} coverage={COVERAGE} />}
            {view === "sources" && <SourcesScreen />}
            {view === "about" && <AboutScreen coverage={COVERAGE} onStart={() => go("workspace")} />}
          </main>
        </div>
      </div>
      {vm.handoff && <Handoff h={vm.handoff} lang={state.language === "Spanish" ? printLang : "en"} />}
    </>
  )
}


export default App


