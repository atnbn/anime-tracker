import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
export default function Signup() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.auth.signUp({ email: String(form.get("email")).trim(), password: String(form.get("password")), options: { data: { username: String(form.get("username")).trim() } } });
      if (error) throw error;
      if (data.session) navigate("/dashboard", { replace: true });
      else setMessage("Check your email to confirm your account, then sign in.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><div className="flex items-center justify-between"><Link className="brand" to="/home">anitracker.</Link><ThemeToggle /></div>
    <p className="eyebrow">YOUR ANIME, ORGANIZED</p><h1>Start your collection.</h1><p className="muted">A home for every story you love.</p>
    <form onSubmit={submit} className="mt-8 space-y-4">
      <Input label="Username" name="username" autoComplete="nickname" required maxLength={40} />
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Password" name="password" type="password" autoComplete="new-password" required minLength={ 8 } />
      {message && <p role="status" className="text-sm">{message}</p>}
      <Button type="submit" fullWidth disabled={busy}>{busy ? "Please wait…" : "Create account"}</Button>
    </form><p className="mt-6 text-sm muted">Already a member? <Link className="accent" to="/login">Sign in →</Link></p>
  </div></main>;
}
