import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
  }
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#c5ed83] text-[#20251c] hover:bg-[#b3df6c]",
  secondary:
    "bg-surface text-foreground ring-1 ring-line hover:bg-surface",
  ghost: "bg-transparent text-muted hover:bg-surface",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const Button = ({
  children,
  type = "button",
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
