import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { AppShell, Card, SectionHeading } from "@/components/AppShell";
import { publicLookupRecord } from "@/lib/care.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/lookup")({
  head: () => ({
    meta: [
      { title: "Look up a care record — Rakt-Link" },
      {
        name: "description",
        content:
          "Type a Rakt-Link reference to check that a sickle cell care record exists. Medical details need a health worker sign-in.",
      },
      { property: "og:title", content: "Look up a care record — Rakt-Link" },
      {
        property: "og:description",
        content: "Check a Rakt-Link care record reference by manual entry.",
      },
    ],
  }),
  component: LookupPage,
});

function LookupPage() {
  const { t } = useI18n();
  const lookup = useServerFn(publicLookupRecord);
  const [reference, setReference] = useState("");

  const check = useMutation({
    mutationFn: (ref: string) => lookup({ data: { reference: ref } }),
  });

  return (
    <AppShell>
      <SectionHeading
        title={t("lookup.title")}
        subtitle={t("lookup.subtitle")}
      />

      <div className="mx-auto max-w-xl">
        <Card className="p-6">
          <h2 className="text-lg font-bold">{t("lookup.manualEntry")}</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (reference.trim()) {
                check.mutate(reference.trim());
              }
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="ref-input" className="text-sm font-medium text-muted-foreground">
                {t("lookup.manualEntry")}
              </label>
              <input
                id="ref-input"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder={t("lookup.placeholder")}
                aria-label="Care record reference"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-base tracking-wide transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={reference.trim().length < 3 || check.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Search className="size-5" /> {check.isPending ? t("common.loading") : t("common.search")}
            </button>
          </form>

          {check.data && (
            <div className="mt-5 rounded-2xl border border-border/80 bg-muted/30 p-5">
              {check.data.exists ? (
                <div>
                  <p className="flex items-center gap-2 font-semibold text-ok">
                    <CheckCircle2 className="size-5 shrink-0" /> {t("lookup.recordFound")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("lookup.recordFoundNote")}
                  </p>
                  <Link
                    to="/auth"
                    className="mt-3 inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  >
                    {t("lookup.signinToView")} &rarr;
                  </Link>
                </div>
              ) : (
                <p className="flex items-center gap-2 font-semibold text-destructive">
                  <XCircle className="size-5 shrink-0" /> {t("lookup.recordNotFound")}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
