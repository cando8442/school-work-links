"use client";

/* 학사일정 가져오기입니다.

   한글, 엑셀, 구글 시트 어디서든 표를 복사해 붙여넣으면 그대로 읽습니다.
   파일을 올리는 것보다 붙여넣기가 튼튼합니다. 파일 모양이 바뀌어도 깨지지 않기 때문입니다.

   읽는 방법
     2칸 : 날짜 / 내용
     3칸 : 날짜 / 내용 / 상세
     4칸 : 날짜 / 부서 / 내용 / 상세 */

import { useMemo, useState } from "react";
import { useSchoolUser } from "@/components/SchoolGate";
import {
  addEvents,
  approveEvent,
  editEvent,
  removeEvent,
  type EventInput,
  type SchoolEvent
} from "@/lib/school";
import { parseAnnual, parseWeekly, readPdf } from "@/lib/pdfSchedule";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/* 여러 날짜 표기를 2026-03-02 형태로 바꿉니다. 연도가 없으면 기준 연도를 씁니다. */
export function parseDate(raw: string, baseYear: number): string {
  const t = raw.trim().replace(/\s+/g, "");
  if (!t) return "";

  let m = t.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;

  m = t.match(/^(\d{4})년(\d{1,2})월(\d{1,2})일/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;

  m = t.match(/^(\d{1,2})월(\d{1,2})일/);
  if (m) return `${baseYear}-${pad(+m[1])}-${pad(+m[2])}`;

  m = t.match(/^(\d{1,2})[-./](\d{1,2})$/);
  if (m) return `${baseYear}-${pad(+m[1])}-${pad(+m[2])}`;

  return "";
}

/* 붙여넣은 표를 줄 단위로 읽습니다. */
export function parseRows(text: string, baseYear: number, kind: "schedule" | "deadline"): EventInput[] {
  const rows: EventInput[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const cells = (line.includes("\t") ? line.split("\t") : line.split(",")).map(c => c.trim());
    if (cells.length < 2) continue;

    const date = parseDate(cells[0], baseYear);
    if (!date) continue;

    const rest = cells.slice(1).filter(c => c !== "");
    if (rest.length === 0) continue;

    let dept = "";
    let title = "";
    let detail = "";

    if (rest.length === 1) {
      title = rest[0];
    } else if (rest.length === 2) {
      title = rest[0];
      detail = rest[1];
    } else {
      dept = rest[0];
      title = rest[1];
      detail = rest.slice(2).join(" ");
    }

    if (!title) continue;
    rows.push({ date, title, kind, dept, detail });
  }

  return rows;
}

export default function ScheduleImport({ events }: { events: SchoolEvent[] }) {
  const { user, canEdit } = useSchoolUser();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [kind, setKind] = useState<"schedule" | "deadline">("schedule");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pdfRows, setPdfRows] = useState<EventInput[]>([]);
  const [pdfName, setPdfName] = useState("");
  const [reading, setReading] = useState(false);

  const preview = useMemo(() => parseRows(text, year, kind), [text, year, kind]);

  const pending = events.filter(e => e.status === "pending");
  const published = events.filter(e => e.status !== "pending");

  if (!canEdit()) return null;

  /* PDF 를 읽어 초안을 만듭니다. 학사일정은 바로 올리고, 주간 일정표는 승인 대기로 둡니다. */
  const onPdf = async (file: File | null, mode: "annual" | "weekly") => {
    if (!file || !user) return;
    setReading(true);
    setError(null);
    setMessage(null);
    try {
      const pages = await readPdf(file);
      const rows = mode === "annual" ? parseAnnual(pages, year) : parseWeekly(pages, year);
      if (rows.length === 0) {
        setError("읽어낸 일정이 없습니다. 다른 파일이거나 표 모양이 달라 보입니다.");
        setPdfRows([]);
        return;
      }
      setPdfRows(rows);
      setPdfName(file.name);
      setMessage(
        mode === "annual"
          ? `${rows.length}건을 읽었습니다. 확인하고 올리기를 누르세요.`
          : `${rows.length}건을 읽었습니다. 올리면 승인 대기 목록으로 들어갑니다.`
      );
    } catch {
      setError("PDF 를 읽지 못했습니다. 파일이 그림으로만 되어 있으면 글자를 뽑을 수 없습니다.");
    } finally {
      setReading(false);
    }
  };

  const savePdfRows = async () => {
    if (!user || pdfRows.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const count = await addEvents(pdfRows, user);
      setMessage(`${count}건을 넣었습니다.`);
      setPdfRows([]);
      setPdfName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const count = await addEvents(preview, user);
      setMessage(`${count}건을 달력에 넣었습니다.`);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="tasks">
      <h2 className="sec-title">학사일정 가져오기</h2>

      <div className="pdf-box">
        <div className="pdf-row">
          <label className="pdf-pick">
            연간학사일정 PDF 올리기
            <input
              type="file"
              accept="application/pdf"
              onChange={e => {
                void onPdf(e.target.files?.[0] ?? null, "annual");
                e.target.value = "";
              }}
            />
          </label>
          <label className="pdf-pick">
            금주의 일정표 PDF 올리기
            <input
              type="file"
              accept="application/pdf"
              onChange={e => {
                void onPdf(e.target.files?.[0] ?? null, "weekly");
                e.target.value = "";
              }}
            />
          </label>
          <span className="fm-hint">기준 학년도 {year}년</span>
        </div>
        {reading ? <p className="fm-hint">파일을 읽는 중입니다.</p> : null}

        {pdfRows.length > 0 ? (
          <div className="fm">
            <h4 className="fm-title">
              {pdfName} 에서 읽은 {pdfRows.length}건
            </h4>
            <ul className="form-list">
              {pdfRows.slice(0, 15).map((row, i) => (
                <li key={i}>
                  <span className="admin-row">
                    <span className="form-kind">{row.date}</span>
                    {row.dept ? <span className="dl-dept">{row.dept}</span> : null}
                    <span className="form-label">{row.title}</span>
                    {row.kind === "deadline" ? <span className="saved-tag">마감</span> : null}
                  </span>
                  <button type="button" onClick={() => setPdfRows(pdfRows.filter((_, k) => k !== i))}>
                    빼기
                  </button>
                </li>
              ))}
            </ul>
            {pdfRows.length > 15 ? <p className="fm-hint">앞 15건만 보여 드립니다.</p> : null}
            <div className="fm-actions">
              <button type="button" className="fm-save" onClick={savePdfRows} disabled={busy}>
                {busy ? "넣는 중" : `${pdfRows.length}건 올리기`}
              </button>
              <button type="button" className="fm-cancel" onClick={() => setPdfRows([])}>
                취소
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {pending.length > 0 ? (
        <div className="fm">
          <h4 className="fm-title">올릴까요? 승인 대기 {pending.length}건</h4>
          <ul className="form-list">
            {pending.map(ev => (
              <li key={ev.id}>
                <span className="admin-row">
                  <span className="form-kind">{ev.date}</span>
                  {ev.dept ? <span className="dl-dept">{ev.dept}</span> : null}
                  <span className="form-label">{ev.title}</span>
                  {ev.kind === "deadline" ? <span className="saved-tag">마감</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void approveEvent(ev.id);
                  }}
                >
                  올리기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = window.prompt("내용을 고칩니다", ev.title);
                    if (next && next.trim()) void editEvent(ev.id, { title: next.trim() });
                  }}
                >
                  고치기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void removeEvent(ev.id);
                  }}
                >
                  버리기
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!open ? (
        <button type="button" className="add-btn" onClick={() => setOpen(true)}>
          + 직접 붙여넣기
        </button>
      ) : (
        <div className="fm">
          <p className="fm-hint">
            한글이나 엑셀에서 표를 끌어 선택한 뒤 복사(Ctrl+C)해서 아래에 붙여넣으세요(Ctrl+V).
            줄마다 이렇게 읽습니다. 2칸이면 날짜와 내용, 3칸이면 날짜와 내용과 상세,
            4칸이면 날짜와 부서와 내용과 상세입니다.
            날짜는 2026-03-02, 2026.3.2, 3월 2일, 3/2 모두 됩니다.
          </p>

          <div className="fm-pair">
            <label className="fm-row">
              <span>연도가 없을 때 쓸 기준 연도</span>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value) || new Date().getFullYear())}
              />
            </label>
            <label className="fm-row">
              <span>구분</span>
              <select value={kind} onChange={e => setKind(e.target.value as "schedule" | "deadline")}>
                <option value="schedule">학사일정 (달력에만)</option>
                <option value="deadline">마감 (달력과 마감 목록에)</option>
              </select>
            </label>
          </div>

          <label className="fm-row">
            <span>붙여넣기</span>
            <textarea
              rows={8}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={"3월 2일\t시업식\n3월 4일\t교육과정부\t1학기 수행평가 계획 제출\t과목별 제출"}
            />
          </label>

          <p className="fm-hint">읽어낸 줄: {preview.length}건</p>

          {preview.length > 0 ? (
            <ul className="form-list">
              {preview.slice(0, 8).map((row, i) => (
                <li key={i}>
                  <span className="admin-row">
                    <span className="form-kind">{row.date}</span>
                    {row.dept ? <span className="dl-dept">{row.dept}</span> : null}
                    <span className="form-label">{row.title}</span>
                    <span className="pt-meta">{row.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {preview.length > 8 ? (
            <p className="fm-hint">앞 8건만 미리 보여 드립니다. 저장하면 전부 들어갑니다.</p>
          ) : null}

          {message ? <p className="fm-hint">{message}</p> : null}
          {error ? <p className="fm-error">{error}</p> : null}

          <div className="fm-actions">
            <button type="button" className="fm-save" onClick={save} disabled={busy || preview.length === 0}>
              {busy ? "넣는 중" : `${preview.length}건 넣기`}
            </button>
            <button type="button" className="fm-cancel" onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {published.length > 0 ? (
        <details className="ev-list">
          <summary>등록된 일정 {published.length}건 보기</summary>
          <ul className="form-list">
            {published.map(ev => (
              <li key={ev.id}>
                <span className="admin-row">
                  <span className="form-kind">{ev.date}</span>
                  {ev.dept ? <span className="dl-dept">{ev.dept}</span> : null}
                  <span className="form-label">{ev.title}</span>
                  {ev.kind === "deadline" ? <span className="saved-tag">마감</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = window.prompt("내용을 고칩니다", ev.title);
                    if (next && next.trim()) void editEvent(ev.id, { title: next.trim() });
                  }}
                >
                  고치기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void removeEvent(ev.id);
                  }}
                >
                  지우기
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
