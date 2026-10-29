import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePlanInput, GeneratePlansInput, UpdatePlanInput } from '@dsa/shared';
import { useAuthStore } from '../auth/store';
import {
  createPlan,
  deletePlan,
  fetchPlans,
  generatePlans,
  updatePlan,
  type StudyPlan,
} from './api';

export const planKeys = {
  range: (from: string, to: string) => ['plans', from, to] as const,
};

export function usePlans(from: string, to: string) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: planKeys.range(from, to),
    queryFn: () => fetchPlans(from, to),
    enabled: Boolean(user) && Boolean(from) && Boolean(to),
  });
}

function invalidatePlanQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ['plans'] });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => createPlan(input),
    onSuccess: async () => {
      await invalidatePlanQueries(queryClient);
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlanInput }) => updatePlan(id, input),
    onSuccess: async () => {
      await invalidatePlanQueries(queryClient);
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: async () => {
      await invalidatePlanQueries(queryClient);
    },
  });
}

export function useGeneratePlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeneratePlansInput) => generatePlans(input),
    onSuccess: async () => {
      await invalidatePlanQueries(queryClient);
    },
  });
}

export type { StudyPlan };
