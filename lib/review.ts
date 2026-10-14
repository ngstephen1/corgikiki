import type { Coaching, Critique, ReviewFeedback } from './types';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000;
const isTextArray = (value: unknown, min = 1, max = 6): value is string[] => Array.isArray(value) && value.length >= min && value.length <= max && value.every(isText);
const validSkills = (value: unknown): value is NonNullable<Critique['skills']> => isObject(value) && ['perspective','proportions','creativity','technical'].every(key => Number.isInteger(value[key]) && (value[key] as number) >= 0 && (value[key] as number) <= 100);

export function parseCritique(value: unknown): Critique {
  if (!isObject(value) || !Number.isInteger(value.score) || (value.score as number) < 0 || (value.score as number) > 100 ||
      !isText(value.summary) || !isTextArray(value.strengths) || !isTextArray(value.improvements) || !isText(value.primaryWeakness)) {
    throw new Error('invalid_critic_output');
  }
  return {
    score: value.score as number, summary: value.summary, strengths: value.strengths,
    improvements: value.improvements, primaryWeakness: value.primaryWeakness,
    skills: validSkills(value.skills) ? value.skills : undefined
  };
}

export function parseCoaching(value: unknown): Coaching {
  if (!isObject(value) || !isText(value.encouragement) || !isText(value.explanation) ||
      !Array.isArray(value.corrections) || value.corrections.length < 1 || value.corrections.length > 5 ||
      !value.corrections.every(item => isObject(item) && isText(item.issue) && isText(item.howToFix)) ||
      !isObject(value.nextExercise) || !isText(value.nextExercise.title) || !isText(value.nextExercise.objective) ||
      !isTextArray(value.nextExercise.steps, 3, 4) || !isText(value.motivationalMessage)) {
    throw new Error('invalid_coach_output');
  }
  return value as Coaching;
}

export function parseReview(value: unknown): ReviewFeedback {
  if (!isObject(value)) throw new Error('invalid_review_output');
  return { critic: parseCritique(value.critic), coach: parseCoaching(value.coach) };
}

export const criticSchema = {
  type: 'object', additionalProperties: false,
  required: ['score', 'summary', 'strengths', 'improvements', 'primaryWeakness', 'skills'],
  properties: {
    score: { type: 'integer', description: 'Approximate instructional score from 0 to 100.' },
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } },
    primaryWeakness: { type: 'string' },
    skills: { type: 'object', additionalProperties: false, required: ['perspective','proportions','creativity','technical'], properties: {
      perspective: { type: 'integer' }, proportions: { type: 'integer' }, creativity: { type: 'integer' }, technical: { type: 'integer' }
    } }
  }
};

export const coachingSchema = {
  type: 'object', additionalProperties: false,
  required: ['encouragement', 'explanation', 'corrections', 'nextExercise', 'motivationalMessage'],
  properties: {
    encouragement: { type: 'string' },
    explanation: { type: 'string' },
    corrections: {
      type: 'array', items: { type: 'object', additionalProperties: false, required: ['issue', 'howToFix'], properties: {
        issue: { type: 'string' }, howToFix: { type: 'string' }
      } }
    },
    nextExercise: { type: 'object', additionalProperties: false, required: ['title', 'objective', 'steps'], properties: {
      title: { type: 'string' }, objective: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } }
    } },
    motivationalMessage: { type: 'string' }
  }
};
