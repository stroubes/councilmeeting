import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import type { IconName } from './types';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: IconName;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps): JSX.Element {
  return (
    <nav aria-label="Breadcrumb" className={`breadcrumb ${className}`}>
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="breadcrumb-item">
              {isLast || !item.href ? (
                <span className="breadcrumb-current" aria-current={isLast ? 'page' : undefined}>
                  {item.icon ? <Icon name={item.icon} size={14} aria-hidden="true" /> : null}
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="breadcrumb-link">
                  {item.icon ? <Icon name={item.icon} size={14} aria-hidden="true" /> : null}
                  {item.label}
                </Link>
              )}
              {!isLast ? (
                <Icon name="chevron-right" size={12} className="breadcrumb-sep" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function useBreadcrumb(items: BreadcrumbItem[]): BreadcrumbItem[] {
  const location = useLocation();
  return [
    { label: 'Home', href: '/', icon: 'home' },
    ...items,
  ];
}