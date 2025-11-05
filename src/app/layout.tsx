import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalDesk V3 - Autonomous PR Platform",
  description: "Transform intelligence into action with NIV orchestration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body
        className="antialiased bg-gray-950 text-gray-100 h-full overflow-hidden font-sans"
      >
        {children}
      </body>
    </html>
  );
}
