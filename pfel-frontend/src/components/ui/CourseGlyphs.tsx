// File: src/components/ui/CourseGlyphs.tsx
import React from 'react';

interface GlyphProps {
  className?: string;
}

export const BackTrailGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path
      d="M15.5 10H4.5M4.5 10L9 5.5M4.5 10L9 14.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CompassRingGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <polygon
      points="15.5,8.5 13.4,13.4 8.5,15.5 10.6,10.6"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>
);

export const PrismSparkGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2.5L14.4 9.6L21.5 12L14.4 14.4L12 21.5L9.6 14.4L2.5 12L9.6 9.6L12 2.5Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const EmberFlameGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12.5 3C12.5 7.2 7.5 8.8 7.5 14.2C7.5 17.5 9.8 20 12.8 20C15.9 20 18.5 17.3 18.5 13.7C18.5 10.5 16.4 8.2 14.8 6.8C14.7 8.4 13.8 9.4 12.7 9.6C13.7 7.6 13.6 5 12.5 3Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const TrophyCrestGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M7 5H17V10.5C17 13.5 14.8 15.8 12 15.8C9.2 15.8 7 13.5 7 10.5V5Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M12 15.8V19M8.5 19.5H15.5M7 7.5H4.5C4.5 10.2 5.8 11.8 7.6 12.2M17 7.5H19.5C19.5 10.2 18.2 11.8 16.4 12.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const StackLayersGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 4L3.5 8.5L12 13L20.5 8.5L12 4Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 13L12 17.5L20.5 13M3.5 17.2L12 21.5L20.5 17.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const QuestCheckGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3.5"
      y="3.5"
      width="17"
      height="17"
      rx="5"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M8.2 12.3L10.8 14.9L16 9.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LoungeBubbleGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M5 6.5C5 5.1 6.1 4 7.5 4H16.5C17.9 4 19 5.1 19 6.5V13.5C19 14.9 17.9 16 16.5 16H10.5L6.5 19.5V16H7.5C6.1 16 5 14.9 5 13.5V6.5Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="9.5" cy="10" r="1" fill="currentColor" />
    <circle cx="12.5" cy="10" r="1" fill="currentColor" />
    <circle cx="15.5" cy="10" r="1" fill="currentColor" />
  </svg>
);

export const FolioBookGlyph: React.FC<GlyphProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4.5 6.5C4.5 5.4 5.4 4.5 6.5 4.5H11V19.5H6.5C5.4 19.5 4.5 18.6 4.5 17.5V6.5Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M19.5 6.5C19.5 5.4 18.6 4.5 17.5 4.5H13V19.5H17.5C18.6 19.5 19.5 18.6 19.5 17.5V6.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

export const ChapterFolderGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M3.5 7.5C3.5 6.4 4.4 5.5 5.5 5.5H9.8L11.8 7.8H18.5C19.6 7.8 20.5 8.7 20.5 9.8V17.5C20.5 18.6 19.6 19.5 18.5 19.5H5.5C4.4 19.5 3.5 18.6 3.5 17.5V7.5Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const ReelPlayGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.6" />
    <polygon points="10.2,8.6 16,12 10.2,15.4" fill="currentColor" />
  </svg>
);

export const FramePhotoGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="8.8" cy="9.5" r="1.5" fill="currentColor" />
    <path d="M5.5 16.5L10.5 12L14 15L16.5 12.8L19 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CodeScrollGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="3.5" y="4" width="17" height="16" rx="3.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9.5 9.5L6.8 12L9.5 14.5M14.5 9.5L17.2 12L14.5 14.5M12.8 8.5L11.2 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DocSheetGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M6.5 3.5H14L18.5 8V19.5C18.5 20.1 18.1 20.5 17.5 20.5H6.5C5.9 20.5 5.5 20.1 5.5 19.5V4.5C5.5 3.9 5.9 3.5 6.5 3.5Z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M13.5 3.5V8.5H18.5M8.5 12H15.5M8.5 15.5H13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ChevronFlipGlyph: React.FC<{ expanded?: boolean; className?: string }> = ({
  expanded = false,
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    className={`${className} transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    aria-hidden="true"
  >
    <path d="M5.5 8L10 12.5L14.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CompletedBadgeGlyph: React.FC<GlyphProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 8.2L7.1 10.3L11.2 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PendingRingGlyph: React.FC<GlyphProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.5 2" />
  </svg>
);

export const CloseCrossGlyph: React.FC<GlyphProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M5.5 5.5L14.5 14.5M14.5 5.5L5.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const DropTrayGlyph: React.FC<GlyphProps> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <path d="M14 5V17M14 5L9.5 9.5M14 5L18.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 17.5V21C5 22.1 5.9 23 7 23H21C22.1 23 23 22.1 23 21V17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
