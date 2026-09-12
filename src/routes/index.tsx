import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Heart,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rakt-Link — sickle cell follow-up, care records and donors" },
      {
        name: "description",
        content:
          "Digital healthcare platform for India's sickle cell mission: track confirmatory tests, carry a QR care record, and find matched blood donors.",
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

  const highlights = [
    {
      icon: Globe2,
      title: t("home.hl1.title"),
      desc: t("home.hl1.desc"),
    },
    {
      icon: Zap,
      title: t("home.hl2.title"),
      desc: t("home.hl2.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("home.hl3.title"),
      desc: t("home.hl3.desc"),
    },
  ];

  return (
    <AppShell>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-rose-50/40 p-6 shadow-sm sm:p-12 dark:to-rose-950/15">
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-80 rounded-full bg-red-500/5 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-xs">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            {t("app.mission")}
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
            {t("home.hero.title")}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("app.tag")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-rose-600/25 transition-all duration-200 hover:from-rose-500 hover:to-red-500 hover:shadow-xl hover:shadow-rose-600/35 active:scale-98"
            >
              <Heart className="size-4 fill-white" />
              {t("home.hero.signin")}
            </Link>
          </div>
        </div>
      </div>

      {/* Trust & Architecture Highlights */}
      <div className="mt-12 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <h.icon className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{h.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
