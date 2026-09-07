"use client";

/* 내 제출 과제 알림입니다.

   로그인한 사람이 제출 대상자로 지정된 과제 가운데
   아직 제출 표시를 하지 않은 것이 있으면 화면 아래에 띄웁니다.
   닫으면 그날 하루는 다시 뜨지 않습니다. 마감이 지난 과제는 닫아도 계속 뜹니다. */

import { useEffect, useMemo, useState } from "react";
import { useSchoolUser } from "@/components/SchoolGate";
import { departments } from "@/config/departments";
import { isSchoolLoginEnabled, toggleTaskDone, watchTasks, type SavedTask } from "@/lib/school";

const HIDE_KEY = "sejong-task-alert-hidden";

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function daysLeft(due: string) {
  const [y, m, d] = due.split("-").map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

function leftLabel(left: number) {
  if (left < 0) return `${-left}일 지남`;
  if (left === 0) return "오늘까지";
  if (left === 1) return "내일까지";
  return `${left}일 남음`;
}

function deptName(deptId: string) {
  return departments.find(d => d.id === deptId)?.name ?? "";
}

export default function TaskAlert() {
  const { user } = useSchoolUser();
  const [tasks, setTasks] = useState<SavedTask[]>([]);
  const [hidden, setHidden] = useState(true);
  const [folded, setFolded] = useState(false);

  useEffect(() => watchTasks(setTasks), []);

  /* 그날 이미 닫았는지 확인합니다. 브라우저가 저장을 막아도 화면은 정상으로 둡니다. */
  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(HIDE_KEY) === today());
    } catch {
      setHidden(false);
    }
  }, []);

  const mine = useMemo(() => {
    const me = user?.email?.toLowerCase();
    if (!me) return [];
    return tasks
      .filter(task => task.assignees.some(a => a.email.toLowerCase() === me))
      .filter(task => !task.done.includes(me))
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [tasks, user]);

  const overdue = mine.filter(task => daysLeft(task.due) < 0);

  if (!isSchoolLoginEnabled || !user) return null;
  if (mine.length === 0) return null;
  /* 마감이 지난 과제가 없을 때만 하루 닫기를 인정합니다. */
  if (hidden && overdue.length === 0) return null;

  const close = () => {
    try {
      window.localStorage.setItem(HIDE_KEY, today());
    } catch {
      /* 저장을 막는 브라우저에서는 이번 화면에서만 닫힙니다 */
    }
    setHidden(true);
  };

  const me = user.email.toLowerCase();

  return (
    <aside className={`ta${folded ? " is-folded" : ""}`} role="status">
      <div className="ta-bar">
        <span className="ta-badge">{mine.length}</span>
        <b className="ta-title">
          내가 낼 과제가 {mine.length}건 있습니다
          {overdue.length > 0 ? ` (마감 지남 ${overdue.length}건)` : ""}
        </b>
        <button type="button" className="ta-fold" onClick={() => setFolded(v => !v)}>
          {folded ? "펼치기" : "접기"}
        </button>
        <button type="button" className="ta-close" onClick={close} title="오늘 하루 그만 보기">
          ✕
        </button>
      </div>

      {folded ? null : (
        <ul className="ta-list">
          {mine.slice(0, 6).map(task => {
            const left = daysLeft(task.due);
            return (
              <li key={task.id} className={left < 0 ? "is-over" : left <= 3 ? "is-soon" : ""}>
                <span className="ta-left">{leftLabel(left)}</span>
                <span className="ta-name">
                  {deptName(task.deptId) ? <em>{deptName(task.deptId)}</em> : null}
                  {task.title}
                </span>
                {task.docUrl ? (
                  <a href={task.docUrl} target="_blank" rel="noopener noreferrer" className="ta-go">
                    문서 열기
                  </a>
                ) : null}
                <button
                  type="button"
                  className="ta-done"
                  onClick={() => {
                    void toggleTaskDone(task.id, me, true);
                  }}
                >
                  제출함
                </button>
              </li>
            );
          })}
          {mine.length > 6 ? <li className="ta-more">그 밖에 {mine.length - 6}건 더 있습니다</li> : null}
        </ul>
      )}
    </aside>
  );
}
