export const profile = {
  teacherName: "우리학교 부별공유",
  title: "우리학교 부별공유",
  introTitle: "우리학교 부별공유",
  introDescription: "부서 탭에서 업무분장을 열면 반복 업무와 처리 절차가 나옵니다. 마감이 있는 일은 교무실 공지에 있습니다.",
  catalogTitle: "교무실 공지",
  catalogDescription: "부별공유 · 업무분장",
  /* 왼쪽 프로필 사진입니다. public/assets/ 안에 파일을 넣고 경로를 적으세요. */
  photo: { src: "/assets/profile.svg", alt: "학교 배지 그림" },
  /* 홈 탭 위쪽 미니룸 이미지입니다. public/assets/ 안에 파일을 넣고 경로를 적으세요. */
  miniroom: { src: "/assets/miniroom.svg", alt: "교무실 책상 그림" },
  /* 아래는 탭 이름표입니다. 나만의 이름으로 바꿔도 되고, 안 바꾸면 기본값 그대로 나옵니다. */
  storyLabel: "연재물",
  boardLabel: "공용 링크",
  boardSubtitle: "부서 공통으로 쓰는 사이트",
  boardEmptyText: "아직 등록한 링크가 없습니다.",
  photoLabel: "사진첩",
  photoSubtitlePrefix: "사진",
  /* 오른쪽 위, 옛날 싸이월드 주소창을 흉내 낸 문구입니다. */
  displayUrl: "https://cando8442.github.io/school-work-links/"
};

/* 프로필 탭에 들어가는 소개 글입니다. 문구만 바꿔서 쓰세요. */
export type ProfileBlock =
  | { kind: "text"; lines: string[] }
  | { kind: "list"; heading: string; items: string[] }
  | { kind: "contact"; items: { label: string; value: string; href: string }[] };

export type ProfileSection = {
  id: string;
  title: string;
  /* 제목 옆 작은 글씨입니다. 생략하면 제목만 나옵니다. */
  subtitle?: string;
  blocks: ProfileBlock[];
};

export const profileSections: ProfileSection[] = [
  {
    id: "about",
    title: "이 페이지는",
    subtitle: "무엇을 모아 둔 곳인가요",
    blocks: [
      {
        kind: "text",
        lines: [
          "학기 중에 매일 들어가는 업무 사이트를 한 화면에 모은 링크 모음입니다.",
          "컴퓨터마다 즐겨찾기가 달라서 주소를 찾아 헤매는 일을 줄이려고 만들었습니다.",
          "주소만 모아 둔 공개 페이지이므로 로그인 정보나 학교 내부 자료는 담지 않습니다."
        ]
      },
      {
        kind: "list",
        heading: "담고 있는 것",
        items: [
          "업무시스템 — 나이스, 에듀파인, 업무포털처럼 로그인해서 쓰는 곳",
          "참고자료 — 교육과정·성취기준·진로·대입처럼 자료를 찾는 곳",
          "여기 있는 링크는 모두 공개된 공식 사이트 주소입니다"
        ]
      }
    ]
  },
  {
    id: "howto",
    title: "링크 고치는 법",
    subtitle: "직접 추가하거나 지울 때",
    blocks: [
      {
        kind: "list",
        heading: "순서",
        items: [
          "src/config/linktree.ts 파일의 boardPosts 목록을 고칩니다",
          "왼쪽 아래 파도타기 목록은 같은 파일의 waveLinks 를 고칩니다",
          "고친 뒤 main 브랜치에 push 하면 몇 분 뒤 자동으로 반영됩니다"
        ]
      }
    ]
  }
];

/* 연재물 회차는 src/config/miyotoon.ts 에 있습니다. 비워 두면 탭이 숨겨집니다. */
export { episodes, type Episode } from "./miyotoon";

/* 업무 링크 탭입니다. 링크를 여기에 추가하세요.
   preview 는 화면 미리보기 이미지입니다. public/assets/apps 에 넣고 경로를 적으세요.
   생략하면 썸네일 없이 제목만 나옵니다. */
export type BoardPost = {
  id: string;
  category: "업무시스템" | "참고자료";
  title: string;
  summary?: string;
  date: string;
  href: string;
  preview?: { src: string; alt: string };
};

export const boardPosts: BoardPost[] = [
  {
    id: "neis-sen",
    category: "업무시스템",
    title: "나이스(NEIS) 서울",
    summary: "출결·성적·학교생활기록부 입력",
    date: "sen.neis.go.kr",
    href: "https://sen.neis.go.kr"
  },
  {
    id: "work-portal",
    category: "업무시스템",
    title: "서울시교육청 업무포털",
    summary: "공문 기안과 결재, 메모보고",
    date: "work.sen.go.kr",
    href: "https://work.sen.go.kr"
  },
  {
    id: "klef",
    category: "업무시스템",
    title: "K-에듀파인",
    summary: "품의·정산 등 학교회계 업무",
    date: "klef.go.kr",
    href: "https://klef.go.kr"
  },
  {
    id: "neis-public",
    category: "업무시스템",
    title: "나이스 대국민서비스",
    summary: "증명서 발급과 학사일정 조회 안내",
    date: "neis.go.kr",
    href: "https://www.neis.go.kr"
  },
  {
    id: "sen",
    category: "업무시스템",
    title: "서울특별시교육청",
    summary: "공지·지침·부서 안내",
    date: "sen.go.kr",
    href: "https://www.sen.go.kr"
  },
  {
    id: "star-moe",
    category: "업무시스템",
    title: "학교생활기록부 종합지원포털",
    summary: "학생부 기재요령과 질의응답",
    date: "star.moe.go.kr",
    href: "https://star.moe.go.kr"
  },
  {
    id: "ncic",
    category: "참고자료",
    title: "국가교육과정정보센터(NCIC)",
    summary: "교육과정 원문과 성취기준 확인",
    date: "ncic.re.kr",
    href: "https://www.ncic.re.kr"
  },
  {
    id: "schoolinfo",
    category: "참고자료",
    title: "학교알리미",
    summary: "학교 공시자료와 편제표 조회",
    date: "schoolinfo.go.kr",
    href: "https://www.schoolinfo.go.kr"
  },
  {
    id: "edunet",
    category: "참고자료",
    title: "에듀넷 티-클리어",
    summary: "수업 자료와 디지털 교과서",
    date: "edunet.net",
    href: "https://www.edunet.net"
  },
  {
    id: "rang",
    category: "참고자료",
    title: "위두랑",
    summary: "학급 커뮤니티와 과제 공유",
    date: "rang.edunet.net",
    href: "https://rang.edunet.net"
  },
  {
    id: "career",
    category: "참고자료",
    title: "커리어넷",
    summary: "진로 검사와 진로 상담 자료",
    date: "career.go.kr",
    href: "https://www.career.go.kr"
  },
  {
    id: "adiga",
    category: "참고자료",
    title: "대입정보포털 어디가",
    summary: "대학별 전형과 입시 자료",
    date: "adiga.kr",
    href: "https://www.adiga.kr"
  },
  {
    id: "kice",
    category: "참고자료",
    title: "한국교육과정평가원",
    summary: "평가 연구자료와 시험 안내",
    date: "kice.re.kr",
    href: "https://www.kice.re.kr"
  },
  {
    id: "suneung",
    category: "참고자료",
    title: "대학수학능력시험 홈페이지",
    summary: "수능 일정과 기출문제",
    date: "suneung.re.kr",
    href: "https://www.suneung.re.kr"
  },
  {
    id: "neti",
    category: "참고자료",
    title: "중앙교육연수원",
    summary: "직무연수 신청과 이수 확인",
    date: "neti.go.kr",
    href: "https://www.neti.go.kr"
  },
  {
    id: "moe",
    category: "참고자료",
    title: "교육부",
    summary: "교육정책과 보도자료",
    date: "moe.go.kr",
    href: "https://www.moe.go.kr"
  }
];

/* 사진첩 탭입니다. 비워 두면 탭이 숨겨집니다. */
export type PhotoItem = {
  id: string;
  name: string;
  src: string;
};

export const photos: PhotoItem[] = [];

/* 왼쪽 아래 파도타기 목록입니다.
   고정 규칙: 첫 번째 항목은 반드시 "도름스 커뮤니티 나의 활동" 링크입니다. 지우지 마세요. */
export type WaveLink = {
  id: string;
  label: string;
  href: string;
};

export const waveLinks: WaveLink[] = [
  { id: "dorms-activity", label: "도름스 커뮤니티 나의 활동", href: "" }
];

/* 미니홈피 BGM 입니다. 유튜브 영상을 음원으로 씁니다.
   videoId 는 https://www.youtube.com/watch?v=abcd1234XYZ 에서 v= 뒤에 오는 값입니다.
   배열을 비우면 플레이어가 아예 표시되지 않습니다.

   여러 곡이 이어진 플레이리스트 영상이라면, 같은 videoId 를 쓰면서 startAt 에
   각 곡이 시작하는 지점을 초 단위로 적으세요. 제목을 누르면 그 지점부터 재생됩니다.
   startAt 은 secondsAt("3:21") 처럼 적으면 편합니다. */
export type BgmTrack = {
  id: string;
  title: string;
  artist?: string;
  videoId: string;
  /* 영상 안에서 이 곡이 시작하는 지점입니다. 초 단위이고, 생략하면 처음부터입니다. */
  startAt?: number;
};

/* "3:21" 이나 "1:02:30" 을 초로 바꿔 줍니다. */
export function secondsAt(timestamp: string): number {
  return timestamp
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}

export const bgmTracks: BgmTrack[] = [];

/* 홈 탭 아래쪽 한마디입니다. */
export type GuestbookEntry = {
  id: number;
  author: string;
  text: string;
  date: string;
};

export const guestbook: GuestbookEntry[] = [];
