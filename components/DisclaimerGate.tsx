"use client";

import { useEffect, useState } from "react";
import {
  DISCLAIMER_ACCEPTED_KEY,
  DISCLAIMER_LEGAL_NOTE,
  DISCLAIMER_PARAGRAPHS,
  DISCLAIMER_TITLE,
} from "@/lib/disclaimer";

export default function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "accepted" | "pending">("checking");
  const [checkbox, setCheckbox] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    // One-time hydration from a browser-only store; server has no localStorage to read during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(stored ? "accepted" : "pending");
  }, []);

  async function handleAccept() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/disclaimer", { method: "POST" });
      const data = await res.json();
      window.localStorage.setItem(
        DISCLAIMER_ACCEPTED_KEY,
        data.accepted_at ?? new Date().toISOString()
      );
    } catch {
      // Even if the server log fails, don't trap the user — record acceptance locally.
      window.localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, new Date().toISOString());
    } finally {
      setSubmitting(false);
      setStatus("accepted");
    }
  }

  if (status === "checking") {
    return null;
  }

  return (
    <>
      {children}
      {status === "pending" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">{DISCLAIMER_TITLE}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
              {DISCLAIMER_PARAGRAPHS.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-4 rounded-md bg-slate-100 p-3 text-xs text-slate-500">
              {DISCLAIMER_LEGAL_NOTE}
            </p>
            <label className="mt-4 flex items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={checkbox}
                onChange={(e) => setCheckbox(e.target.checked)}
              />
              I have read and understand this disclaimer, and I agree to use this app for
              personal record-keeping only, not as medical advice.
            </label>
            <button
              type="button"
              disabled={!checkbox || submitting}
              onClick={handleAccept}
              className="mt-4 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Recording acceptance…" : "Accept & Continue"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
