import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { configured, supabase } from "../lib/supabase";

type Step = "password" | "enroll" | "verify";

export default function Login() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Sets up the authenticator app (first time only)
  async function startEnroll() {
    const { data: f } = await supabase.auth.mfa.listFactors();
    for (const x of f?.all ?? []) if (x.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: x.id }); // clean up abandoned setups
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Jaymba admin " + Date.now() });
    if (error || !data) { setErr(error?.message || "Could not start the setup. Please try again."); return; }
    setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret); setStep("enroll");
  }

  // Decides what the signed-in person must do next
  async function route() {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!aal) return;
    if (aal.currentLevel === "aal2") { nav("/admin"); return; }
    if (aal.nextLevel === "aal2") {
      const { data: f } = await supabase.auth.mfa.listFactors();
      const totp = f?.totp?.[0];
      if (totp) { setFactorId(totp.id); setStep("verify"); return; }
    }
    await startEnroll();
  }

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => { if (data.session) void route(); });
    // eslint-disable-next-line
  }, []);

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); setErr(error.message); return; }
    await route();
    setBusy(false);
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) { setErr("That code is not right. Wait for the next code in your app and try again."); setCode(""); return; }
    nav("/admin");
  }

  async function cancel() {
    await supabase.auth.signOut();
    setStep("password"); setCode(""); setErr(""); setPassword("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-3 rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-extrabold">Admin sign in</h1>
        {!configured && <p className="rounded bg-yellow-100 p-2 text-sm">Add your Supabase keys to <code>.env</code> first.</p>}

        {step === "password" && (
          <form onSubmit={submitPassword} className="space-y-3">
            <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {err && <p className="text-sm text-red-700">{err}</p>}
            <button className="btn w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          </form>
        )}

        {step === "enroll" && (
          <form onSubmit={submitCode} className="space-y-3">
            <p className="text-sm font-semibold">Set up two-step sign in</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
              <li>Install <b>Google Authenticator</b>, <b>Microsoft Authenticator</b> or <b>Authy</b> on your phone.</li>
              <li>In the app, add an account and scan this picture.</li>
              <li>Type the 6-digit code the app shows.</li>
            </ol>
            {qr && <img src={qr} alt="Scan this QR code with your authenticator app" className="mx-auto h-44 w-44" />}
            <div className="rounded bg-paper p-2 text-xs">
              Can't scan? Type this setup key into the app instead:
              <div className="mt-1 break-all font-mono text-sm font-bold">{secret}</div>
              <div className="mt-1 text-neutral-600">Write this key down and keep it safe. It lets you set up a new phone.</div>
            </div>
            <input className="input text-center text-lg tracking-widest" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            {err && <p className="text-sm text-red-700">{err}</p>}
            <button className="btn w-full" disabled={busy || code.length !== 6}>{busy ? "Checking..." : "Turn on and sign in"}</button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={submitCode} className="space-y-3">
            <p className="text-sm text-neutral-700">Open your authenticator app and type the 6-digit code for Jaymba admin.</p>
            <input className="input text-center text-lg tracking-widest" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            {err && <p className="text-sm text-red-700">{err}</p>}
            <button className="btn w-full" disabled={busy || code.length !== 6}>{busy ? "Checking..." : "Verify"}</button>
          </form>
        )}

        {step !== "password" && <button className="block w-full text-center text-sm underline" onClick={cancel}>Cancel and sign out</button>}
        <Link to="/" className="block text-center text-sm underline">Back to shop</Link>
      </div>
    </div>
  );
}
