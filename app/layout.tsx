// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "../components/NavBar";
import "../components/ui/glassmorphism.css";

export const metadata: Metadata = {
  title: "IACA Alumni Portal",
  description: "Alumni self-service portal for the International Anti-Corruption Academy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-['Inter'] antialiased">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
