import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useAuthStore } from '../../auth/store';
import { useProgressStats } from '../../progress/hooks';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, refetch, isFetching } = useProgressStats();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
        <Spinner label="Loading progress…" />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
        <div className="rounded-lg border border-border bg-surface p-6" role="alert">
          <p className="text-text">We could not load your progress right now.</p>
          <Button className="mt-4" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      </section>
    );
  }

  const { totals, streak, lastActivity } = data;
  const continueHref =
    lastActivity?.chapterSlug && lastActivity.problemId
      ? `/sheet/${lastActivity.chapterSlug}#problem-${lastActivity.problemId}`
      : null;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
        <p className="text-muted">
          Welcome{user?.name ? `, ${user.name}` : ''}. Track what you have solved and pick up where
          you left off.
        </p>
      </header>

      {totals.solved === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Start the sheet</h2>
          <p className="mt-2 text-muted">
            You have not marked any problems yet. Open the sheet and tick your first problem to
            begin tracking progress.
          </p>
          <Link to="/sheet" className="mt-4 inline-block no-underline">
            <Button>Open DSA Sheet</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-muted">Solved</p>
              <p className="mt-1 text-2xl font-semibold text-text">
                {totals.solved}
                <span className="text-base font-normal text-muted"> / {totals.totalProblems}</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-muted">Current streak</p>
              <p className="mt-1 text-2xl font-semibold text-text">
                {streak}{' '}
                <span className="text-base font-normal text-muted">
                  day{streak === 1 ? '' : 's'}
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-muted">By difficulty</p>
              <p className="mt-1 text-sm text-text">
                Easy {totals.byDifficulty.Easy ?? 0} · Medium {totals.byDifficulty.Medium ?? 0} ·
                Hard {totals.byDifficulty.Hard ?? 0}
              </p>
            </div>
          </div>

          {continueHref ? (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h2 className="text-lg font-semibold text-text">Continue learning</h2>
              <p className="mt-1 text-sm text-muted">
                Resume at your last marked problem
                {lastActivity?.problemSlug ? ` (${lastActivity.problemSlug})` : ''}.
              </p>
              <Link to={continueHref} className="mt-3 inline-block no-underline">
                <Button>Continue</Button>
              </Link>
            </div>
          ) : null}

          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="text-lg font-semibold text-text">Progress by chapter</h2>
            <ul className="mt-3 space-y-2">
              {totals.byChapter.map((chapter) => (
                <li
                  key={chapter.chapterId}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-b-0"
                >
                  <Link
                    to={`/sheet/${chapter.slug}`}
                    className="font-medium text-accent no-underline"
                  >
                    {chapter.title}
                  </Link>
                  <span className="text-muted">
                    {chapter.solved} / {chapter.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
