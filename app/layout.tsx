import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Immerse the Bay - Camera App",
  description: "A simple camera app for your hackathon project",
  icons: {
    icon: '/anatomist.png',
    apple: '/anatomist.png',
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
