"use client";

import { useState } from "react";
import Link from "next/link";
import CopyBlock from "@/components/CopyBlock";
import { buildPatientPrompt } from "@/lib/bill-help";
import {
  COMMON_CUTOFFS,
  FPL_SOURCE_URL,
  FPL_YEAR,
  formatUsd,
  percentOfFpl,
  povertyGuideline,
  regionForState,
  US_STATES,
} from "@/lib/fpl";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function BillHelpPage() {
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [householdSize, setHouseholdSize] = useState("1");
  const [income, setIncome] = useState("");
  const [period, setPeriod] = useState<"year" | "month">("year");
  const [insurance, setInsurance] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [firstBillDate, setFirstBillDate] = useState("");
  const [hasEob, setHasEob] = useState(false);

  const size = Math.max(1, Math.floor(Number(householdSize) || 1));
  const region = regionForState(stateCode);
  const guideline = povertyGuideline(size, region) ?? 0;
  const rawIncome = Number(income.replace(/[$,\s]/g, ""));
  const annualIncome = Number.isFinite(rawIncome) && rawIncome > 0 ? (period === "month" ? rawIncome * 12 : rawIncome) : 0;
  const pct = annualIncome > 0 ? percentOfFpl(annualIncome, size, region) : null;
  const stateName = US_STATES.find((s) => s.code === stateCode)?.name ?? "";

  const prompt = buildPatientPrompt({
    zip,
    stateName,
    householdSize: size,
    annualIncome,
    percentFpl: pct,
    insurance,
    hospitalName,
    billAmount,
    firstBillDate,
    hasEob,
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hospital bill help</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every nonprofit hospital in the US has to run a financial assistance program, and many cover households
          well above the poverty line. Fill in what you know, see where your income falls, and copy a ready-made
          prompt into Claude or any other AI assistant to find programs near you. Nothing you type here is saved or
          sent anywhere.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/bill-help/compare" className="font-medium text-slate-900 underline">
            Planning a scan or procedure? Compare a cash price with your plan.
          </Link>
        </p>
        <p className="mt-1 text-sm">
          <Link href="/bill-help/hospitals" className="font-medium text-slate-900 underline">
            Work at a hospital? Build a prompt for your own program.
          </Link>
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <h2 className="font-semibold text-slate-900">1. Your household</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="state">State</label>
            <select id="state" className={inputClass} value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
              <option value="">Select a state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="zip">ZIP code</label>
            <input id="zip" className={inputClass} inputMode="numeric" maxLength={5} value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div>
            <label className={labelClass} htmlFor="size">People in household</label>
            <input id="size" type="number" min={1} max={20} className={inputClass} value={householdSize}
              onChange={(e) => setHouseholdSize(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="income">Household income before taxes</label>
            <div className="flex gap-2">
              <input id="income" className={inputClass} inputMode="decimal" placeholder="45,000" value={income}
                onChange={(e) => setIncome(e.target.value)} />
              <select aria-label="Income period" className="rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={period} onChange={(e) => setPeriod(e.target.value as "year" | "month")}>
                <option value="year">per year</option>
                <option value="month">per month</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-slate-50 p-3 text-sm">
          {pct !== null ? (
            <p>
              <span className="text-2xl font-bold text-slate-900">{pct}%</span>{" "}
              <span className="text-slate-600">
                of the {FPL_YEAR} federal poverty guideline ({formatUsd(annualIncome)} a year against{" "}
                {formatUsd(guideline)} for {size} {size === 1 ? "person" : "people"}).
              </span>
            </p>
          ) : (
            <p className="text-slate-500">Enter your income to see where it falls.</p>
          )}
        </div>

        <div>
          <p className="text-sm text-slate-600 mb-2">
            Each hospital sets its own cutoffs. Common ones: free care up to 200% or 250%, discounts up to 300% to
            400%, and a few programs reach 600%. Yearly income limits for a household of {size}
            {stateCode ? ` in ${stateName}` : ""}:
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-1 font-medium">Cutoff</th>
                <th className="py-1 font-medium">Income up to</th>
                <th className="py-1 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {COMMON_CUTOFFS.map((c) => {
                const limit = Math.round((guideline * c) / 100);
                const under = annualIncome > 0 && annualIncome <= limit;
                return (
                  <tr key={c} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-700">{c}% FPL</td>
                    <td className="py-1.5 font-mono text-slate-900">{formatUsd(limit)}</td>
                    <td className="py-1.5 text-xs">
                      {under && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">you are under this</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400">
            Source: HHS poverty guidelines, <a className="underline" href={FPL_SOURCE_URL} target="_blank" rel="noreferrer">Federal Register, Jan. 15, 2026</a>.
            Some hospitals still use the prior year&apos;s table, and some also count savings.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <h2 className="font-semibold text-slate-900">2. A bill you already have (optional)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="hospital">Hospital name</label>
            <input id="hospital" className={inputClass} value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="amount">Amount billed to you</label>
            <input id="amount" className={inputClass} placeholder="$2,400" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="firstbill">Date of first bill after discharge</label>
            <input id="firstbill" type="date" className={inputClass} value={firstBillDate} onChange={(e) => setFirstBillDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="insurance">Insurance</label>
            <input id="insurance" className={inputClass} placeholder="None, Medicaid, employer plan…" value={insurance}
              onChange={(e) => setInsurance(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hasEob} onChange={(e) => setHasEob(e.target.checked)} />
          I have an Explanation of Benefits (EOB) from my insurer for this visit
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">3. Copy this into your AI assistant</h2>
        <p className="text-sm text-slate-600">
          It includes the numbers you entered. Edit anything you&apos;d rather not share before pasting it.
        </p>
        <CopyBlock text={prompt} label="Copy prompt" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Before you pay a hospital bill</h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Ask for an itemized bill with billing codes. The summary statement doesn&apos;t show what you were charged for.</li>
          <li>If you have insurance, wait for the EOB. The amount the hospital asks for shouldn&apos;t exceed the EOB&apos;s &quot;patient responsibility&quot; line.</li>
          <li>Ask for the financial assistance application even if you think you earn too much. Nonprofit hospitals must accept it for at least 240 days after the first bill sent after discharge.</li>
          <li>Ask the billing office to hold the account from collections while your application is reviewed.</li>
          <li>Doctors, labs and ambulance services often bill separately. Ask whether the hospital&apos;s program covers them.</li>
        </ol>
      </section>

      <p className="text-xs italic text-slate-400">
        This is an estimate to help you prepare, not financial or legal advice. Each hospital decides its own
        eligibility. Don&apos;t drop health insurance based on one hospital&apos;s program: it covers that hospital only.
      </p>
    </div>
  );
}
