import { z } from 'zod';
import { Difficulty, UserRole } from './constants.js';

export const difficultySchema = z.enum(Difficulty);

export const userRoleSchema = z.enum(UserRole);

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(254),
  password: z.string().min(1, 'Password is required').max(128),
});

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
});
