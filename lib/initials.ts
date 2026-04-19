/**
 * Compute a 1–2 character initials string from a full name or email.
 * Falls back to 'XA' if no suitable characters are found.
 */
export function computeInitials(nameOrEmail: string): string {
  return (
    nameOrEmail
      .split(' ')
      .filter((part) => part.trim().length > 0)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'XA'
  );
}
