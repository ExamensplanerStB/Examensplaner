import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif-display",
});

export const metadata: Metadata = {
  title: "Examensplaner StB",
  description: "Strukturierte Vorbereitung auf das Steuerberaterexamen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
