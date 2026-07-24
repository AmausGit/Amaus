"use client";

import { useEffect, useState } from "react";
import {
  DISCLAIMER_LEGAL_NOTE,
  DISCLAIMER_PARAGRAPHS,
  DISCLAIMER_TITLE,
} from "@/lib/disclaimer";

export default function SettingsPage() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    // One-time hydration from the browser's Notification API, unavailable during server render.
    if (typeof Notification === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission("unsupported");
      return;
    }
     
    setPermission(Notification.permission);
  }, []);

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings &amp; About</h1>
        <p className="text-sm text-slate-500">Reminders, data, and the fine print.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900 mb-2">Dose Reminders</h2>
        <p className="text-sm text-slate-600 mb-3">
          Reminders fire while this app is open in your browser: a nudge ~15 minutes before
          each protocol&apos;s scheduled dose time, and an alert if the dose window passes with
          no check-in logged. Browser notifications require your permission, and — because this
          is a web app rather than a native mobile app — reminders only fire while a tab is
          open; for background/OS-level scheduling on mobile, a native shell (e.g. Expo/React
          Native) would be a natural next step.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Status: <span className="font-medium text-slate-800">{permission}</span>
          </span>
          {permission !== "granted" && permission !== "unsupported" && (
            <button
              onClick={enableNotifications}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Enable Notifications
            </button>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900 mb-3">{DISCLAIMER_TITLE}</h2>
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          {DISCLAIMER_PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="mt-4 rounded-md bg-slate-100 p-3 text-xs text-slate-500">
          {DISCLAIMER_LEGAL_NOTE}
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900 mb-2">Your Data</h2>
        <p className="text-sm text-slate-600">
          All protocol details, check-ins, and receipt images are stored locally in this
          app&apos;s own database — nothing is sent to a third party by this app itself.
          Receipt text recognition (OCR) runs in your browser. Deleting a protocol also
          deletes its check-in history.
        </p>
      </section>
    </div>
  );
}
