"use client";

import { InputHTMLAttributes, forwardRef, memo } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all ${
            error ? "ring-2 ring-error" : ""
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-error text-xs mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = memo(function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-primary text-on-primary hover:brightness-110 shadow-lg shadow-primary/20",
    secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high",
    ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container",
  };

  return (
    <button
      className={`py-4 px-6 font-bold rounded-full transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = memo(function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface-container rounded-lg p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});