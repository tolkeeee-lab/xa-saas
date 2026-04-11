import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'xà — Solution de Gestion',
  description:
    'Solution de gestion de caisse et d\'inventaire multi-boutiques pour le marché béninois.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1c5d7d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('xa-theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
