import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";

const billDefaults = {
  name: "",
  amount: "",
  dueDate: "",
  category: "Utilities",
  status: "upcoming",
  notes: ""
};

const subscriptionDefaults = {
  name: "",
  amount: "",
  billingCycle: "monthly",
  nextRenewalDate: "",
  category: "Entertainment",
  status: "active",
  notes: ""
};

const billStatuses = [
  ["upcoming", "Upcoming"],
  ["paid", "Paid"],
  ["overdue", "Overdue"]
];

const subscriptionStatuses = [
  ["active", "Active"],
  ["paused", "Paused"],
  ["cancelled", "Cancelled"]
];

const billingCycles = [
  ["weekly", "Weekly"],
  ["monthly", "Monthly"],
  ["quarterly", "Quarterly"],
  ["yearly", "Yearly"]
];

function formatDate(value) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

function daysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function monthlySubscriptionAmount(subscription) {
  const amount = Number(subscription.amount || 0);

  switch (subscription.billingCycle) {
    case "weekly":
      return amount * 4.33;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
    default:
      return amount;
  }
}

function sortBills(items) {
  return [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function sortSubscriptions(items) {
  return [...items].sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate));
}

function TextInput({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-black text-black/70">
      <span>{label}</span>
      <input
        className="h-11 rounded-app border border-black/10 bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15"
        {...props}
      />
    </label>
  );
}

function SelectInput({ label, children, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-black text-black/70">
      <span>{label}</span>
      <select
        className="h-11 rounded-app border border-black/10 bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function NotesInput({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-black text-black/70 sm:col-span-2">
      <span>{label}</span>
      <textarea
        className="min-h-20 rounded-app border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15"
        {...props}
      />
    </label>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-app border border-dashed border-black/15 bg-sage p-5">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-black/60">{body}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { token, user, logout } = useAuth();
  const [bills, setBills] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [billForm, setBillForm] = useState(billDefaults);
  const [subscriptionForm, setSubscriptionForm] = useState(subscriptionDefaults);
  const [editingBillId, setEditingBillId] = useState(null);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState(null);
  const [activePanel, setActivePanel] = useState("bills");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [isSavingSubscription, setIsSavingSubscription] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError("");

      try {
        const [billData, subscriptionData] = await Promise.all([
          apiRequest("/api/bills", { token }),
          apiRequest("/api/subscriptions", { token })
        ]);

        if (isMounted) {
          setBills(billData.bills);
          setSubscriptions(subscriptionData.subscriptions);
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

    loadData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const summary = useMemo(() => {
    const openBills = bills.filter((bill) => bill.status !== "paid");
    const dueSoonBills = openBills.filter((bill) => {
      const days = daysUntil(bill.dueDate);
      return days >= 0 && days <= 14;
    });
    const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active");
    const renewalSoonSubscriptions = activeSubscriptions.filter((subscription) => {
      const days = daysUntil(subscription.nextRenewalDate);
      return days >= 0 && days <= 30;
    });

    return {
      openBillTotal: openBills.reduce((total, bill) => total + Number(bill.amount || 0), 0),
      monthlySubscriptionTotal: activeSubscriptions.reduce(
        (total, subscription) => total + monthlySubscriptionAmount(subscription),
        0
      ),
      dueSoonCount: dueSoonBills.length,
      renewalSoonCount: renewalSoonSubscriptions.length
    };
  }, [bills, subscriptions]);

  function updateBillForm(event) {
    setBillForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateSubscriptionForm(event) {
    setSubscriptionForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitBill(event) {
    event.preventDefault();
    setIsSavingBill(true);
    setError("");

    try {
      const path = editingBillId ? `/api/bills/${editingBillId}` : "/api/bills";
      const method = editingBillId ? "PUT" : "POST";
      const data = await apiRequest(path, {
        method,
        token,
        body: billForm
      });

      setBills((current) => {
        if (editingBillId) {
          return sortBills(current.map((bill) => (bill.id === editingBillId ? data.bill : bill)));
        }

        return sortBills([data.bill, ...current]);
      });
      setBillForm(billDefaults);
      setEditingBillId(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingBill(false);
    }
  }

  async function submitSubscription(event) {
    event.preventDefault();
    setIsSavingSubscription(true);
    setError("");

    try {
      const path = editingSubscriptionId ? `/api/subscriptions/${editingSubscriptionId}` : "/api/subscriptions";
      const method = editingSubscriptionId ? "PUT" : "POST";
      const data = await apiRequest(path, {
        method,
        token,
        body: subscriptionForm
      });

      setSubscriptions((current) => {
        if (editingSubscriptionId) {
          return sortSubscriptions(
            current.map((subscription) =>
              subscription.id === editingSubscriptionId ? data.subscription : subscription
            )
          );
        }

        return sortSubscriptions([data.subscription, ...current]);
      });
      setSubscriptionForm(subscriptionDefaults);
      setEditingSubscriptionId(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingSubscription(false);
    }
  }

  function editBill(bill) {
    setActivePanel("bills");
    setEditingBillId(bill.id);
    setBillForm({
      name: bill.name,
      amount: String(bill.amount),
      dueDate: bill.dueDate,
      category: bill.category,
      status: bill.status,
      notes: bill.notes || ""
    });
  }

  function editSubscription(subscription) {
    setActivePanel("subscriptions");
    setEditingSubscriptionId(subscription.id);
    setSubscriptionForm({
      name: subscription.name,
      amount: String(subscription.amount),
      billingCycle: subscription.billingCycle,
      nextRenewalDate: subscription.nextRenewalDate,
      category: subscription.category,
      status: subscription.status,
      notes: subscription.notes || ""
    });
  }

  async function deleteBill(id) {
    if (!window.confirm("Delete this bill?")) {
      return;
    }

    setError("");

    try {
      await apiRequest(`/api/bills/${id}`, { method: "DELETE", token });
      setBills((current) => current.filter((bill) => bill.id !== id));
      if (editingBillId === id) {
        setEditingBillId(null);
        setBillForm(billDefaults);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteSubscription(id) {
    if (!window.confirm("Delete this subscription?")) {
      return;
    }

    setError("");

    try {
      await apiRequest(`/api/subscriptions/${id}`, { method: "DELETE", token });
      setSubscriptions((current) => current.filter((subscription) => subscription.id !== id));
      if (editingSubscriptionId === id) {
        setEditingSubscriptionId(null);
        setSubscriptionForm(subscriptionDefaults);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const profileRows = [
    { label: "Name", value: user?.name },
    { label: "Email", value: user?.email },
    { label: "Account created", value: formatDateTime(user?.createdAt) }
  ];

  return (
    <main className="min-h-screen bg-sage text-ink">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-app bg-moss text-sm font-black text-white">
              LA
            </div>
            <div>
              <p className="text-base font-black leading-none">Life Admin OS</p>
              <p className="mt-1 text-xs font-bold uppercase text-black/50">Bills and Subscriptions</p>
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

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-teal">Phase 2</p>
            <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
              Manual payment tracking
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-black/60">
              Add bills and subscriptions manually, keep status current, and see what needs attention next.
            </p>
          </div>
          <div className="flex rounded-app border border-black/10 bg-white p-1 shadow-soft">
            {[
              ["bills", "Bills"],
              ["subscriptions", "Subscriptions"]
            ].map(([value, label]) => (
              <button
                className={`h-10 rounded-app px-4 text-sm font-black transition ${
                  activePanel === value ? "bg-moss text-white" : "text-black/60 hover:text-ink"
                }`}
                key={value}
                onClick={() => setActivePanel(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-app border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
            {error}
          </div>
        ) : null}

        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase text-black/45">Open bills</p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(summary.openBillTotal)}</p>
          </article>
          <article className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase text-black/45">Monthly subscriptions</p>
            <p className="mt-3 text-3xl font-black">{formatCurrency(summary.monthlySubscriptionTotal)}</p>
          </article>
          <article className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase text-black/45">Bills due soon</p>
            <p className="mt-3 text-3xl font-black">{summary.dueSoonCount}</p>
          </article>
          <article className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase text-black/45">Renewals soon</p>
            <p className="mt-3 text-3xl font-black">{summary.renewalSoonCount}</p>
          </article>
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <aside className="grid gap-5">
            {activePanel === "bills" ? (
              <section className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase text-black/45">
                      {editingBillId ? "Edit Bill" : "Add Bill"}
                    </p>
                    <h2 className="mt-1 text-2xl font-black">Bill details</h2>
                  </div>
                  {editingBillId ? (
                    <button
                      className="rounded-app border border-black/10 px-3 py-2 text-xs font-black"
                      onClick={() => {
                        setEditingBillId(null);
                        setBillForm(billDefaults);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>

                <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitBill}>
                  <TextInput
                    label="Bill name"
                    name="name"
                    onChange={updateBillForm}
                    placeholder="Electricity bill"
                    required
                    type="text"
                    value={billForm.name}
                  />
                  <TextInput
                    label="Amount"
                    min="0"
                    name="amount"
                    onChange={updateBillForm}
                    placeholder="120.00"
                    required
                    step="0.01"
                    type="number"
                    value={billForm.amount}
                  />
                  <TextInput
                    label="Due date"
                    name="dueDate"
                    onChange={updateBillForm}
                    required
                    type="date"
                    value={billForm.dueDate}
                  />
                  <TextInput
                    label="Category"
                    name="category"
                    onChange={updateBillForm}
                    placeholder="Utilities"
                    required
                    type="text"
                    value={billForm.category}
                  />
                  <SelectInput label="Status" name="status" onChange={updateBillForm} value={billForm.status}>
                    {billStatuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </SelectInput>
                  <NotesInput
                    label="Notes"
                    name="notes"
                    onChange={updateBillForm}
                    placeholder="Optional account or payment notes"
                    value={billForm.notes}
                  />
                  <button
                    className="h-11 rounded-app bg-moss px-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                    disabled={isSavingBill}
                    type="submit"
                  >
                    {isSavingBill ? "Saving..." : editingBillId ? "Update Bill" : "Add Bill"}
                  </button>
                </form>
              </section>
            ) : (
              <section className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase text-black/45">
                      {editingSubscriptionId ? "Edit Subscription" : "Add Subscription"}
                    </p>
                    <h2 className="mt-1 text-2xl font-black">Subscription details</h2>
                  </div>
                  {editingSubscriptionId ? (
                    <button
                      className="rounded-app border border-black/10 px-3 py-2 text-xs font-black"
                      onClick={() => {
                        setEditingSubscriptionId(null);
                        setSubscriptionForm(subscriptionDefaults);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>

                <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitSubscription}>
                  <TextInput
                    label="Subscription name"
                    name="name"
                    onChange={updateSubscriptionForm}
                    placeholder="Netflix"
                    required
                    type="text"
                    value={subscriptionForm.name}
                  />
                  <TextInput
                    label="Amount"
                    min="0"
                    name="amount"
                    onChange={updateSubscriptionForm}
                    placeholder="15.99"
                    required
                    step="0.01"
                    type="number"
                    value={subscriptionForm.amount}
                  />
                  <SelectInput
                    label="Billing cycle"
                    name="billingCycle"
                    onChange={updateSubscriptionForm}
                    value={subscriptionForm.billingCycle}
                  >
                    {billingCycles.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </SelectInput>
                  <TextInput
                    label="Renewal date"
                    name="nextRenewalDate"
                    onChange={updateSubscriptionForm}
                    required
                    type="date"
                    value={subscriptionForm.nextRenewalDate}
                  />
                  <TextInput
                    label="Category"
                    name="category"
                    onChange={updateSubscriptionForm}
                    placeholder="Entertainment"
                    required
                    type="text"
                    value={subscriptionForm.category}
                  />
                  <SelectInput
                    label="Status"
                    name="status"
                    onChange={updateSubscriptionForm}
                    value={subscriptionForm.status}
                  >
                    {subscriptionStatuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </SelectInput>
                  <NotesInput
                    label="Notes"
                    name="notes"
                    onChange={updateSubscriptionForm}
                    placeholder="Optional renewal or cancellation notes"
                    value={subscriptionForm.notes}
                  />
                  <button
                    className="h-11 rounded-app bg-moss px-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                    disabled={isSavingSubscription}
                    type="submit"
                  >
                    {isSavingSubscription
                      ? "Saving..."
                      : editingSubscriptionId
                        ? "Update Subscription"
                        : "Add Subscription"}
                  </button>
                </form>
              </section>
            )}

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
          </aside>

          <section className="grid gap-5">
            <div className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-black/45">Bills</p>
                  <h2 className="mt-1 text-2xl font-black">Tracked bills</h2>
                </div>
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">
                  {bills.length} total
                </span>
              </div>

              {isLoading ? (
                <p className="rounded-app bg-sage p-4 text-sm font-bold text-black/60">Loading bills...</p>
              ) : bills.length === 0 ? (
                <EmptyState
                  title="No bills yet"
                  body="Add rent, insurance, internet, phone, credit card, or any recurring bill you want to track."
                />
              ) : (
                <div className="grid gap-3">
                  {bills.map((bill) => (
                    <article key={bill.id} className="rounded-app border border-black/10 bg-sage p-4">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">{bill.name}</h3>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-black/60">
                              {bill.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-black/60">
                            {bill.category} | Due {formatDate(bill.dueDate)} | {daysUntil(bill.dueDate)} days
                          </p>
                          {bill.notes ? <p className="mt-2 text-sm leading-6 text-black/60">{bill.notes}</p> : null}
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-2xl font-black">{formatCurrency(bill.amount)}</p>
                          <div className="mt-3 flex gap-2 md:justify-end">
                            <button
                              className="h-9 rounded-app border border-black/10 bg-white px-3 text-xs font-black"
                              onClick={() => editBill(bill)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="h-9 rounded-app border border-coral/20 bg-coral/10 px-3 text-xs font-black text-coral"
                              onClick={() => deleteBill(bill.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-app border border-black/10 bg-white p-5 shadow-soft">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-black/45">Subscriptions</p>
                  <h2 className="mt-1 text-2xl font-black">Tracked subscriptions</h2>
                </div>
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">
                  {subscriptions.length} total
                </span>
              </div>

              {isLoading ? (
                <p className="rounded-app bg-sage p-4 text-sm font-bold text-black/60">
                  Loading subscriptions...
                </p>
              ) : subscriptions.length === 0 ? (
                <EmptyState
                  title="No subscriptions yet"
                  body="Add Netflix, Spotify, Amazon Prime, gym memberships, cloud storage, or other renewals."
                />
              ) : (
                <div className="grid gap-3">
                  {subscriptions.map((subscription) => (
                    <article key={subscription.id} className="rounded-app border border-black/10 bg-sage p-4">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">{subscription.name}</h3>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-black/60">
                              {subscription.status}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-black/60">
                              {subscription.billingCycle}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-black/60">
                            {subscription.category} | Renews {formatDate(subscription.nextRenewalDate)} |{" "}
                            {daysUntil(subscription.nextRenewalDate)} days
                          </p>
                          {subscription.notes ? (
                            <p className="mt-2 text-sm leading-6 text-black/60">{subscription.notes}</p>
                          ) : null}
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-2xl font-black">{formatCurrency(subscription.amount)}</p>
                          <p className="mt-1 text-xs font-black uppercase text-black/45">
                            {formatCurrency(monthlySubscriptionAmount(subscription))}/mo
                          </p>
                          <div className="mt-3 flex gap-2 md:justify-end">
                            <button
                              className="h-9 rounded-app border border-black/10 bg-white px-3 text-xs font-black"
                              onClick={() => editSubscription(subscription)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="h-9 rounded-app border border-coral/20 bg-coral/10 px-3 text-xs font-black text-coral"
                              onClick={() => deleteSubscription(subscription.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
