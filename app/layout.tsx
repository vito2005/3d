import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Menu from "./components/menu";
import Metrika from "./components/metrika";
import PoweredBy from "./components/powered-by";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;

  return "https://3d-one-sandy.vercel.app/";
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "3D models",
  description: "Interactive 3D models demo built with Next.js and Three.js.",
  applicationName: "3D models",
  creator: "alexbuki",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "3D models",
    title: "3D models",
    description: "Interactive 3D models demo built with Next.js and Three.js.",
    images: [
      {
        url: "./og-bit.png",
        width: 1200,
        height: 630,
        alt: "3D models preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D models",
    description: "Interactive 3D models demo built with Next.js and Three.js.",
    images: ["./og-bit.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Menu />
        {children}
        <PoweredBy />
        <Suspense>
          <Metrika />
        </Suspense>
      </body>
    </html>
  );
}
