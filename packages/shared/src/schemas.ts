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

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), {
    message: 'URL must use https',
  });

export const problemResourcesSchema = z
  .object({
    youtube: httpsUrlSchema,
    article: httpsUrlSchema,
    leetcode: httpsUrlSchema.optional(),
    codeforces: httpsUrlSchema.optional(),
  })
  .refine((resources) => Boolean(resources.leetcode || resources.codeforces), {
    message: 'At least one of leetcode or codeforces is required',
  });

export const seedProblemSchema = z.object({
  title: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  difficulty: difficultySchema,
  order: z.number().int().positive(),
  resources: problemResourcesSchema,
});

export const seedTopicSchema = z.object({
  title: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  order: z.number().int().positive(),
  problems: z.array(seedProblemSchema).min(1),
});

export const seedChapterSchema = z.object({
  title: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  order: z.number().int().positive(),
  description: z.string().trim().min(1),
  topics: z.array(seedTopicSchema).min(1),
});

export const sheetSeedSchema = z.object({
  chapters: z.array(seedChapterSchema).min(8).max(10),
});

export const problemsQuerySchema = z.object({
  difficulty: difficultySchema.optional(),
  topic: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'topic must be a valid ObjectId')
    .optional(),
});
