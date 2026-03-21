import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PropCall.ai — The Future of Real Estate Sales",
    template: "%s | PropCall.ai",
  },
  description: "AI-powered voice agents that qualify leads, schedule site visits, and close deals 24/7. Transform your real estate business with PropCall.",
  keywords: ["Real Estate AI", "Voice Agent", "Lead Qualification", "PropTech", "Sales Automation", "Indian Real Estate"],
  authors: [{ name: "PropCall Team" }],
  creator: "PropCall.ai",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://propcall.ai",
    title: "PropCall.ai — AI Voice Agents for Real Estate",
    description: "Automate your real estate sales with human-like AI voice agents. Qualify leads instantly and schedule more site visits.",
    siteName: "PropCall.ai",
    images: [
      {
        url: "/og-image.png", // We need to add this image later
        width: 1200,
        height: 630,
        alt: "PropCall.ai Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PropCall.ai — The Future of Real Estate Sales",
    description: "AI-powered voice agents that qualify leads, schedule site visits, and close deals 24/7.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html >
  );
}
