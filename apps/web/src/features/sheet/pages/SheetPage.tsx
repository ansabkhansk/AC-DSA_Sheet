import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { NotFoundPage } from '../../auth/pages/NotFoundPage';
import { useAuthStore } from '../../auth/store';
import { useMarkRevisit, useMyProgress, useToggleProgress } from '../../progress/hooks';
import type { SheetChapter } from '../api';
import { ChapterAccordion } from '../components/ChapterAccordion';
import { SheetFilters, type DifficultyFilter } from '../components/SheetFilters';
import { SignInPrompt } from '../components/SignInPrompt';
import { useSheet } from '../hooks';

function filterSheet(
  chapters: SheetChapter[],
  search: string,
  difficulty: DifficultyFilter,
): SheetChapter[] {
  const query = search.trim().toLowerCase();

  return chapters
    .map((chapter) => {
      const topics = chapter.topics
        .map((topic) => {
          const problems = topic.problems.filter((problem) => {
            const matchesDifficulty =
              difficulty === 'All' ? true : problem.difficulty === difficulty;
            const matchesSearch = query.length === 0 || problem.title.toLowerCase().includes(query);
            return matchesDifficulty && matchesSearch;
          });
          return { ...topic, problems };
        })
        .filter((topic) => topic.problems.length > 0);

      return { ...chapter, topics };
    })
    .filter((chapter) => chapter.topics.length > 0);
}

function defaultOpenSlugs(chapters: SheetChapter[], chapterSlug?: string): Set<string> {
  if (chapterSlug && chapters.some((chapter) => chapter.slug === chapterSlug)) {
    return new Set([chapterSlug]);
  }
  if (chapters[0]) {
    return new Set([chapters[0].slug]);
  }
  return new Set();
}

function findChapterSlugForProblem(chapters: SheetChapter[], problemId: string): string | null {
  for (const chapter of chapters) {
    for (const topic of chapter.topics) {
      if (topic.problems.some((problem) => problem.id === problemId)) {
        return chapter.slug;
      }
    }
  }
  return null;
}

function SheetSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      ))}
    </div>
  );
}

export function SheetPage() {
  const { chapterSlug } = useParams();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, refetch, isFetching } = useSheet();
  const progressQuery = useMyProgress();

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('All');
  const [openOverride, setOpenOverride] = useState<Set<string> | null>(null);
  const [trackedSlug, setTrackedSlug] = useState(chapterSlug);
  const [progressError, setProgressError] = useState<string | null>(null);

  const toggleProgress = useToggleProgress((message) => setProgressError(message));
  const markRevisit = useMarkRevisit((message) => setProgressError(message));

  // Reset manual accordion overrides when the deep-link slug changes.
  if (chapterSlug !== trackedSlug) {
    setTrackedSlug(chapterSlug);
    setOpenOverride(null);
  }

  const hasActiveFilters = search.trim().length > 0 || difficulty !== 'All';

  const filtered = useMemo(() => {
    if (!data) {
      return [];
    }
    return filterSheet(data, search, difficulty);
  }, [data, search, difficulty]);

  const hashProblemId = location.hash.startsWith('#problem-')
    ? location.hash.slice('#problem-'.length)
    : null;

  const openSlugs = useMemo(() => {
    if (openOverride) {
      return openOverride;
    }
    if (!data) {
      return new Set<string>();
    }
    if (hashProblemId) {
      const slug = findChapterSlugForProblem(data, hashProblemId);
      if (slug) {
        return new Set([slug]);
      }
    }
    return defaultOpenSlugs(data, chapterSlug);
  }, [openOverride, data, chapterSlug, hashProblemId]);

  useEffect(() => {
    if (!hashProblemId || !data) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`problem-${hashProblemId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hashProblemId, data, openSlugs]);

  const completedIds = useMemo(
    () => new Set(progressQuery.data?.completedProblemIds ?? []),
    [progressQuery.data?.completedProblemIds],
  );

  if (isLoading) {
    return (
      <section className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-text">DSA Sheet</h1>
          <p className="mt-1 text-muted">Loading chapters and problems…</p>
        </header>
        <Spinner label="Loading sheet…" />
        <SheetSkeleton />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-text">DSA Sheet</h1>
        </header>
        <div className="rounded-lg border border-border bg-surface p-6" role="alert">
          <p className="text-text">We could not load the sheet right now.</p>
          <Button className="mt-4" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      </section>
    );
  }

  if (chapterSlug && !data.some((chapter) => chapter.slug === chapterSlug)) {
    return <NotFoundPage />;
  }

  function toggleChapter(slug: string) {
    setOpenOverride((current) => {
      const base = current ?? defaultOpenSlugs(data ?? [], chapterSlug);
      const next = new Set(base);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  function clearFilters() {
    setSearch('');
    setDifficulty('All');
  }

  function handleToggleDone(problemId: string, done: boolean) {
    setProgressError(null);
    toggleProgress.mutate({ problemId, done });
  }

  function handleMarkRevisit(problemId: string) {
    setProgressError(null);
    markRevisit.mutate(problemId);
  }

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-text">DSA Sheet</h1>
        <p className="text-muted">
          Work through chapters, topics, and problems with curated practice links.
        </p>
      </header>

      {!user ? <SignInPrompt /> : null}

      {progressError ? (
        <div
          className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {progressError}
        </div>
      ) : null}

      <SheetFilters
        search={search}
        difficulty={difficulty}
        onSearchChange={setSearch}
        onDifficultyChange={setDifficulty}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-text">No problems match your filters.</p>
          <Button className="mt-4" variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((chapter) => (
            <ChapterAccordion
              key={chapter.id}
              chapter={chapter}
              open={openSlugs.has(chapter.slug)}
              onToggle={() => toggleChapter(chapter.slug)}
              showCheckboxes={Boolean(user)}
              completedIds={completedIds}
              onToggleDone={handleToggleDone}
              onMarkRevisit={handleMarkRevisit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
