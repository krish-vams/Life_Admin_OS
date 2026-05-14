import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to access your protected Life Admin OS dashboard."
      switchText="Need an account?"
      switchTo="/register"
      switchLabel="Create one"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={updateField}
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={updateField}
          required
        />

        {error ? <p className="rounded-app bg-coral/10 px-3 py-2 text-sm font-bold text-coral">{error}</p> : null}

        <button
          className="mt-2 h-12 rounded-app bg-moss px-4 font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
      </form>
    </AuthShell>
  );
}

