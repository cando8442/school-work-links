import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SCHOOL } from "@/config/school";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F3B63"
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: `${SCHOOL.name} ${SCHOOL.siteName}`,
  description: `${SCHOOL.name} 부서별 업무분장과 마감을 한곳에서 봅니다.`,
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/assets/icon-192.png`,
    apple: `${basePath}/assets/icon-192.png`
  },
  appleWebApp: {
    capable: true,
    title: SCHOOL.siteName,
    statusBarStyle: "default"
  },
  openGraph: {
    title: `${SCHOOL.name} ${SCHOOL.siteName}`,
    description: `${SCHOOL.name} 부서별 업무분장과 마감`,
    images: [`${basePath}/assets/campus.png`]
  }
};

/* 크롬·엣지의 앱 설치 안내(beforeinstallprompt)는 화면이 그려지기 전에 한 번 지나갑니다.
   놓치면 "바탕화면에 바로가기 만들기" 버튼이 설치를 못 띄우므로 여기서 미리 받아 둡니다. */
const catchInstallPrompt = `
window.__installPrompt = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event('install-prompt-ready'));
});
window.addEventListener('appinstalled', function () { window.__installPrompt = null; });
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: catchInstallPrompt }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
