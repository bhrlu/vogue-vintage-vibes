import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { categories, products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ساندِه | فروشگاه آنلاین پوشاک زنانه" },
      {
        name: "description",
        content:
          "تی‌شرت، کراپ‌تاپ، شورت، جوراب و ست زنانه با رنگ‌های خنثی و پارچه‌های طبیعی؛ ارسال به سراسر ایران.",
      },
      { property: "og:title", content: "ساندِه | فروشگاه آنلاین پوشاک زنانه" },
      {
        property: "og:description",
        content: "کالکشن مینیمال و کلاسیک ساندِه برای روزهای معمولی.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const newest = products.filter((p) => p.isNew).slice(0, 3);

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
        <div className="fade-up">
          <p className="text-xs tracking-[0.3em] text-muted-foreground">کالکشن تابستان</p>
          <h1 className="mt-5 text-5xl leading-[1.15] md:text-6xl">
            سادگی،
            <br />
            دوخته‌شده برای هر روز
          </h1>
          <p className="mt-6 max-w-md text-sm leading-8 text-muted-foreground">
            پارچه‌های طبیعی، رنگ‌های شنی و برش‌هایی که به مد وابسته نیستند. هر تکه طوری طراحی
            شده که سال‌ها همراهتان بماند.
          </p>
          <div className="mt-8">
            <Link
              to="/shop"
              search={{}}
              className="inline-flex items-center border border-foreground px-8 py-3 text-sm tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              دیدن کالکشن
            </Link>
          </div>
        </div>
        <div className="overflow-hidden bg-sand">
          <img
            src={hero}
            alt="مدل با کراپ‌تاپ کرم و شورت کتان شنی"
            width={1408}
            height={1760}
            className="h-auto w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <h2 className="text-2xl">دسته‌بندی‌ها</h2>
          <Link to="/shop" search={{}} className="text-xs text-muted-foreground hover:text-foreground">
            همه محصولات
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/shop"
              search={{ category: category.id }}
              className="group"
            >
              <div className="overflow-hidden bg-sand">
                <img
                  src={category.image}
                  alt={category.title}
                  loading="lazy"
                  width={900}
                  height={1100}
                  className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-center font-display text-lg">{category.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <h2 className="text-2xl">جدیدترین‌ها</h2>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
          {newest.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-24 bg-sand">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-xs tracking-[0.3em] text-muted-foreground">تخفیف پایان فصل</p>
          <h2 className="mt-4 text-4xl">تا ۳۰٪ روی ست‌ها و شورت‌های کتان</h2>
          <Link
            to="/shop"
            search={{ category: "set" }}
            className="mt-8 inline-flex border border-foreground px-8 py-3 text-sm tracking-widest transition-colors hover:bg-foreground hover:text-background"
          >
            خرید ست‌ها
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl">داستان ساندِه</h2>
        <p className="mt-5 text-sm leading-8 text-muted-foreground">
          ما در یک کارگاه کوچک شروع کردیم؛ با این باور که لباس خوب لازم نیست پیچیده باشد. هر
          فصل تعداد محدودی تکه تولید می‌کنیم، از پارچه‌هایی که به پوست و طبیعت مهربان‌اند.
        </p>
        <Link to="/about" className="mt-6 inline-block text-sm underline">
          بیشتر بخوانید
        </Link>
      </section>
    </>
  );
}
