import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, QrCode, HeartHandshake, ShieldCheck } from "lucide-react";
import { AppShell, Card, SectionHeading } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { DEMO_ACCOUNTS } from "@/lib/demo.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rakt-Link — sickle cell follow-up, care records and donors" },
      {
        name: "description",
        content:
          "A prototype for India's sickle cell mission: track confirmatory tests, carry a QR care record, and find matched blood donors.",
      },
      { property: "og:title", content: "Rakt-Link — sickle cell continuity of care" },
      {
        property: "og:description",
        content:
          "Track confirmatory HPLC follow-up, carry a portable QR care record and reach compatible blood donors.",
      },
    ],
  }),
  component: Index,
});

const MODULES = [
  {
    to: "/tracker" as const,
    icon: ClipboardList,
    title: "Confirmatory test follow-up",
    body: "Everyone flagged on a field screening test, with clear 7 / 14 / 21 day waiting flags and a reminder log in five languages.",
  },
  {
    to: "/records" as const,
    icon: QrCode,
    title: "Portable care record",
    body: "A QR reference a patient carries between facilities. Only people with a documented confirmatory report can have one.",
  },
  {
    to: "/donors" as const,
    icon: HeartHandshake,
    title: "Blood donor availability",
    body: "For patients living with sickle cell disease: transparent donor ranking, staged outreach and donor privacy by design.",
  },
];

function Index() {
  const { t } = useI18n();

  return (
    <AppShell>
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          National Sickle Cell Anaemia Elimination Mission
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
          {t("app.name")} keeps the care journey joined up after the field screening test.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("app.tag")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
          >
            Sign in as a health worker
          </Link>
          <Link
            to="/lookup"
            className="inline-flex items-center rounded-xl border border-border px-6 py-3 text-base font-semibold hover:bg-accent"
          >
            Scan a patient's QR record
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {MODULES.map((m) => (
          <Card key={m.to}>
            <m.icon className="size-7 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg font-bold">{m.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
            <Link to={m.to} className="mt-4 inline-flex text-sm font-semibold text-primary underline">
              Open
            </Link>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <SectionHeading
          title="Demo logins"
          subtitle="This prototype is pre-loaded with realistic demonstration data across all three modules."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((a) => (
            <Card key={a.email}>
              <p className="text-sm font-semibold text-foreground">{a.name}</p>
              <p className="text-sm text-muted-foreground">{a.facility}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-mono">{a.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Password</dt>
                  <dd className="font-mono">{a.password}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Eligibility rules and donor privacy are enforced on the server, not just hidden in the
          screens. Reminders, ABHA numbers and donor outreach are simulated.
        </p>
      </div>
    </AppShell>
  );
}
