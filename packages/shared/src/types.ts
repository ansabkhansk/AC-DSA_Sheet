import type { z } from 'zod';
import type { difficultySchema, loginSchema, publicUserSchema, registerSchema } from './schemas.js';

export type DifficultyValue = z.infer<typeof difficultySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
