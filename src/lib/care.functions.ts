import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CareRecord = {
  record_id: string;
  patient_id: string;
  mock_abha_id: string;
  confirmed_result: string;
  confirmatory_status: string;
  treatment_status: string;
  last_updated_facility: string;
  last_updated_date: string;
  patient_name?: string;
  patient_code?: string;
  district?: string;
};

function makeRecordId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `RL-${out}`;
}

/** Documented patients plus their care record (if one exists yet). */
export const listCareRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: patients, error } = await context.supabase
      .from("patients")
      .select("id, patient_code, name, district, phc, status, confirmed_result, report_reference")
      .eq("status", "confirmed_documented")
      .order("name");
    if (error) throw new Error(error.message);

    const { data: records, error: recordError } = await context.supabase
      .from("care_records")
      .select("*");
    if (recordError) throw new Error(recordError.message);

    const byPatient = new Map((records ?? []).map((r) => [r.patient_id, r]));
    return (patients ?? []).map((p) => ({
      patient: p,
      record: (byPatient.get(p.id) ?? null) as CareRecord | null,
    }));
  });

export const createCareRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        patientId: z.string().uuid(),
        facility: z.string().min(2).max(80),
        treatmentStatus: z.string().min(2).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // HARD RULE, enforced server-side and independently of the UI: a care record
    // may only exist for a patient whose confirmatory test is documented.
    const { data: patient, error } = await context.supabase
      .from("patients")
      .select("id, status, confirmed_result, patient_code")
      .eq("id", data.patientId)
      .single();
    if (error || !patient) throw new Error("Patient not found");
    if (patient.status !== "confirmed_documented" || !patient.confirmed_result) {
      throw new Error(
        "Rejected: a portable care record needs a documented confirmatory result.",
      );
    }

    // FUTURE INTEGRATION POINT: the real ABHA number would be fetched/linked
    // through the ABDM ABHA API here. Government empanelment is required, so a
    // clearly-labelled simulated value is generated instead.
    const mockAbha = `12-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(
      1000 + Math.random() * 8999,
    )}-${Math.floor(1000 + Math.random() * 8999)} (simulated)`;

    const { data: row, error: insertError } = await context.supabase
      .from("care_records")
      .insert({
        record_id: makeRecordId(),
        patient_id: patient.id,
        mock_abha_id: mockAbha,
        confirmed_result: patient.confirmed_result,
        confirmatory_status: "confirmed_documented",
        treatment_status: data.treatmentStatus,
        last_updated_facility: data.facility,
        last_updated_date: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);
    return row;
  });

export const updateCareRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        recordId: z.string().min(4).max(20),
        treatmentStatus: z.string().min(2).max(200),
        facility: z.string().min(2).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("care_records")
      .update({
        treatment_status: data.treatmentStatus,
        last_updated_facility: data.facility,
        last_updated_date: new Date().toISOString(),
      })
      .eq("record_id", data.recordId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Full record — signed-in health workers only. */
export const getCareRecord = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reference: z.string().min(3).max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const reference = data.reference.trim().toUpperCase();
    const { data: record } = await context.supabase
      .from("care_records")
      .select("*")
      .eq("record_id", reference)
      .maybeSingle();
    if (!record) return { found: false as const };

    const { data: patient } = await context.supabase
      .from("patients")
      .select("patient_code, name, district, phc, screening_date, report_reference")
      .eq("id", record.patient_id)
      .maybeSingle();

    return { found: true as const, record, patient };
  });

/**
 * Unauthenticated lookup. Deliberately returns existence only — no medical
 * detail ever leaves the server without a signed-in health worker.
 */
export const publicLookupRecord = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ reference: z.string().min(3).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reference = data.reference.trim().toUpperCase();
    const { data: record } = await supabaseAdmin
      .from("care_records")
      .select("record_id")
      .eq("record_id", reference)
      .maybeSingle();
    return { exists: Boolean(record) };
  });
