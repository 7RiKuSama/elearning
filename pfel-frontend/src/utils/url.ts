const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

export function resolveSafeUrl(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^file:\/\//i.test(trimmed)) {
    const clean = trimmed.replace(/^file:\/\//i, '');
    const idx = clean.indexOf('/uploads/');
    return idx !== -1 ? `${API_ORIGIN}${clean.slice(idx)}` : '';
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${normalized}`;
}
