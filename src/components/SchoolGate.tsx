"use client";

/* 학교 구글 계정으로 로그인한 사람에게만 화면을 보여 주는 문지기입니다.

   중요: 이 사이트는 정적 페이지라서 이 문지기는 "잠금장치"가 아니라 "현관문"입니다.
   페이지 소스를 직접 열어 보면 여기 적힌 글자는 로그인 없이도 읽힙니다.
   그러므로 학생 개인정보나 대외비 문서는 이 저장소에 절대 적지 말고,
   구글 드라이브에 두고 링크만 걸어 두세요. 실제 접근 제한은 드라이브 권한이 합니다.

   NEXT_PUBLIC_GOOGLE_CLIENT_ID 를 넣지 않으면 문지기 없이 그냥 열립니다. */

import { useCallback, useEffect, useRef, useState } from "react";
import { theme } from "@/config/theme";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/* 허용할 학교 도메인입니다. 쉼표로 여러 개를 적을 수 있습니다. */
const ALLOWED_DOMAINS = (process.env.NEXT_PUBLIC_SCHOOL_DOMAIN ?? "seoulsejong.sen.hs.kr")
  .split(",")
  .map(d => d.trim().replace(/^@/, "").toLowerCase())
  .filter(Boolean);

const GATE_ENABLED = CLIENT_ID.length > 0;
const STORAGE_KEY = "school-gate-user";

type GateUser = { email: string; name?: string };

type CredentialResponse = { credential?: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            hd?: string;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/* 구글이 준 ID 토큰 가운데 조각만 꺼내 봅니다. 서명 검증은 하지 않습니다.
   서명까지 확인하려면 서버가 있어야 하는데 이 사이트에는 서버가 없습니다. */
function readToken(credential: string): Record<string, unknown> | null {
  try {
    const payload = credential.split(".")[1];
    const binary = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function domainOf(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function isAllowed(email: string, hd?: string) {
  if (ALLOWED_DOMAINS.length === 0) return true;
  const fromEmail = domainOf(email);
  const fromHd = hd?.toLowerCase();
  /* 메일 주소 도메인이 허용 목록에 있어야 합니다. hd 가 오면 그것도 같이 맞아야 합니다. */
  if (!ALLOWED_DOMAINS.includes(fromEmail)) return false;
  if (fromHd && !ALLOWED_DOMAINS.includes(fromHd)) return false;
  return true;
}

function readStored(): GateUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GateUser;
    if (!parsed?.email || !isAllowed(parsed.email)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const gateStyle = {
  "--gate-bg": theme.colors.cream,
  "--gate-ink": theme.colors.ink,
  "--gate-dim": theme.colors.dim,
  "--gate-line": theme.colors.border,
  "--gate-point": theme.colors.brown,
  "--gate-soft": theme.colors.latte
} as React.CSSProperties;

export default function SchoolGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GateUser | null>(null);
  const [checked, setChecked] = useState(!GATE_ENABLED);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredential = useCallback((response: CredentialResponse) => {
    const claims = response.credential ? readToken(response.credential) : null;
    const email = typeof claims?.email === "string" ? claims.email : "";
    const hd = typeof claims?.hd === "string" ? claims.hd : undefined;
    const name = typeof claims?.name === "string" ? claims.name : undefined;

    if (!email) {
      setError("로그인 정보를 읽지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    if (!isAllowed(email, hd)) {
      setError(`학교 계정이 아닙니다. (${email}) 학교에서 받은 계정으로 로그인해 주세요.`);
      return;
    }

    const next = { email, name };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* 저장이 막혀 있어도 이번 방문에는 그냥 들어갑니다. */
    }
    setError(null);
    setUser(next);
  }, []);

  /* 같은 탭에서 이미 통과했으면 다시 묻지 않습니다. */
  useEffect(() => {
    if (!GATE_ENABLED) return;
    setUser(readStored());
    setChecked(true);
  }, []);

  /* 구글 로그인 버튼을 붙입니다. */
  useEffect(() => {
    if (!GATE_ENABLED || user || !checked) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
        hd: ALLOWED_DOMAINS.length === 1 ? ALLOWED_DOMAINS[0] : undefined,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        locale: "ko"
      });
    };

    if (window.google) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    script.onerror = () => setError("구글 로그인을 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.");
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [checked, user, handleCredential]);

  if (!GATE_ENABLED) return <>{children}</>;
  if (!checked) return null;
  if (user) return <>{children}</>;

  return (
    <div className="sg-root" style={gateStyle}>
      <div className="sg-card">
        <h1 className="sg-title">우리학교 부별공유</h1>
        <p className="sg-copy">
          학교에서 받은 구글 계정으로 로그인해야 볼 수 있습니다.
          {ALLOWED_DOMAINS.length > 0 ? (
            <>
              <br />
              허용 계정: {ALLOWED_DOMAINS.map(d => `@${d}`).join(", ")}
            </>
          ) : null}
        </p>
        <div className="sg-button" ref={buttonRef} />
        {error ? <p className="sg-error">{error}</p> : null}
        <p className="sg-note">여러 계정에 로그인되어 있으면 학교 계정을 골라 주세요.</p>
      </div>
    </div>
  );
}
