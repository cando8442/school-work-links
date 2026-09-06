"use client";

/* 제출 현황판입니다.

   제출 과제 하나에 구글 문서 링크, 마감일, 제출 주체 목록이 붙습니다.
   주체는 사람 이름 대신 과목명이나 동아리명처럼 업무 단위로 적습니다.
   제출한 주체는 색이 채워지고, 아직인 주체는 빈 칩으로 남습니다. */

import { useEffect, useMemo, useState } from "react";
import { useSchoolUser } from "@/components/SchoolGate";
import { departments } from "@/config/departments";
import {
  addTask,
  isSchoolLoginEnabled,
  removeTask,
  toggleTaskDone,
  updateTask,
  watchTasks,
  type SavedTask,
  type TaskInput
} from "@/lib/school";

function parseDue(due: string) {
  const [y, m, d] = due.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function daysLeft(due: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDue(due).getTime() - today.getTime()) / 86_400_000);
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

function deptName(deptId: string) {
  return departments.find(d => d.id === deptId)?.name ?? "";
}

const EMPTY: TaskInput = {
  deptId: "",
  title: "",
  due: "",
  docUrl: "",
  guide: "",
  targets: []
};

function TaskForm({
  deptId,
  initial,
  editingId,
  onClose
}: {
  deptId: string;
  initial?: SavedTask;
  editingId?: string;
  onClose: () => void;
}) {
  const { user } = useSchoolUser();
  const [form, setForm] = useState<TaskInput>(
    initial
      ? {
          deptId: initial.deptId,
          title: initial.title,
          due: initial.due,
          docUrl: initial.docUrl,
          guide: initial.guide,
          targets: initial.targets
        }
      : { ...EMPTY, deptId }
  );
  const [targetText, setTargetText] = useState(initial ? initial.targets.join(", ") : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    const payload: TaskInput = {
      ...form,
      deptId,
      targets: targetText.split(/[,\n]/).map(t => t.trim()).filter(Boolean)
    };
    try {
      if (editingId) await updateTask(editingId, payload, user);
      else await addTask(payload, user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fm">
      <h4 className="fm-title">{editingId ? "제출 과제 고치기" : "제출 과제 만들기"}</h4>

      <label className="fm-row">
        <span>과제 이름</span>
        <input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="예: 2학기 수행평가 계획 제출"
        />
      </label>

      <label className="fm-row">
        <span>마감일</span>
        <input type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} />
      </label>

      <label className="fm-row">
        <span>구글 문서 링크</span>
        <input
          value={form.docUrl}
          onChange={e => setForm({ ...form, docUrl: e.target.value })}
          placeholder="https://docs.google.com/..."
        />
      </label>

      <label className="fm-row">
        <span>제출 주체</span>
        <textarea
          rows={3}
          value={targetText}
          onChange={e => setTargetText(e.target.value)}
          placeholder="쉼표나 줄바꿈으로 나눕니다. 예: 공통수학2, 미적분, 확률과통계, 방송부"
        />
      </label>

      <label className="fm-row">
        <span>안내 문구</span>
        <input
          value={form.guide}
          onChange={e => setForm({ ...form, guide: e.target.value })}
          placeholder="예: 링크를 열어 과목별 시트에 작성해 주세요."
        />
      </label>

      {error ? <p className="fm-error">{error}</p> : null}

      <div className="fm-actions">
        <button type="button" className="fm-save" onClick={save} disabled={busy}>
          {busy ? "저장 중" : "저장"}
        </button>
        <button type="button" className="fm-cancel" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, showDept }: { task: SavedTask; showDept: boolean }) {
  const { user } = useSchoolUser();
  const [editing, setEditing] = useState(false);
  const left = daysLeft(task.due);
  const state = left < 0 ? "over" : left === 0 ? "today" : left <= 3 ? "soon" : "later";
  const doneCount = task.targets.filter(t => task.done.includes(t)).length;
  const mine = user?.email === task.authorEmail;

  if (editing) {
    return <TaskForm deptId={task.deptId} initial={task} editingId={task.id} onClose={() => setEditing(false)} />;
  }

  return (
    <article className={`tk is-${state}`}>
      <header className="tk-head">
        <span className="tk-due">
          <b>{dueLabel(task.due)}</b>
          <em>{leftLabel(left)}</em>
        </span>
        <span className="tk-title">
          {showDept && deptName(task.deptId) ? <span className="tk-dept">{deptName(task.deptId)}</span> : null}
          {task.title}
        </span>
        <span className="tk-count">
          {doneCount} / {task.targets.length}
        </span>
      </header>

      {task.guide ? <p className="tk-guide">{task.guide}</p> : null}

      {task.docUrl ? (
        <a className="tk-doc" href={task.docUrl} target="_blank" rel="noopener noreferrer">
          문서 열어서 입력하기
        </a>
      ) : null}

      <ul className="tk-targets">
        {task.targets.map(target => {
          const done = task.done.includes(target);
          return (
            <li key={target}>
              <button
                type="button"
                className={`tk-chip${done ? " is-done" : ""}`}
                disabled={!user}
                title={user ? (done ? "제출 표시를 지웁니다" : "제출했다고 표시합니다") : "로그인하면 표시할 수 있습니다"}
                onClick={() => {
                  void toggleTaskDone(task.id, target, !done);
                }}
              >
                {done ? "✓ " : ""}
                {target}
              </button>
            </li>
          );
        })}
      </ul>

      {mine ? (
        <div className="tk-admin">
          <button type="button" onClick={() => setEditing(true)}>
            고치기
          </button>
          <button
            type="button"
            onClick={() => {
              void removeTask(task.id);
            }}
          >
            지우기
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function TaskBoard({ deptId }: { deptId?: string }) {
  const { user } = useSchoolUser();
  const [tasks, setTasks] = useState<SavedTask[]>([]);
  const [adding, setAdding] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => watchTasks(setTasks, () => setFailed(true)), []);

  const list = useMemo(
    () => (deptId ? tasks.filter(t => t.deptId === deptId) : tasks),
    [tasks, deptId]
  );

  if (!isSchoolLoginEnabled) {
    return (
      <div className="dl-empty">
        제출 현황을 쓰려면 파이어베이스 설정이 필요합니다. README 의 안내를 따라 한 번만 설정하면 됩니다.
      </div>
    );
  }

  return (
    <div className="tk-board">
      {user && deptId ? (
        adding ? (
          <TaskForm deptId={deptId} onClose={() => setAdding(false)} />
        ) : (
          <button type="button" className="add-btn" onClick={() => setAdding(true)}>
            + 제출 과제 만들기
          </button>
        )
      ) : null}

      {failed ? <div className="dl-empty">제출 현황을 불러오지 못했습니다.</div> : null}

      {list.length === 0 ? (
        <div className="dl-empty">아직 등록된 제출 과제가 없습니다.</div>
      ) : (
        <div className="tk-list">
          {list.map(task => (
            <TaskCard key={task.id} task={task} showDept={!deptId} />
          ))}
        </div>
      )}
    </div>
  );
}
