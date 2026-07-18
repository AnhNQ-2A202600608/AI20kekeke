import React from 'react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={['flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className].join(' ')}>
    <div className="min-w-0 text-left">
      {eyebrow ? (
        <p className="text-[10px] font-black uppercase tracking-widest text-primary-green-dark">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-fraunces text-lg font-black leading-tight text-on-background md:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-500">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export default SectionHeader;
