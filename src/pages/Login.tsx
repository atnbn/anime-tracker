import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import AuthNotice from "../components/auth/AuthNotice";
import { getLoginErrorMessage } from "../lib/authMessages";

type AuthFeedback = {
  tone: "error" | "success" | "warning";
  message: string;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState: unknown = location.state;
  const destination = typeof routeState === "object" && routeState !== null && "from" in routeState && typeof routeState.from === "string" && /^\/(?!\/)/.test(routeState.from) ? routeState.from : "/dashboard";
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    if (!email || !password) {
      setFeedback({ tone: "error", message: "Enter your email and password to sign in." });
      return;
    }

    setBusy(true); setFeedback(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) navigate(destination, { replace: true });
      else setFeedback({ tone: "warning", message: "Check your email to confirm your account, then sign in." });
    } catch (error) { setFeedback({ tone: "error", message: getLoginErrorMessage(error) }); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><div className="flex items-center justify-between"><Link className="brand" to="/home">anitracker.</Link><ThemeToggle /></div>
    <p className="eyebrow">YOUR ANIME, ORGANIZED</p><h1>Welcome back.</h1><p className="muted">Your next episode is waiting.</p>
    <form onSubmit={submit} className="mt-8 space-y-4">
      
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required minLength={ 1 } />
      {feedback && <AuthNotice tone={feedback.tone} message={feedback.message} />}
      <Button type="submit" fullWidth disabled={busy}>{busy ? "Please wait…" : "Sign in"}</Button>
    </form><p className="mt-6 text-sm muted">New here? <Link className="accent" to="/signup">Create an account →</Link></p>
  </div></main>;
}
