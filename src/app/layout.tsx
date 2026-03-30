import type { Metadata } from "next";
import { Space_Grotesk, Inter, Playfair_Display } from "next/font/google";
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

export const metadata: Metadata = {
  title: "NIV - The Influence Orchestration Operating System",
  description: "Transform how organizations discover opportunities, generate strategies, and execute campaigns — with AI that learns and compounds over time.",
  metadataBase: new URL('https://nivria.ai'),
  openGraph: {
    title: 'NIV - The Influence Orchestration Operating System',
    description: 'Transform how organizations discover opportunities, generate strategies, and execute campaigns — with AI that learns and compounds over time.',
    url: 'https://nivria.ai',
    siteName: 'NIV by nivria',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'NIV - The Influence Orchestration Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NIV - The Influence Orchestration Operating System',
    description: 'Transform how organizations discover opportunities, generate strategies, and execute campaigns — with AI that learns and compounds over time.',
    images: ['/api/og'],
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
        className={`${spaceGrotesk.variable} ${inter.variable} ${playfairDisplay.variable} antialiased h-full`}
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
