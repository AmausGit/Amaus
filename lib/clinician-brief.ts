import { CompositeReport } from "@/lib/report";
import { ExperienceLog, PROTOCOL_TYPES, Protocol } from "@/lib/types";

const RECENT_NOTES = 8;

function typeLabel(type: string): string {
  return PROTOCOL_TYPES.find((t) => t.value === type)?.label ?? type;
}

function field(label: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || String(value).trim() === "") return "";
  return `- ${label}: ${String(value).trim()}\n`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * A plain-text summary of one protocol and the user's own check-ins, written for a
 * clinician who has a few minutes. It reports only what the user logged and adds no
 * interpretation, so the clinician can draw their own conclusions.
 */
export function buildClinicianBrief(protocol: Protocol, report: CompositeReport, logs: ExperienceLog[]): string {
  const sorted = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const what =
    field("Name", protocol.name) +
    field("Type", typeLabel(protocol.protocol_type)) +
    field("Product", [protocol.product_name, protocol.company].filter(Boolean).join(", ")) +
    field("Dose per use", protocol.dosage_per_use) +
    field("Scheduled time", protocol.dosage_schedule_time) +
    field("Planned course", protocol.course_duration) +
    field("Started", protocol.begin_date) +
    field("Planned end", protocol.end_date) +
    field("Recommended by", [protocol.creator_name, protocol.creator_credentials].filter(Boolean).join(", ")) +
    field("Known interaction warnings", protocol.interaction_warnings);

  const d = report.distribution;
  const results =
    field("Check-ins", first ? `${sorted.length} between ${shortDate(first.timestamp)} and ${shortDate(last.timestamp)}` : "none yet") +
    field("Days with a check-in", report.totalDaysLogged || null) +
    field("Average self-rating (1-10)", report.averageRating) +
    field("Doses taken as planned", report.doseAdherencePercent !== null ? `${report.doseAdherencePercent}%` : null) +
    field("How I felt (good / bad / ugly)", sorted.length ? `${d.good} / ${d.bad} / ${d.ugly}` : null) +
    field(
      "Average rating by week",
      report.weekOverWeek.length ? report.weekOverWeek.map((w) => `${w.label}: ${w.averageRating}`).join("; ") : null,
    );

  const tags = report.tagSummary
    .filter((t) => t.positive + t.negative > 0)
    .map((t) => `- ${t.category}: ${t.negative} negative, ${t.positive} positive mentions\n`)
    .join("");

  const notes = sorted
    .filter((l) => l.notes && l.notes.trim())
    .slice(-RECENT_NOTES)
    .map((l) => `- ${shortDate(l.timestamp)} (${l.rating}/10${l.dose_taken ? "" : ", dose skipped"}): ${l.notes!.trim()}\n`)
    .join("");

  return `Self-tracking summary for my visit
Generated ${shortDate(new Date().toISOString())} from my own check-ins. Not a medical record.

What I'm taking or doing:
${what}
What I logged:
${results}${tags ? `\nSymptoms mentioned in my notes:\n${tags}` : ""}${notes ? `\nMy most recent notes:\n${notes}` : ""}
Questions I'd like to cover:
- Is this safe with everything else I take?
- Do my results suggest I should keep going, change something, or stop?
- What should I watch for that means I should call you?
`;
}

/**
 * A prompt the user pastes into an AI assistant along with the brief. It asks the
 * assistant to help them prepare for the visit and explicitly keeps dosing decisions
 * with the clinician.
 */
export function buildVisitPrepPrompt(brief: string): string {
  return `I'm seeing my doctor soon and want to use my time well. Below is a summary of something I've been taking or doing, with my own daily check-ins.

Please:
1. In plain language, tell me what patterns stand out in my check-ins (for example, ratings dropping after a certain week, or symptoms showing up on days I skipped a dose). Say how confident you are, since this is one person's self-reported data.
2. List anything in my notes that a doctor would likely want to hear about right away.
3. Suggest up to five specific questions I should ask, ordered by importance.
4. Tell me what other information my doctor will probably ask for (other medicines and supplements, allergies, conditions, recent lab results) so I can bring it.

Don't tell me to change, start or stop a dose. That's a decision for me and my doctor. If anything in my notes sounds like an emergency, tell me to get care now.

${brief}`;
}
