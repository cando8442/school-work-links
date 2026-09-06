/* 학교 PDF 두 가지를 읽어 일정 초안을 만듭니다.

   연간학사일정 : 달력 격자입니다. 글자의 가로 위치로 칸을 가르고,
                  세로 위치로 같은 줄을 묶어 날짜와 행사를 짝지읍니다.
   금주의 일정표 : "9월 2일(수) 전국연합학력평가" 처럼 줄 단위로 읽습니다.
                  아래쪽 부서별 공지도 날짜가 보이면 함께 뽑습니다.

   PDF 모양이 바뀌면 결과가 어긋날 수 있으므로, 화면에서 사람이 확인하고 승인합니다. */

import type { EventInput } from "@/lib/school";

export type PdfItem = { text: string; x: number; y: number };
export type PdfPage = { items: PdfItem[]; width: number };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/* 학년도 기준으로 연도를 고릅니다. 3월부터 12월은 그해, 1월과 2월은 다음 해입니다. */
function yearFor(month: number, schoolYear: number) {
  return month >= 3 ? schoolYear : schoolYear + 1;
}

export async function readPdf(file: File): Promise<PdfPage[]> {
  const pdfjs = await import("pdfjs-dist");
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  pdfjs.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: PdfPage[] = [];

  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    const items: PdfItem[] = [];
    for (const raw of content.items) {
      const item = raw as { str?: string; transform?: number[] };
      const text = (item.str ?? "").trim();
      if (!text) continue;
      const t = item.transform ?? [];
      items.push({ text, x: Math.round(t[4] ?? 0), y: Math.round(t[5] ?? 0) });
    }
    pages.push({ items, width: viewport.width });
  }

  return pages;
}

/* ------------------------------------- */
/* 연간학사일정 (달력 격자)                */
/* ------------------------------------- */

export function parseAnnual(pages: PdfPage[], schoolYear: number): EventInput[] {
  const out: EventInput[] = [];

  for (const page of pages) {
    /* 세로 위치가 비슷한 글자끼리 한 줄로 묶습니다. */
    const rows = new Map<number, PdfItem[]>();
    for (const item of page.items) {
      const key = Math.round(item.y / 6) * 6;
      const row = rows.get(key) ?? [];
      row.push(item);
      rows.set(key, row);
    }

    const sortedRows = [...rows.entries()].sort((a, b) => b[0] - a[0]);

    /* 왼쪽 끝의 "3(21)" 같은 표시에서 그 구역의 월을 읽어 둡니다. */
    let month = 0;

    for (const [, rawRow] of sortedRows) {
      const row = [...rawRow].sort((a, b) => a.x - b.x);

      const monthMark = row.find(i => /^\d{1,2}\(\d{1,2}\)$/.test(i.text) && i.x < page.width * 0.1);
      if (monthMark) {
        const m = Number(monthMark.text.split("(")[0]);
        if (m >= 1 && m <= 12) month = m;
      }
      if (!month) continue;

      /* 한 줄 안에서 날짜 숫자가 나오면, 그 오른쪽 글자들을 그 날의 행사로 봅니다. */
      for (let i = 0; i < row.length; i += 1) {
        const cell = row[i];
        if (!/^\d{1,2}$/.test(cell.text)) continue;
        const day = Number(cell.text);
        if (day < 1 || day > 31) continue;
        if (cell.x < page.width * 0.1) continue;

        const parts: string[] = [];
        for (let k = i + 1; k < row.length; k += 1) {
          const next = row[k];
          if (/^\d{1,2}$/.test(next.text)) break;
          if (next.x - cell.x > page.width * 0.14) break;
          parts.push(next.text);
        }

        const title = parts.join(" ").trim();
        if (!title) continue;

        out.push({
          date: `${yearFor(month, schoolYear)}-${pad(month)}-${pad(day)}`,
          title: title.slice(0, 60),
          kind: "schedule",
          dept: "",
          detail: "",
          status: "published"
        });
      }
    }
  }

  return dedupe(out);
}

/* ------------------------------------- */
/* 금주의 일정표                          */
/* ------------------------------------- */

export function parseWeekly(pages: PdfPage[], schoolYear: number): EventInput[] {
  const out: EventInput[] = [];

  /* 줄 단위 문자열로 만듭니다. */
  const lines: string[] = [];
  for (const page of pages) {
    const rows = new Map<number, PdfItem[]>();
    for (const item of page.items) {
      const key = Math.round(item.y / 5) * 5;
      const row = rows.get(key) ?? [];
      row.push(item);
      rows.set(key, row);
    }
    const sorted = [...rows.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, row] of sorted) {
      lines.push(
        [...row]
          .sort((a, b) => a.x - b.x)
          .map(i => i.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      );
    }
  }

  /* 담당부서 이름이 나오면 그 아래 줄들은 그 부서 것으로 봅니다. */
  const deptNames = [
    "교무행정부",
    "창의연구부",
    "교육과정부",
    "진로진학부",
    "생활안전부",
    "1학년부",
    "2학년부",
    "3학년부",
    "교감",
    "행정실"
  ];
  let dept = "";

  for (const line of lines) {
    const found = deptNames.find(d => line.startsWith(d) || line === d);
    if (found) dept = found;

    /* "9월 2일(수)" 또는 "9월 3일(목)까지" 형태를 찾습니다. */
    const m = line.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (!m) continue;

    const month = Number(m[1]);
    const day = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;

    /* 날짜 뒤쪽 글자를 내용으로 씁니다. */
    let rest = line.slice((m.index ?? 0) + m[0].length).replace(/^\([^)]*\)/, "").trim();
    rest = rest.replace(/^[:\-~,.\s]+/, "").trim();
    if (!rest) continue;

    const isDeadline = /까지|마감|제출|입력|접수|보고/.test(line);

    out.push({
      date: `${yearFor(month, schoolYear)}-${pad(month)}-${pad(day)}`,
      title: rest.slice(0, 60),
      kind: isDeadline ? "deadline" : "schedule",
      dept,
      detail: "",
      /* 주간 일정표는 담당자가 승인해야 올라갑니다. */
      status: "pending"
    });
  }

  return dedupe(out);
}

function dedupe(rows: EventInput[]) {
  const seen = new Set<string>();
  const out: EventInput[] = [];
  for (const row of rows) {
    const key = `${row.date}|${row.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
