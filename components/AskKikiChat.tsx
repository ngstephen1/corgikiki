'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowUp, ExternalLink, LoaderCircle, MessageCircle, Search, Sparkles, X } from 'lucide-react';
import type { Critique, LessonId, PracticeExercise } from '@/lib/types';

type Action = { type: 'start_practice'; practice: PracticeExercise } | { type: 'select_lesson'; lessonId: LessonId };
type Source = { title: string; url: string };
type Message = { role: 'user' | 'assistant'; content: string; sources?: Source[]; actions?: Action[]; analyzedDrawing?: boolean };
type Props = { context: { exerciseId: LessonId; seed: number; critique?: Critique }; captureDrawing: () => string | null; onPractice: (practice: PracticeExercise) => void; onSelectLesson: (id: LessonId) => void };
const suggestions = ['What is a vanishing point?', 'How do I sketch a room?', 'How do I start a floor plan?'];
const safeUrl = (url: string) => { try { const value = new URL(url); return ['https:', 'http:'].includes(value.protocol) ? value.href : null; } catch { return null; } };
function Formatted({ text }: { text: string }) {
  return <div className="chat-rich-text">{text.split('\n').filter(Boolean).map((line, index) => <p key={index}>{line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)}</p>)}</div>;
}
export default function AskKikiChat({ context, captureDrawing, onPractice, onSelectLesson }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState('Thinking through your question…');
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { inputRef.current?.focus(); bottomRef.current?.scrollIntoView({ block: 'end' }); } }, [open, messages, loading]);

  const send = async (text: string, opts: { retry?: boolean; analyzeDrawing?: boolean } = {}) => {
    const content = text.trim();
    if (!content || inFlight.current) return;
    const drawingRequest = opts.analyzeDrawing || /(?:look at|analy[sz]e|review|critique|what.s wrong with|improve)\b.{0,35}(?:drawing|sketch|cube|room|hallway)|(?:drawing|sketch|cube).{0,35}(?:wrong|improve)/i.test(content);
    const image = drawingRequest ? captureDrawing() : null;
    if (opts.analyzeDrawing && !image) { setOpen(true); setError('Draw a few lines or load the sample drawing first.'); return; }
    inFlight.current = true;
    const next: Message[] = opts.retry ? messages : [...messages, { role: 'user', content }];
    if (!opts.retry) { setMessages(next); setDraft(''); }
    setError(null); setLoading(true);
    setActivity(image ? 'Looking at your drawing…' : /\b(find|search|tutorial|famous|gothic|news|competition|resource)\b/i.test(content) ? 'Searching for reliable sources…' : 'Thinking through your question…');
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.slice(-20).map(({ role, content }) => ({ role, content })), context, ...(image ? { image } : {}), analyzeDrawing: !!opts.analyzeDrawing }), signal: AbortSignal.timeout(65_000) });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : 'Kiki could not reply. Please try again.');
      if (!data || typeof data !== 'object' || !('reply' in data) || typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Kiki sent an incomplete reply. Please try again.');
      const result = data as { reply: string; sources?: Source[]; actions?: Action[]; analyzedDrawing?: boolean };
      const sources = Array.isArray(result.sources) ? result.sources.filter(s => s && typeof s.title === 'string' && typeof s.url === 'string' && safeUrl(s.url)).slice(0, 6) : [];
      const actions = Array.isArray(result.actions) ? result.actions.slice(0, 2) : [];
      setMessages(all => [...all, { role: 'assistant', content: result.reply, sources, actions, analyzedDrawing: result.analyzedDrawing }]);
    } catch (cause) {
      setError(cause instanceof Error && cause.name === 'TimeoutError' ? 'Kiki took too long to reply. Please try again.' : cause instanceof Error ? cause.message : 'A network error interrupted the chat.');
    } finally { inFlight.current = false; setLoading(false); }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void send(draft); };
  const runAction = (action: Action) => {
    if (action.type === 'start_practice' && action.practice && Array.isArray(action.practice.steps) && action.practice.steps.length === 3) { onPractice(action.practice); setOpen(false); }
    if (action.type === 'select_lesson' && ['cube', 'room', 'hallway'].includes(action.lessonId)) { onSelectLesson(action.lessonId); setOpen(false); }
  };
  return <div className="ask-kiki-root">
    {open && <section className="chat-panel" role="dialog" aria-label="Ask Kiki chat">
      <div className="chat-header"><div className="chat-avatar">✳</div><div><h2>Ask Kiki</h2><p>Your architecture sketching buddy</p></div><button className="chat-close" onClick={() => setOpen(false)} aria-label="Close Ask Kiki"><X size={18}/></button></div>
      <div className="chat-body" aria-live="polite">
        {messages.length === 0 && <div className="chat-welcome"><div className="chat-welcome-icon"><Sparkles size={24}/></div><h3>Let&apos;s figure it out together.</h3><p>Ask about your drawing, find helpful references, or try a new practice round.</p><div className="chat-suggestions">{suggestions.map(question => <button key={question} onClick={() => void send(question)} disabled={loading}>{question}</button>)}</div></div>}
        {messages.map((message, index) => <div key={index} className={`chat-message ${message.role}`}><span className="chat-message-label">{message.role === 'assistant' ? message.analyzedDrawing ? 'KIKI · DRAWING REVIEW' : 'KIKI' : 'YOU'}</span><Formatted text={message.content}/>{message.sources && message.sources.length > 0 && <div className="chat-sources"><span>Sources</span>{message.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={11}/></a>)}</div>}{message.actions?.map((action, i) => <button className="chat-action" key={i} onClick={() => runAction(action)}>{action.type === 'start_practice' ? 'Start this practice' : `Open ${action.lessonId} lesson`} <span>↗</span></button>)}</div>)}
        {loading && <div className="chat-message assistant chat-thinking"><span className="chat-message-label">KIKI</span><p><LoaderCircle size={15} className="chat-spinner"/> {activity}</p></div>}
        {error && <div className="chat-error" role="alert">{error}{messages.at(-1)?.role === 'user' && <button onClick={() => void send(messages.at(-1)!.content, { retry: true })} disabled={loading}>Retry</button>}</div>}
        <div ref={bottomRef}/>
      </div>
      <div className="chat-quick-actions"><button onClick={() => void send('Can you analyze my current drawing?', { analyzeDrawing: true })} disabled={loading}>Analyze my drawing</button><button onClick={() => void send('Find beginner architecture drawing tutorials.')} disabled={loading}><Search size={12}/> Find tutorials</button><button onClick={() => void send('Give me another beginner drawing exercise.')} disabled={loading}>Give me practice</button></div>
      <form className="chat-form" onSubmit={submit}><input ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)} maxLength={1500} placeholder="Ask a drawing question…" aria-label="Message Kiki"/><button type="submit" disabled={!draft.trim() || loading} aria-label="Send message"><ArrowUp size={18}/></button></form>
      <div className="chat-footnote">Sketch analysis uses your current canvas when available.</div>
    </section>}
    <button className="chat-launcher" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Close Ask Kiki' : 'Open Ask Kiki'}><span className="chat-launcher-icon">{open ? <X size={20}/> : <MessageCircle size={20}/>}</span><span>{open ? 'Close chat' : 'Ask Kiki'}</span><Sparkles size={15}/></button>
  </div>;
}
