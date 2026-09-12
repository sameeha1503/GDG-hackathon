import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CloudOff, Cloud, Loader2, LogOut, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useOffline } from "@/lib/offline";
import { LANGUAGES } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export function LanguageSelector() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as typeof lang)}
        aria-label={t("common.language")}
        className="rounded-xl border border-border/80 bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-xs transition-all hover:border-border focus:border-primary focus:outline-none"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OfflineToggle() {
  const { offline, toggleOffline, queue, syncing, lastSynced } = useOffline();
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleOffline}
        aria-pressed={offline}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
          offline
            ? "border-warn bg-warn/20 text-warn-foreground"
            : "border-border bg-card text-foreground hover:bg-accent",
        )}
      >
        {offline ? <CloudOff className="size-4" /> : <Cloud className="size-4" />}
        {offline ? t("common.offlineOn") : t("common.online")}
      </button>
      {syncing && (
        <span className="flex items-center gap-1 text-sm text-primary">
          <Loader2 className="size-4 animate-spin" /> syncing…
        </span>
      )}
      {!syncing && queue.length > 0 && (
        <span className="rounded-full bg-warn/25 px-3 py-1 text-sm font-semibold text-warn-foreground">
          {queue.length} {t("common.pendingSync")}
        </span>
      )}
      {!syncing && queue.length === 0 && lastSynced && (
        <span className="text-xs text-muted-foreground">
          {t("common.lastSynced")} {new Date(lastSynced).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

const NAV = [
  { to: "/tracker", key: "nav.tracker" },
  { to: "/records", key: "nav.records" },
  { to: "/donors", key: "nav.donors" },
] as const;

export function AppShell({
  children,
  who,
}: {
  children: ReactNode;
  who?: { name: string; facility: string; roles: string[] } | null;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-card/85 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="group flex items-center gap-3 transition-transform active:scale-98">
            <Logo className="transition-transform group-hover:scale-105" />
            <span className="text-xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {t("app.name")}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-auto rounded-xl border border-border/80 px-3 py-2 md:hidden"
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </button>

          <nav
            className={cn(
              "w-full flex-col gap-1 md:ml-auto md:flex md:w-auto md:flex-row md:items-center",
              open ? "flex" : "hidden",
            )}
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-primary/10 text-primary font-semibold shadow-xs" }}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className={cn("flex w-full items-center gap-2 md:w-auto", open ? "flex" : "hidden md:flex")}>
            <LanguageSelector />
            {who ? (
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-2 rounded-xl border border-border/80 px-3.5 py-2 text-sm font-semibold hover:bg-secondary"
              >
                <LogOut className="size-4" /> {t("nav.signout")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="flex items-center rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:bg-secondary hover:border-border"
                >
                  {t("nav.signin")}
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="flex items-center rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-rose-600/20 transition-all hover:from-rose-500 hover:to-red-500 hover:shadow-lg hover:shadow-rose-600/30 active:scale-98"
                >
                  {t("nav.signup")}
                </Link>
              </div>
            )}
          </div>
        </div>
        {who && (
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 pb-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{who.name}</span>
            <span>{who.facility}</span>
            {who.roles.map((r) => (
              <span key={r} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {r === "health_worker" ? t("role.health_worker") : t("role.blood_bank")}
              </span>
            ))}
            <span className="ml-auto">
              <OfflineToggle />
            </span>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mt-16 border-t border-border/70 bg-card/60 py-10 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="text-sm font-extrabold tracking-tight text-foreground">{t("app.name")}</span>
          </div>
          <p className="max-w-2xl leading-relaxed">{t("app.footer")}</p>
        </div>
      </footer>
    </div>
  );
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-base text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm sm:p-6", className)}>
      {children}
    </section>
  );
}

export function OfflineBanner({ lastSynced }: { lastSynced?: string | null }) {
  const { t } = useI18n();
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-warn bg-warn/15 p-4 text-sm text-warn-foreground">
      <CloudOff className="size-5 shrink-0" />
      <p>
        <strong>{t("common.offlineOn")}.</strong> Showing the copy saved on this device
        {lastSynced ? ` — ${t("common.lastSynced").toLowerCase()} ${new Date(lastSynced).toLocaleString()}` : ""}.
        Changes you make now are queued and sent when you reconnect.
      </p>
    </div>
  );
}
