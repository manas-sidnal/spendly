import { useSyncExternalStore } from "react";

type InstallChoice = { outcome: "accepted" | "dismissed" };
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

type InstallState = {
  /** The browser has offered a native install prompt we can trigger. */
  canPrompt: boolean;
  /** Already running as an installed app (or just installed). */
  installed: boolean;
  /** iOS/iPadOS Safari, where there is no install prompt API. */
  ios: boolean;
};

const SERVER_STATE: InstallState = { canPrompt: false, installed: false, ios: false };

let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = SERVER_STATE;
const listeners = new Set<() => void>();

function set(patch: Partial<InstallState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

// Listen from module load (not from a component effect) so an early
// `beforeinstallprompt` is not missed before the menu mounts.
if (typeof window !== "undefined") {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  state = { canPrompt: false, installed: standalone, ios };

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    set({ canPrompt: true });
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    set({ canPrompt: false, installed: true });
  });
}

export function useInstallPrompt(): InstallState {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => state,
    () => SERVER_STATE,
  );
}

/** Shows the native install prompt. A prompt event can only be used once. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const event = deferred;
  if (!event) return "unavailable";
  deferred = null;
  set({ canPrompt: false });
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") set({ installed: true });
    return outcome;
  } catch {
    return "unavailable";
  }
}
