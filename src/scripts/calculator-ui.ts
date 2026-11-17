/** Calculadora de ahorro: interacción, KPI y gráfico SVG accesible. */
import { calculate, SCENARIOS, type CalcInput } from '../lib/calculator.ts';
import { setCalc } from './journey.ts';

const COST = '#5b84d6'; // coste restante (validado para CVD sobre fondo oscuro)
const SAVE = '#ec5a1c'; // ahorro
const SURFACE = '#0f1013';

interface Strings {
  lang: 'es' | 'en';
  current: string;
  withAuto: string;
  saving: string;
  annualCost: string;
  hoursUnit: string;
  perMonth: string;
}

const svgNS = 'http://www.w3.org/2000/svg';
const el = (tag: string, attrs: Record<string, string | number>) => {
  const n = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  return (steps.find((x) => n <= x) ?? 10) * p;
}

export function initCalculator(root: HTMLElement) {
  const s: Strings = JSON.parse(root.dataset.strings || '{}');
  const locale = s.lang === 'es' ? 'es-ES' : 'en-IE';
  const eur = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions);
  const eurCompact = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });
  const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions);

  const form = root.querySelector<HTMLFormElement>('[data-calc-form]')!;
  const chart = root.querySelector<HTMLElement>('[data-chart]')!;
  const tip = root.querySelector<HTMLElement>('[data-tip]')!;
  const tbody = root.querySelector<HTMLElement>('[data-table] tbody')!;
  const pctOut = root.querySelector<HTMLElement>('[data-pct-out]')!;
  const scenBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-scen]')];

  const state: CalcInput = { employees: 5, weeklyHours: 10, hourlyCost: 22, automationPct: 40 };

  const fill = (r: HTMLInputElement) => {
    const p = ((Number(r.value) - Number(r.min)) / (Number(r.max) - Number(r.min))) * 100;
    r.style.setProperty('--fill', `${Math.max(0, Math.min(100, p))}%`);
  };

  form.addEventListener('submit', (e) => e.preventDefault());
  root.querySelectorAll<HTMLInputElement>('[data-range]').forEach((r) => {
    const key = r.dataset.range as keyof CalcInput;
    fill(r);
    r.addEventListener('input', () => {
      state[key] = Number(r.value);
      const n = root.querySelector<HTMLInputElement>(`[data-num="${key}"]`);
      if (n) n.value = r.value;
      fill(r);
      update();
    });
  });
  root.querySelectorAll<HTMLInputElement>('[data-num]').forEach((n) => {
    const key = n.dataset.num as keyof CalcInput;
    n.addEventListener('input', () => {
      const v = Number(n.value);
      if (!Number.isFinite(v) || n.value === '') return;
      state[key] = v;
      const r = root.querySelector<HTMLInputElement>(`[data-range="${key}"]`);
      if (r) {
        r.value = String(Math.min(Number(r.max), Math.max(Number(r.min), v)));
        fill(r);
      }
      update();
    });
  });
  scenBtns.forEach((b) =>
    b.addEventListener('click', () => {
      state.automationPct = Number(b.dataset.scen);
      const r = root.querySelector<HTMLInputElement>('[data-range="automationPct"]')!;
      r.value = String(state.automationPct);
      fill(r);
      update();
    }),
  );

  function renderChart() {
    const cols = [{ label: s.current, pct: 0 }, ...SCENARIOS.map((p) => ({ label: `${p}%`, pct: p }))];
    const base = calculate({ ...state, automationPct: 0 }).annualCost;
    const max = niceMax(base);
    const W = Math.max(300, Math.round(chart.clientWidth || 560));
    const H = W < 460 ? 230 : 250;
    const padL = 52;
    const padB = 34;
    const padT = 26;
    const plotH = H - padB - padT;
    const band = (W - padL) / cols.length;
    const bw = Math.min(44, band * 0.42);
    const y = (v: number) => padT + plotH - (v / max) * plotH;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-hidden': 'true' });
    // Rejilla y eje Y
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i;
      const yy = y(v);
      svg.appendChild(el('line', { x1: padL, x2: W, y1: yy, y2: yy, stroke: 'rgba(255,255,255,0.08)', 'stroke-width': 1 }));
      const tx = el('text', { x: padL - 10, y: yy + 4, 'text-anchor': 'end', fill: '#74747b', 'font-size': 11 });
      tx.textContent = eurCompact.format(v);
      svg.appendChild(tx);
    }
    tbody.replaceChildren();
    cols.forEach((c, i) => {
      const remaining = base * (1 - c.pct / 100);
      const saving = base - remaining;
      const cx = padL + band * i + band / 2;
      const x = cx - bw / 2;
      const selected = c.pct === state.automationPct;
      const g = el('g', { class: 'hit', tabindex: 0, role: 'img', 'aria-label': `${c.label}: ${eur.format(remaining)}${c.pct ? ` · ${s.saving} ${eur.format(saving)}` : ''}` });
      g.appendChild(el('rect', { x: cx - band / 2, y: padT, width: band, height: plotH, fill: 'transparent' }));
      const yRem = y(remaining);
      const r = 4;
      const remTopRounded = !c.pct; // si no hay ahorro encima, el coste lleva el remate redondeado
      // Coste restante (desde la base)
      if (remaining > 0) {
        const h = plotH + padT - yRem;
        const path = remTopRounded
          ? `M${x},${yRem + r} q0,-${r} ${r},-${r} h${bw - 2 * r} q${r},0 ${r},${r} v${h - r} h-${bw} z`
          : `M${x},${yRem} h${bw} v${h} h-${bw} z`;
        g.appendChild(el('path', { d: path, fill: COST }));
      }
      // Ahorro (apilado, separado por 2px del color de fondo)
      if (saving > 0) {
        const yTop = y(base);
        const h = Math.max(0, yRem - yTop - 2);
        if (h > 0) g.appendChild(el('path', { d: `M${x},${yTop + r} q0,-${r} ${r},-${r} h${bw - 2 * r} q${r},0 ${r},${r} v${h - r} h-${bw} z`, fill: SAVE }));
      }
      // Etiqueta en el remate: ahorro (escenarios) o coste actual
      const val = el('text', { x: cx, y: y(base) - 8, 'text-anchor': 'middle', fill: '#f4f4f2', 'font-size': 12, 'font-weight': 600 });
      val.textContent = c.pct ? `−${eurCompact.format(saving)}` : eurCompact.format(base);
      // Etiquetado selectivo: coste actual y escenario seleccionado (el resto, en tooltip y tabla)
      if (!c.pct || selected) g.appendChild(val);
      const lab = el('text', { x: cx, y: H - 10, 'text-anchor': 'middle', fill: selected ? '#f4f4f2' : '#a3a3a8', 'font-size': 12, 'font-weight': selected ? 700 : 500 });
      lab.textContent = c.label;
      g.appendChild(lab);
      if (selected && c.pct) g.appendChild(el('rect', { x: cx - 12, y: H - 4, width: 24, height: 2, rx: 1, fill: '#f4f4f2' }));

      const show = () => {
        tip.innerHTML = '';
        const t1 = document.createElement('strong');
        t1.textContent = c.label;
        const t2 = document.createElement('div');
        t2.textContent = `${c.pct ? s.withAuto : s.annualCost}: ${eur.format(remaining)}`;
        tip.append(t1, t2);
        if (c.pct) {
          const t3 = document.createElement('div');
          t3.textContent = `${s.saving}: ${eur.format(saving)}`;
          tip.append(t3);
        }
        const box = chart.getBoundingClientRect();
        const fig = chart.parentElement!.getBoundingClientRect();
        tip.style.left = `${box.left - fig.left + (cx / W) * box.width}px`;
        tip.style.top = `${box.top - fig.top + (y(base) / H) * box.height - 22}px`;
        tip.hidden = false;
      };
      const hide = () => (tip.hidden = true);
      g.addEventListener('pointerenter', show);
      g.addEventListener('pointerleave', hide);
      g.addEventListener('focus', show);
      g.addEventListener('blur', hide);
      svg.appendChild(g);

      const tr = document.createElement('tr');
      [c.label, eur.format(remaining), eur.format(saving)].forEach((v, k) => {
        const td = document.createElement(k ? 'td' : 'th');
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    // fondo para el hueco de 2px
    svg.insertBefore(el('rect', { x: 0, y: 0, width: W, height: H, fill: SURFACE, opacity: 0 }), svg.firstChild);
    chart.replaceChildren(svg);
  }

  let saveTimer: number | undefined;
  function update(fromUser = true) {
    const r = calculate(state);
    const set = (k: string, v: string) => {
      const n = root.querySelector(`[data-out="${k}"]`);
      if (n) n.textContent = v;
    };
    set('monthlyHours', `${num.format(r.monthlyHours)} ${s.hoursUnit}`);
    set('monthlyCost', eur.format(r.monthlyCost));
    set('annualCost', eur.format(r.annualCost));
    set('monthlySaving', eur.format(r.monthlySaving));
    set('annualSaving', eur.format(r.annualSaving));
    set('hoursFreedMonthly', `${num.format(r.hoursFreedMonthly)} ${s.hoursUnit}${s.perMonth}`);
    pctOut.textContent = `${state.automationPct}%`;
    scenBtns.forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.scen) === state.automationPct)));
    renderChart();
    if (!fromUser) return;
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => setCalc({ ...state, annualSaving: Math.round(r.annualSaving) }), 400);
  }

  root.querySelector('[data-calc-cta]')?.addEventListener('click', () => {
    const r = calculate(state);
    setCalc({ ...state, annualSaving: Math.round(r.annualSaving) });
  });

  let rw = chart.clientWidth;
  new ResizeObserver(() => {
    if (Math.abs(chart.clientWidth - rw) > 4) {
      rw = chart.clientWidth;
      renderChart();
    }
  }).observe(chart);
  update(false);
}
