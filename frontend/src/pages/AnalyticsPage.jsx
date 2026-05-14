import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";
import AppShell from "../components/AppShell.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { formatCurrency, formatDate } from "../utils/lifeAdmin.js";

function MetricCard({ label, value, note }) {
  return (
    <article className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
      <p className="text-sm font-black uppercase text-black/45">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      {note ? <p className="mt-2 text-sm font-semibold text-black/55">{note}</p> : null}
    </article>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
      <h2 className="mb-5 text-xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return <p className="rounded-app border border-dashed border-black/15 bg-sage p-4 text-sm font-bold text-black/60">{children}</p>;
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      setIsLoading(true);
      setError("");

      try {
        const data = await apiRequest("/api/analytics/summary", { token });

        if (isMounted) {
          setAnalytics(data);
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

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const maxCategorySpend = useMemo(() => {
    if (!analytics?.categorySpending?.length) {
      return 0;
    }

    return Math.max(...analytics.categorySpending.map((item) => Number(item.monthlyTotal || 0)));
  }, [analytics]);

  return (
    <AppShell
      eyebrow="Phase 8 Analytics"
      title="Smart insights"
      subtitle="Understand recurring spending, upcoming payments, duplicate subscriptions, and renewal patterns."
    >
      {error ? (
        <div className="mb-5 rounded-app border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <EmptyState>Loading insights...</EmptyState>
      ) : (
        <>
          <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Monthly subscription total"
              value={formatCurrency(analytics.monthlySubscriptionTotal)}
              note="Estimated monthly recurring spend"
            />
            <MetricCard
              label="Next 7 days"
              value={formatCurrency(analytics.upcomingExpenseSummary.next7Days)}
              note="Expected bills and renewals"
            />
            <MetricCard
              label="Next 15 days"
              value={formatCurrency(analytics.upcomingExpenseSummary.next15Days)}
              note="Expected bills and renewals"
            />
            <MetricCard
              label="Next 30 days"
              value={formatCurrency(analytics.upcomingExpenseSummary.next30Days)}
              note="Expected bills and renewals"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <Panel title="Category-Based Subscription Spending">
              {analytics.categorySpending.length === 0 ? (
                <EmptyState>No active subscriptions to group yet.</EmptyState>
              ) : (
                <div className="grid gap-4">
                  {analytics.categorySpending.map((item) => {
                    const width =
                      maxCategorySpend > 0 ? Math.max(8, Math.round((item.monthlyTotal / maxCategorySpend) * 100)) : 0;

                    return (
                      <div key={item.category}>
                        <div className="mb-2 flex justify-between gap-3 text-sm font-black">
                          <span>{item.category}</span>
                          <span>{formatCurrency(item.monthlyTotal)}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-sage">
                          <div className="h-full rounded-full bg-teal" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel title="Duplicate Subscription Alerts">
              {analytics.duplicateSubscriptionAlerts.length === 0 ? (
                <EmptyState>No duplicate category alerts right now.</EmptyState>
              ) : (
                <div className="grid gap-3">
                  {analytics.duplicateSubscriptionAlerts.map((alert) => (
                    <article className="rounded-app bg-sage p-4" key={alert.category}>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{alert.category}</h3>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black/60">
                          {alert.count} subscriptions
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-black/65">{alert.message}</p>
                    </article>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <Panel title="Upcoming Expense Summary">
              <div className="grid gap-3">
                {[
                  ["Next 7 days", analytics.upcomingExpenseSummary.next7Days],
                  ["Next 15 days", analytics.upcomingExpenseSummary.next15Days],
                  ["Next 30 days", analytics.upcomingExpenseSummary.next30Days]
                ].map(([label, value]) => (
                  <div className="flex items-center justify-between rounded-app bg-sage p-4" key={label}>
                    <span className="text-sm font-black">{label}</span>
                    <span className="text-lg font-black">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Renewal Pattern Predictions">
              {analytics.renewalPredictions.length === 0 ? (
                <EmptyState>No active subscriptions to predict yet.</EmptyState>
              ) : (
                <div className="grid gap-3">
                  {analytics.renewalPredictions.slice(0, 8).map((prediction) => (
                    <article className="rounded-app bg-sage p-4" key={prediction.subscriptionId}>
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="font-black">{prediction.name}</h3>
                          <p className="mt-1 text-sm font-semibold capitalize text-black/60">
                            {prediction.billingCycle} renewal pattern
                          </p>
                        </div>
                        <div className="text-sm font-black sm:text-right">
                          <p>Current: {formatDate(prediction.currentRenewalDate)}</p>
                          <p className="text-teal">Predicted: {formatDate(prediction.predictedNextRenewalDate)}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </AppShell>
  );
}

