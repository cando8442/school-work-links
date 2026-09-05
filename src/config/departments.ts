/* 부별공유 폴더를 대신하는 자료입니다.
   - departments : 오른쪽 탭 하나가 부서 하나입니다. 그 안에 업무분장이 들어갑니다.
   - 업무분장 하나를 누르면 "반복되는 업무(주기별)"와 "업무 관련 내용(절차·서식·메모)"이 나옵니다.
   - notices : 홈(교무실) 화면에 뜨는 공지입니다. 며칠까지 무엇을 해야 하는지 적습니다.

   담당자 이름은 공개 저장소에 넣지 않습니다. owner 에는 직책이나 "담당"만 적으세요. */

export type Routine = {
  /* 반복 주기입니다. 예: 매주 월요일 / 매월 초 / 학기초 / 연 1회(3월) */
  cycle: string;
  what: string;
};

export type DutyLink = {
  label: string;
  href: string;
};

export type Duty = {
  id: string;
  title: string;
  /* 담당 직책입니다. 개인 이름 대신 "부장", "담당" 처럼 적습니다. */
  owner?: string;
  /* 이 업무가 무엇인지 한 줄 정의입니다. */
  summary: string;
  /* 반복되는 업무입니다. */
  routines: Routine[];
  /* 처리 절차입니다. 인수인계 때 순서대로 따라 할 수 있게 적습니다. */
  howto?: string[];
  /* 주의사항과 인수인계 메모입니다. */
  notes?: string[];
  /* 관련 시스템·서식 링크입니다. */
  links?: DutyLink[];
};

export type Department = {
  id: string;
  name: string;
  /* 탭을 눌렀을 때 제목 옆에 붙는 작은 글씨입니다. */
  subtitle?: string;
  duties: Duty[];
};

export const departments: Department[] = [
  {
    id: "vice-principal",
    name: "교감",
    subtitle: "학교 운영 총괄",
    duties: [
      {
        id: "vp-plan",
        title: "학교교육계획 총괄",
        owner: "교감",
        summary: "학교교육계획서를 만들고, 부서별 계획이 학사일정과 어긋나지 않게 조정합니다.",
        routines: [
          { cycle: "연 1회(2월)", what: "부서별 계획 취합 후 학교교육계획서 확정" },
          { cycle: "매월 초", what: "부장회의에서 월간 추진 사항 점검" },
          { cycle: "학기말", what: "교육활동 평가회 운영과 차년도 개선안 정리" }
        ],
        howto: [
          "부서별 계획 양식을 배부하고 제출 기한을 정합니다",
          "학사일정·행사일과 겹치는 일정을 조정합니다",
          "학교운영위원회 심의를 거쳐 확정하고 학교 홈페이지에 공개합니다"
        ],
        notes: [
          "부서 계획이 바뀌면 학사일정도 같이 고쳐야 합니다",
          "정보공시 항목과 연결되므로 교무행정부와 최종본을 맞춥니다"
        ]
      },
      {
        id: "vp-hr",
        title: "교원 인사·복무",
        owner: "교감",
        summary: "복무 결재와 인사 관련 사항을 처리합니다.",
        routines: [
          { cycle: "수시", what: "출장·연가·조퇴 등 복무 결재" },
          { cycle: "매월 말", what: "초과근무·복무 현황 확인" },
          { cycle: "연 1회(12~1월)", what: "차년도 업무분장 초안 협의" }
        ],
        howto: [
          "복무는 나이스에서 신청·결재 순서를 지킵니다",
          "장기 출장·연수는 수업 결손 대책(보결 계획)을 함께 확인합니다"
        ],
        links: [{ label: "나이스(NEIS) 서울", href: "https://sen.neis.go.kr" }]
      },
      {
        id: "vp-committee",
        title: "각종 위원회 운영",
        owner: "교감",
        summary: "학교운영위원회를 비롯한 법정 위원회의 일정과 회의록을 관리합니다.",
        routines: [
          { cycle: "분기 1회", what: "학교운영위원회 개최와 회의록 정리" },
          { cycle: "수시", what: "인사자문·교권보호 등 사안 발생 시 위원회 소집" }
        ],
        notes: ["회의록과 심의 결과는 정보공시 자료로 이어지므로 원본을 보관합니다"]
      }
    ]
  },
  {
    id: "affairs",
    name: "교무행정부",
    subtitle: "학적·출결·나이스",
    duties: [
      {
        id: "af-record",
        title: "학적·전출입",
        owner: "담당",
        summary: "재적생 학적 사항과 전입·전출·자퇴 처리를 담당합니다.",
        routines: [
          { cycle: "수시", what: "전입·전출 서류 접수와 나이스 학적 처리" },
          { cycle: "매월 초", what: "학적 변동 현황 정리" },
          { cycle: "학년말", what: "진급·졸업 처리와 학적부 마감" }
        ],
        howto: [
          "전입: 전적교 서류 확인 → 나이스 학적 입력 → 담임·교육과정부에 반 배정 통보",
          "전출: 전출 확인서 발급 → 나이스 처리 → 생활기록부 이관",
          "자퇴·유예는 상담 기록과 보호자 확인서를 함께 보관합니다"
        ],
        notes: ["처리 날짜가 곧 학적 기준일이 되므로 입력을 미루지 않습니다"],
        links: [{ label: "나이스(NEIS) 서울", href: "https://sen.neis.go.kr" }]
      },
      {
        id: "af-attendance",
        title: "출결 관리",
        owner: "담당",
        summary: "일일 출결 집계와 결석계 처리를 총괄합니다.",
        routines: [
          { cycle: "매일", what: "담임 출결 입력 확인과 미입력 안내" },
          { cycle: "매주 금요일", what: "주간 출결 통계 정리" },
          { cycle: "매월 말", what: "월 출결 마감과 장기결석자 보고" }
        ],
        howto: [
          "결석계는 사유별 증빙(진단서·확인서)을 확인하고 접수합니다",
          "인정결석·질병결석 구분 기준을 학년부와 통일합니다",
          "월 마감 후에는 수정 이력이 남으므로 마감 전에 정정합니다"
        ],
        notes: ["장기결석(7일 이상)은 별도 보고 절차가 있습니다"]
      },
      {
        id: "af-schedule",
        title: "학사일정·주간 계획",
        owner: "담당",
        summary: "연간 학사일정과 주간 업무 계획을 작성해 공유합니다.",
        routines: [
          { cycle: "매주 목요일", what: "다음 주 주간 계획 취합·배부" },
          { cycle: "매월 말", what: "다음 달 행사 일정 확정" },
          { cycle: "연 1회(2월)", what: "연간 학사일정 수립" }
        ],
        howto: [
          "부서별 행사 요청을 받아 겹치는 일정을 조정합니다",
          "확정본은 홈페이지와 교무실 게시판에 같이 올립니다"
        ]
      },
      {
        id: "af-disclosure",
        title: "정보공시",
        owner: "담당",
        summary: "학교알리미 공시 항목을 기한 안에 등록합니다.",
        routines: [
          { cycle: "연 4회(4·5·9·10월)", what: "공시 항목별 자료 취합과 등록" },
          { cycle: "공시 후", what: "오류 점검 기간에 수정 사항 반영" }
        ],
        howto: [
          "항목별 담당 부서에 자료를 요청합니다(교육과정·예산·급식 등)",
          "전년도 공시본과 비교해 누락 항목을 확인한 뒤 등록합니다"
        ],
        links: [{ label: "학교알리미", href: "https://www.schoolinfo.go.kr" }]
      },
      {
        id: "af-neis",
        title: "나이스 권한·기초자료",
        owner: "담당",
        summary: "나이스 사용자 권한과 학교 기초자료를 관리합니다.",
        routines: [
          { cycle: "학기초", what: "교직원 권한 부여·회수" },
          { cycle: "수시", what: "인증서 문제, 권한 오류 대응" }
        ],
        notes: ["권한은 업무 범위만큼만 부여하고 전보·퇴직 시 즉시 회수합니다"]
      }
    ]
  },
  {
    id: "creative",
    name: "창의연구부",
    subtitle: "수업·연수·동아리",
    duties: [
      {
        id: "cr-plc",
        title: "전문적학습공동체·교내 연수",
        owner: "담당",
        summary: "교내 연수와 학습공동체 운영을 계획하고 실적을 정리합니다.",
        routines: [
          { cycle: "월 1회", what: "학습공동체 모임 운영과 활동 기록" },
          { cycle: "학기 1회", what: "교내 자율연수 개설·이수 처리" },
          { cycle: "학기말", what: "활동 보고서 취합과 실적 등록" }
        ],
        howto: [
          "연간 주제와 모임 일정을 학기초에 확정합니다",
          "모임마다 사진·회의록을 남겨 보고서 근거로 씁니다"
        ],
        links: [{ label: "중앙교육연수원", href: "https://www.neti.go.kr" }]
      },
      {
        id: "cr-open-class",
        title: "수업 공개·수업 나눔",
        owner: "담당",
        summary: "교사별 공개수업 일정을 잡고 참관·나눔을 진행합니다.",
        routines: [
          { cycle: "학기 1회", what: "공개수업 일정 배정과 안내" },
          { cycle: "공개수업 후", what: "참관록·나눔 기록 수합" }
        ],
        notes: ["학부모 공개수업과 교원 상호 공개수업은 따로 집계합니다"]
      },
      {
        id: "cr-club",
        title: "동아리·창의적 체험활동",
        owner: "담당",
        summary: "동아리 개설과 창의적 체험활동 운영을 담당합니다.",
        routines: [
          { cycle: "학기초", what: "동아리 개설·학생 배정" },
          { cycle: "월 1회", what: "동아리 활동 시수 점검" },
          { cycle: "학기말", what: "활동 내용 생활기록부 입력 안내" }
        ],
        howto: [
          "개설 신청 → 지도교사 배정 → 학생 신청·배정 순서로 진행합니다",
          "시수 미달 동아리는 보충 활동 일정을 잡습니다"
        ]
      },
      {
        id: "cr-contest",
        title: "교내 대회·발표회",
        owner: "담당",
        summary: "교내 대회 계획을 세우고 시상·기록을 정리합니다.",
        routines: [
          { cycle: "학기초", what: "연간 교내 대회 계획 공고" },
          { cycle: "대회 후 2주 내", what: "시상 대장 정리와 생활기록부 반영 안내" }
        ],
        notes: ["학기초 공고에 들어 있는 대회만 인정됩니다"]
      }
    ]
  },
  {
    id: "curriculum",
    name: "교육과정부",
    subtitle: "편제·평가·성적",
    duties: [
      {
        id: "cu-plan",
        title: "교육과정 편성·편제",
        owner: "담당",
        summary: "학년별 편제표와 시간 배당을 만들고 수정합니다.",
        routines: [
          { cycle: "연 1회(10~12월)", what: "차년도 편제표 작성과 심의" },
          { cycle: "학기초", what: "시간표 확정과 교과 시수 확인" }
        ],
        howto: [
          "학년별 이수 단위와 필수 이수 기준을 먼저 확인합니다",
          "선택과목 수요조사 결과를 반영해 편제표를 조정합니다",
          "확정본은 학교알리미 공시 자료와 일치시킵니다"
        ],
        links: [
          { label: "국가교육과정정보센터(NCIC)", href: "https://www.ncic.re.kr" },
          { label: "학교알리미", href: "https://www.schoolinfo.go.kr" }
        ]
      },
      {
        id: "cu-eval",
        title: "평가계획·지필고사 운영",
        owner: "담당",
        summary: "과목별 평가계획을 취합하고 고사를 운영합니다.",
        routines: [
          { cycle: "학기초", what: "과목별 평가계획 취합·심의·공개" },
          { cycle: "고사 3주 전", what: "고사 시간표와 감독 배정" },
          { cycle: "고사 후", what: "이의신청 접수와 처리" }
        ],
        howto: [
          "평가계획은 학기 시작 전에 공개해야 하며 변경 시 재심의가 필요합니다",
          "문항 검토는 동교과 교차 검토로 진행합니다",
          "이의신청은 접수·검토·회신 기록을 남깁니다"
        ],
        notes: ["평가계획 변경은 사유서와 심의 기록이 함께 있어야 합니다"]
      },
      {
        id: "cu-grade",
        title: "성적 처리·성적사정",
        owner: "담당",
        summary: "성적 입력 일정 관리와 성적사정회 운영을 담당합니다.",
        routines: [
          { cycle: "고사 후 2주", what: "성적 입력 기간 운영과 마감 안내" },
          { cycle: "학기말", what: "성적사정회 개최와 결과 확정" },
          { cycle: "확정 후", what: "성적통지표 출력·배부" }
        ],
        howto: [
          "입력 마감 전 미입력 과목을 확인해 개별 안내합니다",
          "정정은 정정대장에 기록하고 결재를 받은 뒤 처리합니다"
        ]
      },
      {
        id: "cu-textbook",
        title: "교과서·방과후학교",
        owner: "담당",
        summary: "교과서 주문·배부와 방과후학교 개설을 담당합니다.",
        routines: [
          { cycle: "연 1회(11~12월)", what: "차년도 교과서 선정·주문" },
          { cycle: "학기초", what: "교과서 배부와 부족분 추가 주문" },
          { cycle: "학기별", what: "방과후 강좌 개설·수강 신청·정산" }
        ]
      }
    ]
  },
  {
    id: "career",
    name: "진로진학부",
    subtitle: "진로·대입",
    duties: [
      {
        id: "ca-counsel",
        title: "진로 상담·진로활동",
        owner: "담당",
        summary: "진로 검사와 상담, 진로활동 프로그램을 운영합니다.",
        routines: [
          { cycle: "학기초", what: "진로 검사 실시와 결과 안내" },
          { cycle: "월 1회", what: "진로 특강·직업인 초청 운영" },
          { cycle: "수시", what: "개별 진로 상담과 기록 정리" }
        ],
        links: [{ label: "커리어넷", href: "https://www.career.go.kr" }]
      },
      {
        id: "ca-admission",
        title: "대입 전형 지원",
        owner: "담당",
        summary: "수시·정시 원서 접수 일정을 안내하고 서류 발급을 지원합니다.",
        routines: [
          { cycle: "연 1회(9월)", what: "수시 원서 접수 안내와 서류 점검" },
          { cycle: "연 1회(12~1월)", what: "정시 원서 접수 안내" },
          { cycle: "수시", what: "학교생활기록부·추천서 등 서류 발급" }
        ],
        howto: [
          "대학별 마감 시각이 다르므로 접수 마지막 날 오전에 최종 확인합니다",
          "서류 발급 요청은 신청서를 받아 발급 대장에 기록합니다"
        ],
        links: [
          { label: "대입정보포털 어디가", href: "https://www.adiga.kr" },
          { label: "대학수학능력시험", href: "https://www.suneung.re.kr" }
        ]
      },
      {
        id: "ca-record",
        title: "학생부 기재 지원",
        owner: "담당",
        summary: "학교생활기록부 기재요령을 안내하고 점검을 지원합니다.",
        routines: [
          { cycle: "학기말", what: "기재요령 연수와 마감 일정 안내" },
          { cycle: "마감 전", what: "기재 금지 사항 점검표 배부" }
        ],
        links: [{ label: "학교생활기록부 종합지원포털", href: "https://star.moe.go.kr" }]
      },
      {
        id: "ca-briefing",
        title: "진학 설명회·학부모 안내",
        owner: "담당",
        summary: "학년별 진학 설명회를 계획하고 운영합니다.",
        routines: [
          { cycle: "학기 1회", what: "학년별 진학 설명회 개최" },
          { cycle: "설명회 후", what: "자료집 배포와 질의 정리" }
        ]
      }
    ]
  },
  {
    id: "safety",
    name: "생활안전부",
    subtitle: "생활교육·안전",
    duties: [
      {
        id: "sf-guidance",
        title: "생활교육·선도위원회",
        owner: "담당",
        summary: "생활규정 운영과 선도 절차를 담당합니다.",
        routines: [
          { cycle: "학기초", what: "생활규정 안내와 서약 절차" },
          { cycle: "수시", what: "사안 접수·조사·선도위원회 개최" },
          { cycle: "매월", what: "생활교육 실적 정리" }
        ],
        howto: [
          "사안 접수 → 사실 확인서 작성 → 보호자 통지 → 위원회 개최 순서를 지킵니다",
          "모든 단계의 날짜와 통지 방법을 기록으로 남깁니다"
        ]
      },
      {
        id: "sf-violence",
        title: "학교폭력 예방·사안 처리",
        owner: "담당",
        summary: "학교폭력 예방교육과 사안 처리 절차를 관리합니다.",
        routines: [
          { cycle: "학기 1회", what: "학교폭력 예방교육 실시와 보고" },
          { cycle: "연 2회", what: "학교폭력 실태조사 실시" },
          { cycle: "사안 발생 시", what: "즉시 분리·신고·조사 절차 진행" }
        ],
        notes: [
          "법정 기한이 정해진 절차이므로 접수 즉시 일정표를 만들어 관리합니다",
          "관련 기록은 시건 장치가 있는 곳에 따로 보관합니다"
        ]
      },
      {
        id: "sf-safety",
        title: "안전교육·재난대비 훈련",
        owner: "담당",
        summary: "법정 안전교육 시수와 대피 훈련을 운영합니다.",
        routines: [
          { cycle: "학기 1회", what: "재난대비 대피 훈련 실시" },
          { cycle: "연간", what: "안전교육 영역별 시수 확보와 기록" },
          { cycle: "매월", what: "시설 안전 점검표 작성" }
        ],
        howto: ["훈련 계획 → 사전 교육 → 실시 → 결과 보고 순서로 기록을 남깁니다"]
      },
      {
        id: "sf-traffic",
        title: "등하교·교통 지도",
        owner: "담당",
        summary: "등하교 지도와 교통안전 관련 사항을 담당합니다.",
        routines: [
          { cycle: "매일", what: "등교 시간대 지도 인원 배치" },
          { cycle: "학기초", what: "통학로 안전 점검과 개선 요청" }
        ]
      }
    ]
  },
  {
    id: "grade1",
    name: "1학년부",
    subtitle: "학년 운영",
    duties: [
      {
        id: "g1-run",
        title: "학년 학사 운영",
        owner: "학년부장",
        summary: "1학년 전체 일정과 학년 행사를 운영합니다.",
        routines: [
          { cycle: "매주", what: "학년 협의회 운영과 담임 전달사항 공유" },
          { cycle: "학기초", what: "학급 편성·자리 배치·학급 임원 선출" },
          { cycle: "학기말", what: "학년 교육활동 정리와 차학기 계획" }
        ]
      },
      {
        id: "g1-adapt",
        title: "신입생 적응·기초학력",
        owner: "담당",
        summary: "입학 초기 적응 프로그램과 기초학력 지원을 담당합니다.",
        routines: [
          { cycle: "연 1회(3월)", what: "신입생 오리엔테이션 운영" },
          { cycle: "학기초", what: "기초학력 진단검사 실시와 결과 안내" },
          { cycle: "학기 중", what: "지원 대상 학생 보충 프로그램 운영" }
        ]
      },
      {
        id: "g1-attend",
        title: "학년 출결·상담",
        owner: "담당",
        summary: "학년 단위 출결 취합과 학생·학부모 상담을 관리합니다.",
        routines: [
          { cycle: "매일", what: "담임 출결 입력 확인" },
          { cycle: "학기 1회", what: "학부모 상담 주간 운영" }
        ]
      },
      {
        id: "g1-event",
        title: "학년 행사",
        owner: "담당",
        summary: "현장체험학습 등 1학년 행사를 계획하고 실행합니다.",
        routines: [
          { cycle: "학기 1회", what: "현장체험학습 계획·안전 계획 수립" },
          { cycle: "행사 후", what: "결과 보고와 정산" }
        ]
      }
    ]
  },
  {
    id: "grade2",
    name: "2학년부",
    subtitle: "학년 운영",
    duties: [
      {
        id: "g2-run",
        title: "학년 학사 운영",
        owner: "학년부장",
        summary: "2학년 전체 일정과 학년 행사를 운영합니다.",
        routines: [
          { cycle: "매주", what: "학년 협의회 운영과 담임 전달사항 공유" },
          { cycle: "학기초", what: "학급 편성과 선택과목 반 확인" },
          { cycle: "학기말", what: "학년 교육활동 정리" }
        ]
      },
      {
        id: "g2-trip",
        title: "수학여행·수련활동",
        owner: "담당",
        summary: "숙박형 체험활동을 계획부터 정산까지 담당합니다.",
        routines: [
          { cycle: "연 1회(사전)", what: "업체 선정·사전답사·안전 계획 수립" },
          { cycle: "출발 2주 전", what: "학부모 설명회와 참가 동의서 취합" },
          { cycle: "종료 후", what: "결과 보고와 정산" }
        ],
        howto: [
          "계약·정산은 행정실과 일정을 맞춥니다",
          "미참가 학생의 교내 대체 프로그램을 함께 계획합니다"
        ],
        notes: ["사전답사 보고서는 안전 계획의 근거 자료가 됩니다"]
      },
      {
        id: "g2-subject",
        title: "선택과목 수요조사",
        owner: "담당",
        summary: "3학년 선택과목 수요조사를 진행해 교육과정부에 넘깁니다.",
        routines: [
          { cycle: "연 1회(2학기)", what: "안내 → 1차 조사 → 상담 → 최종 조사" }
        ],
        notes: ["조사 결과가 차년도 편제표와 시간표의 기준이 됩니다"]
      },
      {
        id: "g2-attend",
        title: "학년 출결·상담",
        owner: "담당",
        summary: "학년 단위 출결 취합과 상담을 관리합니다.",
        routines: [
          { cycle: "매일", what: "담임 출결 입력 확인" },
          { cycle: "학기 1회", what: "학부모 상담 주간 운영" }
        ]
      }
    ]
  },
  {
    id: "grade3",
    name: "3학년부",
    subtitle: "학년 운영·대입",
    duties: [
      {
        id: "g3-run",
        title: "학년 학사 운영",
        owner: "학년부장",
        summary: "3학년 일정과 대입 일정을 함께 관리합니다.",
        routines: [
          { cycle: "매주", what: "학년 협의회와 대입 일정 공유" },
          { cycle: "매월", what: "모의고사 운영과 결과 분석 배부" }
        ]
      },
      {
        id: "g3-admission",
        title: "대입 원서 지원",
        owner: "담당",
        summary: "진로진학부와 함께 원서 접수와 서류를 챙깁니다.",
        routines: [
          { cycle: "연 1회(9월)", what: "수시 원서 접수 지도와 담임 확인" },
          { cycle: "수시", what: "면접·논술 일정에 따른 출결 처리" },
          { cycle: "연 1회(12~1월)", what: "정시 지원 상담" }
        ],
        howto: ["대학별 전형일 결석은 인정결석 처리 근거(수험표 등)를 함께 받습니다"]
      },
      {
        id: "g3-record",
        title: "학생부 마감 점검",
        owner: "담당",
        summary: "3학년 학생부 기재와 마감 일정을 관리합니다.",
        routines: [
          { cycle: "마감 전", what: "기재 누락·금지 사항 점검" },
          { cycle: "마감 후", what: "정정 필요 사항 정정대장 처리" }
        ],
        links: [{ label: "학교생활기록부 종합지원포털", href: "https://star.moe.go.kr" }]
      },
      {
        id: "g3-graduate",
        title: "졸업·수료 처리",
        owner: "담당",
        summary: "졸업사정과 졸업식 준비를 담당합니다.",
        routines: [
          { cycle: "연 1회(1~2월)", what: "졸업사정회와 졸업대장 정리" },
          { cycle: "연 1회(2월)", what: "졸업식 운영과 상장·앨범 준비" }
        ]
      }
    ]
  },
  {
    id: "affairs-google",
    name: "교무부(1)",
    subtitle: "구글 워크스페이스 방식",
    duties: [
      {
        id: "ag-storage",
        title: "부서 문서 보관·공유",
        owner: "담당",
        summary: "부서 자료를 공유 드라이브에 두고 권한으로 관리합니다.",
        routines: [
          { cycle: "학년초", what: "공유 드라이브 생성과 부서원 권한 부여" },
          { cycle: "수시", what: "연도별·업무별 폴더에 자료 저장" },
          { cycle: "인사이동 시", what: "구성원 교체(파일은 드라이브에 남음)" }
        ],
        howto: [
          "내 드라이브가 아니라 공유 드라이브에 만듭니다. 담당자가 바뀌어도 파일이 따라가지 않습니다",
          "폴더는 연도 > 업무 순으로 두 단계까지만 만듭니다",
          "권한은 콘텐츠 관리자(부장), 참여자(부서원), 뷰어(타 부서)로 나눕니다"
        ],
        notes: [
          "개인 계정이 소유한 파일은 전보하면 접근이 끊깁니다. 반드시 공유 드라이브로 옮깁니다",
          "학교 도메인 계정이 없으면 외부 공유를 막는 설정을 걸기 어렵습니다"
        ],
        links: [
          { label: "구글 드라이브", href: "https://drive.google.com" },
          { label: "구글 문서", href: "https://docs.google.com" }
        ]
      },
      {
        id: "ag-collect",
        title: "자료 취합(서식 수합)",
        owner: "담당",
        summary: "설문지로 받아 스프레드시트에 자동으로 모읍니다.",
        routines: [
          { cycle: "수시", what: "구글 설문지로 제출 양식 배포" },
          { cycle: "마감일", what: "응답 시트에서 미제출자 확인과 개별 안내" }
        ],
        howto: [
          "설문지 응답을 스프레드시트로 연결하면 제출 즉시 표가 채워집니다",
          "미제출자는 명단 시트와 응답 시트를 함수로 대조해 찾습니다",
          "반복 작업은 Apps Script로 자동 알림까지 붙일 수 있습니다"
        ],
        links: [
          { label: "구글 설문지", href: "https://docs.google.com/forms" },
          { label: "구글 스프레드시트", href: "https://docs.google.com/spreadsheets" }
        ]
      },
      {
        id: "ag-meeting",
        title: "회의·알림·일정",
        owner: "담당",
        summary: "캘린더와 채팅으로 부서 일정과 전달사항을 공유합니다.",
        routines: [
          { cycle: "매주", what: "부서 협의회 일정 캘린더 등록" },
          { cycle: "수시", what: "채팅방으로 전달사항 공지" }
        ],
        howto: [
          "부서 캘린더를 따로 만들어 부서원에게 공유합니다",
          "회의록은 문서 하나를 계속 이어 쓰고 캘린더 일정에 첨부합니다"
        ],
        links: [
          { label: "구글 캘린더", href: "https://calendar.google.com" },
          { label: "구글 미트", href: "https://meet.google.com" }
        ]
      }
    ]
  },
  {
    id: "affairs-ms",
    name: "교무부(2)",
    subtitle: "Microsoft 365 방식",
    duties: [
      {
        id: "am-storage",
        title: "부서 문서 보관·공유",
        owner: "담당",
        summary: "팀즈에 부서 팀을 만들고 그 안 문서함에 자료를 둡니다.",
        routines: [
          { cycle: "학년초", what: "부서 팀 생성과 구성원 추가" },
          { cycle: "수시", what: "업무별 채널 문서함에 자료 저장" },
          { cycle: "인사이동 시", what: "팀 구성원 교체(파일은 팀에 남음)" }
        ],
        howto: [
          "개인 OneDrive가 아니라 팀 문서함에 올립니다. 담당자가 바뀌어도 파일이 남습니다",
          "업무별로 채널을 만들면 채널마다 폴더가 자동으로 생깁니다",
          "권한은 소유자(부장), 구성원(부서원), 게스트(외부)로 나눕니다"
        ],
        notes: [
          "서울시교육청은 클래스이음(o365.sen.go.kr)으로 교직원 계정을 제공합니다",
          "한글(HWP) 문서는 웹에서 바로 열리지 않아 내려받아 열어야 합니다"
        ],
        links: [
          { label: "클래스이음(서울 M365)", href: "https://o365.sen.go.kr" },
          { label: "Teams", href: "https://teams.microsoft.com" }
        ]
      },
      {
        id: "am-collect",
        title: "자료 취합(서식 수합)",
        owner: "담당",
        summary: "Forms로 받아 Excel 파일에 모읍니다.",
        routines: [
          { cycle: "수시", what: "Microsoft Forms로 제출 양식 배포" },
          { cycle: "마감일", what: "응답 파일에서 미제출자 확인과 개별 안내" }
        ],
        howto: [
          "Forms 응답은 팀 문서함의 Excel 파일로 저장됩니다",
          "미제출자는 명단 시트와 응답 시트를 함수로 대조해 찾습니다",
          "반복 작업은 Power Automate 흐름으로 알림을 붙일 수 있습니다"
        ],
        links: [
          { label: "Microsoft Forms", href: "https://forms.office.com" },
          { label: "Office 홈", href: "https://www.office.com" }
        ]
      },
      {
        id: "am-meeting",
        title: "회의·알림·일정",
        owner: "담당",
        summary: "Teams 채널과 Outlook 일정으로 부서 일정과 전달사항을 공유합니다.",
        routines: [
          { cycle: "매주", what: "부서 협의회 일정 Outlook 등록" },
          { cycle: "수시", what: "Teams 채널 게시글로 전달사항 공지" }
        ],
        howto: [
          "전달사항은 채팅이 아니라 채널 게시글로 남겨야 나중에 찾을 수 있습니다",
          "회의는 Teams 회의로 열면 녹화와 기록이 같은 채널에 쌓입니다"
        ],
        links: [
          { label: "Outlook", href: "https://outlook.office.com" },
          { label: "Teams", href: "https://teams.microsoft.com" }
        ]
      }
    ]
  }
];

/* 홈(교무실) 화면에 뜨는 공지입니다.
   due 는 "2026-09-08" 처럼 적습니다. 화면에서는 9월 8일과 남은 날짜로 바뀝니다.
   dept 는 위 departments 의 name 과 같게 적으면 어느 부서 건인지 함께 보입니다. */
export type Notice = {
  id: string;
  due: string;
  dept: string;
  title: string;
  detail?: string;
};

export const notices: Notice[] = [
  {
    id: "n-2026-09-08",
    due: "2026-09-08",
    dept: "교육과정부",
    title: "2학기 수행평가 계획 제출",
    detail: "과목별 평가계획 변경분을 포함해 제출합니다."
  },
  {
    id: "n-2026-09-11",
    due: "2026-09-11",
    dept: "교무행정부",
    title: "정보공시(9월) 자료 제출",
    detail: "부서별 담당 항목 자료를 담당자에게 보냅니다."
  },
  {
    id: "n-2026-09-15",
    due: "2026-09-15",
    dept: "3학년부",
    title: "수시 원서 접수 최종 확인",
    detail: "담임 확인 후 미접수 학생은 개별 연락합니다."
  },
  {
    id: "n-2026-09-19",
    due: "2026-09-19",
    dept: "생활안전부",
    title: "학교폭력 예방교육 실시 보고",
    detail: "실시 사진과 교육자료를 함께 올립니다."
  },
  {
    id: "n-2026-09-25",
    due: "2026-09-25",
    dept: "창의연구부",
    title: "전문적학습공동체 3차 활동 보고",
    detail: "회의록과 참석자 명단을 제출합니다."
  },
  {
    id: "n-2026-09-30",
    due: "2026-09-30",
    dept: "교무행정부",
    title: "9월 출결 마감",
    detail: "마감 후에는 정정 이력이 남습니다."
  },
  {
    id: "n-2026-10-02",
    due: "2026-10-02",
    dept: "2학년부",
    title: "수학여행 사전답사 결과 보고",
    detail: "안전 계획 수립의 근거 자료로 첨부합니다."
  },
  {
    id: "n-2026-10-08",
    due: "2026-10-08",
    dept: "교육과정부",
    title: "2차 지필고사 시간표·감독 배정 확정",
    detail: "감독 불가 일정은 미리 회신 바랍니다."
  }
];
