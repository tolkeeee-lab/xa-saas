import { getEmployeSession } from '@/lib/employe-session';
import EmployeTopbar from '@/features/employe/EmployeTopbar';

export default async function EmployeLayout({ children }: { children: React.ReactNode }) {
  // Read session — DO NOT redirect here; middleware and individual pages handle that.
  // The lock screen (/caisse/lock) is inside this group and has no session.
  const session = await getEmployeSession();

  if (!session) {
    // Render a bare shell for the lock screen (no topbar)
    return (
      <div className="employe-shell">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="employe-shell">
      <EmployeTopbar session={session} />
      <main className="employe-main">{children}</main>
    </div>
  );
}
