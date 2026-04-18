/**
 * Terminal identity management.
 *
 * Each POS browser instance generates a stable random UUID and persists it in
 * localStorage under the key `xa_terminal_id`.  This ID is sent with every
 * PIN verification so the server can track which devices access each boutique's
 * caisse.
 *
 * The ID persists across page reloads and browser restarts but is cleared if
 * the user explicitly wipes localStorage (e.g. "Clear site data").  In that
 * case a new ID is generated on the next verification, and the old terminal
 * record in the DB becomes a stale entry (still safe — it just stops receiving
 * `last_seen_at` updates).
 */

const TERMINAL_ID_KEY = 'xa_terminal_id';

/**
 * Returns the stable terminal ID for the current browser, creating one if
 * none exists yet.  Returns `null` during SSR (no `window`).
 */
export function getOrCreateTerminalId(): string | null {
  if (typeof window === 'undefined') return null;

  let id = localStorage.getItem(TERMINAL_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(TERMINAL_ID_KEY, id);
  }
  return id;
}
