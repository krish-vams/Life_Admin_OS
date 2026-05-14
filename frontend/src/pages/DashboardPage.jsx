import { useAuth } from "../state/AuthContext.jsx";

function formatDate(value) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const profileRows = [
    { label: "Name", value: user?.name },
    { label: "Email", value: user?.email },
    { label: "Account created", value: formatDate(user?.createdAt) }
  ];

  return (
    <main className="min-h-screen bg-sage text-ink">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-app bg-moss text-sm font-black text-white">
              LA
            </div>
            <div>
              <p className="text-base font-black leading-none">Life Admin OS</p>
              <p className="mt-1 text-xs font-bold uppercase text-black/50">Protected Dashboard</p>
            </div>
          </div>

          <button
            className="h-10 rounded-app border border-black/10 bg-white px-4 text-sm font-black text-ink transition hover:border-moss hover:bg-moss hover:text-white"
            onClick={logout}
            type="button"
          >
            Log Out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-7">
          <p className="text-sm font-black uppercase text-teal">Phase 1</p>
          <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">Dashboard foundation</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-black/60">
            Authentication is active. This protected page is ready for the next phase of bills,
            subscriptions, documents, and reminder modules.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-black/45">Next Build Areas</p>
                <h2 className="mt-1 text-2xl font-black">Life-admin modules</h2>
              </div>
              <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">Ready</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Bills", "Track due dates, payment status, and payment amounts."],
                ["Subscriptions", "Monitor renewals and recurring monthly spend."],
                ["Documents", "Store expiration dates for IDs, policies, and records."],
                ["Reminders", "Create notification rules before important dates."]
              ].map(([title, description]) => (
                <article key={title} className="rounded-app border border-black/10 bg-sage p-4">
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/60">{description}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase text-black/45">Profile</p>
            <div className="mt-4 grid gap-3">
              {profileRows.map((row) => (
                <div key={row.label} className="rounded-app border border-black/10 bg-sage p-4">
                  <p className="text-xs font-black uppercase text-black/45">{row.label}</p>
                  <p className="mt-1 break-words font-bold">{row.value}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

