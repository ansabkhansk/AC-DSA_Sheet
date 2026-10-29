import type { SheetChapter } from '../api';
import { ProblemRow } from './ProblemRow';

type ChapterAccordionProps = {
  chapter: SheetChapter;
  open: boolean;
  onToggle: () => void;
  showCheckboxes?: boolean;
  completedIds?: Set<string>;
  onToggleDone?: (problemId: string, done: boolean) => void;
  onMarkRevisit?: (problemId: string) => void;
  checkboxDisabled?: boolean;
};

export function ChapterAccordion({
  chapter,
  open,
  onToggle,
  showCheckboxes = false,
  completedIds,
  onToggleDone,
  onMarkRevisit,
  checkboxDisabled = false,
}: ChapterAccordionProps) {
  const panelId = `chapter-panel-${chapter.slug}`;
  const buttonId = `chapter-button-${chapter.slug}`;
  const problemCount = chapter.topics.reduce((total, topic) => total + topic.problems.length, 0);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <h2 className="m-0">
        <button
          id={buttonId}
          type="button"
          className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-bg"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-text">{chapter.title}</span>
            <span className="mt-1 block text-sm text-muted">{chapter.description}</span>
          </span>
          <span className="shrink-0 text-sm text-muted">
            {problemCount} problems · {open ? 'Hide' : 'Show'}
          </span>
        </button>
      </h2>

      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open}>
        <div className="space-y-4 border-t border-border px-4 py-4">
          {chapter.topics.map((topic) => (
            <div key={topic.id}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                {topic.title}
              </h3>
              <ul className="m-0 list-none p-0">
                {topic.problems.map((problem) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    showCheckbox={showCheckboxes}
                    completed={completedIds?.has(problem.id) ?? false}
                    checkboxDisabled={checkboxDisabled}
                    onToggleDone={
                      onToggleDone ? (done) => onToggleDone(problem.id, done) : undefined
                    }
                    onMarkRevisit={onMarkRevisit ? () => onMarkRevisit(problem.id) : undefined}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
