import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, MessageSquare, Plus, PhoneCall, CheckCircle2 } from "lucide-react";
import { Card, OfflineBanner, SectionHeading } from "@/components/AppShell";
import {
  closePatient,
  createPatient,
  listPatients,
  listReminders,
  sendReminder,
  type PatientRow,
} from "@/lib/patients.functions";
import { DISTRICTS, LANGUAGES, overdueBand, type LangCode } from "@/lib/domain";
import { useI18n } from "@/lib/i18n";
import { guardedRead, useOffline } from "@/lib/offline";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tracker")({
  head: () => ({
    meta: [
      { title: "Confirmatory test follow-up — Rakt-Link" },
      {
        name: "description",
        content:
          "Track field-screened people awaiting a confirmatory HPLC test, with 7/14/21 day overdue flags and multilingual reminders.",
      },
      { property: "og:title", content: "Confirmatory test follow-up — Rakt-Link" },
      {
        property: "og:description",
        content: "Overdue flags, reminder log and closing outcomes for confirmatory sickle cell testing.",
      },
    ],
  }),
  component: TrackerPage,
});

const BAND_STYLES: Record<string, string> = {
  on_track: "bg-secondary text-secondary-foreground",
  d7: "bg-warn/25 text-warn-foreground",
  d14: "bg-warn/45 text-warn-foreground",
  d21: "bg-destructive/15 text-destructive",
};

const BAND_LABEL: Record<string, string> = {
  on_track: "On track",
  d7: "Overdue 7+ days",
  d14: "Overdue 14+ days",
  d21: "Overdue 21+ days",
};

const STATUS_LABEL: Record<string, string> = {
  awaiting_confirmation: "Awaiting confirmation",
  confirmed_unverified: "Tested, no report seen",
  confirmed_documented: "Documented result",
};

function TrackerPage() {
  const { t } = useI18n();
  const { offline, lastSynced } = useOffline();
  const queryClient = useQueryClient();
  const fetchPatients = useServerFn(listPatients);

  const bandLabel: Record<string, string> = {
    on_track: t("m1.band.on_track"),
    d7: t("m1.band.d7"),
    d14: t("m1.band.d14"),
    d21: t("m1.band.d21"),
  };

  const statusLabel: Record<string, string> = {
    awaiting_confirmation: t("m1.status.awaiting"),
    confirmed_unverified: t("m1.status.unverified"),
    confirmed_documented: t("m1.status.documented"),
  };

  const [statusFilter, setStatusFilter] = useState("awaiting_confirmation");
  const [bandFilter, setBandFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"waiting" | "name">("waiting");
  const [search, setSearch] = useState("");
  const [showIntake, setShowIntake] = useState(false);
  const [reminderFor, setReminderFor] = useState<PatientRow | null>(null);
  const [closeFor, setCloseFor] = useState<PatientRow | null>(null);

  const patients = useQuery({
    queryKey: ["patients"],
    queryFn: () => guardedRead(() => fetchPatients()),
    retry: false,
  });

  const rows = useMemo(() => {
    const list = (patients.data ?? []).filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (districtFilter !== "all" && p.district !== districtFilter) return false;
      if (bandFilter !== "all" && overdueBand(p.days_waiting) !== bandFilter) return false;
      if (search && !`${p.name} ${p.patient_code}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
    return list.sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) : b.days_waiting - a.days_waiting,
    );
  }, [patients.data, statusFilter, districtFilter, bandFilter, search, sortBy]);

  const counts = useMemo(() => {
    const waiting = (patients.data ?? []).filter((p) => p.status === "awaiting_confirmation");
    return {
      waiting: waiting.length,
      d7: waiting.filter((p) => overdueBand(p.days_waiting) === "d7").length,
      d14: waiting.filter((p) => overdueBand(p.days_waiting) === "d14").length,
      d21: waiting.filter((p) => overdueBand(p.days_waiting) === "d21").length,
    };
  }, [patients.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["care-records"] });
    queryClient.invalidateQueries({ queryKey: ["eligible-patients"] });
  };

  return (
    <>
      <SectionHeading title={t("m1.title")} subtitle={t("m1.subtitle")} />
      {offline && <OfflineBanner lastSynced={lastSynced} />}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("m1.stat.waiting"), value: counts.waiting, tone: "bg-secondary" },
          { label: t("m1.stat.d7"), value: counts.d7, tone: "bg-warn/25" },
          { label: t("m1.stat.d14"), value: counts.d14, tone: "bg-warn/45" },
          { label: t("m1.stat.d21"), value: counts.d21, tone: "bg-destructive/15" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border border-border p-4", s.tone)}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block font-semibold">{t("common.search")}</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("m1.searchPlaceholder")}
              className="mt-1 rounded-xl border border-input bg-background px-3 py-2 text-base"
            />
          </label>
          <label className="text-sm">
            <span className="block font-semibold">{t("m1.filter.status")}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 rounded-xl border border-input bg-background px-3 py-2 text-base"
            >
              <option value="all">{t("common.all")}</option>
              {Object.entries(statusLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block font-semibold">{t("m1.filter.band")}</span>
            <select
              value={bandFilter}
              onChange={(e) => setBandFilter(e.target.value)}
              className="mt-1 rounded-xl border border-input bg-background px-3 py-2 text-base"
            >
              <option value="all">{t("common.all")}</option>
              {Object.entries(bandLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block font-semibold">{t("m1.filter.district")}</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="mt-1 rounded-xl border border-input bg-background px-3 py-2 text-base"
            >
              <option value="all">{t("common.all")}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block font-semibold">{t("m1.filter.sort")}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "waiting" | "name")}
              className="mt-1 rounded-xl border border-input bg-background px-3 py-2 text-base"
            >
              <option value="waiting">{t("m1.sort.waiting")}</option>
              <option value="name">{t("m1.sort.name")}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowIntake((v) => !v)}
            className="ml-auto flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
          >
            <Plus className="size-5" /> {t("m1.add")}
          </button>
        </div>
      </Card>

      {showIntake && <IntakeForm onDone={() => { setShowIntake(false); invalidate(); }} />}

      {patients.isError && !patients.data && (
        <Card className="mb-4 border-warn bg-warn/10">
          <p className="text-sm">
            No saved copy on this device yet. Turn demo offline mode off to load the list.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {rows.map((p) => {
          const band = overdueBand(p.days_waiting);
          return (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-52 flex-1">
                  <p className="text-lg font-bold">{p.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{p.patient_code}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.phc}, {p.district} · screened {p.screening_date} ·{" "}
                    {LANGUAGES.find((l) => l.code === p.preferred_language)?.label}
                  </p>
                </div>

                <div className="text-sm">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold",
                      BAND_STYLES[band],
                    )}
                  >
                    {band !== "on_track" && <AlertTriangle className="size-4" />}
                    {p.status === "awaiting_confirmation"
                      ? `${p.days_waiting} ${t("common.days")} — ${bandLabel[band]}`
                      : statusLabel[p.status]}
                  </span>
                  {p.status === "confirmed_documented" && (
                    <p className="mt-2 text-sm">
                      <strong>{p.confirmed_result}</strong> · report {p.report_reference}
                    </p>
                  )}
                  {p.status === "confirmed_unverified" && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Patient says they were tested, but no report slip has been seen. No care record
                      or donor request can be opened.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.reminders_sent} reminder{p.reminders_sent === 1 ? "" : "s"} logged
                  </p>
                </div>

                {p.status === "awaiting_confirmation" && (
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setReminderFor(p)}
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
                    >
                      <MessageSquare className="size-4" /> {t("m1.reminder")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloseFor(p)}
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      <CheckCircle2 className="size-4" /> {t("m1.close")}
                    </button>
                  </div>
                )}
              </div>

              {reminderFor?.id === p.id && (
                <ReminderPanel patient={p} onDone={() => { setReminderFor(null); invalidate(); }} />
              )}
              {closeFor?.id === p.id && (
                <ClosePanel patient={p} onDone={() => { setCloseFor(null); invalidate(); }} />
              )}
            </Card>
          );
        })}
        {rows.length === 0 && !patients.isLoading && (
          <Card>
            <p className="text-sm text-muted-foreground">Nobody matches these filters.</p>
          </Card>
        )}
      </div>
    </>
  );
}

function IntakeForm({ onDone }: { onDone: () => void }) {
  const add = useServerFn(createPatient);
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    preferred_language: "hi" as LangCode,
    district: DISTRICTS[0],
    phc: "",
    screening_date: new Date().toISOString().slice(0, 10),
  });

  const mutation = useMutation({
    mutationFn: () => add({ data: form }),
    onSuccess: (row) => {
      toast.success(`Added ${row.patient_code}`);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="mb-5">
      <h2 className="text-lg font-bold">Add a screened person</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        In production this list would arrive from the national screening database; manual entry
        stands in for that feed here.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="text-sm">
          <span className="block font-semibold">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Phone number</span>
          <input
            required
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Preferred language</span>
          <select
            value={form.preferred_language}
            onChange={(e) => setForm({ ...form, preferred_language: e.target.value as LangCode })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">District</span>
          <select
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">PHC / sub-centre</span>
          <input
            required
            value={form.phc}
            onChange={(e) => setForm({ ...form, phc: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Screening date</span>
          <input
            type="date"
            required
            value={form.screening_date}
            onChange={(e) => setForm({ ...form, screening_date: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            Save to tracker
          </button>
        </div>
      </form>
    </Card>
  );
}

function ReminderPanel({ patient, onDone }: { patient: PatientRow; onDone: () => void }) {
  const send = useServerFn(sendReminder);
  const fetchLog = useServerFn(listReminders);
  const [language, setLanguage] = useState<LangCode>(patient.preferred_language as LangCode);
  const [channel, setChannel] = useState<"SMS" | "IVR">("SMS");
  const queryClient = useQueryClient();

  const log = useQuery({
    queryKey: ["reminders", patient.id],
    queryFn: () => fetchLog({ data: { patientId: patient.id } }),
  });

  const mutation = useMutation({
    mutationFn: () => send({ data: { patientId: patient.id, channel, language } }),
    onSuccess: (res) => {
      toast.success(`${channel} reminder logged`, { description: res.message });
      queryClient.invalidateQueries({ queryKey: ["reminders", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
      <h3 className="font-bold">Reminder for {patient.name}</h3>
      <p className="text-sm text-muted-foreground">
        Simulated dispatch: the message is recorded in the activity log. No SMS or call is actually
        sent in this demonstration environment.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block font-semibold">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LangCode)}
            className="mt-1 rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Channel</span>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as "SMS" | "IVR")}
            className="mt-1 rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            <option value="SMS">SMS</option>
            <option value="IVR">IVR voice call</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60"
        >
          <PhoneCall className="size-4" /> Send now
        </button>
        <button type="button" onClick={onDone} className="rounded-xl border border-border px-4 py-2 font-semibold">
          Done
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {(log.data ?? []).map((entry) => (
          <li key={entry.id} className="rounded-xl border border-border bg-card p-3 text-sm">
            <p className="text-xs text-muted-foreground">
              {entry.channel} · {entry.language} · {new Date(entry.sent_at).toLocaleString()}
            </p>
            <p className="mt-1">{entry.message}</p>
          </li>
        ))}
        {(log.data ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">No reminders logged yet.</li>
        )}
      </ul>
    </div>
  );
}

function ClosePanel({ patient, onDone }: { patient: PatientRow; onDone: () => void }) {
  const close = useServerFn(closePatient);
  const [outcome, setOutcome] = useState<"confirmed_unverified" | "confirmed_documented">(
    "confirmed_documented",
  );
  const [reportReference, setReportReference] = useState("");
  const [result, setResult] = useState<"Non-carrier" | "Carrier" | "Disease">("Carrier");

  const mutation = useMutation({
    mutationFn: () =>
      close({
        data:
          outcome === "confirmed_documented"
            ? { outcome, patientId: patient.id, reportReference, result }
            : { outcome, patientId: patient.id },
      }),
    onSuccess: () => {
      toast.success("Record closed");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
      <h3 className="font-bold">Close the follow-up for {patient.name}</h3>
      <div className="mt-3 space-y-3">
        <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
          <input
            type="radio"
            name={`outcome-${patient.id}`}
            checked={outcome === "confirmed_documented"}
            onChange={() => setOutcome("confirmed_documented")}
            className="mt-1"
          />
          <span>
            <strong>Report slip seen</strong> — the confirmatory report is in hand. This unlocks the
            portable care record.
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
          <input
            type="radio"
            name={`outcome-${patient.id}`}
            checked={outcome === "confirmed_unverified"}
            onChange={() => setOutcome("confirmed_unverified")}
            className="mt-1"
          />
          <span>
            <strong>Says tested, no report seen</strong> — the follow-up stops here, but nothing
            downstream is unlocked.
          </span>
        </label>

        {outcome === "confirmed_documented" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-semibold">Report slip reference</span>
              <input
                value={reportReference}
                onChange={(e) => setReportReference(e.target.value)}
                placeholder="HPLC/2026/00123"
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold">Confirmatory result</span>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as typeof result)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
              >
                <option value="Non-carrier">Non-carrier</option>
                <option value="Carrier">Carrier</option>
                <option value="Disease">Disease</option>
              </select>
            </label>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              (outcome === "confirmed_documented" && reportReference.trim().length < 3)
            }
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            Close record
          </button>
          <button type="button" onClick={onDone} className="rounded-xl border border-border px-5 py-3 font-semibold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
