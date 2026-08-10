import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatToman, toFa } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/orders";

export const Route = createFileRoute("/_authenticated/account/orders")({
  component: OrdersTab,
});

function OrdersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>;
  if (!data?.length)
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">هنوز سفارشی ثبت نکرده‌اید.</p>
        <Link to="/shop" search={{}} className="mt-4 inline-block text-terracotta underline">
          رفتن به فروشگاه
        </Link>
      </div>
    );

  return (
    <ul className="space-y-4">
      {data.map((order) => (
        <li key={order.id} className="rounded-3xl border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm">سفارش #{toFa(order.order_number)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {toFa(new Date(order.created_at).toLocaleDateString("fa-IR"))}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-terracotta/10 px-3 py-1 text-terracotta">
                {ORDER_STATUS[order.status] ?? order.status}
              </span>
              <span className="rounded-full bg-sand px-3 py-1">
                {PAYMENT_STATUS[order.payment_status] ?? order.payment_status}
              </span>
            </div>
          </div>
          <ul className="mt-4 space-y-3 border-t border-border pt-4">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                {item.image && (
                  <img src={item.image} alt="" className="size-14 rounded-xl object-cover" />
                )}
                <span className="flex-1">
                  {item.name}
                  <span className="block text-xs text-muted-foreground">
                    سایز {toFa(item.size ?? "-")} · رنگ {item.color} · تعداد {toFa(item.quantity)}
                  </span>
                </span>
                <span>{formatToman(item.price * item.quantity)} تومان</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">مبلغ نهایی: {formatToman(order.total)} تومان</p>
        </li>
      ))}
    </ul>
  );
}