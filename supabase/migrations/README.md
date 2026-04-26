# Supabase Migrations — xa-saas

Ce fichier documente l'historique des migrations et identifie les migrations potentiellement obsolètes détectées lors de l'audit du 2026-04-25 (PR #95).

---

## ⚠️ Migrations potentiellement obsolètes (NE PAS réappliquer)

> Ces migrations ont déjà été appliquées en production. **Ne pas les supprimer du repo** (Supabase CLI les exécute séquentiellement ; supprimer le fichier n'annule pas la migration).
> Si une fonctionnalité doit être annulée, créer une **nouvelle migration** `DROP`/`ALTER`.

| Fichier | Problème détecté | Action recommandée |
|---|---|---|
| `20260417_process_sale_rpc.sql` | Crée la fonction RPC `process_sale` (v1). Jamais appelée depuis le code app — seul `process_sale_v2` est utilisé (`app/api/caisse/vente/route.ts`). | Créer une migration `DROP FUNCTION process_sale(...)` une fois confirmé qu'elle n'est plus utilisée en prod. |
| `20260420_process_sale_v2.sql` | Crée `process_sale_v2` avec les paramètres de base. Immédiatement remplacée par `20260420_process_sale_v2_employe.sql` (même date, même fonction recréée avec `p_employe_id`). Étape intermédiaire inutile. | Ne rien faire — la DB est dans un état cohérent (version finale active). Garder le fichier pour la traçabilité. |

---

## 📋 Migrations actives (à utiliser sur une nouvelle base)

> Sur une nouvelle base vide, exécuter **toutes** les migrations dans l'ordre alphabétique/chronologique. Les migrations "obsolètes" ci-dessus sont des étapes intermédiaires mais ne cassent pas la DB — elles sont surchargées par les migrations suivantes.

| Fichier | Description |
|---|---|
| `20260411000017_create_charges_fixes.sql` | Table `charges_fixes` |
| `20260411000018_create_dettes_proprio.sql` | Table `dettes_proprio` |
| `20260417_local_id_and_client_id.sql` | Colonne `local_id` (idempotence offline) + `client_id` dans `transactions` |
| `20260417_process_sale_rpc.sql` | RPC `process_sale` v1 (surchargée par v2) |
| `20260419_activity_events_triggers.sql` | Triggers pour `activity_events` |
| `20260419_boutique_objectifs.sql` | Colonne `objectifs` sur `boutiques` |
| `20260419_create_activity_events.sql` | Table `activity_events` |
| `20260420_categories_produits.sql` | Table `categories_produits` |
| `20260420_create_inventaires.sql` | Table `inventaires` |
| `20260420_employe_invite_code.sql` | Colonne `invite_code` sur `employes` |
| `20260420_process_sale_v2.sql` | RPC `process_sale_v2` (version de base, surchargée) |
| `20260420_process_sale_v2_employe.sql` | RPC `process_sale_v2` avec `p_employe_id` (version finale active) |
| `20260425_mafro_v4_roles_and_extensions.sql` | MAFRO v4 — enum `user_role`, extensions `boutiques`/`employes`, table `mafro_admins`, helpers RLS | PR feat(db): MAFRO v4 |
| `20260425_mafro_v4_b2b_retraits_crm.sql` | MAFRO v4 — tables B2B (`commandes_b2b`, `livraisons`), `retraits_clients`, `clients_crm`, RPCs | PR feat(db): MAFRO v4 |
| `20260425_mafro_v4_audit_pertes_rls.sql` | MAFRO v4 — `pertes_declarations`, `cloture_caisse_jour`, `transferts_stock`, vues matérialisées, RLS complet | PR feat(db): MAFRO v4 |

---

## 📝 Convention pour les nouvelles migrations

Toute nouvelle migration doit ajouter une ligne dans ce tableau avec :
- Date au format `YYYYMMDD`
- Description courte
- Lien PR (ex: `#96`)

Exemple :
```
| `20260426_add_slug_boutiques.sql` | Colonne `slug` sur `boutiques` pour catalogue public | PR #97 |
```
