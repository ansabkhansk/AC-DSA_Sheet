import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { NotFoundPage } from '../../auth/pages/NotFoundPage';
import { useAuthStore } from '../../auth/store';
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
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, refetch, isFetching } = useSheet();

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('All');
  const [openOverride, setOpenOverride] = useState<Set<string> | null>(null);
  const [trackedSlug, setTrackedSlug] = useState(chapterSlug);

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

  const openSlugs =
    openOverride ?? (data ? defaultOpenSlugs(data, chapterSlug) : new Set<string>());

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

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-text">DSA Sheet</h1>
        <p className="text-muted">
          Work through chapters, topics, and problems with curated practice links.
        </p>
      </header>

      {!user ? <SignInPrompt /> : null}

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
            />
          ))}
        </div>
      )}
    </section>
  );
}
