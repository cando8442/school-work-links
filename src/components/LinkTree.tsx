"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Spiral, type SpiralProps } from "@paper-design/shaders-react";
import { asset } from "@/lib/asset";
import BgmPlayer, { type BgmHandle } from "@/components/BgmPlayer";
import { isCounterEnabled, recordVisit, type VisitCounts } from "@/lib/firebase";
import { boardPosts, profile, waveLinks } from "@/config/linktree";
import { departments, notices, type Department, type Duty } from "@/config/departments";
import { theme } from "@/config/theme";

/* 탭은 "홈(교무실)" 하나와 부서 하나씩입니다. 부서를 늘리려면 departments.ts 만 고치면 됩니다. */
const HOME_TAB = "home";
type TabName = string;

const TABS: TabName[] = [HOME_TAB, ...departments.map(d => d.id)];

const NAV_LABELS: Record<string, string> = {
  [HOME_TAB]: "교무실",
  ...Object.fromEntries(departments.map(d => [d.id, d.name]))
};

/* 진입 화면 셰이더 배경 설정입니다. 색은 theme.ts 를 따릅니다. */
const spiralProps = {
  fit: "none",
  scale: 1.3,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  originX: 0.5,
  originY: 0.5,
  worldWidth: 0,
  worldHeight: 0,
  density: 0.5,
  colorBack: theme.colors.cream,
  colorFront: theme.colors.spiralFront,
  distortion: 0,
  strokeWidth: 0.5,
  strokeTaper: 0,
  strokeCap: 0,
  noise: 1,
  noiseFrequency: 0.25,
  softness: 0,
  speed: 0.75,
  frame: 0,
  maxPixelCount: 1_500_000
} satisfies Partial<SpiralProps>;

const introStyle = {
  "--cream": theme.colors.cream,
  "--ink": theme.colors.ink,
  "--brown": theme.colors.brown,
  "--display": "'Pretendard', 'Noto Sans KR', system-ui, sans-serif",
  "--body": "'Pretendard', 'Noto Sans KR', system-ui, sans-serif"
} as React.CSSProperties;

function ChevronDown({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IntroOverlay({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="lt-intro" style={introStyle}>
      <Spiral className="lt-intro-spiral" {...spiralProps} />
      <div className="lt-intro-card">
        <span className="lt-intro-title">{profile.introTitle}</span>
        <p className="lt-intro-copy">{profile.introDescription}</p>
        <button type="button" className="lt-intro-cta" onClick={onBrowse}>
          부서별 업무 보기
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="cy-section-title">
      {title}
      {sub ? <span className="cy-sub-text">{sub}</span> : null}
    </div>
  );
}

/* ------------------------------------- */
/* 공지 (홈 = 교무실 화면)                 */
/* ------------------------------------- */

/* "2026-09-08" 을 현지 자정 기준 날짜로 읽습니다. new Date("...") 는 UTC 로 읽혀 하루가 밀립니다. */
function parseDue(due: string) {
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysLeft(due: string) {
  const diff = parseDue(due).getTime() - startOfToday().getTime();
  return Math.round(diff / 86_400_000);
}

function dueLabel(due: string) {
  const date = parseDue(due);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function leftLabel(left: number) {
  if (left < 0) return `${-left}일 지남`;
  if (left === 0) return "오늘까지";
  if (left === 1) return "내일까지";
  return `${left}일 남음`;
}

function NoticeBoard() {
  /* 마감이 빠른 것부터 보여 줍니다. 이미 지난 것은 뒤로 내리되 지우지는 않습니다. */
  const sorted = useMemo(() => {
    return [...notices].sort((a, b) => a.due.localeCompare(b.due));
  }, []);

  const upcoming = sorted.filter(n => daysLeft(n.due) >= 0);
  const overdue = sorted.filter(n => daysLeft(n.due) < 0);
  const list = [...upcoming, ...overdue];

  return (
    <div className="cy-content-box">
      <SectionTitle title="교무실 공지" sub="언제까지 무엇을" />
      {list.length === 0 ? (
        <div className="cy-empty-box">등록된 공지가 없습니다.</div>
      ) : (
        <ul className="cy-notice-list">
          {list.map(notice => {
            const left = daysLeft(notice.due);
            const state = left < 0 ? "is-over" : left <= 3 ? "is-soon" : "";
            return (
              <li key={notice.id} className={`cy-notice-item ${state}`}>
                <span className="cy-notice-due">
                  <span className="cy-notice-date">{dueLabel(notice.due)}</span>
                  <span className="cy-notice-left">{leftLabel(left)}</span>
                </span>
                <span className="cy-notice-body">
                  <span className="cy-notice-head">
                    <span className="cy-notice-dept">{notice.dept}</span>
                    <span className="cy-notice-title">{notice.title}</span>
                  </span>
                  {notice.detail ? <span className="cy-notice-detail">{notice.detail}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CommonLinks() {
  if (boardPosts.length === 0) return null;
  return (
    <div className="cy-content-box">
      <SectionTitle title={profile.boardLabel} sub={profile.boardSubtitle} />
      <ul className="cy-board-list">
        {boardPosts.map(post => (
          <li key={post.id} className="cy-board-item">
            <a className="cy-board-link" href={post.href} target="_blank" rel="noopener noreferrer">
              <span className="cy-board-text">
                <span className="cy-board-head">
                  <span className="cy-board-category">{post.category}</span>
                  <span className="cy-board-title">{post.title}</span>
                </span>
                {post.summary ? <span className="cy-board-summary">{post.summary}</span> : null}
                <span className="cy-board-date">{post.date}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HomeTab() {
  return (
    <>
      <NoticeBoard />

      <div className="cy-content-box cy-miniroom-box">
        <SectionTitle title="교무실" sub="부서 탭에서 업무분장을 찾으세요" />
        <div className="cy-miniroom-inner">
          <img src={asset(profile.miniroom.src)} alt={profile.miniroom.alt} />
        </div>
      </div>

      <CommonLinks />
    </>
  );
}

/* ------------------------------------- */
/* 부서 탭                                */
/* ------------------------------------- */

function DutyDetail({ duty, onBack }: { duty: Duty; onBack: () => void }) {
  return (
    <div className="cy-content-box">
      <SectionTitle title={duty.title} sub={duty.owner} />
      <button className="cy-back-btn" onClick={onBack}>
        업무분장 목록으로
      </button>

      <div className="cy-duty-summary">{duty.summary}</div>

      <div className="cy-duty-block">
        <div className="cy-duty-heading">반복되는 업무</div>
        <ul className="cy-routine-list">
          {duty.routines.map((routine, i) => (
            <li key={i} className="cy-routine-item">
              <span className="cy-routine-cycle">{routine.cycle}</span>
              <span className="cy-routine-what">{routine.what}</span>
            </li>
          ))}
        </ul>
      </div>

      {duty.howto && duty.howto.length > 0 ? (
        <div className="cy-duty-block">
          <div className="cy-duty-heading">처리 절차</div>
          <ol className="cy-duty-steps">
            {duty.howto.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {duty.notes && duty.notes.length > 0 ? (
        <div className="cy-duty-block">
          <div className="cy-duty-heading">인수인계 메모</div>
          <ul className="cy-duty-notes">
            {duty.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {duty.links && duty.links.length > 0 ? (
        <div className="cy-duty-block">
          <div className="cy-duty-heading">관련 링크</div>
          <ul className="cy-duty-links">
            {duty.links.map(link => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DeptTab({ dept }: { dept: Department }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = dept.duties.find(d => d.id === openId);

  if (open) {
    return <DutyDetail duty={open} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="cy-content-box">
      <SectionTitle title={dept.name} sub={dept.subtitle ?? `업무분장 ${dept.duties.length}건`} />

      {dept.drive ? (
        <div className="cy-drive-box">
          {dept.drive.url ? (
            <a className="cy-drive-link" href={dept.drive.url} target="_blank" rel="noopener noreferrer">
              부서 공유 드라이브 열기
            </a>
          ) : (
            <span className="cy-drive-empty">공유 드라이브 링크가 아직 등록되지 않았습니다.</span>
          )}
          {dept.drive.note ? <span className="cy-drive-note">{dept.drive.note}</span> : null}
        </div>
      ) : null}

      {dept.duties.length === 0 ? (
        <div className="cy-empty-box">아직 등록된 업무분장이 없습니다.</div>
      ) : (
        <ul className="cy-duty-list">
          {dept.duties.map(duty => (
            <li key={duty.id} className="cy-duty-item">
              <button type="button" className="cy-duty-btn" onClick={() => setOpenId(duty.id)}>
                <span className="cy-duty-head">
                  <span className="cy-duty-title">{duty.title}</span>
                  {duty.owner ? <span className="cy-duty-owner">{duty.owner}</span> : null}
                </span>
                <span className="cy-duty-sum">{duty.summary}</span>
                <span className="cy-duty-meta">반복 업무 {duty.routines.length}건</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* 미니홈피 왼쪽 위 방문 수입니다. 들어올 때마다 한 번 기록하고 그 결과를 보여 줍니다.
   Firestore 가 설정되지 않았거나 아직 못 받았으면 숫자 자리를 - 로 둡니다. */
function VisitCounter() {
  const [counts, setCounts] = useState<VisitCounts | null>(null);
  /* 개발 모드에서 효과가 두 번 실행돼 2씩 오르는 것을 막습니다. */
  const sentRef = useRef(false);

  useEffect(() => {
    if (!isCounterEnabled || sentRef.current) return;
    sentRef.current = true;
    recordVisit()
      .then(setCounts)
      .catch(() => setCounts(null));
  }, []);

  const show = (value: number | undefined) =>
    typeof value === "number" ? value.toLocaleString() : "-";

  return (
    <span className="cy-today-count">
      TODAY <span className="text-orange">{show(counts?.today)}</span>
      {" | "}
      TOTAL <span className="text-black">{show(counts?.total)}</span>
    </span>
  );
}

export default function LinkTree() {
  const [activeTab, setActiveTab] = useState<TabName>(HOME_TAB);
  const [introSkipped, setIntroSkipped] = useState(false);
  const bgmRef = useRef<BgmHandle>(null);

  const activeDept = departments.find(d => d.id === activeTab);
  const rightTitle = activeDept ? activeDept.name : "교무실 공지";

  /* ?tab=affairs 처럼 탭 딥링크로 들어오면 진입 화면을 건너뜁니다.
     정적 배포에서도 동작하도록 브라우저에서 읽습니다. */
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    const found = TABS.find(t => t === tab);
    if (found) {
      setActiveTab(found);
      setIntroSkipped(true);
    }
  }, []);

  /* 인트로가 떠 있는 동안에는 뒤쪽이 스크롤되지 않게 막습니다. */
  useEffect(() => {
    if (introSkipped) return;
    document.body.classList.add("lt-intro-open");
    return () => document.body.classList.remove("lt-intro-open");
  }, [introSkipped]);

  /* 본문을 항상 그려 두고 인트로를 그 위에 덮습니다. (.lt-intro 는 position: fixed 입니다)
     BGM 플레이어가 미리 준비되어 있어야 인트로 클릭 한 번으로 재생이 시작됩니다. */
  return (
    <div className="cy-root">
      <div className="cy-background-pattern"></div>

      <div className="cy-book-wrapper">
        <div className="cy-book-outer">

          {/* 바인더 링 */}
          <div className="cy-bindings">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="cy-ring"></div>
            ))}
          </div>

          <div className="cy-book-inner">

            {/* 좌측 패널 */}
            <div className="cy-left-panel">
              <div className="cy-left-header">
                <VisitCounter />
              </div>
              <div className="cy-left-content">
                <div className="cy-today-is">TODAY IS.. <span className="text-orange">맑음 ☀️</span></div>

                <div className="cy-profile-pic">
                  <img src={asset(profile.photo.src)} alt={profile.photo.alt} />
                </div>

                <div className="cy-intro-text">
                  {profile.introDescription}
                </div>

                <BgmPlayer ref={bgmRef} />

                <div className="cy-profile-name">
                  <div className="name-bold">{profile.teacherName}</div>
                  <div className="title-sub">{profile.catalogDescription}</div>
                </div>

                <div className="cy-left-dropdown">
                  <select
                    value=""
                    onChange={event => {
                      const target = waveLinks.find(w => w.id === event.target.value);
                      if (target && target.href) {
                        window.open(target.href, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <option value="" disabled>파도타기</option>
                    {waveLinks.map(wave => (
                      <option key={wave.id} value={wave.id}>{wave.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 우측 패널 */}
            <div className="cy-right-panel">
              <div className="cy-right-header">
                <span className="cy-title">{rightTitle}</span>
                <span className="cy-url">{profile.displayUrl}</span>
              </div>

              <div className="cy-right-content">
                {activeDept ? (
                  <DeptTab key={activeDept.id} dept={activeDept} />
                ) : (
                  <HomeTab />
                )}
              </div>
            </div>

            {/* 탭 영역 */}
            <div className="cy-tabs">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={"cy-tab-btn " + (activeTab === tab ? "active" : "")}
                  onClick={() => setActiveTab(tab)}
                >
                  <span className="cy-tab-line">{NAV_LABELS[tab]}</span>
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {!introSkipped ? (
        <IntroOverlay
          onBrowse={() => {
            /* 클릭 안에서 재생을 걸어야 브라우저가 소리를 허용합니다. */
            bgmRef.current?.start();
            setIntroSkipped(true);
          }}
        />
      ) : null}
    </div>
  );
}
