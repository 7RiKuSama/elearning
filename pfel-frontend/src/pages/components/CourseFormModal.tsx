// File: src/pages/components/CourseFormModal.tsx
import React, { useEffect, useState } from 'react';
import { createCourse, updateCourse, uploadFileToServer } from '../../api/services';
import type { Categorie, Cours } from '../../types';
import { resolveSafeUrl } from '../../utils/url';
import { Image as ImageIcon } from 'lucide-react';

interface CourseFormModalProps {
  categories: Categorie[];
  courseToEdit?: Cours | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CourseFormModal({
  categories,
  courseToEdit,
  onClose,
  onSaved,
}: CourseFormModalProps) {
  const isEditing = Boolean(courseToEdit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id_categorie ?? 1);
  const [isPublished, setIsPublished] = useState(true);
  const [coverUrl, setCoverUrl] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('Beginner');
  const [prerequisites, setPrerequisites] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.titre);
      setDescription(courseToEdit.description);
      setCategoryId(courseToEdit.id_categorie);
      setIsPublished(courseToEdit.est_publie);
      setCoverUrl(courseToEdit.cover_url || '');
      setEstimatedDuration(courseToEdit.estimated_duration || '');
      setDifficultyLevel(courseToEdit.difficulty_level || 'Beginner');
      setPrerequisites(courseToEdit.prerequisites || '');
    } else {
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id_categorie ?? 1);
      setIsPublished(true);
      setCoverUrl('');
      setEstimatedDuration('');
      setDifficultyLevel('Beginner');
      setPrerequisites('');
    }
  }, [courseToEdit, categories]);

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const uploaded = await uploadFileToServer(file);
      setCoverUrl(uploaded.chemin_fichier);
    } catch (err) {
      console.error(err);
      alert("Oups, l'image de couverture n'a pas voulu passer !");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        titre: title,
        description,
        est_publie: isPublished,
        id_categorie: Number(categoryId),
        cover_url: coverUrl.trim(),
        estimated_duration: estimatedDuration.trim(),
        difficulty_level: difficultyLevel,
        prerequisites: prerequisites.trim(),
      };

      if (isEditing && courseToEdit) {
        await updateCourse(courseToEdit.id_cours, payload);
        alert('Cours remis à neuf avec brio !');
      } else {
        await createCourse(payload);
        alert('Nouveau cours lâché dans l’arène !');
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert(
        isEditing
          ? 'La mise à jour a glissé en route — réessaie !'
          : 'Impossible de lancer ce cours pour le moment.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const previewSrc = resolveSafeUrl(coverUrl);

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className="surface-card rounded-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3.5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {isEditing ? 'Peaufiner ce cours' : 'Lancer un nouveau cours'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Nom de l&apos;aventure (titre)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Dompter les embeddings sans prise de tête"
              required
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Le pitch du cours
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="De quoi on va s'amuser et quel super-pouvoir on débloque ?"
              required
              rows={3}
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Terrain / Catégorie
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)]"
              >
                {categories.map((cat) => (
                  <option key={cat.id_categorie} value={cat.id_categorie}>
                    {cat.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Niveau de chauffe
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)]"
              >
                <option value="Beginner">Débutant (tranquille)</option>
                <option value="Intermediate">Intermédiaire (ça chauffe)</option>
                <option value="Advanced">Avancé (mode turbo)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Rythme / Durée estimée
            </label>
            <input
              type="text"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="ex: 4 semaines ou 6 heures"
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Bagage conseillé avant de plonger
            </label>
            <textarea
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              placeholder="ex: Savoir lire un peu de Python et ne pas avoir peur d'un terminal"
              rows={2}
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-[var(--text-secondary)] flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              <span>Affiche du cours (fichier ou lien)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleCoverUpload(e.target.files[0]);
                }
              }}
              className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:font-medium file:bg-[var(--accent-soft)] file:text-[var(--accent-text)]"
            />
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... ou /uploads/..."
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            {uploadingCover && (
              <p className="text-xs text-[var(--accent-text)]">Envoi de l&apos;affiche en cours...</p>
            )}
            {previewSrc && (
              <div className="relative h-28 w-full rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                <img
                  src={previewSrc}
                  alt="Aperçu de l'affiche"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="course-pub"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
            />
            <label
              htmlFor="course-pub"
              className="text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              {isEditing ? 'Visible par la troupe' : 'Mettre en ligne direct'}
            </label>
          </div>

          <div className="flex space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] py-2.5 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Laisser tomber
            </button>
            <button
              type="submit"
              disabled={uploadingCover || submitting}
              className="flex-1 btn-accent disabled:opacity-50 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              {submitting
                ? 'Ça sauvegarde...'
                : isEditing
                ? 'Garder les modifs'
                : 'C’est parti !'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
