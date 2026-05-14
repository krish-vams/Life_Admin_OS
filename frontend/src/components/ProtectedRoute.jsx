import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-sage px-6 text-ink">
        <p className="rounded-app border border-black/10 bg-white px-5 py-4 shadow-soft">
          Loading your dashboard...
        </p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

