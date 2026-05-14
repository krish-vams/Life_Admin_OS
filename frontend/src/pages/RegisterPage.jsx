import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up the protected foundation for your personal life-admin dashboard."
      switchText="Already have an account?"
      switchTo="/login"
      switchLabel="Log in"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <FormField
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={updateField}
          required
        />
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
          autoComplete="new-password"
          minLength={8}
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
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}

