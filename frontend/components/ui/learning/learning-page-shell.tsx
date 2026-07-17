import React from 'react';

interface LearningPageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
}

const sizeClass = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  full: 'max-w-none',
};

export const LearningPageShell: React.FC<LearningPageShellProps> = ({
  children,
  size = 'lg',
  className = '',
  ...props
}) => (
  <div
    className={[
      'w-full bg-background px-3 py-4 font-be-vietnam-pro text-on-background md:px-6 md:py-6',
      className,
    ].join(' ')}
    {...props}
  >
    <div className={['mx-auto w-full space-y-5', sizeClass[size]].join(' ')}>{children}</div>
  </div>
);

export default LearningPageShell;
