import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState: unknown = location.state;
  const destination = typeof routeState === "object" && routeState !== null && "from" in routeState && typeof routeState.from === "string" && /^\/(?!\/)/.test(routeState.from) ? routeState.from : "/dashboard";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")).trim(), password: String(form.get("password")) });
      if (error) throw error;
      if (data.session) navigate(destination, { replace: true });
      else setMessage("Check your email to confirm your account, then sign in.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><div className="flex items-center justify-between"><Link className="brand" to="/home">anitracker.</Link><ThemeToggle /></div>
    <p className="eyebrow">YOUR ANIME, ORGANIZED</p><h1>Welcome back.</h1><p className="muted">Your next episode is waiting.</p>
    <form onSubmit={submit} className="mt-8 space-y-4">
      
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required minLength={ 1 } />
      {message && <p role="status" className="text-sm">{message}</p>}
      <Button type="submit" fullWidth disabled={busy}>{busy ? "Please wait…" : "Sign in"}</Button>
    </form><p className="mt-6 text-sm muted">New here? <Link className="accent" to="/signup">Create an account →</Link></p>
  </div></main>;
}
