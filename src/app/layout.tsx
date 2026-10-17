import type { Metadata, Viewport } from "next";
import { Outfit, Righteous } from "next/font/google";
import { brand } from "@/data/copy";
import "./globals.css";

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-face",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
  applicationName: brand.name,
  appleWebApp: { capable: true, title: brand.name, statusBarStyle: "black-translucent" },
  openGraph: {
    title: brand.name,
    description: brand.tagline,
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05a2a2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${righteous.variable} ${outfit.variable} h-full`}>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
