/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Carousel from "@/components/Carousel";
import Popups from "@/components/Popups";
import { getI18n } from "@/lib/locale";
import { getActivePopups, getCarousel, getCatalog, getSettings } from "@/lib/data";
import { st } from "@/lib/settingsFields";
import { fmtMoney } from "@/lib/dates";

export default async function Home() {
  const [{ locale, t, p }, settings, carousel, catalog, popups] = await Promise.all([
    getI18n(),
    getSettings(),
    getCarousel(),
    getCatalog(),
    getActivePopups(),
  ]);
  const S = (k: string) => st(settings, k, locale);
  const heroImg = settings.hero_image || carousel[0]?.image || "";

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-verde text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            <div className="space-y-6">
              <span className="inline-block rounded-full bg-sky px-4 py-1 text-sm font-bold text-verde">
                100% FRESH 🌱
              </span>
              <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">{S("hero_title")}</h1>
              <p className="max-w-lg text-lg text-white/85">{S("hero_subtitle")}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="btn btn-sky !px-8 !py-3 text-lg">
                  {S("hero_cta")}
                </Link>
                <Link href="#plans" className="btn border border-white/40 !px-8 !py-3 text-lg text-white hover:bg-white/10">
                  {t("plans")}
                </Link>
              </div>
            </div>
            <div className="relative">
              {heroImg && (
                <img
                  src={heroImg}
                  alt=""
                  draggable={false}
                  className="pointer-events-none aspect-[4/3] w-full select-none rounded-[2.5rem] object-cover shadow-2xl"
                />
              )}
              <div className="absolute -bottom-6 -start-4 flex h-28 w-28 rotate-[-8deg] items-center justify-center rounded-full bg-leaf text-center font-display text-xl font-bold leading-5 text-verde shadow-lg">
                100%
                <br />
                FRESH
              </div>
              <div className="absolute -end-3 -top-5 flex h-24 w-24 rotate-[10deg] items-center justify-center rounded-3xl bg-sky text-center font-display text-xl font-bold leading-5 text-verde shadow-lg">
                ENJOY
                <br />
                YOUR MEAL
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-blush">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl bg-white p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky text-xl">
                  {["🥗", "💪", "🛵"][n - 1]}
                </div>
                <h3 className="font-display text-2xl font-bold text-verde">{S(`feat${n}_title`)}</h3>
                <p className="mt-1 text-sage">{S(`feat${n}_body`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        {carousel.length > 0 && (
          <section className="mx-auto max-w-6xl space-y-6 px-4 py-14">
            <div className="text-center">
              <h2 className="font-display text-4xl font-bold text-verde">{S("gallery_title")}</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sage">{S("gallery_subtitle")}</p>
            </div>
            <Carousel images={carousel} />
          </section>
        )}

        {/* Plans */}
        <section id="plans" className="bg-blush/60">
          <div className="mx-auto max-w-6xl space-y-8 px-4 py-14">
            <div className="text-center">
              <h2 className="font-display text-4xl font-bold text-verde">{S("plans_title")}</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sage">{S("plans_subtitle")}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {catalog.packages.map((pk) => (
                <article key={pk.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-md">
                  <div className="bg-verde p-5 text-white">
                    <h3 className="font-display text-2xl font-bold">{p(pk.nameAr, pk.nameEn)}</h3>
                    <p className="mt-1 text-sm text-sky">
                      {t("protein")} {pk.protein} · {t("carbs")} {pk.carbs}
                    </p>
                  </div>
                  <div className="flex-1 space-y-3 p-5">
                    {(pk.descAr || pk.descEn) && <p className="text-sm text-sage">{p(pk.descAr, pk.descEn)}</p>}
                    <ul className="space-y-2">
                      {pk.options.map((o) => (
                        <li key={o.id} className="flex items-center justify-between rounded-xl bg-blush px-4 py-2">
                          <span className="font-semibold text-verde">{p(o.labelAr, o.labelEn)}</span>
                          <span className="font-display text-xl font-bold text-verde">
                            {fmtMoney(o.price5)} <small className="text-xs">{t("bd")}</small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 pt-0">
                    <Link href={`/register?plan=${pk.id}`} className="btn btn-primary w-full">
                      {t("subscribeToPlan")}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-verde py-8 text-center text-sm text-white/80">
        <p>{S("footer")}</p>
        <p className="mt-1" dir="ltr">
          WhatsApp: 66937877
        </p>
      </footer>
      <Popups popups={popups} />
    </>
  );
}
