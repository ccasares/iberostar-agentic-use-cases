import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Echoes Sans y Noe Text (tipografías propietarias de Iberostar) sustituidas por
// Josefin Sans (UI) y Playfair Display (titulares), de Google Fonts (licencia
// OFL). Se sirven desde app/fonts (fuentes variables, subconjunto latin) en vez
// de next/font/google, para que el build no dependa de descargar las fuentes
// (fallaba en Heroku).
const josefin = localFont({
  src: "./fonts/josefin-sans-latin.woff2",
  variable: "--font-josefin",
  weight: "100 700",
  display: "swap",
});

const playfair = localFont({
  src: "./fonts/playfair-display-latin.woff2",
  variable: "--font-playfair",
  weight: "400 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
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
