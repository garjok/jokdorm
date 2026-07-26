import type { Metadata } from "next";
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
    <html lang="th">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
