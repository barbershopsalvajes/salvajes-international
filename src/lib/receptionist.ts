/**
 * DEMO A — Recepcionista inteligente (modo simulación).
 * Motor conversacional determinista que se ejecuta en el navegador cuando la
 * IA en vivo (/api/receptionist) no está configurada. Clínica ficticia.
 */
export type RLang = 'es' | 'en';

export interface RState {
  step: 'idle' | 'pain' | 'treatment' | 'slot' | 'name' | 'confirm' | 'done';
  treatment?: string;
  slot?: string;
  name?: string;
  slots?: string[];
}

export interface RReply {
  state: RState;
  messages: string[];
  quick: string[];
}

const TREATMENTS: Record<RLang, { key: string; re: RegExp; label: string; price: string }[]> = {
  es: [
    { key: 'cleaning', re: /limpieza|higiene/i, label: 'Limpieza dental', price: 'desde 60 €' },
    { key: 'whitening', re: /blanque/i, label: 'Blanqueamiento', price: 'desde 290 €' },
    { key: 'ortho', re: /ortodon|invisalign|brackets|alineador/i, label: 'Ortodoncia (primera valoración)', price: 'valoración gratuita; tratamiento tras estudio' },
    { key: 'implant', re: /implante/i, label: 'Implantes (valoración)', price: 'valoración gratuita; presupuesto tras estudio' },
    { key: 'checkup', re: /revisi|chequeo|primera visita/i, label: 'Revisión general', price: 'primera visita gratuita' },
  ],
  en: [
    { key: 'cleaning', re: /clean|hygien/i, label: 'Dental cleaning', price: 'from €60' },
    { key: 'whitening', re: /whiten/i, label: 'Teeth whitening', price: 'from €290' },
    { key: 'ortho', re: /ortho|invisalign|braces|aligner/i, label: 'Orthodontics (first assessment)', price: 'free assessment; treatment after study' },
    { key: 'implant', re: /implant/i, label: 'Implants (assessment)', price: 'free assessment; quote after study' },
    { key: 'checkup', re: /check|first visit|exam/i, label: 'General check-up', price: 'first visit free' },
  ],
};

const RX = {
  booking: /\b(cita|reserv|pedir hora|agendar|appointment|book|schedule|turno)\w*/i,
  hours: /\b(horario|hora[s]? de apertura|abr[eí]s|abiert|cerr[aá]is|hours|open|opening|close)\w*/i,
  price: /\b(precio|cuesta|cu[aá]nto|tarifa|coste|price|cost|how much|fee)\w*/i,
  pain: /\b(dolor|duele|urgenc|sangr|hinchad|flem[oó]n|roto|rota|pain|hurt|ache|toothache|emergency|bleed|swollen|broken)\w*/i,
  location: /\b(d[oó]nde|direcci[oó]n|ubicaci[oó]n|c[oó]mo llegar|parking|where|address|location|located)\w*/i,
  insurance: /\b(seguro|mutua|aseguradora|adeslas|sanitas|dkv|insurance|insurer|covered)\w*/i,
  cancel: /\b(cancel|anul|cambiar (la |mi )?cita|mover (la |mi )?cita|reschedul|change my appointment)\w*/i,
  human: /\b(persona|humano|recepcionista real|hablar con alguien|human|real person|someone|operator)\b/i,
  thanks: /\b(gracias|thank|perfecto|genial|great)\w*/i,
  hello: /^(hola|buenas|buenos d[ií]as|buenas tardes|hello|hi|hey|good (morning|afternoon|evening))\b/i,
  yes: /^(s[ií]|vale|ok|okay|confirm\w*|correcto|perfecto|yes|yep|sure|claro|de acuerdo)(?=$|[\s,.!¡])/i,
  no: /^(no|nope|cancel\w*|mejor no)(?=$|[\s,.!])/i,
};

const T = {
  es: {
    hello: '¡Hola! Soy el asistente virtual de Clínica Dental Demo. Puedo ayudarte a pedir cita, resolver dudas sobre tratamientos, precios u horarios. ¿En qué te ayudo?',
    askTreatment: 'Perfecto, te ayudo con la cita. ¿Para qué tratamiento es?',
    treatmentQuick: ['Limpieza dental', 'Revisión general', 'Blanqueamiento', 'Ortodoncia'],
    slots: (t: string) => `Muy bien: ${t}. Tengo estos huecos disponibles:`,
    slotPick: 'Elige uno (puedes escribir 1, 2 o 3).',
    askName: (s: string) => `Reservo provisionalmente ${s}. ¿A nombre de quién pongo la cita?`,
    confirm: (n: string, t: string, s: string) => `Resumen:\n• Paciente: ${n}\n• Tratamiento: ${t}\n• Fecha: ${s}\n¿Lo confirmo?`,
    done: (n: string) => `¡Listo, ${n}! Cita confirmada. Te enviaríamos ahora la confirmación por WhatsApp y un recordatorio 24 h antes. (Simulación: no se ha reservado nada real.)`,
    cancelled: 'Sin problema, no he reservado nada. ¿Puedo ayudarte con otra cosa?',
    hours: 'Nuestro horario es de lunes a viernes de 9:00 a 20:00 y los sábados de 9:00 a 14:00. ¿Quieres que te busque una cita?',
    priceGeneric: 'Te indico algunos precios orientativos (clínica de demostración):\n• Limpieza: desde 60 €\n• Blanqueamiento: desde 290 €\n• Primera visita: gratuita\n• Ortodoncia e implantes: valoración gratuita\n¿Sobre qué tratamiento quieres saber más?',
    price: (l: string, p: string) => `${l}: ${p} (precio orientativo de demostración). El precio final se confirma tras la valoración. ¿Quieres reservar cita?`,
    pain: 'Siento que estés con dolor. Tenemos huecos de urgencia cada día: puedo reservarte hoy mismo. Si tienes fiebre alta, una inflamación que dificulta tragar o respirar, o un traumatismo fuerte, acude a urgencias o llama al 112.\n¿Te reservo una cita de urgencia?',
    painQuick: ['Sí, cita de urgencia', 'No, gracias'],
    location: 'Esta es una clínica de demostración, así que no tiene dirección real. En la versión real, el asistente envía la dirección, un enlace a Google Maps e indicaciones de parking.',
    insurance: 'Trabajamos con las principales aseguradoras. Dime cuál tienes y lo verifico (en la versión real, el asistente consulta tu lista de convenios).',
    cancel: 'Claro. Para cambiar o cancelar una cita, dime tu nombre y la fecha actual. En la versión real, el asistente localiza la cita en tu agenda y propone nuevas fechas automáticamente.',
    human: 'Por supuesto. Paso la conversación a una persona del equipo con todo el contexto para que no tengas que repetir nada. (Simulación: en la versión real, recepción recibe un aviso al instante.)',
    thanks: '¡A ti! Si necesitas algo más, aquí estoy.',
    fallback: 'Puedo ayudarte con citas, precios, horarios, seguros o urgencias. ¿Qué necesitas?',
    mainQuick: ['Quiero pedir cita', '¿Cuál es vuestro horario?', '¿Cuánto cuesta una limpieza?', 'Hablar con una persona'],
    urgentLabel: 'Urgencia dental',
    days: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    fmt: (d: string, n: number, m: string, h: string) => `${d} ${n} de ${m} a las ${h}`,
    today: (h: string) => `hoy a las ${h}`,
    yesNo: ['Sí, confirmar', 'No, cancelar'],
    nameInvalid: 'Necesito un nombre para la cita. ¿Cómo te llamas?',
  },
  en: {
    hello: "Hi! I'm the virtual assistant for Demo Dental Clinic. I can help you book an appointment and answer questions about treatments, prices or opening hours. How can I help?",
    askTreatment: "Great, let's book your appointment. Which treatment is it for?",
    treatmentQuick: ['Dental cleaning', 'General check-up', 'Teeth whitening', 'Orthodontics'],
    slots: (t: string) => `Got it: ${t}. These slots are available:`,
    slotPick: 'Pick one (you can type 1, 2 or 3).',
    askName: (s: string) => `I've provisionally held ${s}. Whose name should the appointment be under?`,
    confirm: (n: string, t: string, s: string) => `Summary:\n• Patient: ${n}\n• Treatment: ${t}\n• Date: ${s}\nShall I confirm it?`,
    done: (n: string) => `All set, ${n}! Appointment confirmed. We'd now send a WhatsApp confirmation and a reminder 24 h before. (Simulation: nothing real has been booked.)`,
    cancelled: "No problem, I haven't booked anything. Can I help with anything else?",
    hours: "We're open Monday to Friday 9:00–20:00 and Saturdays 9:00–14:00. Would you like me to find you an appointment?",
    priceGeneric: 'Here are some indicative prices (demo clinic):\n• Cleaning: from €60\n• Whitening: from €290\n• First visit: free\n• Orthodontics and implants: free assessment\nWhich treatment would you like to know more about?',
    price: (l: string, p: string) => `${l}: ${p} (indicative demo price). The final price is confirmed after assessment. Would you like to book?`,
    pain: "I'm sorry you're in pain. We keep emergency slots every day — I can book you in today. If you have a high fever, swelling that makes swallowing or breathing difficult, or a serious injury, go to A&E or call 112.\nShall I book an emergency appointment?",
    painQuick: ['Yes, emergency appointment', 'No, thanks'],
    location: "This is a demo clinic, so it has no real address. In the real version, the assistant sends the address, a Google Maps link and parking directions.",
    insurance: 'We work with the main insurers. Tell me which one you have and I will check it (in the real version, the assistant checks your list of agreements).',
    cancel: 'Of course. To change or cancel an appointment, tell me your name and the current date. In the real version, the assistant finds the appointment in your calendar and suggests new dates automatically.',
    human: "Of course. I'm handing the conversation to a team member with the full context so you don't have to repeat yourself. (Simulation: in the real version, reception is alerted instantly.)",
    thanks: "You're welcome! I'm here if you need anything else.",
    fallback: 'I can help with appointments, prices, opening hours, insurance or emergencies. What do you need?',
    mainQuick: ["I'd like to book an appointment", 'What are your opening hours?', 'How much is a cleaning?', 'Talk to a person'],
    urgentLabel: 'Dental emergency',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fmt: (d: string, n: number, m: string, h: string) => `${d} ${n} ${m} at ${h}`,
    today: (h: string) => `today at ${h}`,
    yesNo: ['Yes, confirm', 'No, cancel'],
    nameInvalid: 'I need a name for the appointment. What is your name?',
  },
};

/** Genera 3 huecos en próximos días laborables (lunes–sábado). */
export function nextSlots(lang: RLang, now: Date, urgent = false): string[] {
  const t = T[lang];
  if (urgent) return [t.today('17:30'), t.today('19:00'), t.today('19:30')];
  const hours = ['10:00', '12:30', '17:00'];
  const out: string[] = [];
  const d = new Date(now);
  while (out.length < 3) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue; // domingo cerrado
    const h = d.getDay() === 6 ? '10:30' : hours[out.length];
    out.push(t.fmt(t.days[d.getDay()], d.getDate(), t.months[d.getMonth()], h));
  }
  return out;
}

function findTreatment(lang: RLang, text: string) {
  return TREATMENTS[lang].find((tr) => tr.re.test(text));
}

export function initialReply(lang: RLang): RReply {
  return { state: { step: 'idle' }, messages: [T[lang].hello], quick: T[lang].mainQuick };
}

export function reply(state: RState, input: string, lang: RLang, now = new Date()): RReply {
  const t = T[lang];
  const text = input.trim().slice(0, 500);
  const idle = (messages: string[], quick = t.mainQuick): RReply => ({ state: { step: 'idle' }, messages, quick });

  // Flujo de reserva en curso
  if (state.step === 'treatment') {
    if (RX.no.test(text)) return idle([t.cancelled]);
    const tr = findTreatment(lang, text);
    const label = tr?.label ?? (text.length > 2 ? text.charAt(0).toUpperCase() + text.slice(1, 60) : '');
    if (!label) return { state, messages: [t.askTreatment], quick: t.treatmentQuick };
    const slots = nextSlots(lang, now);
    return {
      state: { step: 'slot', treatment: label, slots },
      messages: [t.slots(label), slots.map((s, i) => `${i + 1}. ${s}`).join('\n'), t.slotPick],
      quick: slots.map((_, i) => String(i + 1)),
    };
  }
  if (state.step === 'slot') {
    if (RX.no.test(text)) return idle([t.cancelled]);
    const slots = state.slots ?? [];
    const n = Number((text.match(/\b([1-3])\b/) || [])[1]);
    const byText = slots.find((s) => s.toLowerCase().includes(text.toLowerCase()) && text.length > 3);
    const slot = n ? slots[n - 1] : byText;
    if (!slot) return { state, messages: [t.slotPick], quick: slots.map((_, i) => String(i + 1)) };
    return { state: { ...state, step: 'name', slot }, messages: [t.askName(slot)], quick: [] };
  }
  if (state.step === 'name') {
    const name = text.replace(/^(me llamo|soy|a nombre de|my name is|i am|i'm|it's)\s+/i, '').replace(/[^\p{L}\s'.-]/gu, '').trim().slice(0, 60);
    if (name.length < 2) return { state, messages: [t.nameInvalid], quick: [] };
    const pretty = name.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      state: { ...state, step: 'confirm', name: pretty },
      messages: [t.confirm(pretty, state.treatment ?? '', state.slot ?? '')],
      quick: t.yesNo,
    };
  }
  if (state.step === 'confirm') {
    if (RX.yes.test(text)) return { state: { step: 'done' }, messages: [t.done(state.name ?? '')], quick: t.mainQuick };
    if (RX.no.test(text)) return idle([t.cancelled]);
    return { state, messages: [t.confirm(state.name ?? '', state.treatment ?? '', state.slot ?? '')], quick: t.yesNo };
  }

  // Intenciones generales (orden = prioridad)
  if (state.step === 'pain') {
    if (RX.yes.test(text)) {
      const slots = nextSlots(lang, now, true);
      return {
        state: { step: 'slot', treatment: t.urgentLabel, slots },
        messages: [t.slots(t.urgentLabel), slots.map((s, i) => `${i + 1}. ${s}`).join('\n'), t.slotPick],
        quick: ['1', '2', '3'],
      };
    }
    if (RX.no.test(text)) return idle([t.cancelled]);
  }
  if (RX.pain.test(text)) return { state: { step: 'pain' }, messages: [t.pain], quick: t.painQuick };
  if (RX.human.test(text)) return idle([t.human]);
  if (RX.cancel.test(text)) return idle([t.cancel]);
  const tr = findTreatment(lang, text);
  if (RX.price.test(text)) return idle([tr ? t.price(tr.label, tr.price) : t.priceGeneric], tr ? [t.mainQuick[0]] : t.treatmentQuick);
  if (RX.booking.test(text)) {
    if (tr) return reply({ step: 'treatment' }, text, lang, now);
    return { state: { step: 'treatment' }, messages: [t.askTreatment], quick: t.treatmentQuick };
  }
  if (RX.hours.test(text)) return idle([t.hours], [t.mainQuick[0]]);
  if (RX.location.test(text)) return idle([t.location]);
  if (RX.insurance.test(text)) return idle([t.insurance]);
  if (tr) return idle([t.price(tr.label, tr.price)], [t.mainQuick[0]]);
  if (RX.thanks.test(text)) return idle([t.thanks]);
  if (RX.hello.test(text)) return idle([t.hello]);
  return idle([t.fallback]);
}
