"use client";

import { useEffect, useState } from "react";
import { ProtocolWithStatus } from "@/lib/types";

const PROACTIVE_LEAD_MINUTES = 15;
const REACTIVE_GRACE_MINUTES = 30;
const CHECK_INTERVAL_MS = 60_000;

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loggedToday(p: ProtocolWithStatus): boolean {
  if (!p.last_log_timestamp) return false;
  return localDateKey(new Date(p.last_log_timestamp)) === localDateKey(new Date());
}

function parseScheduleTime(schedule: string | null, on: Date): Date | null {
  if (!schedule) return null;
  const match = schedule.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const result = new Date(on);
  result.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
  return result;
}

function alreadyNotified(protocolId: number, type: "proactive" | "reactive"): boolean {
  const key = `amaus.reminder.${protocolId}.${localDateKey(new Date())}.${type}`;
  return window.localStorage.getItem(key) === "1";
}

function markNotified(protocolId: number, type: "proactive" | "reactive") {
  const key = `amaus.reminder.${protocolId}.${localDateKey(new Date())}.${type}`;
  window.localStorage.setItem(key, "1");
}

function notify(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch {
    // Notification constructor can throw on some mobile browsers; safe to ignore.
  }
}

export function useDoseReminders(protocols: ProtocolWithStatus[]) {
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

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    function checkAll() {
      const now = new Date();
      for (const p of protocols) {
        if (!p.dosage_schedule_time) continue;
        const scheduled = parseScheduleTime(p.dosage_schedule_time, now);
        if (!scheduled) continue;
        if (loggedToday(p)) continue;

        const minutesUntil = (scheduled.getTime() - now.getTime()) / 60_000;

        // Proactive: nudge ahead of the scheduled dose time.
        if (
          minutesUntil > 0 &&
          minutesUntil <= PROACTIVE_LEAD_MINUTES &&
          !alreadyNotified(p.id, "proactive")
        ) {
          notify(
            "Dose coming up",
            `${p.name}: scheduled in about ${Math.ceil(minutesUntil)} min. Not medical advice — a reminder based on your own schedule.`
          );
          markNotified(p.id, "proactive");
        }

        // Reactive: alert if the dose window has passed with no log entry.
        const minutesPast = -minutesUntil;
        if (minutesPast >= REACTIVE_GRACE_MINUTES && !alreadyNotified(p.id, "reactive")) {
          notify(
            "Missed check-in?",
            `${p.name}: no log entry yet for today's scheduled dose. Tap to record what happened.`
          );
          markNotified(p.id, "reactive");
        }
      }
    }

    checkAll();
    const interval = setInterval(checkAll, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [protocols]);

  async function requestPermission() {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return { permission, requestPermission };
}
