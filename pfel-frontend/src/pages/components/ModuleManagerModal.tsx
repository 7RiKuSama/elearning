// File: src/pages/components/ModuleManagerModal.tsx
import React, { useEffect, useState } from 'react';
import {
  getCourseModules,
  getCourseResources,
  createModule,
  deleteModule,
  reorderCourseModules,
  assignResourceToModule,
} from '../../api/services';
import type { Cours, Module, Ressource } from '../../types';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface ModuleManagerModalProps {
  course: Cours;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function ModuleManagerModal({ course, onClose, onUpdated }: ModuleManagerModalProps) {
  const [courseModules, setCourseModules] = useState<Module[]>([]);
  const [courseResourcesList, setCourseResourcesList] = useState<Ressource[]>([]);
  const [newModTitle, setNewModTitle] = useState('');
  const [newModDesc, setNewModDesc] = useState('');

  const loadData = async () => {
    try {
      const [mods, resList] = await Promise.all([
        getCourseModules(course.id_cours).catch(() => []),
        getCourseResources(course.id_cours).catch(() => []),
      ]);
      setCourseModules(mods || []);
      setCourseResourcesList(resList || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [course.id_cours]);

  const handleCreateModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModTitle.trim()) return;
    try {
      await createModule(course.id_cours, {
        titre: newModTitle.trim(),
        description: newModDesc.trim(),
      });
      setNewModTitle('');
      setNewModDesc('');
      await loadData();
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du chapitre.');
    }
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= courseModules.length) return;

    const updated = [...courseModules];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    const reindexed = updated.map((m, idx) => ({ ...m, ordre_affichage: idx + 1 }));
    setCourseModules(reindexed);

    try {
      await reorderCourseModules(
        course.id_cours,
        reindexed.map((m) => m.id_module)
      );
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de l'ordre des chapitres.");
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    try {
      await deleteModule(moduleId);
      await loadData();
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression du chapitre.');
    }
  };

  const handleAssignResourceModule = async (resourceId: number, modIdVal: string) => {
    const parsedModId = modIdVal === '' ? null : Number(modIdVal);
    try {
      await assignResourceToModule(resourceId, parsedModId);
      setCourseResourcesList((prev) =>
        prev.map((r) => (r.id_ressource === resourceId ? { ...r, id_module: parsedModId } : r))
      );
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'affectation de la ressource au chapitre.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className="surface-card rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3.5">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Chapitres & modules
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

        <form
          onSubmit={handleCreateModuleSubmit}
          className="surface-subtle p-4 rounded-xl space-y-3"
        >
          <h4 className="text-xs font-semibold text-[var(--accent-text)]">Nouveau chapitre</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newModTitle}
              onChange={(e) => setNewModTitle(e.target.value)}
              placeholder="ex: Chapitre 1 - Fondamentaux"
              required
              className="px-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)]"
            />
            <input
              type="text"
              value={newModDesc}
              onChange={(e) => setNewModDesc(e.target.value)}
              placeholder="Description courte (optionnel)"
              className="px-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)]"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-accent text-xs font-medium px-4 py-2 rounded-xl">
              + Ajouter le chapitre
            </button>
          </div>
        </form>

        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[var(--text-muted)]">
            Ordre d'affichage ({courseModules.length})
          </h4>
          {courseModules.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
              Aucun chapitre créé pour ce cours.
            </p>
          ) : (
            courseModules.map((mod, idx) => (
              <div
                key={mod.id_module}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-[var(--text-primary)] block truncate">
                    {idx + 1}. {mod.titre}
                  </span>
                  {mod.description && (
                    <span className="text-xs text-[var(--text-muted)] block truncate">
                      {mod.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveModule(idx, 'up')}
                    className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] disabled:opacity-35"
                    title="Monter"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === courseModules.length - 1}
                    onClick={() => handleMoveModule(idx, 'down')}
                    className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] disabled:opacity-35"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteModule(mod.id_module)}
                    className="p-1.5 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {courseResourcesList.length > 0 && (
          <div className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
            <h4 className="text-xs font-medium text-[var(--text-muted)]">
              Classer les supports existants
            </h4>
            {courseResourcesList.map((res) => (
              <div
                key={res.id_ressource}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] text-xs"
              >
                <span className="font-medium text-[var(--text-primary)] truncate">
                  {res.nom_fichier}
                </span>
                <select
                  value={res.id_module ?? ''}
                  onChange={(e) => handleAssignResourceModule(res.id_ressource, e.target.value)}
                  className="px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-primary)]"
                >
                  <option value="">Non classé</option>
                  {courseModules.map((m, i) => (
                    <option key={m.id_module} value={m.id_module}>
                      {i + 1}. {m.titre}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
