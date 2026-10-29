import type { SheetProblem } from '../api';
import { DifficultyBadge } from '../../../components/ui/Badge';
import { ProblemCheckbox } from './ProblemCheckbox';

function ResourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-md border border-border bg-bg px-2 py-1 text-xs font-medium text-accent no-underline hover:bg-surface"
    >
      {label}
    </a>
  );
}

type ProblemRowProps = {
  problem: SheetProblem;
  showCheckbox?: boolean;
  completed?: boolean;
  onToggleDone?: (done: boolean) => void;
  checkboxDisabled?: boolean;
};

export function ProblemRow({
  problem,
  showCheckbox = false,
  completed = false,
  onToggleDone,
  checkboxDisabled = false,
}: ProblemRowProps) {
  const { resources } = problem;

  return (
    <li
      id={`problem-${problem.id}`}
      className="flex flex-col gap-3 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        {showCheckbox && onToggleDone ? (
          <ProblemCheckbox
            problemId={problem.id}
            title={problem.title}
            checked={completed}
            disabled={checkboxDisabled}
            onChange={onToggleDone}
          />
        ) : null}
        <div className="min-w-0 space-y-2">
          <p className="truncate font-medium text-text">{problem.title}</p>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {resources.youtube ? <ResourceLink href={resources.youtube} label="YouTube" /> : null}
        {resources.leetcode ? <ResourceLink href={resources.leetcode} label="LeetCode" /> : null}
        {resources.codeforces ? (
          <ResourceLink href={resources.codeforces} label="Codeforces" />
        ) : null}
        {resources.article ? <ResourceLink href={resources.article} label="Article" /> : null}
      </div>
    </li>
  );
}
