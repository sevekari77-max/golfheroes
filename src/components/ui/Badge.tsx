interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  success: 'bg-success-500/15 text-success-500 border border-success-500/30',
  warning: 'bg-warning-500/15 text-warning-500 border border-warning-500/30',
  error: 'bg-error-500/15 text-error-500 border border-error-500/30',
  info: 'bg-accent-500/15 text-accent-400 border border-accent-500/30',
  neutral: 'bg-stone-700/50 text-stone-300 border border-stone-600/50',
  gold: 'bg-secondary-500/15 text-secondary-400 border border-secondary-500/30',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}
