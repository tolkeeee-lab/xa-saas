'use client';

import { useState } from 'react';
import { Lock, LogOut, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import type { EffectiveRole } from '@/lib/auth/getEffectiveRole';
import ChangePinModal from '../modals/ChangePinModal';

type SecuriteSectionProps = {
  role: EffectiveRole;
};

export default function SecuriteSection({ role }: SecuriteSectionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [pinOpen, setPinOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const showPin = role.role === 'manager' || role.role === 'staff' || role.role === 'owner';

  async function handleChangePassword() {
    setPasswordMsg(null);
    setChangingPassword(true);
    const newPassword = window.prompt('Entrez votre nouveau mot de passe (min. 8 caractères) :');
    if (!newPassword) {
      setChangingPassword(false);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 8 caractères.' });
      setChangingPassword(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Mot de passe mis à jour.' });
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <section className="bg-xa-surface border border-xa-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-xa-muted uppercase tracking-wider mb-4">
        Sécurité
      </h2>

      <div className="space-y-2">
        {passwordMsg && (
          <div
            className={`p-3 rounded-lg text-sm border ${
              passwordMsg.type === 'success'
                ? 'border-xa-green text-xa-green'
                : 'border-xa-danger text-xa-danger'
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleChangePassword}
          disabled={changingPassword}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg2 transition-colors disabled:opacity-50"
          style={{ minHeight: 48 }}
        >
          <Lock size={18} className="text-xa-muted flex-shrink-0" />
          <span>{changingPassword ? 'Changement…' : 'Changer mon mot de passe'}</span>
        </button>

        {showPin && (
          <button
            type="button"
            onClick={() => setPinOpen(true)}
            disabled={role.role === 'owner'}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: 48 }}
            title={role.role === 'owner' ? 'Bientôt disponible' : undefined}
          >
            <KeyRound size={18} className="text-xa-muted flex-shrink-0" />
            <span>
              Changer mon PIN caisse
              {role.role === 'owner' && (
                <span className="ml-2 text-xs text-xa-muted">(Bientôt)</span>
              )}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors disabled:opacity-50"
          style={{
            minHeight: 48,
            borderColor: 'var(--xa-danger)',
            color: 'var(--xa-danger)',
          }}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span>{loggingOut ? 'Déconnexion…' : 'Déconnexion'}</span>
        </button>
      </div>

      {pinOpen && (
        <ChangePinModal
          onClose={() => setPinOpen(false)}
        />
      )}
    </section>
  );
}
