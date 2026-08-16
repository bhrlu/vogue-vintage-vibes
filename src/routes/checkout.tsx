import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { formatToman, toFa } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { placeOrder } from "@/lib/orders";
import { useCatalog } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "تکمیل خرید — ساندِه" },
      { name: "description", content: "ثبت اطلاعات ارسال و نهایی کردن سفارش در ساندِه." },
      { property: "og:title", content: "تکمیل خرید — ساندِه" },
      { property: "og:description", content: "ثبت اطلاعات ارسال و نهایی کردن سفارش." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const SHIPPING = 89000;
const FREE_SHIPPING_FROM = 2000000;

function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const { byId } = useCatalog();
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING;

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <h1 className="mt-6 text-3xl">سفارش شما ثبت شد</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          شماره سفارش: {toFa(done)}
          <br />
          این یک نسخه نمایشی است و پرداخت واقعی انجام نشده. به‌زودی برای هماهنگی ارسال با شما
          تماس می‌گیریم.
        </p>
        <Link
          to="/shop"
          search={{}}
          className="mt-8 inline-flex border border-foreground px-8 py-3 text-sm tracking-widest transition-colors hover:bg-foreground hover:text-background"
        >
          ادامه خرید
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl">سبد خرید خالی است</h1>
        <Link
          to="/shop"
          search={{}}
          className="mt-8 inline-flex border border-foreground px-8 py-3 text-sm tracking-widest"
        >
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl">تکمیل خرید</h1>

      <div className="mt-10 grid gap-12 md:grid-cols-[1fr_320px]">
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!user) return;
            const data = new FormData(event.currentTarget as HTMLFormElement);
            setBusy(true);
            try {
              const order = await placeOrder({
                userId: user.id,
                lines,
                products: lines.map((line) => byId(line.productId)),
                subtotal,
                discount: 0,
                shipping,
                paymentMethod: "online",
                address: {
                  receiver: `${data.get("firstName")} ${data.get("lastName")}`,
                  phone: String(data.get("phone") ?? ""),
                  province: String(data.get("city") ?? ""),
                  city: String(data.get("city") ?? ""),
                  postal_code: String(data.get("postal") ?? ""),
                  line: String(data.get("address") ?? ""),
                },
                note: String(data.get("note") ?? "") || undefined,
              });
              clear();
              setDone(order.order_number);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "ثبت سفارش ناموفق بود");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">نام</Label>
              <Input id="firstName" name="firstName" required className="mt-2 rounded-none" />
            </div>
            <div>
              <Label htmlFor="lastName">نام خانوادگی</Label>
              <Input id="lastName" name="lastName" required className="mt-2 rounded-none" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">شماره تماس</Label>
              <Input id="phone" name="phone" required inputMode="tel" className="mt-2 rounded-none" />
            </div>
            <div>
              <Label htmlFor="city">شهر</Label>
              <Input id="city" name="city" required className="mt-2 rounded-none" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">نشانی کامل</Label>
            <Textarea id="address" name="address" required rows={3} className="mt-2 rounded-none" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="postal">کد پستی</Label>
              <Input id="postal" name="postal" required inputMode="numeric" className="mt-2 rounded-none" />
            </div>
            <div>
              <Label htmlFor="note">یادداشت سفارش (اختیاری)</Label>
              <Input id="note" name="note" className="mt-2 rounded-none" />
            </div>
          </div>
          {user ? (
            <Button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-none text-sm tracking-widest"
            >
              ثبت سفارش
            </Button>
          ) : (
            <Link
              to="/auth"
              search={{ redirect: "/checkout" }}
              className="flex h-11 w-full items-center justify-center bg-primary text-sm tracking-widest text-primary-foreground"
            >
              {loading ? "..." : "برای ثبت سفارش وارد شوید"}
            </Link>
          )}
          <p className="text-xs text-muted-foreground">
            سفارش شما در حساب کاربری ذخیره و قابل پیگیری است؛ درگاه پرداخت واقعی هنوز متصل نشده.
          </p>
        </form>

        <aside className="h-fit bg-sand p-6">
          <h2 className="text-xl">سفارش شما</h2>
          <ul className="mt-5 space-y-4 text-sm">
            {lines.map((line) => {
              const product = byId(line.productId);
              if (!product) return null;
              return (
                <li
                  key={`${line.productId}-${line.size}-${line.color}`}
                  className="flex justify-between gap-3"
                >
                  <span className="text-muted-foreground">
                    {product.name} × {toFa(line.quantity)}
                    <br />
                    <span className="text-xs">
                      سایز {toFa(line.size)} · {line.color}
                    </span>
                  </span>
                  <span>{formatToman(product.price * line.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ارسال</dt>
              <dd>{shipping === 0 ? "رایگان" : `${formatToman(shipping)} تومان`}</dd>
            </div>
            <div className="flex justify-between text-base">
              <dt>مبلغ نهایی</dt>
              <dd>{formatToman(subtotal + shipping)} تومان</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}