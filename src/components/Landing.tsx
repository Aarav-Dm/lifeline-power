import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react"

import type { Coverage } from "@/lib/coverage"
import { ABOUT } from "@/rules/about"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** Landing view (Aarav): the problem in two sentences, Start, and an About panel. */
export function Landing({ onStart, coverage }: { onStart: () => void; coverage?: Coverage }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <section aria-labelledby="landing-h" className="flex flex-col gap-6 py-4">
        <h2 id="landing-h" className="font-heading text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
          The right electric company's medical program, for one town, on one page.
        </h2>
        <div className="flex max-w-prose flex-col gap-3 text-lg">
          {ABOUT.problem.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <ol className="grid max-w-prose gap-2 text-base sm:grid-cols-4" aria-label="How it works">
          {["Town", "Program", "Checklist", "Handoff"].map((s, i) => (
            <li key={s} className="flex items-center gap-2 py-1">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <div>
          <Button type="button" onClick={onStart} className="h-12 cursor-pointer px-6 text-base">
            Start with a town
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </section>

      <Card aria-labelledby="about-h">
        <CardHeader>
          <CardTitle id="about-h" className="font-heading text-lg font-semibold">About</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-base">
          <div>
            <p className="font-heading text-3xl font-bold text-primary tabular-nums">{ABOUT.hhs.figure}</p>
            <p>{ABOUT.hhs.text}</p>
            <p className="mt-1 text-sm text-muted-foreground">{ABOUT.hhs.caveat}</p>
            <a
              href={ABOUT.hhs.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Source: {ABOUT.hhs.sourceTitle}
              <ExternalLinkIcon aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {ABOUT.limits.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {coverage && (
            <section aria-labelledby="coverage-h" className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 id="coverage-h" className="font-heading font-semibold">Coverage in this build</h3>
              <p>
                Programs loaded for <span className="font-semibold tabular-nums">{coverage.towns}</span> of{" "}
                <span className="tabular-nums">{coverage.townsTotal}</span> towns, holding{" "}
                <span className="font-semibold tabular-nums">{coverage.ejBlockGroupsPct}%</span> of the state's environmental-justice
                block groups ({coverage.ejBlockGroups.toLocaleString("en-US")} of {coverage.ejBlockGroupsTotal.toLocaleString("en-US")}).
              </p>
              <p className="text-sm text-muted-foreground">
                Mixed-company towns are not counted, so these are lower bounds. Block groups are areas, not people who use medical equipment.
              </p>
              {coverage.nextForms.length > 0 && (
                <>
                  <p className="text-sm font-semibold">Next forms to open (most EJ block groups, n):</p>
                  <ol className="flex list-decimal flex-col gap-0.5 pl-5 text-sm">
                    {coverage.nextForms.slice(0, 3).map((f) => (
                      <li key={f.town}>
                        {f.town} — {f.utilityCode} · n={f.ejBlockGroups}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


