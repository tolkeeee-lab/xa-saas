'use client';

import { MessageCircle, FileText } from 'lucide-react';

const SUPPORT_WA = 'https://wa.me/2290154330545?text=Besoin%20d%27aide%20MAFRO';
const VERSION = '0.1.0';

export default function AProposSection() {
  return (
    <section className="bg-xa-surface border border-xa-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-xa-muted uppercase tracking-wider mb-4">
        À propos
      </h2>

      <ul className="space-y-1">
        <li>
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg">
            <span className="text-sm text-xa-muted flex-1">Version</span>
            <span className="text-sm font-mono text-xa-text">MAFRO v4 · {VERSION}</span>
          </div>
        </li>

        <li>
          <a
            href={SUPPORT_WA}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-xa-bg2 transition-colors"
            style={{ minHeight: 48 }}
          >
            <MessageCircle size={18} className="text-xa-muted flex-shrink-0" />
            <span className="text-sm text-xa-text flex-1">Contacter le support</span>
          </a>
        </li>

        <li>
          <a
            href="#"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-xa-bg2 transition-colors"
            style={{ minHeight: 48 }}
          >
            <FileText size={18} className="text-xa-muted flex-shrink-0" />
            <span className="text-sm text-xa-text flex-1">Conditions d'utilisation</span>
            <span className="text-xs text-xa-muted">(Bientôt)</span>
          </a>
        </li>
      </ul>
    </section>
  );
}
