"use client";

import { useEffect, useMemo, useState } from "react";
import { asset } from "@/lib/asset";
import Calendar from "@/components/Calendar";
import DutyEditor from "@/components/DutyEditor";
import { DriveBar, FormList, PostBoard } from "@/components/DeptExtras";
import InstallButton from "@/components/InstallButton";
import TaskBoard from "@/components/TaskBoard";
import { useSchoolUser } from "@/components/SchoolGate";
import { isSchoolLoginEnabled } from "@/lib/school";
import { boardPosts } from "@/config/linktree";
import { departments, notices, type Department, type Duty, type Notice } from "@/config/departments";

const HOME = "home";

/* ------------------------------------- */
/* 날짜 계산                              */
/* ------------------------------------- */

/* "2026-09-08" 을 그 지역 자정으로 읽습니다. new Date("...") 는 UTC 로 읽혀 하루가 밀립니다. */
function parseDue(due: string) {
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysLeft(due: string) {
  return Math.round((parseDue(due).getTime() - startOfToday().getTime()) / 86_400_000);
}

function dueLabel(due: string) {
  const date = parseDue(due);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function leftLabel(left: number) {
  if (left < 0) return `${-left}일 지남`;
  if (left === 0) return "오늘까지";
  if (left === 1) return "내일까지";
  if (left <= 7) return `${left}일 남음`;
  return `${left}일 남음`;
}

function stateOf(left: number) {
  if (left < 0) return "over";
  if (left === 0) return "today";
  if (left <= 3) return "soon";
  return "later";
}

/* ------------------------------------- */
/* 마감 목록                              */
/* ------------------------------------- */

function DeadlineRow({ notice }: { notice: Notice }) {
  const left = daysLeft(notice.due);
  return (
    <li className={`dl-item is-${stateOf(left)}`}>
      <span className="dl-date">
        <b>{dueLabel(notice.due)}</b>
        <em>{leftLabel(left)}</em>
      </span>
      <span className="dl-body">
        <span className="dl-head">
          <span className="dl-dept">{notice.dept}</span>
          <span className="dl-title">{notice.title}</span>
        </span>
        {notice.detail ? <span className="dl-detail">{notice.detail}</span> : null}
      </span>
    </li>
  );
}

function HomeView() {
  const sorted = useMemo(() => [...notices].sort((a, b) => a.due.localeCompare(b.due)), []);

  const overdue = sorted.filter(n => daysLeft(n.due) < 0);
  const todayList = sorted.filter(n => daysLeft(n.due) === 0);
  const week = sorted.filter(n => {
    const left = daysLeft(n.due);
    return left >= 1 && left <= 7;
  });
  const later = sorted.filter(n => daysLeft(n.due) > 7);

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>부별공유</h1>
          <p>부서별 업무분장과 마감을 한곳에서 봅니다. 자료는 구글 문서와 시트에 두고 여기에는 링크만 겁니다.</p>
        </div>
      </section>

      <section className="board">
        <div className="board-col">
          <h2 className="sec-title">이달의 마감</h2>
          <Calendar notices={notices} />
        </div>

        <div className="board-col">
          <h2 className="sec-title">마감 기한</h2>

          {todayList.length > 0 ? (
            <div className="dl-group is-highlight">
              <h3 className="dl-group-title">오늘까지</h3>
              <ul className="dl-list">
                {todayList.map(n => (
                  <DeadlineRow key={n.id} notice={n} />
                ))}
              </ul>
            </div>
          ) : (
            <div className="dl-empty">오늘 마감인 일은 없습니다.</div>
          )}

          {overdue.length > 0 ? (
            <div className="dl-group">
              <h3 className="dl-group-title">기한이 지난 일</h3>
              <ul className="dl-list">
                {overdue.map(n => (
                  <DeadlineRow key={n.id} notice={n} />
                ))}
              </ul>
            </div>
          ) : null}

          <div className="dl-group">
            <h3 className="dl-group-title">이번 주 안에</h3>
            {week.length === 0 ? (
              <div className="dl-empty">이번 주 마감은 없습니다.</div>
            ) : (
              <ul className="dl-list">
                {week.map(n => (
                  <DeadlineRow key={n.id} notice={n} />
                ))}
              </ul>
            )}
          </div>

          {later.length > 0 ? (
            <div className="dl-group">
              <h3 className="dl-group-title">다가오는 일</h3>
              <ul className="dl-list">
                {later.map(n => (
                  <DeadlineRow key={n.id} notice={n} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="tasks">
        <h2 className="sec-title">부서에서 올린 글</h2>
        <PostBoard deptId={null} limit={5} />
      </section>

      <section className="tasks">
        <h2 className="sec-title">제출 현황</h2>
        <TaskBoard />
      </section>

      {boardPosts.length > 0 ? (
        <section className="links">
          <h2 className="sec-title">공용 링크</h2>
          <ul className="link-grid">
            {boardPosts.map(post => (
              <li key={post.id}>
                <a className="link-card" href={post.href} target="_blank" rel="noopener noreferrer">
                  <span className="link-tag">{post.category}</span>
                  <span className="link-title">{post.title}</span>
                  {post.summary ? <span className="link-sum">{post.summary}</span> : null}
                  <span className="link-host">{post.date}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/* ------------------------------------- */
/* 부서 화면                              */
/* ------------------------------------- */

function DutyDetail({ duty, deptId, onBack }: { duty: Duty; deptId: string; onBack: () => void }) {
  return (
    <article className="duty-detail">
      <button type="button" className="back-btn" onClick={onBack}>
        업무분장 목록으로
      </button>

      <header className="duty-detail-head">
        <h2>{duty.title}</h2>
        {duty.owner ? <span className="duty-owner">{duty.owner}</span> : null}
      </header>

      <p className="duty-summary">{duty.summary}</p>

      <section className="duty-block">
        <h3>반복되는 업무</h3>
        <ul className="routine-list">
          {duty.routines.map((routine, i) => (
            <li key={i}>
              <span className="routine-cycle">{routine.cycle}</span>
              <span className="routine-what">{routine.what}</span>
            </li>
          ))}
        </ul>
      </section>

      {duty.howto && duty.howto.length > 0 ? (
        <section className="duty-block">
          <h3>처리 절차</h3>
          <ol className="step-list">
            {duty.howto.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {duty.notes && duty.notes.length > 0 ? (
        <section className="duty-block">
          <h3>인수인계 메모</h3>
          <ul className="note-list">
            {duty.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <FormList deptId={deptId} dutyId={duty.id} />

      {duty.links && duty.links.length > 0 ? (
        <section className="duty-block">
          <h3>관련 문서·링크</h3>
          <ul className="chip-list">
            {duty.links.map(link => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function DeptView({ dept }: { dept: Department }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = dept.duties.find(d => d.id === openId);

  return (
    <section className="dept">
      <header className="dept-head">
        <h1>{dept.name}</h1>
        {dept.subtitle ? <p>{dept.subtitle}</p> : null}
      </header>

      <DriveBar deptId={dept.id} note={dept.drive?.note} />

      {open ? null : (
        <section className="dept-block">
          <h2 className="sec-title">부서 게시판</h2>
          <PostBoard deptId={dept.id} />
        </section>
      )}

      {open ? null : (
        <section className="dept-block">
          <h2 className="sec-title">제출 현황</h2>
          <TaskBoard deptId={dept.id} />
        </section>
      )}

      {open ? null : <h2 className="sec-title">업무분장</h2>}

      {open ? (
        <DutyDetail duty={open} deptId={dept.id} onBack={() => setOpenId(null)} />
      ) : dept.duties.length === 0 ? (
        <div className="dl-empty">아직 등록된 업무분장이 없습니다.</div>
      ) : (
        <ul className="duty-grid">
          {dept.duties.map(duty => (
            <li key={duty.id}>
              <button type="button" className="duty-card" onClick={() => setOpenId(duty.id)}>
                <span className="duty-card-head">
                  <span className="duty-card-title">{duty.title}</span>
                  {duty.owner ? <span className="duty-owner">{duty.owner}</span> : null}
                </span>
                <span className="duty-card-sum">{duty.summary}</span>
                <span className="duty-card-meta">
                  반복 업무 {duty.routines.length}건
                  {duty.links && duty.links.length > 0 ? ` · 링크 ${duty.links.length}개` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? null : <DutyEditor deptId={dept.id} />}
    </section>
  );
}

/* ------------------------------------- */
/* 전체 틀                                */
/* ------------------------------------- */

function SignedIn() {
  const { user, signOut } = useSchoolUser();
  if (!isSchoolLoginEnabled || !user) return null;
  return (
    <span className="hd-user">
      {user.name || user.email}
      <button type="button" onClick={signOut}>
        로그아웃
      </button>
    </span>
  );
}

export default function LinkTree() {
  const [tab, setTab] = useState<string>(HOME);
  const activeDept = departments.find(d => d.id === tab);

  /* ?tab=affairs 처럼 주소로 바로 들어올 수 있게 합니다. */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (!wanted) return;
    if (wanted === HOME || departments.some(d => d.id === wanted)) setTab(wanted);
  }, []);

  /* 바탕화면 앱으로 설치되게 하는 서비스워커입니다. */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {
      /* 등록에 실패해도 사이트는 그대로 씁니다. */
    });
  }, []);

  return (
    <div className="pg">
      <header className="hd">
        <div className="hd-in">
          <div className="hd-brand">
            <img src={asset("/assets/school-logo.png")} alt="서울세종고등학교" />
            <span className="hd-sub">부별공유</span>
          </div>
          <div className="hd-right">
            <SignedIn />
            <InstallButton />
          </div>
        </div>

        <nav className="gnb" aria-label="부서 선택">
          <div className="gnb-in">
            <button
              type="button"
              className={`gnb-btn${tab === HOME ? " is-active" : ""}`}
              onClick={() => setTab(HOME)}
            >
              교무실
            </button>
            {departments.map(dept => (
              <button
                key={dept.id}
                type="button"
                className={`gnb-btn${tab === dept.id ? " is-active" : ""}`}
                onClick={() => setTab(dept.id)}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mn">
        {activeDept ? <DeptView key={activeDept.id} dept={activeDept} /> : <HomeView />}
      </main>

      <footer className="ft">
        <p>서울세종고등학교 부별공유. 자료는 구글 드라이브에 두고 이곳에는 링크만 올립니다.</p>
        <p className="ft-warn">학생 개인정보와 대외비 문서는 이 사이트에 직접 적지 않습니다.</p>
      </footer>
    </div>
  );
}
