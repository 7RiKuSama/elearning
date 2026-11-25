// File: src/pages/components/ResourceUploadModal.tsx
import React, { useEffect, useState } from 'react';
import { getCourseModules, uploadFileToServer, uploadResource } from '../../api/services';
import type { Cours, Module } from '../../types';
import { renderMarkdownBlocks } from '../../utils/markdown';
import { Upload, Link as LinkIcon } from 'lucide-react';

interface ResourceUploadModalProps {
  course: Cours;
  onClose: () => void;
  onUploaded: () => void;
}

export default function ResourceUploadModal({
  course,
  onClose,
  onUploaded,
}: ResourceUploadModalProps) {
  const [resName, setResName] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [resType, setResType] = useState('pdf');
  const [resModuleId, setResModuleId] = useState<number | ''>('');
  const [courseModules, setCourseModules] = useState<Module[]>([]);
  const [videoSourceMode, setVideoSourceMode] = useState<'file' | 'url'>('file');
  const [resExternalUrl, setResExternalUrl] = useState('');
  const [mdContent, setMdContent] = useState('');
  const [mdEditorTab, setMdEditorTab] = useState<'write' | 'split' | 'preview'>('split');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getCourseModules(course.id_cours)
      .then((mods) => setCourseModules(mods || []))
      .catch(() => setCourseModules([]));
  }, [course.id_cours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const selectedMod = resModuleId === '' ? null : Number(resModuleId);

      if (resType === 'text') {
        if (!mdContent.trim()) {
          alert('Veuillez rédiger le contenu Markdown de la note.');
          setUploading(false);
          return;
        }
        const baseTitle =
          (resName.trim() || 'note-de-cours')
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, '-')
            .replace(/^-|-$/g, '') || 'note-de-cours';
        const mdFile = new File([mdContent], `${baseTitle}.md`, {
          type: 'text/markdown;charset=utf-8',
        });

        const uploaded = await uploadFileToServer(mdFile);
        await uploadResource(course.id_cours, {
          nom_fichier: resName.trim() || `${baseTitle}.md`,
          chemin_fichier: uploaded.chemin_fichier,
          type_fichier: 'text',
          taille_fichier: uploaded.taille_fichier || mdFile.size,
          id_module: selectedMod,
        });
      } else if (resType === 'video' && videoSourceMode === 'url') {
        if (!resExternalUrl.trim()) {
          alert('Veuillez saisir une URL vidéo valide.');
          setUploading(false);
          return;
        }
        await uploadResource(course.id_cours, {
          nom_fichier: resName.trim() || 'Vidéo externe (YouTube / Vimeo)',
          chemin_fichier: resExternalUrl.trim(),
          type_fichier: 'video',
          taille_fichier: 0,
          id_module: selectedMod,
        });
      } else {
        if (!resFile) {
          alert('Veuillez sélectionner un fichier.');
          setUploading(false);
          return;
        }
        const uploaded = await uploadFileToServer(resFile);
        await uploadResource(course.id_cours, {
          nom_fichier: resName.trim() || uploaded.nom_fichier,
          chemin_fichier: uploaded.chemin_fichier,
          type_fichier: resType,
          taille_fichier: uploaded.taille_fichier,
          id_module: selectedMod,
        });
      }

      alert('Ressource ajoutée avec succès !');
      onUploaded();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout de la ressource.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className={`surface-card rounded-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto ${
          resType === 'text' ? 'max-w-4xl' : 'max-w-md'
        }`}
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3.5">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Ajouter une ressource
            </h3>
            <p className="text-xs text-[var(--text-muted)]">{course.titre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className={resType === 'text' ? 'grid grid-cols-1 sm:grid-cols-3 gap-3' : 'space-y-4'}
          >
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Titre du support
              </label>
              <input
                type="text"
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                placeholder="ex: Chapitre 1 - Introduction"
                className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Chapitre / module
              </label>
              <select
                value={resModuleId}
                onChange={(e) => setResModuleId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)]"
              >
                <option value="">Non classé</option>
                {courseModules.map((mod, idx) => (
                  <option key={mod.id_module} value={mod.id_module}>
                    {idx + 1}. {mod.titre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Type de ressource
              </label>
              <select
                value={resType}
                onChange={(e) => {
                  setResType(e.target.value);
                  if (e.target.value !== 'video') setVideoSourceMode('file');
                }}
                className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)]"
              >
                <option value="pdf">PDF</option>
                <option value="video">Vidéo (MP4 ou YouTube / Vimeo)</option>
                <option value="image">Image</option>
                <option value="text">Texte / Markdown (.md, .txt)</option>
              </select>
            </div>
          </div>

          {resType === 'text' ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-subtle)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() =>
                      setMdContent((prev) => `${prev}${prev ? '\n\n' : ''}## Titre de section\n`)
                    }
                    className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => setMdContent((prev) => `${prev}**texte en gras**`)}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-sans font-semibold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => setMdContent((prev) => `${prev}*texte en italique*`)}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-editorial italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => setMdContent((prev) => `${prev}\n- Élément de liste`)}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  >
                    • Liste
                  </button>
                  <button
                    type="button"
                    onClick={() => setMdContent((prev) => `${prev}\n> Note importante`)}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  >
                    Quote
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMdContent(
                        (prev) =>
                          `${prev}${prev ? '\n\n' : ''}\`\`\`go\nfmt.Println("Hello PFE-Learn")\n\`\`\`\n`
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  >
                    Code
                  </button>
                </div>

                <div className="inline-flex bg-[var(--bg-surface)] p-0.5 rounded-lg border border-[var(--border-subtle)] text-[11px] font-medium">
                  {(['write', 'split', 'preview'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setMdEditorTab(mode)}
                      className={`px-2.5 py-1 rounded-md transition ${
                        mdEditorTab === mode
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {mode === 'write' ? 'Écrire' : mode === 'split' ? 'Côte à côte' : 'Aperçu'}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`grid gap-3 ${
                  mdEditorTab === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {mdEditorTab !== 'preview' && (
                  <textarea
                    value={mdContent}
                    onChange={(e) => setMdContent(e.target.value)}
                    placeholder={`# Introduction\n\nRédigez ici votre cours avec **gras**, *italique*, listes et blocs de code...`}
                    rows={11}
                    required
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] text-[var(--text-primary)] font-mono text-xs rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
                  />
                )}

                {mdEditorTab !== 'write' && (
                  <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl max-h-72 overflow-y-auto">
                    {renderMarkdownBlocks(mdContent)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {resType === 'video' && (
                <div className="flex bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('file')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                      videoSourceMode === 'file'
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Fichier vidéo (.mp4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('url')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                      videoSourceMode === 'url'
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>YouTube / Vimeo</span>
                  </button>
                </div>
              )}

              {resType === 'video' && videoSourceMode === 'url' ? (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Lien YouTube ou Vimeo
                  </label>
                  <input
                    type="url"
                    value={resExternalUrl}
                    onChange={(e) => setResExternalUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Fichier
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setResFile(e.target.files ? e.target.files[0] : null)}
                    required
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:font-medium file:bg-[var(--accent-soft)] file:text-[var(--accent-text)]"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] py-2.5 rounded-xl text-xs font-medium transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 btn-accent disabled:opacity-50 py-2.5 rounded-xl text-xs font-medium"
            >
              {uploading ? 'Ajout en cours...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
