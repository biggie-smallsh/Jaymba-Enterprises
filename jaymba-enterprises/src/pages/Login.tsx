import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { configured, supabase } from "../lib/supabase";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
    else nav("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-extrabold">Admin sign in</h1>
        {!configured && <p className="rounded bg-yellow-100 p-2 text-sm">Add your Supabase keys to <code>.env</code> first.</p>}
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        <Link to="/" className="block text-center text-sm underline">Back to shop</Link>
      </form>
    </div>
  );
}
