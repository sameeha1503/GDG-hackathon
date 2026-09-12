import { createServerFn } from "@tanstack/react-start";

export const DEMO_ACCOUNTS = [
  {
    email: "asha@raktlink.demo",
    password: "raktlink-demo",
    role: "health_worker" as const,
    name: "Sushila Netam (ASHA)",
    facility: "Kondagaon PHC, Bastar",
  },
  {
    email: "bloodbank@raktlink.demo",
    password: "raktlink-demo",
    role: "blood_bank" as const,
    name: "Blood bank desk",
    facility: "District Hospital, Bhawanipatna",
  },
];

/**
 * Creates the two fixed demo logins if they do not exist. Idempotent, and it can
 * only ever create these exact prototype accounts.
 */
export const ensureDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const created: string[] = [];

  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });

  for (const account of DEMO_ACCOUNTS) {
    let userId =
      existing?.users.find((u) => u.email?.toLowerCase() === account.email)?.id ?? null;


    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });
      if (error) continue;
      userId = data.user?.id ?? null;
      if (userId) created.push(account.email);
    }
    if (!userId) continue;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: account.name, facility: account.facility });
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: account.role }, { onConflict: "user_id,role" });
  }

  return { created };
});
