import { ExperienceLog, Protocol } from "./types";
import { summarizeTags, TagSummary } from "./nlp";

export interface WeekPoint {
  weekIndex: number;
  label: string;
  averageRating: number;
  entryCount: number;
}

export interface AdherenceBucket {
  label: "on_time" | "late" | "missed_window" | "unscheduled";
  count: number;
  averageRating: number | null;
}

export interface DivergenceFlag {
  hasBenchmark: boolean;
  personalAverage: number | null;
  publicBenchmark: number | null;
  difference: number | null;
  significant: boolean;
}

export interface UnusualGapFlag {
  detected: boolean;
  hoursSinceLastLog: number | null;
  typicalGapHours: number | null;
  message: string | null;
}

export interface CompositeReport {
  protocolId: number;
  totalDaysLogged: number;
  averageRating: number | null;
  distribution: { good: number; bad: number; ugly: number; unclassified: number };
  recommendPercent: number | null;
  doseAdherencePercent: number | null;
  weekOverWeek: WeekPoint[];
  adherenceTiming: AdherenceBucket[];
  tagSummary: TagSummary[];
  divergence: DivergenceFlag;
  unusualGap: UnusualGapFlag;
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

function classifyFeeling(feeling: string | null): "good" | "bad" | "ugly" | null {
  if (!feeling) return null;
  const f = feeling.trim().toLowerCase();
  if (f === "good" || f === "bad" || f === "ugly") return f;
  return null;
}

function parseScheduleMinutes(scheduleTime: string | null): number | null {
  if (!scheduleTime) return null;
  const match = scheduleTime.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function computeCompositeReport(protocol: Protocol, logs: ExperienceLog[]): CompositeReport {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const ratings = sorted.map((l) => l.rating).filter((r) => typeof r === "number");
  const averageRating = average(ratings);

  const distribution = { good: 0, bad: 0, ugly: 0, unclassified: 0 };
  for (const log of sorted) {
    const classified = classifyFeeling(log.feeling);
    if (classified) distribution[classified] += 1;
    else distribution.unclassified += 1;
  }

  const recommendAnswers = sorted.filter((l) => l.would_recommend !== null && l.would_recommend !== undefined);
  const recommendPercent =
    recommendAnswers.length > 0
      ? Math.round(
          (recommendAnswers.filter((l) => l.would_recommend === 1).length / recommendAnswers.length) * 10000
        ) / 100
      : null;

  const doseAdherencePercent =
    sorted.length > 0
      ? Math.round((sorted.filter((l) => l.dose_taken === 1).length / sorted.length) * 10000) / 100
      : null;

  // Week-over-week trend, anchored to protocol begin_date if available, else first log.
  const anchor = protocol.begin_date ? new Date(protocol.begin_date) : sorted[0] ? new Date(sorted[0].timestamp) : null;
  const weekBuckets = new Map<number, number[]>();
  if (anchor) {
    for (const log of sorted) {
      const t = new Date(log.timestamp).getTime();
      const diffDays = (t - anchor.getTime()) / (1000 * 60 * 60 * 24);
      const weekIndex = Math.max(0, Math.floor(diffDays / 7));
      const bucket = weekBuckets.get(weekIndex) ?? [];
      bucket.push(log.rating);
      weekBuckets.set(weekIndex, bucket);
    }
  }
  const weekOverWeek: WeekPoint[] = Array.from(weekBuckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekIndex, ratingsInWeek]) => ({
      weekIndex,
      label: `Week ${weekIndex + 1}`,
      averageRating: average(ratingsInWeek) ?? 0,
      entryCount: ratingsInWeek.length,
    }));

  // Adherence timing vs. rating correlation.
  const scheduleMinutes = parseScheduleMinutes(protocol.dosage_schedule_time);
  const buckets: Record<AdherenceBucket["label"], number[]> = {
    on_time: [],
    late: [],
    missed_window: [],
    unscheduled: [],
  };
  for (const log of sorted) {
    if (log.dose_taken !== 1) continue;
    if (scheduleMinutes === null) {
      buckets.unscheduled.push(log.rating);
      continue;
    }
    // Prefer the client-reported local time-of-day (accurate regardless of the
    // server's own timezone); fall back to the UTC timestamp's hour for older rows
    // logged before that field existed, which is only correct if the server happens
    // to run in the user's timezone.
    const entryMinutes = parseScheduleMinutes(log.local_time_of_day) ?? (() => {
      const d = new Date(log.timestamp);
      return d.getHours() * 60 + d.getMinutes();
    })();
    const diff = entryMinutes - scheduleMinutes;
    if (Math.abs(diff) <= 60) buckets.on_time.push(log.rating);
    else if (diff > 60 && diff <= 360) buckets.late.push(log.rating);
    else buckets.missed_window.push(log.rating);
  }
  const adherenceTiming: AdherenceBucket[] = (
    ["on_time", "late", "missed_window", "unscheduled"] as const
  ).map((label) => ({
    label,
    count: buckets[label].length,
    averageRating: average(buckets[label]),
  }));

  // NLP tag summary from free-text notes.
  const tagSummary = summarizeTags(sorted.map((l) => l.notes));

  // Personal vs. public benchmark divergence.
  const divergence: DivergenceFlag = {
    hasBenchmark: protocol.public_benchmark_rating !== null,
    personalAverage: averageRating,
    publicBenchmark: protocol.public_benchmark_rating,
    difference:
      averageRating !== null && protocol.public_benchmark_rating !== null
        ? Math.round((averageRating - protocol.public_benchmark_rating) * 100) / 100
        : null,
    significant:
      averageRating !== null && protocol.public_benchmark_rating !== null
        ? Math.abs(averageRating - protocol.public_benchmark_rating) >= 1.5
        : false,
  };

  // "Unusual for you" gap detection based on the user's own logging rhythm.
  const unusualGap = computeUnusualGap(sorted);

  return {
    protocolId: protocol.id,
    totalDaysLogged: sorted.length,
    averageRating,
    distribution,
    recommendPercent,
    doseAdherencePercent,
    weekOverWeek,
    adherenceTiming,
    tagSummary,
    divergence,
    unusualGap,
  };
}

function computeUnusualGap(sorted: ExperienceLog[]): UnusualGapFlag {
  if (sorted.length < 4) {
    return { detected: false, hoursSinceLastLog: null, typicalGapHours: null, message: null };
  }
  const gapsHours: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap =
      (new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime()) /
      (1000 * 60 * 60);
    gapsHours.push(gap);
  }
  const sortedGaps = [...gapsHours].sort((a, b) => a - b);
  const median = sortedGaps[Math.floor(sortedGaps.length / 2)];

  const lastEntry = sorted[sorted.length - 1];
  const hoursSinceLastLog = (Date.now() - new Date(lastEntry.timestamp).getTime()) / (1000 * 60 * 60);

  const threshold = Math.max(median * 1.5, median + 12);
  const detected = hoursSinceLastLog > threshold && hoursSinceLastLog > 24;

  return {
    detected,
    hoursSinceLastLog: Math.round(hoursSinceLastLog * 10) / 10,
    typicalGapHours: Math.round(median * 10) / 10,
    message: detected
      ? `It's been about ${Math.round(hoursSinceLastLog)}h since your last check-in — that's longer than your usual ~${Math.round(
          median
        )}h rhythm for this protocol.`
      : null,
  };
}
