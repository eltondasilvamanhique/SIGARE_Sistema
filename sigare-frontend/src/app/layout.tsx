import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGARE — Gestão e Alocação de Recursos para Eventos",
  description: "Plataforma integrada para pesquisa e reserva de recursos para eventos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
