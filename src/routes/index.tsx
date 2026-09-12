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

function Index() {
  const { t } = useI18n();

  const modules = [
    {
      to: "/tracker" as const,
      icon: ClipboardList,
      title: t("home.card1.title"),
      body: t("home.card1.body"),
    },
    {
      to: "/records" as const,
      icon: QrCode,
      title: t("home.card2.title"),
      body: t("home.card2.body"),
    },
    {
      to: "/donors" as const,
      icon: HeartHandshake,
      title: t("home.card3.title"),
      body: t("home.card3.body"),
    },
  ];

  return (
    <AppShell>
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t("app.mission")}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
          {t("home.hero.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("app.tag")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
          >
            {t("home.hero.signin")}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {modules.map((m) => (
          <Card key={m.to}>
            <m.icon className="size-7 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg font-bold">{m.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
            <Link to={m.to} className="mt-4 inline-flex text-sm font-semibold text-primary underline">
              {t("common.open")}
            </Link>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <SectionHeading
          title={t("home.demo.title")}
          subtitle={t("home.demo.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((a) => (
            <Card key={a.email}>
              <p className="text-sm font-semibold text-foreground">{a.name}</p>
              <p className="text-sm text-muted-foreground">{a.facility}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">{t("common.email")}</dt>
                  <dd className="font-mono">{a.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">{t("common.password")}</dt>
                  <dd className="font-mono">{a.password}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          {t("home.demo.notice")}
        </p>
      </div>
    </AppShell>
  );
}
