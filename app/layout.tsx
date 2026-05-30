import type { Metadata } from "next";
import HeartsBackground from "@/components/HeartsBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "Приглашение 💕",
  description: "Маленький секрет для тебя",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <HeartsBackground />
        {children}
      </body>
    </html>
  );
}
