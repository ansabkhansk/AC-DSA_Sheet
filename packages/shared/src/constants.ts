export const Difficulty = {
  Easy: 'Easy',
  Medium: 'Medium',
  Hard: 'Hard',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const UserRole = {
  student: 'student',
  admin: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
