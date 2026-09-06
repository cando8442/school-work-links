"use client";

/* 편집 권한을 나눠 주는 화면입니다. 최초 관리자에게만 보입니다.

   여기에 등록된 사람만 업무분장을 적고 고칠 수 있고, 서식과 공유 드라이브 링크를 걸 수 있습니다.
   담당 부서를 고르면 그 부서만, 비워 두면 모든 부서를 고칠 수 있습니다.
   제출 과제 만들기와 글쓰기는 권한과 상관없이 학교 계정이면 누구나 할 수 있습니다. */

import { useEffect, useState } from "react";
import { useSchoolUser } from "@/components/SchoolGate";
import { departments } from "@/config/departments";
import { addAdmin, removeAdmin, watchAdmins, type Admin } from "@/lib/school";

function deptName(deptId: string) {
  return departments.find(d => d.id === deptId)?.name ?? "";
}

export default function AdminPanel() {
  const { isOwner } = useSchoolUser();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => watchAdmins(setAdmins), []);

  if (!isOwner) return null;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await addAdmin(email, name, dept);
      setEmail("");
      setName("");
      setDept("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="tasks">
      <h2 className="sec-title">편집 권한 관리</h2>

      <p className="fm-hint">
        여기 등록된 분만 업무분장을 적고 고칠 수 있습니다. 담당 부서를 고르면 그 부서만,
        비워 두면 모든 부서를 고칠 수 있습니다. 제출 과제와 글쓰기는 누구나 할 수 있습니다.
      </p>

      {admins.length === 0 ? (
        <div className="dl-empty">아직 등록된 사람이 없습니다.</div>
      ) : (
        <ul className="form-list">
          {admins.map(admin => (
            <li key={admin.email}>
              <span className="admin-row">
                <span className="form-kind">{admin.dept ? deptName(admin.dept) : "전체"}</span>
                <span className="form-label">{admin.name || admin.email}</span>
                <span className="pt-meta">{admin.email}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  void removeAdmin(admin.email);
                }}
              >
                권한 빼기
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="fm">
        <h4 className="fm-title">권한 주기</h4>

        <label className="fm-row">
          <span>학교 계정 주소</span>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="hong@seoulsejong.sen.hs.kr"
          />
        </label>

        <label className="fm-row">
          <span>표시 이름</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="예: 교무행정부장"
          />
        </label>

        <label className="fm-row">
          <span>담당 부서</span>
          <select value={dept} onChange={e => setDept(e.target.value)}>
            <option value="">전체 부서</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="fm-error">{error}</p> : null}

        <div className="fm-actions">
          <button type="button" className="fm-save" onClick={save} disabled={busy}>
            {busy ? "등록 중" : "권한 주기"}
          </button>
        </div>
      </div>
    </section>
  );
}
