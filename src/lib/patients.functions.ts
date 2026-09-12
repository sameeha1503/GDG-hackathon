import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildReminder } from "./templates";
import type { LangCode } from "./domain";

// NOTE (future integration point): in production this intake would be replaced
// by a feed from the government's NSCAEM screening database. Manual entry here
// simulates that feed.

export type PatientRow = {
  id: string;
  patient_code: string;
  name: string;
  phone_number: string;
  preferred_language: string;
  district: string;
  phc: string;
  screening_date: string;
  status: string;
  confirmed_result: string | null;
  report_reference: string | null;
  closed_at: string | null;
  days_waiting: number;
  reminders_sent: number;
};

function daysBetween(dateISO: string): number {
  const then = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / 86_400_000));
}

export const listPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PatientRow[]> => {
    const { data: patients, error } = await context.supabase
      .from("patients")
      .select("*")
      .order("screening_date", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: reminders } = await context.supabase
      .from("reminder_log")
      .select("patient_id");

    const counts = new Map<string, number>();
    for (const r of reminders ?? []) {
      counts.set(r.patient_id, (counts.get(r.patient_id) ?? 0) + 1);
    }

    // Days waiting is derived on read from screening_date — no cron job needed.
    return (patients ?? []).map((p) => ({
      ...p,
      days_waiting: daysBetween(p.screening_date),
      reminders_sent: counts.get(p.id) ?? 0,
    })) as PatientRow[];
  });

export const createPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(2).max(80),
        phone_number: z.string().min(6).max(15),
        preferred_language: z.enum(["en", "hi", "or", "mr", "gu"]),
        district: z.string().min(2).max(60),
        phc: z.string().min(2).max(80),
        screening_date: z.string().min(10).max(10),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const code = `NSC-${Math.floor(1000 + Math.random() * 8999)}`;
    const { data: row, error } = await context.supabase
      .from("patients")
      .insert({ ...data, patient_code: code, status: "awaiting_confirmation" })
      .select("id, patient_code")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const sendReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        patientId: z.string().uuid(),
        channel: z.enum(["SMS", "IVR"]),
        language: z.enum(["en", "hi", "or", "mr", "gu"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: patient, error } = await context.supabase
      .from("patients")
      .select("id, name, phc, screening_date, status")
      .eq("id", data.patientId)
      .single();
    if (error || !patient) throw new Error("Patient not found");
    if (patient.status !== "awaiting_confirmation") {
      throw new Error("This record is already closed — no reminder is needed.");
    }

    // Simulated dispatch only: the message is written to the activity log.
    // A real SMS/IVR provider would be called here.
    const message = buildReminder(data.language as LangCode, {
      name: patient.name,
      phc: patient.phc,
      days: daysBetween(patient.screening_date),
    });

    const { error: insertError } = await context.supabase.from("reminder_log").insert({
      patient_id: patient.id,
      channel: data.channel,
      language: data.language,
      message,
      sent_by: context.userId,
    });
    if (insertError) throw new Error(insertError.message);
    return { message };
  });

export const listReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ patientId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("reminder_log")
      .select("id, channel, language, message, sent_at")
      .eq("patient_id", data.patientId)
      .order("sent_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const closePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .discriminatedUnion("outcome", [
        z.object({
          outcome: z.literal("confirmed_unverified"),
          patientId: z.string().uuid(),
        }),
        z.object({
          outcome: z.literal("confirmed_documented"),
          patientId: z.string().uuid(),
          reportReference: z.string().min(3).max(60),
          result: z.enum(["Non-carrier", "Carrier", "Disease"]),
        }),
      ])
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch =
      data.outcome === "confirmed_documented"
        ? {
            status: "confirmed_documented",
            report_reference: data.reportReference,
            confirmed_result: data.result,
            closed_at: new Date().toISOString(),
          }
        : {
            status: "confirmed_unverified",
            report_reference: null,
            confirmed_result: null,
            closed_at: new Date().toISOString(),
          };

    const { error } = await context.supabase
      .from("patients")
      .update(patch)
      .eq("id", data.patientId)
      .eq("status", "awaiting_confirmation");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
