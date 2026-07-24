import { CompositeReport } from "@/lib/report";
import ShortDisclaimer from "./ShortDisclaimer";

function Bar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-slate-500 capitalize">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right text-slate-500">{value}</span>
    </div>
  );
}

const ADHERENCE_LABELS: Record<string, string> = {
  on_time: "On-time doses",
  late: "Late doses",
  missed_window: "Way off schedule",
  unscheduled: "No schedule set",
};

export default function CompositeReportView({ report }: { report: CompositeReport }) {
  const dist = report.distribution;
  const maxDist = Math.max(dist.good, dist.bad, dist.ugly, dist.unclassified, 1);
  const maxWeek = Math.max(...report.weekOverWeek.map((w) => w.averageRating), 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Days Logged" value={String(report.totalDaysLogged)} />
        <Stat label="Avg Rating" value={report.averageRating !== null ? `${report.averageRating}/10` : "—"} />
        <Stat
          label="Would Recommend"
          value={report.recommendPercent !== null ? `${report.recommendPercent}%` : "—"}
        />
        <Stat
          label="Dose Adherence"
          value={report.doseAdherencePercent !== null ? `${report.doseAdherencePercent}%` : "—"}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Good / Bad / Ugly Days</h3>
        <div className="space-y-1.5">
          <Bar label="Good" value={dist.good} max={maxDist} colorClass="bg-emerald-500" />
          <Bar label="Bad" value={dist.bad} max={maxDist} colorClass="bg-amber-500" />
          <Bar label="Ugly" value={dist.ugly} max={maxDist} colorClass="bg-red-500" />
          {dist.unclassified > 0 && (
            <Bar label="Other" value={dist.unclassified} max={maxDist} colorClass="bg-slate-400" />
          )}
        </div>
      </div>

      {report.weekOverWeek.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Week-over-Week Trend</h3>
          <div className="flex items-end gap-2 h-24">
            {report.weekOverWeek.map((w) => (
              <div key={w.weekIndex} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div
                  className="w-full rounded-t bg-slate-700"
                  style={{ height: `${Math.max((w.averageRating / maxWeek) * 96, 4)}px` }}
                  title={`${w.label}: ${w.averageRating}/10 (${w.entryCount} entries)`}
                />
                <span className="text-[10px] text-slate-400">{w.label.replace("Week ", "W")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          Adherence Timing vs. Outcome
        </h3>
        <table className="w-full text-xs">
          <tbody>
            {report.adherenceTiming
              .filter((b) => b.count > 0)
              .map((b) => (
                <tr key={b.label} className="border-t border-slate-100">
                  <td className="py-1.5 text-slate-500">{ADHERENCE_LABELS[b.label]}</td>
                  <td className="py-1.5 text-right text-slate-500">{b.count} entries</td>
                  <td className="py-1.5 text-right font-medium text-slate-800">
                    {b.averageRating !== null ? `${b.averageRating}/10 avg` : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <ShortDisclaimer className="mt-1" />
      </div>

      {report.tagSummary.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Patterns in Your Notes</h3>
          <div className="flex flex-wrap gap-2">
            {report.tagSummary.map((t) => (
              <span key={t.category} className="flex items-center gap-1 text-xs">
                <span className="capitalize rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                  {t.category}
                </span>
                {t.negative > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-1 text-red-600">
                    -{t.negative}
                  </span>
                )}
                {t.positive > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">
                    +{t.positive}
                  </span>
                )}
              </span>
            ))}
          </div>
          <ShortDisclaimer className="mt-1" />
        </div>
      )}

      {report.divergence.hasBenchmark && (
        <div
          className={`rounded-md border p-3 text-sm ${
            report.divergence.significant
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <p>
            Your average ({report.divergence.personalAverage}/10) vs. the public benchmark (
            {report.divergence.publicBenchmark}/10):{" "}
            <strong>
              {report.divergence.difference !== null && report.divergence.difference > 0 ? "+" : ""}
              {report.divergence.difference}
            </strong>
            {report.divergence.significant && " — a notably different experience than reported publicly."}
          </p>
          <ShortDisclaimer className="mt-1" />
        </div>
      )}

      {report.unusualGap.detected && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <p>{report.unusualGap.message}</p>
          <ShortDisclaimer className="mt-1" />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
