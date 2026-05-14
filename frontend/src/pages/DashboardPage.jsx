import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import useLifeAdminData from "../hooks/useLifeAdminData.js";
import { useAuth } from "../state/AuthContext.jsx";
import {
  daysUntil,
  formatCurrency,
  formatDate,
  monthlySubscriptionAmount,
  readableStatus,
  relativeDateLabel
} from "../utils/lifeAdmin.js";

function SummaryCard({ label, value, note }) {
  return (
    <article className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
      <p className="text-sm font-black uppercase text-black/45">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      {note ? <p className="mt-2 text-sm font-semibold text-black/55">{note}</p> : null}
    </article>
  );
}

function Panel({ title, actionTo, actionLabel, children }) {
  return (
    <section className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-xl font-black">{title}</h2>
        {actionTo ? (
          <Link className="rounded-app bg-moss px-3 py-2 text-xs font-black text-white" to={actionTo}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyPanel({ children }) {
  return <p className="rounded-app border border-dashed border-black/15 bg-sage p-4 text-sm font-bold text-black/55">{children}</p>;
}

function StatusBadge({ children, tone = "neutral" }) {
  const classes = {
    neutral: "bg-white text-black/60",
    good: "bg-teal/10 text-teal",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-coral/10 text-coral"
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${classes[tone]}`}>{children}</span>;
}

function CostBar({ label, value, max }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-sm font-black">
        <span>{label}</span>
        <span>{formatCurrency(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-sage">
        <div className="h-full rounded-full bg-teal" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { token } = useAuth();
  const {
    bills,
    subscriptions,
    documents,
    notifications,
    isLoading,
    error,
    summary,
    updateNotificationStatus
  } = useLifeAdminData(token);

  const upcomingBills = bills
    .filter((bill) => bill.status !== "paid")
    .filter((bill) => {
      const days = daysUntil(bill.dueDate);
      return days >= 0 && days <= 14;
    })
    .slice(0, 5);

  const upcomingRenewals = subscriptions
    .filter((subscription) => subscription.status === "active")
    .filter((subscription) => {
      const days = daysUntil(subscription.nextRenewalDate);
      return days >= 0 && days <= 30;
    })
    .slice(0, 5);

  const expiringDocuments = documents
    .filter((document) => document.status === "expiring_soon" || document.status === "expired")
    .slice(0, 5);

  const activeNotifications = notifications
    .filter((notification) => notification.status !== "dismissed")
    .slice(0, 8);

  const chartRows = subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => ({
      label: subscription.name,
      value: monthlySubscriptionAmount(subscription)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const maxCost = Math.max(...chartRows.map((row) => row.value), 0);

  return (
    <AppShell
      eyebrow="Operations Dashboard"
      title="Upcoming responsibilities"
      subtitle="Scan bills, renewals, document expiries, and alerts from one focused dashboard."
    >
      {error ? (
        <div className="mb-5 rounded-app border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
          {error}
        </div>
      ) : null}

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total subscriptions" value={summary.totalSubscriptions} />
        <SummaryCard label="Monthly subscription cost" value={formatCurrency(summary.monthlySubscriptionCost)} />
        <SummaryCard label="Upcoming bills" value={summary.upcomingBills} note="Due in the next 14 days" />
        <SummaryCard label="Documents expiring soon" value={summary.documentsExpiringSoon} note="Within 30 days" />
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Notifications">
          {isLoading ? (
            <EmptyPanel>Loading alerts...</EmptyPanel>
          ) : activeNotifications.length === 0 ? (
            <EmptyPanel>No urgent notifications right now.</EmptyPanel>
          ) : (
            <div className="grid gap-3">
              {activeNotifications.map((notification) => (
                <div
                  className={`rounded-app p-4 ${
                    notification.status === "unread" ? "bg-sage" : "border border-black/10 bg-white"
                  }`}
                  key={notification.id}
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{notification.title}</h3>
                        <StatusBadge tone={notification.status === "unread" ? "warn" : "neutral"}>
                          {readableStatus(notification.status)}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-sm font-bold text-black/70">{notification.message}</p>
                      <p className="mt-1 text-xs font-black uppercase text-black/45">
                        Scheduled {formatDate(notification.scheduledFor)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {notification.status === "unread" ? (
                        <button
                          className="h-9 rounded-app border border-black/10 bg-white px-3 text-xs font-black"
                          onClick={() => updateNotificationStatus(notification.id, "read")}
                          type="button"
                        >
                          Mark Read
                        </button>
                      ) : null}
                      <button
                        className="h-9 rounded-app border border-coral/20 bg-coral/10 px-3 text-xs font-black text-coral"
                        onClick={() => updateNotificationStatus(notification.id, "dismissed")}
                        type="button"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Subscription Cost Snapshot" actionTo="/subscriptions" actionLabel="Manage">
          {chartRows.length === 0 ? (
            <EmptyPanel>No active subscriptions to chart yet.</EmptyPanel>
          ) : (
            <div className="grid gap-4">
              {chartRows.map((row) => (
                <CostBar key={row.label} label={row.label} max={maxCost} value={row.value} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Upcoming Bills" actionTo="/bills" actionLabel="Manage">
          {isLoading ? (
            <EmptyPanel>Loading bills...</EmptyPanel>
          ) : upcomingBills.length === 0 ? (
            <EmptyPanel>No bills due in the next 14 days.</EmptyPanel>
          ) : (
            <div className="grid gap-3">
              {upcomingBills.map((bill) => (
                <article className="rounded-app bg-sage p-4" key={bill.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{bill.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-black/60">
                        Due {relativeDateLabel(bill.dueDate)} | {formatDate(bill.dueDate)}
                      </p>
                    </div>
                    <p className="font-black">{formatCurrency(bill.amount)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Upcoming Renewals" actionTo="/subscriptions" actionLabel="Manage">
          {isLoading ? (
            <EmptyPanel>Loading renewals...</EmptyPanel>
          ) : upcomingRenewals.length === 0 ? (
            <EmptyPanel>No subscription renewals in the next 30 days.</EmptyPanel>
          ) : (
            <div className="grid gap-3">
              {upcomingRenewals.map((subscription) => (
                <article className="rounded-app bg-sage p-4" key={subscription.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{subscription.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-black/60">
                        Renews {relativeDateLabel(subscription.nextRenewalDate, "tomorrow")}
                      </p>
                    </div>
                    <p className="font-black">{formatCurrency(subscription.amount)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Expiring Documents" actionTo="/documents" actionLabel="Manage">
          {isLoading ? (
            <EmptyPanel>Loading documents...</EmptyPanel>
          ) : expiringDocuments.length === 0 ? (
            <EmptyPanel>No documents expiring within 30 days.</EmptyPanel>
          ) : (
            <div className="grid gap-3">
              {expiringDocuments.map((document) => (
                <article className="rounded-app bg-sage p-4" key={document.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{document.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-black/60">
                        {document.documentType} | {relativeDateLabel(document.expiryDate)}
                      </p>
                    </div>
                    <StatusBadge tone={document.status === "expired" ? "danger" : "warn"}>
                      {readableStatus(document.status)}
                    </StatusBadge>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
