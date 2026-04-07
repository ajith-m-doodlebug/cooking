import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Archivist | CA Marketplace",
  description: "Discover and book verified Chartered Accountants",
};

/** Avoid static prerender of the full tree — fixes React Query / client context errors during SSG. */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${newsreader.variable}`}>
      <head>
        {/* Global icon font for editorial UI */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300..700,0..1,0&display=swap"
        />
      </head>
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
