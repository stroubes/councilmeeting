import { type ReactNode, type Key } from 'react';
import Icon from './Icon';
import type { IconName } from './types';
import { SkeletonRow } from './Skeleton';

export type SortDirection = 'asc' | 'desc';

interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T extends { id: string | number }> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  sortField?: string;
  sortDirection?: SortDirection;
  onSort?: (field: string) => void;
  rowKey?: (row: T) => string | number;
  className?: string;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records to display.',
  sortField,
  sortDirection,
  onSort,
  rowKey,
  className = '',
}: DataTableProps<T>): JSX.Element {
  const handleHeaderClick = (col: ColumnDef<T>): void => {
    if (!col.sortable || !onSort) return;
    onSort(col.key);
  };

  const handleKeyDown = (event: React.KeyboardEvent, col: ColumnDef<T>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleHeaderClick(col);
    }
  };

  return (
    <div className="table-wrap">
      <table className={`data-table ${className}`} aria-busy={isLoading}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                aria-sort={
                  sortField === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : col.sortable
                      ? 'none'
                      : undefined
                }
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className="sortable-header"
                    onClick={() => handleHeaderClick(col)}
                    onKeyDown={(e) => handleKeyDown(e, col)}
                  >
                    {col.header}
                    {sortField === col.key ? (
                      <Icon
                        name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        aria-hidden="true"
                      />
                    ) : (
                      <Icon name="sort-asc" size={12} className="sort-icon-inactive" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} columns={columns.length} />)
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty-state">{emptyMessage}</div>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={rowKey ? rowKey(row) : (row.id as Key)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}