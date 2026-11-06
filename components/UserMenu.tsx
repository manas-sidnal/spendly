"use client";

import { useEffect, useRef, useState } from "react";
import { LogoutIcon, UserIcon } from "./icons";
import { useDismiss } from "./useDismiss";

type Me = { email: string; createdAt: string };

export default function UserMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => setMe(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProfile(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [profile]);

  const initial = me?.email.charAt(0).toUpperCase() ?? "U";
  const since = me
    ? new Date(me.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="avatar-btn"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {initial}
      </button>

      {open && (
        <div className="popover user-pop" role="menu">
          {me && <div className="user-email">{me.email}</div>}
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => {
              setOpen(false);
              setProfile(true);
            }}
          >
            <UserIcon /> Profile
          </button>
          <button type="button" role="menuitem" className="menu-item danger" onClick={onLogout}>
            <LogoutIcon /> Logout
          </button>
        </div>
      )}

      {profile && (
        <div className="modal-backdrop" onClick={() => setProfile(false)}>
          <div className="modal" role="dialog" aria-label="Profile" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-lg">{initial}</div>
            <h2>Profile</h2>
            <dl className="profile-rows">
              <div>
                <dt>Email</dt>
                <dd>{me?.email ?? "–"}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{since || "–"}</dd>
              </div>
            </dl>
            <button type="button" className="btn-primary" onClick={() => setProfile(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
