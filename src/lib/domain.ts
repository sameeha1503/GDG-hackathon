// Shared domain constants and pure helpers. Safe to import on client and server.

export type LangCode = "en" | "hi" | "or" | "mr" | "gu";

export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "or", label: "ଓଡ଼ିଆ" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
];

export const DISTRICTS = [
  "Bastar",
  "Kalahandi",
  "Nandurbar",
  "Dahod",
  "Jhabua",
  "Sundargarh",
];

export type PatientStatus =
  | "awaiting_confirmation"
  | "confirmed_unverified"
  | "confirmed_documented";

export type ConfirmedResult = "Non-carrier" | "Carrier" | "Disease";

export const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export const URGENCY_LEVELS = ["Emergency", "Urgent", "Routine"] as const;

export const AVAILABILITY = [
  "Available",
  "Contact via blood bank",
  "Currently unavailable",
] as const;

/** Overdue band for a confirmatory test, derived from days since screening. */
export type OverdueBand = "on_track" | "d7" | "d14" | "d21";

export function overdueBand(daysOverdue: number): OverdueBand {
  if (daysOverdue >= 21) return "d21";
  if (daysOverdue >= 14) return "d14";
  if (daysOverdue >= 7) return "d7";
  return "on_track";
}

export function daysSince(dateISO: string): number {
  const then = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`).getTime();
  const today = new Date();
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.round((now - then) / 86_400_000));
}

/** Which donor red-cell groups a recipient can receive (ABO/Rh only). */
const COMPATIBLE_DONORS: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export function isCompatible(recipient: string, donor: string): boolean {
  return (COMPATIBLE_DONORS[recipient] ?? []).includes(donor);
}

export const SCORE_WEIGHTS = {
  compatibility: 40,
  proximity: 25,
  availability: 20,
  responseHistory: 15,
};

export type ScoreBreakdown = {
  compatibility: number;
  proximity: number;
  availability: number;
  responseHistory: number;
  total: number;
};

/**
 * Transparent weighted score. This only orders donors for outreach — it is not
 * a medical determination and never decides suitability for transfusion.
 */
export function scoreDonor(input: {
  recipientGroup: string;
  donorGroup: string;
  distanceKm: number;
  availability: string;
  responseRate: number;
}): ScoreBreakdown {
  const exact = input.donorGroup === input.recipientGroup;
  const compatibility = exact
    ? SCORE_WEIGHTS.compatibility
    : isCompatible(input.recipientGroup, input.donorGroup)
      ? SCORE_WEIGHTS.compatibility * 0.75
      : 0;

  const proximity = Math.max(
    0,
    SCORE_WEIGHTS.proximity * (1 - Math.min(input.distanceKm, 25) / 25),
  );

  const availability =
    input.availability === "Available"
      ? SCORE_WEIGHTS.availability
      : input.availability === "Contact via blood bank"
        ? SCORE_WEIGHTS.availability * 0.5
        : 0;

  const responseHistory = SCORE_WEIGHTS.responseHistory * Math.min(1, Math.max(0, input.responseRate));

  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    compatibility: round(compatibility),
    proximity: round(proximity),
    availability: round(availability),
    responseHistory: round(responseHistory),
    total: round(compatibility + proximity + availability + responseHistory),
  };
}

/** Outreach radius per notification round (km). Round 3 = statewide list. */
export function roundRadiusKm(round: number): number {
  if (round <= 1) return 5;
  if (round === 2) return 15;
  return 10_000;
}
