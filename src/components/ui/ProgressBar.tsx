type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
};

const ProgressBar = ({ value, max = 100, label }: ProgressBarProps) => {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), safeMax);
  const percentage = (safeValue / safeMax) * 100;

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-xs font-medium text-muted">{label}</p>
      ) : null}
      <div role="progressbar" aria-label={label ?? "Progress"} aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={safeMax} className="h-2.5 w-full overflow-hidden rounded-full bg-surface ring-1 ring-line">
        <div
          className="h-full rounded-full bg-linear-to-r from-cyan-400 via-sky-400 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
