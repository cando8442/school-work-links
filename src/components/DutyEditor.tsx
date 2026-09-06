"use client";

/* 담당자가 직접 적는 업무 기록입니다.
   업무 제목, 설명, 반복 업무, 관련 링크를 넣습니다.
   자기가 쓴 것만 고치거나 지울 수 있습니다. */

import { useEffect, useState } from "react";
import { useSchoolUser } from "@/components/SchoolGate";
import {
  addDuty,
  isSchoolLoginEnabled,
  removeDuty,
  updateDuty,
  watchDuties,
  type DutyInput,
  type SavedDuty
} from "@/lib/school";

const EMPTY: DutyInput = {
  deptId: "",
  title: "",
  owner: "",
  summary: "",
  routines: [{ cycle: "", what: "" }],
  links: [{ label: "", href: "" }]
};

function DutyForm({
  deptId,
  initial,
  editingId,
  onClose
}: {
  deptId: string;
  initial?: SavedDuty;
  editingId?: string;
  onClose: () => void;
}) {
  const { user } = useSchoolUser();
  const [form, setForm] = useState<DutyInput>(
    initial
      ? {
          deptId: initial.deptId,
          title: initial.title,
          owner: initial.owner,
          summary: initial.summary,
          routines: initial.routines.length ? initial.routines : [{ cycle: "", what: "" }],
          links: initial.links.length ? initial.links : [{ label: "", href: "" }]
        }
      : { ...EMPTY, deptId }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRoutine = (index: number, key: "cycle" | "what", value: string) => {
    const routines = form.routines.map((r, i) => (i === index ? { ...r, [key]: value } : r));
    setForm({ ...form, routines });
  };

  const setLink = (index: number, key: "label" | "href", value: string) => {
    const links = form.links.map((l, i) => (i === index ? { ...l, [key]: value } : l));
    setForm({ ...form, links });
  };

  const save = async () => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (editingId) await updateDuty(editingId, { ...form, deptId }, user);
      else await addDuty({ ...form, deptId }, user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fm">
      <h4 className="fm-title">{editingId ? "업무 고치기" : "내 업무 적기"}</h4>

      <label className="fm-row">
        <span>업무 제목</span>
        <input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="예: 출결 관리"
        />
      </label>

      <label className="fm-row">
        <span>담당 표시</span>
        <input
          value={form.owner}
          onChange={e => setForm({ ...form, owner: e.target.value })}
          placeholder="이름 대신 담당, 부장, 과목명처럼 적습니다"
        />
      </label>

      <label className="fm-row">
        <span>설명</span>
        <textarea
          rows={3}
          value={form.summary}
          onChange={e => setForm({ ...form, summary: e.target.value })}
          placeholder="이 업무가 무엇인지 한두 줄로 적습니다"
        />
      </label>

      <div className="fm-row">
        <span>반복 업무</span>
        <div className="fm-multi">
          {form.routines.map((routine, i) => (
            <div key={i} className="fm-pair">
              <input
                value={routine.cycle}
                onChange={e => setRoutine(i, "cycle", e.target.value)}
                placeholder="주기 (예: 매주 금요일)"
              />
              <input
                value={routine.what}
                onChange={e => setRoutine(i, "what", e.target.value)}
                placeholder="할 일 (예: 주간 출결 통계 정리)"
              />
            </div>
          ))}
          <button
            type="button"
            className="fm-more"
            onClick={() => setForm({ ...form, routines: [...form.routines, { cycle: "", what: "" }] })}
          >
            + 반복 업무 한 줄 더
          </button>
        </div>
      </div>

      <div className="fm-row">
        <span>관련 링크</span>
        <div className="fm-multi">
          {form.links.map((link, i) => (
            <div key={i} className="fm-pair">
              <input
                value={link.label}
                onChange={e => setLink(i, "label", e.target.value)}
                placeholder="이름 (예: 출결 관리 시트)"
              />
              <input
                value={link.href}
                onChange={e => setLink(i, "href", e.target.value)}
                placeholder="https://docs.google.com/..."
              />
            </div>
          ))}
          <button
            type="button"
            className="fm-more"
            onClick={() => setForm({ ...form, links: [...form.links, { label: "", href: "" }] })}
          >
            + 링크 한 줄 더
          </button>
        </div>
      </div>

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

function SavedDutyCard({ duty }: { duty: SavedDuty }) {
  const { user } = useSchoolUser();
  const [editing, setEditing] = useState(false);
  const mine = user?.email === duty.authorEmail;

  if (editing) {
    return (
      <DutyForm deptId={duty.deptId} initial={duty} editingId={duty.id} onClose={() => setEditing(false)} />
    );
  }

  return (
    <article className="saved-duty">
      <header className="duty-card-head">
        <span className="duty-card-title">{duty.title}</span>
        {duty.owner ? <span className="duty-owner">{duty.owner}</span> : null}
        <span className="saved-tag">담당자 기록</span>
      </header>

      {duty.summary ? <p className="duty-card-sum">{duty.summary}</p> : null}

      {duty.routines.length > 0 ? (
        <ul className="routine-list">
          {duty.routines.map((routine, i) => (
            <li key={i}>
              <span className="routine-cycle">{routine.cycle}</span>
              <span className="routine-what">{routine.what}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {duty.links.length > 0 ? (
        <ul className="chip-list">
          {duty.links.map(link => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {mine ? (
        <div className="tk-admin">
          <button type="button" onClick={() => setEditing(true)}>
            고치기
          </button>
          <button
            type="button"
            onClick={() => {
              void removeDuty(duty.id);
            }}
          >
            지우기
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function DutyEditor({ deptId }: { deptId: string }) {
  const { user } = useSchoolUser();
  const [duties, setDuties] = useState<SavedDuty[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => watchDuties(deptId, setDuties), [deptId]);

  if (!isSchoolLoginEnabled) return null;

  return (
    <div className="saved-list">
      {duties.map(duty => (
        <SavedDutyCard key={duty.id} duty={duty} />
      ))}

      {user ? (
        adding ? (
          <DutyForm deptId={deptId} onClose={() => setAdding(false)} />
        ) : (
          <button type="button" className="add-btn" onClick={() => setAdding(true)}>
            + 내 업무 적기
          </button>
        )
      ) : null}
    </div>
  );
}
