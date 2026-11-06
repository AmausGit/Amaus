import { formatUsd } from "@/lib/fpl";

export type PlanInput = {
  /** What the plan allows for the service: the negotiated rate from an EOB or the plan's price tool. */
  allowedAmount: number;
  /** How much of the yearly deductible is still unmet. */
  deductibleRemaining: number;
  /** Coinsurance after the deductible, as a fraction (0.2 for 20%). */
  coinsurance: number;
  /** How much of the yearly out-of-pocket maximum is still unmet. */
  oopRemaining: number;
};

export type InsuredCost = {
  /** What the patient pays if the claim goes through the plan. */
  patientPays: number;
  /** The part of patientPays applied to the deductible. */
  towardDeductible: number;
};

/**
 * Patient cost for one service billed through a plan with a deductible, then
 * coinsurance, capped by the remaining out-of-pocket maximum. Copay-only plans
 * aren't modeled: for those the answer is just the copay.
 */
export function insuredCost(p: PlanInput): InsuredCost {
  const allowed = Math.max(0, p.allowedAmount);
  const ded = Math.min(allowed, Math.max(0, p.deductibleRemaining));
  const coins = (allowed - ded) * Math.min(1, Math.max(0, p.coinsurance));
  const patientPays = Math.min(Math.max(0, p.oopRemaining), ded + coins);
  return { patientPays: round2(patientPays), towardDeductible: round2(Math.min(ded, patientPays)) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type Comparison = {
  insured: InsuredCost;
  cashPrice: number;
  /** Positive when paying cash is cheaper today. */
  savingsToday: number;
  /**
   * If the plan does not credit the cash payment, the deductible and out-of-pocket
   * progress the patient gives up by paying cash. It only matters if they'd have
   * more covered care later in the same plan year.
   */
  progressGivenUp: number;
};

export function compare(plan: PlanInput, cashPrice: number): Comparison {
  const insured = insuredCost(plan);
  return {
    insured,
    cashPrice,
    savingsToday: round2(insured.patientPays - cashPrice),
    progressGivenUp: insured.patientPays,
  };
}

export type CreditRequestInput = {
  service: string;
  provider: string;
  dateOfService: string;
  cashPrice: number;
  allowedAmount: number;
  planName: string;
  memberId: string;
};

/** A letter asking the plan to count a cash payment toward the deductible and out-of-pocket maximum. */
export function buildCreditRequest(i: CreditRequestInput): string {
  const service = i.service.trim() || "[service]";
  const provider = i.provider.trim() || "[provider]";
  return `To: ${i.planName.trim() || "[health plan]"} member services
Member ID: ${i.memberId.trim() || "[member ID]"}

I'm asking you to apply a payment I made to my deductible and out-of-pocket maximum.

On ${i.dateOfService || "[date]"}, I paid ${formatUsd(i.cashPrice)} in cash to ${provider} for ${service}. Your own price for this service is ${formatUsd(i.allowedAmount)}, so my paying cash cost the plan nothing and saved me money.

Please:
1. Credit ${formatUsd(i.cashPrice)} toward my deductible and out-of-pocket maximum for this plan year.
2. If you won't, tell me in writing which plan provision prevents it, and how to appeal.
3. If my state requires plans to credit lower-cost cash payments, tell me how to file under that law.

I've attached the itemized receipt.

Thank you,
[Your name]
[Phone]`;
}

/** A prompt for an AI assistant to find cash prices for a service near the user. */
export function buildPriceShoppingPrompt(service: string, location: string, allowed: number, insuredPays: number): string {
  const s = service.trim() || "[the service I need]";
  const loc = location.trim() || "[my city and state]";
  return `I need ${s} and want to compare cash prices near ${loc} with what I'd pay through my insurance.

Through my plan, the allowed amount is ${allowed > 0 ? formatUsd(allowed) : "[unknown]"} and I'd pay about ${insuredPays > 0 ? formatUsd(insuredPays) : "[unknown]"} out of pocket.

Please:
1. Find hospitals, imaging centers, labs or surgery centers within about 30 miles that list a discounted cash (self-pay) price for this service. Hospitals must publish these prices under the federal hospital price transparency rule (45 CFR Part 180), in a machine-readable file and a list of shoppable services. Many independent centers post cash prices on their websites.
2. For each, give the price, what it includes (facility fee, professional/doctor fee, anesthesia, reading fee), and the link where you found it.
3. Tell me which options cost less than ${insuredPays > 0 ? formatUsd(insuredPays) : "my out-of-pocket amount"}.
4. Tell me whether my state has a law requiring health plans to count lower-cost cash payments toward the deductible, and cite the statute if it does.

Only use prices you can link to. If you can't find a price, say so and give me the phone number to ask.`;
}
