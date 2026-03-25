import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });



export const metadata: Metadata = {
  title: "Luxe - Multi-Tenant Ecommerce",
  description: "Multi-Tenant Ecommerce + CRM + Kanban SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`min-h-full flex flex-col ${poppins.className}`}>{children}</body>
    </html>
  );
}
