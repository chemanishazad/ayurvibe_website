import React from 'react';
import logo from '@/assets/logo.png';

interface LogoProps {
  className?: string;
  height?: number;
  withText?: boolean;
  textClassName?: string;
  titleText?: string;
  subtitleText?: string;
}

/**
 * Central logo component so the brand mark stays consistent everywhere.
 * Provides optional clinic name & subtitle rendering to avoid duplication.
 */
export const Logo: React.FC<LogoProps> = ({
  className = 'h-12 w-auto',
  height,
  withText = false,
  textClassName = '',
  titleText = 'Sri Vinayaga Ayurvibe',
  subtitleText,
}) => {
  const style: React.CSSProperties = height ? { height, width: 'auto' } : {};
  return (
    <div className={withText ? 'flex items-center space-x-3' : undefined}>
      <img
        src={logo}
        alt={titleText + ' Logo'}
        className={className}
        style={style}
        loading="lazy"
      />
      {withText && (
        <div className={textClassName}>
          <span className="block font-bold leading-tight text-xl md:text-2xl tracking-wide">
            {titleText}
          </span>
          {subtitleText && (
            <span className="block text-xs md:text-sm text-muted-foreground mt-0.5">{subtitleText}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;

// Export the raw path for meta tags (Open Graph / Twitter) usage.
export const logoPath = logo;