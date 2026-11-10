"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { URLS } from "@/config/urls";
import { useApi } from "@/hooks/useApi";
import type { StaffUser } from "@/types/staff";
import { errorMessage } from "@/utils/staff";
import { homeFor } from "@/utils/staffHome";

export default function LoginForm() {
  const router = useRouter();
  const { get, post } = useApi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in? Skip the form. This also sets the CSRF cookie the login POST needs.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await get(URLS.STAFF_CSRF);
        const me = await get<StaffUser>(URLS.STAFF_ME);
        if (!cancelled) router.replace(homeFor(me));
      } catch {
        /* not signed in: show the form */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [get, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await get(URLS.STAFF_CSRF);
      const user = await post<StaffUser>(URLS.STAFF_LOGIN, { email, password });
      router.replace(homeFor(user));
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 p-3">
      <form className="adm-card p-4" style={{ width: "min(400px, 100%)" }} onSubmit={onSubmit}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="badge rounded-pill" style={{ background: "#1e3a66", fontSize: 14 }}>
            AMAI
          </span>
          <b>Events desk</b>
        </div>
        <h1 className="h4 fw-bold mb-3">Sign in</h1>
        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}
        <label className="form-label fw-semibold" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="form-control mb-3"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="form-label fw-semibold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="form-control mb-4"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-adm w-100" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="adm-muted small mt-3 mb-0">Staff only. Ask an administrator if you need access.</p>
      </form>
    </div>
  );
}
