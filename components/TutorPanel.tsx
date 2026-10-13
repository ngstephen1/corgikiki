import { Check, Lightbulb, Sparkles } from 'lucide-react';
import type { Exercise, Geometry } from '@/lib/types';
import { ART_HEIGHT, ART_WIDTH } from '@/lib/synthetic';

type Props = { exercise: Exercise; geometry: Geometry; activeStep: number; onStep: (step: number) => void };

export default function TutorPanel({ exercise, geometry, activeStep, onStep }: Props) {
  return <div className="tutor-card">
    <div className="tutor-heading"><div className="tutor-avatar">✳</div><div><h2>Kiki&apos;s sketch notes</h2><p>Your friendly drawing tutor</p></div><span className="online-dot"/></div>
    <div className="tutor-message"><span className="tiny-sparkle">✦</span><p>Hey, future architect! Let&apos;s break this down into easy little moves. You&apos;ve got this.</p></div>
    <div className="steps-label"><span>STEP-BY-STEP</span><span>{String(activeStep + 1).padStart(2,'0')} / {String(exercise.steps.length).padStart(2,'0')}</span></div>
    <div className="steps-list">
      {exercise.steps.map((step, index) => <button key={index} className={`step-row ${index === activeStep ? 'current' : ''} ${index < activeStep ? 'done' : ''}`} onClick={() => onStep(index)}>
        <span className="step-index">{index < activeStep ? <Check size={13} strokeWidth={3}/> : index + 1}</span><span>{step}</span>
      </button>)}
    </div>
    <div className="reference-block"><div className="reference-title"><span>REFERENCE SKETCH</span><span>✳</span></div>
      <svg className="reference-art" viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`} role="img" aria-label={`Reference drawing for ${exercise.title}`}>
        {geometry.reference.map((segment, index) => <line key={index} x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} stroke={segment.kind === 'detail' ? '#af9e91' : '#665f59'} strokeWidth={segment.kind === 'detail' ? 3 : 4} strokeLinecap="round"/>)}
      </svg><p>A little inspiration, not a perfect answer.</p>
    </div>
    <div className="kiki-tip"><Lightbulb size={17}/><span><strong>Kiki tip</strong><br/>Architects draw lightly first. You can always darken a line later!</span></div>
  </div>;
}
