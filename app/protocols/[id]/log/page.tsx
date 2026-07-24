"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Protocol } from "@/lib/types";

const FEELINGS = ["good", "bad", "ugly"] as const;

export default function LogCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [doseTaken, setDoseTaken] = useState<boolean | null>(null);
  const [easeOfUse, setEaseOfUse] = useState<number | null>(null);
  const [feeling, setFeeling] = useState<string>("");
  const [customFeeling, setCustomFeeling] = useState("");
  const [rating, setRating] = useState(7);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/protocols/${id}`)
      .then((r) => r.json())
      .then((data) => setProtocol(data.protocol))
      .catch(() => {});
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (doseTaken === null) {
      setError("Let us know whether you took today's dose.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/protocols/${id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dose_taken: doseTaken,
          ease_of_use: easeOfUse,
          feeling: feeling === "custom" ? customFeeling || null : feeling || null,
          rating,
          would_recommend: wouldRecommend,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save check-in.");
      }
      router.push(`/protocols/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">Quick Check-In</h1>
      <p className="text-sm text-slate-500 mb-6">
        {protocol ? protocol.name : "…"} — logged with today&apos;s timestamp automatically.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Did you take today&apos;s dose? *
          </span>
          <div className="flex gap-2">
            {[
              { label: "Yes", val: true },
              { label: "No", val: false },
            ].map((opt) => (
              <button
                type="button"
                key={opt.label}
                onClick={() => setDoseTaken(opt.val)}
                className={`px-4 py-2 rounded-md text-sm font-medium border ${
                  doseTaken === opt.val
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">Ease of Use</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setEaseOfUse(n)}
                className={`h-10 w-10 rounded-md text-sm font-medium border ${
                  easeOfUse === n
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">1 = difficult, 5 = effortless</span>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">Feeling</span>
          <div className="flex flex-wrap gap-2">
            {FEELINGS.map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFeeling(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize border ${
                  feeling === f
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFeeling("custom")}
              className={`px-4 py-2 rounded-md text-sm font-medium border ${
                feeling === "custom"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Other…
            </button>
          </div>
          {feeling === "custom" && (
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Describe how you're feeling"
              value={customFeeling}
              onChange={(e) => setCustomFeeling(e.target.value)}
            />
          )}
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Overall Rating: <span className="font-bold">{rating}</span> / 10
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Would you recommend this so far?
          </span>
          <div className="flex gap-2">
            {[
              { label: "Yes", val: true },
              { label: "No", val: false },
              { label: "Not sure yet", val: null },
            ].map((opt) => (
              <button
                type="button"
                key={opt.label}
                onClick={() => setWouldRecommend(opt.val)}
                className={`px-4 py-2 rounded-md text-sm font-medium border ${
                  wouldRecommend === opt.val
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-2">Notes</span>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering about today…"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {submitting ? "Saving…" : "Save Check-In"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
