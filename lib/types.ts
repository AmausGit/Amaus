export type ProtocolType =
  | "colon_cleanse"
  | "liver_cleanse"
  | "kidney_therapy"
  | "cancer_protocol"
  | "diet"
  | "other";

export const PROTOCOL_TYPES: { value: ProtocolType; label: string }[] = [
  { value: "colon_cleanse", label: "Colon Cleanse" },
  { value: "liver_cleanse", label: "Liver Cleanse" },
  { value: "kidney_therapy", label: "Kidney Therapy" },
  { value: "cancer_protocol", label: "Cancer Protocol" },
  { value: "diet", label: "Diet" },
  { value: "other", label: "Other" },
];

export type Feeling = "good" | "bad" | "ugly";

export interface Protocol {
  id: number;
  name: string;
  protocol_type: ProtocolType;
  creator_name: string | null;
  creator_credentials: string | null;
  company: string | null;
  product_name: string | null;
  dosage_per_use: string | null;
  course_duration: string | null;
  begin_date: string | null;
  end_date: string | null;
  dosage_schedule_time: string | null;
  salient_notes: string | null;
  interaction_warnings: string | null;
  expected_timeline: string | null;
  public_reviews_summary: string | null;
  public_benchmark_rating: number | null;
  receipt_image_path: string | null;
  receipt_ocr_text: string | null;
  receipt_date: string | null;
  receipt_amount: string | null;
  receipt_store: string | null;
  return_window: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperienceLog {
  id: number;
  protocol_id: number;
  timestamp: string;
  dose_taken: number; // 0 | 1
  ease_of_use: number | null; // 1-5
  feeling: string | null; // good | bad | ugly | free text
  rating: number; // 1-10
  would_recommend: number | null; // 0 | 1 | null
  notes: string | null;
}

export interface DisclaimerAcceptance {
  id: number;
  accepted_at: string;
  user_agent: string | null;
}

export interface ProtocolWithStatus extends Protocol {
  last_log_timestamp: string | null;
}

export function formatProtocolId(id: number): string {
  return `P-${String(id).padStart(3, "0")}`;
}
