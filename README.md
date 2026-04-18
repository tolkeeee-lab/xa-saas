# xa-saas

**xà** — Solution de gestion de caisse et d'inventaire multi-boutiques optimisée pour le marché béninois.  
Gérez (xà) vos stocks et vos employés simplement pour mieux vendre (sà).

Stack : **Next.js 15** · **Supabase** · **PWA offline-first**

---

## Architecture

### Flux d'authentification

Deux flux distincts, clairement séparés :

| Flux | Chemin | Mécanisme |
|---|---|---|
| **Admin (patron)** | `/login` → `/dashboard` | Email + mot de passe Supabase |
| **Caisse (employé/patron)** | `/caisse` | Code boutique + PIN (API routes sécurisées) |

Le flux caisse n'utilise **pas** de session Supabase — il est entièrement public et sécurisé via des API routes côté serveur qui utilisent la clé service-role.

---

## Schéma de base de données

```
boutiques ──< employes
boutiques ──< clients_debiteurs
boutiques ──< transactions ──< transaction_lignes
boutiques ──< produits
employes  ──< transactions
clients_debiteurs ──< transactions (ventes à crédit)
auth.users ──< push_subscriptions
```

### Migrations

```
supabase/migrations/
  20260410000001_create_boutiques.sql
  20260410000002_create_employes.sql
  20260410000003_create_clients_debiteurs.sql
  20260410000004_create_transactions.sql
  20260410000005_on_auth_user_created.sql
  20260410000006_add_code_and_pin_to_boutiques.sql
  20260410000007_update_trigger_with_code_pin.sql
  20260410000008_caisse_public_read.sql
  20260410000009_create_produits.sql
  20260410000010_create_transaction_lignes.sql
  20260410000011_create_push_subscriptions.sql
  20260410000012_stock_decrement_trigger.sql
  20260410000013_fix_rls_caisse.sql          ← supprime les politiques RLS trop permissives
  20260410000014_fix_trigger_code_unique.sql  ← corrige le bug chaîne vide dans code_unique
  20260410000015_updated_at_produits.sql     ← trigger updated_at pour produits
  20260410000016_make_employe_id_nullable.sql ← employe_id nullable (transactions patron)
```

Pour appliquer les migrations :
```bash
supabase db reset        # en local
supabase db push         # en production
```

---

## Sécurité des PINs

Les PINs (caissier et propriétaire) sont **hachés SHA-256 côté client** avant toute écriture en base.  
La vérification se fait côté serveur via `/api/caisse/verify-pin` (jamais exposé dans le navigateur).

---

## Session caisse courte

Après validation du PIN, `POST /api/caisse/verify-pin` retourne un **token de session caisse** en plus
des infos boutique :

```json
{
  "success": true,
  "boutique": { "id": "...", "nom": "...", "couleur_theme": "..." },
  "session": {
    "token": "<opaque-token>",
    "expires_at": "2026-04-18T09:00:00.000Z"
  }
}
```

### Utilisation côté client

Le terminal POS stocke le token et l'envoie dans le header `x-caisse-token` sur les appels caisse
protégés :

```http
DELETE /api/caisse/session
x-caisse-token: <token>
```

### Durée de vie

8 heures (durée d'un service de caisse type).  Le secret de signature est `CAISSE_SESSION_SECRET`.
Faire tourner cette valeur invalide immédiatement toutes les sessions actives.

### Déconnexion

`DELETE /api/caisse/session` ajoute le token à la liste de révocation en mémoire et retourne
`{ "success": true }`.  Le client doit supprimer son token local.

### Protection des nouvelles routes caisse

Utiliser le helper `lib/requireCaisseSession.ts` dans les route handlers :

```typescript
import { requireCaisseSession } from '@/lib/requireCaisseSession';

export async function POST(request: NextRequest) {
  const guard = requireCaisseSession(request);
  if ('response' in guard) return guard.response; // 401/403
  const { boutique_id } = guard.context;
  // ...
}
```

---

## Idle timeout + lock screen caisse

La page `/dashboard/caisse` inclut un mécanisme de verrouillage automatique pour sécuriser les
terminaux laissés sans surveillance.

### Comportement

| Événement | Résultat |
|---|---|
| Inactivité ≥ 10 min | Verrouillage automatique (raison : *inactivité*) |
| Bouton « 🔒 Verrouiller » | Verrouillage immédiat (raison : *manuel*) |
| Token de session expiré | Verrouillage automatique à la prochaine action (raison : *expiré*) |

### Déverrouillage

L'écran de verrouillage demande le **PIN caisse** de la boutique active.  
Une vérification via `POST /api/caisse/verify-pin` est effectuée ; en cas de succès :

1. Un nouveau token de session caisse (8 h) est émis et stocké en mémoire.
2. Le terminal reprend immédiatement là où il s'était arrêté.
3. Le timer d'inactivité est réinitialisé.

### Transmission du token aux API

Après déverrouillage, le token caisse est envoyé dans le header `x-caisse-token` sur les appels
`POST /api/transactions`.  L'endpoint existant ne valide pas encore ce header (compatibilité
rétrograde) — la validation serveur sera activée dans une prochaine itération.

### Limites connues

- Le token caisse n'est pas persisté (sessionStorage / cookie) : un rechargement de page repart
  sans token jusqu'au prochain déverrouillage.
- La session Supabase (auth patron) reste active indépendamment du verrouillage caisse.
- Les routes API existantes (`/api/transactions`, etc.) n'imposent pas encore le token caisse côté
  serveur.

### Hooks et composants

| Fichier | Description |
|---|---|
| `hooks/useCaisseIdle.ts` | Détection d'inactivité ; `lock()`, `unlock()`, `isLocked` |
| `features/caisse/CaisseLockScreen.tsx` | Overlay de verrouillage avec saisie PIN |

---

## Mode offline (PWA)

Le mode offline repose sur **IndexedDB** et le Background Sync du Service Worker :

1. **Hors ligne** → la vente est stockée dans IndexedDB (`xa-offline` / `pending_transactions`).
2. **Background Sync** → le SW envoie automatiquement les transactions via `POST /api/transactions/sync`.
3. **Idempotence** garantie via l'index unique sur `local_id`.

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
# Obligatoires
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Requis pour les API routes caisse (service-role, jamais exposé au browser)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Requis en production — signe les tokens de session caisse (HMAC-SHA256)
# Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CAISSE_SESSION_SECRET=<random-32-byte-hex>
```

---

## Structure des routes

| Route | Accès | Description |
|---|---|---|
| `/` | Public | Page d'accueil |
| `/login` | Public | Connexion admin |
| `/register` | Public | Inscription patron |
| `/caisse` | Public | Caisse (flux employé/patron) |
| `/dashboard` | Authentifié | Tableau de bord patron |
| `/dashboard/boutiques/new` | Authentifié | Créer une boutique |
| `/dashboard/employes` | Authentifié | Gestion employés |
| `/dashboard/produits` | Authentifié | Gestion produits |
| `/dashboard/parametres` | Authentifié | Paramètres (code, PIN, employés) |
| `/api/caisse/*` | Public (service-role) | API routes caisse sécurisées |
| `/api/caisse/session` | Public (token caisse) | Déconnexion session caisse (DELETE) |
| `/api/transactions/sync` | Public (service-role) | Sync offline transactions |
| `/dashboard/transferts` | Authentifié | Transferts inter-sites |
| `/dashboard/perimes` | Authentifié | Péremptions produits |
| `/dashboard/comparatif` | Authentifié | Comparatif boutiques |
| `/dashboard/personnel` | Authentifié | Personnel avancé |
| `/api/transferts` | Authentifié (service-role) | Historique + création transferts |
| `/api/produits/[id]` | Authentifié (service-role) | PATCH stock/prix produit |

---

## Migration SQL — table `transferts`

```sql
CREATE TABLE IF NOT EXISTS transferts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produit_id UUID REFERENCES produits(id),
  boutique_source_id UUID REFERENCES boutiques(id),
  boutique_destination_id UUID REFERENCES boutiques(id),
  quantite INTEGER NOT NULL,
  note TEXT,
  statut TEXT DEFAULT 'en_transit' CHECK (statut IN ('en_transit', 'livre')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

La colonne `date_peremption` doit être ajoutée à la table `produits` si elle n'existe pas :

```sql
ALTER TABLE produits ADD COLUMN IF NOT EXISTS date_peremption TIMESTAMPTZ;
```
