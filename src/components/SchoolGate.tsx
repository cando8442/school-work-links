"use client";

/* 학교 구글 계정으로 로그인한 사람에게만 화면을 보여 주는 문지기입니다.

   로그인은 파이어베이스 구글 로그인을 씁니다. 로그인해야 업무 기록과 제출 표시를 할 수 있고,
   Firestore 규칙이 학교 도메인 계정만 읽고 쓰게 막습니다.
   파이어베이스 설정이 없으면 문지기 없이 읽기 전용으로 열립니다. */

import { createContext, useContext, useEffect, useState } from "react";
import InstallButton from "@/components/InstallButton";
import {
  OWNER_EMAIL,
  SCHOOL_DOMAINS,
  isSchoolLoginEnabled,
  signInWithSchool,
  signOutSchool,
  watchMyRole,
  watchUser,
  type Admin,
  type SchoolUser
} from "@/lib/school";

type GateValue = {
  user: SchoolUser | null;
  /* 편집 권한입니다. 등록되지 않았으면 null 입니다. */
  role: Admin | null;
  /* 권한을 나눠 줄 수 있는 사람인지입니다. */
  isOwner: boolean;
  /* 이 부서의 업무분장·서식·드라이브 링크를 고칠 수 있는지입니다. */
  canEdit: (deptId?: string) => boolean;
  signOut: () => void;
};

const SchoolUserContext = createContext<GateValue>({
  user: null,
  role: null,
  isOwner: false,
  canEdit: () => false,
  signOut: () => {}
});

export function useSchoolUser() {
  return useContext(SchoolUserContext);
}

export default function SchoolGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SchoolUser | null>(null);
  const [role, setRole] = useState<Admin | null>(null);
  const [checked, setChecked] = useState(!isSchoolLoginEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* 바탕화면 앱으로 설치되게 하는 서비스워커입니다. 로그인 전에도 등록해 둡니다. */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isSchoolLoginEnabled) return;
    return watchUser(next => {
      setUser(next);
      setChecked(true);
    });
  }, []);

  /* 로그인한 사람의 편집 권한을 지켜봅니다. */
  useEffect(() => {
    if (!isSchoolLoginEnabled || !user) {
      setRole(null);
      return;
    }
    return watchMyRole(user.email, setRole);
  }, [user]);

  const isOwner = user?.email === OWNER_EMAIL;

  const value: GateValue = {
    user,
    role,
    isOwner,
    canEdit: (deptId?: string) => {
      if (!user) return false;
      if (isOwner) return true;
      if (!role) return false;
      if (!role.dept) return true;
      return !deptId || role.dept === deptId;
    },
    signOut: () => {
      void signOutSchool();
    }
  };

  /* 설정 전에는 누구나 읽을 수 있는 상태로 둡니다. */
  if (!isSchoolLoginEnabled) {
    return <SchoolUserContext.Provider value={value}>{children}</SchoolUserContext.Provider>;
  }

  if (!checked) return null;

  if (user) {
    return <SchoolUserContext.Provider value={value}>{children}</SchoolUserContext.Provider>;
  }

  const login = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithSchool();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sg-root">
      <div className="sg-card">
        <h1 className="sg-title">우리학교 부별공유</h1>
        <p className="sg-copy">
          학교에서 받은 구글 계정으로 로그인해야 볼 수 있습니다.
          {SCHOOL_DOMAINS.length > 0 ? (
            <>
              <br />
              허용 계정: {SCHOOL_DOMAINS.map(d => `@${d}`).join(", ")}
            </>
          ) : null}
        </p>
        <button type="button" className="sg-login" onClick={login} disabled={busy}>
          {busy ? "로그인 중" : "학교 구글 계정으로 로그인"}
        </button>
        {error ? <p className="sg-error">{error}</p> : null}
        <p className="sg-note">여러 계정에 로그인되어 있으면 학교 계정을 골라 주세요.</p>
        <div className="sg-install">
          <InstallButton />
        </div>
      </div>
    </div>
  );
}
