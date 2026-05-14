import AppShell from "../components/AppShell.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { formatDateTime } from "../utils/lifeAdmin.js";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppShell
      eyebrow="Settings"
      title="Account settings"
      subtitle="Review the basic profile information connected to this Life Admin OS account."
    >
      <section className="max-w-2xl rounded-app border border-black/10 bg-white p-5 shadow-soft">
        <div className="grid gap-3">
          {[
            ["Name", user?.name],
            ["Email", user?.email],
            ["Account created", formatDateTime(user?.createdAt)]
          ].map(([label, value]) => (
            <div className="rounded-app border border-black/10 bg-sage p-4" key={label}>
              <p className="text-xs font-black uppercase text-black/45">{label}</p>
              <p className="mt-1 break-words font-bold">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

