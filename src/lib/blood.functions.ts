import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isCompatible, roundRadiusKm, scoreDonor, type ScoreBreakdown } from "./domain";

export type SafeDonor = {
  id: string;
  donor_code: string;
  blood_group: string;
  general_location: string;
  distance_km: number;
  availability_status: string;
  past_donation_count: number;
  response_rate: number;
};

// PRIVACY: private_phone is never selected, so a donor's contact number can not
// leave the server. Distance is coarse (km) and location is an area name only.
const SAFE_DONOR_COLUMNS =
  "id, donor_code, blood_group, general_location, distance_km, availability_status, past_donation_count, response_rate";

/** Patients eligible for this module: documented AND living with the disease. */
export const listEligiblePatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("patients")
      .select("id, patient_code, name, district, phc")
      .eq("status", "confirmed_documented")
      .eq("confirmed_result", "Disease")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listDonors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SafeDonor[]> => {
    const { data, error } = await context.supabase
      .from("donors")
      .select(SAFE_DONOR_COLUMNS)
      .order("donor_code");
    if (error) throw new Error(error.message);
    return (data ?? []) as SafeDonor[];
  });

export const registerDonor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        blood_group: z.string().min(2).max(3),
        general_location: z.string().min(2).max(80),
        distance_km: z.number().min(0).max(500),
        availability_status: z.enum([
          "Available",
          "Contact via blood bank",
          "Currently unavailable",
        ]),
        past_donation_count: z.number().int().min(0).max(200),
        private_phone: z.string().min(6).max(15),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("donors")
      .insert({
        ...data,
        donor_code: `DN-${Math.floor(1000 + Math.random() * 8999)}`,
        response_rate: 0.5,
      })
      .select("id, donor_code")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export type RequestRow = {
  id: string;
  request_code: string;
  patient_id: string;
  blood_group_needed: string;
  component: string;
  units_needed: number;
  hospital_name: string;
  required_by: string;
  urgency_level: string;
  notification_round: number;
  status: string;
  confirmed_donor_id: string | null;
  created_at: string;
  patient_name: string;
  patient_code: string;
  notified: number;
  accepted: number;
  declined: number;
};

export const listRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RequestRow[]> => {
    const { data: requests, error } = await context.supabase
      .from("blood_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: patients } = await context.supabase
      .from("patients")
      .select("id, name, patient_code");
    const { data: notifications } = await context.supabase
      .from("request_notifications")
      .select("request_id, response");

    const nameById = new Map((patients ?? []).map((p) => [p.id, p]));
    return (requests ?? []).map((r) => {
      const rows = (notifications ?? []).filter((n) => n.request_id === r.id);
      return {
        ...r,
        patient_name: nameById.get(r.patient_id)?.name ?? "—",
        patient_code: nameById.get(r.patient_id)?.patient_code ?? "—",
        notified: rows.length,
        accepted: rows.filter((n) => n.response === "accepted").length,
        declined: rows.filter((n) => n.response === "declined").length,
      } as RequestRow;
    });
  });

export const createBloodRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        patientId: z.string().uuid(),
        blood_group_needed: z.string().min(2).max(3),
        component: z.string().min(2).max(60),
        units_needed: z.number().int().min(1).max(10),
        hospital_name: z.string().min(2).max(120),
        required_by: z.string().min(10).max(10),
        urgency_level: z.enum(["Emergency", "Urgent", "Routine"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // HARD RULE, enforced server-side: only a documented patient whose result is
    // Disease may trigger the donor network.
    const { data: patient, error } = await context.supabase
      .from("patients")
      .select("id, status, confirmed_result")
      .eq("id", data.patientId)
      .single();
    if (error || !patient) throw new Error("Patient not found");
    if (patient.status !== "confirmed_documented" || patient.confirmed_result !== "Disease") {
      throw new Error(
        "Rejected: blood requests are limited to patients with a documented sickle cell disease result.",
      );
    }

    const { patientId, ...rest } = data;
    const { data: row, error: insertError } = await context.supabase
      .from("blood_requests")
      .insert({
        ...rest,
        patient_id: patientId,
        request_code: `BR-${Math.floor(5000 + Math.random() * 4999)}`,
        notification_round: 1,
        status: "open",
      })
      .select("id, request_code")
      .single();
    if (insertError) throw new Error(insertError.message);

    await notifyRound(context.supabase, row.id, 1);
    return row;
  });

type SupabaseLike = { from: (table: string) => any };

/** Insert notification rows for every compatible donor inside the round radius. */
async function notifyRound(supabase: SupabaseLike, requestId: string, round: number) {
  const { data: request } = await supabase
    .from("blood_requests")
    .select("id, blood_group_needed")
    .eq("id", requestId)
    .single();
  if (!request) return;

  const { data: donors } = await supabase.from("donors").select(SAFE_DONOR_COLUMNS);
  const radius = roundRadiusKm(round);
  const targets = (donors ?? []).filter(
    (d: SafeDonor) =>
      isCompatible(request.blood_group_needed, d.blood_group) &&
      Number(d.distance_km) <= radius &&
      d.availability_status !== "Currently unavailable",
  );

  const { data: existing } = await supabase
    .from("request_notifications")
    .select("donor_id")
    .eq("request_id", requestId);
  const already = new Set((existing ?? []).map((e: { donor_id: string }) => e.donor_id));

  const fresh = targets
    .filter((d: SafeDonor) => !already.has(d.id))
    .map((d: SafeDonor) => ({
      request_id: requestId,
      donor_id: d.id,
      round,
      response: "pending",
    }));

  if (fresh.length > 0) {
    await supabase.from("request_notifications").insert(fresh);
  }
}

export const advanceRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error } = await context.supabase
      .from("blood_requests")
      .select("id, notification_round, status")
      .eq("id", data.requestId)
      .single();
    if (error || !request) throw new Error("Request not found");
    if (request.status !== "open") throw new Error("This request is already closed.");

    const nextRound = Math.min(3, request.notification_round + 1);
    await context.supabase
      .from("blood_requests")
      .update({ notification_round: nextRound })
      .eq("id", request.id);
    await notifyRound(context.supabase, request.id, nextRound);
    return { round: nextRound };
  });

export const confirmDonor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ requestId: z.string().uuid(), donorId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("request_notifications")
      .update({ response: "accepted" })
      .eq("request_id", data.requestId)
      .eq("donor_id", data.donorId);
    const { error } = await context.supabase
      .from("blood_requests")
      .update({ status: "confirmed", confirmed_donor_id: data.donorId })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type RankedDonor = SafeDonor & {
  score: ScoreBreakdown;
  notified_round: number | null;
  response: string | null;
};

export const rankedDonors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<RankedDonor[]> => {
    const { data: request, error } = await context.supabase
      .from("blood_requests")
      .select("id, blood_group_needed, notification_round")
      .eq("id", data.requestId)
      .single();
    if (error || !request) throw new Error("Request not found");

    const { data: donors } = await context.supabase.from("donors").select(SAFE_DONOR_COLUMNS);
    const { data: notifications } = await context.supabase
      .from("request_notifications")
      .select("donor_id, round, response")
      .eq("request_id", request.id);

    const notifiedBy = new Map(
      (notifications ?? []).map((n) => [n.donor_id, n] as const),
    );
    const radius = roundRadiusKm(request.notification_round);

    return ((donors ?? []) as SafeDonor[])
      .filter((d) => isCompatible(request.blood_group_needed, d.blood_group))
      .filter((d) => Number(d.distance_km) <= radius || notifiedBy.has(d.id))
      .map((d) => ({
        ...d,
        score: scoreDonor({
          recipientGroup: request.blood_group_needed,
          donorGroup: d.blood_group,
          distanceKm: Number(d.distance_km),
          availability: d.availability_status,
          responseRate: Number(d.response_rate),
        }),
        notified_round: notifiedBy.get(d.id)?.round ?? null,
        response: notifiedBy.get(d.id)?.response ?? null,
      }))
      .sort((a, b) => b.score.total - a.score.total);
  });

export const bloodDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: requests } = await context.supabase.from("blood_requests").select("*");
    const { data: notifications } = await context.supabase
      .from("request_notifications")
      .select("request_id, response");
    const { data: donors } = await context.supabase.from("donors").select("id, availability_status");

    const open = (requests ?? []).filter((r) => r.status === "open");
    return {
      byUrgency: {
        Emergency: open.filter((r) => r.urgency_level === "Emergency").length,
        Urgent: open.filter((r) => r.urgency_level === "Urgent").length,
        Routine: open.filter((r) => r.urgency_level === "Routine").length,
      },
      openRequests: open.length,
      confirmedRequests: (requests ?? []).filter((r) => r.status === "confirmed").length,
      notificationsSent: (notifications ?? []).length,
      acceptedResponses: (notifications ?? []).filter((n) => n.response === "accepted").length,
      donorsAvailable: (donors ?? []).filter((d) => d.availability_status === "Available").length,
      donorsTotal: (donors ?? []).length,
    };
  });
