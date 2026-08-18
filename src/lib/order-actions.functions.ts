import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cancelInput = z.object({ orderId: z.string().uuid() });

/** Customer-initiated cancellation, allowed only before the order ships. */
export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cancelInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total")
      .eq("id", data.orderId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("سفارش پیدا نشد");
    if (order.status === "cancelled") {
      return { ok: true, orderNumber: order.order_number };
    }
    if (["shipped", "delivered"].includes(order.status)) {
      throw new Error("سفارش ارسال شده و امکان لغو ندارد");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    if (updateError) throw new Error(updateError.message);

    if (order.payment_status === "paid") {
      const { error: refundError } = await supabaseAdmin
        .from("orders")
        .update({ payment_status: "refunded" })
        .eq("id", order.id);
      if (refundError) throw new Error(refundError.message);
      await supabaseAdmin.from("payments").insert({
        order_id: order.id,
        user_id: context.userId,
        amount: order.total,
        method: "refund",
        status: "refunded",
        reference: `RFD-${order.order_number}`,
      });
    }

    return { ok: true, orderNumber: order.order_number };
  });