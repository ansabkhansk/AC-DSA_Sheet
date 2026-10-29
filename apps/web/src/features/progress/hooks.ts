import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProgressStatus } from '@dsa/shared';
import { useAuthStore } from '../auth/store';
import {
  deleteProgress,
  fetchMyProgress,
  fetchProgressStats,
  upsertProgress,
  type MyProgress,
} from './api';

export const progressKeys = {
  me: ['progress', 'me'] as const,
  stats: ['progress', 'stats'] as const,
};

export function useMyProgress() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: progressKeys.me,
    queryFn: fetchMyProgress,
    enabled: Boolean(user),
  });
}

export function useProgressStats() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: progressKeys.stats,
    queryFn: fetchProgressStats,
    enabled: Boolean(user),
  });
}

export type ToggleProgressVariables = {
  problemId: string;
  done: boolean;
};

/** Latest intended checkbox state per problem — used to ignore stale failures. */
const latestIntent = new Map<string, boolean>();

/**
 * Optimistic checkbox toggle. Updates the cache immediately; reverts only when the
 * failed request still matches the user's latest choice for that problem.
 */
export function useToggleProgress(onErrorMessage?: (message: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ problemId, done }: ToggleProgressVariables) => {
      if (done) {
        await upsertProgress(problemId, ProgressStatus.done);
      } else {
        await deleteProgress(problemId);
      }
    },
    onMutate: async ({ problemId, done }) => {
      latestIntent.set(problemId, done);
      await queryClient.cancelQueries({ queryKey: progressKeys.me });
      const previous = queryClient.getQueryData<MyProgress>(progressKeys.me);

      queryClient.setQueryData<MyProgress>(progressKeys.me, (current) => {
        const base = current ?? { completedProblemIds: [], lastActivity: null };
        const ids = new Set(base.completedProblemIds);
        if (done) {
          ids.add(problemId);
        } else {
          ids.delete(problemId);
        }
        return {
          ...base,
          completedProblemIds: [...ids],
        };
      });

      return { previous, problemId, done };
    },
    onError: (_error, variables, context) => {
      if (latestIntent.get(variables.problemId) !== variables.done) {
        return;
      }
      if (context?.previous) {
        queryClient.setQueryData(progressKeys.me, context.previous);
      }
      onErrorMessage?.('We could not update your progress. Please try again.');
    },
    onSettled: async (_data, _error, variables) => {
      if (latestIntent.get(variables.problemId) !== variables.done) {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: progressKeys.me }),
        queryClient.invalidateQueries({ queryKey: progressKeys.stats }),
      ]);
    },
  });
}
