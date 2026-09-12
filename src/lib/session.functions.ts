import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Me = {
  id: string;
  name: string;
  facility: string;
  roles: string[];
};

export const me = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Me> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, facility")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const claimsMeta = (context.claims as any)?.user_metadata || {};
    const effectiveRoles = (roles ?? []).map((r) => r.role as string);
    if (effectiveRoles.length === 0 && claimsMeta.role) {
      effectiveRoles.push(claimsMeta.role);
    }

    return {
      id: context.userId,
      name: profile?.full_name || claimsMeta.full_name || "Health worker",
      facility: profile?.facility || claimsMeta.facility || "Field team",
      roles: effectiveRoles.length > 0 ? effectiveRoles : ["health_worker"],
    };
  });
