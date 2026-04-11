export function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('xa-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  // Suit le système OS par défaut
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('xa-theme', theme);
}

export function toggleTheme(): 'dark' | 'light' {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
