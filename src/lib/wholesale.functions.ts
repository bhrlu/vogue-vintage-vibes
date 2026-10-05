import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const reviewInput = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(500).optional(),
});

/** Admin approves/rejects a wholesale application and grants or revokes the wholesale role. */
export const reviewWholesaleApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("دسترسی ندارید");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error } = await supabaseAdmin
      .from("wholesale_applications")
      .update({ status: data.decision, admin_note: data.note ?? null })
      .eq("id", data.applicationId)
      .select("user_id")
      .single();
    if (error) throw new Error(error.message);

    if (data.decision === "approved") {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: app.user_id, role: "wholesale" }, { onConflict: "user_id,role" });
      if (roleError) throw new Error(roleError.message);
    } else {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", app.user_id)
        .eq("role", "wholesale");
    }
    return { ok: true };
  });
