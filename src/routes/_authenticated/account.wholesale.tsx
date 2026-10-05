import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { APP_STATUS } from "@/lib/wholesale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/account/wholesale")({
  head: () => ({
    meta: [
      { title: "درخواست خرید عمده — ساندِه" },
      { name: "description", content: "ثبت و پیگیری درخواست همکاری عمده." },
      { property: "og:title", content: "درخواست خرید عمده — ساندِه" },
      { property: "og:description", content: "ثبت و پیگیری درخواست همکاری عمده." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountWholesale,
});

const fields = [
  { name: "business_name", label: "نام فروشگاه / بوتیک", required: true },
  { name: "owner_name", label: "نام و نام خانوادگی مالک", required: true },
  { name: "national_id", label: "کد ملی", required: false },
  { name: "phone", label: "شماره همراه", required: true },
  { name: "province", label: "استان", required: true },
  { name: "city", label: "شهر", required: true },
  { name: "social_link", label: "پیج اینستاگرام یا وب‌سایت", required: false },
] as const;

function AccountWholesale() {
  const { user, isWholesale } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: app, isLoading } = useQuery({
    queryKey: ["my-wholesale-app", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("wholesale_applications").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-clay" />;

  if (app && app.status !== "rejected") {
    return (
      <div className="rounded-3xl border border-border bg-sand/60 p-8">
        <p className="text-xs text-muted-foreground">درخواست همکاری: {app.business_name}</p>
        <p className="mt-2 text-2xl">{APP_STATUS[app.status] ?? app.status}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {app.status === "approved" || isWholesale
            ? "حساب همکار شما فعال است؛ قیمت پک‌های عمده در صفحه محصولات نمایش داده می‌شود."
            : "درخواست شما ثبت شده و پس از بررسی مدارک نتیجه اعلام می‌شود."}
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const payload = {
      user_id: user.id,
      business_name: get("business_name"),
      owner_name: get("owner_name"),
      national_id: get("national_id") || null,
      phone: get("phone"),
      province: get("province"),
      city: get("city"),
      address: get("address"),
      social_link: get("social_link") || null,
      description: get("description") || null,
      status: "pending",
      admin_note: null,
    };
    setBusy(true);
    const { error } = app
      ? await supabase.from("wholesale_applications").update(payload).eq("id", app.id)
      : await supabase.from("wholesale_applications").insert(payload);
    setBusy(false);
    if (error) return toast.error("ثبت درخواست ناموفق بود");
    toast.success("درخواست شما ثبت شد");
    qc.invalidateQueries({ queryKey: ["my-wholesale-app"] });
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border p-6">
      <div>
        <h2 className="text-2xl">درخواست همکاری عمده</h2>
        <p className="mt-1 text-sm text-muted-foreground">فروش عمده فقط به‌صورت پک/جین جور انجام می‌شود.</p>
        {app?.status === "rejected" && (
          <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            درخواست قبلی رد شد{app.admin_note ? `: ${app.admin_note}` : ""}. می‌توانید اطلاعات را اصلاح و دوباره ارسال کنید.
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((fl) => (
          <div key={fl.name}>
            <Label htmlFor={fl.name}>{fl.label}</Label>
            <Input id={fl.name} name={fl.name} required={fl.required} defaultValue={(app?.[fl.name] as string | null) ?? ""} className="mt-2" />
          </div>
        ))}
      </div>
      <div>
        <Label htmlFor="address">نشانی فروشگاه</Label>
        <Textarea id="address" name="address" required rows={2} defaultValue={app?.address ?? ""} className="mt-2" />
      </div>
      <div>
        <Label htmlFor="description">توضیحات (حجم خرید ماهانه، نوع مشتریان و...)</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={app?.description ?? ""} className="mt-2" />
      </div>
      <Button type="submit" disabled={busy} className="rounded-full px-8">
        {busy ? "در حال ارسال..." : "ارسال درخواست"}
      </Button>
    </form>
  );
}
