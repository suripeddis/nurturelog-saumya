import type { Metadata } from "next";
import "./globals.css";
import { ProcessingProvider } from "@/contexts/ProcessingContext";
import { AuthProvider } from '@descope/nextjs-sdk';
import UserIdentification from '@/components/UserIdentification';

export const metadata: Metadata = {
  title: "NurtureLog – Skip the Paperwork",
  description: "Whether you're a parent or a practitioner, NurtureLog writes the report so you don't have to. Upload your letterboard session—get instant summaries, strengths, and next steps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider projectId="P2y4LoAyS4l1cjLfG51HRz145N0E">
      <html lang="en">
        <body className="antialiased">
          <ProcessingProvider>
            <UserIdentification />
            {children}
          </ProcessingProvider>  
        </body>
      </html>
    </AuthProvider>
  );
}
