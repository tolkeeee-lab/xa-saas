'use client';

import { X, MapPin, Phone, Store } from 'lucide-react';
import type { Boutique } from '@/types/database';

type Props = {
  boutique: Boutique;
  onClose: () => void;
};

export default function PartenaireDetailDrawer({ boutique, onClose }: Props) {
  return (
    <div className="xa-drawer-overlay" onClick={onClose}>
      <div className="xa-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="xa-drawer__header">
          <div className="xa-drawer__title-row">
            <Store size={20} />
            <h2 className="xa-drawer__title">{boutique.nom}</h2>
          </div>
          <button onClick={onClose} className="xa-modal__close"><X size={20} /></button>
        </div>
        <div className="xa-drawer__body">
          <span className={`xa-badge xa-badge--${boutique.actif ? 'green' : 'red'}`} style={{ marginBottom: '1rem', display: 'inline-block' }}>
            {boutique.actif ? 'Active' : 'Inactive'}
          </span>

          <dl className="xa-dl">
            <dt><MapPin size={14} /> Ville</dt>
            <dd>{boutique.ville}{boutique.quartier ? ` — ${boutique.quartier}` : ''}</dd>

            {boutique.adresse && (
              <>
                <dt>Adresse</dt>
                <dd>{boutique.adresse}</dd>
              </>
            )}

            {boutique.telephone_whatsapp && (
              <>
                <dt><Phone size={14} /> WhatsApp</dt>
                <dd>{boutique.telephone_whatsapp}</dd>
              </>
            )}

            <dt>Code unique</dt>
            <dd><code className="xa-code">{boutique.code_unique}</code></dd>

            <dt>Thème</dt>
            <dd>
              <span
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: boutique.couleur_theme,
                  verticalAlign: 'middle',
                  marginRight: 6,
                  border: '1px solid var(--xa-border)',
                }}
              />
              {boutique.couleur_theme}
            </dd>

            <dt>Catalogue public</dt>
            <dd>{boutique.catalogue_public ? 'Oui' : 'Non'}</dd>

            <dt>Inscrit le</dt>
            <dd>{new Date(boutique.created_at).toLocaleDateString('fr-FR')}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
