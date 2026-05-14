import { NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

const navItems = [
  ["/dashboard", "Dashboard"],
  ["/analytics", "Analytics"],
  ["/bills", "Bills"],
  ["/subscriptions", "Subscriptions"],
  ["/documents", "Documents"],
  ["/settings", "Settings"]
];

export default function AppShell({ eyebrow, title, subtitle, children }) {
  const { logout } = useAuth();

  return (
    <main className="min-h-screen bg-sage text-ink">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-app bg-moss text-sm font-black text-white">
              LA
            </div>
            <div>
              <p className="text-base font-black leading-none">Life Admin OS</p>
              <p className="mt-1 text-xs font-bold uppercase text-black/50">{eyebrow}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex overflow-x-auto rounded-app border border-black/10 bg-sage p-1">
              {navItems.map(([to, label]) => (
                <NavLink
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-app px-3 py-2 text-sm font-black transition ${
                      isActive ? "bg-moss text-white" : "text-black/60 hover:text-ink"
                    }`
                  }
                  key={to}
                  to={to}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <button
              className="h-10 rounded-app border border-black/10 bg-white px-4 text-sm font-black text-ink transition hover:border-moss hover:bg-moss hover:text-white"
              onClick={logout}
              type="button"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-7">
          <p className="text-sm font-black uppercase text-teal">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-3xl text-base leading-7 text-black/60">{subtitle}</p> : null}
        </div>
        {children}
      </section>
    </main>
  );
}
