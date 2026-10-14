'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, BriefcaseBusiness, ChevronDown, Layers3, Menu, RefreshCw, Sparkles } from 'lucide-react';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/DrawingCanvas';
import ExerciseSelector from '@/components/ExerciseSelector';
import TutorPanel from '@/components/TutorPanel';
import FeedbackPanel from '@/components/FeedbackPanel';
import AskKikiChat from '@/components/AskKikiChat';
import CareerPanel from '@/components/CareerPanel';
import { getExercise } from '@/lib/exercises';
import { generateGeometry } from '@/lib/synthetic';
import { parseReview } from '@/lib/review';
import type { LessonId, PracticeExercise, ReviewFeedback, ReviewRequest } from '@/lib/types';
import logoArt from '../logo.png';

function Corgi({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'corgi-small' : 'corgi-hero'} viewBox="0 0 148 142" fill="none" role="img" aria-label="Kiki the smiling corgi">
    <path d="M28 60 19 8c-1-5 4-8 8-5l32 28M120 60l9-52c1-5-4-8-8-5L89 31" fill="#E59B69" stroke="#543B32" strokeWidth="4" strokeLinejoin="round"/>
    <path d="m30 51-5-32 22 20M118 51l5-32-22 20" fill="#F8D7B9"/>
    <path d="M74 18c33 0 58 27 58 60 0 31-25 55-58 55S16 109 16 78c0-33 25-60 58-60Z" fill="#EFAE78" stroke="#543B32" strokeWidth="4"/>
    <path d="M74 24c9 16 16 23 16 40 0 11-7 17-16 17s-16-6-16-17c0-17 7-24 16-40Z" fill="#FFF7E8"/>
    <path d="M19 76c5-9 19-16 34-14 11 2 20 10 21 23 1-13 10-21 21-23 15-2 29 5 34 14-1 31-23 55-55 55S20 107 19 76Z" fill="#FFF7E8"/>
    <ellipse cx="47" cy="75" rx="4" ry="5" fill="#3B2C2A"/><ellipse cx="101" cy="75" rx="4" ry="5" fill="#3B2C2A"/>
    <ellipse cx="35" cy="86" rx="9" ry="5" fill="#F6A99F" opacity=".7"/><ellipse cx="113" cy="86" rx="9" ry="5" fill="#F6A99F" opacity=".7"/>
    <path d="M68 91c2-3 10-3 12 0 1 3-3 7-6 7s-7-4-6-7Z" fill="#3B2C2A"/>
    <path d="M74 99v6m0 0c-4 5-10 5-14 0m14 0c4 5 10 5 14 0" stroke="#3B2C2A" strokeWidth="3" strokeLinecap="round"/>
    <path d="M54 120c8 8 31 12 42 0" stroke="#E6D4BD" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}

export default function Home() {
  const [lessonId, setLessonId] = useState<LessonId>('cube');
  const [seed, setSeed] = useState(1);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<LessonId[]>([]);
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedback | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [practice, setPractice] = useState<PracticeExercise | null>(null);
  const reviewInFlight = useRef(false);
  const drawingCanvas = useRef<DrawingCanvasHandle>(null);
  const [showMobilePath, setShowMobilePath] = useState(false);
  const exercise = getExercise(lessonId);
  const displayExercise = practice ? { ...exercise, title: practice.title, objective: practice.objective, steps: practice.steps, description: 'A personalized practice round built from your latest review.' } : exercise;
  const geometry = useMemo(() => generateGeometry(lessonId, seed), [lessonId, seed]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('corgikiki-progress') || '[]');
      if (Array.isArray(saved)) setCompleted(saved.filter((id): id is LessonId => ['cube','room','hallway'].includes(id)));
    } catch { /* Keep the starter path if storage is unavailable. */ }
  }, []);

  const selectLesson = (id: LessonId) => { setLessonId(id); setActiveStep(0); setPractice(null); setReviewFeedback(null); setReviewStatus('idle'); setShowMobilePath(false); };
  const closeReview = () => { if (!reviewInFlight.current) setReviewImage(null); };
  const requestReview = async (image: string, strokeCount: number) => {
    if (reviewInFlight.current) return;
    reviewInFlight.current = true;
    setReviewImage(image); setReviewFeedback(null); setReviewError(null); setReviewStatus('loading');
    const payload: ReviewRequest = { image, exerciseId: lessonId, instructions: displayExercise.steps, difficulty: exercise.difficulty, seed, geometry: { horizonY: geometry.horizonY, vanishing: geometry.vanishing, reference: geometry.reference }, strokeCount };
    try {
      const response = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(100_000) });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : 'Kiki could not finish the review. Please try again.');
      setReviewFeedback(parseReview(data));
      setReviewStatus('success');
    } catch (error) {
      setReviewError(error instanceof Error && error.name === 'TimeoutError' ? 'The review timed out. Please try again.' : error instanceof Error ? error.message : 'A network error interrupted the review.');
      setReviewStatus('error');
    } finally { reviewInFlight.current = false; }
  };
  const practiceSkill = (next: PracticeExercise) => { setPractice(next); setSeed(value => value + 1); setActiveStep(0); setReviewImage(null); };
  const completeLesson = () => {
    const next = Array.from(new Set([...completed, lessonId]));
    setCompleted(next);
    try { localStorage.setItem('corgikiki-progress', JSON.stringify(next)); } catch { /* Browsing still works without storage. */ }
  };

  return <div className="app-shell">
    <header className="site-header">
      <div className="brand"><span className="brand-mascot"><Image src={logoArt} alt="" width={86} height={86} className="brand-logo-image" priority/></span><span className="brand-word">Corgi<span>Kiki</span><i>✳</i></span></div>
      <nav className="header-nav" aria-label="Main navigation"><a href="#studio" className="nav-active"><Layers3 size={16}/> AI Drawing Studio</a><a href="#career"><BriefcaseBusiness size={16}/> Career map</a></nav>
      <div className="header-right"><span className="header-progress"><span className="header-progress-icon">✦</span> {completed.length}/3 lessons</span><span className="powered-label"><span className="powered-star">✺</span> Powered by OpenAI</span></div>
      <button className="mobile-menu" onClick={() => setShowMobilePath(value => !value)} aria-label="Toggle learning path"><Menu size={22}/></button>
    </header>

    <main>
      <section className="welcome-banner">
        <div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-dot"/> YOUR CREATIVE JOURNEY STARTS HERE</div><h1>Hey, future architect! <span className="wave">✳</span></h1><p>Every great architect starts with a sketch. Let&apos;s make your first lines feel a little less intimidating—and a lot more fun.</p><div className="hero-actions"><a href="#studio" className="hero-start"><Sparkles size={16}/> Start sketching <ArrowRight size={16}/></a><a href="#career" className="hero-career">Explore careers <ArrowRight size={15}/></a></div></div>
        <div className="hero-art"><div className="hero-grid"/><div className="hero-orbit hero-orbit-one"/><div className="hero-orbit hero-orbit-two"/><div className="hero-spark one">✦</div><div className="hero-spark two">✳</div><div className="hero-label"><span>HI, I&apos;M KIKI!</span><span>↗</span></div><Corgi/></div>
      </section>

      <div className="workspace-top" id="studio"><div><span className="section-kicker">THE SKETCH STUDIO <span>✦</span></span><h2>Let&apos;s draw something <em>amazing.</em></h2></div><div className="workspace-status"><span className="status-dot"/> Your canvas is ready <ChevronDown size={14}/></div></div>

      <div className={`workspace-grid ${showMobilePath ? 'show-path' : ''}`}>
        <ExerciseSelector selected={lessonId} completed={completed} onSelect={selectLesson}/>
        <section className="center-column" aria-label="Drawing studio">
          <div className="exercise-heading"><div><div className="exercise-meta"><span className="lesson-tag">LESSON {exercise.number}</span><span className="meta-dot">·</span><span>{exercise.difficulty.toUpperCase()}</span><span className="meta-dot">·</span><span>{exercise.minutes} MIN READ & DRAW</span></div><h2>{displayExercise.title}</h2><p>{displayExercise.description}</p></div><button className="variation-button" onClick={() => { setSeed(value => value + 1); setActiveStep(0); setReviewFeedback(null); }}><RefreshCw size={15}/> New variation</button></div>
          <DrawingCanvas ref={drawingCanvas} lessonId={lessonId} seed={seed} reviewing={reviewStatus === 'loading'} onReview={requestReview}/>
          <div className="objective-line"><span><span className="objective-star">✦</span> TODAY&apos;S GOAL</span><p>{displayExercise.objective}</p><ArrowRight size={17}/></div>
        </section>
        <aside className="right-column"><TutorPanel exercise={displayExercise} geometry={geometry} activeStep={activeStep} onStep={setActiveStep}/></aside>
      </div>

      <CareerPanel critique={reviewFeedback?.critic ?? null} exerciseId={lessonId} onSelectLesson={selectLesson}/>
      <section className="bottom-note" id="how-it-works"><span>✳</span><p>Sketch at your own pace. There&apos;s no perfect line—only the next one.</p><span>CORGIKIKI · MADE FOR BEGINNERS</span></section>
    </main>
    <FeedbackPanel image={reviewImage} status={reviewStatus} feedback={reviewFeedback} error={reviewError} onClose={closeReview} onTryAgain={() => setReviewImage(null)} onPractice={practiceSkill} onComplete={completeLesson} completed={completed.includes(lessonId)}/>
    <AskKikiChat context={{ exerciseId: lessonId, seed, critique: reviewFeedback?.critic }} captureDrawing={() => drawingCanvas.current?.capture() ?? null} onPractice={practiceSkill} onSelectLesson={selectLesson}/>
  </div>;
}
