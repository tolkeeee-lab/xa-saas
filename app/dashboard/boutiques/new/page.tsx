import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase-server';

async function addBoutique(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const nom = (formData.get('nom') as string).trim();
  const ville = (formData.get('ville') as string | null)?.trim() || null;
  const adresse = (formData.get('adresse') as string | null)?.trim() || null;
  const telephone = (formData.get('telephone') as string | null)?.trim() || null;
  const codeUnique = (formData.get('code_unique') as string | null)?.toUpperCase().trim() || null;
  const pinCaisse = (formData.get('pin_caisse') as string | null)?.trim() || null;

  if (!nom) return;

  // Validation
  if (codeUnique && !/^[A-Z0-9]{4,}$/.test(codeUnique)) return;
  if (pinCaisse && !/^\d{64}$/.test(pinCaisse)) return; // must be SHA-256 hex (64 chars)

  const { error } = await supabase.from('boutiques').insert({
    nom,
    ville,
    adresse,
    telephone,
    proprietaire_id: user.id,
    actif: true,
    code_unique: codeUnique,
    pin_caisse: pinCaisse,
  });

  if (error) throw new Error(error.message);

  redirect('/dashboard');
}

export default async function NewBoutiquePage() {
  return (
    <main className="min-h-screen bg-xa-bg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-xa-primary">Nouvelle boutique</h1>
          <Link href="/dashboard" className="text-sm text-gray-400">← Retour</Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          {/* Client-side hashing note: the PIN field is hidden and filled by JS */}
          <form id="boutique-form" action={addBoutique} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" name="nom" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Nom de la boutique" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input type="text" name="ville"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Cotonou (optionnel)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input type="text" name="adresse"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="Adresse (optionnel)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" name="telephone"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="+229 xx xx xx xx (optionnel)" />
            </div>

            <hr className="border-gray-100" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code unique caisse</label>
              <input type="text" name="code_unique" id="code_unique"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }}
                minLength={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="ex: BOUTIQUE2 (optionnel)" />
              <p className="text-xs text-gray-400 mt-1">Partagez ce code avec vos employés pour accéder à la caisse</p>
            </div>

            {/* PIN caisse : saisi en clair, haché côté client avant envoi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN caisse (4 chiffres)</label>
              <input type="password" inputMode="numeric" id="pin_raw" maxLength={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                placeholder="•••• (optionnel)" />
              {/* Hidden field that will contain the hashed PIN */}
              <input type="hidden" name="pin_caisse" id="pin_caisse" />
              <p className="text-xs text-gray-400 mt-1">Votre code d&apos;accès à la caisse (stocké de façon sécurisée)</p>
            </div>

            <button type="button" id="submit-btn"
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 mt-2 hover:bg-xa-primary/90 transition">
              Créer la boutique
            </button>
          </form>
        </div>
      </div>

      {/* Client-side PIN hashing before form submission */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('submit-btn').addEventListener('click', async function() {
          const rawPin = document.getElementById('pin_raw').value;
          if (rawPin && /^\\d{4}$/.test(rawPin)) {
            const enc = new TextEncoder();
            const buf = await crypto.subtle.digest('SHA-256', enc.encode(rawPin));
            const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
            document.getElementById('pin_caisse').value = hex;
          } else if (rawPin) {
            alert('Le PIN doit être exactement 4 chiffres');
            return;
          }
          document.getElementById('boutique-form').requestSubmit();
        });
      ` }} />
    </main>
  );
}
