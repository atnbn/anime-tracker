type BadgeStatus = "watching" | "completed" | "planned" | "dropped" | "onhold";

type BadgeProps = {
  status: BadgeStatus;
};

const statusClasses: Record<BadgeStatus, string> = {
  onhold: "bg-amber-400/15 text-warning ring-amber-400/30",
  watching: "bg-cyan-400/15 text-accent ring-cyan-400/30",
  completed: "bg-emerald-400/15 text-success ring-emerald-400/30",
  planned: "bg-fuchsia-400/15 text-accent ring-fuchsia-400/30",
  dropped: "bg-red-400/15 text-danger ring-red-400/30",
};

const Badge = ({ status }: BadgeProps) => {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1",
        statusClasses[status],
      ].join(" ")}
    >
      {status}
    </span>
  );
};

export type { BadgeStatus };
export default Badge;
