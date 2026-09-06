import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F3B63"
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "우리학교 부별공유",
  description: "서울세종고등학교 부서별 업무분장과 마감 공지를 한곳에서 봅니다.",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/assets/icon-192.png`,
    apple: `${basePath}/assets/icon-192.png`
  },
  appleWebApp: {
    capable: true,
    title: "부별공유",
    statusBarStyle: "default"
  },
  openGraph: {
    title: "우리학교 부별공유",
    description: "서울세종고등학교 부서별 업무분장과 마감 공지",
    images: [`${basePath}/assets/campus.png`]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
