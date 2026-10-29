import { Difficulty } from '@dsa/shared';
import { Button } from '../../../components/ui/Button';

export type DifficultyFilter = 'All' | keyof typeof Difficulty;

type SheetFiltersProps = {
  search: string;
  difficulty: DifficultyFilter;
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: DifficultyFilter) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
};

export function SheetFilters({
  search,
  difficulty,
  onSearchChange,
  onDifficultyChange,
  onClear,
  hasActiveFilters,
}: SheetFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1.5">
        <label htmlFor="sheet-search" className="block text-sm font-medium text-text">
          Search problems
        </label>
        <input
          id="sheet-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title"
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text placeholder:text-muted"
        />
      </div>

      <div className="space-y-1.5 sm:w-44">
        <label htmlFor="sheet-difficulty" className="block text-sm font-medium text-text">
          Difficulty
        </label>
        <select
          id="sheet-difficulty"
          value={difficulty}
          onChange={(event) => onDifficultyChange(event.target.value as DifficultyFilter)}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
        >
          <option value="All">All</option>
          <option value={Difficulty.Easy}>Easy</option>
          <option value={Difficulty.Medium}>Medium</option>
          <option value={Difficulty.Hard}>Hard</option>
        </select>
      </div>

      {hasActiveFilters ? (
        <Button type="button" variant="secondary" onClick={onClear} className="sm:mb-0.5">
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
