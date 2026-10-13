'use client';

import { ArrowUpRight, Check, Clock3, LockKeyhole } from 'lucide-react';
import { exercises } from '@/lib/exercises';
import type { LessonId } from '@/lib/types';

type Props = { selected: LessonId; completed: LessonId[]; onSelect: (id: LessonId) => void };

export default function ExerciseSelector({ selected, completed, onSelect }: Props) {
  return <aside className="left-column">
    <div className="sidebar-eyebrow">YOUR LEARNING PATH <span>01 / 03</span></div>
    <h2 className="sidebar-heading">Start with the basics<span className="heading-spark">✳</span></h2>
    <p className="sidebar-description">Little lines become big ideas. Pick a lesson and start sketching.</p>
    <div className="lesson-list">
      {exercises.map((exercise, index) => {
        const isSelected = selected === exercise.id;
        const done = completed.includes(exercise.id);
        return <button key={exercise.id} className={`lesson-card ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(exercise.id)}>
          <span className={`lesson-number lesson-number-${index}`}>{done ? <Check size={17} strokeWidth={3}/> : exercise.number}</span>
          <span className="lesson-details"><strong>{exercise.shortTitle}</strong><small><Clock3 size={12}/>{exercise.minutes} min · {exercise.difficulty}</small></span>
          {isSelected ? <ArrowUpRight size={18} className="lesson-arrow"/> : <span className="lesson-chevron">›</span>}
        </button>;
      })}
    </div>
    <div className="progress-card">
      <div className="progress-top"><span className="progress-icon">✦</span><span>YOUR JOURNEY</span></div>
      <strong>{completed.length} <span>of 3 lessons complete</span></strong>
      <div className="progress-track"><span style={{width:`${completed.length / 3 * 100}%`}}/></div>
      <p>{completed.length === 3 ? 'You finished the starter path. Keep sketching!' : 'Every sketch makes your eye a little sharper.'}</p>
    </div>
    <div className="sidebar-note"><span className="note-icon"><LockKeyhole size={15}/></span><span>Your progress stays in this browser. No account needed.</span></div>
  </aside>;
}
