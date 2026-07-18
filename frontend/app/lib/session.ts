"use client";

import { useSyncExternalStore } from "react";

export type AuthSession = {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    mssv?: string | null;
    role: string;
  };
};

const SESSION_KEY = "mentora-auth-session";
const LEGACY_SESSION_KEY = "orbitlearn-auth-session";
const SESSION_EVENT = "mentora-auth-session-change";

function parseSession(value: string | null): AuthSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as AuthSession;
    if (!parsed.token || !parsed.user?.id || !parsed.user?.email || !parsed.user?.fullName) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readSession() {
  return parseSession(window.sessionStorage.getItem(SESSION_KEY))
    || parseSession(window.localStorage.getItem(SESSION_KEY))
    || parseSession(window.sessionStorage.getItem(LEGACY_SESSION_KEY))
    || parseSession(window.localStorage.getItem(LEGACY_SESSION_KEY));
}

function getSnapshot() {
  return [
    window.sessionStorage.getItem(SESSION_KEY) || "",
    window.localStorage.getItem(SESSION_KEY) || "",
    window.sessionStorage.getItem(LEGACY_SESSION_KEY) || "",
    window.localStorage.getItem(LEGACY_SESSION_KEY) || "",
  ].join("\u0000");
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(SESSION_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(SESSION_EVENT, listener);
  };
}

export function saveAuthSession(session: AuthSession, remember = false) {
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  otherStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearAuthSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useAuthSession() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "");
  return snapshot ? readSession() : null;
}