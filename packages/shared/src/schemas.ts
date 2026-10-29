import { z } from 'zod';
import { Difficulty, PlanStatus, ProgressStatus, UserRole } from './constants.js';

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

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a valid ObjectId');

export const progressStatusSchema = z.enum(ProgressStatus);

export const progressParamsSchema = z.object({
  problemId: objectIdSchema,
});

export const upsertProgressBodySchema = z.object({
  status: progressStatusSchema,
});

export const lastActivitySchema = z.object({
  problemId: z.string(),
  topicId: z.string(),
  chapterId: z.string(),
  chapterSlug: z.string().optional(),
  problemSlug: z.string().optional(),
  at: z.string(),
});

export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const planStatusSchema = z.enum(PlanStatus);

function inclusiveDaySpan(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((end - start) / 86_400_000) + 1;
}

export const listPlansQuerySchema = z
  .object({
    from: dateKeySchema,
    to: dateKeySchema,
  })
  .superRefine((value, ctx) => {
    if (value.from > value.to) {
      ctx.addIssue({
        code: 'custom',
        message: '`from` must be on or before `to`',
        path: ['from'],
      });
      return;
    }
    if (inclusiveDaySpan(value.from, value.to) > 62) {
      ctx.addIssue({
        code: 'custom',
        message: 'Date range cannot exceed 62 days',
        path: ['to'],
      });
    }
  });

export const createPlanBodySchema = z.object({
  date: dateKeySchema,
  title: z.string().trim().min(1, 'Title is required').max(200),
  problemIds: z.array(objectIdSchema).max(50).default([]),
  topicId: objectIdSchema.optional(),
  note: z.string().trim().max(2000).optional(),
  status: planStatusSchema.optional(),
});

export const updatePlanBodySchema = z
  .object({
    date: dateKeySchema.optional(),
    title: z.string().trim().min(1).max(200).optional(),
    problemIds: z.array(objectIdSchema).max(50).optional(),
    topicId: objectIdSchema.nullable().optional(),
    note: z.string().trim().max(2000).nullable().optional(),
    status: planStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const planIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const generatePlansBodySchema = z
  .object({
    startDate: dateKeySchema,
    endDate: dateKeySchema,
    perDay: z.number().int().min(1).max(20),
  })
  .superRefine((value, ctx) => {
    if (value.startDate > value.endDate) {
      ctx.addIssue({
        code: 'custom',
        message: '`startDate` must be on or before `endDate`',
        path: ['startDate'],
      });
      return;
    }
    if (inclusiveDaySpan(value.startDate, value.endDate) > 365) {
      ctx.addIssue({
        code: 'custom',
        message: 'Date range cannot exceed 365 days',
        path: ['endDate'],
      });
    }
  });
