import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enterprise Inventory System",
  description: "Advanced Enterprise Inventory and SaaS Management System",
  icons: {
    icon: "/inventory.png",
    shortcut: "/inventory.png",
    apple: "/inventory.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
