import OpenAI from 'openai';
import { getExercise } from '@/lib/exercises';
import type { LessonId } from '@/lib/types';

export const runtime = 'nodejs';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const ids: LessonId[] = ['cube', 'room', 'hallway'];
const text = (v: unknown, max = 180) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const urlKey = (value: string) => { try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.origin + u.pathname.replace(/\/$/, '') : ''; } catch { return ''; } };
export async function POST(request: Request) {
  const apiKey = process.env.OPEN_API_API?.trim() || process.env.OPEN_AI_API?.trim();
  if (!apiKey) return reply({ error: 'OpenAI is not configured.' }, 503);
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ error: 'Send JSON.' }, 415);
  if (Number(request.headers.get('content-length') || 0) > 3000) return reply({ error: 'Request too large.' }, 413);
  let body: unknown; try { body = await request.json(); } catch { return reply({ error: 'Invalid JSON.' }, 400); }
  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  if (!ids.includes(data.exerciseId as LessonId) || !Array.isArray(data.strengths) || data.strengths.length > 4 || !data.strengths.every(v => typeof v === 'string' && v.length <= 180)) return reply({ error: 'Invalid learning context.' }, 400);
  try {
    const client = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });
    const response = await client.responses.create({
      model: process.env.CORGI_CHAT_MODEL?.trim() || 'gpt-4.1-mini',
      instructions: 'Search the live web for up to three architecture internships or entry-level job postings relevant to a student. Return ONLY a JSON object with a jobs array. Each job must have title, company, location, requirements (short), and url (the direct source page). Use only actual pages found by the web search tool. Do not invent jobs, company names, URLs, requirements, or availability. If you cannot find a clearly relevant posting, return an empty jobs array. Do not claim the postings are verified or still open.',
      input: `Find recent architecture internships or entry-level opportunities. Current exercise: ${getExercise(data.exerciseId as LessonId).title}. Student strengths: ${(data.strengths as string[]).join('; ')}. Favor architecture drawing, illustration, CAD, interior design, or visualization roles.`,
      tools: [{ type: 'web_search', search_context_size: 'low' }], tool_choice: 'required', include: ['web_search_call.action.sources'], max_output_tokens: 1000
    });
    const verified = new Set<string>();
    const sourceUrls: string[] = [];
    for (const item of response.output) {
      if (item.type === 'web_search_call' && item.action.type === 'search') for (const source of item.action.sources ?? []) { verified.add(urlKey(source.url)); sourceUrls.push(source.url); }
      if (item.type === 'message') for (const part of item.content) if (part.type === 'output_text') for (const a of part.annotations ?? []) if (a.type === 'url_citation') { verified.add(urlKey(a.url)); sourceUrls.push(a.url); }
    }
    let parsed: unknown;
    try { parsed = JSON.parse(response.output_text.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { parsed = null; }
    const raw = parsed && typeof parsed === 'object' && 'jobs' in parsed ? (parsed as { jobs: unknown }).jobs : null;
    let jobs = Array.isArray(raw) ? raw.slice(0, 3).flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const j = item as Record<string, unknown>;
      const url = text(j.url, 2000); const key = urlKey(url);
      if (!key || !verified.has(key) || !text(j.title) || !text(j.company) || !text(j.location)) return [];
      return [{ title: text(j.title), company: text(j.company), location: text(j.location), requirements: text(j.requirements, 300), url }];
    }) : [];
    if (!jobs.length) jobs = [...new Set(sourceUrls)].filter(url => /\/(?:jobs?|internships?|careers?)\/[^/?]+/i.test(new URL(url).pathname)).slice(0, 3).map(url => {
      const u = new URL(url);
      const slug = u.pathname.split('/').filter(Boolean).at(-1) || 'architecture opportunity';
      const title = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 120);
      return { title, company: 'See source', location: 'See posting', requirements: 'Open the source for current requirements and eligibility.', url };
    });
    return reply({ jobs, note: jobs.length ? 'Source-linked opportunities. Check each posting for availability and eligibility.' : 'No source-backed postings were found right now. Try again later.' });
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0;
    return reply({ error: status === 429 ? 'Search is busy or the account limit was reached. Try again shortly.' : 'Job search is unavailable right now. Please try again.' }, status === 429 ? 503 : 502);
  }
}
