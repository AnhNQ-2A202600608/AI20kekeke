"use client";

import { useMemo, useSyncExternalStore } from "react";

export type StoredChatMessage = {
  role: "ai" | "user";
  text: string;
  citations?: { source: string; page: number }[];
};


export type StoredChatSession = {
  id: string;
  subjectCode: string;
  chapterTitle: string;
  title: string;
  messages: StoredChatMessage[];
  createdAt: string;
  updatedAt: string;
  backendSessionId?: string;
};

const STORAGE_KEY = "mentora-ai-chat-sessions";
const CHANGE_EVENT = "mentora-ai-chat-sessions-change";

function parseSessions(raw: string | null): StoredChatSession[] {
  if (!raw) return [];

  try {
    const sessions = JSON.parse(raw) as StoredChatSession[];
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return [];
  }
}

function readSessions() {
  return parseSessions(window.localStorage.getItem(STORAGE_KEY));
}

function writeSessions(sessions: StoredChatSession[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) || "";
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function sessionTitle(message: string) {
  const compactMessage = message.replace(/\s+/g, " ").trim();
  return compactMessage.length > 54 ? `${compactMessage.slice(0, 51)}...` : compactMessage;
}

export function useChatSessions(subjectCode?: string) {
  const rawSessions = useSyncExternalStore(subscribe, getSnapshot, () => "");

  return useMemo(() => parseSessions(rawSessions)
    .filter((session) => !subjectCode || session.subjectCode === subjectCode)
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)), [rawSessions, subjectCode]);
}

export function createChatSession(input: {
  subjectCode: string;
  chapterTitle: string;
  firstUserMessage: string;
  initialMessages: StoredChatMessage[];
}) {
  const timestamp = new Date().toISOString();
  const session: StoredChatSession = {
    id: globalThis.crypto?.randomUUID?.() || `chat-${Date.now()}`,
    subjectCode: input.subjectCode,
    chapterTitle: input.chapterTitle,
    title: sessionTitle(input.firstUserMessage),
    messages: input.initialMessages,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeSessions([session, ...readSessions()]);
  return session;
}

export function updateChatSession(
  sessionId: string,
  update: (session: StoredChatSession) => StoredChatSession,
) {
  let nextSession: StoredChatSession | null = null;
  const nextSessions = readSessions().map((session) => {
    if (session.id !== sessionId) return session;
    nextSession = { ...update(session), updatedAt: new Date().toISOString() };
    return nextSession;
  });

  if (!nextSession) return null;
  writeSessions(nextSessions);
  return nextSession;
}

export function deleteChatSession(sessionId: string) {
  const sessions = readSessions();
  const nextSessions = sessions.filter((session) => session.id !== sessionId);
  if (nextSessions.length === sessions.length) return;
  writeSessions(nextSessions);
}

export function appendChatMessage(sessionId: string, message: StoredChatMessage) {
  return updateChatSession(sessionId, (session) => ({
    ...session,
    messages: [...session.messages, message],
  }));
}

export function saveBackendChatSessionId(sessionId: string, backendSessionId?: string | null) {
  if (!backendSessionId) return null;
  return updateChatSession(sessionId, (session) => ({ ...session, backendSessionId }));
}