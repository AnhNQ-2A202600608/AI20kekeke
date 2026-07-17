import React from 'react';

interface TactilePanelProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: 'section' | 'article' | 'aside' | 'div';
  tone?: 'white' | 'green' | 'subtle';
}

const toneClass = {
  white: 'border-gray-border bg-white',
  green: 'border-primary-green/25 bg-primary-green/10',
  subtle: 'border-gray-border bg-surface-container-low',
};

export const TactilePanel: React.FC<TactilePanelProps> = ({
  children,
  as: Component = 'section',
  tone = 'white',
  className = '',
  ...props
}) => (
  <Component
    className={[
      'rounded-2xl border p-4 md:p-5',
      toneClass[tone],
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </Component>
);

export default TactilePanel;
