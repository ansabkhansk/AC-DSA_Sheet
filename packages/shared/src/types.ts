import type { z } from 'zod';
import type {
  createPlanBodySchema,
  difficultySchema,
  generatePlansBodySchema,
  lastActivitySchema,
  listPlansQuerySchema,
  loginSchema,
  planStatusSchema,
  problemResourcesSchema,
  progressStatusSchema,
  publicUserSchema,
  registerSchema,
  sheetSeedSchema,
  updatePlanBodySchema,
  upsertProgressBodySchema,
} from './schemas.js';

export type DifficultyValue = z.infer<typeof difficultySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type ProblemResources = z.infer<typeof problemResourcesSchema>;
export type SheetSeed = z.infer<typeof sheetSeedSchema>;
export type ProgressStatusValue = z.infer<typeof progressStatusSchema>;
export type UpsertProgressInput = z.infer<typeof upsertProgressBodySchema>;
export type LastActivity = z.infer<typeof lastActivitySchema>;
export type PlanStatusValue = z.infer<typeof planStatusSchema>;
export type CreatePlanInput = z.infer<typeof createPlanBodySchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanBodySchema>;
export type ListPlansQuery = z.infer<typeof listPlansQuerySchema>;
export type GeneratePlansInput = z.infer<typeof generatePlansBodySchema>;
