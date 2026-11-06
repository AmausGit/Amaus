"use client";

import { useState } from "react";
import Link from "next/link";
import CopyBlock from "@/components/CopyBlock";
import { buildHospitalJson, buildHospitalPrompt, HospitalKitInput } from "@/lib/bill-help";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

const FIELDS: { key: keyof HospitalKitInput; label: string; placeholder?: string; type?: string }[] = [
  { key: "hospitalName", label: "Hospital name", placeholder: "Riverside Community Hospital" },
  { key: "cityState", label: "City and state", placeholder: "Dayton, OH" },
  { key: "fapUrl", label: "Financial assistance policy URL", type: "url" },
  { key: "summaryUrl", label: "Plain language summary URL", type: "url" },
  { key: "applicationUrl", label: "Application URL", type: "url" },
  { key: "providersNotCoveredUrl", label: "List of providers not covered (URL)", type: "url" },
  { key: "freeCareCutoff", label: "Free care up to (% of poverty guideline)", placeholder: "250", type: "number" },
  { key: "discountCutoff", label: "Discounted care up to (% of poverty guideline)", placeholder: "400", type: "number" },
  { key: "discountDetail", label: "How the discount works", placeholder: "Sliding scale from 75% to 25% off" },
  { key: "assetTest", label: "Assets considered", placeholder: "No asset test" },
  { key: "guidelineYear", label: "Poverty guideline year used", placeholder: "2026", type: "number" },
  { key: "phone", label: "Financial counseling phone" },
  { key: "email", label: "Financial counseling email", type: "email" },
  { key: "languages", label: "Languages available", placeholder: "English, Spanish" },
];

const EMPTY: HospitalKitInput = {
  hospitalName: "", cityState: "", fapUrl: "", summaryUrl: "", applicationUrl: "", phone: "", email: "",
  freeCareCutoff: "", discountCutoff: "", discountDetail: "", assetTest: "", guidelineYear: "",
  providersNotCoveredUrl: "", languages: "",
};

export default function HospitalKitPage() {
  const [form, setForm] = useState<HospitalKitInput>(EMPTY);
  const prompt = buildHospitalPrompt(form);
  const json = buildHospitalJson(form);
  const name = form.hospitalName.trim() || "our hospital";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-sm"><Link href="/bill-help" className="text-slate-500 underline">Hospital bill help</Link></p>
        <h1 className="text-xl font-bold text-slate-900">Prompt kit for hospitals</h1>
        <p className="mt-1 text-sm text-slate-600">
          Most patients who qualify for financial assistance never apply because they don&apos;t know the program
          exists. Enter your program&apos;s details and publish the result on your billing page, statements and
          patient portal: patients paste it into the AI assistant they already use, and it walks them through
          your policy.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className={labelClass} htmlFor={f.key}>{f.label}</label>
              <input id={f.key} type={f.type ?? "text"} className={inputClass} placeholder={f.placeholder}
                value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Text for your website and statements</h2>
        <p className="text-sm text-slate-600">
          Suggested lead-in: &quot;Worried about paying your bill at {name}? Copy the text below into Claude,
          ChatGPT or any AI assistant. It will check whether you qualify for free or discounted care and help you
          apply.&quot;
        </p>
        <CopyBlock text={prompt} label="Copy prompt" />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Machine-readable version</h2>
        <p className="text-sm text-slate-600">
          Post this JSON at a stable URL on your site (for example <code>/financial-assistance.json</code>) so AI
          assistants that browse the web can read your cutoffs directly instead of parsing a PDF.
        </p>
        <CopyBlock text={json} label="Copy JSON" />
      </section>

      <p className="text-xs italic text-slate-400">
        Your published FAP document stays the official policy. Review this text with your compliance team before
        posting it.
      </p>
    </div>
  );
}
