"use client";

import { useEffect, useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon, LogoMark } from "@/components/icons";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [canSignup, setCanSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Only offer "Create account" when the server allows it. On a brand-new database, open on sign-up.
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d: { hasUsers: boolean; canSignup: boolean }) => {
        setCanSignup(Boolean(d.canSignup));
        if (!d.hasUsers) setMode("signup");
      })
      .catch(() => {});
  }, []);

  const isSignup = mode === "signup";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setError("");
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <LogoMark size={34} />
          <span>Spendly</span>
        </div>

        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">
          {isSignup ? "Start tracking where your money goes." : "Sign in to continue to your dashboard."}
        </p>

        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password"
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={isSignup ? 8 : undefined}
                required
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        {canSignup && (
          <p className="auth-switch">
            {isSignup ? "Already have an account?" : "New here?"}{" "}
            <button type="button" className="text-link" onClick={switchMode}>
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
