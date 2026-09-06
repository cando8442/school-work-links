"use client";

/* 첫 화면 달력입니다. 마감이 있는 날에 표시를 하고, 날짜를 누르면 그날 마감이 아래에 나옵니다. */

import { useMemo, useState } from "react";
import type { Notice } from "@/config/departments";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function ymd(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export default function Calendar({
  notices,
  onPick
}: {
  notices: Notice[];
  onPick?: (dateKey: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = ymd(today);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState<string | null>(null);

  /* 날짜별 마감 건수를 미리 세어 둡니다. */
  const byDate = useMemo(() => {
    const map = new Map<string, Notice[]>();
    for (const notice of notices) {
      const list = map.get(notice.due) ?? [];
      list.push(notice);
      map.set(notice.due, list);
    }
    return map;
  }, [notices]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: lastDate }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const move = (step: number) => {
    setCursor(new Date(year, month + step, 1));
    setPicked(null);
  };

  const pickedList = picked ? byDate.get(picked) ?? [] : [];

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => move(-1)} aria-label="이전 달">
          ‹
        </button>
        <strong className="cal-month">
          {year}년 {month + 1}월
        </strong>
        <button type="button" className="cal-nav" onClick={() => move(1)} aria-label="다음 달">
          ›
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((label, i) => (
          <div key={label} className={`cal-wd${i === 0 ? " is-sun" : ""}${i === 6 ? " is-sat" : ""}`}>
            {label}
          </div>
        ))}

        {cells.map((day, index) => {
          if (day === null) return <div key={`e${index}`} className="cal-cell is-empty" />;

          const key = ymd(new Date(year, month, day));
          const items = byDate.get(key) ?? [];
          const weekday = index % 7;
          const classes = [
            "cal-cell",
            items.length > 0 ? "has-due" : "",
            key === todayKey ? "is-today" : "",
            key === picked ? "is-picked" : "",
            weekday === 0 ? "is-sun" : "",
            weekday === 6 ? "is-sat" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={key}
              type="button"
              className={classes}
              onClick={() => {
                const next = picked === key ? null : key;
                setPicked(next);
                if (next && onPick) onPick(next);
              }}
              aria-label={`${month + 1}월 ${day}일${items.length ? `, 마감 ${items.length}건` : ""}`}
            >
              <span className="cal-day">{day}</span>
              {items.length > 0 ? <span className="cal-dot">{items.length}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="cal-picked">
        {picked === null ? (
          <p className="cal-hint">날짜를 누르면 그날 마감이 여기에 나옵니다.</p>
        ) : pickedList.length === 0 ? (
          <p className="cal-hint">이날은 마감이 없습니다.</p>
        ) : (
          <ul className="cal-picked-list">
            {pickedList.map(item => (
              <li key={item.id}>
                <span className="cal-picked-dept">{item.dept}</span>
                <span className="cal-picked-title">{item.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
