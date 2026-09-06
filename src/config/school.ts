/* ===================================================================
   다른 학교로 옮길 때 여기만 고치면 됩니다.
   이 파일 하나와 firestore.rules 맨 위 두 곳이 학교별 설정의 전부입니다.
   자세한 순서는 docs/SETUP.md 에 있습니다.
   =================================================================== */

export const SCHOOL = {
  /* 화면 곳곳에 나오는 학교 이름입니다. */
  name: "서울세종고등학교",

  /* 사이트 이름입니다. 머리말과 브라우저 탭에 나옵니다. */
  siteName: "부별공유",

  /* 로그인을 허용할 학교 구글 도메인입니다. @ 없이 적습니다.
     쉼표로 여러 개를 적을 수 있습니다. 예: "abc.sen.hs.kr,def.hs.kr"
     firestore.rules 의 도메인도 같이 고쳐야 실제로 막힙니다. */
  domain: "seoulsejong.sen.hs.kr",

  /* 편집 권한을 나눠 줄 수 있는 최초 관리자입니다.
     firestore.rules 의 isOwner() 안 주소와 같아야 합니다. */
  ownerEmail: "cando8442@seoulsejong.sen.hs.kr",

  /* 머리말 로고 그림입니다. public/assets/ 안에 넣고 경로를 적으세요.
     비워 두면 학교 이름만 글자로 나옵니다. */
  logo: "/assets/school-logo.png",

  /* 도름스 커뮤니티 나의 활동 링크입니다. 비워 두면 꼬리말에 나오지 않습니다. */
  dormsUrl: "https://dorms.school/u/cando8442",

  /* 개인정보처리방침에 적는 담당자 표기입니다. 이름 대신 직책을 권합니다. */
  privacyManager: "부별공유 관리자"
} as const;

/* 도메인 목록입니다. 환경변수 NEXT_PUBLIC_SCHOOL_DOMAIN 을 넣으면 그것이 우선합니다. */
export const SCHOOL_DOMAIN_LIST = (process.env.NEXT_PUBLIC_SCHOOL_DOMAIN ?? SCHOOL.domain)
  .split(",")
  .map(d => d.trim().replace(/^@/, "").toLowerCase())
  .filter(Boolean);
