import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'xà — Gestion de caisse & inventaire',
  description: 'Solution multi-boutiques optimisée pour le marché béninois.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-xa-bg min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
