"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExperienceLog, formatProtocolId, PROTOCOL_TYPES, Protocol } from "@/lib/types";
import { CompositeReport } from "@/lib/report";
import CompositeReportView from "@/components/CompositeReportView";
import ReceiptCapture from "@/components/ReceiptCapture";
import ClinicianBrief from "@/components/ClinicianBrief";

function typeLabel(type: string): string {
  return PROTOCOL_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function ProtocolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [report, setReport] = useState<CompositeReport | null>(null);
  const [logs, setLogs] = useState<ExperienceLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, rRes, lRes] = await Promise.all([
        fetch(`/api/protocols/${id}`),
        fetch(`/api/protocols/${id}/report`),
        fetch(`/api/protocols/${id}/logs`),
      ]);
      if (!pRes.ok) throw new Error("Protocol not found.");
      const pData = await pRes.json();
      const rData = await rRes.json();
      const lData = await lRes.json();
      setProtocol(pData.protocol);
      setReport(rData.report);
      setLogs(lData.logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load protocol.");
    }
  }, [id]);

  useEffect(() => {
    // Fetch-on-mount: load() sets state asynchronously after the effect body returns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDeleteProtocol() {
    if (!confirm("Delete this protocol and all its check-in history? This cannot be undone.")) return;
    await fetch(`/api/protocols/${id}`, { method: "DELETE" });
    window.location.href = "/";
  }

  async function handleDeleteLog(logId: number) {
    if (!confirm("Delete this check-in entry?")) return;
    await fetch(`/api/logs/${logId}`, { method: "DELETE" });
    load();
  }

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!protocol || !report) return <p className="text-slate-400 text-sm">Loading…</p>;

  const visibleLogs = showAllLogs ? logs : logs.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 font-mono">{formatProtocolId(protocol.id)}</p>
          <h1 className="text-xl font-bold text-slate-900">{protocol.name}</h1>
          <p className="text-sm text-slate-500">
            {typeLabel(protocol.protocol_type)}
            {protocol.company ? ` · ${protocol.company}` : ""}
            {protocol.course_duration ? ` · ${protocol.course_duration}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/protocols/${protocol.id}/log`}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Quick Check-In
          </Link>
          <Link
            href={`/protocols/${protocol.id}/edit`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Edit
          </Link>
        </div>
      </div>

      {(protocol.interaction_warnings || protocol.salient_notes) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
          <h2 className="font-semibold">Before You Continue</h2>
          {protocol.interaction_warnings && (
            <p>
              <strong>Interaction warnings:</strong> {protocol.interaction_warnings}
            </p>
          )}
          {protocol.salient_notes && (
            <p>
              <strong>Notes:</strong> {protocol.salient_notes}
            </p>
          )}
          <p className="text-xs italic text-amber-700">
            User-entered / publicly sourced information only — not verified medical guidance.
            Always confirm with a qualified provider.
          </p>
        </div>
      )}

      {protocol.expected_timeline && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900 mb-1">What to Expect</h2>
          <p className="text-sm text-slate-600 whitespace-pre-line">{protocol.expected_timeline}</p>
          <p className="mt-2 text-xs italic text-slate-400">
            Based on publicly available reports, not a guarantee of your own experience.
          </p>
        </section>
      )}

      {protocol.public_reviews_summary && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900 mb-1">Public Reviews Summary</h2>
          <p className="text-sm text-slate-600 whitespace-pre-line">{protocol.public_reviews_summary}</p>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Composite Report</h2>
        <CompositeReportView report={report} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Share With Your Doctor</h2>
        <ClinicianBrief protocol={protocol} report={report} logs={logs} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Purchase Receipt</h2>
        <ReceiptCapture protocol={protocol} onSaved={(p) => setProtocol(p)} />
        {protocol.return_window && (
          <p className="mt-3 text-xs text-slate-500">Return window: {protocol.return_window}</p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Check-In History</h2>
          <span className="text-xs text-slate-400">{logs.length} entries</span>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">No check-ins logged yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleLogs.map((l) => (
              <li key={l.id} className="py-2 flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="text-slate-800">
                    <span className="font-medium">{l.rating}/10</span>
                    {l.feeling && <span className="ml-2 text-slate-500 capitalize">{l.feeling}</span>}
                    {l.dose_taken === 0 && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                        Dose skipped
                      </span>
                    )}
                  </p>
                  {l.notes && <p className="text-slate-500">{l.notes}</p>}
                  <p className="text-xs text-slate-400">{new Date(l.timestamp).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteLog(l.id)}
                  className="shrink-0 text-xs text-slate-400 hover:text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        {logs.length > 5 && (
          <button
            onClick={() => setShowAllLogs((v) => !v)}
            className="mt-2 text-xs font-medium text-slate-500 underline"
          >
            {showAllLogs ? "Show less" : `Show all ${logs.length}`}
          </button>
        )}
      </section>

      <div className="pt-4 border-t border-slate-100">
        <button onClick={handleDeleteProtocol} className="text-xs text-slate-400 hover:text-red-600">
          Delete this protocol
        </button>
      </div>
    </div>
  );
}
