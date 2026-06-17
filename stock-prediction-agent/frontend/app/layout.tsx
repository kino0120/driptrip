import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "株価予測エージェント",
  description: "Claude AIを使った株価分析・予測ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-900">{children}</body>
    </html>
  );
}
