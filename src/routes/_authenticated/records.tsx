import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, OfflineBanner, SectionHeading } from "@/components/AppShell";
import {
  createCareRecord,
  listCareRecords,
  updateCareRecord,
  type CareRecord,
} from "@/lib/care.functions";
import { useI18n } from "@/lib/i18n";
import { guardedRead, useOffline } from "@/lib/offline";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({
    meta: [
      { title: "Portable care record — Rakt-Link" },
      {
        name: "description",
        content:
          "Generate and update a portable QR sickle cell care record for patients with a documented confirmatory report.",
      },
      { property: "og:title", content: "Portable care record — Rakt-Link" },
      {
        property: "og:description",
        content: "QR care records, mock ABHA linkage and offline-safe updates for documented patients.",
      },
    ],
  }),
  component: RecordsPage,
});

function QrBlock({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      if (cancelled || !canvasRef.current) return;
      // Only the record reference is encoded — never medical data.
      await QRCode.toCanvas(canvasRef.current, value, { width: 168, margin: 1 });
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-xl border border-border bg-white p-2" />
      <p className="font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function RecordsPage() {
  const { t } = useI18n();
  const { offline, lastSynced, enqueue, queue, removeQueued, setSyncing, markSynced } = useOffline();
  const queryClient = useQueryClient();
  const fetchRecords = useServerFn(listCareRecords);
  const create = useServerFn(createCareRecord);
  const update = useServerFn(updateCareRecord);

  const records = useQuery({
    queryKey: ["care-records"],
    queryFn: () => guardedRead(() => fetchRecords()),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (vars: { patientId: string; facility: string; treatmentStatus: string }) =>
      create({ data: vars }),
    onSuccess: () => {
      toast.success("Care record created");
      queryClient.invalidateQueries({ queryKey: ["care-records"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { recordId: string; treatmentStatus: string; facility: string }) =>
      update({ data: vars }),
    onSuccess: () => {
      toast.success("Record updated");
      queryClient.invalidateQueries({ queryKey: ["care-records"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function flushQueue() {
    if (offline) {
      toast.error("Still in offline mode — switch back online first.");
      return;
    }
    setSyncing(true);
    for (const item of queue) {
      try {
        await update({
          data: {
            recordId: item.recordId,
            treatmentStatus: item.treatmentStatus,
            facility: item.facility,
          },
        });
        removeQueued(item.id);
      } catch {
        toast.error(`Could not sync ${item.recordId}`);
      }
    }
    setSyncing(false);
    markSynced();
    queryClient.invalidateQueries({ queryKey: ["care-records"] });
    toast.success("Queued updates sent");
  }

  useEffect(() => {
    if (!offline && (records.data?.length ?? 0) > 0) markSynced();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline, records.data]);

  return (
    <>
      <SectionHeading title={t("m2.title")} subtitle={t("m2.subtitle")} />
      {offline && <OfflineBanner lastSynced={lastSynced} />}

      <Card className="mb-5 border-primary/40 bg-secondary/40">
        <p className="flex items-start gap-2 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          Only people whose confirmatory report has actually been seen appear here. The server
          re-checks that rule on every attempt, so an unverified record can never get a QR code.
        </p>
      </Card>

      {queue.length > 0 && (
        <Card className="mb-5 border-warn bg-warn/10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm">
              <strong>{queue.length}</strong> treatment update
              {queue.length === 1 ? "" : "s"} saved on this device, waiting to sync.
            </p>
            <button
              type="button"
              onClick={flushQueue}
              className="ml-auto flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCw className="size-4" /> Sync now
            </button>
          </div>
        </Card>
      )}

      {records.isError && !records.data && (
        <Card className="mb-4 border-warn bg-warn/10">
          <p className="text-sm">No saved copy on this device yet — go back online to load records.</p>
        </Card>
      )}

      <div className="space-y-4">
        {(records.data ?? []).map(({ patient, record }) => (
          <RecordCard
            key={patient.id}
            patient={patient}
            record={record}
            offline={offline}
            onCreate={(facility, treatmentStatus) =>
              createMutation.mutate({ patientId: patient.id, facility, treatmentStatus })
            }
            onUpdate={(recordId, treatmentStatus, facility) => {
              if (offline) {
                enqueue({ recordId, treatmentStatus, facility });
                toast.success("Saved on this device — it will sync when you reconnect.");
                return;
              }
              updateMutation.mutate({ recordId, treatmentStatus, facility });
            }}
          />
        ))}
        {(records.data ?? []).length === 0 && !records.isLoading && (
          <Card>
            <p className="text-sm text-muted-foreground">
              No documented patients yet. Close a follow-up with a report slip in the tracker first.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}

type PatientLite = {
  id: string;
  patient_code: string;
  name: string;
  district: string;
  phc: string;
  confirmed_result: string | null;
  report_reference: string | null;
};

function RecordCard({
  patient,
  record,
  offline,
  onCreate,
  onUpdate,
}: {
  patient: PatientLite;
  record: CareRecord | null;
  offline: boolean;
  onCreate: (facility: string, treatmentStatus: string) => void;
  onUpdate: (recordId: string, treatmentStatus: string, facility: string) => void;
}) {
  const [facility, setFacility] = useState(record?.last_updated_facility ?? patient.phc);
  const [treatment, setTreatment] = useState(
    record?.treatment_status ?? "Hydroxyurea started, folic acid daily",
  );

  return (
    <Card>
      <div className="flex flex-wrap gap-5">
        <div className="min-w-56 flex-1">
          <p className="text-lg font-bold">{patient.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{patient.patient_code}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {patient.phc}, {patient.district}
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Confirmatory result</dt>
              <dd className="font-semibold">{patient.confirmed_result}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Report slip</dt>
              <dd className="font-mono">{patient.report_reference}</dd>
            </div>
            {record && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">ABHA</dt>
                <dd className="font-mono">{record.mock_abha_id}</dd>
              </div>
            )}
            {record && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Last updated</dt>
                <dd>
                  {new Date(record.last_updated_date).toLocaleDateString()} ·{" "}
                  {record.last_updated_facility}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-semibold">Treatment status</span>
              <input
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold">Facility</span>
              <input
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
              />
            </label>
          </div>
          <div className="mt-3">
            {record ? (
              <button
                type="button"
                onClick={() => onUpdate(record.record_id, treatment, facility)}
                className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
              >
                {offline ? "Save on this device" : "Save update"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCreate(facility, treatment)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
              >
                <QrCode className="size-5" /> Create QR care record
              </button>
            )}
          </div>
        </div>

        {record && <QrBlock value={record.record_id} />}
      </div>
    </Card>
  );
}
