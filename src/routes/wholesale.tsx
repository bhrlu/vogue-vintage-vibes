import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgePercent, Boxes, Store, Truck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatToman } from "@/lib/format";
import { WHOLESALE_MIN_ORDER } from "@/lib/wholesale";

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { title: "خرید عمده و همکاری — ساندِه" },
      { name: "description", content: "فروش عمده پک و جین جور پوشاک زنانه ساندِه برای بوتیک‌ها و فروشگاه‌ها." },
      { property: "og:title", content: "خرید عمده و همکاری — ساندِه" },
      { property: "og:description", content: "پک جور رنگ و سایز با قیمت همکار برای فروشندگان تأییدشده." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WholesalePage,
});

const perks = [
  { icon: Boxes, title: "پک و جین جور", text: "هر پک ترکیبی از رنگ‌ها و سایزهای پرفروش است." },
  { icon: BadgePercent, title: "قیمت همکار", text: "قیمت عمده فقط برای همکاران تأییدشده نمایش داده می‌شود." },
  { icon: Truck, title: "ارسال با باربری", text: "سفارش‌های عمده با باربری یا تیپاکس به سراسر کشور ارسال می‌شوند." },
  { icon: Store, title: "پشتیبانی اختصاصی", text: "کارشناس فروش همکاران پیگیر سفارش‌های شماست." },
];

function WholesalePage() {
  const { user, isWholesale } = useAuth();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-[11px] tracking-[0.25em] text-sage-deep">همکاری با ساندِه</p>
      <h1 className="mt-3 text-4xl">فروش عمده برای بوتیک‌ها</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
        فروش عمده فقط به‌صورت پک/جین جور انجام می‌شود. پس از ثبت درخواست و تأیید مدارک، قیمت‌های
        همکار در فروشگاه برای شما فعال می‌شود. حداقل مبلغ هر سفارش عمده {formatToman(WHOLESALE_MIN_ORDER)} تومان است.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {perks.map((p) => (
          <div key={p.title} className="rounded-2xl border border-border bg-sand/60 p-6">
            <p.icon className="size-6 text-terracotta" />
            <h2 className="mt-3 text-xl">{p.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        {isWholesale ? (
          <Link to="/shop" search={{}} className="inline-flex rounded-full bg-primary px-8 py-3 text-sm text-primary-foreground">
            حساب همکار شما فعال است — رفتن به فروشگاه
          </Link>
        ) : (
          <Link
            to={user ? "/account/wholesale" : "/auth"}
            className="inline-flex rounded-full bg-primary px-8 py-3 text-sm text-primary-foreground"
          >
            {user ? "ثبت درخواست همکاری" : "ورود و ثبت درخواست همکاری"}
          </Link>
        )}
      </div>
    </div>
  );
}
