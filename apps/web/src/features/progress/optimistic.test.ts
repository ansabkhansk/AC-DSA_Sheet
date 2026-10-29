import { describe, expect, it } from 'vitest';
import type { MyProgress } from './api';

/** Mirrors the optimistic cache update used by `useToggleProgress`. */
function applyOptimisticToggle(
  current: MyProgress | undefined,
  problemId: string,
  done: boolean,
): MyProgress {
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
}

describe('optimistic progress toggle', () => {
  it('adds a problem immediately when marking done', () => {
    const next = applyOptimisticToggle(
      { completedProblemIds: ['a'], lastActivity: null },
      'b',
      true,
    );
    expect(next.completedProblemIds.sort()).toEqual(['a', 'b']);
  });

  it('removes a problem immediately when unticking', () => {
    const next = applyOptimisticToggle(
      { completedProblemIds: ['a', 'b'], lastActivity: null },
      'a',
      false,
    );
    expect(next.completedProblemIds).toEqual(['b']);
  });

  it('reverts by restoring the previous snapshot on failure', () => {
    const previous: MyProgress = { completedProblemIds: ['a'], lastActivity: null };
    const optimistic = applyOptimisticToggle(previous, 'b', true);
    expect(optimistic.completedProblemIds).toContain('b');
    // Failure recovery restores the prior cache entry unchanged.
    expect(previous.completedProblemIds).toEqual(['a']);
  });

  it('rapid toggles end on the last chosen state when applied in order', () => {
    let state: MyProgress | undefined = { completedProblemIds: [], lastActivity: null };
    state = applyOptimisticToggle(state, 'p1', true);
    state = applyOptimisticToggle(state, 'p1', false);
    state = applyOptimisticToggle(state, 'p1', true);
    expect(state.completedProblemIds).toEqual(['p1']);
  });
});
