import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";

export const metadata: Metadata = {
  title: "FGF Pet Food Bazaar — Happier tails, naturally",
  description: "Meet happier pet routines, playful brands and natural chews at FGF Pet Food Bazaar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="fgf-site">{children}</body></html>;
}
