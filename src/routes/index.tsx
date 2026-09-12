import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  QrCode,
  HeartHandshake,
  ArrowRight,
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

  const modules = [
    {
      to: "/tracker" as const,
      icon: ClipboardList,
      title: t("home.card1.title"),
      body: t("home.card1.body"),
      badge: "HPLC Track",
    },
    {
      to: "/records" as const,
      icon: QrCode,
      title: t("home.card2.title"),
      body: t("home.card2.body"),
      badge: "Portable QR",
    },
    {
      to: "/donors" as const,
      icon: HeartHandshake,
      title: t("home.card3.title"),
      body: t("home.card3.body"),
      badge: "Compatible Match",
    },
  ];

  const highlights = [
    {
      icon: Globe2,
      title: "5 Regional Languages",
      desc: "Hindi, Odia, Marathi, Gujarati & English for ground field workers",
    },
    {
      icon: Zap,
      title: "Offline-Ready Continuity",
      desc: "Instant local caching with automatic queue sync on reconnect",
    },
    {
      icon: ShieldCheck,
      title: "Privacy & Verification",
      desc: "Server-enforced ABHA checks & anonymized blood donor outreach",
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

      {/* Core Action Modules */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md active:scale-99"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-rose-600 group-hover:to-red-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-rose-600/25">
                  <m.icon className="size-6" aria-hidden />
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {m.badge}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {m.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary">
              <span>{t("common.open")}</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
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
