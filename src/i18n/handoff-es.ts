/**
 * LifeLine Power — Spanish Handoff Translations (Prepared for Tier 1/2)
 *
 * Sourced: Census ACS S1601 & MassGIS EJ dataset (Lawrence ~94%, Chelsea ~92% Spanish).
 *
 * CRITICAL BOUNDARY RULES:
 * 1. ONLY app-authored handoff labels and headings are translated here.
 * 2. NEVER translate quoted utility text, statutory language (M.G.L. c.164 §124A, 220 CMR 25.03),
 *    addresses, or utility-specific instructions.
 * 3. Any English statutory or utility-quoted section rendered on the Spanish printout
 *    MUST carry the verbatim label: "Texto original en inglés".
 */

export interface HandoffLabels {
  headings: {
    title: string
    town: string
    company: string
    program: string
    purpose: string
    renewal: string
    answers: string
    tracker: string
    languageSetBy: string
  }
  nextStep: {
    label: string
    ownerPrefix: string
  }
  owners: {
    coordinator: string
    clinician: string
    utility: string
    waitingForUtility: (company: string) => string
  }
  steps: {
    heading: string
    statusDone: string
    statusPending: string
    notAnswered: string
  }
  sendItTo: {
    heading: string
    fax: string
    mail: string
    online: string
    upload: string
  }
  sources: {
    heading: string
    originalTextNotice: string
  }
  honestLimits: {
    heading: string
    noGuaranteeSummary: string
    onlyUtilityConfirms: (company: string) => string
    statutorySeparationNotice: string
  }
  /** Explicitly flagged phrases for team review */
  flaggedPhrases: Array<{ english: string; spanish: string; note: string }>
}

export const HANDOFF_LABELS_ES: HandoffLabels = {
  headings: {
    title: "Hoja de transferencia — hogar sintético de demostración",
    town: "Municipio",
    company: "Compañía de electricidad",
    program: "Programa de asistencia médica",
    purpose: "Propósito del trámite",
    renewal: "Período de renovación",
    answers: "Respuestas registradas",
    tracker: "Estado del trámite",
    languageSetBy: "establecido por el coordinador",
  },
  nextStep: {
    label: "Siguiente paso",
    ownerPrefix: "Responsable",
  },
  owners: {
    coordinator: "Coordinador de atención",
    clinician: "Médico, asistente médico o enfermero practicante",
    utility: "Empresa de servicios públicos",
    waitingForUtility: (company: string) => `Esperando confirmación de ${company}`,
  },
  steps: {
    heading: "Pasos del trámite",
    statusDone: "Completado",
    statusPending: "Pendiente",
    notAnswered: "Sin responder",
  },
  sendItTo: {
    heading: "Canales de entrega (dónde enviar)",
    fax: "Fax",
    mail: "Correo postal",
    online: "Formulario en línea",
    upload: "Portal de carga digital",
  },
  sources: {
    heading: "Fuentes oficiales consultadas",
    originalTextNotice: "Texto original en inglés",
  },
  honestLimits: {
    heading: "Avisos de límites y seguridad",
    noGuaranteeSummary:
      "Aviso: La inscripción en listas de notificación no garantiza suministro ininterrumpido de electricidad ni prioridad de restablecimiento.",
    onlyUtilityConfirms: (company: string) =>
      `Solo ${company} puede confirmar la inscripción definitiva.`,
    statutorySeparationNotice:
      "La protección contra cortes por factura impaga se rige por un trámite separado (220 CMR 25.03).",
  },
  flaggedPhrases: [
    {
      english: "Handoff — synthetic demo household",
      spanish: "Hoja de transferencia — hogar sintético de demostración",
      note: "Flagged: 'Hoja de transferencia' matches clinical handoff routing slip; verify if 'Hoja de derivación' or 'Hoja de entrega' is preferred by elder-care agencies.",
    },
    {
      english: "Care coordinator",
      spanish: "Coordinador de atención",
      note: "Flagged: Common Massachusetts CHW / ASUP title is 'Coordinador de atención de salud' or 'Coordinador de servicios'.",
    },
    {
      english: "set by coordinator",
      spanish: "establecido por el coordinador",
      note: "Flagged: Verbatim match for R8.7 / types.ts.",
    },
  ],
}
