import type { Metadata } from "next";
import "./globals.css";
import { ProcessingProvider } from "@/contexts/ProcessingContext";

export const metadata: Metadata = {
  title: "NurtureLog – Skip the Paperwork",
  description: "Whether you're a parent or a therapist, NurtureLog writes the report so you don't have to. Upload your letterboarding session—get instant summaries, strengths, and next steps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ProcessingProvider>
          {children}
        </ProcessingProvider>
      </body>
    </html>
  );
}
