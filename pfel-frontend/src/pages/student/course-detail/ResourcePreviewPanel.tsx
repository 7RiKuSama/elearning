// File: src/pages/student/course-detail/ResourcePreviewPanel.tsx
import React from 'react';
import type { Ressource } from '../../../types';
import { getVideoEmbedUrl, renderMarkdown, resolveFileUrl } from './mediaUtils';

interface ResourcePreviewPanelProps {
  resource: Ressource;
  textContent?: string;
  isLoadingText: boolean;
}

export const ResourcePreviewPanel: React.FC<ResourcePreviewPanelProps> = ({
  resource,
  textContent,
  isLoadingText,
}) => {
  const fileUrl = resolveFileUrl(resource.chemin_fichier);
  const embedUrl = getVideoEmbedUrl(resource.chemin_fichier);
  const isDirectVideo =
    resource.type_fichier === 'video' || /\.(mp4|webm|ogg)$/i.test(resource.chemin_fichier);
  const isImage =
    resource.type_fichier === 'image' ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(resource.chemin_fichier);
  const isText =
    resource.type_fichier === 'text' || /\.(md|txt|markdown)$/i.test(resource.chemin_fichier);

  return (
    <div className="mt-3.5 pt-3.5 border-t border-[var(--border-subtle)] space-y-3">
      {embedUrl ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-black">
          <iframe
            src={embedUrl}
            title={resource.nom_fichier}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : isDirectVideo ? (
        <video
          src={fileUrl}
          controls
          className="w-full max-h-[420px] rounded-xl border border-[var(--border-subtle)] bg-black"
        />
      ) : isImage ? (
        <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 flex justify-center">
          <img
            src={fileUrl}
            alt={resource.nom_fichier}
            className="max-h-[440px] w-auto object-contain rounded-lg"
          />
        </div>
      ) : isText ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)] max-h-[420px] overflow-y-auto leading-relaxed">
          {isLoadingText ? (
            <p className="text-xs text-[var(--text-muted)] animate-pulse">
              Chargement du contenu...
            </p>
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(textContent || ''),
              }}
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              Document externe ou fichier prêt au téléchargement
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Ouvre le support dans un nouvel onglet ou récupère-le localement.
            </p>
          </div>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold btn-accent"
            >
              <span>Ouvrir le support</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
