"use client";

/* 바탕화면 바로가기 버튼입니다.

   1순위: 크롬·엣지가 주는 "앱 설치"를 씁니다. 누르면 바탕화면에 아이콘이 생깁니다.
   2순위: 설치 안내가 안 뜨는 브라우저에서는 브라우저 메뉴로 바로가기를 만드는 길을 알려 줍니다.
   3순위: 그것도 어려우면 바로가기 파일을 내려받아 바탕화면으로 끌어다 놓게 합니다.

   예전에는 윈도우 인터넷 바로가기(.url)를 내려줬는데, 크롬과 엣지가 이 확장자를 위험한 파일로 보고
   받는 즉시 이름을 "....download" 로 바꿔 버립니다. 그래서 두 번 눌러도 아무 일이 없었습니다.
   지금은 막히지 않는 html 바로가기 파일을 내려줍니다. */

import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SHORTCUT_NAME = "우리학교 부별공유";

/* 브라우저마다 바로가기를 만드는 메뉴 이름이 달라서 갈라 적습니다. */
function menuSteps(): string[] {
  if (typeof navigator === "undefined") return [];
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) {
    return [
      "브라우저 오른쪽 위 ··· 을 누릅니다.",
      "앱 → 이 사이트를 앱으로 설치 를 누릅니다.",
      "설치를 누르면 바탕화면에 아이콘이 생깁니다."
    ];
  }
  if (/Chrome\//.test(ua) && !/OPR\//.test(ua)) {
    return [
      "브라우저 오른쪽 위 ⋮ 를 누릅니다.",
      "캐스트, 저장 및 공유 → 페이지를 바로가기로 저장 을 누릅니다.",
      "만들기를 누르면 바탕화면에 아이콘이 생깁니다."
    ];
  }
  return ["주소창 왼쪽의 자물쇠 아이콘을 바탕화면으로 끌어다 놓습니다."];
}

export default function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);

  useEffect(() => {
    setSteps(menuSteps());

    /* 설치 안내(beforeinstallprompt)는 화면이 그려지기 전에 한 번 지나가 버립니다.
       layout 의 짧은 스크립트가 미리 받아 두므로 여기서는 받아 둔 것을 가져옵니다. */
    const pick = () => {
      const saved = (window as unknown as { __installPrompt?: InstallPrompt }).__installPrompt;
      if (saved) setPrompt(saved);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setGuide(false);
    };

    pick();
    window.addEventListener("install-prompt-ready", pick);
    window.addEventListener("appinstalled", onInstalled);

    /* 이미 앱으로 열려 있으면 버튼을 숨깁니다. */
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);

    return () => {
      window.removeEventListener("install-prompt-ready", pick);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const downloadShortcut = () => {
    const url = window.location.origin + window.location.pathname;
    const body = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${SHORTCUT_NAME}</title>
<meta http-equiv="refresh" content="0; url=${url}">
</head>
<body style="font-family:'Malgun Gothic',sans-serif;padding:40px;text-align:center">
<p>${SHORTCUT_NAME} 로 이동합니다.</p>
<p><a href="${url}">화면이 바뀌지 않으면 여기를 누르세요</a></p>
</body>
</html>
`;
    const blob = new Blob([body], { type: "text/html;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${SHORTCUT_NAME}.html`;
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
      (window as unknown as { __installPrompt?: InstallPrompt | null }).__installPrompt = null;
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
          <p className="ib-guide-title">브라우저 메뉴로 만듭니다</p>
          <ol className="ib-guide-steps">
            {steps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <p className="ib-guide-title">메뉴를 못 찾으시겠으면</p>
          <button type="button" className="ib-guide-download" onClick={downloadShortcut}>
            바로가기 파일 내려받기
          </button>
          <p className="ib-guide-note">
            내려받은 <b>{SHORTCUT_NAME}.html</b> 을 바탕화면으로 끌어다 놓고 두 번 누르면 열립니다.
          </p>

          <button type="button" className="ib-guide-close" onClick={() => setGuide(false)}>
            닫기
          </button>
        </div>
      ) : null}
    </div>
  );
}
