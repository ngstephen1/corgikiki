export type LessonId = 'cube' | 'room' | 'hallway';
export type Point = { x: number; y: number };
export type Segment = { from: Point; to: Point; kind?: 'solid' | 'guide' | 'detail' };
export type Stroke = { points: Point[]; color: string; width: number; eraser?: boolean };
export type Exercise = {
  id: LessonId;
  number: string;
  title: string;
  shortTitle: string;
  difficulty: string;
  minutes: number;
  objective: string;
  description: string;
  steps: string[];
  accent: string;
};
export type Geometry = {
  horizonY: number;
  vanishing: Point;
  guide: Segment[];
  reference: Segment[];
  sample: Stroke[];
};

export type Critique = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  primaryWeakness: string;
};

export type PracticeExercise = { title: string; objective: string; steps: string[] };
export type Coaching = {
  encouragement: string;
  explanation: string;
  corrections: { issue: string; howToFix: string }[];
  nextExercise: PracticeExercise;
  motivationalMessage: string;
};

export type ReviewFeedback = { critic: Critique; coach: Coaching };
export type ReviewRequest = {
  image: string;
  exerciseId: LessonId;
  instructions: string[];
  difficulty: string;
  seed: number;
  geometry: Pick<Geometry, 'horizonY' | 'vanishing' | 'reference'>;
  strokeCount: number;
};
