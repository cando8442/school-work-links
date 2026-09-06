"use client";

/* 부서 화면에 붙는 세 가지입니다.
   DriveBar : 부서 공유 드라이브 링크를 걸고 고칩니다.
   PostBoard: 이번에 입력해야 할 것을 게시글처럼 씁니다.
   FormList : 업무분장마다 반복해서 쓰는 서식을 걸어 두고 내려받습니다.

   파일 자체는 이 사이트에 올리지 않습니다. 구글 드라이브에 두고 링크만 겁니다.
   한글 문서(hwp, hwpx)도 드라이브에 올려 두면 내려받아 쓸 수 있습니다. */

import { useEffect, useState } from "react";
import { useSchoolUser } from "@/components/SchoolGate";
import {
  addForm,
  addPost,
  isSchoolLoginEnabled,
  removeForm,
  removePost,
  saveDriveUrl,
  watchDeptMeta,
  watchForms,
  watchPosts,
  type SavedForm,
  type SavedPost
} from "@/lib/school";

/* ------------------------------------- */
/* 공유 드라이브 링크                      */
/* ------------------------------------- */

export function DriveBar({ deptId, note }: { deptId: string; note?: string }) {
  const { user, canEdit } = useSchoolUser();
  const [url, setUrl] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => watchDeptMeta(deptId, meta => setUrl(meta?.driveUrl ?? "")), [deptId]);

  const save = async () => {
    if (!user) return;
    try {
      await saveDriveUrl(deptId, draft, user);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    }
  };

  if (editing) {
    return (
      <div className="fm">
        <h4 className="fm-title">공유 드라이브 링크</h4>
        <label className="fm-row">
          <span>드라이브 주소</span>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
          />
        </label>
        {error ? <p className="fm-error">{error}</p> : null}
        <div className="fm-actions">
          <button type="button" className="fm-save" onClick={save}>
            저장
          </button>
          <button type="button" className="fm-cancel" onClick={() => setEditing(false)}>
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="drive-bar">
      {url ? (
        <a className="drive-btn" href={url} target="_blank" rel="noopener noreferrer">
          부서 공유 드라이브 열기
        </a>
      ) : (
        <span className="drive-empty">공유 드라이브 링크가 아직 등록되지 않았습니다.</span>
      )}
      {note ? <span className="drive-note">{note}</span> : null}
      {isSchoolLoginEnabled && canEdit(deptId) ? (
        <button
          type="button"
          className="drive-edit"
          onClick={() => {
            setDraft(url);
            setEditing(true);
          }}
        >
          {url ? "링크 고치기" : "링크 걸기"}
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------- */
/* 부서 게시판                            */
/* ------------------------------------- */

function PostForm({ deptId, onClose }: { deptId: string; onClose: () => void }) {
  const { user } = useSchoolUser();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [links, setLinks] = useState([{ label: "", href: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!user || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addPost({ deptId, title, body, links }, user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "올리지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fm">
      <h4 className="fm-title">글쓰기</h4>

      <label className="fm-row">
        <span>제목</span>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="예: 2학기 동아리 활동 계획 입력 안내"
        />
      </label>

      <label className="fm-row">
        <span>내용</span>
        <textarea
          rows={6}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="무엇을 언제까지 어떻게 입력하면 되는지 적습니다. 학생 개인정보는 적지 않습니다."
        />
      </label>

      <div className="fm-row">
        <span>링크</span>
        <div className="fm-multi">
          {links.map((link, i) => (
            <div key={i} className="fm-pair">
              <input
                value={link.label}
                onChange={e =>
                  setLinks(links.map((l, k) => (k === i ? { ...l, label: e.target.value } : l)))
                }
                placeholder="이름 (예: 입력 시트)"
              />
              <input
                value={link.href}
                onChange={e =>
                  setLinks(links.map((l, k) => (k === i ? { ...l, href: e.target.value } : l)))
                }
                placeholder="https://docs.google.com/..."
              />
            </div>
          ))}
          <button
            type="button"
            className="fm-more"
            onClick={() => setLinks([...links, { label: "", href: "" }])}
          >
            + 링크 한 줄 더
          </button>
        </div>
      </div>

      {error ? <p className="fm-error">{error}</p> : null}

      <div className="fm-actions">
        <button type="button" className="fm-save" onClick={save} disabled={busy}>
          {busy ? "올리는 중" : "올리기"}
        </button>
        <button type="button" className="fm-cancel" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, showDept }: { post: SavedPost; showDept?: boolean }) {
  const { user } = useSchoolUser();
  const mine = user?.email === post.authorEmail;
  const when = post.createdAt ? new Date(post.createdAt) : null;

  return (
    <article className="pt">
      <header className="pt-head">
        <span className="pt-title">{post.title}</span>
        <span className="pt-meta">
          {showDept && post.deptId ? `${post.deptId} · ` : ""}
          {post.authorName || post.authorEmail}
          {when ? ` · ${when.getMonth() + 1}월 ${when.getDate()}일` : ""}
        </span>
      </header>

      {post.body ? <p className="pt-body">{post.body}</p> : null}

      {post.links.length > 0 ? (
        <ul className="chip-list">
          {post.links.map(link => (
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
          <button
            type="button"
            onClick={() => {
              void removePost(post.id);
            }}
          >
            지우기
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function PostBoard({ deptId, limit }: { deptId: string | null; limit?: number }) {
  const { user } = useSchoolUser();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [writing, setWriting] = useState(false);

  useEffect(() => watchPosts(deptId, setPosts), [deptId]);

  if (!isSchoolLoginEnabled) return null;

  const list = limit ? posts.slice(0, limit) : posts;

  return (
    <div className="pt-board">
      {user && deptId ? (
        writing ? (
          <PostForm deptId={deptId} onClose={() => setWriting(false)} />
        ) : (
          <button type="button" className="add-btn" onClick={() => setWriting(true)}>
            + 글쓰기
          </button>
        )
      ) : null}

      {list.length === 0 ? (
        <div className="dl-empty">아직 올라온 글이 없습니다.</div>
      ) : (
        list.map(post => <PostCard key={post.id} post={post} showDept={!deptId} />)
      )}
    </div>
  );
}

/* ------------------------------------- */
/* 업무분장별 서식                         */
/* ------------------------------------- */

export function FormList({ deptId, dutyId }: { deptId: string; dutyId: string }) {
  const { user, canEdit } = useSchoolUser();
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [kind, setKind] = useState("한글");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => watchForms(deptId, setForms), [deptId]);

  if (!isSchoolLoginEnabled) return null;

  const mine = forms.filter(f => f.dutyId === dutyId);

  const save = async () => {
    if (!user) return;
    try {
      await addForm({ deptId, dutyId, label, href, kind }, user);
      setLabel("");
      setHref("");
      setAdding(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    }
  };

  return (
    <section className="duty-block">
      <h3>서식 내려받기</h3>

      {mine.length === 0 ? (
        <p className="fm-hint">아직 걸어 둔 서식이 없습니다.</p>
      ) : (
        <ul className="form-list">
          {mine.map(form => (
            <li key={form.id}>
              <a href={form.href} target="_blank" rel="noopener noreferrer">
                <span className="form-kind">{form.kind || "파일"}</span>
                <span className="form-label">{form.label}</span>
              </a>
              {user?.email === form.authorEmail && canEdit(deptId) ? (
                <button
                  type="button"
                  onClick={() => {
                    void removeForm(form.id);
                  }}
                >
                  지우기
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit(deptId) ? (
        adding ? (
          <div className="fm">
            <label className="fm-row">
              <span>서식 이름</span>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="예: 결석계 서식" />
            </label>
            <label className="fm-row">
              <span>파일 종류</span>
              <input value={kind} onChange={e => setKind(e.target.value)} placeholder="한글 / 시트 / PDF" />
            </label>
            <label className="fm-row">
              <span>드라이브 링크</span>
              <input
                value={href}
                onChange={e => setHref(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
              />
            </label>
            <p className="fm-hint">
              한글 파일(hwp, hwpx)은 드라이브에서 미리보기가 안 되고 내려받아 열어야 합니다.
              바로 내려받게 하려면 드라이브 파일 아이디를 넣어
              https://drive.google.com/uc?export=download&amp;id=파일아이디 형태로 걸어 주세요.
            </p>
            {error ? <p className="fm-error">{error}</p> : null}
            <div className="fm-actions">
              <button type="button" className="fm-save" onClick={save}>
                저장
              </button>
              <button type="button" className="fm-cancel" onClick={() => setAdding(false)}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="add-btn" onClick={() => setAdding(true)}>
            + 서식 걸기
          </button>
        )
      ) : null}
    </section>
  );
}
