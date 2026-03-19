interface StatusBadgeProps {
  status: string;
}

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function toLabel(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

export default function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  const normalizedStatus = normalizeStatus(status);

  return (
    <span className={`status-badge status-${normalizedStatus}`} title={toLabel(status)}>
      {toLabel(status)}
    </span>
  );
}
