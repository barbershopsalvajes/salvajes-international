/**
 * Animación del hero: sistemas empresariales orbitando en 3D alrededor de un
 * núcleo inteligente; pulsos de datos viajan por las conexiones.
 * Canvas 2D con proyección en perspectiva. Se pausa fuera de pantalla y
 * respeta prefers-reduced-motion.
 */
interface Node3 {
  label: string;
  angle: number;
  y: number;
  r: number;
  ring: 0 | 1;
}
interface Pulse {
  node: number;
  t: number;
  speed: number;
  out: boolean;
}
interface Dust {
  x: number;
  y: number;
  z: number;
}

const ORANGE = [255, 106, 43];
const BLUE = [92, 150, 255];

export function initHeroCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const labels: string[] = JSON.parse(canvas.dataset.nodes || '[]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nodes: Node3[] = [
    ...labels.map((label, i) => ({ label, angle: (i / labels.length) * Math.PI * 2, y: (i % 2 ? 1 : -1) * (40 + (i % 3) * 22), r: 1, ring: 0 as const })),
    ...Array.from({ length: 6 }, (_, i) => ({ label: '', angle: (i / 6) * Math.PI * 2 + 0.4, y: (i % 2 ? 1 : -1) * 18, r: 0.52, ring: 1 as const })),
  ];
  const dust: Dust[] = Array.from({ length: 140 }, () => ({
    x: (Math.random() - 0.5) * 1800,
    y: (Math.random() - 0.5) * 1100,
    z: (Math.random() - 0.5) * 1400,
  }));
  const pulses: Pulse[] = [];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let cx = 0;
  let cy = 0;
  let scale = 1;
  let rot = 0;
  let tiltTarget = 0.42;
  let tilt = 0.42;
  let yawOffset = 0;
  let yawTarget = 0;
  let running = false;
  let visible = true;
  let last = performance.now();
  let spawnAcc = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mobile = w < 860;
    cx = mobile ? w * 0.5 : Math.max(w * 0.72, w - 420);
    cy = mobile ? Math.min(h * 0.24, 230) : h * 0.48;
    scale = mobile ? Math.min(w / 760, 0.62) : Math.min(w / 1700, h / 980, 0.95);
    if (reduced) draw(0);
  }

  function project(x: number, y: number, z: number) {
    // rotación Y (órbita) + inclinación X
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const y2 = y * cosT - z * sinT;
    const z2 = y * sinT + z * cosT;
    const f = 900 / (900 + z2);
    return { x: cx + x * f * scale, y: cy + y2 * f * scale, z: z2, f };
  }

  function nodePos(n: Node3) {
    const R = 330 * n.r;
    const a = n.angle + rot * (n.ring ? -1.6 : 1) + yawOffset;
    return project(Math.cos(a) * R, n.y, Math.sin(a) * R);
  }

  const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function draw(dt: number) {
    ctx!.clearRect(0, 0, w, h);
    rot += dt * 0.00009;
    tilt += (tiltTarget - tilt) * 0.04;
    yawOffset += (yawTarget - yawOffset) * 0.04;

    // Polvo / estrellas
    for (const d of dust) {
      const p = project(d.x, d.y, d.z + 200);
      if (p.f <= 0) continue;
      const a = Math.max(0, Math.min(0.45, (p.f - 0.4) * 0.5));
      ctx!.fillStyle = `rgba(255,255,255,${a})`;
      ctx!.fillRect(p.x, p.y, 1.2 * p.f, 1.2 * p.f);
    }

    const core = project(0, 0, 0);
    const pos = nodes.map(nodePos);

    // Órbitas
    for (const [R, alpha] of [
      [330, 0.1],
      [172, 0.08],
      [470, 0.05],
    ] as const) {
      ctx!.beginPath();
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        const p = project(Math.cos(a) * R, 0, Math.sin(a) * R);
        i ? ctx!.lineTo(p.x, p.y) : ctx!.moveTo(p.x, p.y);
      }
      ctx!.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx!.lineWidth = 1;
      ctx!.stroke();
    }

    // Conexiones nodo → núcleo y entre nodos vecinos del anillo exterior
    const outer = nodes.map((n, i) => (n.ring === 0 ? i : -1)).filter((i) => i >= 0);
    outer.forEach((i, k) => {
      const a = pos[i];
      const b = pos[outer[(k + 1) % outer.length]];
      const depth = Math.max(0.05, Math.min(1, (a.f - 0.6) * 1.6));
      ctx!.strokeStyle = `rgba(255,255,255,${0.05 * depth})`;
      ctx!.beginPath();
      ctx!.moveTo(a.x, a.y);
      ctx!.lineTo(b.x, b.y);
      ctx!.stroke();
    });
    nodes.forEach((n, i) => {
      const p = pos[i];
      const depth = Math.max(0.08, Math.min(1, (p.f - 0.6) * 1.8));
      const g = ctx!.createLinearGradient(p.x, p.y, core.x, core.y);
      g.addColorStop(0, `rgba(255,255,255,${0.16 * depth})`);
      g.addColorStop(1, rgba(ORANGE, 0.3 * depth));
      ctx!.strokeStyle = g;
      ctx!.lineWidth = n.ring ? 0.8 : 1.1;
      ctx!.beginPath();
      // curva suave hacia el núcleo
      const mx = (p.x + core.x) / 2;
      const my = (p.y + core.y) / 2 - 24 * scale;
      ctx!.moveTo(p.x, p.y);
      ctx!.quadraticCurveTo(mx, my, core.x, core.y);
      ctx!.stroke();
    });

    // Pulsos de datos
    spawnAcc += dt;
    if (spawnAcc > 260 && pulses.length < 26) {
      spawnAcc = 0;
      pulses.push({ node: Math.floor(Math.random() * nodes.length), t: 0, speed: 0.00045 + Math.random() * 0.0005, out: Math.random() < 0.4 });
    }
    for (let k = pulses.length - 1; k >= 0; k--) {
      const pu = pulses[k];
      pu.t += dt * pu.speed;
      if (pu.t >= 1) {
        pulses.splice(k, 1);
        continue;
      }
      const p = pos[pu.node];
      const tt = pu.out ? 1 - pu.t : pu.t;
      const mx = (p.x + core.x) / 2;
      const my = (p.y + core.y) / 2 - 24 * scale;
      const x = (1 - tt) * (1 - tt) * p.x + 2 * (1 - tt) * tt * mx + tt * tt * core.x;
      const y = (1 - tt) * (1 - tt) * p.y + 2 * (1 - tt) * tt * my + tt * tt * core.y;
      const col = pu.out ? BLUE : ORANGE;
      const rad = 10 * scale + 4;
      const glow = ctx!.createRadialGradient(x, y, 0, x, y, rad);
      glow.addColorStop(0, rgba(col, 0.9));
      glow.addColorStop(1, rgba(col, 0));
      ctx!.fillStyle = glow;
      ctx!.beginPath();
      ctx!.arc(x, y, rad, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = '#fff';
      ctx!.beginPath();
      ctx!.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx!.fill();
    }

    // Núcleo
    const t = performance.now() / 1000;
    const coreR = 46 * scale + 10;
    const halo = ctx!.createRadialGradient(core.x, core.y, 0, core.x, core.y, coreR * 4.2);
    halo.addColorStop(0, rgba(ORANGE, 0.42));
    halo.addColorStop(0.35, rgba(ORANGE, 0.1));
    halo.addColorStop(1, rgba(ORANGE, 0));
    ctx!.fillStyle = halo;
    ctx!.beginPath();
    ctx!.arc(core.x, core.y, coreR * 4.2, 0, Math.PI * 2);
    ctx!.fill();
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.5 + i / 3) % 1;
      ctx!.strokeStyle = rgba(ORANGE, 0.45 * (1 - ph));
      ctx!.lineWidth = 1.2;
      ctx!.beginPath();
      ctx!.arc(core.x, core.y, coreR * (1 + ph * 1.6), 0, Math.PI * 2);
      ctx!.stroke();
    }
    const body = ctx!.createRadialGradient(core.x - coreR * 0.35, core.y - coreR * 0.4, coreR * 0.1, core.x, core.y, coreR);
    body.addColorStop(0, '#ffd2b0');
    body.addColorStop(0.35, '#ff7a35');
    body.addColorStop(1, '#a92e05');
    ctx!.fillStyle = body;
    ctx!.beginPath();
    ctx!.arc(core.x, core.y, coreR, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = 'rgba(10,10,12,0.85)';
    ctx!.font = `700 ${Math.round(coreR * 0.62)}px Inter Variable, Inter, system-ui, sans-serif`;
    ctx!.textAlign = 'center';
    ctx!.textBaseline = 'middle';
    ctx!.fillText('RI', core.x, core.y + 1);

    // Nodos (ordenados por profundidad: los lejanos primero)
    const order = nodes.map((_, i) => i).sort((a, b) => pos[b].z - pos[a].z);
    for (const i of order) {
      const n = nodes[i];
      const p = pos[i];
      const depth = Math.max(0.15, Math.min(1, (p.f - 0.62) * 1.9));
      if (n.ring === 1) {
        ctx!.fillStyle = rgba(BLUE, 0.75 * depth);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 3 * p.f, 0, Math.PI * 2);
        ctx!.fill();
        continue;
      }
      const fs = Math.max(10, Math.round(12.5 * Math.min(1.15, p.f) * Math.max(scale, 0.8)));
      ctx!.font = `500 ${fs}px JetBrains Mono Variable, ui-monospace, monospace`;
      const tw = ctx!.measureText(n.label).width;
      const pw = tw + 30;
      const ph = fs + 14;
      const x = p.x - pw / 2;
      const y = p.y - ph / 2;
      ctx!.fillStyle = `rgba(19,20,24,${0.55 + 0.4 * depth})`;
      ctx!.strokeStyle = `rgba(255,255,255,${0.1 + 0.22 * depth})`;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.roundRect(x, y, pw, ph, ph / 2);
      ctx!.fill();
      ctx!.stroke();
      ctx!.fillStyle = rgba(ORANGE, depth);
      ctx!.beginPath();
      ctx!.arc(x + 11, p.y, 2.6, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = `rgba(244,244,242,${0.35 + 0.65 * depth})`;
      ctx!.textAlign = 'left';
      ctx!.fillText(n.label, x + 19, p.y + 0.5);
    }
  }

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(48, now - last);
    last = now;
    draw(dt);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduced || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
  }

  resize();
  new ResizeObserver(resize).observe(canvas);
  if (reduced) {
    draw(0);
    return;
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? start() : stop();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener(
    'pointermove',
    (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tiltTarget = 0.42 + ny * 0.22;
      yawTarget = nx * 0.5;
    },
    { passive: true },
  );
  // Las fuentes web pueden cargar después: redibujar etiquetas con la métrica correcta
  document.fonts?.ready.then(() => draw(0));
  start();
}
