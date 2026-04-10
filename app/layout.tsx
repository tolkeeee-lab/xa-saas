import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'xà — Gestion de caisse & inventaire',
  description: 'Solution multi-boutiques optimisée pour le marché béninois.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B4332" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="xà" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-xa-bg min-h-screen antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[sw] registered', reg.scope); })
                    .catch(function(err) { console.error('[sw] registration failed', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
