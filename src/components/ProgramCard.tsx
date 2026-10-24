import { CheckCircle2Icon, CircleIcon, ExternalLinkIcon, HourglassIcon } from "lucide-react"

import type { AnswerValue, CardView, Field, Source, Sourced } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProgramCardProps {
  part: "details" | "checklist"
  card: CardView
  onAnswer: (key: string, value: AnswerValue) => void
}

const STEP_KIND_TEXT = { field: "To fill in", send: "To send", "utility-wait": "Waiting on the utility" } as const
const OWNER_ROLE = { coordinator: "Coordinator", clinician: "Clinician", utility: "Utility" } as const
const CHANNEL_TEXT = { fax: "Fax", mail: "Mail", web: "Online", email: "Email", phone: "Phone" } as const

function SourceLink({ source }: { source: Source | undefined }) {
  if (!source) return null
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      Source: {source.title}
      <ExternalLinkIcon aria-hidden="true" className="size-4" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="font-semibold">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function FieldControl({
  field,
  value,
  onAnswer,
  agePrompt,
}: {
  field: Field
  value: AnswerValue | undefined
  onAnswer: ProgramCardProps["onAnswer"]
  agePrompt?: string
}) {
  const id = `f-${field.key.replace(/[^a-z0-9]/gi, "-")}`
  const label = (
    <Label htmlFor={id} className="text-base">
      {field.label}
      {!field.required && <span className="font-normal text-muted-foreground"> (optional)</span>}
    </Label>
  )
  switch (field.kind) {
    case "yes-no":
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-base font-medium">{field.label}</legend>
          <RadioGroup value={typeof value === "string" ? value : ""} onValueChange={(v) => onAnswer(field.key, String(v))} className="flex gap-6">
            {(field.options ?? ["Yes", "No"]).map((o) => (
              <div key={o} className="flex min-h-11 items-center gap-2">
                <RadioGroupItem value={o} id={`${id}-${o}`} />
                <Label htmlFor={`${id}-${o}`} className="cursor-pointer text-base">{o}</Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
      )
    case "consent":
      return (
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox id={id} checked={value === true} onCheckedChange={(c) => onAnswer(field.key, c === true ? true : null)} />
          {label}
        </div>
      )
    case "select":
    case "device":
      return (
        <div className="flex flex-col gap-2">
          {label}
          <Select value={typeof value === "string" ? value : null} onValueChange={(v) => onAnswer(field.key, v == null ? null : String(v))}>
            <SelectTrigger id={id} className="h-11 w-full bg-card text-base sm:w-72">
              <SelectValue placeholder={field.unansweredText ?? "Choose one"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    case "age-months":
      return (
        <div className="flex flex-col gap-2">
          {label}
          <Input
            id={id}
            type="number"
            min={0}
            inputMode="numeric"
            value={typeof value === "number" ? String(value) : ""}
            onChange={(e) => onAnswer(field.key, e.target.value === "" ? null : Number(e.target.value))}
            className="h-11 w-40 bg-card text-base"
          />
          {agePrompt && <p className="text-sm text-muted-foreground">{agePrompt}</p>}
        </div>
      )
    default:
      return (
        <div className="flex flex-col gap-2">
          {label}
          <Input
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onAnswer(field.key, e.target.value === "" ? null : e.target.value)}
            className="h-11 bg-card text-base"
          />
          {field.note && <p className="text-sm text-muted-foreground">{field.note.text}</p>}
        </div>
      )
  }
}

export function ProgramCard({ part, card, onAnswer }: ProgramCardProps) {
  const src = (id: string) => card.sources.find((s) => s.id === id)
  const sourced = (s: Sourced) => (
    <>
      <span>{s.text}</span> <SourceLink source={src(s.sourceId)} />
    </>
  )

  return (
    <Card className={part === "checklist" ? "gap-0 py-6" : "gap-0 py-0"}>
      {part === "details" && (<CardHeader className="px-6 pt-6">
        <CardTitle className="font-heading text-xl font-semibold">
          {card.companyNameOnPage} — {card.programName}
        </CardTitle>
        <CardDescription className="text-base text-foreground">
          <Badge variant="secondary" className="h-auto px-2 py-0.5 text-sm">{card.purposeText}</Badge>
        </CardDescription>
      </CardHeader>)}

      <CardContent className="flex flex-col gap-6 px-6 pb-6 text-base">
        {part === "details" && (<dl className="flex flex-col gap-4">
          <Row label="Signer">{sourced(card.signer)}</Row>
          {card.signerAlso && <Row label="Also">{sourced(card.signerAlso)}</Row>}
          <Row label={card.renewal.label}>
            <span className="font-semibold">{card.renewal.text}</span> <SourceLink source={src(card.renewal.sourceId)} />
          </Row>
          {card.regulationContext && (
            <Row label={card.regulationContext.label}>
              <span>{card.regulationContext.text}</span> <SourceLink source={src(card.regulationContext.sourceId)} />
            </Row>
          )}
          {card.formBoxNote && <Row label="Form box">{sourced(card.formBoxNote)}</Row>}
          <Row label="Send it to">
            <ul className="flex flex-col gap-1">
              {card.returnChannels.map((c) => (
                <li key={c.kind + c.text}>
                  <span className="font-medium">{CHANNEL_TEXT[c.kind]}:</span>{" "}
                  {c.kind === "web" && c.text.startsWith("https://") ? (
                    <a
                      href={c.text}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center break-all text-primary underline underline-offset-4 hover:no-underline"
                    >
                      {c.text}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span className="break-words tabular-nums">{c.text}</span>
                  )}
                  {c.unverified && !c.text.includes("UNVERIFIED") && <Badge variant="outline" className="ml-2 border-warning-foreground text-warning-foreground">UNVERIFIED</Badge>}
                </li>
              ))}
            </ul>
          </Row>
        </dl>)}
        {part === "checklist" && (<section aria-labelledby="fields-h" className="flex flex-col gap-4">
          <h3 id="fields-h" className="font-heading font-semibold">Coordinator's checklist</h3>
          {card.fields.map((f) => (
            <FieldControl
              key={f.key}
              field={f}
              value={card.answers[f.key]}
              onAnswer={onAnswer}
              agePrompt={f.kind === "age-months" ? card.agePrompt : undefined}
            />
          ))}
        </section>)}


        {part === "details" && card.quotes.length > 0 && (
          <section aria-label="Quoted from the opened source" className="flex flex-col gap-3">
            {card.quotes.map((q) => (
              <blockquote key={q.text} className="border-l-4 border-primary pl-4">
                <p>{q.text}</p>
                <SourceLink source={src(q.sourceId)} />
              </blockquote>
            ))}
          </section>
        )}

        {part === "details" && card.contents && card.contents.length > 0 && (
          <section aria-labelledby="contents-h" className="flex flex-col gap-2">
            <h3 id="contents-h" className="font-heading font-semibold">The letter must state</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {card.contents.map((c) => (
                <li key={c.text}>{c.verbatim ? null : <span className="text-muted-foreground">Paraphrase: </span>}{sourced(c)}</li>
              ))}
            </ul>
          </section>
        )}

        {part === "details" && (card.limits.length > 0 || card.noGuarantee) && (
          <section aria-labelledby="limits-h" className="flex flex-col gap-2">
            <h3 id="limits-h" className="font-heading font-semibold">From the source</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {card.limits.map((l) => (
                <li key={l.text}>{l.verbatim ? null : <span className="text-muted-foreground">Paraphrase: </span>}{sourced(l)}</li>
              ))}
              {card.noGuarantee && <li>{sourced(card.noGuarantee)}</li>}
            </ul>
          </section>
        )}

        {part === "checklist" && card.cpapNotice && (
          <section aria-labelledby="cpap-h" className="flex flex-col gap-2">
            <h3 id="cpap-h" className="font-heading font-semibold">
              Equipment note from the opened form
            </h3>
            <blockquote className="border-l-4 border-primary pl-4">
              <p>{card.cpapNotice.sentence.text}</p>
              <SourceLink source={src(card.cpapNotice.sentence.sourceId)} />
            </blockquote>
            <a
              href={card.cpapNotice.pointer.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium break-all text-primary underline underline-offset-4 hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              National Grid Medical Protection application
              <ExternalLinkIcon aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </section>
        )}


        {part === "checklist" && (<section aria-labelledby="steps-h" className="flex flex-col gap-3">
          <h3 id="steps-h" className="font-heading font-semibold">Steps and who owns each one</h3>
          <ol className="flex flex-col gap-2">
            {card.steps.map((s) => (
              <li key={s.id} className="flex items-start gap-3">
                {s.done ? (
                  <CheckCircle2Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                ) : s.kind === "utility-wait" ? (
                  <HourglassIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                ) : (
                  <CircleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                )}
                <span>
                  <span className="font-medium">{s.label}</span>
                  <span className="block text-sm text-muted-foreground">
                    {STEP_KIND_TEXT[s.kind]} · Owner: {OWNER_ROLE[s.owner]} · {s.done ? "Done" : "Open"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>)}

        {part === "details" && card.unverified.length > 0 && (
          <section aria-labelledby="unv-h" className="flex flex-col gap-2">
            <h3 id="unv-h" className="font-heading font-semibold">Not verified</h3>
            <ul className="flex flex-col gap-1">
              {card.unverified.map((u) => (
                <li key={u} className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 border-warning-foreground text-warning-foreground">UNVERIFIED</Badge>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {part === "details" && (<section aria-labelledby="src-h" className="flex flex-col gap-1">
          <h3 id="src-h" className="font-heading font-semibold">Sources (opened {card.sources[0]?.openedAt})</h3>
          <ul className="flex flex-col">
            {card.sources.map((s) => (
              <li key={s.id}>
                <SourceLink source={s} />
                <span className="block text-sm break-all text-muted-foreground">{s.url}</span>
              </li>
            ))}
          </ul>
        </section>)}
      </CardContent>
    </Card>
  )
}



/** Signature element: the Next-step band (docs/FRONTEND.md §2). Always on top of the flow. */
export function NextStepBand({ card }: { card: CardView }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-accent py-5 pr-6 pl-8 shadow-sm" aria-live="polite">
<span aria-hidden="true" className="absolute inset-y-0 left-0 w-2 bg-primary" />
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          Next step · {card.firstOpenStep.index} of {card.firstOpenStep.total}
        </p>
        <p className="mt-1 font-heading text-xl leading-snug font-semibold text-balance">{card.firstOpenStep.label}</p>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="rounded-md bg-primary px-2.5 py-1 text-sm font-semibold text-primary-foreground">
            Owner: {OWNER_ROLE[card.firstOpenStep.owner]}
          </span>
          {card.firstOpenStep.owner !== "coordinator" && (
            <span className="text-sm">{card.firstOpenStep.ownerText}</span>
          )}
        </p>
      </div>

  )
}


