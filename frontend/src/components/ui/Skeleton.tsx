interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps): JSX.Element {
  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  return (
    <span
      className={`skeleton skeleton-${variant} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow({ columns = 5 }: { columns?: number }): JSX.Element {
  return (
    <tr className="skeleton-row" aria-hidden="true">
      {Array.from({ length: columns }, (_, i) => (
        <td key={i}>
          <Skeleton variant="text" width={`${60 + Math.random() * 40}%`} />
        </td>
      ))}
    </tr>
  );
}