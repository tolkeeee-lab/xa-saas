import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'xà — Solution de Gestion',
  description:
    'Solution de gestion de caisse et d\'inventaire multi-boutiques pour le marché béninois.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1B4332',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
