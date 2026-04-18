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
| Bouton « 🔒 Verrouiller » | Verrouillage immédiat + révocation serveur (raison : *manuel*) |
| Token de session expiré | Verrouillage automatique à la prochaine action (raison : *expiré*) |

### Nettoyage d'état lors du verrouillage

Quel que soit le déclencheur, le token caisse est **immédiatement effacé** de la mémoire du
composant dès que le verrou se pose :

- **Inactivité** : le token est vidé côté client ; l'ancien token peut encore être accepté
  par le serveur jusqu'à son expiration naturelle (8 h).
- **Verrouillage manuel** : le token est vidé côté client *et* une requête
  `DELETE /api/caisse/session` est envoyée en arrière-plan pour révoquer la session
  côté serveur (idempotent, échecs réseau ignorés silencieusement).
- **Token expiré** : le token est vidé côté client (il est de toute façon rejeté par le
  serveur).

Ce nettoyage évite qu'un token résiduel ne soit transmis si l'écran de verrouillage était
contourné d'une manière ou d'une autre.

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
- La révocation serveur lors du verrouillage par inactivité n'est pas déclenchée (le token expire
  naturellement après 8 h) ; cela peut être activé dans une itération future si nécessaire.

### Hooks et composants

| Fichier | Description |
|---|---|
| `hooks/useCaisseIdle.ts` | Détection d'inactivité ; `lock()`, `unlock()`, `isLocked` |
| `features/caisse/CaisseLockScreen.tsx` | Overlay de verrouillage avec saisie PIN |

---

## Terminaux caisse de confiance (trusted devices)

### Vue d'ensemble

Chaque navigateur POS génère automatiquement un identifiant stable (`terminal_id`, UUID v4) stocké
dans `localStorage`.  Cet identifiant est transmis lors de chaque vérification PIN via
`POST /api/caisse/verify-pin`.  Le serveur l'enregistre dans la table `caisse_terminals` et
l'intègre au token de session caisse.

### Identité terminal côté client

```typescript
import { getOrCreateTerminalId } from '@/lib/terminalId';
const terminal_id = getOrCreateTerminalId(); // null côté SSR
```

L'ID est créé une seule fois par navigateur et réutilisé à chaque session.  Il persiste tant que
le `localStorage` n'est pas effacé.

### Enregistrement lors du verify-pin

```http
POST /api/caisse/verify-pin
Content-Type: application/json

{
  "boutique_id": "...",
  "pin_hash": "...",
  "terminal_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

En cas de succès, le serveur :
1. **Upsert** un enregistrement dans `caisse_terminals` (`first_seen_at` / `last_seen_at` / `last_ip`).
2. Intègre le `terminal_id` dans le payload du token de session (HMAC-SHA256 signé).
3. Retourne le `terminal_id` dans la réponse JSON.

Le `terminal_id` est **optionnel** : les clients qui ne l'envoient pas continuent à fonctionner
normalement (migration progressive).

### Lister les terminaux connus

```http
GET /api/caisse/terminals
x-caisse-token: <token>
```

Retourne les terminaux enregistrés pour la boutique du token :

```json
{
  "terminals": [
    {
      "id": "...",
      "terminal_id": "550e8400-...",
      "label": null,
      "first_seen_at": "2026-04-18T12:00:00Z",
      "last_seen_at": "2026-04-18T15:30:00Z",
      "last_ip": "192.168.1.10",
      "statut": "actif"
    }
  ]
}
```

### Schéma de la table `caisse_terminals`

| Colonne        | Type        | Description                                   |
|---|---|---|
| `id`           | UUID PK     | Identifiant interne                           |
| `boutique_id`  | UUID FK     | Boutique concernée                            |
| `terminal_id`  | TEXT        | UUID stable généré côté client                |
| `label`        | TEXT (null) | Nom optionnel (ex. "Caisse 1")                |
| `first_seen_at`| TIMESTAMPTZ | Première authentification réussie             |
| `last_seen_at` | TIMESTAMPTZ | Dernière authentification réussie             |
| `last_ip`      | TEXT (null) | Dernière IP connue                            |
| `statut`       | TEXT        | `'actif'` ou `'revoque'`                      |

### Limites connues

- L'**enforcement** du statut `revoque` n'est pas encore activé : un terminal révoqué peut toujours
  s'authentifier (le flag est en place en DB, la vérification viendra dans une prochaine PR).
- Le `terminal_id` repose sur `localStorage` : il est perdu si l'utilisateur vide les données du
  site, ce qui génère un nouvel ID (et donc un nouveau terminal en DB).
- La révocation manuelle (PATCH) depuis le tableau de bord n'est pas encore implémentée.

### Prochaines étapes suggérées

1. **Affichage dashboard** — page `/dashboard/caisse/terminaux` listant et nommant les terminaux.
2. **Révocation** — `PATCH /api/caisse/terminals/:id` (auth patron) pour passer `statut` à
   `'revoque'`.
3. **Enforcement** — vérifier dans `verify-pin` que le terminal n'est pas révoqué avant d'émettre
   un token.
4. **Approbation stricte** — option "n'autoriser que les terminaux approuvés" par boutique.

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
| `/api/caisse/terminals` | Public (token caisse) | Liste des terminaux connus par boutique (GET) |
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
