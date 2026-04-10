# xa-saas

**xà** — Solution de gestion de caisse et d'inventaire multi-boutiques optimisée pour le marché béninois.  
Gérez (xà) vos stocks et vos employés simplement pour mieux vendre (sà).

Stack : **Next.js** · **Supabase** · mode **offline-first**

---

## Schéma de base de données

### Vue d'ensemble

```
boutiques ──< employes
boutiques ──< clients_debiteurs
boutiques ──< transactions
employes  ──< transactions
clients_debiteurs ──< transactions (optionnel, ventes à crédit)
```

### Tables

#### `boutiques`
Point de vente physique appartenant à un propriétaire (lié à `auth.users`).

| Colonne | Type | Description |
|---|---|---|
| `id` | UUID PK | Identifiant unique |
| `nom` | TEXT | Nom de la boutique |
| `adresse` | TEXT | Adresse physique |
| `telephone` | TEXT | Numéro de contact |
| `ville` | TEXT | Ville (ex. Cotonou, Porto-Novo) |
| `proprietaire_id` | UUID | Lié à `auth.users` |
| `actif` | BOOLEAN | Boutique active |

---

#### `employes`
Membres du personnel habilités à réaliser des transactions.

| Colonne | Type | Description |
|---|---|---|
| `id` | UUID PK | Identifiant unique |
| `boutique_id` | UUID FK | Boutique d'appartenance |
| `nom` / `prenom` | TEXT | Identité |
| `telephone` | TEXT | Numéro de contact |
| `pin` | TEXT | Code PIN haché (accès rapide caisse) |
| `role` | ENUM | `caissier` · `gerant` · `admin` |

---

#### `clients_debiteurs`
Clients ayant un compte courant (ventes à crédit).

| Colonne | Type | Description |
|---|---|---|
| `id` | UUID PK | Identifiant unique |
| `boutique_id` | UUID FK | Boutique concernée |
| `nom` / `prenom` | TEXT | Identité |
| `telephone` | TEXT | Numéro de contact |
| `solde_du` | NUMERIC(15,2) | Montant total dû en XOF |
| `plafond_credit` | NUMERIC(15,2) | Limite de crédit (NULL = illimité) |

---

#### `transactions` ⭐
Table centrale qui lie un **employé**, une **boutique** et un **client débiteur** optionnel.

| Colonne | Type | Description |
|---|---|---|
| `id` | UUID PK | Identifiant Supabase |
| `local_id` | UUID | UUID client (offline, unique) |
| `boutique_id` | UUID FK | Boutique |
| `employe_id` | UUID FK | Employé ayant réalisé la transaction |
| `client_debiteur_id` | UUID FK nullable | Client débiteur (vente à crédit) |
| `type` | ENUM | `vente` · `credit` · `remboursement` · `avoir` · `depense` |
| `statut` | ENUM | `en_attente` · `validee` · `annulee` |
| `mode_paiement` | ENUM | `especes` · `mobile_money` · `virement` · `carte` · `credit` |
| `montant_total` | NUMERIC(15,2) | Total de la transaction (XOF) |
| `montant_recu` | NUMERIC(15,2) | Montant remis par le client |
| `monnaie_rendue` | NUMERIC(15,2) | Monnaie rendue |
| `montant_credit` | NUMERIC(15,2) | Montant imputé sur la dette |
| `reference` | TEXT | Référence externe (ticket, facture…) |
| `notes` | TEXT | Observations libres |
| `sync_statut` | ENUM | `local` · `synced` · `conflict` |
| `synced_at` | TIMESTAMPTZ | Dernière synchronisation réussie |
| `created_at` | TIMESTAMPTZ | Horodatage réel de la transaction |

**Contraintes métier intégrées :**
- Une transaction de type `credit` ou `remboursement` **doit** référencer un `client_debiteur_id`.
- La monnaie rendue ne peut pas dépasser le montant reçu.
- Les transactions ne sont **jamais supprimées** (soft delete via `statut = 'annulee'`).
- Un trigger met à jour automatiquement le `solde_du` du client débiteur.

---

## Mode offline

Le mode offline repose sur `localStorage` et le champ `sync_statut` :

1. **Hors ligne** → `createTransaction()` stocke localement (`sync_statut = 'local'`).
2. **Retour en ligne** → `syncPendingTransactions()` envoie les transactions en attente.
3. **Idempotence** garantie via l'index unique sur `local_id`.

```ts
import { createTransaction, registerOnlineSync } from '@/lib/offlineSync';

// Crée une transaction (online ou offline automatiquement)
const { data, offline } = await createTransaction({ ... });

// Synchronisation automatique au retour en ligne
useEffect(() => registerOnlineSync((result) => {
  console.log(`${result.synced} transactions synchronisées`);
}), []);
```

---

## Migrations Supabase

```
supabase/migrations/
  20260410000001_create_boutiques.sql
  20260410000002_create_employes.sql
  20260410000003_create_clients_debiteurs.sql
  20260410000004_create_transactions.sql
```

Pour appliquer les migrations localement :
```bash
supabase db reset
```

Pour appliquer en production :
```bash
supabase db push
```

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```
