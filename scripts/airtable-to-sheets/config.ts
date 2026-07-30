export const DEFAULT_BASE_ID = "appn7qavULQGZ6JNY";

// One tab per table, exported in this order. Names must match Airtable's
// table names exactly (case-sensitive) — the script looks each one up in
// the base schema before pulling any records.
export const TABLE_NAMES = [
  "Pediatricians — Autism Verified",
  "Speech Therapists — Autism Specialists",
  "Occupational Therapists — Autism Specialists",
  "Mental Health — Autism and Neurodivergent",
  "Sensory-Friendly Dentists — Autism Verified",
  "Habilitation Services — OPWDD Certified",
  "Housing and Residential — Autism Support",
  "Community Programs — Autism Inclusive",
  "Adult Primary Care — Autism Verified",
  "Provider Reviews — Community Verified",
  "ARD Staff and Team",
  "ARD Registered Families and Users",
  "ARD Capital Formation",
] as const;
