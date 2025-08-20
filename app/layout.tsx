
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "JEUS 감귤 농가 관리 시스템",
  description: "감귤 농가의 기본 정보, 시설, 지원사업, 사용 서비스, 연간 데이터를 관리하고 검색하며 엑셀로 내보낼 수 있는 통합 관리 시스템입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" strategy="beforeInteractive" />
      </head>
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
