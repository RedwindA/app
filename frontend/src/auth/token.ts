import { useSyncExternalStore } from "react";

const TOKEN_KEY = "latex-app-token";
const listeners = new Set<() => void>();

// Storage can throw in private windows; fall back to memory for this tab.
let memoryToken: string | null = null;

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return memoryToken;
  }
}

function write(token: string | null) {
  memoryToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Memory token above still applies to this tab.
  }
  listeners.forEach((listener) => listener());
}

export const setToken = (token: string) => write(token);
export const clearToken = () => write(null);

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Signing out in another tab signs this one out too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === TOKEN_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useToken(): string | null {
  return useSyncExternalStore(subscribe, getToken, () => null);
}
