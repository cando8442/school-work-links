"use client";

/* 바탕화면 바로가기 버튼입니다.

   1순위: 크롬·엣지가 주는 "앱 설치"를 씁니다. 누르면 바탕화면에 아이콘이 생깁니다.
   2순위: 설치를 못 쓰는 브라우저에서는 윈도우 바로가기 파일(.url)을 내려받게 하고,
          내려받은 파일을 바탕화면으로 끌어다 놓으라고 안내합니다. */

import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SHORTCUT_NAME = "우리학교 부별공유";

export default function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setGuide(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    /* 이미 앱으로 열려 있으면 버튼을 숨깁니다. */
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const downloadShortcut = () => {
    const url = window.location.origin + window.location.pathname;
    const body = `[InternetShortcut]\r\nURL=${url}\r\nIconIndex=0\r\n`;
    const blob = new Blob([body], { type: "application/octet-stream" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${SHORTCUT_NAME}.url`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const onClick = async () => {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPrompt(null);
      return;
    }
    setGuide(true);
  };

  if (installed) return null;

  return (
    <div className="ib">
      <button type="button" className="ib-btn" onClick={onClick}>
        바탕화면에 바로가기 만들기
      </button>

      {guide ? (
        <div className="ib-guide" role="dialog" aria-label="바로가기 만드는 방법">
          <p className="ib-guide-title">두 번만 누르면 됩니다</p>
          <ol className="ib-guide-steps">
            <li>아래 버튼을 눌러 바로가기 파일을 내려받습니다.</li>
            <li>내려받은 파일을 바탕화면으로 끌어다 놓습니다.</li>
            <li>바탕화면 아이콘을 두 번 누르면 로그인 화면이 열립니다.</li>
          </ol>
          <button type="button" className="ib-guide-download" onClick={downloadShortcut}>
            바로가기 파일 내려받기
          </button>
          <p className="ib-guide-note">
            크롬이나 엣지를 쓰시면 주소창 오른쪽 끝의 설치 아이콘으로도 만들 수 있습니다.
          </p>
          <button type="button" className="ib-guide-close" onClick={() => setGuide(false)}>
            닫기
          </button>
        </div>
      ) : null}
    </div>
  );
}
