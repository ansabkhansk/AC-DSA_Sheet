type ProblemCheckboxProps = {
  problemId: string;
  title: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (done: boolean) => void;
};

export function ProblemCheckbox({
  problemId,
  title,
  checked,
  disabled = false,
  onChange,
}: ProblemCheckboxProps) {
  return (
    <label className="inline-flex shrink-0 items-center gap-2 text-sm text-text">
      <input
        type="checkbox"
        className="h-4 w-4 accent-accent"
        checked={checked}
        disabled={disabled}
        aria-label={`Mark ${title} as done`}
        data-problem-id={problemId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="sr-only">Done</span>
    </label>
  );
}
