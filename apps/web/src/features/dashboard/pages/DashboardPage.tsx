import { useAuthStore } from '../../auth/store';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
      <p className="mt-2 text-muted">
        Welcome{user?.name ? `, ${user.name}` : ''}. Progress tracking and the sheet arrive in later
        milestones.
      </p>
    </section>
  );
}
