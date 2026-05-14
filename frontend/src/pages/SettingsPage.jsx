import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import AppShell from "../components/AppShell.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { formatCurrency, formatDate, formatDateTime, readableStatus } from "../utils/lifeAdmin.js";

function Field({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-black text-black/70">
      <span>{label}</span>
      <input
        className="h-10 rounded-app border border-black/10 bg-white px-3 text-sm font-semibold outline-none focus:border-teal focus:ring-4 focus:ring-teal/15"
        {...props}
      />
    </label>
  );
}

export default function SettingsPage() {
  const { token, user } = useAuth();
  const [gmailStatus, setGmailStatus] = useState({ connected: false, connection: null });
  const [detectedItems, setDetectedItems] = useState([]);
  const [edits, setEdits] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setIsLoading(true);
      setError("");

      try {
        const [gmailData, detectedData] = await Promise.all([
          apiRequest("/api/gmail/status", { token }),
          apiRequest("/api/detected-items", { token })
        ]);

        if (isMounted) {
          setGmailStatus(gmailData);
          setDetectedItems(detectedData.detectedItems);
          setEdits(
            Object.fromEntries(
              detectedData.detectedItems.map((item) => [
                item.id,
                {
                  name: item.name,
                  amount: item.amount || "",
                  suggestedDueDate: item.suggestedDueDate || item.detectedDate,
                  billingCycle: item.billingCycle || "monthly",
                  category: "Imported"
                }
              ])
            )
          );
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function updateEdit(id, field, value) {
    setEdits((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value
      }
    }));
  }

  async function connectGmail() {
    setError("");
    const data = await apiRequest("/api/gmail/auth-url", { token });
    window.location.href = data.url;
  }

  async function scanGmail() {
    setError("");
    setMessage("");

    try {
      await apiRequest("/api/gmail/scan", { method: "POST", token });
      setMessage("Email scan job queued. Refresh this page after the worker processes it.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function confirmItem(item) {
    setError("");

    try {
      const data = await apiRequest(`/api/detected-items/${item.id}/confirm`, {
        method: "POST",
        token,
        body: edits[item.id]
      });

      setDetectedItems((current) =>
        current.map((detectedItem) => (detectedItem.id === item.id ? data.detectedItem : detectedItem))
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function ignoreItem(item) {
    setError("");

    try {
      const data = await apiRequest(`/api/detected-items/${item.id}/ignore`, {
        method: "POST",
        token
      });

      setDetectedItems((current) =>
        current.map((detectedItem) => (detectedItem.id === item.id ? data.detectedItem : detectedItem))
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const pendingItems = detectedItems.filter((item) => item.status === "pending");

  return (
    <AppShell
      eyebrow="Settings"
      title="Account and integrations"
      subtitle="Review your profile, connect Gmail, queue scans, and approve detected bills or subscriptions."
    >
      {error ? (
        <div className="mb-5 rounded-app border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-5 rounded-app border border-teal/20 bg-teal/10 px-4 py-3 text-sm font-bold text-teal">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black">Profile</h2>
          <div className="mt-4 grid gap-3">
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

        <section className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h2 className="text-xl font-black">Gmail integration</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-black/60">
                Connect Gmail to scan recent emails for bills, subscriptions, receipts, and renewal notices.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="h-10 rounded-app bg-moss px-4 text-sm font-black text-white"
                onClick={connectGmail}
                type="button"
              >
                {gmailStatus.connected ? "Reconnect" : "Connect Gmail"}
              </button>
              <button
                className="h-10 rounded-app border border-black/10 bg-white px-4 text-sm font-black disabled:opacity-50"
                disabled={!gmailStatus.connected}
                onClick={scanGmail}
                type="button"
              >
                Scan Email
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-app bg-sage p-4 text-sm font-bold text-black/65">
            {gmailStatus.connected
              ? `Connected to ${gmailStatus.connection?.google_email || "Gmail"}`
              : "Gmail is not connected yet."}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-app border border-black/10 bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Detected items</h2>
            <p className="mt-2 text-sm font-semibold text-black/60">
              Confirm suggestions you trust, edit fields first when needed, or ignore false positives.
            </p>
          </div>
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">
            {pendingItems.length} pending
          </span>
        </div>

        {isLoading ? (
          <p className="rounded-app bg-sage p-4 text-sm font-bold text-black/60">Loading detected items...</p>
        ) : pendingItems.length === 0 ? (
          <p className="rounded-app border border-dashed border-black/15 bg-sage p-4 text-sm font-bold text-black/60">
            No pending detected items.
          </p>
        ) : (
          <div className="grid gap-4">
            {pendingItems.map((item) => (
              <article className="rounded-app border border-black/10 bg-sage p-4" key={item.id}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">{item.name}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-black/60">
                        {item.type}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black/60">
                        {Math.round(item.confidenceScore * 100)}% confidence
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-black/60">
                      Detected {formatDate(item.detectedDate)} | {formatCurrency(item.amount || 0)}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black/60">
                    {readableStatus(item.status)}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Field
                    label="Name"
                    onChange={(event) => updateEdit(item.id, "name", event.target.value)}
                    value={edits[item.id]?.name || ""}
                  />
                  <Field
                    label="Amount"
                    min="0"
                    onChange={(event) => updateEdit(item.id, "amount", event.target.value)}
                    step="0.01"
                    type="number"
                    value={edits[item.id]?.amount || ""}
                  />
                  <Field
                    label={item.type === "subscription" ? "Renewal date" : "Due date"}
                    onChange={(event) => updateEdit(item.id, "suggestedDueDate", event.target.value)}
                    type="date"
                    value={edits[item.id]?.suggestedDueDate || ""}
                  />
                  {item.type === "subscription" ? (
                    <label className="grid gap-2 text-sm font-black text-black/70">
                      <span>Billing cycle</span>
                      <select
                        className="h-10 rounded-app border border-black/10 bg-white px-3 text-sm font-semibold outline-none focus:border-teal focus:ring-4 focus:ring-teal/15"
                        onChange={(event) => updateEdit(item.id, "billingCycle", event.target.value)}
                        value={edits[item.id]?.billingCycle || "monthly"}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </label>
                  ) : null}
                  <Field
                    label="Category"
                    onChange={(event) => updateEdit(item.id, "category", event.target.value)}
                    value={edits[item.id]?.category || "Imported"}
                  />
                </div>

                {item.rawSnippet ? (
                  <p className="mt-4 rounded-app bg-white p-3 text-sm font-semibold leading-6 text-black/60">
                    {item.rawSnippet}
                  </p>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <button
                    className="h-10 rounded-app bg-moss px-4 text-sm font-black text-white"
                    onClick={() => confirmItem(item)}
                    type="button"
                  >
                    Confirm
                  </button>
                  <button
                    className="h-10 rounded-app border border-coral/20 bg-coral/10 px-4 text-sm font-black text-coral"
                    onClick={() => ignoreItem(item)}
                    type="button"
                  >
                    Ignore
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

