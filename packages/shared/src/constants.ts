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

export const ProgressStatus = {
  done: 'done',
  revisit: 'revisit',
} as const;

export type ProgressStatus = (typeof ProgressStatus)[keyof typeof ProgressStatus];

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export const PlanStatus = {
  planned: 'planned',
  done: 'done',
  missed: 'missed',
} as const;

export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];

/** Spaced-repetition offsets (days from local today) when marking revisit. */
export const REVISIT_OFFSETS_DAYS = [1, 3, 7] as const;
