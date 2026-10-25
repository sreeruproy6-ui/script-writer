import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { cn } from "../utils/cn";
import type { ToastData } from "../types";

/* ------------------------------------------------------------------ Logo */

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`ring-${gradientId}`} x1="4" y1="3" x2="44" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id={`glyph-${gradientId}`} x1="16" y1="14" x2="33" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ddd6fe" />
          <stop offset="1" stopColor="#f9a8d4" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill="#101827" stroke={`url(#ring-${gradientId})`} strokeWidth="1.6" />
      <path
        d="M16.5 33.5V15.2h7.2a5.3 5.3 0 0 1 0 10.6h-7.2M23.9 25.8l6 7.7"
        stroke={`url(#glyph-${gradientId})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34.4" cy="15.4" r="2.7" fill="#22d3ee" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="gradient-text text-[17px] font-extrabold tracking-tight">Roy AI</span>
        {!compact && (
          <span className="rounded border border-line bg-panel-2 px-1 py-px text-[9px] font-bold tracking-wider text-faint">
            STUDIO
          </span>
        )}
      </div>
      {!compact && (
        <p className="mt-0.5 truncate text-[10.5px] font-medium tracking-wide text-faint">
          Anime localization studio
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  trailing,
  block,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn("btn", variantClass[variant], sizeClass[size], block && "w-full", className)}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {children}
      {trailing}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel-2 text-muted transition hover:border-line/80 hover:bg-panel-3 hover:text-white focus-visible:ring-2 focus-visible:ring-violet/50 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ Badge */

type BadgeTone = "violet" | "pink" | "cyan" | "green" | "amber" | "red" | "slate";

const badgeTone: Record<BadgeTone, string> = {
  violet: "border-violet-400/25 bg-violet/10 text-violet-soft",
  pink: "border-pink-400/25 bg-pink/10 text-pink-200",
  cyan: "border-cyan-400/25 bg-cyan/10 text-cyan-200",
  green: "border-emerald-400/25 bg-emerald/10 text-emerald-200",
  amber: "border-amber-400/25 bg-amber/10 text-amber-100",
  red: "border-red-400/25 bg-red-500/10 text-red-200",
  slate: "border-line bg-white/[0.03] text-muted",
};

export function Badge({
  children,
  tone = "slate",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("chip", badgeTone[tone], className)}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "green" && "bg-emerald-400",
            tone === "amber" && "bg-amber-400",
            tone === "red" && "bg-red-400",
            tone === "cyan" && "bg-cyan-400",
            tone === "pink" && "bg-pink-400",
            tone === "violet" && "bg-violet-400",
            tone === "slate" && "bg-slate-400"
          )}
        />
      )}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Form */

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
  optional,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="label mb-0" htmlFor={htmlFor}>
          {label}
        </label>
        {optional && <span className="text-[10.5px] font-medium text-faint">Optional</span>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  title,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold text-slate-200">{title}</p>
        {description && <p className="mt-0.5 text-[11px] leading-relaxed text-faint">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-[22px] w-[40px] shrink-0 rounded-full border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet/60 focus-visible:ring-offset-2 focus-visible:ring-offset-panel focus-visible:outline-none disabled:opacity-50",
          checked
            ? "border-violet-400/60 bg-gradient-to-r from-violet to-pink shadow-[0_0_14px_-3px_rgba(139,92,246,0.8)]"
            : "border-line bg-panel-3"
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
            checked ? "left-[21px]" : "left-[2px]"
          )}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ Modal */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-fade-up relative z-10 max-h-[92vh] w-full overflow-hidden rounded-t-2xl border border-line bg-panel shadow-2xl shadow-black/60 sm:rounded-2xl",
          width
        )}
      >
        <div className="flex items-start gap-3 border-b border-line-soft px-5 py-4">
          {icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet/10 text-violet-soft">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1.5 text-faint transition hover:bg-white/5 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-line-soft bg-panel-2/50 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Toasts */

export function Toasts({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end">
      {toasts.map((toast) => {
        const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? XCircle : Info;
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-[#0c1422]/95 px-3.5 py-3 shadow-2xl shadow-black/50 backdrop-blur-md",
              toast.tone === "success" && "border-emerald-400/25",
              toast.tone === "error" && "border-red-400/25",
              toast.tone === "info" && "border-violet-400/25"
            )}
          >
            <Icon
              size={16}
              className={cn(
                "mt-0.5 shrink-0",
                toast.tone === "success" && "text-emerald-400",
                toast.tone === "error" && "text-red-400",
                toast.tone === "info" && "text-violet-soft"
              )}
            />
            <p className="flex-1 text-[12.5px] leading-relaxed font-medium text-slate-200">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded p-0.5 text-faint transition hover:text-white"
              aria-label="Dismiss notification"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Misc */

export function ProgressBar({
  value,
  className,
  tone = "gradient",
}: {
  value: number;
  className?: string;
  tone?: "gradient" | "cyan" | "green";
}) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-panel-3", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tone === "gradient" && "bg-gradient-to-r from-violet via-fuchsia-400 to-pink",
          tone === "cyan" && "bg-gradient-to-r from-cyan-500 to-cyan",
          tone === "green" && "bg-gradient-to-r from-emerald-500 to-lime"
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[24px] leading-tight font-extrabold tracking-tight text-white sm:text-[27px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-panel-2 text-violet-soft">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-100">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mono rounded border border-line bg-panel-3 px-1.5 py-0.5 text-[10px] font-medium text-muted">
      {children}
    </kbd>
  );
}
