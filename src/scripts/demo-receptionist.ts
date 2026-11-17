import { initialReply, reply, type RState, type RLang } from '../lib/receptionist.ts';
import { trackDemo } from './journey.ts';

interface Strings {
  lang: RLang;
  typing: string;
  simBadge: string;
  liveBadge: string;
  simNote: string;
  liveNote: string;
  suggestions: string[];
  steps: Record<string, string>;
}

const MAX_TURNS = 18;

export function initReceptionist(root: HTMLElement) {
  const s: Strings = JSON.parse(root.dataset.strings || '{}');
  const log = root.querySelector<HTMLElement>('[data-rx-log]')!;
  const quick = root.querySelector<HTMLElement>('[data-rx-quick]')!;
  const form = root.querySelector<HTMLFormElement>('[data-rx-form]')!;
  const input = root.querySelector<HTMLInputElement>('[data-rx-input]')!;
  const stepEl = root.querySelector<HTMLElement>('[data-rx-step]')!;
  const badge = root.querySelector<HTMLElement>('[data-rx-badge]')!;
  const badgeText = root.querySelector<HTMLElement>('[data-rx-badge-text]')!;
  const note = root.querySelector<HTMLElement>('[data-rx-note]')!;
  const ints = [...root.querySelectorAll<HTMLElement>('[data-rx-int]')];

  let state: RState = { step: 'idle' };
  let live = false;
  let busy = false;
  let history: { role: 'user' | 'assistant'; content: string }[] = [];
  let tracked = false;

  const reduced = document.documentElement.classList.contains('reduced');
  const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

  function add(text: string, who: 'bot' | 'me') {
    const el = document.createElement('div');
    el.className = `msg msg--${who}`;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }
  function typing(on: boolean) {
    log.querySelector('.msg--typing')?.remove();
    if (!on) return;
    const el = document.createElement('div');
    el.className = 'msg msg--bot msg--typing';
    el.setAttribute('aria-label', s.typing);
    el.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }
  function setQuick(items: string[]) {
    quick.replaceChildren(
      ...items.map((q) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = q;
        b.addEventListener('click', () => send(q));
        return b;
      }),
    );
  }
  function setStep(step: string) {
    stepEl.textContent = s.steps[step] ?? step;
    const done = (i: number) => ints[i]?.classList.add('is-done');
    if (step === 'slot') done(0);
    if (step === 'done') ints.forEach((_, i) => done(i));
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    if (!tracked) {
      trackDemo('receptionist');
      tracked = true;
    }
    busy = true;
    add(msg, 'me');
    input.value = '';
    setQuick([]);
    typing(true);

    if (live) {
      history.push({ role: 'user', content: msg });
      if (history.length > MAX_TURNS) history = history.slice(-MAX_TURNS);
      while (history[0]?.role !== 'user') history.shift();
      try {
        const res = await fetch('/api/receptionist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: history, lang: s.lang }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.reply) throw new Error(String(res.status));
        typing(false);
        add(data.reply, 'bot');
        history.push({ role: 'assistant', content: data.reply });
        setStep('live');
        busy = false;
        return;
      } catch {
        // Si la IA falla, continuamos en simulación de forma transparente
        history.pop();
        setMode(false);
      }
    }

    const r = reply(state, msg, s.lang);
    await wait(450 + Math.min(900, r.messages.join('').length * 6));
    typing(false);
    for (let i = 0; i < r.messages.length; i++) {
      if (i) {
        typing(true);
        await wait(380);
        typing(false);
      }
      add(r.messages[i], 'bot');
    }
    state = r.state;
    setStep(state.step);
    setQuick(r.quick);
    busy = false;
  }

  function setMode(isLive: boolean) {
    live = isLive;
    badge.classList.toggle('chip--live', isLive);
    badge.classList.toggle('chip--sim', !isLive);
    badgeText.textContent = isLive ? s.liveBadge : s.simBadge;
    note.textContent = isLive ? s.liveNote : s.simNote;
  }

  function reset() {
    log.replaceChildren();
    ints.forEach((i) => i.classList.remove('is-done'));
    history = [];
    const r = initialReply(s.lang);
    state = r.state;
    add(r.messages[0], 'bot');
    setQuick(s.suggestions);
    setStep('idle');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });
  root.querySelector('[data-rx-reset]')?.addEventListener('click', reset);

  reset();
  // ¿Hay IA en vivo configurada en el servidor?
  fetch('/api/receptionist', { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : { live: false }))
    .then((d) => setMode(Boolean(d?.live)))
    .catch(() => setMode(false));
}
