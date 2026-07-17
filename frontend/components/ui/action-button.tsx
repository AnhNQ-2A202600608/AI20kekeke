import React from 'react';

export type ActionButtonVariant =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'ghost'
  | 'danger'
  | 'warning'
  | 'green'
  | 'white'
  | 'orange';

export type ActionButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md' | 'icon';
export type ActionButtonTextCase = 'upper' | 'title' | 'none';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textCase?: ActionButtonTextCase;
}

const variantClass: Record<ActionButtonVariant, string> = {
  primary: 'border-primary-green/70 bg-primary-green text-white hover:brightness-105',
  secondary: 'border-primary-green/25 bg-primary-green/10 text-primary-green-dark hover:bg-primary-green/15',
  neutral: 'border-gray-border bg-white text-on-background hover:bg-surface-container-low',
  ghost: 'border-transparent bg-transparent text-stone-500 hover:bg-stone-100 hover:text-on-background',
  danger: 'border-error-red/40 bg-error-red text-white hover:brightness-105',
  warning: 'border-accent-orange/45 bg-accent-orange text-white hover:brightness-105',
  green: 'border-primary-green/70 bg-primary-green text-white hover:brightness-105',
  white: 'border-gray-border bg-white text-on-background hover:bg-surface-container-low',
  orange: 'border-accent-orange/50 bg-accent-orange text-white hover:brightness-105',
};

const sizeClass: Record<ActionButtonSize, string> = {
  xs: 'min-h-8 px-2 text-caption-tight',
  sm: 'min-h-9 px-3 text-label-tight',
  md: 'min-h-11 px-4 text-xs',
  lg: 'min-h-12 px-5 text-sm',
  'icon-sm': 'h-9 w-9 p-0',
  'icon-md': 'h-11 w-11 p-0',
  icon: 'h-10 w-10 p-0',
};

const textCaseClass: Record<ActionButtonTextCase, string> = {
  upper: 'uppercase tracking-wide',
  title: 'normal-case tracking-normal',
  none: '',
};

export function actionButtonClassName({
  variant = 'neutral',
  size = 'md',
  textCase = 'upper',
  className = '',
}: {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  textCase?: ActionButtonTextCase;
  className?: string;
} = {}) {
  return [
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border font-black transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-green active:translate-y-[1px] disabled:cursor-not-allowed disabled:border-gray-border disabled:bg-gray-border disabled:text-stone-400 disabled:shadow-none disabled:hover:brightness-100 disabled:active:translate-y-0',
    variantClass[variant],
    sizeClass[size],
    textCaseClass[textCase],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      variant = 'neutral',
      size = 'md',
      textCase = 'upper',
      className = '',
      children,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={actionButtonClassName({ variant, size, textCase, className })}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  ),
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;
