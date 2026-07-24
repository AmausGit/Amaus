export type TagCategory = "energy" | "digestive" | "mood" | "sleep" | "pain";
export type TagPolarity = "positive" | "negative";

interface TagRule {
  category: TagCategory;
  polarity: TagPolarity;
  keywords: string[];
}

const TAG_RULES: TagRule[] = [
  {
    category: "energy",
    polarity: "negative",
    keywords: ["tired", "fatigue", "fatigued", "exhausted", "drained", "sluggish", "lethargic", "low energy"],
  },
  {
    category: "energy",
    polarity: "positive",
    keywords: ["energized", "energetic", "refreshed", "great energy", "more energy", "revitalized"],
  },
  {
    category: "digestive",
    polarity: "negative",
    keywords: ["bloated", "bloating", "gassy", "gas", "nauseous", "nausea", "cramping", "cramps", "diarrhea", "constipated", "constipation", "upset stomach"],
  },
  {
    category: "digestive",
    polarity: "positive",
    keywords: ["regular", "smooth digestion", "settled stomach", "digestion improved"],
  },
  {
    category: "mood",
    polarity: "negative",
    keywords: ["irritable", "anxious", "anxiety", "foggy", "brain fog", "depressed", "moody", "stressed", "cranky"],
  },
  {
    category: "mood",
    polarity: "positive",
    keywords: ["happy", "calm", "clear-headed", "clear headed", "focused", "positive", "good mood"],
  },
  {
    category: "sleep",
    polarity: "negative",
    keywords: ["insomnia", "restless", "couldn't sleep", "woke up", "poor sleep", "trouble sleeping"],
  },
  {
    category: "sleep",
    polarity: "positive",
    keywords: ["slept well", "rested", "good sleep", "well rested"],
  },
  {
    category: "pain",
    polarity: "negative",
    keywords: ["headache", "migraine", "pain", "ache", "aching", "sore", "soreness", "joint pain"],
  },
];

export interface TagHit {
  category: TagCategory;
  polarity: TagPolarity;
  keyword: string;
}

export function extractTags(text: string | null | undefined): TagHit[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const hits: TagHit[] = [];
  for (const rule of TAG_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        hits.push({ category: rule.category, polarity: rule.polarity, keyword });
      }
    }
  }
  return hits;
}

export interface TagSummary {
  category: TagCategory;
  positive: number;
  negative: number;
}

export function summarizeTags(allText: (string | null | undefined)[]): TagSummary[] {
  const counts = new Map<TagCategory, { positive: number; negative: number }>();
  for (const text of allText) {
    const hits = extractTags(text);
    const seenThisEntry = new Set<string>();
    for (const hit of hits) {
      const key = `${hit.category}:${hit.polarity}`;
      if (seenThisEntry.has(key)) continue;
      seenThisEntry.add(key);
      const entry = counts.get(hit.category) ?? { positive: 0, negative: 0 };
      entry[hit.polarity] += 1;
      counts.set(hit.category, entry);
    }
  }
  return Array.from(counts.entries()).map(([category, v]) => ({ category, ...v }));
}
