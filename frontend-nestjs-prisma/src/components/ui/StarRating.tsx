'use client';

import { Star } from 'lucide-react';
import { cn, getStarArray } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  count?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({
  rating,
  size = 'md',
  showValue = false,
  count,
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const stars = getStarArray(rating);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {stars.map((star, index) => (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(index + 1)}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110 transition-transform'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                star === 'full'
                  ? 'fill-yellow-400 text-yellow-400'
                  : star === 'half'
                  ? 'fill-yellow-400/50 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {rating.toFixed(1)}
          {count !== undefined && ` (${count})`}
        </span>
      )}
    </div>
  );
}
