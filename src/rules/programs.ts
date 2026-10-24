// Program records for the MVP. design.md §3 (the eight-records table, "Fields and steps",
// verbatim rules, unverified lists) and tasks.md task 3.
// Only the two MVP records live here: unitil-lifesupport and ng-outage.
// Tier-1/2 records come later — do not add them.

import type {
  Field,
  ProgramRecord,
  Purpose,
  RecordId,
  Step,
  Tier,
} from "../types"
import { NO_INTERVAL } from "../types"
import { SOURCES } from "./sources"

export const ENABLED_TIERS: Tier[] = ["mvp", "tier1"]

export const HOLYOKE_CODE = "Holyoke Gas & Electric Department"

export const PURPOSE_TEXT: Record<Purpose, string> = {
  "outage-notify": "Outage notification",
  "shutoff-protection":
    "Shutoff protection (financial hardship + clinician certificate)",
  UNVERIFIED: "Purpose not stated on the opened page — UNVERIFIED",
}

// ---------------------------------------------------------------------------
// unitil-lifesupport  (MVP, outage-notify)
// ---------------------------------------------------------------------------

// The opened Unitil page and MALFORM-MA PDF name the company "Unitil" (FINAL-idea.md, Unitil section).
const UNITIL_COMPANY_NAME_ON_PAGE = "Unitil"

const unitilSigner = {
  text: "A physician, physician assistant, nurse practitioner, or local board of health completes the physician section and faxes or mails it from the office within seven days; the customer fills the top",
  sourceId: "unitil-pdf",
  verbatim: false,
}

const unitilFields: Field[] = [
  {
    key: "unitil-lifesupport.customer-name",
    label: "Customer name",
    kind: "text",
    required: true,
  },
  {
    key: "unitil-lifesupport.service-address",
    label: "Service address",
    kind: "text",
    required: true,
  },
  {
    key: "unitil-lifesupport.account-number",
    label: 'Account number (demo: "DEMO — not a real account")',
    kind: "text",
    required: true,
  },
  {
    key: "unitil-lifesupport.equipment-used",
    label: "Electrically powered life-support equipment used?",
    kind: "yes-no",
    options: ["Yes", "No"],
    required: true,
  },
  {
    key: "unitil-lifesupport.equipment-description",
    label: "Equipment description",
    kind: "text",
    required: true,
    requiredWhen: { key: "unitil-lifesupport.equipment-used", notEquals: "No" },
  },
  {
    key: "unitil-lifesupport.intent-to-file",
    label: "Intent-to-file note",
    kind: "consent",
    required: false,
    note: {
      text: "Submitting that note is not the physician certificate",
      sourceId: "unitil-page",
      verbatim: false,
    },
  },
]

const unitilSteps: Step[] = [
  {
    kind: "field",
    id: "unitil-lifesupport.customer-section",
    label: "Customer section",
    owner: "coordinator",
    ownerText: "Coordinator",
    fields: [
      "unitil-lifesupport.customer-name",
      "unitil-lifesupport.service-address",
      "unitil-lifesupport.account-number",
    ],
  },
  {
    kind: "field",
    id: "unitil-lifesupport.life-support-equipment",
    label: "Life-support equipment",
    owner: "coordinator",
    ownerText: "Coordinator",
    fields: [
      "unitil-lifesupport.equipment-used",
      "unitil-lifesupport.equipment-description",
    ],
  },
  {
    kind: "send",
    id: "unitil-lifesupport.physician-section",
    label:
      "Physician section incl. nature of illness and anticipated length 3/6/12, faxed or mailed from the clinician's office within seven days",
    owner: "clinician",
    ownerText: unitilSigner.text,
  },
  {
    kind: "utility-wait",
    id: "unitil-lifesupport.wait",
    label: "Waiting for Unitil to confirm",
    owner: "utility",
    ownerText: UNITIL_COMPANY_NAME_ON_PAGE,
  },
]

const unitilLifesupport: ProgramRecord = {
  id: "unitil-lifesupport",
  tier: "mvp",
  companyCode: "Unitil (Fitchburg Gas & Electric)",
  companyNameOnPage: UNITIL_COMPANY_NAME_ON_PAGE,
  programName: "Massachusetts Medical Alert / Life Support",
  purpose: "outage-notify",
  signer: unitilSigner,
  renewalLabel: "Outage-list renewal",
  renewal: {
    kind: "none-stated",
    text: NO_INTERVAL,
    scope: "in the opened sources",
    sourceId: "unitil-page",
    verbatim: false,
  },
  regulationContext: {
    label: "Separate shutoff-protection certificate (220 CMR 25.03)",
    text: "serious illness renewed quarterly; chronic every six months",
    sourceId: "cmr-25-03",
    verbatim: false,
  },
  formBoxNote: {
    text: "Anticipated length 3, 6 or 12 months — the clinician's anticipated length of the condition, not a protection period",
    sourceId: "unitil-pdf",
    verbatim: false,
  },
  returnChannels: [
    {
      kind: "fax",
      text: "603-227-4784",
      sourceId: "unitil-page",
      verbatim: false,
    },
    {
      kind: "mail",
      text: "Unitil, c/o Customer Services – Life Support, 5 McGuire Street, Concord, NH 03301",
      sourceId: "unitil-page",
      verbatim: false,
    },
    {
      kind: "phone",
      text: "1-888-301-7700",
      sourceId: "unitil-page",
      verbatim: false,
    },
  ],
  quotes: [],
  limits: [
    {
      text: "The page tells the customer to keep a backup source of electricity.",
      sourceId: "unitil-page",
      verbatim: false,
    },
    {
      text: "The page does not say restoration is prioritized.",
      sourceId: "unitil-page",
      verbatim: false,
    },
  ],
  unverified: [
    "A newer Massachusetts PDF than the 2021-08 file the live page links.",
    "When the Unitil page was opened on 24 Oct 2026 it said MyUnitil forms were unavailable; whether that is still true is not verified.",
    "What Unitil does when the 12-month box is checked and the six-month chronic renewal has passed.",
  ],
  fields: unitilFields,
  steps: unitilSteps,
  sendAttestation: "The clinician's office says it faxed or mailed this",
  claims: {
    outageNotification: true,
    shutoffProtection: false,
    restorationPriority: false,
  },
  sources: [SOURCES["unitil-pdf"], SOURCES["unitil-page"], SOURCES["cmr-25-03"]],
}

// ---------------------------------------------------------------------------
// ng-outage  (MVP, outage-notify)
// ---------------------------------------------------------------------------

const NG_COMPANY_NAME_ON_PAGE = "National Grid (Massachusetts Electric)"

// Copied character for character from FINAL-idea.md
// "Verbatim limits from pages opened 24 Oct 2026" → National Grid live form.
const ngQuote1 =
  "Outage Life Support provides phone notification to households where life sustaining equipment is in use so that Life Support Customers can make all necessary arrangements to plan for possible disruption to their electric service during an extended planned or unplanned electric outage."
const ngQuote2 =
  "It is important to understand that participation in the Life Support Program does not protect your account from termination of service for non-payment of arrears. We encourage you to pay any arrears on your account as soon as possible. If you require protection from termination on your account due to the presence of a serious or chronic illness in the household, please apply separately with our Customer Protections Form."
const ngQuote3 =
  "Also note- Outage Life Support does not sign your account up for a higher priority for restoration if there is an outage."
const ngCpapSentence =
  "The Following are generally not considered life-sustaining: oxygen PRN, sleep apnea machines for patients over 6 months of age (CPAP, BiPAP, APAP, VPAP), nebulizer, ICD, AED, pacemaker, spinal cord stimulator, life alert, air conditioning, refrigerated medication, electric bed, electric air mattress, electric lift, electric wheelchair/lift. A doctor can certify you require electric or gas service due to one of these by submitting our Medical Protection application."

const ngSigner = {
  text: "The account holder on the web form; a clinician signature is not on the opened page",
  sourceId: "ng-live",
  verbatim: false,
}

const ngFields: Field[] = [
  {
    key: "ng-outage.account-number",
    label: "Account number",
    kind: "text",
    required: true,
  },
  {
    key: "ng-outage.service-address",
    label: "Service address",
    kind: "text",
    required: true,
  },
  {
    key: "ng-outage.primary-phone",
    label: "Primary phone",
    kind: "text",
    required: true,
  },
  {
    key: "ng-outage.secondary-phone",
    label: "Secondary phone",
    kind: "text",
    required: false,
  },
  {
    key: "ng-outage.device",
    label: "Device",
    kind: "device",
    options: ["CPAP", "BiPAP", "APAP", "VPAP", "Other — type it"],
    required: true,
  },
  {
    key: "ng-outage.age-months",
    label: "Patient age in months",
    kind: "age-months",
    required: false,
  },
]

const ngSteps: Step[] = [
  {
    kind: "field",
    id: "ng-outage.account-and-contact",
    label: "Account and contact",
    owner: "coordinator",
    ownerText: "Coordinator",
    fields: [
      "ng-outage.account-number",
      "ng-outage.service-address",
      "ng-outage.primary-phone",
    ],
  },
  {
    kind: "field",
    id: "ng-outage.equipment",
    label: "Equipment",
    owner: "coordinator",
    ownerText: "Coordinator",
    fields: ["ng-outage.device"],
  },
  {
    kind: "send",
    id: "ng-outage.submit",
    label: "Submit the web form",
    owner: "coordinator",
    ownerText: "Coordinator",
  },
  {
    kind: "utility-wait",
    id: "ng-outage.wait",
    label: "Waiting for National Grid to confirm",
    owner: "utility",
    ownerText: NG_COMPANY_NAME_ON_PAGE,
  },
]

const ngOutage: ProgramRecord = {
  id: "ng-outage",
  tier: "mvp",
  companyCode: "National Grid (Massachusetts Electric)",
  companyNameOnPage: NG_COMPANY_NAME_ON_PAGE,
  programName: "Outage Life Support",
  purpose: "outage-notify",
  signer: ngSigner,
  renewalLabel: "Renewal",
  renewal: {
    kind: "none-stated",
    text: NO_INTERVAL,
    sourceId: "ng-live",
    verbatim: false,
  },
  returnChannels: [
    {
      kind: "web",
      text: "https://www.nationalgridus.com/Form/MA-Electric-Outage-Life-Support-Form",
      sourceId: "ng-live",
      verbatim: false,
    },
  ],
  quotes: [{ text: ngQuote1, sourceId: "ng-live", verbatim: true }],
  cpapSentence: { text: ngCpapSentence, sourceId: "ng-live", verbatim: true },
  // Non-termination and no-priority paragraphs live in limits so the handoff prints them (QA Q4).
  limits: [
    { text: ngQuote2, sourceId: "ng-live", verbatim: true },
    { text: ngQuote3, sourceId: "ng-live", verbatim: true },
  ],
  unverified: [
    "The revision date (none shown on the live form).",
    "The live form's own equipment list (not transcribed).",
  ],
  fields: ngFields,
  steps: ngSteps,
  sendAttestation: "I submitted the web form",
  claims: {
    outageNotification: true,
    shutoffProtection: false,
    restorationPriority: false,
  },
  // ng-protect is a pointer link only; no text on ng-outage is drawn from it.
  sources: [SOURCES["ng-live"], SOURCES["ng-protect"]],
}

// ---------------------------------------------------------------------------
// ng-medical  (tier 1, shutoff-protection)  — National Grid Medical Protection
// design §3; FINAL-idea.md "Fallback hardening" → National Grid medical protection.
// All strings paraphrase ng-protect (no verbatim text in that source).
// ---------------------------------------------------------------------------

const ngMedicalSigner = {
  text: "A registered physician, physician assistant, nurse practitioner, or local board of health, on letterhead with that office's address and phone",
  sourceId: "ng-protect",
  verbatim: false,
}

const ngMedicalFields: Field[] = [
  {
    key: "ng-medical.discount-rate",
    label: "Account is on a discount rate",
    kind: "select",
    options: ["Yes", "No", "Not known"],
    required: true,
  },
  {
    key: "ng-medical.hardship-statement",
    label: "Financial-hardship statement prepared",
    kind: "consent",
    required: true,
    requiredWhen: { key: "ng-medical.discount-rate", notEquals: "Yes" },
  },
  {
    key: "ng-medical.patient-name",
    label: "Patient name",
    kind: "text",
    required: true,
  },
  {
    key: "ng-medical.patient-address",
    label: "Patient address",
    kind: "text",
    required: true,
  },
  {
    key: "ng-medical.letter-in-hand",
    label: "Signed letter is in hand",
    kind: "consent",
    required: true,
  },
]

const ngMedicalSteps: Step[] = [
  {
    kind: "field",
    id: "ng-medical.discount-and-hardship",
    label: "Discount rate and hardship",
    owner: "coordinator",
    ownerText: "Coordinator",
    fields: [
      "ng-medical.discount-rate",
      "ng-medical.hardship-statement",
      "ng-medical.patient-name",
      "ng-medical.patient-address",
    ],
  },
  {
    kind: "field",
    id: "ng-medical.clinician-letter",
    label:
      "Letter on letterhead stating patient name, address, serious (90) or chronic (180)",
    owner: "clinician",
    ownerText: ngMedicalSigner.text,
    fields: ["ng-medical.letter-in-hand"],
  },
  {
    kind: "send",
    id: "ng-medical.send",
    label: "Send by Customer Protections Form, fax or mail",
    owner: "coordinator",
    ownerText: "Coordinator",
  },
  {
    kind: "utility-wait",
    id: "ng-medical.wait",
    label: "Waiting for National Grid to confirm",
    owner: "utility",
    ownerText: NG_COMPANY_NAME_ON_PAGE,
  },
]

const ngMedical: ProgramRecord = {
  id: "ng-medical",
  tier: "tier1",
  companyCode: "National Grid (Massachusetts Electric)",
  companyNameOnPage: NG_COMPANY_NAME_ON_PAGE,
  programName: "Medical Protection (Customer Protections)",
  purpose: "shutoff-protection",
  signer: ngMedicalSigner,
  renewalLabel: "Renewal",
  renewal: {
    kind: "days-90-180",
    text: "Serious illness 90 days; chronic illness 180 days",
    sourceId: "ng-protect",
    verbatim: false,
  },
  returnChannels: [
    {
      kind: "web",
      text: "Online Customer Protections Form",
      sourceId: "ng-protect",
      verbatim: false,
    },
    {
      kind: "fax",
      text: "1-866-460-8549",
      sourceId: "ng-protect",
      verbatim: false,
    },
    {
      kind: "mail",
      text: "National Grid, Attention: Protections, D1, 300 Erie Blvd W, Syracuse, NY 13202",
      sourceId: "ng-protect",
      verbatim: false,
    },
    {
      kind: "email",
      text: "masked on the opened page — UNVERIFIED",
      sourceId: "ng-protect",
      verbatim: false,
      unverified: true,
    },
  ],
  quotes: [],
  limits: [],
  // What the letter must contain. FINAL-idea.md "National Grid medical protection" (QA Q5).
  contents: [
    {
      text: "The document is on the letterhead of a registered physician, physician assistant, nurse practitioner, or local board of health, with that office's address and phone.",
      sourceId: "ng-protect",
      verbatim: false,
    },
    {
      text: "It states the patient's name and address and whether the illness is serious (90 days) or chronic (180 days).",
      sourceId: "ng-protect",
      verbatim: false,
    },
    {
      text: "If the account is not on a discount rate, a financial-hardship statement is also required.",
      sourceId: "ng-protect",
      verbatim: false,
    },
  ],
  unverified: [
    "The protections email (masked on the opened page).",
    "The Customer Protections / Medical Protection application fields (not transcribed).",
  ],
  fields: ngMedicalFields,
  steps: ngMedicalSteps,
  sendAttestation: "I sent this",
  claims: {
    outageNotification: false,
    shutoffProtection: true,
    restorationPriority: false,
  },
  sources: [SOURCES["ng-protect"]],
}

// ---------------------------------------------------------------------------
// ev-letter  (tier 1, outage-notify)  — Eversource Eastern MA life-support letter
// design §3; FINAL-idea.md verbatim "Eversource life-support letter, Bedford copy".
// ---------------------------------------------------------------------------

const EV_COMPANY_NAME_ON_PAGE = "NSTAR Electric d/b/a Eversource Energy"

// Copied character for character from FINAL-idea.md "Verbatim limits" →
// Eversource life-support letter, Bedford copy.
const evLetterQuote1 =
  "Please have your physician certify, in writing, that equipment is being used for life support. The letter must specifically state: That electric powered life-sustaining equipment is being used by you or a member of your household. The type of electric powered equipment being used. The patient's name, address, and a primary and alternate contact number."
const evLetterQuote2 =
  "The letter must be signed by a medical doctor, on letterhead and mailed to: Eversource, 247 Station Drive SW200. Westwood, MA 02090"
const evLetterQuote3 =
  "When the letter is received, your household will be enrolled in our life support notification program. To maintain this enrollment, certification must be updated annually."
const evLetterQuote4 =
  "Please note that certification does not prioritize your service for faster restoration in the event of a power outage. We encourage you to have an alternate source of energy in the event of a prolonged electric interruption. This certification has no impact to medical protection already applied to your account."

const evLetterSigner = {
  text: "A medical doctor, on letterhead",
  sourceId: "ev-bedford",
  verbatim: false,
}

const evLetterFields: Field[] = [
  {
    key: "ev-letter.patient-name",
    label: "Patient name",
    kind: "text",
    required: true,
  },
  {
    key: "ev-letter.patient-address",
    label: "Patient address",
    kind: "text",
    required: true,
  },
  {
    key: "ev-letter.primary-phone",
    label: "Primary phone",
    kind: "text",
    required: true,
  },
  {
    key: "ev-letter.alternate-phone",
    label: "Alternate phone",
    kind: "text",
    required: true,
  },
  {
    key: "ev-letter.equipment-type",
    label: "Equipment type",
    kind: "text",
    required: true,
  },
  {
    key: "ev-letter.letter-in-hand",
    label: "Signed letter is in hand",
    kind: "consent",
    required: true,
  },
]

const evLetterSteps: Step[] = [
  {
    kind: "field",
    id: "ev-letter.gather",
    label: "Gather letter contents",
    owner: "coordinator",
    ownerText: "Coordinator",
    fields: [
      "ev-letter.patient-name",
      "ev-letter.patient-address",
      "ev-letter.primary-phone",
      "ev-letter.alternate-phone",
      "ev-letter.equipment-type",
    ],
  },
  {
    kind: "field",
    id: "ev-letter.clinician-letter",
    label: "Letter signed by a medical doctor on letterhead",
    owner: "clinician",
    ownerText: evLetterSigner.text,
    fields: ["ev-letter.letter-in-hand"],
  },
  {
    kind: "send",
    id: "ev-letter.send",
    label: "Mail to Westwood",
    owner: "coordinator",
    ownerText: "Coordinator",
  },
  {
    kind: "utility-wait",
    id: "ev-letter.wait",
    label: "Waiting for Eversource to confirm",
    owner: "utility",
    ownerText: EV_COMPANY_NAME_ON_PAGE,
  },
]

const evLetter: ProgramRecord = {
  id: "ev-letter",
  tier: "tier1",
  companyCode: "Eversource Energy (NSTAR Electric)",
  companyNameOnPage: EV_COMPANY_NAME_ON_PAGE,
  programName: "Eastern MA Life Support Equipment Certification",
  purpose: "outage-notify",
  signer: evLetterSigner,
  renewalLabel: "Renewal",
  renewal: {
    kind: "annual",
    text: "To maintain this enrollment, certification must be updated annually.",
    sourceId: "ev-bedford",
    verbatim: true,
  },
  returnChannels: [
    {
      kind: "mail",
      text: "Eversource, 247 Station Drive SW200, Westwood, MA 02090",
      sourceId: "ev-bedford",
      verbatim: false,
    },
  ],
  quotes: [
    { text: evLetterQuote1, sourceId: "ev-bedford", verbatim: true },
    { text: evLetterQuote2, sourceId: "ev-bedford", verbatim: true },
    { text: evLetterQuote3, sourceId: "ev-bedford", verbatim: true },
    { text: evLetterQuote4, sourceId: "ev-bedford", verbatim: true },
  ],
  limits: [],
  noGuarantee: {
    text: evLetterQuote4,
    sourceId: "ev-bedford",
    verbatim: true,
  },
  unverified: [
    "Currency past the Bedford May 2023 posting.",
    "Bedford copy, May 2023 filename — currency UNVERIFIED",
  ],
  fields: evLetterFields,
  steps: evLetterSteps,
  sendAttestation: "The letter was mailed to Westwood",
  claims: {
    outageNotification: true,
    shutoffProtection: false,
    restorationPriority: false,
  },
  sources: [SOURCES["ev-bedford"]],
}

// ---------------------------------------------------------------------------
// ev-illness  (tier 1, shutoff-protection)  — Eversource Medical Certification of Illness
// design §3; FINAL-idea.md verbatim "Eversource Medical Certification of Illness"
// and the M.G.L. c.164 §124A statute sentence (signerAlso + a verbatim quote).
// ---------------------------------------------------------------------------

// Copied character for character from FINAL-idea.md "Verbatim limits" →
// Eversource Medical Certification of Illness. The doubled
// "or a chronic serious illness" is unedited (ban 12).
const evIllnessQuote1 =
  "Eversource will provide protection from service shut-off if there is a financial hardship in the home and a Registered Physician, Board of Health official, Advanced Practice Registered Nurse (APRN) or Physician Assistant (PA) certifies the patient listed below is suffering from a serious illness or a chronic serious illness or a chronic serious illness. See M.G.L. Chapter 164 Section 124A."
const evIllnessQuote2 =
  "Serious Illness – This form must be completed and returned to Eversource every 90 days."
const evIllnessQuote3 =
  "Serious Chronic Illness – This form must be completed and returned to Eversource every 180 days."
const evIllnessQuote4 = "Does your patient have life support equipment at home?"
const evIllnessQuote5 =
  "Please return the completed form by fax to 413-746-6495 or online at eversource.com/upload."
// M.G.L. c.164 §124A, verbatim.
const evIllnessStatute =
  "No gas or electric company shall shut off or fail to restore gas or electric service in any residence during such time as there is a serious illness therein; provided, however, that a registered physician or the local board of health certifies in writing to the company that such serious illness exists; and provided, further, that the customer cannot afford to pay any overdue bill because of a financial hardship."

const evIllnessSigner = {
  text: "Registered Physician, Board of Health official, APRN or PA",
  sourceId: "ev-illness-pdf",
  verbatim: false,
}

const evIllnessSignerAlso = {
  text: "The statute names a narrower list: a registered physician or the local board of health.",
  sourceId: "mgl-164-124a",
  verbatim: false,
}

const evIllnessFields: Field[] = [
  {
    key: "ev-illness.patient-name",
    label: "Patient name",
    kind: "text",
    required: true,
  },
  {
    key: "ev-illness.patient-address",
    label: "Patient address",
    kind: "text",
    required: true,
  },
  {
    key: "ev-illness.hardship",
    label: "Household states a financial hardship",
    kind: "yes-no",
    options: ["Yes", "No"],
    required: true,
  },
  {
    key: "ev-illness.certificate-in-hand",
    label: "Completed certificate is in hand",
    kind: "consent",
    required: true,
  },
]

const evIllnessSteps: Step[] = [
  {
    kind: "field",
    id: "ev-illness.patient-and-hardship",
    label: "Patient and hardship",
    owner: "coordinator",
    ownerText: "Coordinator",
    fields: [
      "ev-illness.patient-name",
      "ev-illness.patient-address",
      "ev-illness.hardship",
    ],
  },
  {
    kind: "field",
    id: "ev-illness.clinician-certificate",
    label:
      "Certification of serious or serious chronic illness, incl. the life-support question",
    owner: "clinician",
    ownerText: evIllnessSigner.text,
    fields: ["ev-illness.certificate-in-hand"],
  },
  {
    kind: "send",
    id: "ev-illness.send",
    label: "Return by fax or eversource.com/upload",
    owner: "coordinator",
    ownerText: "Coordinator",
  },
  {
    kind: "utility-wait",
    id: "ev-illness.wait",
    label: "Waiting for Eversource to confirm",
    owner: "utility",
    ownerText: EV_COMPANY_NAME_ON_PAGE,
  },
]

const evIllness: ProgramRecord = {
  id: "ev-illness",
  tier: "tier1",
  companyCode: "Eversource Energy (NSTAR Electric)",
  companyNameOnPage: EV_COMPANY_NAME_ON_PAGE,
  programName: "Medical Certification of Illness",
  purpose: "shutoff-protection",
  signer: evIllnessSigner,
  signerAlso: evIllnessSignerAlso,
  renewalLabel: "Renewal",
  renewal: {
    kind: "days-90-180",
    text: "Serious illness 90 days; chronic illness 180 days",
    sourceId: "ev-illness-pdf",
    verbatim: false,
  },
  returnChannels: [
    {
      kind: "fax",
      text: "413-746-6495",
      sourceId: "ev-illness-pdf",
      verbatim: false,
    },
    {
      kind: "web",
      text: "eversource.com/upload",
      sourceId: "ev-illness-pdf",
      verbatim: false,
    },
  ],
  quotes: [
    { text: evIllnessQuote1, sourceId: "ev-illness-pdf", verbatim: true },
    { text: evIllnessQuote2, sourceId: "ev-illness-pdf", verbatim: true },
    { text: evIllnessQuote3, sourceId: "ev-illness-pdf", verbatim: true },
    { text: evIllnessQuote4, sourceId: "ev-illness-pdf", verbatim: true },
    { text: evIllnessQuote5, sourceId: "ev-illness-pdf", verbatim: true },
    { text: evIllnessStatute, sourceId: "mgl-164-124a", verbatim: true },
  ],
  limits: [],
  unverified: [
    "The revision date (none shown on the opened PDF).",
    "Form code MN0324 (search index only).",
    "Fax 781-441-3686 (from a copy not downloaded — never a return channel).",
  ],
  fields: evIllnessFields,
  steps: evIllnessSteps,
  sendAttestation: "I sent this",
  claims: {
    outageNotification: false,
    shutoffProtection: true,
    restorationPriority: false,
  },
  sources: [SOURCES["ev-illness-pdf"], SOURCES["mgl-164-124a"]],
}

// ---------------------------------------------------------------------------
// wmlp-chn  (tier 1, outage-notify)  — Wellesley WMLP Critical Health Need form
// design §3; FINAL-idea.md Wellesley paragraph (no verbatim text in that source).
// ---------------------------------------------------------------------------

const WMLP_COMPANY_NAME_ON_PAGE = "Wellesley Municipal Light Plant"

const wmlpSigner = {
  text: "The customer submits the form; WMLP may ask for physician verification (not required)",
  sourceId: "wmlp",
  verbatim: false,
}

const wmlpFields: Field[] = [
  {
    key: "wmlp-chn.form-filled",
    label: "Form filled in",
    kind: "consent",
    required: true,
    note: {
      text: "field list UNVERIFIED",
      sourceId: "wmlp",
      verbatim: false,
    },
  },
]

const wmlpSteps: Step[] = [
  {
    kind: "field",
    id: "wmlp-chn.fill-form",
    label: "Fill the Critical Health Need form",
    owner: "coordinator",
    ownerText: "Coordinator",
    fields: ["wmlp-chn.form-filled"],
  },
  {
    kind: "send",
    id: "wmlp-chn.send",
    label: "Submit online or mail / bring to WMLP",
    owner: "coordinator",
    ownerText: "Coordinator",
  },
  {
    kind: "utility-wait",
    id: "wmlp-chn.wait",
    label: "Waiting for WMLP to confirm",
    owner: "utility",
    ownerText: WMLP_COMPANY_NAME_ON_PAGE,
  },
]

const wmlpChn: ProgramRecord = {
  id: "wmlp-chn",
  tier: "tier1",
  companyCode: "Wellesley Municipal Light Plant",
  companyNameOnPage: WMLP_COMPANY_NAME_ON_PAGE,
  programName: "Critical Health Need for Electricity",
  purpose: "outage-notify",
  signer: wmlpSigner,
  renewalLabel: "Renewal",
  renewal: {
    kind: "calendar-year-or-need",
    text: "The rest of this calendar year, or until the need ends, whichever is first; renew with the same form",
    sourceId: "wmlp",
    verbatim: false,
  },
  returnChannels: [
    {
      kind: "web",
      text: "Online form",
      sourceId: "wmlp",
      verbatim: false,
    },
    {
      kind: "mail",
      text: "WMLP, 4 Municipal Way, Wellesley, MA 02481",
      sourceId: "wmlp",
      verbatim: false,
    },
    {
      kind: "phone",
      text: "781-235-7600",
      sourceId: "wmlp",
      verbatim: false,
    },
  ],
  quotes: [],
  limits: [
    {
      text: "The classification does not exempt the customer from disconnection for an unpaid bill.",
      sourceId: "wmlp",
      verbatim: false,
    },
    {
      text: "WMLP may ask for physician verification.",
      sourceId: "wmlp",
      verbatim: false,
    },
  ],
  noGuarantee: {
    text: "no utility can guarantee electricity 24 hours a day",
    sourceId: "wmlp",
    verbatim: false,
  },
  unverified: ["The online form's field list (not transcribed)."],
  fields: wmlpFields,
  steps: wmlpSteps,
  sendAttestation: "I submitted the form",
  claims: {
    outageNotification: true,
    shutoffProtection: false,
    restorationPriority: false,
  },
  sources: [SOURCES["wmlp"]],
}

// ---------------------------------------------------------------------------
// Registry + rule functions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// unitil-protection  (tier 1, shutoff-protection) — task 9
// Same MALFORM-MA PDF, account-protection use. Renewal is 220 CMR 25.03 (shutoff rule);
// the 3/6/12 box stays the clinician's estimate beside it. Low-income verification is
// "if applicable": the app never decides it; only a recorded outcome answers it.
// ---------------------------------------------------------------------------

const rekey = (k: string) => k.replace(/^unitil-lifesupport\./, "unitil-protection.") as `unitil-protection.${string}`

const unitilProtectionFields: Field[] = [
  ...unitilFields.map((f) => ({
    ...f,
    key: rekey(f.key),
    requiredWhen: f.requiredWhen ? { ...f.requiredWhen, key: rekey(f.requiredWhen.key) } : undefined,
  })),
  {
    key: "unitil-protection.low-income",
    label: "Low-income verification (if applicable)",
    kind: "select",
    options: ["Verification supplied", "Utility confirmed not applicable"],
    unansweredText: "Applicability not determined",
    required: true,
  },
]

const unitilProtectionSteps: Step[] = (() => {
  const field = unitilSteps
    .filter((s): s is Extract<Step, { kind: "field" }> => s.kind === "field")
    .map((s) => ({ ...s, id: rekey(s.id), fields: s.fields.map(rekey) as [string, ...string[]] }))
  const send = unitilSteps.find((s) => s.kind === "send")!
  const wait = unitilSteps.find((s) => s.kind === "utility-wait")!
  return [
    ...field,
    {
      kind: "field",
      id: "unitil-protection.low-income-step",
      label: "Low-income verification, if applicable",
      owner: "coordinator",
      ownerText: "Coordinator",
      fields: ["unitil-protection.low-income"],
    },
    { ...send, id: rekey(send.id) },
    { ...wait, id: rekey(wait.id) },
  ]
})()

const unitilProtection: ProgramRecord = {
  ...unitilLifesupport,
  id: "unitil-protection",
  tier: "tier1",
  programName: "Massachusetts physician certificate — account protection",
  purpose: "shutoff-protection",
  renewalLabel: "Renewal",
  renewal: {
    kind: "regulation-quarterly-semiannual",
    text: "220 CMR 25.03: a serious-illness certificate is renewed quarterly; a chronic certificate every six months",
    sourceId: "cmr-25-03",
    verbatim: false,
  },
  regulationContext: undefined,
  limits: [
    {
      text: "The form's footnote says low-income verification, if applicable, is also required to get account protection.",
      sourceId: "unitil-pdf",
      verbatim: false,
    },
    {
      text: "The page does not say restoration is prioritized.",
      sourceId: "unitil-page",
      verbatim: false,
    },
  ],
  fields: unitilProtectionFields,
  steps: unitilProtectionSteps,
  claims: { outageNotification: false, shutoffProtection: true, restorationPriority: false },
}

export const PROGRAMS: ProgramRecord[] = [
  unitilLifesupport,
  unitilProtection,
  ngOutage,
  ngMedical,
  evLetter,
  evIllness,
  wmlpChn,
]

/** Answered rule (design §3 / 2.10b). */
export function isAnswered(field: Field, value: unknown): boolean {
  if (value === null || value === undefined) return false
  switch (field.kind) {
    case "text":
      return typeof value === "string" && value.trim().length > 0
    case "yes-no":
    case "select":
    case "device":
      // any chosen option, including "No", counts; "" does not
      return typeof value === "string" && value.length > 0
    case "age-months":
      return typeof value === "number" && Number.isFinite(value) && value >= 0
    case "consent":
      return value === true
  }
}

/** Required, with requiredWhen applied. */
export function isRequired(
  field: Field,
  answers: Record<string, unknown>,
): boolean {
  if (!field.required && !field.requiredWhen) return false
  if (field.requiredWhen) {
    const gate = answers[field.requiredWhen.key]
    // required unless the gate field equals the notEquals value
    return gate !== field.requiredWhen.notEquals
  }
  return field.required
}

/** Records of that company whose tier is enabled, excluding ng-paper. */
export function recordsFor(
  companyCode: string,
  enabledTiers: Tier[],
): ProgramRecord[] {
  return PROGRAMS.filter(
    (r) =>
      r.companyCode === companyCode &&
      r.id !== "ng-paper" &&
      enabledTiers.includes(r.tier),
  )
}

export function recordById(id: RecordId): ProgramRecord | undefined {
  return PROGRAMS.find((r) => r.id === id)
}



