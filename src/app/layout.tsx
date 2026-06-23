import type { Metadata } from "next";
import { Space_Grotesk, Inter, Playfair_Display, JetBrains_Mono, Fraunces, Newsreader, IBM_Plex_Sans_Condensed, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Editorial display + body for the homepage.
// Fraunces is variable — axes (opsz, SOFT) require dropping explicit weight,
// which means we get the full variable range.
const fraunces = Fraunces({
  variable: "--font-editorial",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
});

const newsreader = Newsreader({
  variable: "--font-reader",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Small-caps kicker labels. Narrow, institutional, non-code.
const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Logo wordmark. High-contrast serif with character — distinct from body.
const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "nivria · A new standard for the evaluation and stewardship of complex ventures",
  description: "We map the connectome — the web of relationships a venture actually runs on — and score its structural health in real time, backed by verifiable evidence, not reputation.",
  metadataBase: new URL('https://nivria.ai'),
  openGraph: {
    title: 'nivria · A new standard for the evaluation and stewardship of complex ventures',
    description: "Every complex effort has a connectome. We map it — and score whether it'll survive.",
    url: 'https://nivria.ai',
    siteName: 'nivria',
    locale: 'en_US',
    type: 'website',
    // Image is provided by src/app/opengraph-image.png (Next.js file convention)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'nivria · A new standard for the evaluation and stewardship of complex ventures',
    description: "Every complex effort has a connectome. We map it — and score whether it'll survive.",
    // Image picked up from the opengraph-image.png convention
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${newsreader.variable} ${plexCondensed.variable} ${dmSerifDisplay.variable} antialiased h-full`}
        style={{
          background: 'var(--cream)',
          color: 'var(--charcoal)'
        }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
