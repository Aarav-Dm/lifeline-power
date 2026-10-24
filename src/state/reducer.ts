// LifeLine Power — pure state machine. No React, no mutation.
// Source of truth: .kiro/specs/lifeline/design.md §4.

import type { Action, Ctx, ProgramRecord, RecordId, State } from "../types"
import { companyCodes, townRow } from "../lib/kits"
import { isAnswered, isRequired, recordById, recordsFor } from "../rules/programs"

export const initialState: State = {
  townKey: null,
  townQuery: "",
  notFound: false,
  companyCode: null,
  programId: null,
  answers: {},
  attestedSent: false,
  language: "not-chosen",
  languageOther: "",
  backup: { typedCounty: "", typedContact: "" },
}

/** The enabled records (for the pick / auto-select) for a company code. */
function enabledRecordsFor(ctx: Ctx, code: string | null): ProgramRecord[] {
  if (code == null) return []
  // `ng-paper` is never part of the program choice; recordsFor is the choice set.
  return recordsFor(code, ctx.enabledTiers)
}

/** The single auto-selected program id for a company, or null (0 or >1 enabled records). */
function soleProgramId(ctx: Ctx, code: string | null): RecordId | null {
  const recs = enabledRecordsFor(ctx, code)
  return recs.length === 1 ? recs[0].id : null
}

/** The company code auto-selected for a town row, or null when the town is mixed. */
function soleCompanyCode(codes: string[]): string | null {
  return codes.length === 1 ? codes[0] : null
}

/** A fresh household: a town reset with the given town identity. */
function townReset(
  base: State,
  townKey: string | null,
  notFound: boolean,
  townQuery: string,
  companyCode: string | null,
  programId: RecordId | null,
): State {
  return {
    townKey,
    townQuery,
    notFound,
    companyCode,
    programId,
    answers: {},
    attestedSent: false,
    language: base.language,
    languageOther: base.languageOther,
    backup: { typedCounty: "", typedContact: "" },
  }
}

/** undefined is treated as null for the SET_ANSWER no-op comparison. */
function sameValue(a: unknown, b: unknown): boolean {
  const aa = a === undefined ? null : a
  const bb = b === undefined ? null : b
  return Object.is(aa, bb)
}

/** Every field step of the open record is done (used to gate SET_ATTESTED(true)). */
function everyFieldStepDone(record: ProgramRecord, state: State): boolean {
  return record.steps.every((step) => {
    if (step.kind !== "field") return true
    return step.fields.every((key) => fieldAnswered(record, key, state))
  })
}

function fieldAnswered(record: ProgramRecord, key: string, state: State): boolean {
  const field = record.fields.find((f) => f.key === key)
  if (field == null) return false
  if (!isRequiredNow(record, field.key, state)) return true
  return isAnswered(field, state.answers[field.key])
}

function isRequiredNow(record: ProgramRecord, key: string, state: State): boolean {
  const field = record.fields.find((f) => f.key === key)
  if (field == null) return false
  return isRequired(field, state.answers)
}

export function reduce(state: State, action: Action, ctx: Ctx): State {
  switch (action.type) {
    case "SELECT_TOWN": {
      if (action.key === state.townKey) return state
      const row = townRow(ctx.kits, action.key)
      if (row == null) return state
      const codes = companyCodes(row)
      const code = soleCompanyCode(codes)
      const programId = soleProgramId(ctx, code)
      return townReset(state, row.key, false, state.townQuery, code, programId)
    }

    case "SUBMIT_UNMATCHED": {
      return townReset(state, null, true, action.query, null, null)
    }

    case "PICK_COMPANY": {
      if (state.townKey == null) return state
      const row = townRow(ctx.kits, state.townKey)
      if (row == null) return state
      const codes = companyCodes(row)
      // Valid only for a mixed town and one of its codes.
      if (codes.length <= 1) return state
      if (!codes.includes(action.code)) return state
      if (action.code === state.companyCode) return state
      const programId = soleProgramId(ctx, action.code)
      return {
        ...state,
        companyCode: action.code,
        programId,
        answers: {},
        attestedSent: false,
      }
    }

    case "PICK_PROGRAM": {
      if (state.companyCode == null) return state
      // ng-paper is never a program choice.
      if (action.id === "ng-paper") return state
      const enabled = enabledRecordsFor(ctx, state.companyCode)
      const record = enabled.find((r) => r.id === action.id)
      if (record == null) return state
      if (action.id === state.programId) return state
      return {
        ...state,
        programId: action.id,
        answers: {},
        attestedSent: false,
      }
    }

    case "SET_ANSWER": {
      if (state.programId == null) return state
      const record = recordById(state.programId)
      if (record == null) return state
      if (!action.key.startsWith(`${state.programId}.`)) return state
      const field = record.fields.find((f) => f.key === action.key)
      if (field == null) return state
      if (sameValue(action.value, state.answers[action.key])) return state
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.value },
        attestedSent: false,
      }
    }

    case "SET_ATTESTED": {
      if (action.value === false) {
        if (state.attestedSent === false) return state
        return { ...state, attestedSent: false }
      }
      // true: valid only when every field step of the open record is done.
      if (state.programId == null) return state
      const record = recordById(state.programId)
      if (record == null) return state
      if (!everyFieldStepDone(record, state)) return state
      if (state.attestedSent === true) return state
      return { ...state, attestedSent: true }
    }

    case "SET_LANGUAGE": {
      if (action.value === state.language) return state
      return { ...state, language: action.value }
    }

    case "SET_LANGUAGE_OTHER": {
      if (action.value === state.languageOther) return state
      return { ...state, languageOther: action.value }
    }

    case "SET_TYPED_COUNTY": {
      if (action.value === state.backup.typedCounty) return state
      return { ...state, backup: { ...state.backup, typedCounty: action.value } }
    }

    case "SET_BACKUP_CONTACT": {
      if (action.value === state.backup.typedContact) return state
      return { ...state, backup: { ...state.backup, typedContact: action.value } }
    }

    default:
      return state
  }
}
