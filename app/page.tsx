"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatProtocolId, PROTOCOL_TYPES, ProtocolWithStatus } from "@/lib/types";
import { useDoseReminders } from "@/hooks/useDoseReminders";

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loggedToday(p: ProtocolWithStatus): boolean {
  if (!p.last_log_timestamp) return false;
  return localDateKey(new Date(p.last_log_timestamp)) === localDateKey(new Date());
}

function typeLabel(type: string): string {
  return PROTOCOL_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function DashboardPage() {
  const [protocols, setProtocols] = useState<ProtocolWithStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useDoseReminders(protocols ?? []);

  useEffect(() => {
    fetch("/api/protocols")
      .then((r) => r.json())
      .then((data) => setProtocols(data.protocols))
      .catch(() => setError("Could not load protocols."));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Your Protocols</h1>
        <Link
          href="/protocols/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
        >
          + New Protocol
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {protocols === null && !error && <p className="text-slate-400 text-sm">Loading…</p>}

      {protocols?.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <p className="mb-3">No protocols yet.</p>
          <Link href="/protocols/new" className="text-slate-900 font-semibold underline">
            Start your first protocol
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {protocols?.map((p) => {
          const done = loggedToday(p);
          return (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-400 font-mono">{formatProtocolId(p.id)}</p>
                  <Link href={`/protocols/${p.id}`} className="font-semibold text-slate-900 hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-500">{typeLabel(p.protocol_type)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {done ? "Logged today" : "Not logged today"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/protocols/${p.id}/log`}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Quick Check-In
                </Link>
                <Link
                  href={`/protocols/${p.id}`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  View Report
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
