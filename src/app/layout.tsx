import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Review Tool",
  description: "AI-powered CV review against job descriptions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
