import Icon from './Icon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = '',
}: PaginationProps): JSX.Element | null {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | '...')[] => {
    const range = (start: number, end: number): number[] =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const fullRange = range(1, totalPages);
    const current = currentPage;
    const siblings = siblingCount;

    const leftSpine = Math.max(1, current - siblings);
    const rightSpine = Math.min(totalPages, current + siblings);

    const showLeftEllipsis = leftSpine > 2;
    const showRightEllipsis = rightSpine < totalPages - 1;

    if (!showLeftEllipsis && !showRightEllipsis) {
      return range(1, totalPages);
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      return [1, '...', ...range(totalPages - (1 + siblings * 2 + 1) + 1, totalPages)];
    }

    if (!showLeftEllipsis && showRightEllipsis) {
      return [...range(1, 1 + siblings * 2 + 1), '...', totalPages];
    }

    return [1, '...', ...range(leftSpine, rightSpine), '...', totalPages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav aria-label="Pagination" className={`pagination ${className}`}>
      <button
        type="button"
        className="btn btn-quiet"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <Icon name="chevron-left" size={16} aria-hidden="true" />
        Previous
      </button>

      <div className="pagination-pages">
        {pageNumbers.map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`btn btn-quiet pagination-page${currentPage === page ? ' pagination-page-active' : ''}`}
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="btn btn-quiet"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        Next
        <Icon name="chevron-right" size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}