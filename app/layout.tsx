import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import DisclaimerGate from "@/components/DisclaimerGate";

export const metadata: Metadata = {
  title: "Protocol Tracker",
  description: "Personal health protocol tracker and adherence coach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <DisclaimerGate>
          <Nav />
          <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:px-6">{children}</main>
        </DisclaimerGate>
      </body>
    </html>
  );
}
