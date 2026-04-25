# 🧹 Cleanup Audit — xa-saas

> Generated: 2026-04-25T20:09:46Z
> Scope: scan complet du repo. **Aucune suppression effectuée.** Ce document liste les candidats à suppression pour validation manuelle.

## 📊 Résumé

| Catégorie | Items détectés | Taille estimée |
|---|---|---|
| Fichiers TS/TSX orphelins | 22 | ~210 KB |
| Routes API mortes | 0 | — |
| Classes CSS orphelines | 3 | ~20 lignes |
| Exports inutilisés | 2 | — |
| Migrations SQL potentiellement obsolètes | 2 | — |
| Types dupliqués | 3 | — |
| Composants candidats à fusion | 3 groupes | — |

---

## 1. 📁 Fichiers TS/TSX orphelins

Fichiers présents dans le repo mais **jamais importés** dans un chemin actif vers une page ou route. L'analyse détecte les imports directs ; les fichiers marqués comme orphelins n'ont aucun consommateur actif.

### 🗂️ Cluster caisse racine (`features/caisse/`)

Ces trois fichiers forment un cluster cohérent : `CaissePos.tsx` importe `Panier` et `TicketCaisse`, mais `CaissePos.tsx` lui-même n'est importé par aucune page. L'app utilise exclusivement `features/caisse/v3/CaisseV3.tsx`.

- [ ] `features/caisse/CaissePos.tsx` — non importé par aucune page. Remplacé par `features/caisse/v3/CaisseV3.tsx`. **~28 KB / 767 lignes**
- [ ] `features/caisse/Panier.tsx` — importé uniquement par `features/caisse/CaissePos.tsx` (lui-même orphelin). **~7 KB / 199 lignes**
- [ ] `features/caisse/TicketCaisse.tsx` — importé uniquement par `features/caisse/CaissePos.tsx` (lui-même orphelin). **~6 KB / 166 lignes**

### 🗂️ Cluster caisse legacy (`features/caisse/legacy/`)

Explicitement marqué `// @deprecated - v3 replaces this. Kept for rollback.`. Aucun fichier en dehors du dossier `legacy/` ne les importe.

- [ ] `features/caisse/legacy/CaissePos.tsx` — `@deprecated`, jamais importé. Rollback à v3 inutile puisque v3 est stable. **~28 KB / 768 lignes**
- [ ] `features/caisse/legacy/Panier.tsx` — importé uniquement par `legacy/CaissePos.tsx` (lui-même orphelin). **~7 KB / 200 lignes**
- [ ] `features/caisse/legacy/TicketCaisse.tsx` — importé uniquement par `legacy/CaissePos.tsx` (lui-même orphelin). **~6 KB / 167 lignes**

### 🗂️ Dashboard — ancienne approche monolithique

La nouvelle approche dashboard utilise les composants modulaires dans `components/dashboard/home/` et `components/dashboard/shell/`. Les deux fichiers ci-dessous sont des vestiges de l'ancienne architecture.

- [ ] `features/dashboard/DashboardHome.tsx` — non importé par aucune page. Remplacé par les composants `components/dashboard/home/`. **~44 KB / 1097 lignes**
- [ ] `features/dashboard/DashboardCharts.tsx` — non importé par aucune page. Les graphiques sont désormais dans `components/dashboard/home/RevenueChart.tsx`, etc. **~15 KB / 431 lignes**

### 🗂️ Rapports — composants abandonnés

- [ ] `features/rapports/TransactionFlux.tsx` — non importé. Aucun remplacement identifié. **~2 KB / 61 lignes**
- [ ] `features/rapports/WeeklyChart.tsx` — non importé. Remplacé par `components/dashboard/home/RevenueChart.tsx`. **~16 KB / 450 lignes**

### 🗂️ Composants dashboard non utilisés

- [ ] `components/dashboard/home/StaffCard.tsx` — non importé nulle part (ni dans `KPIGrid`, ni dans le shell). **~1 KB / 38 lignes**
- [ ] `components/dashboard/shell/LeftColumnPlaceholder.tsx` — non importé. Probablement une ancienne implémentation du skeleton remplacée par `LeftColumnSkeleton.tsx`. **~2 KB / 98 lignes**
- [ ] `components/dashboard/shell/RightColumnPlaceholder.tsx` — non importé. Remplacé par `RightColumnSkeleton.tsx`. **~1 KB / 56 lignes**
- [ ] `components/dashboard/shell/TopBar.tsx` — non importé. Remplacé par `DashboardTopbar.tsx`. **~2 KB / 78 lignes**

### 🗂️ Layout — ancienne navigation non utilisée

Ces composants de layout semblent dater d'une architecture pré-route-groups. L'app utilise désormais les layouts Next.js (`app/(proprio)/dashboard/layout.tsx`, `app/(employe)/layout.tsx`).

- [ ] `components/layout/MobileNav.tsx` — non importé. **~3 KB / 81 lignes**
- [ ] `components/layout/Sidebar.tsx` — non importé. Remplacé par le layout Next.js + `components/dashboard/shell/DashboardShell.tsx`. **~21 KB / 512 lignes**
- [ ] `components/layout/Topbar.tsx` — non importé. Remplacé par `components/dashboard/shell/DashboardTopbar.tsx`. **~6 KB / 168 lignes**

### 🗂️ UI — composant non utilisé

- [ ] `components/ui/BoutiqueCard.tsx` — non importé. **~2 KB / 79 lignes**

### 🗂️ Lib — helpers orphelins

- [ ] `lib/supabase/createTransfert.ts` — non importé. Les transferts sont créés directement dans `app/api/transferts/route.ts`. **~0.9 KB / 33 lignes**
- [ ] `lib/supabase/getCategories.ts` — non importé. Les catégories sont récupérées via l'API `/api/categories` côté client, ou via `lib/supabase/dashboard/categories.ts` côté serveur. **~0.6 KB / 17 lignes**
- [ ] `lib/supabase/getDailyStats.ts` — non importé. Les stats quotidiennes sont calculées dans les routes dashboard via les helpers `lib/supabase/dashboard/kpis.ts` et `lib/supabase/dashboard/revenue.ts`. **~1 KB / 34 lignes**
- [ ] `lib/supabase/getSalesByCategory.ts` — importé uniquement depuis `features/dashboard/DashboardHome.tsx` (lui-même orphelin). **~2 KB / 89 lignes**

### ⚠️ Candidat à surveiller (non orphelin, à vérifier)

- `lib/requireCaisseSession.ts` — **non importé** par aucune route API active. Les routes caisse vérifient la session manuellement ou via `lib/caisseSession.ts`. Ce module semble prévu comme helper mais jamais branché. À ne pas supprimer sans vérification car peut être utilisé dans une prochaine PR. **~4 KB / ~70 lignes**

---

## 2. 🛣️ Routes API mortes

✅ **Aucune route API morte détectée.** Toutes les routes `app/api/**/route.ts` ont au moins un appel `fetch('/api/...')` correspondant dans le code frontend :

| Route | Appels détectés |
|---|---|
| `POST /api/caisse/vente` | `features/caisse/v3/CaisseV3.tsx` |
| `DELETE /api/caisse/session` | `features/caisse/v3/CaisseV3.tsx` |
| `POST /api/caisse/verify-pin` | `features/caisse/v3/CaisseV3.tsx` |
| `GET /api/categories` | plusieurs composants |
| `GET/POST /api/clients` | `features/clients/ClientsPage.tsx` |
| `GET /api/cloture-caisse` | `features/cloture/ClotureCaissePage.tsx` |
| `GET /api/notifications` | `context/NotifContext.tsx` |
| `GET/POST /api/produits` | multiple |
| `GET/POST /api/transactions` | multiple |
| `GET/POST /api/transferts` | `features/transferts/TransfertsPage.tsx` |
| `GET/POST /api/dettes` | `features/dettes/DettesPage.tsx` |
| `GET/POST /api/employes` | `features/equipe/EquipeView.tsx` |
| `GET /api/top-produits` | `features/rapports/TopProduitsPage.tsx` |
| `GET /api/rapports` | `features/rapports/RapportsPage.tsx` |
| `GET /api/activite/export` | `features/activite/ActivityJournalPage.tsx` |
| `GET/POST /api/charges-fixes` | `features/charges/ChargesFixesPage.tsx` |
| `GET/POST /api/dettes-proprio` | `features/dettes/MesDettesPage.tsx` |
| `GET/POST /api/fournisseurs` | `features/fournisseurs/FournisseursPage.tsx` |
| `GET/POST /api/inventaires` | `features/inventaire/InventairesHome.tsx` |
| `POST /api/employe/verify-pin` | `features/employe/EmployeLockScreenClient.tsx` |
| `DELETE /api/employe/session` | `features/employe/LogoutButton.tsx` |

> **Note :** La route `/api/caisse/session` (DELETE) est aussi appelée depuis `features/caisse/legacy/CaissePos.tsx` et `features/caisse/CaissePos.tsx` (tous deux orphelins). Elle reste néanmoins active car `features/caisse/v3/CaisseV3.tsx` l'appelle aussi.

---

## 3. 🎨 Classes CSS orphelines

> ⚠️ **Certains usages dynamiques peuvent ne pas être détectés** : les classes générées via des template literals (`` `c-cart${collapsed ? ' collapsed' : ''}` ``) ont été prises en compte par une recherche par sous-chaîne. Malgré cela, 3 classes semblent réellement inutilisées.

### `features/caisse/v3/caisse-v3.css`

- [ ] `.c-inv-actions` (lignes 1159–1166 + 1341) — Aucun `className="c-inv-actions"` dans les fichiers TSX. `InvoiceModal.tsx` utilise les boutons `.c-inv-btn` directement sans wrapper `.c-inv-actions`. Représente ~12 lignes de CSS.
- [ ] `.font-display` (ligne 48) — helper classe de typographie jamais appliquée dans les composants JSX. Remplacée par les variables CSS `var(--font-display)`.
- [ ] `.font-body` (ligne 50) — même situation que `.font-display`.

> **Classes dynamiques confirmées actives** : `.c-cart`, `.c-product-card`, `.c-pay-btn`, `.c-action-btn`, `.c-tab`, `.c-toast`, `.c-remise-preset`, `.c-rendu-pill`, etc. sont toutes utilisées via template literals ou concaténation de chaînes.

---

## 4. 📤 Exports inutilisés

Exports nommés dont **aucun import** n'a été trouvé dans l'ensemble du repo.

- [ ] `export function calcMonnaie()` dans `lib/format.ts` — aucun consommateur. `calcMonnaie` calcule la monnaie rendue (reçu - total) ; cette logique est reproduite inline dans `features/caisse/v3/EncaissModal.tsx`. **Risque faible : supprimer.**
- [ ] `export function requireCaisseSession()` dans `lib/requireCaisseSession.ts` + le type `CaisseSessionContext` — la fonction n'est appelée par aucune route API. La validation de session caisse est faite inline dans chaque handler via `lib/caisseSession.ts`. **Risque modéré : vérifier qu'aucune PR en cours ne l'utilise avant suppression.**

---

## 5. 🗄️ Migrations SQL potentiellement obsolètes

⚠️ **NE PAS supprimer** sans vérifier la cohérence avec la base de production. Ces migrations sont exécutées séquentiellement par Supabase CLI. Elles ne peuvent pas être supprimées du repo si elles ont déjà été appliquées en production (supprimer le fichier n'annule pas la migration). Ceci est purement **informatif**.

- [ ] `supabase/migrations/20260417_process_sale_rpc.sql` — crée la fonction RPC `process_sale` (v1). **Jamais appelée** depuis le code application ; seul `process_sale_v2` est utilisé (`app/api/caisse/vente/route.ts:96`). La fonction existe en DB mais n'est plus invoquée. Elle peut être droppée via une nouvelle migration `DROP FUNCTION process_sale(...)` si confirmation que la v1 n'est plus utilisée.

- [ ] `supabase/migrations/20260420_process_sale_v2.sql` — crée `process_sale_v2` avec les paramètres de base. **Immédiatement remplacée** par `20260420_process_sale_v2_employe.sql` (même date, même fonction recréée avec `p_employe_id`). Ces deux migrations auraient pu être fusionnées en une seule. Le fichier `20260420_process_sale_v2.sql` est donc rendu caduc par le fichier suivant. La DB est dans un état cohérent (la version finale est active), mais l'historique de migrations contient une étape intermédiaire inutile.

---

## 6. 🔁 Types dupliqués

Les doublons ci-dessous existent principalement dans les fichiers orphelins. Ils seront résolus automatiquement lors de la suppression de ceux-ci.

- [ ] `PayMode` défini dans :
  - `features/caisse/Panier.tsx` (orphelin) : `'especes' | 'momo' | 'carte' | 'credit'`
  - `features/caisse/legacy/Panier.tsx` (orphelin) : `'especes' | 'momo' | 'carte' | 'credit'`
  - `features/caisse/v3/PaymentSection.tsx` (**actif**) : `'especes' | 'momo' | 'credit'` ← **légère divergence** (pas de `'carte'`)
  
  > À surveiller : si `'carte'` doit être supporté à l'avenir, utiliser la définition dans `PaymentSection.tsx` comme source de vérité.

- [ ] `CartItem` défini dans :
  - `features/caisse/Panier.tsx` (orphelin)
  - `features/caisse/legacy/Panier.tsx` (orphelin)
  - `features/caisse/v3/useCart.ts` (**actif**) ← source de vérité

- [ ] `ResumeTransaction` défini dans :
  - `features/caisse/CaissePos.tsx` (orphelin)
  - `features/caisse/legacy/CaissePos.tsx` (orphelin)
  
  Ces deux définitions sont identiques ; elles disparaîtront avec la suppression des fichiers orphelins.

---

## 7. 🔀 Composants candidats à fusion

### Groupe 1 — POS Caisse (3 versions)

| Fichier | Statut | Lignes |
|---|---|---|
| `features/caisse/legacy/CaissePos.tsx` | ❌ Orphelin, `@deprecated` | 768 |
| `features/caisse/CaissePos.tsx` | ❌ Orphelin (root, sans marqueur) | 767 |
| `features/caisse/v3/CaisseV3.tsx` | ✅ Actif (utilisé par `app/(proprio)/dashboard/caisse/page.tsx`) | ~350 |

**Recommandation :** Supprimer `legacy/CaissePos.tsx` et `CaissePos.tsx` (root). Conserver et renommer `v3/CaisseV3.tsx` en `CaissePos.tsx` lors d'une prochaine refonte si souhaité.

### Groupe 2 — Composant Panier (2 versions)

| Fichier | Statut | Lignes |
|---|---|---|
| `features/caisse/legacy/Panier.tsx` | ❌ Orphelin | 200 |
| `features/caisse/Panier.tsx` | ❌ Orphelin (root) | 199 |

**Recommandation :** Supprimer les deux. Le panier v3 est géré par `features/caisse/v3/CartPanel.tsx` + `features/caisse/v3/useCart.ts`.

### Groupe 3 — TicketCaisse / InvoiceModal (2 versions)

| Fichier | Statut | Lignes |
|---|---|---|
| `features/caisse/legacy/TicketCaisse.tsx` | ❌ Orphelin | 167 |
| `features/caisse/TicketCaisse.tsx` | ❌ Orphelin (root) | 166 |

**Recommandation :** Supprimer les deux. La v3 utilise `features/caisse/v3/InvoiceModal.tsx` pour le rendu de ticket/facture.

---

## ✅ Comment utiliser ce rapport

1. **Vérifier** chaque item marqué `[ ]` — cocher `[x]` si vous décidez de conserver le fichier.
2. **Pour la section 1 (fichiers orphelins)** : supprimer les fichiers entiers. Commencer par les clusters (caisse root, caisse legacy) pour éviter les erreurs de compilation intermédiaires.
3. **Pour la section 3 (CSS)** : supprimer les règles directement dans `features/caisse/v3/caisse-v3.css`.
4. **Pour la section 4 (exports)** : supprimer la fonction `calcMonnaie` de `lib/format.ts` et vérifier que le build passe.
5. **Pour les migrations SQL** : ne rien supprimer du repo — ouvrir éventuellement une migration `DROP FUNCTION process_sale(...)` séparée.
6. Une fois validé, ouvrir une PR `chore: dead code cleanup` qui supprime tout en un seul commit reviewable.
7. Vérifier que `npm run build` et `npm run lint` passent toujours après suppression.

> **Rappel :** Aucun fichier n'a été supprimé dans cette PR. Ce rapport est purement informatif.
