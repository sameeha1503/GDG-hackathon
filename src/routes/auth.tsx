import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, SectionHeading } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AuthSearch = {
  mode?: "signin" | "signup";
};

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    return {
      mode: search["mode"] === "signup" ? "signup" : "signin",
    };
  },
  head: () => ({
    meta: [
      { title: "Sign in or Sign up — Rakt-Link" },
      {
        name: "description",
        content: "Sign in or create an account as an NSCAEM health worker or blood bank desk to use Rakt-Link.",
      },
      { property: "og:title", content: "Sign in or Sign up — Rakt-Link" },
      { property: "og:description", content: "Health worker and blood bank sign-in and registration for Rakt-Link." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");

  // Sign In fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFacility, setSignupFacility] = useState("");
  const [signupRole, setSignupRole] = useState<"health_worker" | "blood_bank">("health_worker");

  useEffect(() => {
    if (search.mode && (search.mode === "signin" || search.mode === "signup")) {
      setMode(search.mode);
    }
  }, [search.mode]);

  const signIn = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Signed in");
      navigate({ to: "/tracker" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const signUp = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
            facility: signupFacility,
            role: signupRole,
          },
        },
      });
      if (error) throw new Error(error.message);

      if (data.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: signupName,
            facility: signupFacility,
          });
        } catch {
          // Ignored if RLS requires confirmed session
        }
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.session) {
        toast.success("Account created! Signed in successfully.");
        navigate({ to: "/tracker" });
      } else {
        toast.success("Account created successfully! Please sign in.");
        setEmail(signupEmail);
        setPassword(signupPassword);
        setMode("signin");
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <SectionHeading
          title={mode === "signup" ? t("auth.signupTitle") : t("auth.title")}
          subtitle={mode === "signup" ? t("auth.signupSubtitle") : t("auth.subtitle")}
        />

        <Card>
          {/* Sign In / Sign Up Tab Switcher */}
          <div className="mb-6 flex rounded-xl border border-border bg-secondary/40 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all",
                mode === "signin"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("auth.tabSignin")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all",
                mode === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("auth.tabSignup")}
            </button>
          </div>

          {mode === "signin" ? (
            /* Sign In Form */
            <div>
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
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
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
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={signIn.isPending}
                  className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-rose-600/20 transition-all hover:from-rose-500 hover:to-red-500 hover:shadow-lg hover:shadow-rose-600/30 disabled:opacity-60 active:scale-99"
                >
                  {signIn.isPending ? t("auth.signingIn") : t("auth.signinBtn")}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t("auth.noAccount")}
                </button>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <div>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  signUp.mutate();
                }}
              >
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-semibold">
                    {t("auth.fullName")}
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Sushila Netam"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-semibold">
                    {t("common.email")}
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. worker@phc.in"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-semibold">
                    {t("common.password")}
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signup-facility" className="block text-sm font-semibold">
                    {t("auth.facility")}
                  </label>
                  <input
                    id="signup-facility"
                    type="text"
                    placeholder="e.g. Kondagaon PHC, Bastar"
                    value={signupFacility}
                    onChange={(e) => setSignupFacility(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold">{t("auth.role")}</label>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
                        signupRole === "health_worker"
                          ? "border-primary bg-primary/10 font-semibold text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <input
                        type="radio"
                        name="signup-role"
                        value="health_worker"
                        checked={signupRole === "health_worker"}
                        onChange={() => setSignupRole("health_worker")}
                        className="accent-primary"
                      />
                      <span>{t("auth.roleHealthWorker")}</span>
                    </label>

                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
                        signupRole === "blood_bank"
                          ? "border-primary bg-primary/10 font-semibold text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <input
                        type="radio"
                        name="signup-role"
                        value="blood_bank"
                        checked={signupRole === "blood_bank"}
                        onChange={() => setSignupRole("blood_bank")}
                        className="accent-primary"
                      />
                      <span>{t("auth.roleBloodBank")}</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signUp.isPending}
                  className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-rose-600/20 transition-all hover:from-rose-500 hover:to-red-500 hover:shadow-lg hover:shadow-rose-600/30 disabled:opacity-60 active:scale-99"
                >
                  {signUp.isPending ? t("auth.signingUp") : t("auth.signupBtn")}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t("auth.haveAccount")}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
