import type { Metadata } from "next";
import { SCHOOL } from "@/config/school";

export const metadata: Metadata = {
  title: `개인정보처리방침 | ${SCHOOL.name} ${SCHOOL.siteName}`,
  description: `${SCHOOL.name} ${SCHOOL.siteName} 가 다루는 정보와 그 처리 방법을 밝힙니다.`
};

const UPDATED = "2026년 9월 6일";
const MANAGER = `${SCHOOL.privacyManager} (${SCHOOL.ownerEmail})`;

export default function PrivacyPage() {
  return (
    <div className="pg">
      <main className="mn">
        <h1 className="sec-title">개인정보처리방침</h1>

        <section className="duty-block">
          <p className="duty-summary">
            {SCHOOL.siteName} 는 {SCHOOL.name} 교직원이 부서 업무를 나누어 보기 위해 쓰는 내부용 웹 화면입니다.
            학생의 개인정보는 수집하지도 처리하지도 않습니다. 아래에 무엇을 다루는지 그대로 밝힙니다.
          </p>
        </section>

        <section className="duty-block">
          <h3>1. 수집하는 항목과 목적</h3>
          <ul className="note-list">
            <li>
              학교 구글 계정의 이메일 주소와 표시 이름을 받습니다. 로그인한 사람이 우리 학교 교직원인지
              확인하고, 글과 기록을 누가 남겼는지 보여 주기 위해서입니다.
            </li>
            <li>교직원이 스스로 적은 업무 내용, 마감, 게시글, 링크 주소를 저장합니다.</li>
            <li>주민등록번호, 연락처, 학생 정보는 받지 않습니다.</li>
          </ul>
        </section>

        <section className="duty-block">
          <h3>2. 보유 기간</h3>
          <ul className="note-list">
            <li>로그인 정보는 이용하는 동안 보관하고, 탈퇴나 삭제 요청이 있으면 지웁니다.</li>
            <li>업무 기록과 게시글은 쓴 사람이 언제든 지울 수 있고, 지우면 곧바로 사라집니다.</li>
            <li>학년도가 끝나면 관리자가 필요 없는 자료를 정리합니다.</li>
          </ul>
        </section>

        <section className="duty-block">
          <h3>3. 안전조치</h3>
          <ul className="note-list">
            <li>학교 도메인(@{SCHOOL.domain}) 계정으로 로그인한 사람만 볼 수 있습니다.</li>
            <li>
              화면에서 감추는 데 그치지 않고, 저장소 보안 규칙이 학교 계정이 아닌 요청을 서버에서
              막습니다.
            </li>
            <li>모든 통신은 HTTPS 로 암호화합니다.</li>
            <li>
              문서와 서식 파일은 이 사이트에 올리지 않고 학교 구글 드라이브에 두며, 여기에는 링크만
              적습니다. 실제 열람 제한은 드라이브 권한이 합니다.
            </li>
          </ul>
        </section>

        <section className="duty-block">
          <h3>4. 처리 위탁</h3>
          <ul className="note-list">
            <li>Google (Firebase 인증·데이터 저장): 로그인 확인과 업무 기록 보관</li>
            <li>Netlify: 화면 파일 제공(호스팅)</li>
            <li>위탁받은 곳은 맡긴 목적 밖으로 정보를 쓰지 않습니다.</li>
          </ul>
        </section>

        <section className="duty-block">
          <h3>5. 제3자 제공</h3>
          <p className="duty-summary">
            제3자에게 제공하지 않습니다. 법령에 따른 요구가 있을 때만 그 범위에서 따릅니다.
          </p>
        </section>

        <section className="duty-block">
          <h3>6. 아동 개인정보</h3>
          <p className="duty-summary">
            이 화면은 교직원만 로그인할 수 있으며 학생은 접근할 수 없습니다. 만 14세 미만을 포함해
            학생의 개인정보를 수집하거나 저장하지 않습니다.
          </p>
        </section>

        <section className="duty-block">
          <h3>7. 열람·정정·삭제·처리정지</h3>
          <p className="duty-summary">
            자기가 쓴 글과 기록은 화면에서 바로 고치고 지울 수 있습니다. 로그인 정보의 열람이나 삭제를
            원하시면 아래 담당자에게 알려 주시면 지체 없이 처리합니다.
          </p>
        </section>

        <section className="duty-block">
          <h3>8. 개인정보 보호책임자</h3>
          <p className="duty-summary">{MANAGER}</p>
        </section>

        <section className="duty-block">
          <h3>9. 방침 변경</h3>
          <p className="duty-summary">
            내용이 바뀌면 이 화면에 바뀐 날짜와 함께 올립니다. 마지막으로 고친 날: {UPDATED}
          </p>
        </section>

        <p className="fm-hint">
          <a className="dl-edit" href="../">
            부별공유로 돌아가기
          </a>
        </p>
      </main>
    </div>
  );
}
