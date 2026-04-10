import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth/AuthContext';

export const metadata: Metadata = {
  title: 'xà — Gestion de caisse & inventaire',
  description: 'Solution multi-boutiques optimisée pour le marché béninois.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-xa-bg min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
