import type { z } from 'zod';
import type { difficultySchema } from './schemas.js';

export type DifficultyValue = z.infer<typeof difficultySchema>;
