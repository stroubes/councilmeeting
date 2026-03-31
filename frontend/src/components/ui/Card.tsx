import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps): JSX.Element {
  return <section className={`card ${className}`}>{children}</section>;
}

export function CardHeader({ title, description, actions, className = '' }: CardHeaderProps): JSX.Element {
  return (
    <header className={`card-header ${className}`}>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="card-header-meta">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ children, className = '' }: CardProps): JSX.Element {
  return <div className={`card-body ${className}`}>{children}</div>;
}