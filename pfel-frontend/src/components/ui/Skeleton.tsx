// File: src/components/ui/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]/60 ${className}`}
  />
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        aria-hidden="true"
        className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden"
      >
        <Skeleton className="h-36 w-full rounded-none border-0 border-b border-[var(--border-subtle)]" />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-3.5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-lg" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-5/6 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => (
  <div
    aria-hidden="true"
    className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-3"
  >
    <Skeleton className="h-10 w-full rounded-xl" />
    <div className="space-y-2.5 pt-1">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, cIdx) => (
            <Skeleton key={cIdx} className="h-8 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
