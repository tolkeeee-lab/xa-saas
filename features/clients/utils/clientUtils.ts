/** Number of days without activity before a client is considered inactive */
export const INACTIVE_DAYS_THRESHOLD = 30;

export function getInitials(nom: string, prenom: string | null): string {
  const p = prenom?.trim()[0]?.toUpperCase() ?? '';
  const n = nom.trim()[0]?.toUpperCase() ?? '';
  return (p + n) || n || '?';
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-green-600',
  'from-sky-500 to-blue-600',
] as const;

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 30) return `Il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'Il y a 1 mois';
  if (months < 12) return `Il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
}
