"use client";

import { useState } from "react";
import Link from "next/link";
import CopyBlock from "@/components/CopyBlock";
import { buildCreditRequest, buildPriceShoppingPrompt, compare } from "@/lib/cash-price";
import { formatUsd } from "@/lib/fpl";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

function money(s: string): number {
  const n = Number(s.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function ComparePage() {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [allowed, setAllowed] = useState("");
  const [deductible, setDeductible] = useState("");
  const [coinsurance, setCoinsurance] = useState("20");
  const [oop, setOop] = useState("");
  const [cash, setCash] = useState("");
  const [provider, setProvider] = useState("");
  const [dateOfService, setDateOfService] = useState("");
  const [planName, setPlanName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [view, setView] = useState<"shop" | "letter">("shop");

  const allowedN = money(allowed);
  const cashN = money(cash);
  // An empty out-of-pocket field means "unknown", so don't cap.
  const oopN = oop.trim() ? money(oop) : Number.POSITIVE_INFINITY;
  const result = compare(
    {
      allowedAmount: allowedN,
      deductibleRemaining: money(deductible),
      coinsurance: Math.min(100, Math.max(0, Number(coinsurance) || 0)) / 100,
      oopRemaining: oopN,
    },
    cashN,
  );
  const ready = allowedN > 0 && cashN > 0;

  const text =
    view === "shop"
      ? buildPriceShoppingPrompt(service, location, allowedN, allowedN > 0 ? result.insured.patientPays : 0)
      : buildCreditRequest({ service, provider, dateOfService, cashPrice: cashN, allowedAmount: allowedN, planName, memberId });

  const tab = (v: "shop" | "letter", label: string) => (
    <button
      type="button"
      onClick={() => setView(v)}
      className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-sm"><Link href="/bill-help" className="text-slate-500 underline">Hospital bill help</Link></p>
        <h1 className="text-xl font-bold text-slate-900">Cash price vs. your plan</h1>
        <p className="mt-1 text-sm text-slate-600">
          For scans, lab work and planned procedures, the self-pay price is sometimes lower than what you&apos;d pay
          through insurance before you meet your deductible. Enter your plan&apos;s numbers and a cash price to see
          which costs less, then ask your plan to count the cash payment toward your deductible.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <h2 className="font-semibold text-slate-900">Your plan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="service">Service</label>
            <input id="service" className={inputClass} placeholder="MRI of the knee without contrast" value={service} onChange={(e) => setService(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="location">City and state</label>
            <input id="location" className={inputClass} placeholder="Austin, TX" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="allowed">Plan&apos;s allowed amount</label>
            <input id="allowed" className={inputClass} inputMode="decimal" placeholder="1,850" value={allowed} onChange={(e) => setAllowed(e.target.value)} />
            <p className="mt-1 text-xs text-slate-400">From your plan&apos;s cost estimator or a past EOB.</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="deductible">Deductible left this year</label>
            <input id="deductible" className={inputClass} inputMode="decimal" placeholder="3,000" value={deductible} onChange={(e) => setDeductible(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="coins">Coinsurance after deductible (%)</label>
            <input id="coins" type="number" min={0} max={100} className={inputClass} value={coinsurance} onChange={(e) => setCoinsurance(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="oop">Out-of-pocket max left this year</label>
            <input id="oop" className={inputClass} inputMode="decimal" placeholder="Leave blank if unsure" value={oop} onChange={(e) => setOop(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cash">Cash price you found</label>
            <input id="cash" className={inputClass} inputMode="decimal" placeholder="450" value={cash} onChange={(e) => setCash(e.target.value)} />
          </div>
        </div>

        <div className="rounded-md bg-slate-50 p-3 text-sm space-y-1">
          {!ready ? (
            <p className="text-slate-500">Enter the allowed amount and a cash price to compare.</p>
          ) : (
            <>
              <p>
                Through your plan you&apos;d pay <strong>{formatUsd(result.insured.patientPays)}</strong>. Cash is{" "}
                <strong>{formatUsd(result.cashPrice)}</strong>.
              </p>
              {result.savingsToday > 0 ? (
                <p className="text-emerald-700">Paying cash saves {formatUsd(result.savingsToday)} on this service.</p>
              ) : (
                <p className="text-slate-700">Going through your plan costs {formatUsd(-result.savingsToday)} less or the same.</p>
              )}
              {result.savingsToday > 0 && result.progressGivenUp > 0 && (
                <p className="text-amber-700">
                  {`Unless your plan credits the cash payment, ${formatUsd(result.progressGivenUp)} that would have counted toward your deductible and out-of-pocket max won't. If you expect more covered care this plan year, part of the savings comes back as a higher bill later. Send the letter below either way.`}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Copy and use</h2>
        <div className="flex gap-1">
          {tab("shop", "Find cash prices with AI")}
          {tab("letter", "Ask my plan to credit it")}
        </div>
        {view === "letter" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="provider">Where you paid</label>
              <input id="provider" className={inputClass} value={provider} onChange={(e) => setProvider(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="dos">Date of service</label>
              <input id="dos" type="date" className={inputClass} value={dateOfService} onChange={(e) => setDateOfService(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="plan">Health plan</label>
              <input id="plan" className={inputClass} value={planName} onChange={(e) => setPlanName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="member">Member ID</label>
              <input id="member" className={inputClass} value={memberId} onChange={(e) => setMemberId(e.target.value)} />
            </div>
          </div>
        )}
        <CopyBlock text={text} label="Copy" />
      </section>

      <p className="text-xs italic text-slate-400">
        This is an estimate for one service, not financial advice. Cash prices sometimes leave out the doctor&apos;s
        fee or reading fee, so ask what&apos;s included. Some plans and some states credit cash payments toward the
        deductible; many don&apos;t.
      </p>
    </div>
  );
}
