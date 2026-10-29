import type { Difficulty } from '@dsa/shared';
import { cn } from '../../lib/utils';

const styles: Record<Difficulty, string> = {
  Easy: 'bg-easy-bg text-easy-text',
  Medium: 'bg-medium-bg text-medium-text',
  Hard: 'bg-hard-bg text-hard-text',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        styles[difficulty],
      )}
    >
      {difficulty}
    </span>
  );
}
