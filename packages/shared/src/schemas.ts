import { z } from 'zod';
import { Difficulty } from './constants.js';

export const difficultySchema = z.enum(Difficulty);
