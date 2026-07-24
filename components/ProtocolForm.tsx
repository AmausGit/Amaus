"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROTOCOL_TYPES, Protocol, ProtocolType } from "@/lib/types";

export interface ProtocolFormValues {
  name: string;
  protocol_type: ProtocolType;
  creator_name: string;
  creator_credentials: string;
  company: string;
  product_name: string;
  dosage_per_use: string;
  course_duration: string;
  begin_date: string;
  end_date: string;
  dosage_schedule_time: string;
  salient_notes: string;
  interaction_warnings: string;
  expected_timeline: string;
  public_reviews_summary: string;
  public_benchmark_rating: string;
  return_window: string;
}

function toFormValues(p?: Protocol): ProtocolFormValues {
  return {
    name: p?.name ?? "",
    protocol_type: p?.protocol_type ?? "other",
    creator_name: p?.creator_name ?? "",
    creator_credentials: p?.creator_credentials ?? "",
    company: p?.company ?? "",
    product_name: p?.product_name ?? "",
    dosage_per_use: p?.dosage_per_use ?? "",
    course_duration: p?.course_duration ?? "",
    begin_date: p?.begin_date ?? "",
    end_date: p?.end_date ?? "",
    dosage_schedule_time: p?.dosage_schedule_time ?? "",
    salient_notes: p?.salient_notes ?? "",
    interaction_warnings: p?.interaction_warnings ?? "",
    expected_timeline: p?.expected_timeline ?? "",
    public_reviews_summary: p?.public_reviews_summary ?? "",
    public_benchmark_rating: p?.public_benchmark_rating != null ? String(p.public_benchmark_rating) : "",
    return_window: p?.return_window ?? "",
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {hint && <span className="block text-xs text-slate-400 mb-1">{hint}</span>}
      {!hint && <span className="block mb-1" />}
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function ProtocolForm({ existing }: { existing?: Protocol }) {
  const router = useRouter();
  const [values, setValues] = useState<ProtocolFormValues>(toFormValues(existing));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ProtocolFormValues>(key: K, value: ProtocolFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.name.trim()) {
      setError("Protocol name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        public_benchmark_rating: values.public_benchmark_rating
          ? Number(values.public_benchmark_rating)
          : null,
      };
      const res = await fetch(existing ? `/api/protocols/${existing.id}` : "/api/protocols", {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save protocol.");
      }
      const data = await res.json();
      router.push(`/protocols/${data.protocol.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Protocol Basics
        </h2>
        <Field label="Protocol Name *">
          <input
            className={inputClass}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder='e.g. "Liver Cleanse - July"'
            required
          />
        </Field>
        <Field label="Protocol Type">
          <select
            className={inputClass}
            value={values.protocol_type}
            onChange={(e) => update("protocol_type", e.target.value as ProtocolType)}
          >
            {PROTOCOL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Creator Name" hint="Person who authored/sells the protocol">
            <input
              className={inputClass}
              value={values.creator_name}
              onChange={(e) => update("creator_name", e.target.value)}
            />
          </Field>
          <Field label="Creator Credentials">
            <input
              className={inputClass}
              value={values.creator_credentials}
              onChange={(e) => update("creator_credentials", e.target.value)}
            />
          </Field>
          <Field label="Company / Manufacturer">
            <input
              className={inputClass}
              value={values.company}
              onChange={(e) => update("company", e.target.value)}
            />
          </Field>
          <Field label="Product Name">
            <input
              className={inputClass}
              value={values.product_name}
              onChange={(e) => update("product_name", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Dosage &amp; Schedule
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Dosage Per Use">
            <input
              className={inputClass}
              value={values.dosage_per_use}
              onChange={(e) => update("dosage_per_use", e.target.value)}
            />
          </Field>
          <Field label="Course Duration" hint='e.g. "8 weeks"'>
            <input
              className={inputClass}
              value={values.course_duration}
              onChange={(e) => update("course_duration", e.target.value)}
            />
          </Field>
          <Field label="Begin Date">
            <input
              type="date"
              className={inputClass}
              value={values.begin_date}
              onChange={(e) => update("begin_date", e.target.value)}
            />
          </Field>
          <Field label="End Date">
            <input
              type="date"
              className={inputClass}
              value={values.end_date}
              onChange={(e) => update("end_date", e.target.value)}
            />
          </Field>
          <Field
            label="Dosage Schedule Time"
            hint="Time of day dose is due — drives reminders"
          >
            <input
              type="time"
              className={inputClass}
              value={values.dosage_schedule_time}
              onChange={(e) => update("dosage_schedule_time", e.target.value)}
            />
          </Field>
          <Field label="Return Window / Refund Policy">
            <input
              className={inputClass}
              value={values.return_window}
              onChange={(e) => update("return_window", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Safety &amp; Expectations
        </h2>
        <Field label="Salient Notes / Warnings" hint='e.g. "take on empty stomach"'>
          <textarea
            className={inputClass}
            rows={2}
            value={values.salient_notes}
            onChange={(e) => update("salient_notes", e.target.value)}
          />
        </Field>
        <Field label="Drug / Condition Interaction Warnings">
          <textarea
            className={inputClass}
            rows={2}
            value={values.interaction_warnings}
            onChange={(e) => update("interaction_warnings", e.target.value)}
          />
        </Field>
        <Field
          label="Expected Timeline"
          hint="What week 1/2/3 typically feels like, per public data"
        >
          <textarea
            className={inputClass}
            rows={3}
            value={values.expected_timeline}
            onChange={(e) => update("expected_timeline", e.target.value)}
          />
        </Field>
        <Field label="Public Reviews Summary" hint="Summarized from the web for this product">
          <textarea
            className={inputClass}
            rows={3}
            value={values.public_reviews_summary}
            onChange={(e) => update("public_reviews_summary", e.target.value)}
          />
        </Field>
        <Field
          label="Public Benchmark Rating (1–10)"
          hint="Used to flag if your personal results diverge significantly"
        >
          <input
            type="number"
            min={1}
            max={10}
            step={0.1}
            className={inputClass}
            value={values.public_benchmark_rating}
            onChange={(e) => update("public_benchmark_rating", e.target.value)}
          />
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {submitting ? "Saving…" : existing ? "Save Changes" : "Create Protocol"}
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
  );
}
