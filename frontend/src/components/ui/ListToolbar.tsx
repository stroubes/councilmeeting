import { type ReactNode } from 'react';
import Icon from './Icon';

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface ListToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  filters?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterLabel?: string;
  sorts?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortDirection?: 'asc' | 'desc';
  onSortDirectionChange?: (dir: 'asc' | 'desc') => void;
  actions?: ReactNode;
  className?: string;
}

export default function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchLabel = 'Search',
  filters,
  filterValue,
  onFilterChange,
  filterLabel = 'Filter',
  sorts,
  sortValue,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
  actions,
  className = '',
}: ListToolbarProps): JSX.Element {
  const showSecondRow = filters || sorts || actions;

  return (
    <div className={`workspace-toolbar ${className}`}>
      <div className="workspace-toolbar-row">
        <input
          type="search"
          className="field"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
        />
        {filters && onFilterChange ? (
          <select
            className="field"
            value={filterValue ?? ''}
            onChange={(e) => onFilterChange(e.target.value)}
            aria-label={filterLabel}
          >
            <option value="">{filterLabel}…</option>
            {filters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}
      </div>

      {showSecondRow ? (
        <div className="workspace-toolbar-row workspace-toolbar-row-compact">
          {sorts && onSortChange ? (
            <div className="toolbar-sort-group">
              <select
                className="field"
                value={sortValue ?? ''}
                onChange={(e) => onSortChange(e.target.value)}
                aria-label="Sort by"
              >
                <option value="">Sort by…</option>
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {onSortDirectionChange && sortDirection ? (
                <button
                  type="button"
                  className="btn btn-quiet toolbar-sort-dir"
                  onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
                  aria-label={`Sort direction: ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                >
                  <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          {actions ? <div className="toolbar-actions">{actions}</div> : <span />}
        </div>
      ) : null}
    </div>
  );
}