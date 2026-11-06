"use client";

import { useState } from "react";
import CopyBlock from "@/components/CopyBlock";
import { buildClinicianBrief, buildVisitPrepPrompt } from "@/lib/clinician-brief";
import { CompositeReport } from "@/lib/report";
import { ExperienceLog, Protocol } from "@/lib/types";

export default function ClinicianBrief({
  protocol,
  report,
  logs,
}: {
  protocol: Protocol;
  report: CompositeReport;
  logs: ExperienceLog[];
}) {
  const [view, setView] = useState<"brief" | "prompt">("brief");
  const brief = buildClinicianBrief(protocol, report, logs);
  const text = view === "brief" ? brief : buildVisitPrepPrompt(brief);

  const tab = (v: "brief" | "prompt", label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
        view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Your check-ins, condensed for a doctor or pharmacist to read in a couple of minutes. Print it, email it, or
        paste it into your patient portal. The second tab wraps it in a prompt for an AI assistant to help you
        prepare questions before the visit.
      </p>
      <div className="flex gap-1">
        {tab("brief", "Brief for my clinician")}
        {tab("prompt", "Visit prep prompt for AI")}
      </div>
      <CopyBlock text={text} label="Copy" />
      {logs.length < 7 && (
        <p className="text-xs text-slate-500">
          With fewer than a week of check-ins, there isn&apos;t much for a clinician to see yet.
        </p>
      )}
    </div>
  );
}
