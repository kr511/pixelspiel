import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Felice × Elias",
  description: "Felice × Elias World V0.9 – Unsere gemeinsame Geschichte in acht spielbaren Kapiteln, mit lebendigen Dialogen, Handy und Erinnerungsalbum.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
