'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  onPageChange?: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  onPageChange,
  className,
}: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'dots')[] = [];
    const delta = 2;

    pages.push(1);

    if (currentPage - delta > 2) {
      pages.push('dots');
    }

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      pages.push(i);
    }

    if (currentPage + delta < totalPages - 1) {
      pages.push('dots');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const getHref = (page: number) => {
    if (!basePath) return '#';
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `${basePath}?${params.toString()}`;
  };

  const handleClick = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const PageButton = ({
    page,
    children,
    disabled,
  }: {
    page: number;
    children: React.ReactNode;
    disabled?: boolean;
  }) => {
    const isActive = page === currentPage;
    const className2 = cn(
      'inline-flex items-center justify-center min-w-[36px] h-9 px-3 rounded-md text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'hover:bg-accent hover:text-accent-foreground',
      disabled && 'opacity-50 pointer-events-none'
    );

    if (basePath && !disabled) {
      return (
        <Link href={getHref(page)} className={className2}>
          {children}
        </Link>
      );
    }

    return (
      <button
        onClick={() => handleClick(page)}
        disabled={disabled}
        className={className2}
      >
        {children}
      </button>
    );
  };

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)}>
      <PageButton page={currentPage - 1} disabled={currentPage === 1}>
        <ChevronLeft className="w-4 h-4" />
      </PageButton>

      {getPageNumbers().map((page, idx) =>
        page === 'dots' ? (
          <span key={`dots-${idx}`} className="px-2">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </span>
        ) : (
          <PageButton key={page} page={page}>
            {page}
          </PageButton>
        )
      )}

      <PageButton page={currentPage + 1} disabled={currentPage === totalPages}>
        <ChevronRight className="w-4 h-4" />
      </PageButton>
    </nav>
  );
}
