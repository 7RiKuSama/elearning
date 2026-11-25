// File: src/components/ForumSection.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  CornerDownRight,
  HelpCircle,
  Link2,
  Megaphone,
  MessageSquarePlus,
  Send,
  Trash2,
} from 'lucide-react';
import {
  createForumReply,
  createForumThread,
  deleteForumThread,
  getForumThreadDetail,
  getForumThreads,
  markForumBestAnswer,
  setForumThreadResolved,
} from '../api/services';
import type { ForumCategory, ForumReply, ForumThread } from '../types/forum';

interface ForumSectionProps {
  courseId: number;
  currentUserId?: string;
  currentUserRole?: string;
}

const CATEGORY_META: Record<
  ForumCategory,
  { label: string; badgeStyle: string; icon: typeof HelpCircle }
> = {
  question: {
    label: 'Question',
    badgeStyle:
      'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
    icon: HelpCircle,
  },
  announcement: {
    label: 'Annonce',
    badgeStyle:
      'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--accent-border)]',
    icon: Megaphone,
  },
  resource: {
    label: 'Ressource',
    badgeStyle:
      'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
    icon: Link2,
  },
};

export default function ForumSection({
  courseId,
  currentUserId,
  currentUserRole,
}: ForumSectionProps) {
  const normalizedRole = (currentUserRole ?? '').toLowerCase();
  const isTeacher =
    normalizedRole === 'enseignant' ||
    normalizedRole === 'professeur' ||
    normalizedRole === 'teacher' ||
    normalizedRole === 'admin';

  const [categoryFilter, setCategoryFilter] = useState<'all' | ForumCategory>('all');
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showNewThread, setShowNewThread] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ForumCategory>('question');
  const [content, setContent] = useState('');
  const [submittingThread, setSubmittingThread] = useState(false);

  const [replyTarget, setReplyTarget] = useState<ForumReply | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await getForumThreads(courseId, categoryFilter);
      setThreads(list);
      setActiveThread((prev) => {
        if (!prev) return list[0] ?? null;
        return list.find((t) => t.id_message === prev.id_message) ?? list[0] ?? null;
      });
    } finally {
      setLoadingList(false);
    }
  }, [courseId, categoryFilter]);

  const loadThreadDetail = useCallback(async (messageId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await getForumThreadDetail(messageId);
      setActiveThread(detail);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (activeThread?.id_message) {
      loadThreadDetail(activeThread.id_message);
    }
  }, [activeThread?.id_message, loadThreadDetail]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmittingThread(true);
    try {
      const created = await createForumThread(courseId, {
        titre: title.trim(),
        contenu: content.trim(),
        categorie: category,
      });
      setTitle('');
      setContent('');
      setShowNewThread(false);
      await loadThreads();
      setActiveThread(created);
    } finally {
      setSubmittingThread(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await createForumReply(activeThread.id_message, {
        contenu: replyText.trim(),
        parent_id_reponse: replyTarget?.id_reponse ?? null,
      });
      setReplyText('');
      setReplyTarget(null);
      await Promise.all([loadThreadDetail(activeThread.id_message), loadThreads()]);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleMarkBestAnswer = async (replyId: number) => {
    if (!activeThread || !isTeacher) return;
    const updated = await markForumBestAnswer(activeThread.id_message, replyId);
    setActiveThread(updated);
    await loadThreads();
  };

  const handleToggleResolved = async () => {
    if (!activeThread || !isTeacher) return;
    const updated = await setForumThreadResolved(
      activeThread.id_message,
      !activeThread.is_resolved
    );
    setActiveThread(updated);
    await loadThreads();
  };

  const handleDeleteThread = async (messageId: number) => {
    await deleteForumThread(messageId);
    if (activeThread?.id_message === messageId) {
      setActiveThread(null);
    }
    await loadThreads();
  };

  const renderCategoryBadge = (cat: ForumCategory) => {
    const meta = CATEGORY_META[cat] ?? CATEGORY_META.question;
    const Icon = meta.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.badgeStyle}`}
      >
        <Icon className="w-3 h-3" />
        {meta.label}
      </span>
    );
  };

  const renderReplyNode = (reply: ForumReply, depth = 0) => {
    const isBest =
      reply.is_best_answer || activeThread?.accepted_reply_id === reply.id_reponse;

    return (
      <div
        key={reply.id_reponse}
        className={
          depth > 0
            ? 'ml-5 pl-4 border-l-2 border-[var(--border-subtle)] mt-3'
            : 'mt-3'
        }
      >
        <div
          className={`p-3.5 rounded-xl border transition ${
            isBest
              ? 'bg-[var(--success-bg)] border-[var(--success-border)]'
              : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                {reply.auteur_nom || 'Participant'}
              </span>
              {reply.auteur_role && (
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                  {reply.auteur_role}
                </span>
              )}
              {isBest && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--success-text)] text-[var(--text-inverse)]">
                  <Award className="w-3 h-3" />
                  Meilleure réponse
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {isTeacher && !isBest && (
                <button
                  type="button"
                  onClick={() => handleMarkBestAnswer(reply.id_reponse)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--success-text)] border border-[var(--border-subtle)] transition"
                >
                  <Award className="w-3 h-3" />
                  <span>Valider réponse</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setReplyTarget(reply)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>Répondre</span>
              </button>
            </div>
          </div>

          <p className="mt-2 text-sm text-[var(--text-primary)] whitespace-pre-line">
            {reply.contenu}
          </p>
        </div>

        {reply.children?.map((child) => renderReplyNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'question', 'announcement', 'resource'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setCategoryFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                categoryFilter === tab
                  ? 'bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {tab === 'all' ? 'Tout' : CATEGORY_META[tab].label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowNewThread((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium btn-accent"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Nouveau fil</span>
        </button>
      </div>

      {showNewThread && (
        <form
          onSubmit={handleCreateThread}
          className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la discussion..."
              className="sm:col-span-2 px-3.5 py-2 rounded-xl text-sm bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ForumCategory)}
              className="px-3 py-2 rounded-xl text-sm bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="question">Question</option>
              {isTeacher && <option value="announcement">Annonce</option>}
              <option value="resource">Ressource</option>
            </select>
          </div>

          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Décrivez votre question, annonce ou lien/ressource..."
            className="w-full px-3.5 py-2 rounded-xl text-sm bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewThread(false)}
              className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submittingThread}
              className="px-4 py-1.5 rounded-xl text-xs font-medium btn-accent disabled:opacity-50"
            >
              {submittingThread ? 'Publication...' : 'Publier le fil'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-2.5">
          {loadingList ? (
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              Chargement des discussions...
            </div>
          ) : threads.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              Aucune discussion dans cette catégorie.
            </div>
          ) : (
            threads.map((th) => {
              const selected = activeThread?.id_message === th.id_message;
              return (
                <button
                  key={th.id_message}
                  type="button"
                  onClick={() => setActiveThread(th)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition ${
                    selected
                      ? 'bg-[var(--bg-hover)] border-[var(--accent)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {renderCategoryBadge(th.categorie)}
                    {th.is_resolved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]">
                        <CheckCircle2 className="w-3 h-3" />
                        Résolu
                      </span>
                    )}
                  </div>

                  <h4 className="mt-2 text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
                    {th.titre}
                  </h4>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>{th.auteur_nom || 'Participant'}</span>
                    <span>{th.reply_count} réponse(s)</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-7">
          {!activeThread ? (
            <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-muted)] text-center">
              Sélectionnez un fil pour lire et participer aux échanges.
            </div>
          ) : loadingDetail ? (
            <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-muted)] text-center">
              Chargement du fil...
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderCategoryBadge(activeThread.categorie)}
                    {activeThread.is_resolved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Résolu / Meilleure réponse
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {activeThread.titre}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Par {activeThread.auteur_nom || 'Participant'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={handleToggleResolved}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition"
                    >
                      {activeThread.is_resolved ? 'Rouvrir' : 'Marquer résolu'}
                    </button>
                  )}
                  {(isTeacher ||
                    (currentUserId && currentUserId === activeThread.id_auteur)) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteThread(activeThread.id_message)}
                      title="Supprimer le fil"
                      className="p-1.5 rounded-xl text-[var(--danger-text)] hover:bg-[var(--danger-bg)] border border-transparent hover:border-[var(--danger-border)] transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">
                {activeThread.contenu}
              </p>

              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Réponses ({activeThread.reply_count})
                </h4>
                {(activeThread.replies ?? []).length === 0 ? (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Aucune réponse pour le moment. Lancez la discussion !
                  </p>
                ) : (
                  (activeThread.replies ?? []).map((rep) => renderReplyNode(rep, 0))
                )}
              </div>

              <form
                onSubmit={handleSendReply}
                className="pt-3 border-t border-[var(--border-subtle)] space-y-2"
              >
                {replyTarget && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] text-xs">
                    <span>
                      Réponse à <strong>{replyTarget.auteur_nom || 'un message'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="underline text-xs"
                    >
                      Annuler
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      replyTarget
                        ? `Répondre à ${replyTarget.auteur_nom || 'ce message'}...`
                        : 'Écrire une réponse dans ce fil...'
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl text-sm bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium btn-accent disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReply ? 'Envoi...' : 'Répondre'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
