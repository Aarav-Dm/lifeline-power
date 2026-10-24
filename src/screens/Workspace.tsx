import { useEffect, useState } from "react"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, InfoIcon, LockIcon, PrinterIcon } from "lucide-react"

import type { Action, CardView, Ctx, OwnerRole, State, ViewModel } from "@/types"
import { matchTown } from "@/lib/kits"
import { cn } from "@/lib/utils"
import { disagreementNotice, STATE_TABLE_URL, UNITIL_PAGE_URL } from "@/rules/disagreements"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyPanel } from "@/components/CompanyPanel"
import { Handoff } from "@/components/Handoff"
import { HouseholdLanguage } from "@/components/HouseholdLanguage"
import { NextStepBand, ProgramCard } from "@/components/ProgramCard"
import { ProgramChoice } from "@/components/ProgramChoice"
import { TownCombobox } from "@/components/TownCombobox"
import { TownSearch } from "@/components/TownSearch"
import { Tracker } from "@/components/Tracker"
import { STEP_ORDER, currentStep, nextStep, prevStep, stepAvailability, type StepId } from "./step-order"

export interface WorkspaceProps {
  state: State
  vm: ViewModel
  dispatch: (a: Action) => void
  ctx: Ctx
  townOpenSignal: number
  printLang: "en" | "es"
  setPrintLang: (l: "en" | "es") => void
}

type StepState = "done" | "current" | "open" | "locked"

const STEP_LABEL: Record<StepId, string> = {
  town: "Town",
  program: "Program",
  checklist: "Checklist",
  handoff: "Handoff",
}

const STEPS: { id: StepId; label: string }[] = STEP_ORDER.map((id) => ({ id, label: STEP_LABEL[id] }))

const STEP_STATE_TEXT: Record<StepState, string> = {
  done: "Done",
  current: "You are here",
  open: "Ready",
  locked: "Locked",
}

const OWNER_ROLE: Record<OwnerRole, string> = { coordinator: "Coordinator", clinician: "Clinician", utility: "Utility" }
const CHANNEL_TEXT = { fax: "Fax", mail: "Mail", web: "Online", email: "Email", phone: "Phone" } as const

const CARD_SURFACE = "rounded-xl shadow-[0_4px_16px_rgb(0_0_0/0.06)]"

function completion(vm: ViewModel): Record<StepId, boolean> {
  const card = vm.card
  const fieldsDone = card ? card.steps.filter((s) => s.kind === "field").every((s) => s.done) : false
  return {
    town: vm.town != null,
    program: vm.status === "program-open",
    checklist: vm.tracker ? vm.tracker.state !== "not-started" : fieldsDone,
    handoff: vm.tracker?.state === "submitted",
  }
}

function focusStepHeading(id: StepId) {
  requestAnimationFrame(() => document.getElementById(`step-${id}-h`)?.focus())
}

export function Workspace({ state, vm, dispatch, ctx, townOpenSignal, printLang, setPrintLang }: WorkspaceProps) {
  const [step, setStep] = useState<StepId>("town")
  const available = stepAvailability(vm)
  const done = completion(vm)
  const current = currentStep(step, vm)
  const prevId = prevStep(step, vm)
  const nextId = nextStep(step, vm)
  const prev = prevId && { id: prevId, label: STEP_LABEL[prevId] }
  const next = nextId && { id: nextId, label: STEP_LABEL[nextId] }

  // Ctrl K and the top-bar search bring the coordinator back to the Town step.
  useEffect(() => {
    if (townOpenSignal > 0) setStep("town")
  }, [townOpenSignal])

  const go = (id: StepId) => {
    setStep(id)
    focusStepHeading(id)
  }

  const stepState = (id: StepId): StepState => {
    if (!available[id]) return "locked"
    if (id === current) return "current"
    return done[id] ? "done" : "open"
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">New handoff</h1>
        <p className="text-[15px] text-muted-foreground">
          One town in, one printed page out. Nothing here is sent to a utility.
        </p>
      </header>

      <Tabs
        orientation="vertical"
        value={current}
        onValueChange={(v) => setStep(v as StepId)}
        className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[13rem_minmax(0,1fr)_20rem] xl:gap-8"
      >
        <nav aria-label="Handoff steps" className="xl:sticky xl:top-24">
          <TabsList
            variant="line"
            className="grid h-auto w-full grid-cols-2 gap-2 p-0 sm:grid-cols-4 xl:flex xl:flex-col xl:gap-0"
          >
            {STEPS.map((s, i) => (
              <StepTab key={s.id} id={s.id} n={i + 1} label={s.label} state={stepState(s.id)} last={i === STEPS.length - 1} />
            ))}
          </TabsList>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          {vm.card && <NextStepBand card={vm.card} />}

          <TabsContent value="town" className="flex flex-col gap-6 text-base animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
            <StepHeading id="town" title="Town and electric company" hint="Pick the town where the patient lives. The company comes from the saved state table." />
            <TownStep state={state} vm={vm} dispatch={dispatch} ctx={ctx} townOpenSignal={townOpenSignal} />
          </TabsContent>

          <TabsContent value="program" className="flex flex-col gap-6 text-base animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
            <StepHeading id="program" title="Program" hint="Each program is its own record with its own form, signer and renewal." />
            {vm.choices && vm.choices.length > 0 && (
              <Card className={CARD_SURFACE}>
                <CardContent>
                  <ProgramChoice
                    choices={vm.choices}
                    pickedId={state.programId}
                    onPick={(id) => dispatch({ type: "PICK_PROGRAM", id })}
                  />
                </CardContent>
              </Card>
            )}
            {vm.card ? (
              <div className={CARD_SURFACE}>
                <ProgramCard part="details" card={vm.card} onAnswer={(key, value) => dispatch({ type: "SET_ANSWER", key, value })} />
              </div>
            ) : (
              <p className="text-muted-foreground">Pick a program to see what its form asks for.</p>
            )}
          </TabsContent>

          <TabsContent value="checklist" className="flex flex-col gap-6 text-base animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
            <StepHeading id="checklist" title="Checklist" hint="Fill in what the coordinator can. The steps list shows who owns the rest." />
            {vm.card && (
              <div className={CARD_SURFACE}>
                <ProgramCard part="checklist" card={vm.card} onAnswer={(key, value) => dispatch({ type: "SET_ANSWER", key, value })} />
              </div>
            )}
            {vm.tracker && vm.card && (
              <Card className={CARD_SURFACE}>
                <CardContent>
                  <Tracker tracker={vm.tracker} card={vm.card} onAttested={(value) => dispatch({ type: "SET_ATTESTED", value })} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="handoff" className="flex flex-col gap-6 text-base animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
            <StepHeading id="handoff" title="Handoff" hint="This is the page that prints. It names the next step and who owns it." />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="h-11 cursor-pointer gap-2 px-5 text-[15px]"
                onClick={() => {
                  setPrintLang("en")
                  setTimeout(() => window.print(), 0)
                }}
              >
                <PrinterIcon aria-hidden="true" />
                Print handoff
              </Button>
              {state.language === "Spanish" && (
                <Button
                  type="button"
                  variant="outline"
                  lang="es"
                  className="h-11 cursor-pointer gap-2 px-5 text-[15px]"
                  onClick={() => {
                    setPrintLang("es")
                    setTimeout(() => window.print(), 0)
                  }}
                >
                  <PrinterIcon aria-hidden="true" />
                  Imprimir en español
                </Button>
              )}
            </div>
            {vm.handoff && <Handoff h={vm.handoff} preview lang={state.language === "Spanish" ? printLang : "en"} />}
          </TabsContent>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            {prev ? (
              <Button type="button" variant="outline" className="h-11 cursor-pointer gap-2 px-4 text-[15px]" onClick={() => go(prev.id)}>
                <ArrowLeftIcon aria-hidden="true" />
                Back: {prev.label}
              </Button>
            ) : (
              <span />
            )}
            {next && (
              <Button
                type="button"
                className="h-11 cursor-pointer gap-2 px-4 text-[15px]"
                disabled={!available[next.id]}
                onClick={() => go(next.id)}
              >
                Next: {next.label}
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            )}
          </div>

          <CompactSummary vm={vm} />
        </div>

        <aside aria-label="Handoff preview" className="hidden xl:sticky xl:top-24 xl:block">
          <HandoffPreview vm={vm} />
        </aside>
      </Tabs>
    </div>
  )
}

// Pattern adapted from 21st.dev "Vertical Titled Stepper" (sean0205, id 29815): a connecting line
// between step circles that turns success-green once the step above is done. Rebuilt on our Tabs.
function StepTab({ id, n, label, state, last }: { id: StepId; n: number; label: string; state: StepState; last: boolean }) {
  return (
    <TabsTrigger
      value={id}
      disabled={state === "locked"}
      className="relative h-auto min-h-11 cursor-pointer justify-start gap-3 rounded-lg px-3 py-2 text-left whitespace-normal data-active:bg-accent data-active:text-accent-foreground xl:pb-6"
    >
      {!last && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-11 bottom-0 left-7 hidden w-0.5 -translate-x-1/2 rounded-full xl:block",
            state === "done" ? "bg-success" : "bg-border",
          )}
        />
      )}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors",
          state === "current" && "border-primary bg-primary text-primary-foreground",
          state === "done" && "border-success bg-success text-white dark:text-background",
          state === "open" && "border-border bg-background text-foreground",
          state === "locked" && "border-dashed border-border bg-muted text-muted-foreground",
        )}
      >
        {state === "done" ? <CheckIcon className="size-4" /> : state === "locked" ? <LockIcon className="size-3.5" /> : n}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-heading text-[15px] font-semibold">{label}</span>
        <span className="text-xs font-normal text-muted-foreground">{STEP_STATE_TEXT[state]}</span>
      </span>
    </TabsTrigger>
  )
}

function StepHeading({ id, title, hint }: { id: StepId; title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 id={`step-${id}-h`} tabIndex={-1} className="font-heading text-2xl font-semibold tracking-tight outline-none">
        {title}
      </h2>
      <p className="text-[15px] text-muted-foreground">{hint}</p>
    </div>
  )
}

function TownStep({
  state,
  vm,
  dispatch,
  ctx,
  townOpenSignal,
}: Pick<WorkspaceProps, "state" | "vm" | "dispatch" | "ctx" | "townOpenSignal">) {
  const notice = vm.town ? disagreementNotice(vm.town.display) : vm.status === "not-found" ? disagreementNotice(state.townQuery) : undefined

  return (
    <>
      <Card className={CARD_SURFACE}>
        <CardContent className="flex flex-col gap-6">
          {vm.townList ? (
            <TownCombobox
              townList={vm.townList}
              selectedDisplay={vm.town?.display}
              onSelectTown={(key) => dispatch({ type: "SELECT_TOWN", key })}
              onSubmitUnmatched={(query) => dispatch({ type: "SUBMIT_UNMATCHED", query })}
              openSignal={townOpenSignal}
            />
          ) : (
            <TownSearch
              onSubmit={(typed) => {
                const row = matchTown(ctx.kits, typed)
                dispatch(row ? { type: "SELECT_TOWN", key: row.key } : { type: "SUBMIT_UNMATCHED", query: typed })
              }}
            />
          )}

          {notice && (
            <Alert>
              <InfoIcon aria-hidden="true" />
              <AlertTitle>Source disagreement</AlertTitle>
              <AlertDescription>
                <p>{notice}</p>
                <p className="mt-1">
                  <a className="underline underline-offset-2 hover:text-foreground" href={UNITIL_PAGE_URL} target="_blank" rel="noreferrer">
                    Unitil life-support page<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  {" · "}
                  <a className="underline underline-offset-2 hover:text-foreground" href={STATE_TABLE_URL} target="_blank" rel="noreferrer">
                    State utilities table<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  {" (opened 24 Oct 2026)"}
                </p>
              </AlertDescription>
            </Alert>
          )}

          <CompanyPanel vm={vm} pickedCode={state.companyCode} onPickCompany={(code) => dispatch({ type: "PICK_COMPANY", code })} />
        </CardContent>
      </Card>

      {vm.townList && (
        <HouseholdLanguage
          value={state.language}
          other={state.languageOther}
          onLanguage={(value) => dispatch({ type: "SET_LANGUAGE", value })}
          onLanguageOther={(value) => dispatch({ type: "SET_LANGUAGE_OTHER", value })}
        />
      )}
    </>
  )
}

function programLine(vm: ViewModel): string {
  if (vm.card) return vm.card.programName
  if (vm.blocked) return "None loaded (blocked)"
  return "Not chosen yet"
}

function PreviewNextStep({ card }: { card: CardView }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-background py-3 pr-3 pl-4">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-amber" />
      <p className="text-xs font-semibold tracking-wide text-amber uppercase">Next step</p>
      <p className="mt-0.5 text-sm leading-snug font-medium">{card.firstOpenStep.label}</p>
      <Badge variant="secondary" className="mt-2">
        Owner: {OWNER_ROLE[card.firstOpenStep.owner]}
      </Badge>
    </div>
  )
}

/** Sticky live summary (xl and up). Renders only derive() output. */
function HandoffPreview({ vm }: { vm: ViewModel }) {
  const card = vm.card
  return (
    <Card className={CARD_SURFACE}>
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold">Handoff preview</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-4 text-sm">
          <PreviewRow label="Town">{vm.town?.display ?? "Not chosen yet"}</PreviewRow>
          <PreviewRow label="Company">
            {vm.town ? (
              <ul className="flex flex-col gap-1">
                {vm.town.companyCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : (
              "-"
            )}
          </PreviewRow>
          <PreviewRow label="Program">{programLine(vm)}</PreviewRow>
          {card && (
            <>
              <PreviewNextStep card={card} />
              <PreviewRow label={card.renewal.label}>{card.renewal.text}</PreviewRow>
              <PreviewRow label="Where to send it">
                <ul className="flex flex-col gap-1.5">
                  {card.returnChannels.map((c) => (
                    <li key={c.kind + c.text} className="break-words">
                      <span className="font-medium">{CHANNEL_TEXT[c.kind]}:</span> <span className="tabular-nums">{c.text}</span>
                      {c.unverified && !c.text.includes("UNVERIFIED") && (
                        <Badge variant="outline" className="ml-1.5 border-warning-foreground text-warning-foreground">
                          UNVERIFIED
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </PreviewRow>
            </>
          )}
          {vm.tracker && <PreviewRow label="Status">{vm.tracker.word}</PreviewRow>}
        </dl>
      </CardContent>
    </Card>
  )
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-[15px] break-words">{children}</dd>
    </div>
  )
}

/** Below xl the preview collapses into one short summary under the centre column. */
function CompactSummary({ vm }: { vm: ViewModel }) {
  return (
    <section aria-label="Handoff preview" className="rounded-xl border border-border bg-card p-4 shadow-sm xl:hidden">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Handoff preview</p>
      <p className="mt-1 text-[15px] break-words">
        <span className="font-medium">{vm.town?.display ?? "No town yet"}</span>
        {vm.town && <span className="text-muted-foreground"> · {vm.town.companyCodes.join(" / ")}</span>}
        <span className="text-muted-foreground"> · {programLine(vm)}</span>
      </p>
      {vm.card && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Next step: {vm.card.firstOpenStep.label}</span>
          <Badge variant="secondary">Owner: {OWNER_ROLE[vm.card.firstOpenStep.owner]}</Badge>
        </p>
      )}
    </section>
  )
}

