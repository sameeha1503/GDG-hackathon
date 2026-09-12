import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, SectionHeading } from "@/components/AppShell";
import { DEMO_ACCOUNTS, ensureDemoAccounts } from "@/lib/demo.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Rakt-Link" },
      {
        name: "description",
        content: "Sign in as an NSCAEM health worker or blood bank desk to use Rakt-Link.",
      },
      { property: "og:title", content: "Sign in — Rakt-Link" },
      { property: "og:description", content: "Health worker and blood bank sign-in for Rakt-Link." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const seedDemo = useServerFn(ensureDemoAccounts);
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0]!.email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0]!.password);

  useEffect(() => {
    // Makes sure the two documented demo logins exist in this environment.
    seedDemo().catch(() => undefined);
  }, [seedDemo]);

  const signIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Signed in");
      navigate({ to: "/tracker" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <SectionHeading
          title={t("auth.title")}
          subtitle={t("auth.subtitle")}
        />
        <Card>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn.mutate();
            }}
          >
            <div>
              <label htmlFor="email" className="block text-sm font-semibold">
                {t("common.email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold">
                {t("common.password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base"
                required
              />
            </div>
            <button
              type="submit"
              disabled={signIn.isPending}
              className="w-full rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground disabled:opacity-60"
            >
              {signIn.isPending ? t("auth.signingIn") : t("auth.signinBtn")}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-sm font-semibold">{t("auth.demoAccounts")}</p>
            <div className="mt-2 space-y-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.password);
                  }}
                  className="w-full rounded-xl border border-border px-4 py-3 text-left text-sm hover:bg-accent"
                >
                  <span className="font-semibold">{a.name}</span>
                  <span className="block text-muted-foreground">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
