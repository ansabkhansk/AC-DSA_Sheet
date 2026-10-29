import { useMemo } from 'react';
import { useProgressStats } from '../../progress/hooks';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { addDays, toDateKeyLocal } from '../dateUtils';

function levelForCount(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export function ActivityHeatmap() {
  const { data, isLoading, isError, refetch, isFetching } = useProgressStats();

  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = addDays(today, -119);
    const counts = new Map((data?.activity ?? []).map((row) => [row.date, row.count]));
    const result: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 120; i += 1) {
      const date = toDateKeyLocal(addDays(start, i));
      result.push({ date, count: counts.get(date) ?? 0 });
    }
    return result;
  }, [data?.activity]);

  if (isLoading) {
    return <Spinner label="Loading activity…" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4" role="alert">
        <p className="text-sm text-text">We could not load your activity heatmap.</p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Retrying…' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-text">Activity heatmap</h2>
          <p className="text-sm text-muted">
            Last 120 days from completed problems · streak {data.streak} day
            {data.streak === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`heatmap-cell heatmap-level-${level} h-3 w-3 rounded-sm`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
      <div
        className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label="Study activity heatmap for the last 120 days"
      >
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.count} completed`}
            className={`heatmap-cell heatmap-level-${levelForCount(cell.count)} h-3 w-3 rounded-sm`}
          />
        ))}
      </div>
    </section>
  );
}
