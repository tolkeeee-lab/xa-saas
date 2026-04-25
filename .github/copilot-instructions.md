# Instructions pour Copilot Coding Agent — xa-saas

Ces règles s'appliquent à **toutes** les PRs créées par Copilot dans ce repo.

## 🧹 Règle d'or : suppression du code remplacé

Quand tu introduis un nouveau composant, route, hook, helper, ou type qui **remplace** une version existante :

1. **Supprime** systématiquement l'ancien fichier dans la même PR.
2. **Mets à jour** tous les imports qui pointaient vers l'ancien.
3. **Liste** explicitement les suppressions dans la description de la PR sous une section :

   ```markdown
   ## 🗑️ Files removed
   - `features/old-component.tsx` — replaced by `features/new-component.tsx`
   - `app/api/old-route/route.ts` — no longer needed since X
   - `.foo-class` in `styles.css` — unused after refactor
   ```

4. **Vérifie** qu'aucune classe CSS, fonction utilitaire, ou type associé à l'ancien code n'est laissé orphelin.

## 🚫 Ne JAMAIS faire

- Créer un fichier `*-v2.tsx`, `*-old.tsx`, `*-legacy.tsx` à côté de l'existant. Toujours **remplacer en place**.
- Garder un export "au cas où". Si pas utilisé → supprimer.
- Dupliquer un type/interface — toujours utiliser ou étendre depuis `types/database.ts` ou `types/*.ts`.
- Ajouter une migration SQL qui annule une migration précédente. Préférer modifier la migration cible si elle n'est pas encore en prod.

## 🎨 Conventions CSS

- Tous les styles spécifiques à un module sont scopés via `.xa-{module}` (ex: `.xa-caisse-v3`).
- Avant d'ajouter une classe, vérifier qu'elle n'existe pas déjà dans le même fichier.
- Quand un composant est supprimé, supprimer **toutes** ses classes CSS dans le fichier `.css` associé.

## 🗄️ Conventions Supabase

- Toujours utiliser le client typé (`Database` import depuis `types/database.ts`).
- Pour les payloads `update()`, utiliser `Partial<Omit<Table, 'id' | 'proprietaire_id' | 'created_at'>>`, **jamais** `Record<string, unknown>`.
- Toute nouvelle migration doit ajouter une entrée dans `supabase/migrations/README.md` (date + description courte + lien PR).

## 📱 Mobile-first

- Tout nouveau composant UI doit être testé d'abord sur viewport 375×667 (iPhone SE).
- Pas de bottom-sheet qui couvre 100% de l'écran sans backdrop cliquable pour fermer.
- Les boutons primaires (encaisser, valider, payer) doivent **toujours** être atteignables sans scroll caché.

## 🔁 Avant de PR

- [ ] `npm run build` passe
- [ ] `npm run lint` passe
- [ ] `npm run type-check` passe (si configuré)
- [ ] Section "🗑️ Files removed" présente si applicable
- [ ] Aucun `console.log` oublié
- [ ] Aucun `TODO` non daté
