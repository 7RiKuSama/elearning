// File: src/pages/student/course-detail/mediaUtils.ts
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(
  /\/api\/?$/,
  ''
);

export const resolveFileUrl = (path?: string | null): string => {
  if (!path) return '';
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('file://')) {
    const clean = trimmed.replace(/^file:\/\//i, '');
    const uploadsIdx = clean.indexOf('/uploads/');
    if (uploadsIdx !== -1) {
      return `${API_ORIGIN}${clean.slice(uploadsIdx)}`;
    }
    return '';
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${normalized}`;
};

export const getVideoEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
};

export const renderMarkdown = (md: string): string => {
  if (!md) return '';
  let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] p-3.5 rounded-xl overflow-x-auto text-xs my-3 font-mono"><code>$1</code></pre>'
  );
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-[var(--accent-soft)] text-[var(--accent-text)] px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
  );
  html = html.replace(
    /^### (.*$)/gim,
    '<h3 class="text-base font-semibold text-[var(--text-primary)] mt-4 mb-1">$1</h3>'
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 class="text-lg font-semibold text-[var(--text-primary)] mt-5 mb-2 border-b border-[var(--border-subtle)] pb-1">$1</h2>'
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 class="font-editorial text-xl text-[var(--text-primary)] mt-5 mb-3">$1</h1>'
  );
  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>'
  );
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  html = html.replace(
    /^&gt; (.*$)/gim,
    '<blockquote class="border-l-2 border-[var(--accent)] pl-3.5 italic text-[var(--text-secondary)] my-2">$1</blockquote>'
  );
  html = html.replace(/^\s*[-*] (.*$)/gim, '<li class="ml-5 list-disc my-0.5">$1</li>');
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="text-[var(--accent-text)] underline hover:opacity-80">$1</a>'
  );
  html = html.replace(/\n/g, '<br />');

  return html;
};

export const getSessionUser = (): { id_user?: string; role?: string } => {
  try {
    for (const key of ['user', 'pfel_user', 'currentUser', 'auth_user']) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed?.user ?? parsed;
        if (u?.id_user || u?.role) {
          return { id_user: u.id_user || u.id, role: u.role };
        }
      }
    }
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token && token.split('.').length === 3) {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      return {
        id_user: payload.id_user || payload.user_id || payload.sub,
        role: payload.role || payload.user_role,
      };
    }
  } catch {
    return {};
  }
  return {};
};
