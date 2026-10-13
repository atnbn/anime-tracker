import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const Input = ({ label, className = "", id, ...props }: InputProps) => {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="text-sm font-medium text-muted">{label}</span>
      ) : null}
      <input
        id={id}
        className={[
          "h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm text-foreground placeholder:text-muted shadow-inner shadow-black/30 backdrop-blur transition-all duration-200 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-400/30",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </label>
  );
};

export default Input;
