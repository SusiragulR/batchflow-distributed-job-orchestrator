"use client";

const STORAGE_KEY = "batchflow-client-id";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `client-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

export const getClientId = () => {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = createId();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
};

