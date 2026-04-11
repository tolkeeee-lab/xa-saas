import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'xà — Caisse & Stock',
  description: 'Application de gestion de caisse et de stock pour commerçants africains',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1B4332',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-xa-bg">{children}</body>
    </html>
  );
}
