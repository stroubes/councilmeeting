import type { IconName } from './types';
import Icon from './Icon';

interface MetricTileProps {
  label: string;
  value: string | number;
  foot?: string;
  icon?: IconName;
  variant?: 'default' | 'primary';
  className?: string;
}

export default function MetricTile({
  label,
  value,
  foot,
  icon,
  variant = 'default',
  className = '',
}: MetricTileProps): JSX.Element {
  return (
    <article className={`metric-tile${variant === 'primary' ? ' metric-tile-primary' : ''} ${className}`}>
      <p className="metric-label">
        {icon ? (
          <span className="metric-tile-icon">
            <Icon name={icon} size={14} />
          </span>
        ) : null}
        {label}
      </p>
      <p className="metric-value">{value}</p>
      {foot ? <p className="metric-foot">{foot}</p> : null}
    </article>
  );
}