import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nivria - Intelligence-Driven Communications Platform",
  description: "Transform information into strategic action with real-time intelligence monitoring and AI-powered planning. Built for those who shape narratives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden`}
        style={{
          background: 'var(--charcoal)',
          color: 'var(--pearl)'
        }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
