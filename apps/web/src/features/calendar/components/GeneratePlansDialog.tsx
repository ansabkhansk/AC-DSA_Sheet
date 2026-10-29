import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useGeneratePlans } from '../hooks';
import { toDateKeyLocal } from '../dateUtils';

type GeneratePlansDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function GeneratePlansDialog({ open, onClose }: GeneratePlansDialogProps) {
  const generateMutation = useGeneratePlans();
  const today = toDateKeyLocal(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [perDay, setPerDay] = useState(3);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const result = await generateMutation.mutateAsync({ startDate, endDate, perDay });
      setMessage(
        result.created === 0
          ? 'No new plans were created. Unsolved problems may already be scheduled.'
          : `Created ${result.created} plan${result.created === 1 ? '' : 's'} (${result.problemsScheduled} problems).`,
      );
    } catch {
      setError('We could not generate plans. Check the date range and try again.');
    }
  }

  return (
    <Modal open={open} title="Auto-generate study plans" onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <p className="text-sm text-muted">
          Fills unsolved, unplanned problems in sheet order across the selected dates.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="gen-start" className="block text-sm font-medium text-text">
              Start date
            </label>
            <input
              id="gen-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="gen-end" className="block text-sm font-medium text-text">
              End date
            </label>
            <input
              id="gen-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="gen-per-day" className="block text-sm font-medium text-text">
            Problems per day (1–20)
          </label>
          <input
            id="gen-per-day"
            type="number"
            min={1}
            max={20}
            value={perDay}
            onChange={(event) => setPerDay(Number(event.target.value))}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
            required
          />
        </div>
        {message ? <p className="text-sm text-text">{message}</p> : null}
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={generateMutation.isPending}>
          {generateMutation.isPending ? 'Generating…' : 'Generate'}
        </Button>
      </form>
    </Modal>
  );
}
