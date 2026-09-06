/* 학교 계정 로그인과 저장소입니다.

   로그인은 파이어베이스 구글 로그인을 씁니다. 학교 도메인 계정만 통과합니다.
   저장소는 두 갈래입니다.
     duties : 부서별 업무 기록 (제목·설명·반복업무·링크)
     tasks  : 제출 과제 (구글 문서 링크, 마감일, 제출 주체 목록, 제출 완료 표시)
   실제 차단은 firestore.rules 가 합니다.
   설정값(NEXT_PUBLIC_FIREBASE_*)이 없으면 로그인도 저장도 꺼진 채 읽기 전용으로 열립니다. */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User
} from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const SCHOOL_DOMAINS = (process.env.NEXT_PUBLIC_SCHOOL_DOMAIN ?? "seoulsejong.sen.hs.kr")
  .split(",")
  .map(d => d.trim().replace(/^@/, "").toLowerCase())
  .filter(Boolean);

/* 파이어베이스 설정이 있어야 로그인과 기록을 씁니다. */
export const isSchoolLoginEnabled = Boolean(config.apiKey && config.projectId);

export const LIMITS = {
  title: 60,
  owner: 20,
  summary: 300,
  cycle: 60,
  what: 160,
  label: 40,
  href: 500,
  target: 30,
  routines: 10,
  links: 10,
  targets: 60
} as const;

export type SavedRoutine = { cycle: string; what: string };
export type SavedLink = { label: string; href: string };

export type SavedDuty = {
  id: string;
  deptId: string;
  title: string;
  owner: string;
  summary: string;
  routines: SavedRoutine[];
  links: SavedLink[];
  authorEmail: string;
  authorName: string;
};

/* 제출 과제입니다. 이름 대신 과목명·동아리명 같은 것을 주체로 씁니다. */
export type SavedTask = {
  id: string;
  deptId: string;
  title: string;
  due: string;
  docUrl: string;
  guide: string;
  targets: string[];
  done: string[];
  authorEmail: string;
};

export type SchoolUser = {
  email: string;
  name: string;
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function ready() {
  if (!isSchoolLoginEnabled) return false;
  if (!app) app = getApps()[0] ?? initializeApp(config as Record<string, string>);
  if (!auth) auth = getAuth(app);
  if (!db) db = getFirestore(app);
  return true;
}

export function isSchoolEmail(email: string | null | undefined) {
  if (!email) return false;
  if (SCHOOL_DOMAINS.length === 0) return true;
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return SCHOOL_DOMAINS.includes(domain);
}

function toSchoolUser(user: User | null): SchoolUser | null {
  if (!user || !isSchoolEmail(user.email)) return null;
  return { email: user.email ?? "", name: user.displayName ?? "" };
}

/* 로그인 상태가 바뀔 때마다 알려 줍니다. 학교 계정이 아니면 null 을 넘깁니다. */
export function watchUser(callback: (user: SchoolUser | null) => void) {
  if (!ready() || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, user => callback(toSchoolUser(user)));
}

export async function signInWithSchool(): Promise<SchoolUser> {
  if (!ready() || !auth) throw new Error("로그인이 아직 설정되지 않았습니다.");

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
    ...(SCHOOL_DOMAINS.length === 1 ? { hd: SCHOOL_DOMAINS[0] } : {})
  });

  const result = await signInWithPopup(auth, provider);
  const user = toSchoolUser(result.user);
  if (!user) {
    const email = result.user.email ?? "";
    await signOut(auth);
    throw new Error(`학교 계정이 아닙니다. (${email})`);
  }
  return user;
}

export async function signOutSchool() {
  if (!ready() || !auth) return;
  await signOut(auth);
}

/* ------------------------------------- */
/* 업무 기록                              */
/* ------------------------------------- */

export function watchDuties(
  deptId: string,
  onData: (duties: SavedDuty[]) => void,
  onError?: () => void
) {
  if (!ready() || !db) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, "duties"), where("deptId", "==", deptId));

  return onSnapshot(
    q,
    snapshot => {
      onData(
        snapshot.docs.map(d => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            deptId: String(data.deptId ?? ""),
            title: String(data.title ?? ""),
            owner: String(data.owner ?? ""),
            summary: String(data.summary ?? ""),
            routines: Array.isArray(data.routines) ? (data.routines as SavedRoutine[]) : [],
            links: Array.isArray(data.links) ? (data.links as SavedLink[]) : [],
            authorEmail: String(data.authorEmail ?? ""),
            authorName: String(data.authorName ?? "")
          };
        })
      );
    },
    () => onError?.()
  );
}

export type DutyInput = {
  deptId: string;
  title: string;
  owner: string;
  summary: string;
  routines: SavedRoutine[];
  links: SavedLink[];
};

function cleanDuty(input: DutyInput, user: SchoolUser) {
  return {
    deptId: input.deptId,
    title: input.title.trim().slice(0, LIMITS.title),
    owner: input.owner.trim().slice(0, LIMITS.owner),
    summary: input.summary.trim().slice(0, LIMITS.summary),
    routines: input.routines
      .filter(r => r.cycle.trim() && r.what.trim())
      .slice(0, LIMITS.routines)
      .map(r => ({
        cycle: r.cycle.trim().slice(0, LIMITS.cycle),
        what: r.what.trim().slice(0, LIMITS.what)
      })),
    links: input.links
      .filter(l => l.label.trim() && /^https?:\/\//i.test(l.href.trim()))
      .slice(0, LIMITS.links)
      .map(l => ({
        label: l.label.trim().slice(0, LIMITS.label),
        href: l.href.trim().slice(0, LIMITS.href)
      })),
    authorEmail: user.email,
    authorName: user.name
  };
}

export async function addDuty(input: DutyInput, user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const body = cleanDuty(input, user);
  if (!body.title) throw new Error("업무 제목을 적어 주세요.");
  await addDoc(collection(db, "duties"), { ...body, createdAt: serverTimestamp() });
}

export async function updateDuty(id: string, input: DutyInput, user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const body = cleanDuty(input, user);
  if (!body.title) throw new Error("업무 제목을 적어 주세요.");
  await updateDoc(doc(db, "duties", id), body);
}

export async function removeDuty(id: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await deleteDoc(doc(db, "duties", id));
}

/* ------------------------------------- */
/* 제출 과제                              */
/* ------------------------------------- */

export function watchTasks(onData: (tasks: SavedTask[]) => void, onError?: () => void) {
  if (!ready() || !db) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, "tasks"), orderBy("due", "asc"));

  return onSnapshot(
    q,
    snapshot => {
      onData(
        snapshot.docs.map(d => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            deptId: String(data.deptId ?? ""),
            title: String(data.title ?? ""),
            due: String(data.due ?? ""),
            docUrl: String(data.docUrl ?? ""),
            guide: String(data.guide ?? ""),
            targets: Array.isArray(data.targets) ? (data.targets as string[]) : [],
            done: Array.isArray(data.done) ? (data.done as string[]) : [],
            authorEmail: String(data.authorEmail ?? "")
          };
        })
      );
    },
    () => onError?.()
  );
}

export type TaskInput = {
  deptId: string;
  title: string;
  due: string;
  docUrl: string;
  guide: string;
  targets: string[];
};

function cleanTask(input: TaskInput, user: SchoolUser) {
  return {
    deptId: input.deptId,
    title: input.title.trim().slice(0, LIMITS.title),
    due: input.due.trim(),
    docUrl: /^https?:\/\//i.test(input.docUrl.trim()) ? input.docUrl.trim().slice(0, LIMITS.href) : "",
    guide: input.guide.trim().slice(0, LIMITS.summary),
    targets: Array.from(
      new Set(input.targets.map(t => t.trim().slice(0, LIMITS.target)).filter(Boolean))
    ).slice(0, LIMITS.targets),
    authorEmail: user.email
  };
}

export async function addTask(input: TaskInput, user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const body = cleanTask(input, user);
  if (!body.title) throw new Error("제출 과제 이름을 적어 주세요.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.due)) throw new Error("마감일을 골라 주세요.");
  if (body.targets.length === 0) throw new Error("제출 주체를 하나 이상 적어 주세요.");
  await addDoc(collection(db, "tasks"), { ...body, done: [], createdAt: serverTimestamp() });
}

export async function updateTask(id: string, input: TaskInput, user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const body = cleanTask(input, user);
  if (!body.title) throw new Error("제출 과제 이름을 적어 주세요.");
  await updateDoc(doc(db, "tasks", id), body);
}

export async function removeTask(id: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await deleteDoc(doc(db, "tasks", id));
}

/* 제출 주체 하나의 완료 표시를 켜고 끕니다. */
export async function toggleTaskDone(id: string, target: string, done: boolean) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await updateDoc(doc(db, "tasks", id), {
    done: done ? arrayUnion(target) : arrayRemove(target)
  });
}
