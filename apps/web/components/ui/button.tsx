import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]";

  const variants = {
    primary: "bg-accent hover:bg-accent-hover text-white shadow-glow-sm",
    secondary: "bg-surface-elevated hover:bg-surface text-foreground border border-border",
    outline: "bg-transparent hover:bg-surface-elevated text-foreground border border-border-strong",
    ghost: "bg-transparent hover:bg-surface-elevated text-muted hover:text-foreground",
    danger: "bg-danger-soft hover:bg-danger text-danger hover:text-white border border-danger/30",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 h-8 gap-1.5",
    md: "text-xs font-semibold uppercase tracking-wider px-4 py-2 h-10 gap-2",
    lg: "text-sm font-semibold px-6 py-3 h-12 gap-2.5 rounded-xl",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : children}
    </button>
  );
}
