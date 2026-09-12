import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { EyeOff, Radio, ShieldCheck, UserPlus } from "lucide-react";
import { Card, OfflineBanner, SectionHeading } from "@/components/AppShell";
import {
  advanceRound,
  bloodDashboard,
  confirmDonor,
  createBloodRequest,
  listDonors,
  listEligiblePatients,
  listRequests,
  rankedDonors,
  registerDonor,
} from "@/lib/blood.functions";
import { AVAILABILITY, BLOOD_GROUPS, SCORE_WEIGHTS, URGENCY_LEVELS, roundRadiusKm } from "@/lib/domain";
import { useI18n } from "@/lib/i18n";
import { guardedRead, useOffline } from "@/lib/offline";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/donors")({
  head: () => ({
    meta: [
      { title: "Blood donor availability — Rakt-Link" },
      {
        name: "description",
        content:
          "Create blood requests for documented sickle cell disease patients, see transparent donor ranking and staged outreach rounds.",
      },
      { property: "og:title", content: "Blood donor availability — Rakt-Link" },
      {
        property: "og:description",
        content: "Transparent donor matching and privacy-safe blood bank dashboard for sickle cell care.",
      },
    ],
  }),
  component: DonorsPage,
});

function DonorsPage() {
  const { t } = useI18n();
  const { offline, lastSynced } = useOffline();
  const queryClient = useQueryClient();

  const fetchRequests = useServerFn(listRequests);
  const fetchEligible = useServerFn(listEligiblePatients);
  const fetchDonors = useServerFn(listDonors);
  const fetchDashboard = useServerFn(bloodDashboard);
  const nextRound = useServerFn(advanceRound);

  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showDonorForm, setShowDonorForm] = useState(false);

  const requests = useQuery({
    queryKey: ["requests"],
    queryFn: () => guardedRead(() => fetchRequests()),
    retry: false,
  });
  const eligible = useQuery({
    queryKey: ["eligible-patients"],
    queryFn: () => guardedRead(() => fetchEligible()),
    retry: false,
  });
  const donors = useQuery({
    queryKey: ["donors"],
    queryFn: () => guardedRead(() => fetchDonors()),
    retry: false,
  });
  const dashboard = useQuery({
    queryKey: ["blood-dashboard"],
    queryFn: () => guardedRead(() => fetchDashboard()),
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    queryClient.invalidateQueries({ queryKey: ["blood-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["ranked"] });
  };

  const advance = useMutation({
    mutationFn: (requestId: string) => nextRound({ data: { requestId } }),
    onSuccess: (res) => {
      toast.success(`Outreach moved to round ${res.round} (${roundRadiusKm(res.round) > 100 ? "state-wide" : `${roundRadiusKm(res.round)} km`})`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <SectionHeading title={t("m3.title")} subtitle={t("m3.subtitle")} />
      {offline && <OfflineBanner lastSynced={lastSynced} />}

      <Card className="mb-5 border-primary/40 bg-secondary/40">
        <p className="flex items-start gap-2 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          Blood requests are limited to patients with a documented confirmatory result of{" "}
          <strong>Disease</strong>. Carriers and unverified records can never appear here — the
          server refuses them.
        </p>
      </Card>

      {dashboard.data && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Open requests", value: dashboard.data.openRequests },
            { label: "Emergency now", value: dashboard.data.byUrgency.Emergency },
            {
              label: "Donors available",
              value: `${dashboard.data.donorsAvailable}/${dashboard.data.donorsTotal}`,
            },
            {
              label: "Accepted responses",
              value: `${dashboard.data.acceptedResponses}/${dashboard.data.notificationsSent}`,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowRequestForm((v) => !v)}
          className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          New blood request
        </button>
        <button
          type="button"
          onClick={() => setShowDonorForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold hover:bg-accent"
        >
          <UserPlus className="size-5" /> Register a donor
        </button>
      </div>

      {showRequestForm && (
        <RequestForm
          patients={eligible.data ?? []}
          onDone={() => {
            setShowRequestForm(false);
            invalidate();
          }}
        />
      )}
      {showDonorForm && (
        <DonorForm
          onDone={() => {
            setShowDonorForm(false);
            queryClient.invalidateQueries({ queryKey: ["donors"] });
            queryClient.invalidateQueries({ queryKey: ["blood-dashboard"] });
          }}
        />
      )}

      <h2 className="mb-3 text-xl font-bold">Requests</h2>
      <div className="space-y-3">
        {(requests.data ?? []).map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-56 flex-1">
                <p className="text-lg font-bold">
                  {r.blood_group_needed} · {r.units_needed} unit{r.units_needed === 1 ? "" : "s"} ·{" "}
                  {r.component}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{r.request_code}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.patient_name} ({r.patient_code}) · {r.hospital_name} · needed by {r.required_by}
                </p>
              </div>
              <div className="text-sm">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 font-semibold",
                    r.urgency_level === "Emergency"
                      ? "bg-destructive/15 text-destructive"
                      : r.urgency_level === "Urgent"
                        ? "bg-warn/30 text-warn-foreground"
                        : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {r.urgency_level}
                </span>
                <p className="mt-2">
                  Round {r.notification_round} ·{" "}
                  {roundRadiusKm(r.notification_round) > 100
                    ? "state-wide"
                    : `${roundRadiusKm(r.notification_round)} km`}
                </p>
                <p className="text-muted-foreground">
                  {r.notified} notified · {r.accepted} accepted · {r.declined} declined
                </p>
                <p className="mt-1 font-semibold">
                  {r.status === "confirmed" ? "Donor confirmed" : "Open"}
                </p>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setOpenRequestId(openRequestId === r.id ? null : r.id)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
                >
                  {openRequestId === r.id ? "Hide donors" : "Matched donors"}
                </button>
                {r.status === "open" && r.notification_round < 3 && (
                  <button
                    type="button"
                    onClick={() => advance.mutate(r.id)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    <Radio className="size-4" /> Widen to round {r.notification_round + 1}
                  </button>
                )}
              </div>
            </div>

            {openRequestId === r.id && <MatchedDonors requestId={r.id} onChange={invalidate} />}
          </Card>
        ))}
        {(requests.data ?? []).length === 0 && !requests.isLoading && (
          <Card>
            <p className="text-sm text-muted-foreground">No blood requests yet.</p>
          </Card>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold">Donor register</h2>
      <Card>
        <p className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
          <EyeOff className="mt-0.5 size-4 shrink-0" />
          Phone numbers are stored but never sent to any screen. Blood bank staff see an area name,
          an approximate distance and availability only; contact happens through the blood bank.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Donor</th>
                <th className="py-2 pr-4">Group</th>
                <th className="py-2 pr-4">Area</th>
                <th className="py-2 pr-4">Approx. distance</th>
                <th className="py-2 pr-4">Availability</th>
                <th className="py-2 pr-4">Donations</th>
                <th className="py-2">Response rate</th>
              </tr>
            </thead>
            <tbody>
              {(donors.data ?? []).map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="py-2 pr-4 font-mono">{d.donor_code}</td>
                  <td className="py-2 pr-4 font-semibold">{d.blood_group}</td>
                  <td className="py-2 pr-4">{d.general_location}</td>
                  <td className="py-2 pr-4">{Number(d.distance_km)} km</td>
                  <td className="py-2 pr-4">{d.availability_status}</td>
                  <td className="py-2 pr-4">{d.past_donation_count}</td>
                  <td className="py-2">{Math.round(Number(d.response_rate) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function MatchedDonors({ requestId, onChange }: { requestId: string; onChange: () => void }) {
  const fetchRanked = useServerFn(rankedDonors);
  const confirm = useServerFn(confirmDonor);
  const ranked = useQuery({
    queryKey: ["ranked", requestId],
    queryFn: () => fetchRanked({ data: { requestId } }),
  });
  const mutation = useMutation({
    mutationFn: (donorId: string) => confirm({ data: { requestId, donorId } }),
    onSuccess: () => {
      toast.success("Donor confirmed for this request");
      onChange();
      ranked.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
      <h3 className="font-bold">Ranked donors</h3>
      <p className="text-sm text-muted-foreground">
        Score out of 100: compatibility {SCORE_WEIGHTS.compatibility}, proximity{" "}
        {SCORE_WEIGHTS.proximity}, availability {SCORE_WEIGHTS.availability}, response history{" "}
        {SCORE_WEIGHTS.responseHistory}. Ordering only — it is never a medical judgement.
      </p>
      <ul className="mt-3 space-y-2">
        {(ranked.data ?? []).map((d) => (
          <li key={d.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-44 flex-1">
                <p className="font-semibold">
                  {d.donor_code} · {d.blood_group}
                </p>
                <p className="text-sm text-muted-foreground">
                  {d.general_location} · ~{Number(d.distance_km)} km · {d.availability_status}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-lg font-bold">{d.score.total}</p>
                <p className="text-xs text-muted-foreground">
                  {d.score.compatibility} + {d.score.proximity} + {d.score.availability} +{" "}
                  {d.score.responseHistory}
                </p>
              </div>
              <div className="text-sm">
                {d.notified_round ? (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                    Round {d.notified_round} · {d.response}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not notified yet</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => mutation.mutate(d.id)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                Confirm donor
              </button>
            </div>
          </li>
        ))}
        {(ranked.data ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">
            No compatible donor inside this round's radius yet — widen the round.
          </li>
        )}
      </ul>
    </div>
  );
}

function RequestForm({
  patients,
  onDone,
}: {
  patients: { id: string; name: string; patient_code: string; district: string }[];
  onDone: () => void;
}) {
  const create = useServerFn(createBloodRequest);
  const [form, setForm] = useState({
    patientId: patients[0]?.id ?? "",
    blood_group_needed: "O+",
    component: "Packed red blood cells",
    units_needed: 2,
    hospital_name: "",
    required_by: new Date().toISOString().slice(0, 10),
    urgency_level: "Urgent" as (typeof URGENCY_LEVELS)[number],
  });

  const mutation = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: (row) => {
      toast.success(`Request ${row.request_code} created — round 1 outreach sent`);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (patients.length === 0) {
    return (
      <Card className="mb-5">
        <p className="text-sm text-muted-foreground">
          No eligible patients: a blood request needs a documented confirmatory result of Disease.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-5">
      <h2 className="text-lg font-bold">New blood request</h2>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="text-sm sm:col-span-2">
          <span className="block font-semibold">Patient (documented Disease only)</span>
          <select
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.patient_code}) · {p.district}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Blood group needed</span>
          <select
            value={form.blood_group_needed}
            onChange={(e) => setForm({ ...form, blood_group_needed: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Component</span>
          <select
            value={form.component}
            onChange={(e) => setForm({ ...form, component: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            <option>Packed red blood cells</option>
            <option>Whole blood</option>
            <option>Leucodepleted red cells</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Units</span>
          <input
            type="number"
            min={1}
            max={10}
            value={form.units_needed}
            onChange={(e) => setForm({ ...form, units_needed: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Urgency</span>
          <select
            value={form.urgency_level}
            onChange={(e) =>
              setForm({ ...form, urgency_level: e.target.value as (typeof URGENCY_LEVELS)[number] })
            }
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            {URGENCY_LEVELS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Hospital / blood bank</span>
          <input
            required
            value={form.hospital_name}
            onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Required by</span>
          <input
            type="date"
            value={form.required_by}
            onChange={(e) => setForm({ ...form, required_by: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            Create request and notify round 1
          </button>
        </div>
      </form>
    </Card>
  );
}

function DonorForm({ onDone }: { onDone: () => void }) {
  const register = useServerFn(registerDonor);
  const [form, setForm] = useState({
    blood_group: "O+",
    general_location: "",
    distance_km: 4,
    availability_status: AVAILABILITY[0] as (typeof AVAILABILITY)[number],
    past_donation_count: 0,
    private_phone: "",
  });

  const mutation = useMutation({
    mutationFn: () => register({ data: form }),
    onSuccess: (row) => {
      toast.success(`Donor ${row.donor_code} registered`);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="mb-5">
      <h2 className="text-lg font-bold">Register a donor</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The phone number is kept private on the server; only the area, approximate distance and
        availability are ever shown.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="text-sm">
          <span className="block font-semibold">Blood group</span>
          <select
            value={form.blood_group}
            onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">General area</span>
          <input
            required
            value={form.general_location}
            onChange={(e) => setForm({ ...form, general_location: e.target.value })}
            placeholder="Kondagaon town"
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Approximate distance (km)</span>
          <input
            type="number"
            min={0}
            max={500}
            value={form.distance_km}
            onChange={(e) => setForm({ ...form, distance_km: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Availability</span>
          <select
            value={form.availability_status}
            onChange={(e) =>
              setForm({
                ...form,
                availability_status: e.target.value as (typeof AVAILABILITY)[number],
              })
            }
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          >
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Past donations</span>
          <input
            type="number"
            min={0}
            value={form.past_donation_count}
            onChange={(e) => setForm({ ...form, past_donation_count: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold">Phone (kept private)</span>
          <input
            required
            value={form.private_phone}
            onChange={(e) => setForm({ ...form, private_phone: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            Add donor
          </button>
        </div>
      </form>
    </Card>
  );
}
