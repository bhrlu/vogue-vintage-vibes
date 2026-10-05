import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Boxes, Minus, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatToman, toFa } from "@/lib/format";
import { PACK_LABEL, useWholesale } from "@/lib/wholesale";
import { Button } from "@/components/ui/button";

export function WholesaleBox({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { canBuyWholesale, terms } = useWholesale();
  const { add } = useCart();
  const pack = terms.get(productId);
  const [packs, setPacks] = useState<number | null>(null);

  if (!canBuyWholesale) {
    return (
      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-sage/50 p-4 text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Boxes className="size-4 text-sage-deep" /> بوتیک دارید؟ قیمت عمده (پک جور) برای همکاران تأییدشده
        </span>
        <Link to={user ? "/account/wholesale" : "/wholesale"} className="shrink-0 text-terracotta underline">
          درخواست همکاری
        </Link>
      </div>
    );
  }
  if (!pack) {
    return (
      <p className="mt-6 rounded-2xl bg-sand p-4 text-xs text-muted-foreground">
        این محصول فعلاً به‌صورت عمده عرضه نمی‌شود.
      </p>
    );
  }

  const count = packs ?? pack.min_packs;
  const perItem = Math.round(pack.pack_price / pack.pack_size);

  return (
    <div className="mt-6 rounded-2xl border border-sage/40 bg-sage/10 p-5">
      <p className="flex items-center gap-2 text-sm text-sage-deep">
        <Boxes className="size-4" /> خرید عمده — {PACK_LABEL} {toFa(pack.pack_size)} تایی
      </p>
      <p className="mt-3 text-xl">{formatToman(pack.pack_price)} تومان <span className="text-xs text-muted-foreground">هر پک</span></p>
      <p className="mt-1 text-xs text-muted-foreground">
        معادل هر عدد {formatToman(perItem)} تومان · حداقل {toFa(pack.min_packs)} پک
      </p>
      {pack.pack_description && <p className="mt-2 text-xs leading-6">{pack.pack_description}</p>}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center rounded-full border border-border bg-background">
          <button type="button" aria-label="کاهش پک" className="p-2" onClick={() => setPacks(Math.max(pack.min_packs, count - 1))}>
            <Minus className="size-3.5" />
          </button>
          <span className="w-8 text-center text-sm">{toFa(count)}</span>
          <button type="button" aria-label="افزایش پک" className="p-2" onClick={() => setPacks(count + 1)}>
            <Plus className="size-3.5" />
          </button>
        </div>
        <Button
          className="flex-1 rounded-full"
          onClick={() => {
            add({ productId, size: PACK_LABEL, color: "جور", quantity: count, pack: true });
            toast.success(`${toFa(count)} پک به سبد اضافه شد`);
          }}
        >
          افزودن پک — {formatToman(pack.pack_price * count)} تومان
        </Button>
      </div>
    </div>
  );
}
