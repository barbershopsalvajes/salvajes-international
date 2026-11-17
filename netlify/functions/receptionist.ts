/**
 * DEMO A en modo "IA en vivo".
 *  GET  /api/receptionist → { live: boolean }  (la web decide si usar IA real o simulación)
 *  POST /api/receptionist → { reply: string }
 * Requiere ANTHROPIC_API_KEY en el servidor. La clave nunca llega al navegador.
 */
import type { Config, Context } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { json, env, isAllowedOrigin, createRateLimiter, readJson } from '../../src/lib/server/http.ts';

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 20;
const MAX_CHARS = 600;
const limiter = createRateLimiter(40, 10 * 60 * 1000);

const SYSTEM = `Eres el asistente virtual de "Clínica Dental Demo", una clínica dental FICTICIA usada como demostración en la web de RESUELVE INTELLECT (agencia de inteligencia artificial y automatización).

Datos de la clínica (ficticios):
- Horario: lunes a viernes 9:00–20:00; sábados 9:00–14:00; domingos cerrado.
- Tratamientos y precios orientativos: limpieza desde 60 €, blanqueamiento desde 290 €, primera visita gratuita, ortodoncia e implantes con valoración gratuita (presupuesto tras estudio).
- Trabaja con las principales aseguradoras (no confirmes ninguna concreta; ofrece verificarlo).
- No tiene dirección real: si preguntan, explica que es una clínica de demostración.

Cómo actúas:
- Responde en el idioma del paciente (español o inglés), con tono cálido, profesional y breve (máximo 70 palabras).
- Para pedir cita: pregunta el tratamiento, ofrece 3 huecos concretos en los próximos días laborables, pide el nombre y confirma con un resumen. Indica siempre que es una simulación y que no se ha reservado nada real.
- No des diagnósticos ni consejos médicos. Ante dolor intenso ofrece cita de urgencia hoy; ante fiebre alta, inflamación que dificulta tragar o respirar o traumatismo grave, recomienda acudir a urgencias o llamar al 112.
- No pidas datos sensibles (historial médico, DNI, datos bancarios). Como mucho, nombre para la cita.
- Si te piden hablar con una persona, explica que en la versión real la conversación pasaría a recepción con todo el contexto.
- Si preguntan por temas ajenos a la clínica, redirige amablemente. Si preguntan cómo funciona este asistente, explica que RESUELVE INTELLECT construye asistentes así conectados a la agenda y a WhatsApp de cada clínica.
- Texto plano, sin Markdown salvo viñetas "•" cuando enumeres.`;

type Msg = { role: 'user' | 'assistant'; content: string };

function parseMessages(raw: unknown): Msg[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_TURNS) return null;
  const out: Msg[] = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') return null;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const text = content.trim().slice(0, MAX_CHARS);
    if (!text) return null;
    out.push({ role, content: text });
  }
  // Debe empezar y terminar con el usuario (el saludo inicial del asistente se omite en el cliente).
  if (out[0].role !== 'user' || out[out.length - 1].role !== 'user') return null;
  for (let i = 1; i < out.length; i++) if (out[i].role === out[i - 1].role) return null;
  return out;
}

export default async (req: Request, context: Context) => {
  const apiKey = env('ANTHROPIC_API_KEY');
  if (req.method === 'GET') return json({ live: Boolean(apiKey) });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!apiKey) return json({ error: 'not_configured' }, 501);
  if (!isAllowedOrigin(req)) return json({ error: 'forbidden' }, 403);
  if (!limiter(context.ip || 'unknown')) return json({ error: 'rate_limited' }, 429);

  const body = await readJson(req, 16_000);
  const messages = parseMessages(body?.messages);
  if (!messages) return json({ error: 'bad_request' }, 400);

  const client = new Anthropic({ apiKey, timeout: 25_000, maxRetries: 1 });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 1024, // respuestas deliberadamente breves (chat de demostración)
      system: SYSTEM,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages,
    });
    if (response.stop_reason === 'refusal') {
      return json({ reply: body?.lang === 'en' ? "Sorry, I can't help with that. Can I help you with an appointment?" : 'Lo siento, no puedo ayudarte con eso. ¿Te ayudo con una cita?' });
    }
    const reply = response.content
      .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!reply) return json({ error: 'empty' }, 502);
    return json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 429);
    if (err instanceof Anthropic.APIError) {
      console.error('[receptionist] API error', err.status, err.message);
      return json({ error: 'upstream' }, 502);
    }
    console.error('[receptionist] error', err);
    return json({ error: 'upstream' }, 502);
  }
};

export const config: Config = { path: '/api/receptionist' };
