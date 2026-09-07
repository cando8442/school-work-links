"use client";

/* 교사 명단입니다.

   제출 과제의 제출 대상자를 고를 때 쓰는 명단입니다.
   한 줄에 한 사람씩 "이름, 아이디" 또는 "이름, 전체 이메일" 로 붙여 넣습니다.
   아이디만 적으면 학교 도메인을 붙여 이메일을 만듭니다.
   편집 권한이 있는 사람만 이 칸을 볼 수 있습니다. */

import { useEffect, useMemo, useState } from "react";
import { useSchoolUser } from "@/components/SchoolGate";
import {
  clearTeachers,
  isSchoolLoginEnabled,
  parseTeacherText,
  removeTeacher,
  saveTeachers,
  watchTeachers,
  SCHOOL_DOMAINS,
  type Teacher
} from "@/lib/school";

const SAMPLE = `홍길동, hong
김세종, sejong@seoulsejong.sen.hs.kr
이서울, seoul, 교무행정부`;

export default function TeacherRoster() {
  const { user, canEdit } = useSchoolUser();
  const [list, setList] = useState<Teacher[]>([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => watchTeachers(setList), []);

  const preview = useMemo(() => parseTeacherText(text), [text]);

  const shown = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return list;
    return list.filter(
      t =>
        t.name.toLowerCase().includes(key) ||
        t.email.toLowerCase().includes(key) ||
        t.dept.toLowerCase().includes(key)
    );
  }, [list, keyword]);

  if (!isSchoolLoginEnabled) return null;
  if (!user || !canEdit()) return null;

  const upload = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const count = await saveTeachers(preview, user);
      setMessage(`${count}명을 명단에 올렸습니다.`);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "올리지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const wipe = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const count = await clearTeachers();
      setMessage(`${count}명을 지웠습니다.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "지우지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="tr">
      <header className="tr-head">
        <h2 className="sec-title">교사 명단</h2>
        <span className="tr-count">{list.length}명</span>
        <button type="button" className="tr-toggle" onClick={() => setOpen(v => !v)}>
          {open ? "닫기" : "명단 올리기·고치기"}
        </button>
      </header>

      <p className="tr-lead">제출 과제에서 제출 대상자를 고를 때 쓰는 명단입니다.</p>

      {open ? (
        <div className="tr-editor">
          <p className="tr-help">
            한 줄에 한 사람씩 적습니다. 쉼표나 탭으로 칸을 나눕니다.
            <br />
            아이디만 적으면 <b>@{SCHOOL_DOMAINS[0] ?? "학교도메인"}</b> 을 붙입니다. 세 번째 칸에 부서를 적을 수
            있습니다.
          </p>

          <textarea
            rows={8}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={SAMPLE}
            spellCheck={false}
          />

          {text.trim() ? (
            <p className="tr-preview">
              읽어 들인 사람 {preview.length}명
              {preview.length > 0 ? ` · 첫 줄: ${preview[0].name} (${preview[0].email})` : ""}
            </p>
          ) : null}

          {message ? <p className="tr-ok">{message}</p> : null}
          {error ? <p className="fm-error">{error}</p> : null}

          <div className="fm-actions">
            <button type="button" className="fm-save" onClick={upload} disabled={busy || preview.length === 0}>
              {busy ? "처리 중" : `${preview.length}명 올리기`}
            </button>
            <button type="button" className="fm-cancel" onClick={wipe} disabled={busy || list.length === 0}>
              명단 전체 지우기
            </button>
          </div>
        </div>
      ) : null}

      {list.length > 0 ? (
        <div className="tr-list-wrap">
          <input
            className="tr-search"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="이름, 부서, 아이디로 찾기"
          />
          <ul className="tr-list">
            {shown.map(teacher => (
              <li key={teacher.email}>
                <span className="tr-name">{teacher.name || teacher.email}</span>
                {teacher.dept ? <span className="tr-dept">{teacher.dept}</span> : null}
                <span className="tr-mail">{teacher.email}</span>
                <button
                  type="button"
                  className="tr-del"
                  title="명단에서 뺍니다"
                  onClick={() => {
                    void removeTeacher(teacher.email);
                  }}
                >
                  빼기
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
