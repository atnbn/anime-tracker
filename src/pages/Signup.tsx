import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import AuthNotice from "../components/auth/AuthNotice";
import { getSignupErrorMessage } from "../lib/authMessages";

type AuthFeedback = {
  tone: "error" | "success" | "warning";
  message: string;
};

export default function Signup() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username")).trim();
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    if (!username || !email || !password) {
      setFeedback({ tone: "error", message: "Fill in your username, email, and password to create an account." });
      return;
    }

    if (password.length < 8) {
      setFeedback({ tone: "error", message: "Choose a password with at least 8 characters." });
      return;
    }

    setBusy(true); setFeedback(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
      if (error) throw error;
      if (data.session) navigate("/dashboard", { replace: true });
      else setFeedback({ tone: "success", message: "Account created. Check your email to confirm it, then sign in." });
    } catch (error) { setFeedback({ tone: "error", message: getSignupErrorMessage(error) }); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><div className="flex items-center justify-between"><Link className="brand" to="/home">anitracker.</Link><ThemeToggle /></div>
    <p className="eyebrow">YOUR ANIME, ORGANIZED</p><h1>Start your collection.</h1><p className="muted">A home for every story you love.</p>
    <form onSubmit={submit} className="mt-8 space-y-4">
      <Input label="Username" name="username" autoComplete="nickname" required maxLength={40} />
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="new-password" required minLength={ 8 } />
      {feedback && <AuthNotice tone={feedback.tone} message={feedback.message} />}
      <Button type="submit" fullWidth disabled={busy}>{busy ? "Please wait…" : "Create account"}</Button>
    </form><p className="mt-6 text-sm muted">Already a member? <Link className="accent" to="/login">Sign in →</Link></p>
  </div></main>;
}
