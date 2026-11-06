// HHS poverty guidelines for 2026, published in the Federal Register on
// January 15, 2026 (91 FR 1797, document 2026-00755). Each table is linear:
// the one-person amount plus a fixed amount for every additional person.
export const FPL_YEAR = 2026;
export const FPL_SOURCE_URL = "https://www.govinfo.gov/content/pkg/FR-2026-01-15/html/2026-00755.htm";

export type FplRegion = "contiguous" | "alaska" | "hawaii";

const TABLES: Record<FplRegion, { base: number; perPerson: number }> = {
  contiguous: { base: 15960, perPerson: 5680 },
  alaska: { base: 19950, perPerson: 7100 },
  hawaii: { base: 18360, perPerson: 6530 },
};

export const US_STATES: { code: string; name: string }[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

export function regionForState(stateCode: string): FplRegion {
  if (stateCode === "AK") return "alaska";
  if (stateCode === "HI") return "hawaii";
  return "contiguous";
}

/** Annual 100% poverty guideline for a household, or null for invalid sizes. */
export function povertyGuideline(householdSize: number, region: FplRegion): number | null {
  if (!Number.isInteger(householdSize) || householdSize < 1) return null;
  const t = TABLES[region];
  return t.base + (householdSize - 1) * t.perPerson;
}

/** Household income as a percent of the poverty guideline, rounded to a whole percent. */
export function percentOfFpl(annualIncome: number, householdSize: number, region: FplRegion): number | null {
  const guideline = povertyGuideline(householdSize, region);
  if (guideline === null || !Number.isFinite(annualIncome) || annualIncome < 0) return null;
  return Math.round((annualIncome / guideline) * 100);
}

/** Cutoffs that hospital financial assistance policies commonly use. Each hospital sets its own. */
export const COMMON_CUTOFFS = [100, 150, 200, 250, 300, 400, 500, 600];

export function formatUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
