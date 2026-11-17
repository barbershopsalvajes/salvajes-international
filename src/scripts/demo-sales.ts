/**
 * DEMO B — Automatización comercial.
 * Usa la MISMA función de puntuación (scoreLead) que el formulario real
 * de diagnóstico, para que la demo refleje el comportamiento del sistema.
 */
import { scoreLead, type Priority } from '../lib/lead.ts';
import { trackDemo } from './journey.ts';

interface Strings {
  lang: 'es' | 'en';
  steps: string[];
  priority: Record<Priority, string>;
  score: string;
  emailSubject: string;
  notification: string;
  urgencyOpts: string[];
  reset: string;
  labels: {
    stage: string;
    owner: string;
    source: string;
    created: string;
    stageNew: string;
    ownerAuto: string;
    web: string;
    reasons: string;
    wa: string;
    reasonsMap: Record<string, string>;
  };
}

const TPL = {
  es: {
    subject: (c: string) => `${c}: propuesta para empezar`,
    body: (n: string, need: string) =>
      `Hola ${n.split(' ')[0]},\n\nGracias por contactar. Hemos revisado tu necesidad («${need}») y tenemos ideas concretas para ayudarte.\n\n¿Te va bien una llamada de 20 minutos esta semana?\n\nUn saludo,\nEquipo comercial`,
    notif: (p: string, n: string, c: string) => `${p} · ${n} (${c}). Contactar hoy.`,
    owners: ['Comercial senior', 'Comercial', 'Marketing (nutrición)'],
  },
  en: {
    subject: (c: string) => `${c}: a proposal to get started`,
    body: (n: string, need: string) =>
      `Hi ${n.split(' ')[0]},\n\nThanks for getting in touch. We've reviewed your need ("${need}") and have concrete ideas to help.\n\nWould a 20-minute call this week work for you?\n\nBest regards,\nSales team`,
    notif: (p: string, n: string, c: string) => `${p} · ${n} (${c}). Contact today.`,
    owners: ['Senior account executive', 'Account executive', 'Marketing (nurture)'],
  },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function initSales(root: HTMLElement) {
  const s: Strings = JSON.parse(root.dataset.strings || '{}');
  const tpl = TPL[s.lang];
  const form = root.querySelector<HTMLFormElement>('[data-sales-form]')!;
  const flow = root.querySelector<HTMLElement>('[data-sales-flow]')!;
  const steps = [...flow.querySelectorAll<HTMLElement>('.flow-step')];
  const runBtn = root.querySelector<HTMLButtonElement>('[data-sales-run]')!;
  const runLabel = runBtn.innerHTML;
  const reduced = document.documentElement.classList.contains('reduced');
  const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  let running = false;
  let finished = false;

  function clear() {
    steps.forEach((st) => {
      st.classList.remove('is-active', 'is-done');
      st.querySelector('[data-out]')!.innerHTML = '';
    });
    flow.style.setProperty('--progress', '0%');
  }

  async function run() {
    if (running) return;
    if (finished) {
      clear();
      finished = false;
      runBtn.innerHTML = runLabel;
      runBtn.classList.remove('is-reset');
      return;
    }
    running = true;
    runBtn.setAttribute('aria-disabled', 'true');
    trackDemo('sales');
    clear();

    const fd = new FormData(form);
    const name = String(fd.get('name') || '—').trim().slice(0, 60) || '—';
    const company = String(fd.get('company') || '—').trim().slice(0, 60) || '—';
    const sector = String(fd.get('sector') || '');
    const employees = String(fd.get('employees') || '');
    const need = String(fd.get('need') || '').trim().slice(0, 240);
    const urgency = Number(fd.get('urgency') || 0);
    const urgencyText = s.urgencyOpts[urgency] ?? '';
    // La urgencia elegida se añade al mensaje, como haría el formulario real
    const message = `${need}${urgency === 0 ? (s.lang === 'es' ? ' — urgente, este mes' : ' — urgent, this month') : ''}`;
    const q = scoreLead({ employees, sector, service: need ? 'defined' : '', message, phone: '', demos: [], calc: null });
    const id = `LEAD-${Math.floor(1000 + Math.random() * 8999)}`;
    const owner = q.priority === 'hot' ? tpl.owners[0] : q.priority === 'warm' ? tpl.owners[1] : tpl.owners[2];
    const outs: string[] = [
      `<pre class="code">${esc(JSON.stringify({ name, company, sector, employees, need, urgency: urgencyText }, null, 2))}</pre>`,
      `<div class="out-card"><div class="score-row"><div><div class="muted" style="font-size:12px">${esc(s.score)}</div><div class="score-num">${q.score}<span class="muted" style="font-size:15px">/100</span></div></div><span class="badge badge--${q.priority}">${esc(s.priority[q.priority])}</span></div><div class="meter"><span style="--v:${q.score}%"></span></div><div class="reasons">${q.reasons
        .map((r) => `<span>${esc(s.labels.reasonsMap[r.split(':')[0]] ?? r)}</span>`)
        .join('')}</div></div>`,
      `<div class="out-card"><dl class="kv"><dt>ID</dt><dd>${id}</dd><dt>${esc(s.labels.stage)}</dt><dd>${esc(s.labels.stageNew)}</dd><dt>${esc(s.labels.owner)}</dt><dd>${esc(owner)} · ${esc(s.labels.ownerAuto)}</dd><dt>${esc(s.labels.source)}</dt><dd>${esc(s.labels.web)}</dd><dt>${esc(s.labels.created)}</dt><dd>${new Date().toLocaleString(s.lang === 'es' ? 'es-ES' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</dd></dl></div>`,
      `<div class="out-card"><p class="mail-sub">${esc(s.emailSubject)}: ${esc(tpl.subject(company))}</p><p class="mail-body">${esc(tpl.body(name, need || '—'))}</p><p class="wa-line">✓ ${esc(s.labels.wa)}</p></div>`,
      `<div class="out-card notif"><span class="badge badge--${q.priority}">${esc(s.notification)}</span><span>${esc(tpl.notif(s.priority[q.priority], name, company))}</span></div>`,
    ];

    for (let i = 0; i < steps.length; i++) {
      steps[i].classList.add('is-active');
      flow.style.setProperty('--progress', `${(i / (steps.length - 1)) * 100}%`);
      await wait(650);
      steps[i].querySelector('[data-out]')!.innerHTML = outs[i];
      steps[i].classList.remove('is-active');
      steps[i].classList.add('is-done');
      await wait(450);
    }
    running = false;
    finished = true;
    runBtn.removeAttribute('aria-disabled');
    runBtn.textContent = s.reset;
    runBtn.classList.add('is-reset');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
  });
}
