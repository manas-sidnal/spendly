"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadIcon, LogoutIcon, UserIcon } from "./icons";
import { promptInstall, useInstallPrompt } from "./useInstallPrompt";
import { useDismiss } from "./useDismiss";

type Me = { email: string; createdAt: string };

export default function UserMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [installNote, setInstallNote] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const install = useInstallPrompt();
  useDismiss(ref, open, () => setOpen(false));

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome === "accepted") setInstallNote("Installed. Open Spendly from your home screen or app list.");
    else if (outcome === "dismissed") setInstallNote("Install cancelled. Your browser will offer it again later.");
    else setInstallNote("Install isn’t available right now.");
  }

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
        onClick={() => {
          setOpen((o) => !o);
          setInstallNote("");
        }}
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
          {!install.installed && install.canPrompt && (
            <button type="button" role="menuitem" className="menu-item" onClick={handleInstall}>
              <DownloadIcon /> Install app
            </button>
          )}
          {!install.installed && !install.canPrompt && install.ios && (
            <div className="menu-note" role="note">
              <DownloadIcon /> <span>Install: Share → Add to Home Screen</span>
            </div>
          )}
          {installNote && (
            <div className="menu-note" role="status">
              {installNote}
            </div>
          )}
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
