import type { SheetProblem } from '../api';
import { DifficultyBadge } from '../../../components/ui/Badge';

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

export function ProblemRow({ problem }: { problem: SheetProblem }) {
  const { resources } = problem;

  return (
    <li className="flex flex-col gap-3 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="truncate font-medium text-text">{problem.title}</p>
        <DifficultyBadge difficulty={problem.difficulty} />
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
