interface MeetingTypeBadgeProps {
  code: string;
  name?: string;
}

function toDisplayName(code: string, name?: string): string {
  if (name && name.trim()) {
    return name;
  }
  return code
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

export default function MeetingTypeBadge({ code, name }: MeetingTypeBadgeProps): JSX.Element {
  const display = toDisplayName(code, name);
  return (
    <span className="meeting-type-badge" title={display}>
      {display}
    </span>
  );
}
