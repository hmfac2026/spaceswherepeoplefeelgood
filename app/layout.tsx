import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spaces Where People Feel Good",
  description:
    "A community-curated map of places with good energy — and a community of people who find them.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#5f7a5b",
          colorText: "#1f1d1a",
          colorBackground: "#faf7f2",
          colorInputBackground: "#ffffff",
          fontFamily: "var(--font-sans)",
          borderRadius: "0.375rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
      >
        <body className="bg-paper text-ink flex min-h-full flex-col font-sans">
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
