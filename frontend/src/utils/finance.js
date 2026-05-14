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
