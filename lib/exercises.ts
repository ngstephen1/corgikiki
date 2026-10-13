import type { Exercise, LessonId } from './types';

export const exercises: Exercise[] = [
  {
    id: 'cube', number: '01', title: 'Your First 3D Cube', shortTitle: 'The 3D Cube',
    difficulty: 'Beginner', minutes: 8, objective: 'Turn a flat square into a believable 3D form.',
    description: 'Discover how a horizon and one vanishing point make simple lines feel like space.',
    steps: [
      'Find the dotted horizon and the little vanishing point.',
      'Draw the front face as a simple square, below the horizon.',
      'Connect its corners toward the vanishing point.',
      'Close the back edge, then darken only the visible cube edges.'
    ], accent: '#f47758'
  },
  {
    id: 'room', number: '02', title: 'Draw Your First Room', shortTitle: 'A Cozy Room',
    difficulty: 'Beginner', minutes: 12, objective: 'Build a room using one-point perspective.',
    description: 'A back wall and four receding lines are all you need to create depth.',
    steps: [
      'Mark the vanishing point inside the small back wall.',
      'Sketch the back wall rectangle around that point.',
      'Draw lines from its corners out to the page edges.',
      'Add a door or window, keeping its verticals straight.'
    ], accent: '#9b93df'
  },
  {
    id: 'hallway', number: '03', title: 'Sketch a Hallway', shortTitle: 'The Hallway',
    difficulty: 'Beginner', minutes: 15, objective: 'Repeat architectural details with consistent depth.',
    description: 'Use a shared vanishing point to give a long corridor rhythm and scale.',
    steps: [
      'Place the vanishing point at the center of the back wall.',
      'Draw the floor and ceiling edges toward that point.',
      'Repeat door frames, making each one smaller in the distance.',
      'Check that the top and bottom edges aim toward the same point.'
    ], accent: '#76b5a5'
  }
];

export function getExercise(id: LessonId) {
  return exercises.find((exercise) => exercise.id === id) ?? exercises[0];
}
