import clsx from "clsx";
import { AlertCircle } from "lucide-react";
import { forwardRef, useId, type ComponentProps, type ReactNode } from "react";

export const inputClass = (invalid?: boolean, className?: string) =>
  clsx(
    "block w-full rounded-[var(--radius-control)] border bg-white px-3 text-base text-ink-900 placeholder:text-ink-400",
    "h-12 sm:h-11 transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1",
    invalid ? "border-danger focus:ring-danger" : "border-ink-400 focus:border-brand-blue-600 focus:ring-brand-blue-600",
    className,
  );

type FieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  prefix?: string;
  optional?: boolean;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, prefix, optional, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errId = `${inputId}-err`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-900">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-500">(optional)</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-line-200 px-3 text-ink-500">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={clsx(hint && hintId, error && errId) || undefined}
          className={inputClass(!!error, prefix ? "pl-16" : undefined)}
          {...rest}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-ink-500">
          {hint}
        </p>
      )}
      {error && <FieldError id={errId}>{error}</FieldError>}
    </div>
  );
});

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select"> & { label: string; error?: string }>(
  function Select({ label, error, className, id, children, ...rest }, ref) {
    const autoId = useId();
    const selectId = id ?? autoId;
    return (
      <div className={className}>
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink-900">
          {label}
        </label>
        <select ref={ref} id={selectId} aria-invalid={!!error} className={inputClass(!!error, "pr-8")} {...rest}>
          {children}
        </select>
        {error && <FieldError>{error}</FieldError>}
      </div>
    );
  },
);
