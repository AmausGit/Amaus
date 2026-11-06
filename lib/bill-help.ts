import { FPL_YEAR, formatUsd } from "@/lib/fpl";

export type PatientPromptInput = {
  zip: string;
  stateName: string;
  householdSize: number;
  annualIncome: number;
  percentFpl: number | null;
  insurance: string;
  hospitalName: string;
  billAmount: string;
  firstBillDate: string;
  hasEob: boolean;
};

function line(label: string, value: string): string {
  return value.trim() ? `- ${label}: ${value.trim()}\n` : "";
}

export function buildPatientPrompt(i: PatientPromptInput): string {
  const facts =
    line("Location", [i.zip, i.stateName].filter(Boolean).join(", ")) +
    line("Household size", String(i.householdSize)) +
    line("Annual household income before taxes", i.annualIncome > 0 ? formatUsd(i.annualIncome) : "") +
    line(
      `Income as a percent of the ${FPL_YEAR} federal poverty guideline`,
      i.percentFpl !== null && i.annualIncome > 0 ? `${i.percentFpl}%` : "",
    ) +
    line("Insurance", i.insurance) +
    line("Hospital that billed me", i.hospitalName) +
    line("Amount the hospital says I owe", i.billAmount) +
    line("Date of the first bill after I left the hospital", i.firstBillDate);

  const tasks: string[] = [
    "List the nonprofit (tax-exempt) hospitals within about 30 miles of me. Under IRS section 501(r), each one must have a written financial assistance policy (FAP) covering emergency and medically necessary care, and must post it and a plain language summary on its website.",
    "For each hospital, find its FAP on the hospital's own website and give me: the link, the income cutoff for free care, the cutoff for discounted care (both as a percent of the federal poverty guideline), whether it counts savings or other assets, whether doctors who bill separately are covered, and the phone number for financial counseling.",
    "Using my income and household size, tell me which hospitals I would likely qualify for and at what level. Show your math.",
  ];
  const hospital = i.hospitalName.trim();
  if (hospital) {
    tasks.push(
      `For ${hospital} specifically: tell me whether it is a nonprofit (tax-exempt) hospital. If it is, find its financial assistance policy and tell me which level of help I would most likely get, what documents the application asks for, and how many days I have left to apply. Federal rules for nonprofit hospitals (26 CFR 1.501(r)-6) give patients at least 240 days from the first bill sent after discharge to apply.`,
      `Draft a short, polite message I can send to the ${hospital} billing office that (a) asks for an itemized bill with CPT/HCPCS codes, (b) asks for a financial assistance application and the plain language summary, and (c) asks them to hold the account from collections while the application is reviewed.`,
    );
  }
  if (i.hasEob) {
    tasks.push(
      "I have an Explanation of Benefits (EOB) from my insurer. When I paste it, line it up against the hospital bill: billed amount, allowed amount, what the plan paid, and what the EOB says I owe. Flag any line where the hospital asks for more than the EOB's patient responsibility, any duplicate charge, and any service I may not have received.",
    );
  }
  tasks.push(
    "Tell me whether I might qualify for Medicaid or a subsidized Marketplace plan in my state, since many hospitals ask applicants to apply for those first.",
  );

  return `I'm worried about paying for hospital care and want to understand my financial assistance options. Please help me step by step, in plain language.

About me:
${facts}
What I'd like you to do:
${tasks.map((t, n) => `${n + 1}. ${t}`).join("\n")}

Rules for your answer:
- Use each hospital's own FAP document as the source. Link it. If you can't find or open it, say so and give me the phone number to call instead of guessing.
- Don't tell me to drop insurance or skip care. A hospital's FAP covers that hospital only, not pharmacies or other providers.
- Finish with a short list of questions I should ask the hospital's financial counselor.`;
}

export type HospitalKitInput = {
  hospitalName: string;
  cityState: string;
  fapUrl: string;
  summaryUrl: string;
  applicationUrl: string;
  phone: string;
  email: string;
  freeCareCutoff: string;
  discountCutoff: string;
  discountDetail: string;
  assetTest: string;
  guidelineYear: string;
  providersNotCoveredUrl: string;
  languages: string;
};

export function buildHospitalPrompt(h: HospitalKitInput): string {
  const name = h.hospitalName.trim() || "[Hospital name]";
  const facts =
    line("Hospital", [name, h.cityState].filter((s) => s.trim()).join(", ")) +
    line("Financial assistance policy (FAP)", h.fapUrl) +
    line("Plain language summary", h.summaryUrl) +
    line("Application", h.applicationUrl) +
    line("Free care for household income up to", h.freeCareCutoff ? `${h.freeCareCutoff}% of the federal poverty guideline` : "") +
    line("Discounted care for household income up to", h.discountCutoff ? `${h.discountCutoff}% of the federal poverty guideline` : "") +
    line("How the discount works", h.discountDetail) +
    line("Assets considered", h.assetTest) +
    line("Poverty guideline year used", h.guidelineYear) +
    line("Providers not covered by this policy", h.providersNotCoveredUrl) +
    line("Financial counseling phone", h.phone) +
    line("Financial counseling email", h.email) +
    line("Languages available", h.languages);

  return `I want to know whether I qualify for financial assistance at ${name}. Here is what the hospital publishes about its program:

${facts}
Please:
1. Ask me for my household size, my household's yearly income before taxes, and my state. Don't ask for anything else unless the policy requires it.
2. Work out my income as a percent of the federal poverty guideline and tell me which level of help I would likely get under the policy above. Show the math.
3. Open the FAP link above and check the facts in this message against it. If they differ, the FAP document is correct; tell me what differs.
4. List the documents I'll need for the application and how to submit it.
5. If I already have a bill, remind me that a nonprofit hospital has to accept applications for at least 240 days after the first bill it sends after I leave the hospital, and help me write a short note to the billing office asking for an application and a hold on collections.
6. Tell me who to call with questions, using the phone and email above.

This is an estimate to help me prepare. The hospital makes the final decision on my application.`;
}

export function buildHospitalJson(h: HospitalKitInput): string {
  const num = (s: string) => (s.trim() && Number.isFinite(Number(s)) ? Number(s) : null);
  const str = (s: string) => (s.trim() ? s.trim() : null);
  return JSON.stringify(
    {
      schema: "amaus.financial-assistance.v1",
      hospital: str(h.hospitalName),
      location: str(h.cityState),
      policy_url: str(h.fapUrl),
      plain_language_summary_url: str(h.summaryUrl),
      application_url: str(h.applicationUrl),
      free_care_max_percent_fpl: num(h.freeCareCutoff),
      discounted_care_max_percent_fpl: num(h.discountCutoff),
      discount_detail: str(h.discountDetail),
      asset_test: str(h.assetTest),
      poverty_guideline_year: num(h.guidelineYear),
      providers_not_covered_url: str(h.providersNotCoveredUrl),
      contact: { phone: str(h.phone), email: str(h.email) },
      languages: str(h.languages),
      application_window_days_after_first_bill: 240,
    },
    null,
    2,
  );
}
