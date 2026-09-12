import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, SectionHeading } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Rakt-Link" },
      {
        name: "description",
        content: "Set a new password for your Rakt-Link account.",
      },
      { property: "og:title", content: "Reset Password — Rakt-Link" },
      { property: "og:description", content: "Set a new password for your Rakt-Link account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [sessionStatus, setSessionStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState("");

  useEffect(() => {
    let isMounted = true;

    // Supabase recovery links auto-establish a session via detectSessionInUrl (on by default).
    // Listen to auth events for PASSWORD_RECOVERY or SIGNED_IN
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setSessionStatus("valid");
      }
    });

    // Also check current session and URL parameters (hash or query)
    const checkSession = async () => {
      try {
        if (typeof window !== "undefined") {
          const hash = window.location.hash || "";
          const search = window.location.search || "";

          // If the link has explicit error params (e.g. otp_expired)
          if (hash.includes("error=") || search.includes("error=")) {
            if (isMounted) setSessionStatus("invalid");
            return;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (data?.session && !error) {
          setSessionStatus("valid");
          return;
        }

        // If tokens exist in hash (#access_token=... or code=...), supabase-js may need a moment to parse
        const hasTokens =
          typeof window !== "undefined" &&
          (window.location.hash.includes("access_token") ||
            window.location.hash.includes("type=recovery") ||
            window.location.search.includes("code="));

        if (hasTokens) {
          setTimeout(async () => {
            if (!isMounted) return;
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData?.session) {
              setSessionStatus("valid");
            } else {
              setSessionStatus("invalid");
            }
          }, 1200);
        } else {
          setSessionStatus("invalid");
        }
      } catch {
        if (isMounted) setSessionStatus("invalid");
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) {
        throw new Error(
          t("auth.passwordMismatch")
            ? "Password must be at least 6 characters"
            : "Password must be at least 6 characters",
        );
      }
      if (newPassword !== confirmPassword) {
        throw new Error(t("auth.passwordMismatch"));
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);

      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast.success(t("auth.passwordUpdated"));
      navigate({
        to: "/auth",
        search: { mode: "signin" },
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError("");

    if (newPassword.length < 6) {
      setClientError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setClientError(t("auth.passwordMismatch"));
      return;
    }

    updatePasswordMutation.mutate();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <SectionHeading
          title={t("auth.resetPasswordTitle")}
          subtitle={t("auth.resetPasswordSubtitle")}
        />

        <Card>
          {sessionStatus === "checking" ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">{t("auth.checkingResetLink")}</p>
            </div>
          ) : sessionStatus === "invalid" ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-foreground">
                {t("auth.invalidResetLink")}
              </p>
              <div className="pt-2">
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-red-500 hover:shadow-lg hover:shadow-rose-600/30 transition-all"
                >
                  ← {t("auth.backToSignin")}
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {clientError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
                  {clientError}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold">
                  {t("auth.newPassword")}
                </label>
                <input
                  id="new-password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (clientError) setClientError("");
                  }}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold">
                  {t("auth.confirmPassword")}
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (clientError) setClientError("");
                  }}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-rose-600/20 transition-all hover:from-rose-500 hover:to-red-500 hover:shadow-lg hover:shadow-rose-600/30 disabled:opacity-60 active:scale-99"
              >
                {updatePasswordMutation.isPending
                  ? t("auth.updatingPassword")
                  : t("auth.updatePasswordBtn")}
              </button>

              <div className="mt-4 text-center">
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  ← {t("auth.backToSignin")}
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
