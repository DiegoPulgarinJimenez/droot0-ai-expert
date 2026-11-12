"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { CheckIcon, CloseIcon, ErrorIcon, InfoIcon } from "./icons";

export type ToastVariant = "info" | "success" | "error";

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before the toast dismisses itself. Use 0 to keep it until dismissed. */
  duration?: number;
};

type ToastRecord = Required<Pick<ToastOptions, "title" | "variant" | "duration">> & {
  id: number;
  description?: string;
};

type ToastContextValue = {
  /** Shows a toast and returns its id. */
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;
/** Errors stay longer: they usually need to be read before acting. */
const ERROR_DURATION = 8000;
const MAX_VISIBLE = 4;

const variantStyles = {
  info: { Icon: InfoIcon, iconStyles: "text-primary" },
  success: { Icon: CheckIcon, iconStyles: "text-success" },
  error: { Icon: ErrorIcon, iconStyles: "text-danger" },
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    const variant = options.variant ?? "info";

    setToasts((current) =>
      [
        ...current,
        {
          id,
          title: options.title,
          description: options.description,
          variant,
          duration: options.duration ?? (variant === "error" ? ERROR_DURATION : DEFAULT_DURATION),
        },
      ].slice(-MAX_VISIBLE),
    );

    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const { Icon, iconStyles } = variantStyles[toast.variant];

  // The timer restarts after hover or focus ends, so a toast never
  // disappears while someone is reading or reaching for it.
  useEffect(() => {
    if (paused || toast.duration === 0) {
      return;
    }

    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [paused, toast.duration, toast.id, onDismiss]);

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-overlay"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconStyles)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm leading-6 text-ink-muted">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }

  return context;
}
