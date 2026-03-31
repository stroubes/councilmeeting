import { icons } from './icons';
import type { IconProps } from './types';

const STROKE_WIDTH = 1.5;

export default function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = STROKE_WIDTH,
  className,
  'aria-label': ariaLabel,
}: IconProps): JSX.Element {
  const icon = icons[name];

  return (
    <svg
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : 'true'}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={icon?.strokes ? 'none' : color}
      stroke={icon?.strokes ? color : undefined}
      strokeWidth={icon?.strokes ? strokeWidth : undefined}
      strokeLinecap={icon?.strokes ? 'round' : undefined}
      strokeLinejoin={icon?.strokes ? 'round' : undefined}
      className={name === 'spinner' ? 'icon-spinner' : className}
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      {icon?.circles?.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
      ))}
      {icon?.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
