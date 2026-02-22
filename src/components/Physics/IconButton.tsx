import { motion } from 'motion/react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Variant = 'accent' | 'primary' | 'danger' | 'subtle' | 'ghost';
type Size = 'md' | 'sm';

type MotionButtonProps = ComponentPropsWithoutRef<typeof motion.button>;

interface IconButtonProps extends Omit<MotionButtonProps, 'children'> {
  label: string;
  icon: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  accent:
    'bg-emerald-500/15 border border-emerald-400/40 text-emerald-50 hover:bg-emerald-500/25 active:bg-emerald-500/30 shadow-emerald-900/30',
  primary:
    'bg-blue-500/15 border border-blue-400/40 text-blue-50 hover:bg-blue-500/25 active:bg-blue-500/30 shadow-blue-900/30',
  danger:
    'bg-rose-600/15 border border-rose-500/40 text-rose-50 hover:bg-rose-600/25 active:bg-rose-600/30 shadow-rose-900/30',
  subtle:
    'bg-slate-700/40 border border-slate-500/30 text-slate-50 hover:bg-slate-600/40 active:bg-slate-600/50 shadow-slate-900/30',
  ghost:
    'bg-white/5 border border-white/10 text-white hover:bg-white/10 active:bg-white/15 shadow-black/20',
};

const sizeStyles: Record<Size, string> = {
  md: 'px-5 py-3 text-sm sm:text-base min-h-[48px]',
  sm: 'px-3 py-2 text-xs sm:text-sm min-h-[40px]',
};

export default function IconButton({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  className = '',
  type = 'button',
  ...props
}: IconButtonProps): JSX.Element {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={[
        'relative overflow-hidden rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400/70',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : 'w-auto',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      <span
        className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-current"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="leading-tight">{label}</span>
    </motion.button>
  );
}

interface IconProps {
  size?: number;
}

const baseIconProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
  className: 'shrink-0',
});

export function PlayIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseIconProps(size)}>
      <path d="M7 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseIconProps(size)}>
      <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

export function StopIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseIconProps(size)}>
      <rect x="7" y="7" width="10" height="10" rx="2.5" fill="none" />
    </svg>
  );
}

export function ResetIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseIconProps(size)}>
      <path d="M6.5 9.5h-3v-3" />
      <path d="M4 12a8 8 0 1 0 2.3-5.7L3.5 9" />
    </svg>
  );
}

export function GaugeIcon({ size = 16 }: IconProps) {
  return (
    <svg {...baseIconProps(size)}>
      <path d="M4 17.5c0-4.2 3.8-7.5 8-7.5 4.2 0 8 3.3 8 7.5 0 1-.8 1.8-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17.5Z" />
      <path d="m12 10-2.5 4.5" />
      <path d="M10 16.5c.6.4 1.3.5 2 .5" />
    </svg>
  );
}

export function RocketIcon({ size = 16 }: IconProps) {
  return (
    <svg {...baseIconProps(size)}>
      <path d="M8.6 13.5 5 17.1c-.8.8-2 .8-2.8 0a2 2 0 0 1 0-2.8l3.6-3.6" />
      <path d="m13.8 8.3 3.3-3.3c.7-.7.6-1.8-.2-2.3-.7-.4-1.6-.4-2.2.2l-3.4 3.4" />
      <path d="M8.5 13.5c-1.3-3.9.7-8 4.7-9.3 1-.3 1.9-.3 2.8 0-1.3 3.9-5.4 5.9-9.3 4.6Z" />
      <path d="m11 11 2-2" />
      <path d="m5 21 2-2" />
    </svg>
  );
}

export function BreezeIcon({ size = 16 }: IconProps) {
  return (
    <svg {...baseIconProps(size)}>
      <path d="M4 12h6a3 3 0 1 0-3-3" />
      <path d="M3 16h10a3 3 0 1 1-3 3" />
    </svg>
  );
}

export function FlashIcon({ size = 16 }: IconProps) {
  return (
    <svg {...baseIconProps(size)}>
      <path d="M13 2 3 14h6l-2 8 10-12h-6l2-8Z" />
    </svg>
  );
}
