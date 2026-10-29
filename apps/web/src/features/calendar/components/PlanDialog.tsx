import { useState, type FormEvent } from 'react';
import type { StudyPlan } from '../api';
import { useCreatePlan, useDeletePlan, useUpdatePlan } from '../hooks';
import { useSheet } from '../../sheet/hooks';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

type PlanDialogProps = {
  open: boolean;
  date: string;
  plan: StudyPlan | null;
  onClose: () => void;
};

export function PlanDialog({ open, date, plan, onClose }: PlanDialogProps) {
  const sheetQuery = useSheet();
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  const deleteMutation = useDeletePlan();

  const [title, setTitle] = useState(plan?.title ?? 'Study session');
  const [note, setNote] = useState(plan?.note ?? '');
  const [selected, setSelected] = useState<string[]>(plan?.problemIds ?? []);
  const [error, setError] = useState<string | null>(null);

  const problems =
    sheetQuery.data?.flatMap((chapter) =>
      chapter.topics.flatMap((topic) =>
        topic.problems.map((problem) => ({
          id: problem.id,
          label: `${chapter.title} · ${problem.title}`,
        })),
      ),
    ) ?? [];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (plan) {
        await updateMutation.mutateAsync({
          id: plan.id,
          input: {
            title: title.trim(),
            note: note.trim() || null,
            problemIds: selected,
            date,
          },
        });
      } else {
        await createMutation.mutateAsync({
          date,
          title: title.trim() || 'Study session',
          note: note.trim() || undefined,
          problemIds: selected,
        });
      }
      onClose();
    } catch {
      setError('We could not save this plan. Please try again.');
    }
  }

  async function handleDelete() {
    if (!plan) {
      return;
    }
    setError(null);
    try {
      await deleteMutation.mutateAsync(plan.id);
      onClose();
    } catch {
      setError('We could not delete this plan. Please try again.');
    }
  }

  function toggleProblem(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Modal open={open} title={plan ? 'Edit plan' : 'Create plan'} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <p className="text-sm text-muted">Date: {date}</p>

        <div className="space-y-1.5">
          <label htmlFor="plan-title" className="block text-sm font-medium text-text">
            Title
          </label>
          <input
            id="plan-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="plan-note" className="block text-sm font-medium text-text">
            Note
          </label>
          <textarea
            id="plan-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-text">Problems</legend>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {problems.length === 0 ? (
              <p className="text-sm text-muted">Loading problems…</p>
            ) : (
              problems.map((problem) => (
                <label key={problem.id} className="flex items-start gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    className="mt-1 accent-accent"
                    checked={selected.includes(problem.id)}
                    onChange={() => toggleProblem(problem.id)}
                  />
                  <span>{problem.label}</span>
                </label>
              ))
            )}
          </div>
        </fieldset>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {plan ? 'Save changes' : 'Create plan'}
          </Button>
          {plan ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
