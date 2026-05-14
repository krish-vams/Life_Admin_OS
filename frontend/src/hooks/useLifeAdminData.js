import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";
import { daysUntil, monthlySubscriptionAmount } from "../utils/lifeAdmin.js";

export default function useLifeAdminData(token) {
  const [bills, setBills] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError("");

      try {
        const [billData, subscriptionData, documentData] = await Promise.all([
          apiRequest("/api/bills", { token }),
          apiRequest("/api/subscriptions", { token }),
          apiRequest("/api/documents", { token })
        ]);

        if (isMounted) {
          setBills(billData.bills);
          setSubscriptions(subscriptionData.subscriptions);
          setDocuments(documentData.documents);
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
    const upcomingBills = openBills.filter((bill) => {
      const days = daysUntil(bill.dueDate);
      return days >= 0 && days <= 14;
    });
    const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active");
    const upcomingRenewals = activeSubscriptions.filter((subscription) => {
      const days = daysUntil(subscription.nextRenewalDate);
      return days >= 0 && days <= 30;
    });
    const expiringDocuments = documents.filter((document) => document.status === "expiring_soon");
    const expiredDocuments = documents.filter((document) => document.status === "expired");

    return {
      totalSubscriptions: subscriptions.length,
      monthlySubscriptionCost: activeSubscriptions.reduce(
        (total, subscription) => total + monthlySubscriptionAmount(subscription),
        0
      ),
      upcomingBills: upcomingBills.length,
      documentsExpiringSoon: expiringDocuments.length,
      openBillTotal: openBills.reduce((total, bill) => total + Number(bill.amount || 0), 0),
      attentionDocuments: expiringDocuments.length + expiredDocuments.length
    };
  }, [bills, subscriptions, documents]);

  return {
    bills,
    subscriptions,
    documents,
    isLoading,
    error,
    summary
  };
}

