import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Manrope } from "next/font/google";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { THEME_SCRIPT } from "@/components/layout/theme-switcher";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Body face. DM Sans covers Latin + Turkish; it has no Cyrillic.
const sans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Cyrillic-only companion: its unicode-range means it is downloaded and used
// only for Russian letters, which DM Sans cannot draw.
const cyrillic = Manrope({
  subsets: ["cyrillic"],
  variable: "--font-cyrillic",
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: BRAND, template: `%s · ${BRAND}` },
    description: t.meta.description,
    applicationName: BRAND,
    appleWebApp: { capable: true, title: BRAND, statusBarStyle: "default" },
    formatDetection: { telephone: false },
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1613" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getI18n();
  return (
    // suppressHydrationWarning: THEME_SCRIPT adds the "dark" class before React hydrates.
    <html lang={locale} className={`${display.variable} ${sans.variable} ${cyrillic.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <I18nProvider locale={locale} t={t}>
          {children}
        </I18nProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
