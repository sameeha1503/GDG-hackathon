import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Search, XCircle } from "lucide-react";
import { AppShell, Card, SectionHeading } from "@/components/AppShell";
import { publicLookupRecord } from "@/lib/care.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/lookup")({
  head: () => ({
    meta: [
      { title: "Scan a care record — Rakt-Link" },
      {
        name: "description",
        content:
          "Scan or type a Rakt-Link QR reference to check that a sickle cell care record exists. Medical details need a health worker sign-in.",
      },
      { property: "og:title", content: "Scan a care record — Rakt-Link" },
      {
        property: "og:description",
        content: "Check a Rakt-Link care record reference by camera scan or manual entry.",
      },
    ],
  }),
  component: LookupPage,
});

function LookupPage() {
  const { t } = useI18n();
  const lookup = useServerFn(publicLookupRecord);
  const [reference, setReference] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<{ stop: () => void; destroy: () => void } | null>(null);

  const check = useMutation({
    mutationFn: (ref: string) => lookup({ data: { reference: ref } }),
  });

  useEffect(() => {
    if (!scanning || !videoRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const QrScanner = (await import("qr-scanner")).default;
        if (cancelled || !videoRef.current) return;
        const scanner = new QrScanner(
          videoRef.current,
          (result: { data: string }) => {
            const value = result.data.split("/").pop() ?? result.data;
            setReference(value.toUpperCase());
            check.mutate(value);
            setScanning(false);
          },
          { highlightScanRegion: true, highlightCodeOutline: true },
        );
        scannerRef.current = scanner as unknown as { stop: () => void; destroy: () => void };
        await scanner.start();
      } catch {
        setScanError("Camera is not available here — type the reference below instead.");
        setScanning(false);
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [scanning]);

  return (
    <AppShell>
      <SectionHeading
        title={t("nav.lookup")}
        subtitle="Point the camera at a patient's Rakt-Link QR code, or type the reference printed under it."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Camera scan</h2>
          {scanning ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
              <video ref={videoRef} className="w-full" muted playsInline />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setScanError(null);
                setScanning(true);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
            >
              <Camera className="size-5" /> Start camera
            </button>
          )}
          {scanning && (
            <button
              type="button"
              onClick={() => setScanning(false)}
              className="mt-3 w-full rounded-xl border border-border px-4 py-3 font-semibold"
            >
              {t("common.cancel")}
            </button>
          )}
          {scanError && <p className="mt-3 text-sm text-destructive">{scanError}</p>}
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Type the reference</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              check.mutate(reference);
            }}
          >
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="RL-XXXXXX"
              aria-label="Care record reference"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-base"
            />
            <button
              type="submit"
              disabled={reference.length < 3 || check.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Search className="size-5" /> {t("common.search")}
            </button>
          </form>

          {check.data && (
            <div className="mt-4 rounded-xl border border-border p-4">
              {check.data.exists ? (
                <>
                  <p className="flex items-center gap-2 font-semibold text-ok">
                    <CheckCircle2 className="size-5" /> This care record exists.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Medical details are not shown to unauthenticated users. A signed-in health
                    worker can open the full record.
                  </p>
                  <Link to="/auth" className="mt-3 inline-flex text-sm font-semibold text-primary underline">
                    Sign in to view it
                  </Link>
                </>
              ) : (
                <p className="flex items-center gap-2 font-semibold text-destructive">
                  <XCircle className="size-5" /> No record matches that reference.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
