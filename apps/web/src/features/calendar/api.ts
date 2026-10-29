import type { CreatePlanInput, GeneratePlansInput, PlanStatus, UpdatePlanInput } from '@dsa/shared';
import { http } from '../../lib/http';

type ApiSuccess<T> = { success: true; data: T };

export type StudyPlan = {
  id: string;
  date: string;
  title: string;
  problemIds: string[];
  topicId: string | null;
  status: PlanStatus;
  note: string | null;
  kind: string;
};

export async function fetchPlans(from: string, to: string): Promise<StudyPlan[]> {
  const { data } = await http.get<ApiSuccess<{ plans: StudyPlan[] }>>('/api/v1/plans', {
    params: { from, to },
  });
  return data.data.plans;
}

export async function createPlan(input: CreatePlanInput): Promise<StudyPlan> {
  const { data } = await http.post<ApiSuccess<{ plan: StudyPlan }>>('/api/v1/plans', input);
  return data.data.plan;
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<StudyPlan> {
  const { data } = await http.patch<ApiSuccess<{ plan: StudyPlan }>>(`/api/v1/plans/${id}`, input);
  return data.data.plan;
}

export async function deletePlan(id: string): Promise<void> {
  await http.delete(`/api/v1/plans/${id}`);
}

export async function generatePlans(
  input: GeneratePlansInput,
): Promise<{ created: number; problemsScheduled: number }> {
  const { data } = await http.post<ApiSuccess<{ created: number; problemsScheduled: number }>>(
    '/api/v1/plans/generate',
    input,
  );
  return data.data;
}
