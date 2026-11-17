/**
 * DEMO C — Automatización administrativa (simulación en el navegador).
 * Clasifica una solicitud, extrae datos clave, la asigna y genera un informe.
 * En producción, este paso lo realiza un modelo de IA dentro de Make.
 */
export type ALang = 'es' | 'en';
export type ReqType = 'invoice' | 'incident' | 'quote' | 'hr' | 'other';
export type ReqPriority = 'high' | 'medium' | 'low';

export interface Entity {
  label: string;
  value: string;
}

export interface AdminResult {
  type: ReqType;
  typeLabel: string;
  priority: ReqPriority;
  priorityLabel: string;
  department: string;
  confidence: number; // 0–1
  entities: Entity[];
  summary: string;
  nextActions: string[];
  report: string;
  id: string;
}

const RULES: Record<ReqType, RegExp[]> = {
  invoice: [/factura|invoice/i, /pago|payment|pay\b/i, /vence|vencimiento|due/i, /proveedor|supplier/i, /€|eur\b|importe|amount/i, /abono|transferencia|transfer/i],
  incident: [/no funciona|not work|has not worked|averi|broken|roto|caído|down\b|error|fallo|failure/i, /urgente|urgent/i, /incidencia|incident|problema|problem|issue/i, /perdiendo|losing/i, /datáfono|terminal|ordenador|computer|impresora|printer|wifi|internet|servidor|server/i],
  quote: [/presupuesto|quote|quotation|cotizaci/i, /preparar|prepare|could you|podéis|podrías/i, /habitaci|rooms?\b|personas|people|grupo|group|unidades|units/i, /precio|price|tarifa|rate/i],
  hr: [/vacaciones|holiday|leave|permiso|baja\b|sick/i, /nómina|payroll|contrato|contract|horario|shift|turno/i, /aprob|approve|rrhh|hr\b|recursos humanos|human resources/i],
  other: [],
};

const LABELS = {
  es: {
    type: { invoice: 'Factura de proveedor', incident: 'Incidencia operativa', quote: 'Solicitud de presupuesto', hr: 'Recursos humanos', other: 'Consulta general' },
    priority: { high: 'Alta', medium: 'Media', low: 'Baja' },
    dept: { invoice: 'Administración y finanzas', incident: 'Operaciones / Soporte técnico', quote: 'Comercial', hr: 'Recursos humanos', other: 'Dirección / Recepción' },
    actions: {
      invoice: ['Registrar factura en contabilidad', 'Solicitar aprobación al responsable', 'Programar recordatorio de pago antes del vencimiento'],
      incident: ['Abrir ticket de soporte', 'Notificar al técnico de guardia', 'Informar al solicitante del tiempo estimado'],
      quote: ['Comprobar disponibilidad', 'Generar propuesta con tarifas vigentes', 'Enviar presupuesto y programar seguimiento a 48 h'],
      hr: ['Registrar solicitud en el sistema de RR. HH.', 'Enviar a aprobación del responsable directo', 'Actualizar calendario del equipo'],
      other: ['Asignar a un responsable', 'Responder acuse de recibo al remitente'],
    },
    ent: { amount: 'Importe', date: 'Fecha', ref: 'Referencia', email: 'Correo', phone: 'Teléfono', qty: 'Cantidad', place: 'Ubicación', who: 'Proveedor / entidad' },
    summary: (tl: string, d: string, p: string) => `${tl} asignada a ${d} con prioridad ${p.toLowerCase()}.`,
    reportTitle: 'INFORME AUTOMÁTICO DE SOLICITUD',
    rows: ['ID', 'Fecha de proceso', 'Tipo', 'Prioridad', 'Departamento', 'Confianza', 'Resumen', 'Datos extraídos', 'Acciones siguientes', 'Texto original'],
    footer: 'Generado automáticamente (demo de RESUELVE INTELLECT). Requiere revisión humana en casos de baja confianza.',
  },
  en: {
    type: { invoice: 'Supplier invoice', incident: 'Operational incident', quote: 'Quote request', hr: 'Human resources', other: 'General enquiry' },
    priority: { high: 'High', medium: 'Medium', low: 'Low' },
    dept: { invoice: 'Admin & finance', incident: 'Operations / IT support', quote: 'Sales', hr: 'Human resources', other: 'Management / Reception' },
    actions: {
      invoice: ['Record invoice in accounting', 'Request approval from manager', 'Schedule payment reminder before due date'],
      incident: ['Open support ticket', 'Notify on-call technician', 'Tell the requester the estimated time'],
      quote: ['Check availability', 'Generate proposal with current rates', 'Send quote and schedule 48 h follow-up'],
      hr: ['Log request in the HR system', 'Send to line manager for approval', 'Update team calendar'],
      other: ['Assign an owner', 'Send acknowledgement to sender'],
    },
    ent: { amount: 'Amount', date: 'Date', ref: 'Reference', email: 'Email', phone: 'Phone', qty: 'Quantity', place: 'Location', who: 'Supplier / entity' },
    summary: (tl: string, d: string, p: string) => `${tl} assigned to ${d} with ${p.toLowerCase()} priority.`,
    reportTitle: 'AUTOMATIC REQUEST REPORT',
    rows: ['ID', 'Processed at', 'Type', 'Priority', 'Department', 'Confidence', 'Summary', 'Extracted data', 'Next actions', 'Original text'],
    footer: 'Automatically generated (RESUELVE INTELLECT demo). Low-confidence cases require human review.',
  },
} as const;

const uniq = (a: string[]) => [...new Set(a.map((s) => s.trim()))].filter(Boolean);

export function extractEntities(text: string, lang: ALang): Entity[] {
  const L = LABELS[lang].ent;
  const out: Entity[] = [];
  const amounts = uniq(text.match(/(?:€\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|eur(?:os)?\b))/gi) ?? []);
  amounts.forEach((v) => out.push({ label: L.amount, value: v }));
  const monthRe = '(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)';
  const dates = uniq([
    ...(text.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g) ?? []),
    ...(text.match(new RegExp(`\\b(?:del |from )?\\d{1,2}(?: (?:al|to|-) \\d{1,2})?(?: de)? ${monthRe}\\b`, 'gi')) ?? []),
  ]);
  dates.forEach((v) => out.push({ label: L.date, value: v.replace(/^(del|from) /i, '') }));
  const refs = uniq(text.match(/\b[A-Z]{1,4}-\d{2,4}(?:-\d{1,6})?\b/g) ?? []);
  refs.forEach((v) => out.push({ label: L.ref, value: v }));
  (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []).forEach((v) => out.push({ label: L.email, value: v }));
  (text.match(/\+?\d[\d\s]{8,14}\d/g) ?? []).filter((v) => !amounts.some((a) => a.includes(v))).forEach((v) => out.push({ label: L.phone, value: v }));
  const qty = text.match(/\b(\d{1,4})\s+(habitaciones?(?: dobles?| individuales?)?|double rooms?|rooms?|personas|people|unidades|units|plazas)\b/i);
  if (qty) out.push({ label: L.qty, value: `${qty[1]} ${qty[2]}` });
  const place = text.match(/\b(?:tienda|store|oficina|office|sede|local)\s+(?:de\s+)?([A-ZÁÉÍÓÚ][\wáéíóúñ]+|downtown|central)/);
  if (place) out.push({ label: L.place, value: place[0] });
  const who = text.match(/\b(?:proveedor|supplier)\s+([A-ZÁÉÍÓÚ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][\wáéíóúñ]+)*)/);
  if (who) out.push({ label: L.who, value: who[1] });
  return out;
}

export function classify(text: string): { type: ReqType; confidence: number } {
  let best: ReqType = 'other';
  let bestScore = 0;
  let total = 0;
  for (const [type, rules] of Object.entries(RULES) as [ReqType, RegExp[]][]) {
    const score = rules.reduce((n, r) => n + (r.test(text) ? 1 : 0), 0);
    total += score;
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  if (bestScore === 0) return { type: 'other', confidence: 0.4 };
  const confidence = Math.min(0.98, 0.55 + (bestScore / Math.max(total, 1)) * 0.25 + bestScore * 0.05);
  return { type: best, confidence: Math.round(confidence * 100) / 100 };
}

export function prioritize(text: string, type: ReqType): ReqPriority {
  if (/urgente|urgent|asap|inmediat|immediately|perdiendo|losing|no funciona|not work/i.test(text)) return 'high';
  if (type === 'invoice' || type === 'quote') return 'medium';
  if (type === 'hr') return 'medium';
  return 'low';
}

export function processRequest(text: string, lang: ALang, now = new Date()): AdminResult {
  const L = LABELS[lang];
  const clean = text.trim().slice(0, 2000);
  const { type, confidence } = classify(clean);
  const priority = prioritize(clean, type);
  const entities = extractEntities(clean, lang);
  const department = L.dept[type];
  const typeLabel = L.type[type];
  const priorityLabel = L.priority[priority];
  const summary = L.summary(typeLabel, department, priorityLabel);
  const nextActions = [...L.actions[type]];
  const id = `REQ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.abs(hash(clean)) % 10000).padStart(4, '0')}`;
  const [rId, rDate, rType, rPrio, rDept, rConf, rSum, rEnt, rAct, rOrig] = L.rows;
  const report = [
    L.reportTitle,
    '='.repeat(L.reportTitle.length),
    `${rId}: ${id}`,
    `${rDate}: ${now.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB')}`,
    `${rType}: ${typeLabel}`,
    `${rPrio}: ${priorityLabel}`,
    `${rDept}: ${department}`,
    `${rConf}: ${Math.round(confidence * 100)}%`,
    '',
    `${rSum}:`,
    summary,
    '',
    `${rEnt}:`,
    ...(entities.length ? entities.map((e) => `- ${e.label}: ${e.value}`) : ['-']),
    '',
    `${rAct}:`,
    ...nextActions.map((a, i) => `${i + 1}. ${a}`),
    '',
    `${rOrig}:`,
    `"${clean}"`,
    '',
    L.footer,
  ].join('\n');
  return { type, typeLabel, priority, priorityLabel, department, confidence, entities, summary, nextActions, report, id };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
