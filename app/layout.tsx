import "./globals.css";
export const metadata = { title: "學習者評估網站" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
