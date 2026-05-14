export function formatDate(value) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

export function daysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

export function relativeDateLabel(dateValue, futureVerb = "in") {
  const days = daysUntil(dateValue);

  if (days < 0) {
    return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  }

  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return futureVerb === "tomorrow" ? "tomorrow" : "in 1 day";
  }

  return `in ${days} days`;
}

export function readableStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function monthlySubscriptionAmount(subscription) {
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

