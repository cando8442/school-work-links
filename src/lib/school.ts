/* 학교 계정 로그인과 저장소입니다.

   로그인은 파이어베이스 구글 로그인을 씁니다. 학교 도메인 계정만 통과합니다.
   저장소는 두 갈래입니다.
     duties : 부서별 업무 기록 (제목·설명·반복업무·링크)
     tasks  : 제출 과제 (구글 문서 링크, 마감일, 제출 주체 목록, 제출 완료 표시)
   실제 차단은 firestore.rules 가 합니다.
   설정값(NEXT_PUBLIC_FIREBASE_*)이 없으면 로그인도 저장도 꺼진 채 읽기 전용으로 열립니다. */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { SCHOOL, SCHOOL_DOMAIN_LIST } from "@/config/school";
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
  setDoc,
  updateDoc,
  where,
  writeBatch,
  getDocs,
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

export const SCHOOL_DOMAINS = SCHOOL_DOMAIN_LIST;

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
  targets: 60,
  /* 교사 명단과 제출 대상자 */
  personName: 20,
  email: 120,
  assignees: 200,
  teachers: 400
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

/* 제출 대상자입니다. 교사 명단에서 골라 넣습니다. */
export type Assignee = { name: string; email: string };

/* 제출 과제입니다.
   targets 는 과목명·동아리명처럼 업무 단위 주체이고,
   assignees 는 교사 명단에서 고른 실제 사람입니다. 둘 다 쓸 수 있습니다.
   done 에는 제출을 마친 주체 이름과 대상자 이메일이 함께 들어갑니다. */
export type SavedTask = {
  id: string;
  deptId: string;
  title: string;
  due: string;
  docUrl: string;
  guide: string;
  /* 이 과제를 챙기는 사람입니다. */
  ownerName: string;
  ownerEmail: string;
  targets: string[];
  assignees: Assignee[];
  done: string[];
  authorEmail: string;
};

/* 학교 교사 명단입니다. 제출 대상자를 고를 때 씁니다. */
export type Teacher = {
  /* 문서 아이디이자 로그인 이메일입니다. */
  email: string;
  name: string;
  /* 소속 부서 표시입니다. 비워 둘 수 있습니다. */
  dept: string;
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
            ownerName: String(data.ownerName ?? ""),
            ownerEmail: String(data.ownerEmail ?? ""),
            targets: Array.isArray(data.targets) ? (data.targets as string[]) : [],
            assignees: Array.isArray(data.assignees) ? (data.assignees as Assignee[]) : [],
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
  ownerName: string;
  ownerEmail: string;
  targets: string[];
  assignees: Assignee[];
};

function cleanTask(input: TaskInput, user: SchoolUser) {
  return {
    deptId: input.deptId,
    title: input.title.trim().slice(0, LIMITS.title),
    due: input.due.trim(),
    docUrl: /^https?:\/\//i.test(input.docUrl.trim()) ? input.docUrl.trim().slice(0, LIMITS.href) : "",
    guide: input.guide.trim().slice(0, LIMITS.summary),
    ownerName: input.ownerName.trim().slice(0, LIMITS.personName),
    ownerEmail: input.ownerEmail.trim().toLowerCase().slice(0, LIMITS.email),
    targets: Array.from(
      new Set(input.targets.map(t => t.trim().slice(0, LIMITS.target)).filter(Boolean))
    ).slice(0, LIMITS.targets),
    assignees: dedupeAssignees(input.assignees).slice(0, LIMITS.assignees),
    authorEmail: user.email
  };
}

/* 같은 이메일이 두 번 들어가지 않게 정리합니다. */
function dedupeAssignees(list: Assignee[]) {
  const seen = new Set<string>();
  const out: Assignee[] = [];
  for (const person of list) {
    const email = person.email.trim().toLowerCase().slice(0, LIMITS.email);
    const name = person.name.trim().slice(0, LIMITS.personName);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push({ name, email });
  }
  return out;
}

export async function addTask(input: TaskInput, user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const body = cleanTask(input, user);
  if (!body.title) throw new Error("제출 과제 이름을 적어 주세요.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.due)) throw new Error("마감일을 골라 주세요.");
  if (body.targets.length === 0 && body.assignees.length === 0)
    throw new Error("제출 주체나 제출 대상자를 하나 이상 지정해 주세요.");
  if (body.ownerEmail && !isSchoolEmail(body.ownerEmail))
    throw new Error("담당자 이메일은 학교 계정이어야 합니다.");
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

/* ------------------------------------- */
/* 교사 명단                              */
/* ------------------------------------- */

/* 이름만 적힌 줄에는 학교 도메인을 붙여 이메일을 만듭니다.
   한 줄에 "홍길동, hong" 또는 "홍길동, hong@seoulsejong.sen.hs.kr" 처럼 적습니다. */
export function parseTeacherText(text: string): Teacher[] {
  const domain = SCHOOL_DOMAINS[0] ?? "";
  const out: Teacher[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.replace("\r", "").trim();
    if (!line) continue;

    /* 쉼표, 탭, 세미콜론, 두 칸 이상 공백으로 칸을 나눕니다. */
    const cells = line
      .split(/[\t,;]+|\s{2,}/)
      .map(c => c.trim())
      .filter(Boolean);

    /* 칸이 하나뿐이면 "홍길동 hong" 처럼 한 칸 띄어 쓴 것으로 봅니다. */
    const parts = cells.length === 1 ? cells[0].split(/\s+/) : cells;
    if (parts.length < 2) continue;

    const name = parts[0];
    let account = parts[1];
    const dept = parts[2] ?? "";

    if (!account) continue;
    if (!account.includes("@")) account = domain ? account + "@" + domain : account;
    if (!account.includes("@")) continue;

    out.push({
      name: name.slice(0, LIMITS.personName),
      email: account.toLowerCase().slice(0, LIMITS.email),
      dept: dept.slice(0, LIMITS.personName)
    });
  }

  return out;
}

export function watchTeachers(onData: (list: Teacher[]) => void) {
  if (!ready() || !db) {
    onData([]);
    return () => {};
  }
  return onSnapshot(collection(db, "teachers"), snapshot => {
    const list = snapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      return {
        email: String(data.email ?? d.id),
        name: String(data.name ?? ""),
        dept: String(data.dept ?? "")
      };
    });
    list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    onData(list);
  });
}

/* 명단을 한꺼번에 올립니다. 같은 이메일은 덮어씁니다. */
export async function saveTeachers(list: Teacher[], user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const clean = list
    .filter(t => t.email && isSchoolEmail(t.email))
    .slice(0, LIMITS.teachers);
  if (clean.length === 0) throw new Error("올릴 수 있는 학교 계정이 없습니다.");

  /* 파이어스토어 일괄 쓰기는 한 번에 500건까지입니다. */
  for (let i = 0; i < clean.length; i += 400) {
    const batch = writeBatch(db);
    for (const person of clean.slice(i, i + 400)) {
      batch.set(doc(db, "teachers", person.email), {
        email: person.email,
        name: person.name,
        dept: person.dept,
        updatedBy: user.email
      });
    }
    await batch.commit();
  }
  return clean.length;
}

export async function removeTeacher(email: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await deleteDoc(doc(db, "teachers", email));
}

/* 명단을 통째로 비웁니다. 새 학년도에 명단을 갈아 끼울 때 씁니다. */
export async function clearTeachers() {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const snapshot = await getDocs(collection(db, "teachers"));
  for (let i = 0; i < snapshot.docs.length; i += 400) {
    const batch = writeBatch(db);
    for (const d of snapshot.docs.slice(i, i + 400)) batch.delete(d.ref);
    await batch.commit();
  }
  return snapshot.docs.length;
}

/* 제출 주체 하나의 완료 표시를 켜고 끕니다. */
export async function toggleTaskDone(id: string, target: string, done: boolean) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await updateDoc(doc(db, "tasks", id), {
    done: done ? arrayUnion(target) : arrayRemove(target)
  });
}

/* ------------------------------------- */
/* 부서 공유 드라이브 링크                 */
/* ------------------------------------- */

export type DeptMeta = { driveUrl: string; updatedBy: string };

export function watchDeptMeta(deptId: string, onData: (meta: DeptMeta | null) => void) {
  if (!ready() || !db) {
    onData(null);
    return () => {};
  }
  return onSnapshot(doc(db, "depts", deptId), snapshot => {
    const data = snapshot.data() as Record<string, unknown> | undefined;
    onData(
      data
        ? { driveUrl: String(data.driveUrl ?? ""), updatedBy: String(data.updatedBy ?? "") }
        : null
    );
  });
}

export async function saveDriveUrl(deptId: string, url: string, user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const clean = url.trim();
  if (clean && !/^https?:\/\//i.test(clean)) throw new Error("https 로 시작하는 주소를 넣어 주세요.");
  await setDoc(doc(db, "depts", deptId), {
    driveUrl: clean.slice(0, LIMITS.href),
    updatedBy: user.email
  });
}

/* ------------------------------------- */
/* 부서 게시글                            */
/* ------------------------------------- */

export type SavedPost = {
  id: string;
  deptId: string;
  title: string;
  body: string;
  links: SavedLink[];
  authorEmail: string;
  authorName: string;
  createdAt: number;
};

export function watchPosts(deptId: string | null, onData: (posts: SavedPost[]) => void) {
  if (!ready() || !db) {
    onData([]);
    return () => {};
  }

  const base = collection(db, "posts");
  const q = deptId ? query(base, where("deptId", "==", deptId)) : query(base);

  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      const stamp = data.createdAt as { toMillis?: () => number } | undefined;
      return {
        id: d.id,
        deptId: String(data.deptId ?? ""),
        title: String(data.title ?? ""),
        body: String(data.body ?? ""),
        links: Array.isArray(data.links) ? (data.links as SavedLink[]) : [],
        authorEmail: String(data.authorEmail ?? ""),
        authorName: String(data.authorName ?? ""),
        createdAt: typeof stamp?.toMillis === "function" ? stamp.toMillis() : 0
      };
    });
    list.sort((a, b) => b.createdAt - a.createdAt);
    onData(list);
  });
}

export type PostInput = {
  deptId: string;
  title: string;
  body: string;
  links: SavedLink[];
};

export async function addPost(input: PostInput, user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const title = input.title.trim().slice(0, LIMITS.title);
  if (!title) throw new Error("제목을 적어 주세요.");
  await addDoc(collection(db, "posts"), {
    deptId: input.deptId,
    title,
    body: input.body.trim().slice(0, 4000),
    links: input.links
      .filter(l => l.label.trim() && /^https?:\/\//i.test(l.href.trim()))
      .slice(0, LIMITS.links)
      .map(l => ({ label: l.label.trim().slice(0, LIMITS.label), href: l.href.trim().slice(0, LIMITS.href) })),
    authorEmail: user.email,
    authorName: user.name,
    createdAt: serverTimestamp()
  });
}

export async function removePost(id: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await deleteDoc(doc(db, "posts", id));
}

/* ------------------------------------- */
/* 업무분장별 서식                         */
/* ------------------------------------- */

export type SavedForm = {
  id: string;
  deptId: string;
  dutyId: string;
  label: string;
  href: string;
  kind: string;
  authorEmail: string;
};

export function watchForms(deptId: string, onData: (forms: SavedForm[]) => void) {
  if (!ready() || !db) {
    onData([]);
    return () => {};
  }
  return onSnapshot(query(collection(db, "forms"), where("deptId", "==", deptId)), snapshot => {
    onData(
      snapshot.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          deptId: String(data.deptId ?? ""),
          dutyId: String(data.dutyId ?? ""),
          label: String(data.label ?? ""),
          href: String(data.href ?? ""),
          kind: String(data.kind ?? ""),
          authorEmail: String(data.authorEmail ?? "")
        };
      })
    );
  });
}

export type FormInput = {
  deptId: string;
  dutyId: string;
  label: string;
  href: string;
  kind: string;
};

export async function addForm(input: FormInput, user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const label = input.label.trim().slice(0, LIMITS.label);
  const href = input.href.trim();
  if (!label) throw new Error("서식 이름을 적어 주세요.");
  if (!/^https?:\/\//i.test(href)) throw new Error("https 로 시작하는 주소를 넣어 주세요.");
  await addDoc(collection(db, "forms"), {
    deptId: input.deptId,
    dutyId: input.dutyId,
    label,
    href: href.slice(0, LIMITS.href),
    kind: input.kind.trim().slice(0, 20),
    authorEmail: user.email,
    createdAt: serverTimestamp()
  });
}

export async function removeForm(id: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await deleteDoc(doc(db, "forms", id));
}

/* ------------------------------------- */
/* 편집 권한                              */
/* ------------------------------------- */

/* 이 사람만 권한을 나눠 줄 수 있습니다. firestore.rules 의 isOwner() 와 같아야 합니다.
   값은 src/config/school.ts 에서 고칩니다. */
export const OWNER_EMAIL: string = SCHOOL.ownerEmail;

export type Admin = {
  email: string;
  name: string;
  /* 비워 두면 모든 부서를 편집할 수 있습니다. */
  dept: string;
};

export function watchAdmins(onData: (admins: Admin[]) => void) {
  if (!ready() || !db) {
    onData([]);
    return () => {};
  }
  return onSnapshot(collection(db, "admins"), snapshot => {
    onData(
      snapshot.docs.map(d => {
        const data = d.data() as Record<string, unknown>;
        return {
          email: d.id,
          name: String(data.name ?? ""),
          dept: String(data.dept ?? "")
        };
      })
    );
  });
}

/* 내 권한 한 건만 봅니다. 없으면 null 입니다. */
export function watchMyRole(email: string, onData: (admin: Admin | null) => void) {
  if (!ready() || !db || !email) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, "admins", email),
    snapshot => {
      const data = snapshot.data() as Record<string, unknown> | undefined;
      onData(data ? { email, name: String(data.name ?? ""), dept: String(data.dept ?? "") } : null);
    },
    () => onData(null)
  );
}

export async function addAdmin(email: string, name: string, dept: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const clean = email.trim().toLowerCase();
  if (!isSchoolEmail(clean)) throw new Error("학교 계정 주소만 등록할 수 있습니다.");
  await setDoc(doc(db, "admins", clean), {
    name: name.trim().slice(0, LIMITS.owner),
    dept: dept.trim()
  });
}

export async function removeAdmin(email: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await deleteDoc(doc(db, "admins", email));
}

/* ------------------------------------- */
/* 학사일정과 마감                         */
/* ------------------------------------- */

/* kind
     schedule : 학사일정. 달력에만 표시합니다.
     deadline : 마감. 달력과 마감 목록에 함께 표시합니다. */
export type SchoolEvent = {
  id: string;
  date: string;
  title: string;
  kind: "schedule" | "deadline";
  dept: string;
  detail: string;
  authorEmail: string;
  /* pending 이면 담당자가 승인하기 전이라 달력에 나오지 않습니다. */
  status: "pending" | "published";
  /* 이 일을 하려면 열어야 하는 구글 시트나 서식입니다. */
  links: SavedLink[];
};

export type EventInput = {
  date: string;
  title: string;
  kind: "schedule" | "deadline";
  dept: string;
  detail: string;
  status?: "pending" | "published";
};

export function watchEvents(onData: (events: SchoolEvent[]) => void) {
  if (!ready() || !db) {
    onData([]);
    return () => {};
  }
  return onSnapshot(collection(db, "events"), snapshot => {
    const list = snapshot.docs.map(d => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        date: String(data.date ?? ""),
        title: String(data.title ?? ""),
        kind: (data.kind === "deadline" ? "deadline" : "schedule") as "schedule" | "deadline",
        dept: String(data.dept ?? ""),
        detail: String(data.detail ?? ""),
        authorEmail: String(data.authorEmail ?? ""),
        status: (data.status === "pending" ? "pending" : "published") as "pending" | "published",
        links: Array.isArray(data.links) ? (data.links as SavedLink[]) : []
      };
    });
    list.sort((a, b) => a.date.localeCompare(b.date));
    onData(list);
  });
}

function cleanEvent(input: EventInput, user: SchoolUser) {
  return {
    date: input.date.trim(),
    title: input.title.trim().slice(0, LIMITS.title),
    kind: input.kind === "deadline" ? "deadline" : "schedule",
    dept: input.dept.trim().slice(0, LIMITS.owner),
    detail: input.detail.trim().slice(0, LIMITS.summary),
    authorEmail: user.email,
    status: input.status === "pending" ? "pending" : "published"
  };
}

/* 여러 건을 한 번에 넣습니다. 붙여넣기로 들어온 학사일정을 저장할 때 씁니다. */
export async function addEvents(inputs: EventInput[], user: SchoolUser) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const rows = inputs
    .map(i => cleanEvent(i, user))
    .filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.title);
  if (rows.length === 0) throw new Error("넣을 수 있는 줄이 없습니다. 날짜와 내용을 확인해 주세요.");

  for (const row of rows) {
    await addDoc(collection(db, "events"), { ...row, createdAt: serverTimestamp() });
  }
  return rows.length;
}

export async function removeEvent(id: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await deleteDoc(doc(db, "events", id));
}

/* 대기 중인 일정을 올립니다. */
export async function approveEvent(id: string) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  await updateDoc(doc(db, "events", id), { status: "published" });
}

/* 이 일에 딸린 시트와 서식 링크를 바꿉니다. */
export async function setEventLinks(id: string, links: SavedLink[]) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const clean = links
    .filter(l => l.label.trim() && /^https?:\/\//i.test(l.href.trim()))
    .slice(0, LIMITS.links)
    .map(l => ({
      label: l.label.trim().slice(0, LIMITS.label),
      href: l.href.trim().slice(0, LIMITS.href)
    }));
  await updateDoc(doc(db, "events", id), { links: clean });
}

/* 일정 한 건을 고칩니다. */
export async function editEvent(
  id: string,
  patch: { date?: string; title?: string; dept?: string; detail?: string; kind?: "schedule" | "deadline" }
) {
  if (!ready() || !db) throw new Error("아직 저장소가 설정되지 않았습니다.");
  const body: Record<string, string> = {};
  if (patch.date && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) body.date = patch.date;
  if (patch.title) body.title = patch.title.trim().slice(0, LIMITS.title);
  if (patch.dept !== undefined) body.dept = patch.dept.trim().slice(0, LIMITS.owner);
  if (patch.detail !== undefined) body.detail = patch.detail.trim().slice(0, LIMITS.summary);
  if (patch.kind) body.kind = patch.kind;
  if (Object.keys(body).length === 0) return;
  await updateDoc(doc(db, "events", id), body);
}
