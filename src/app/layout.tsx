import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dorm Finder - หอพักมหาวิทยาลัยพะเยา",
  description: "ค้นหาและเปรียบเทียบหอพักใกล้มหาวิทยาลัยพะเยา อ่านรีวิวจากผู้ใช้จริง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
