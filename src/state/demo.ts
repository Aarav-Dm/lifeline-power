// LifeLine Power — synthetic demo fixture (design §4, task 4).
// Robert Pell, a Fitchburg synthetic address, account "DEMO — not a real account",
// life-support equipment yes, "Oxygen concentrator".
//
// The field KEYS of `unitil-lifesupport` are owned by src/rules/programs.ts, so we
// resolve DEMO_ANSWERS from that record's own field list by semantics (label / kind)
// rather than hard-coding suffixes. This keeps the fixture correct whatever key
// names the rules module chose, and still fills exactly the record's fields.

import type { Action, AnswerValue, Field } from "../types"
import { recordById } from "../rules/programs"

const DEMO_ACCOUNT = "DEMO — not a real account"
const DEMO_NAME = "Robert Pell"
const DEMO_ADDRESS = "17 Day Street, Fitchburg, MA 01420" // synthetic
const DEMO_EQUIPMENT = "Oxygen concentrator"
const DEMO_FITCHBURG_KEY = "FITCHBURG"

/** Pick the demo value for one Unitil life-support field, by its meaning. */
function demoValueFor(field: Field): AnswerValue | undefined {
  const label = field.label.toLowerCase()
  switch (field.kind) {
    case "text":
      if (label.includes("account")) return DEMO_ACCOUNT
      if (label.includes("name")) return DEMO_NAME
      if (label.includes("address")) return DEMO_ADDRESS
      if (label.includes("equipment") || label.includes("device")) return DEMO_EQUIPMENT
      return undefined
    case "yes-no":
      // "Electrically powered life-support equipment used?" → Yes
      return field.options?.[0] ?? "Yes"
    case "select":
      return field.options?.[0]
    case "device":
      return DEMO_EQUIPMENT
    case "consent":
      return true
    case "age-months":
      return undefined
    default:
      return undefined
  }
}

function buildDemoAnswers(): Record<string, AnswerValue> {
  const record = recordById("unitil-lifesupport")
  const out: Record<string, AnswerValue> = {}
  if (record == null) return out
  for (const field of record.fields) {
    const value = demoValueFor(field)
    if (value !== undefined) out[field.key] = value
  }
  return out
}

/** Answers for unitil-lifesupport. Lazily built from the live record so keys always match. */
export const DEMO_ANSWERS: Record<string, AnswerValue> = buildDemoAnswers()

/** Select Fitchburg (auto-resolves to Unitil life-support in the MVP) and set the demo answers. */
export function demoActions(): Action[] {
  const actions: Action[] = [{ type: "SELECT_TOWN", key: DEMO_FITCHBURG_KEY }]
  for (const [key, value] of Object.entries(DEMO_ANSWERS)) {
    actions.push({ type: "SET_ANSWER", key, value })
  }
  return actions
}
