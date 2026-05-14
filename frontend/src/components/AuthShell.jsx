import { Link } from "react-router-dom";

export default function AuthShell({ title, subtitle, switchText, switchTo, switchLabel, children }) {
  return (
    <main className="min-h-screen bg-sage text-ink">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="hidden bg-moss px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-app border border-white/20 bg-white/10 text-sm font-black">
              LA
            </div>
            <div>
              <p className="text-lg font-black leading-none">Life Admin OS</p>
              <p className="mt-1 text-sm text-white/65">Personal operations dashboard</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-white/60">Personal Admin System</p>
            <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight">
              One protected home for bills, subscriptions, documents, and reminders.
            </h1>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {["Secure login", "Smart reminders", "Document vault"].map((item) => (
                <div key={item} className="rounded-app border border-white/15 bg-white/10 p-4 text-sm font-bold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md rounded-app border border-black/10 bg-white p-6 shadow-soft sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-black uppercase text-teal">Life Admin OS</p>
              <h2 className="mt-2 text-3xl font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-black/60">{subtitle}</p>
            </div>

            {children}

            <p className="mt-6 text-center text-sm text-black/60">
              {switchText}{" "}
              <Link className="font-black text-teal hover:text-moss" to={switchTo}>
                {switchLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
