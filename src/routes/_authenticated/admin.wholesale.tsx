import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCatalog } from "@/lib/catalog";
import { formatToman, toFa } from "@/lib/format";
import { APP_STATUS } from "@/lib/wholesale";
import { reviewWholesaleApplication } from "@/lib/wholesale.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/wholesale")({
  head: () => ({
    meta: [
      { title: "عمده‌فروشی — پنل مدیریت ساندِه" },
      { name: "description", content: "بررسی درخواست‌های همکاری و تعیین قیمت پک‌های عمده." },
      { property: "og:title", content: "عمده‌فروشی — پنل مدیریت ساندِه" },
      { property: "og:description", content: "مدیریت همکاران و قیمت عمده." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminWholesale,
});

function AdminWholesale() {
  const [tab, setTab] = useState<"apps" | "prices">("apps");
  return (
    <div>
      <div className="flex gap-2">
        {(["apps", "prices"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? "bg-sage/20 text-sage-deep" : "text-muted-foreground"}`}
          >
            {t === "apps" ? "درخواست‌های همکاری" : "قیمت پک‌ها"}
          </button>
        ))}
      </div>
      <div className="mt-6">{tab === "apps" ? <Applications /> : <Prices />}</div>
    </div>
  );
}

function Applications() {
  const qc = useQueryClient();
  const review = useServerFn(reviewWholesaleApplication);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-wholesale-apps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wholesale_applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const act = async (id: string, decision: "approved" | "rejected") => {
    const note = decision === "rejected" ? (window.prompt("دلیل رد درخواست:") ?? "") : undefined;
    try {
      await review({ data: { applicationId: id, decision, ...(note ? { note } : {}) } });
      toast.success(decision === "approved" ? "همکار تأیید شد" : "درخواست رد شد");
      qc.invalidateQueries({ queryKey: ["admin-wholesale-apps"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا");
    }
  };

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-clay" />;
  if (data.length === 0) return <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">درخواستی ثبت نشده است.</p>;

  return (
    <ul className="space-y-3">
      {data.map((a) => (
        <li key={a.id} className="rounded-2xl border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg">{a.business_name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.owner_name} · {toFa(a.phone)} · {a.province}، {a.city}
                {a.national_id ? ` · کد ملی ${toFa(a.national_id)}` : ""}
              </p>
              {a.social_link && <p className="mt-1 text-xs text-terracotta" dir="ltr">{a.social_link}</p>}
              <p className="mt-2 text-sm">{a.address}</p>
              {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
              {a.admin_note && <p className="mt-1 text-xs text-destructive">یادداشت: {a.admin_note}</p>}
            </div>
            <span className="rounded-full bg-sand px-3 py-1 text-xs">{APP_STATUS[a.status] ?? a.status}</span>
          </div>
          <div className="mt-4 flex gap-2">
            {a.status !== "approved" && <Button size="sm" className="rounded-full" onClick={() => act(a.id, "approved")}>تأیید و فعال‌سازی</Button>}
            {a.status !== "rejected" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => act(a.id, "rejected")}>{a.status === "approved" ? "لغو دسترسی" : "رد"}</Button>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Prices() {
  const { all } = useCatalog();
  const qc = useQueryClient();
  const { data: terms } = useQuery({
    queryKey: ["admin-wholesale-terms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_wholesale").select("*");
      if (error) throw error;
      return new Map(data.map((r) => [r.product_id, r]));
    },
  });

  const save = async (productId: string, form: HTMLFormElement) => {
    const f = new FormData(form);
    const pack_price = Number(f.get("pack_price"));
    if (!pack_price) {
      await supabase.from("product_wholesale").delete().eq("product_id", productId);
      toast.success("عرضه عمده غیرفعال شد");
    } else {
      const { error } = await supabase.from("product_wholesale").upsert({
        product_id: productId,
        pack_price,
        pack_size: Math.max(1, Number(f.get("pack_size")) || 6),
        min_packs: Math.max(1, Number(f.get("min_packs")) || 1),
        pack_description: String(f.get("pack_description") ?? ""),
        updated_at: new Date().toISOString(),
      });
      if (error) return toast.error("ذخیره ناموفق بود");
      toast.success("قیمت عمده ذخیره شد");
    }
    qc.invalidateQueries({ queryKey: ["admin-wholesale-terms"] });
    qc.invalidateQueries({ queryKey: ["wholesale-terms"] });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">برای غیرفعال کردن عرضه عمده یک محصول، قیمت پک را خالی بگذارید.</p>
      {all.map((p) => {
        const t = terms?.get(p.id);
        return (
          <form
            key={`${p.id}-${t?.updated_at ?? "none"}`}
            onSubmit={(e) => { e.preventDefault(); save(p.id, e.currentTarget); }}
            className="grid items-end gap-3 rounded-2xl border border-border p-4 md:grid-cols-[1.4fr_1fr_0.6fr_0.6fr_1.4fr_auto]"
          >
            <div>
              <p className="text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground">تکی: {formatToman(p.price)} تومان</p>
            </div>
            <label className="text-xs">قیمت هر پک<Input name="pack_price" type="number" defaultValue={t?.pack_price ?? ""} className="mt-1" /></label>
            <label className="text-xs">تعداد در پک<Input name="pack_size" type="number" defaultValue={t?.pack_size ?? 6} className="mt-1" /></label>
            <label className="text-xs">حداقل پک<Input name="min_packs" type="number" defaultValue={t?.min_packs ?? 1} className="mt-1" /></label>
            <label className="text-xs">ترکیب پک<Input name="pack_description" defaultValue={t?.pack_description ?? ""} placeholder="جور رنگ، S تا XL" className="mt-1" /></label>
            <Button type="submit" size="sm" variant="outline" className="rounded-full">ذخیره</Button>
          </form>
        );
      })}
    </div>
  );
}
