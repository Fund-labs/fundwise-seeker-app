import React from 'react';

/**
 * FundWise Logo — Strata mark
 *
 * Drop-in React component. No external dependencies.
 *
 * @example
 *   <Logo />                              // default 96px gradient mark
 *   <Logo size={48} />                    // sized
 *   <Logo variant="white" />              // for use on dark / gradient backgrounds
 *   <Logo variant="mono" />               // monochrome dark
 *   <Logo lockup="horizontal" />          // mark + wordmark side-by-side
 *   <Logo lockup="stacked" />             // mark above wordmark
 */

export type LogoVariant = 'gradient' | 'white' | 'mono';
export type LogoLockup = 'mark' | 'horizontal' | 'stacked';

export interface LogoProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
  variant?: LogoVariant;
  lockup?: LogoLockup;
  title?: string;
}

const id = (() => {
  let i = 0;
  return () => `fw-${++i}`;
})();

export const Logo: React.FC<LogoProps> = ({
  size = 96,
  variant = 'gradient',
  lockup = 'mark',
  title = 'FundWise',
  ...rest
}) => {
  const dId = React.useMemo(id, []);
  const mId = React.useMemo(id, []);
  const lId = React.useMemo(id, []);

  const slabs = (() => {
    if (variant === 'white') {
      return (
        <>
          <rect x={14} y={22} width={68} height={14} rx={7} fill="#FFFFFF" transform="rotate(-2 48 29)" />
          <rect x={11} y={41} width={74} height={14} rx={7} fill="#FFFFFF" opacity={0.78} />
          <rect x={17} y={60} width={62} height={14} rx={7} fill="#FFFFFF" opacity={0.55} transform="rotate(2 48 67)" />
        </>
      );
    }
    if (variant === 'mono') {
      return (
        <>
          <rect x={14} y={22} width={68} height={14} rx={7} fill="#0D1F14" transform="rotate(-2 48 29)" />
          <rect x={11} y={41} width={74} height={14} rx={7} fill="#0D1F14" opacity={0.72} />
          <rect x={17} y={60} width={62} height={14} rx={7} fill="#0D1F14" opacity={0.45} transform="rotate(2 48 67)" />
        </>
      );
    }
    return (
      <>
        <rect x={14} y={22} width={68} height={14} rx={7} fill={`url(#${dId})`} transform="rotate(-2 48 29)" />
        <rect x={11} y={41} width={74} height={14} rx={7} fill={`url(#${mId})`} />
        <rect x={17} y={60} width={62} height={14} rx={7} fill={`url(#${lId})`} transform="rotate(2 48 67)" />
      </>
    );
  })();

  const gradients = variant === 'gradient' && (
    <defs>
      <linearGradient id={dId} x1={8} y1={8} x2={88} y2={88} gradientUnits="userSpaceOnUse">
        <stop stopColor="#0A4D2C" />
        <stop offset={1} stopColor="#0D6B3A" />
      </linearGradient>
      <linearGradient id={mId} x1={8} y1={32} x2={88} y2={72} gradientUnits="userSpaceOnUse">
        <stop stopColor="#0D6B3A" />
        <stop offset={1} stopColor="#1A9151" />
      </linearGradient>
      <linearGradient id={lId} x1={8} y1={56} x2={88} y2={88} gradientUnits="userSpaceOnUse">
        <stop stopColor="#1A9151" />
        <stop offset={1} stopColor="#4EC98A" />
      </linearGradient>
    </defs>
  );

  if (lockup === 'mark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 96 96"
        fill="none"
        role="img"
        aria-label={title}
        {...rest}
      >
        {gradients}
        {slabs}
      </svg>
    );
  }

  const wordmarkColor = variant === 'white' ? '#FFFFFF' : '#0D1F14';

  if (lockup === 'horizontal') {
    const w = size * 4;
    const h = size;
    return (
      <svg
        width={w}
        height={h}
        viewBox="0 0 384 96"
        fill="none"
        role="img"
        aria-label={title}
        {...rest}
      >
        {gradients}
        {slabs}
        <text
          x={108}
          y={64}
          fontFamily="'DM Serif Display', 'Times New Roman', serif"
          fontSize={44}
          letterSpacing="-0.8"
          fill={wordmarkColor}
        >
          FundWise
        </text>
      </svg>
    );
  }

  // stacked
  const w = size * 2;
  const h = size * 1.6;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 192 154"
      fill="none"
      role="img"
      aria-label={title}
      {...rest}
    >
      {gradients}
      <g transform="translate(48 0)">{slabs}</g>
      <text
        x={96}
        y={140}
        textAnchor="middle"
        fontFamily="'DM Serif Display', 'Times New Roman', serif"
        fontSize={36}
        letterSpacing="-0.6"
        fill={wordmarkColor}
      >
        FundWise
      </text>
    </svg>
  );
};

export default Logo;
