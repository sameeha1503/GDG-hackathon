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

    return {
      id: context.userId,
      name: profile?.full_name ?? "Health worker",
      facility: profile?.facility ?? "Field team",
      roles: (roles ?? []).map((r) => r.role as string),
    };
  });
