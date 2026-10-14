'use client';

import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, ExternalLink, Sparkles } from 'lucide-react';
import { exercises } from '@/lib/exercises';
import type { Critique, LessonId } from '@/lib/types';

type Job = { title: string; company: string; location: string; requirements: string; url: string };
type Props = { critique: Critique | null; exerciseId: LessonId; onSelectLesson: (id: LessonId) => void };
const paths = [
  { title: 'Architectural Illustrator', skill: 'perspective', lesson: 'cube' as LessonId, why: 'Turn spatial ideas into clear sketches.' },
  { title: 'CAD Technician', skill: 'technical', lesson: 'hallway' as LessonId, why: 'Build accuracy in measured construction.' },
  { title: 'Interior Designer', skill: 'proportions', lesson: 'room' as LessonId, why: 'Practice space, scale, and room layouts.' },
  { title: '3D Visualization Artist', skill: 'perspective', lesson: 'hallway' as LessonId, why: 'Make depth feel convincing.' },
  { title: 'Architectural Designer', skill: 'creativity', lesson: 'room' as LessonId, why: 'Combine ideas with readable drawings.' }
];
const labels: { key: keyof NonNullable<Critique['skills']>; title: string }[] = [{key:'perspective',title:'Perspective'},{key:'proportions',title:'Proportions'},{key:'creativity',title:'Creativity'},{key:'technical',title:'Technical drawing'}];
export default function CareerPanel({ critique, exerciseId, onSelectLesson }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobNote, setJobNote] = useState('');
  const [loading, setLoading] = useState(false);
  const score = critique?.score ?? 0;
  const level = score < 45 ? 'Beginner' : score < 75 ? 'Intermediate' : 'Advanced';
  const ranked = [...paths].sort((a,b) => (critique?.skills?.[b.skill as keyof NonNullable<Critique['skills']>] ?? 0) - (critique?.skills?.[a.skill as keyof NonNullable<Critique['skills']>] ?? 0));
  const best = ranked.slice(0, 3);
  const reaction = score < 45 ? 'Your perspective lines are still finding their way home. Kiki believes in them! 🐶' : score < 75 ? 'Future architect detected. Your next sketch gets even sharper. 🐶' : 'Those lines understood the assignment. Keep sketching! 🐶';
  const findJobs = async () => {
    setLoading(true); setJobNote(''); setJobs([]);
    try {
      const r = await fetch('/api/career/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exerciseId, strengths: critique?.strengths?.slice(0, 4) ?? [] }), signal: AbortSignal.timeout(55_000) });
      const data: unknown = await r.json();
      if (!r.ok) throw new Error(data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : 'Search failed.');
      if (data && typeof data === 'object' && 'jobs' in data && Array.isArray(data.jobs)) setJobs(data.jobs as Job[]);
      if (data && typeof data === 'object' && 'note' in data && typeof data.note === 'string') setJobNote(data.note);
    } catch (e) { setJobNote(e instanceof Error ? e.message : 'Search failed.'); }
    finally { setLoading(false); }
  };
  return <section className="career-section" id="career" aria-labelledby="career-title">
    <div className="career-heading"><div><span className="section-kicker">YOUR FUTURE IN DESIGN ✦</span><h2 id="career-title">My Architecture Career</h2><p>See how today&apos;s sketch can guide tomorrow&apos;s practice.</p></div><div className="career-mascot">🐶</div></div>
    {!critique ? <div className="career-empty"><Sparkles size={24}/><div><strong>Your career map starts with a sketch.</strong><p>Draw a few lines or load the sample, then click AI Review. Kiki will use that critique here without another image call.</p></div></div> : <>
      <div className="career-overview"><div className="career-readiness"><span>CAREER READINESS</span><strong>{score}<small>/100</small></strong><div className="career-meter"><span style={{width:`${score}%`}}/></div><p>Educational estimate from one AI sketch review. This is not a hiring prediction.</p></div><div className="career-skill-card"><span>DRAWING SKILL SNAPSHOT</span><strong>{level} sketcher</strong><div className="career-skills">{labels.map(({key,title}) => <div key={key}><span>{title}</span><b>{critique.skills ? `${critique.skills[key]}/100` : 'See review'}</b></div>)}</div><small>Approximate AI assessments; creativity is especially uncertain in guided exercises.</small></div></div>
      <p className="career-reaction">Kiki says: “{reaction}”</p>
      <div className="career-evidence"><p><strong>Already showing</strong> {critique.strengths[0]}</p><p><strong>Build next</strong> {critique.improvements[0]}</p></div>
      <div className="career-columns"><div><h3>Paths to explore</h3>{best.map(path => <div className="career-path" key={path.title}><strong>{path.title}</strong><p>{path.why}</p><small>Drawing connection: {path.skill}</small></div>)}</div><div><h3>Your next drawing moves</h3>{best.map((path,i) => <div className="career-roadmap" key={path.title}><span>0{i+1}</span><div><strong>{exercises.find(e=>e.id===path.lesson)?.title}</strong><p>Build {path.skill} for {path.title}.</p></div><button onClick={() => onSelectLesson(path.lesson)} aria-label={`Open ${path.lesson} lesson`}><ArrowRight size={16}/></button></div>)}</div></div>
      <div className="career-jobs"><div><h3><BriefcaseBusiness size={19}/> Opportunities to explore</h3><p>Search source-linked internships and entry-level roles. Availability and eligibility can change.</p></div><button onClick={() => void findJobs()} disabled={loading}>{loading ? 'Searching jobs…' : 'Find My Jobs'} <ArrowRight size={16}/></button></div>
      {jobNote && <p className="career-job-note" role="status">{jobNote}</p>}
      {jobs.length > 0 && <div className="career-job-list">{jobs.map(job => <a key={job.url} href={job.url} target="_blank" rel="noopener noreferrer"><strong>{job.title}</strong><span>{job.company} · {job.location}</span><p>{job.requirements}</p><small>Open source <ExternalLink size={12}/></small></a>)}</div>}
    </>}
  </section>;
}
