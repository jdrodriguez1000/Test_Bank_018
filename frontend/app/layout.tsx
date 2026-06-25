// app/layout.tsx — Root layout (scaffold vacio, sin logica de negocio)
import type { Metadata } from "next";
import "@/styles/globals.css";


export const metadata: Metadata = {
  title: "Reservas Sala Comunitaria",
  description: "Sistema de reservas para la sala comunitaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
