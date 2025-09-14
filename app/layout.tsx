import type { Metadata } from "next";
import { Montserrat, Notable } from "next/font/google";
import "./globals.css";

import "leaflet/dist/leaflet.css";
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700"], // preload regular and bold
  style: ["normal", "italic"], // preload italics too
});

const notable = Notable({
  variable: "--font-notable",
  subsets: ["latin"],
  weight: "400",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Suno x HackMIT",
  description: "Sample Suno demo web app for HackMIT 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${notable.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
