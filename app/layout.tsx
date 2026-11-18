import type { Metadata } from "next";
import { Josefin_Sans, Playfair_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Echoes Sans y Noe Text (tipografías propietarias de Iberostar) sustituidas por
// Josefin Sans (UI) y Playfair Display (titulares) de Google Fonts.
const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grupo Iberostar — Portal de demostración: casos de uso de IA agéntica",
  description:
    "Grupo Iberostar — Casos de uso de IA agéntica impulsados por MuleSoft Agent Fabric.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${josefin.variable} ${playfair.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
