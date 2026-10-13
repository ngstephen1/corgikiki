import { ArrowRight, CheckCircle2, RotateCcw, Sparkles, X } from 'lucide-react';
import type { PracticeExercise, ReviewFeedback } from '@/lib/types';

type Props = {
  image: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  feedback: ReviewFeedback | null;
  error: string | null;
  onClose: () => void;
  onTryAgain: () => void;
  onPractice: (exercise: PracticeExercise) => void;
  onComplete: () => void;
  completed: boolean;
};

export default function FeedbackPanel({ image, status, feedback, error, onClose, onTryAgain, onPractice, onComplete, completed }: Props) {
  if (!image) return null;
  return <div className="feedback-overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
    <div className="feedback-card ai-feedback-card">
      <button className="close-feedback" onClick={onClose} aria-label="Close feedback"><X size={19}/></button>
      <span className="feedback-badge"><Sparkles size={15}/> {status === 'loading' ? 'AI REVIEW IN PROGRESS' : 'KIKI AI REVIEW'}</span>
      {status === 'loading' && <div className="review-loading"><span className="loading-orbit">✳</span><h2 id="feedback-title">Kiki is looking closely…</h2><p>The architecture critic is reviewing your lines, then Kiki will turn the critique into a personal practice plan.</p><div className="loading-progress"><span/></div></div>}
      {status === 'error' && <div className="review-error"><h2 id="feedback-title">Kiki couldn&apos;t review this one</h2><p>{error || 'Please try again.'}</p><button className="complete-button" onClick={onTryAgain}><RotateCcw size={17}/> Try Again</button></div>}
      {status === 'success' && feedback && <>
        <div className="agent-result-label"><span className="agent-number">01</span><div><strong>Architectural Vision Critic</strong><small>Agent 1 · Analyzes perspective and proportions</small></div><CheckCircle2 size={18}/></div>
        <div className="score-head"><div><h2 id="feedback-title">Your sketch, through Kiki&apos;s eyes</h2><p>An approximate learning score—not a grade.</p></div><div className="score-bubble"><strong>{feedback.critic.score}</strong><span>/ 100</span></div></div>
        <p className="feedback-summary">{feedback.critic.summary}</p>
        <div className="feedback-columns"><div className="feedback-section"><h3>What&apos;s working</h3><ul>{feedback.critic.strengths.map((item,index)=><li key={index}><CheckCircle2 size={15}/>{item}</li>)}</ul></div><div className="feedback-section"><h3>Keep improving</h3><ul>{feedback.critic.improvements.map((item,index)=><li key={index}><span className="improvement-dot">↗</span>{item}</li>)}</ul></div></div>
        <div className="agent-result-label coach-agent-label"><span className="agent-number">02</span><div><strong>Kiki Drawing Coach</strong><small>Agent 2 · Turns critique into personalized instruction</small></div><CheckCircle2 size={18}/></div>
        <div className="coach-message"><span className="coach-spark">✳</span><div><strong>Kiki says</strong><p>{feedback.coach.encouragement}</p><p>{feedback.coach.explanation}</p></div></div>
        <div className="feedback-section corrections"><h3>Make the next line count</h3>{feedback.coach.corrections.map((item,index)=><div className="correction-row" key={index}><span>{index+1}</span><div><strong>{item.issue}</strong><p>{item.howToFix}</p></div></div>)}</div>
        <div className="practice-preview"><span>PERSONALIZED PRACTICE</span><h3>{feedback.coach.nextExercise.title}</h3><p>{feedback.coach.nextExercise.objective}</p><ol>{feedback.coach.nextExercise.steps.map((step,index)=><li key={index}>{step}</li>)}</ol></div>
        <p className="motivational-message">“{feedback.coach.motivationalMessage}”</p>
        <div className="feedback-actions"><button className="subtle-button" onClick={onTryAgain}><RotateCcw size={16}/> Try Again</button><button className="practice-button" onClick={() => onPractice(feedback.coach.nextExercise)}>Practice This Skill <ArrowRight size={17}/></button></div>
        <button className="mark-complete-link" onClick={onComplete}>{completed ? '✓ Lesson complete' : 'Mark this lesson complete'}</button>
      </>}
    </div>
  </div>;
}
