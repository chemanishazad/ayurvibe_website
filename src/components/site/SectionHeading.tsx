import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedHeadline, Reveal } from '@/components/site/motion';

interface SectionHeadingProps {
  /** Small uppercase label above the heading. */
  eyebrow?: string;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  /** Trailing phrase rendered in the brand colour. */
  highlight?: string;
  description?: string;
  /** id used by the section's aria-labelledby. */
  id?: string;
  align?: 'left' | 'center';
  className?: string;
  tone?: 'light' | 'dark';
}

/** Consistent section header: eyebrow, animated h2, supporting line. */
const SectionHeading = ({
  eyebrow,
  icon: Icon,
  title,
  highlight,
  description,
  id,
  align = 'center',
  className,
  tone = 'light',
}: SectionHeadingProps) => (
  <div
    className={cn(
      'flex flex-col',
      align === 'center' ? 'items-center text-center' : 'items-start text-left',
      className
    )}
  >
    {eyebrow && (
      <Reveal>
        <span className={cn('eyebrow', tone === 'dark' && '!border-white/20 !bg-white/10 !text-white')}>
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {eyebrow}
        </span>
      </Reveal>
    )}

    <AnimatedHeadline
      as="h2"
      id={id}
      text={title}
      highlight={highlight}
      highlightClassName={tone === 'dark' ? 'text-saffron' : 'text-primary'}
      className={cn(
        'mt-5 max-w-3xl font-display text-3xl font-extrabold leading-[1.12] sm:text-4xl lg:text-[2.7rem]',
        tone === 'dark' ? 'text-white' : 'text-foreground'
      )}
    />

    {description && (
      <Reveal delay={0.08}>
        <p
          className={cn(
            'mt-4 max-w-2xl text-base leading-relaxed sm:text-lg',
            tone === 'dark' ? 'text-white/75' : 'text-muted-foreground'
          )}
        >
          {description}
        </p>
      </Reveal>
    )}
  </div>
);

export default SectionHeading;
