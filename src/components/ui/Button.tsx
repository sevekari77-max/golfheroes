import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gold';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-sm hover:shadow-glow-green border border-primary-500/50',
  secondary: 'bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 hover:border-stone-600',
  ghost: 'bg-transparent hover:bg-white/10 text-stone-300 hover:text-white',
  danger: 'bg-error-600 hover:bg-error-500 text-white border border-error-500/50',
  outline: 'bg-transparent border border-primary-500 text-primary-400 hover:bg-primary-500/10',
  gold: 'bg-secondary-500 hover:bg-secondary-400 text-stone-900 font-semibold shadow-sm hover:shadow-glow-gold',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  xl: 'px-8 py-4 text-lg gap-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
