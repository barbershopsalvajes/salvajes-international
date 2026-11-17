/**
 * Validación y clasificación de oportunidades comerciales.
 * Se usa en el navegador (validación inmediata), en la función serverless
 * (validación autoritativa) y en la demo de automatización comercial.
 */

export interface LeadInput {
  name: string;
  company: string;
  email: string;
  phone?: string;
  country?: string;
  sector?: string;
  employees?: string;
  service?: string;
  message: string;
  consent: boolean;
  marketing?: boolean;
  lang?: 'es' | 'en';
  // Contexto del recorrido (opcional)
  page?: string;
  demos?: string[];
  calc?: { employees: number; weeklyHours: number; hourlyCost: number; automationPct: number; annualSaving: number } | null;
  utm?: Record<string, string>;
}

export type FieldError = 'required' | 'email' | 'phone' | 'consent' | 'message' | 'length';
export type Priority = 'hot' | 'warm' | 'cold';

export const LIMITS = {
  name: 100,
  company: 120,
  email: 160,
  phone: 30,
  select: 80,
  message: 3000,
  messageMin: 15,
} as const;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';

/** Normaliza un objeto arbitrario (p. ej. JSON recibido) a LeadInput. */
export function normalizeLead(raw: Record<string, unknown>): LeadInput {
  const demos = Array.isArray(raw.demos)
    ? (raw.demos as unknown[]).filter((d): d is string => typeof d === 'string').map((d) => d.slice(0, 40)).slice(0, 5)
    : [];
  let calc: LeadInput['calc'] = null;
  if (raw.calc && typeof raw.calc === 'object') {
    const c = raw.calc as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);
    calc = {
      employees: num(c.employees),
      weeklyHours: num(c.weeklyHours),
      hourlyCost: num(c.hourlyCost),
      automationPct: num(c.automationPct),
      annualSaving: num(c.annualSaving),
    };
  }
  const utm: Record<string, string> = {};
  if (raw.utm && typeof raw.utm === 'object') {
    for (const [k, v] of Object.entries(raw.utm as Record<string, unknown>)) {
      if (/^utm_[a-z]+$/.test(k) && typeof v === 'string') utm[k] = v.slice(0, 100);
    }
  }
  return {
    name: str(raw.name, LIMITS.name),
    company: str(raw.company, LIMITS.company),
    email: str(raw.email, LIMITS.email).toLowerCase(),
    phone: str(raw.phone, LIMITS.phone),
    country: str(raw.country, LIMITS.select),
    sector: str(raw.sector, LIMITS.select),
    employees: str(raw.employees, LIMITS.select),
    service: str(raw.service, LIMITS.select),
    message: str(raw.message, LIMITS.message),
    consent: raw.consent === true || raw.consent === 'true' || raw.consent === 'on',
    marketing: raw.marketing === true || raw.marketing === 'true' || raw.marketing === 'on',
    lang: raw.lang === 'en' ? 'en' : 'es',
    page: str(raw.page, 200),
    demos,
    calc,
    utm,
  };
}

export function validateLead(l: LeadInput): Partial<Record<keyof LeadInput, FieldError>> {
  const e: Partial<Record<keyof LeadInput, FieldError>> = {};
  if (l.name.length < 2) e.name = 'required';
  if (!l.company) e.company = 'required';
  if (!l.email) e.email = 'required';
  else if (!EMAIL_RE.test(l.email)) e.email = 'email';
  if (l.phone && !PHONE_RE.test(l.phone)) e.phone = 'phone';
  if (!l.country) e.country = 'required';
  if (!l.sector) e.sector = 'required';
  if (!l.employees) e.employees = 'required';
  if (!l.service) e.service = 'required';
  if (!l.message) e.message = 'required';
  else if (l.message.length < LIMITS.messageMin) e.message = 'message';
  if (!l.consent) e.consent = 'consent';
  return e;
}

const URGENT_RE = /\b(urgente|urgencia|cuanto antes|ya mismo|inmediat\w*|asap|urgent\w*|immediately|this week|esta semana|este mes|this month)\b/i;
const SIZE_POINTS: Record<string, number> = { '1–9': 10, '10–49': 20, '50–249': 30, '250+': 35 };

export interface LeadScore {
  score: number;
  priority: Priority;
  reasons: string[];
}

/**
 * Puntuación orientativa (0–100) para priorizar el seguimiento comercial.
 * Reglas transparentes y deterministas; se pueden sustituir por un modelo
 * de IA en Make sin cambiar el contrato del webhook.
 */
export function scoreLead(l: Pick<LeadInput, 'employees' | 'service' | 'message' | 'phone' | 'demos' | 'calc' | 'sector'>): LeadScore {
  let score = 0;
  const reasons: string[] = [];
  const size = SIZE_POINTS[(l.employees || '').replace('-', '–')] ?? 0;
  if (size) {
    score += size;
    reasons.push(`size:${l.employees}`);
  }
  if (l.service && !/no lo s|don't know|no se/i.test(l.service)) {
    score += 10;
    reasons.push('service_defined');
  }
  const msg = l.message || '';
  if (msg.length >= 80) {
    score += 10;
    reasons.push('detailed_need');
  }
  if (URGENT_RE.test(msg)) {
    score += 15;
    reasons.push('urgency');
  }
  if (l.phone) {
    score += 10;
    reasons.push('phone_provided');
  }
  const demos = l.demos?.length ?? 0;
  if (demos) {
    score += Math.min(10, demos * 5);
    reasons.push(`demos:${demos}`);
  }
  const saving = l.calc?.annualSaving ?? 0;
  if (saving >= 20000) {
    score += 15;
    reasons.push('calc_high');
  } else if (saving >= 5000) {
    score += 8;
    reasons.push('calc_medium');
  }
  if (l.sector && /gran empresa|enterprise/i.test(l.sector)) {
    score += 5;
    reasons.push('enterprise');
  }
  score = Math.min(100, score);
  const priority: Priority = score >= 60 ? 'hot' : score >= 35 ? 'warm' : 'cold';
  return { score, priority, reasons };
}
