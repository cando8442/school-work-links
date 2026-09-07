"use client";

/* 제출 현황판입니다.

   제출 과제 하나에 담당자, 구글 문서 링크, 마감일, 제출 주체와 제출 대상자가 붙습니다.
   제출 주체는 과목명이나 동아리명처럼 업무 단위이고,
   제출 대상자는 교사 명단에서 고른 실제 사람입니다.
   제출 완료 표시는 과제 담당자와 본인만 누를 수 있습니다. */

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
  watchTeachers,
  type Assignee,
  type SavedTask,
  type TaskInput,
  type Teacher
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

/* 이 과제의 제출 완료 표시를 누를 수 있는 사람인지 봅니다.
   과제를 만든 사람, 과제 담당자, 그리고 자기 자신만 누를 수 있습니다. */
export function canCheck(task: SavedTask, email: string | undefined, target: string) {
  if (!email) return false;
  const me = email.toLowerCase();
  if (task.authorEmail.toLowerCase() === me) return true;
  if (task.ownerEmail && task.ownerEmail.toLowerCase() === me) return true;
  return target.toLowerCase() === me;
}

const EMPTY: TaskInput = {
  deptId: "",
  title: "",
  due: "",
  docUrl: "",
  guide: "",
  ownerName: "",
  ownerEmail: "",
  targets: [],
  assignees: []
};

/* 교사 명단에서 제출 대상자를 고르는 칸입니다. */
function AssigneePicker({
  teachers,
  picked,
  onChange
}: {
  teachers: Teacher[];
  picked: Assignee[];
  onChange: (next: Assignee[]) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const pickedEmails = useMemo(() => new Set(picked.map(p => p.email)), [picked]);

  const shown = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return teachers;
    return teachers.filter(
      t =>
        t.name.toLowerCase().includes(key) ||
        t.email.toLowerCase().includes(key) ||
        t.dept.toLowerCase().includes(key)
    );
  }, [teachers, keyword]);

  const toggle = (teacher: Teacher) => {
    if (pickedEmails.has(teacher.email)) {
      onChange(picked.filter(p => p.email !== teacher.email));
    } else {
      onChange([...picked, { name: teacher.name, email: teacher.email }]);
    }
  };

  if (teachers.length === 0) {
    return (
      <p className="ap-empty">
        아직 올라온 교사 명단이 없습니다. 교무실 홈 화면 아래 교사 명단에서 먼저 올려 주세요.
      </p>
    );
  }

  return (
    <div className="ap">
      <div className="ap-bar">
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="이름, 부서, 아이디로 찾기"
        />
        <button type="button" onClick={() => onChange(shown.map(t => ({ name: t.name, email: t.email })))}>
          보이는 사람 모두
        </button>
        <button type="button" onClick={() => onChange([])}>
          비우기
        </button>
      </div>

      <p className="ap-count">고른 사람 {picked.length}명</p>

      <ul className="ap-list">
        {shown.map(teacher => {
          const on = pickedEmails.has(teacher.email);
          return (
            <li key={teacher.email}>
              <button type="button" className={`ap-item${on ? " is-on" : ""}`} onClick={() => toggle(teacher)}>
                <span className="ap-name">
                  {on ? "✓ " : ""}
                  {teacher.name || teacher.email}
                </span>
                {teacher.dept ? <span className="ap-dept">{teacher.dept}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [form, setForm] = useState<TaskInput>(
    initial
      ? {
          deptId: initial.deptId,
          title: initial.title,
          due: initial.due,
          docUrl: initial.docUrl,
          guide: initial.guide,
          ownerName: initial.ownerName,
          ownerEmail: initial.ownerEmail,
          targets: initial.targets,
          assignees: initial.assignees
        }
      : { ...EMPTY, deptId, ownerName: user?.name ?? "", ownerEmail: user?.email ?? "" }
  );
  const [targetText, setTargetText] = useState(initial ? initial.targets.join(", ") : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => watchTeachers(setTeachers), []);

  const save = async () => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    const payload: TaskInput = {
      ...form,
      deptId,
      targets: targetText
        .split(/[,\n]/)
        .map(t => t.trim())
        .filter(Boolean)
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
        <span>담당자</span>
        <input
          value={form.ownerName}
          onChange={e => setForm({ ...form, ownerName: e.target.value })}
          placeholder="이 과제를 챙기는 사람 이름"
        />
      </label>

      <label className="fm-row">
        <span>담당자 이메일</span>
        <input
          type="email"
          value={form.ownerEmail}
          onChange={e => setForm({ ...form, ownerEmail: e.target.value })}
          placeholder="hong@seoulsejong.sen.hs.kr"
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

      <div className="fm-row">
        <span>제출 대상자</span>
        <AssigneePicker
          teachers={teachers}
          picked={form.assignees}
          onChange={assignees => setForm({ ...form, assignees })}
        />
      </div>

      <label className="fm-row">
        <span>제출 주체</span>
        <textarea
          rows={2}
          value={targetText}
          onChange={e => setTargetText(e.target.value)}
          placeholder="사람 대신 과목·동아리로 받을 때 씁니다. 예: 공통수학2, 미적분, 방송부"
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

/* 제출 완료 표시 칩 하나입니다. */
function DoneChip({ task, value, label }: { task: SavedTask; value: string; label: string }) {
  const { user } = useSchoolUser();
  const done = task.done.includes(value);
  const allowed = canCheck(task, user?.email, value);

  return (
    <button
      type="button"
      className={`tk-chip${done ? " is-done" : ""}${allowed ? "" : " is-locked"}`}
      disabled={!allowed}
      title={
        allowed
          ? done
            ? "제출 표시를 지웁니다"
            : "제출했다고 표시합니다"
          : "담당자와 본인만 표시할 수 있습니다"
      }
      onClick={() => {
        void toggleTaskDone(task.id, value, !done);
      }}
    >
      {done ? "✓ " : ""}
      {label}
    </button>
  );
}

function TaskCard({ task, showDept }: { task: SavedTask; showDept: boolean }) {
  const { user } = useSchoolUser();
  const [editing, setEditing] = useState(false);
  const [openList, setOpenList] = useState(false);
  const left = daysLeft(task.due);
  const state = left < 0 ? "over" : left === 0 ? "today" : left <= 3 ? "soon" : "later";

  const total = task.targets.length + task.assignees.length;
  const doneCount =
    task.targets.filter(t => task.done.includes(t)).length +
    task.assignees.filter(a => task.done.includes(a.email)).length;

  const me = user?.email?.toLowerCase();
  const mine = Boolean(
    me && (me === task.authorEmail.toLowerCase() || (task.ownerEmail && me === task.ownerEmail.toLowerCase()))
  );
  const iAmTarget = Boolean(me && task.assignees.some(a => a.email.toLowerCase() === me));
  const iSubmitted = Boolean(me && task.done.includes(me));

  if (editing) {
    return <TaskForm deptId={task.deptId} initial={task} editingId={task.id} onClose={() => setEditing(false)} />;
  }

  const undone = task.assignees.filter(a => !task.done.includes(a.email));

  return (
    <article className={`tk is-${state}${iAmTarget && !iSubmitted ? " is-mine" : ""}`}>
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
          {doneCount} / {total}
        </span>
      </header>

      {task.ownerName || task.ownerEmail ? (
        <p className="tk-owner">
          담당 {task.ownerName || task.ownerEmail}
          {task.ownerEmail ? (
            <a href={`mailto:${task.ownerEmail}`} className="tk-owner-mail">
              {task.ownerEmail}
            </a>
          ) : null}
        </p>
      ) : null}

      {iAmTarget ? (
        <p className={`tk-me${iSubmitted ? " is-done" : ""}`}>
          {iSubmitted ? "내 제출을 마쳤습니다" : "내가 제출해야 하는 과제입니다"}
        </p>
      ) : null}

      {task.guide ? <p className="tk-guide">{task.guide}</p> : null}

      {task.docUrl ? (
        <a className="tk-doc" href={task.docUrl} target="_blank" rel="noopener noreferrer">
          문서 열어서 입력하기
        </a>
      ) : null}

      {task.targets.length > 0 ? (
        <ul className="tk-targets">
          {task.targets.map(target => (
            <li key={target}>
              <DoneChip task={task} value={target} label={target} />
            </li>
          ))}
        </ul>
      ) : null}

      {task.assignees.length > 0 ? (
        <div className="tk-people">
          <button type="button" className="tk-fold" onClick={() => setOpenList(v => !v)}>
            제출 대상자 {task.assignees.length}명 · 미제출 {undone.length}명 {openList ? "접기" : "펼치기"}
          </button>

          {openList ? (
            <ul className="tk-targets">
              {task.assignees.map(person => (
                <li key={person.email}>
                  <DoneChip task={task} value={person.email} label={person.name || person.email} />
                </li>
              ))}
            </ul>
          ) : undone.length > 0 ? (
            <p className="tk-undone">아직 안 낸 사람: {undone.map(p => p.name || p.email).join(", ")}</p>
          ) : (
            <p className="tk-undone is-clear">모두 제출했습니다</p>
          )}
        </div>
      ) : null}

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

  const list = useMemo(() => (deptId ? tasks.filter(t => t.deptId === deptId) : tasks), [tasks, deptId]);

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
