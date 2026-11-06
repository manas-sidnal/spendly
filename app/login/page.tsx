"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(kind: "login" | "signup") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card auth-card">
      <h1>Spendly</h1>
      <p className="note">Sign in to your expense tracker.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit("login");
        }}
      >
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="current-password" />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          Sign in
        </button>
        <button type="button" disabled={busy} onClick={() => submit("signup")}>
          Create account
        </button>
        {error && <div className="error">{error}</div>}
        <div className="note">Only the first account can be created unless ALLOW_SIGNUP=true.</div>
      </form>
    </div>
  );
}
