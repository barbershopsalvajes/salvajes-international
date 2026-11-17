/** DEMO C — Automatización administrativa (simulación en el navegador). */
import { processRequest, type ALang, type AdminResult } from '../lib/adminDemo.ts';
import { trackDemo } from './journey.ts';

interface Strings {
  lang: ALang;
  sampleList: string[];
  none: string;
}

export function initAdmin(root: HTMLElement) {
  const s: Strings = JSON.parse(root.dataset.strings || '{}');
  const text = root.querySelector<HTMLTextAreaElement>('[data-admin-text]')!;
  const runBtn = root.querySelector<HTMLButtonElement>('[data-admin-run]')!;
  const steps = [...root.querySelectorAll<HTMLElement>('[data-admin-steps] li')];
  const result = root.querySelector<HTMLElement>('[data-admin-result]')!;
  const reportBox = root.querySelector<HTMLElement>('[data-admin-report]')!;
  const board = root.querySelector<HTMLElement>('[data-admin-board]')!;
  const samples = [...root.querySelectorAll<HTMLButtonElement>('[data-sample]')];
  const reduced = document.documentElement.classList.contains('reduced');
  const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  let last: AdminResult | null = null;
  let busy = false;

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;

  samples.forEach((b) =>
    b.addEventListener('click', () => {
      text.value = s.sampleList[Number(b.dataset.sample)] ?? '';
      samples.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      text.focus();
    }),
  );

  runBtn.addEventListener('click', async () => {
    const input = text.value.trim();
    if (!input || busy) {
      text.focus();
      return;
    }
    busy = true;
    runBtn.setAttribute('aria-disabled', 'true');
    trackDemo('admin');
    steps.forEach((st) => st.classList.remove('is-done'));
    board.querySelectorAll('.col').forEach((c) => c.classList.remove('is-target'));

    const r = processRequest(input, s.lang);
    last = r;

    // 1. Recibida
    steps[0].classList.add('is-done');
    await wait(500);

    // 2. Clasificada
    $('[data-r-type]').textContent = r.typeLabel;
    const prio = $('[data-r-prio]');
    prio.className = `badge badge--${r.priority}`;
    prio.textContent = r.priorityLabel;
    $('[data-r-prio-text]').textContent = r.priorityLabel;
    $('[data-r-dept]').textContent = r.department;
    $('[data-r-id]').textContent = r.id;
    $('[data-r-conf-n]').textContent = `${Math.round(r.confidence * 100)}%`;
    const conf = $('[data-r-conf]');
    conf.style.setProperty('--v', '0%');
    const ents = $('[data-r-ents]');
    ents.replaceChildren(
      ...(r.entities.length
        ? r.entities.map((e) => {
            const li = document.createElement('li');
            const b = document.createElement('b');
            b.textContent = e.label;
            li.append(b, document.createTextNode(e.value));
            return li;
          })
        : [Object.assign(document.createElement('li'), { textContent: s.none })]),
    );
    result.hidden = false;
    requestAnimationFrame(() => conf.style.setProperty('--v', `${Math.round(r.confidence * 100)}%`));
    steps[1].classList.add('is-done');
    await wait(700);

    // 3. Organizada en la bandeja del departamento
    const colType = r.type === 'other' ? 'incident' : r.type;
    const col = board.querySelector<HTMLElement>(`[data-col="${colType}"]`);
    if (col) {
      col.classList.add('is-target');
      board.querySelectorAll('.ticket--new').forEach((t) => t.classList.remove('ticket--new'));
      const tk = document.createElement('div');
      tk.className = 'ticket ticket--new';
      tk.textContent = `${r.id} · ${input.slice(0, 48)}${input.length > 48 ? '…' : ''}`;
      const badge = document.createElement('span');
      badge.className = `badge badge--${r.priority}`;
      badge.textContent = r.priorityLabel;
      tk.append(document.createElement('br'), badge);
      col.querySelector('.col-h')!.after(tk);
    }
    steps[2].classList.add('is-done');
    await wait(700);

    // 4. Informe
    $('[data-r-report]').textContent = r.report;
    reportBox.hidden = false;
    steps[3].classList.add('is-done');
    busy = false;
    runBtn.removeAttribute('aria-disabled');
  });

  $('[data-admin-dl]').addEventListener('click', () => {
    if (!last) return;
    const blob = new Blob([last.report], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${last.id}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 100);
  });
}
