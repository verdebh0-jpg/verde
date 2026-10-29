import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getI18n } from "@/lib/locale";
import { ensureSeed } from "@/lib/seed";
import { LocaleProvider } from "@/components/LocaleProvider";
import WhatsAppButton from "@/components/WhatsAppButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verde | ڤيردي للوجبات الصحية",
  description:
    "Verde healthy meal plans in Bahrain — ڤيردي للوجبات الصحية: اشتراكات وجبات صحية يومية في البحرين.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const { locale, dir } = await getI18n();
  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Cairo:wght@400;600;700;800&family=Jost:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <LocaleProvider locale={locale}>
          {children}
          <WhatsAppButton />
        </LocaleProvider>
      </body>
    </html>
  );
}
