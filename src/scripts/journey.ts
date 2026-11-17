/**
 * Recorrido del visitante (solo en sessionStorage, sin cookies):
 * demos probadas, resultado de la calculadora y parámetros UTM.
 * Se adjunta al formulario de diagnóstico para contextualizar la oportunidad.
 */
const KEY = 'ri-journey';

export interface Journey {
  demos: string[];
  calc: { employees: number; weeklyHours: number; hourlyCost: number; automationPct: number; annualSaving: number } | null;
  utm: Record<string, string>;
}

export function getJourney(): Journey {
  try {
    const j = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (j && typeof j === 'object') return { demos: j.demos ?? [], calc: j.calc ?? null, utm: j.utm ?? {} };
  } catch {
    /* noop */
  }
  return { demos: [], calc: null, utm: {} };
}

function save(j: Journey) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(j));
  } catch {
    /* noop */
  }
}

export function trackDemo(id: string) {
  const j = getJourney();
  if (!j.demos.includes(id)) {
    j.demos.push(id);
    save(j);
  }
}

export function setCalc(calc: Journey['calc']) {
  const j = getJourney();
  j.calc = calc;
  save(j);
  document.dispatchEvent(new CustomEvent('ri:calc', { detail: calc }));
}

export function captureUtm() {
  const params = new URLSearchParams(location.search);
  const utm: Record<string, string> = {};
  params.forEach((v, k) => {
    if (k.startsWith('utm_')) utm[k] = v.slice(0, 100);
  });
  if (Object.keys(utm).length) {
    const j = getJourney();
    j.utm = utm;
    save(j);
  }
}

/** Preselecciona un valor en el formulario de contacto y desplaza hasta él. */
export function prefillContact(field: 'service' | 'sector', value: string) {
  const sel = document.querySelector<HTMLSelectElement>(`#contact-form [name="${field}"]`);
  if (sel && [...sel.options].some((o) => o.value === value)) {
    sel.value = value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
