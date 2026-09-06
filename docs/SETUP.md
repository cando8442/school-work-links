# 우리 학교 부별공유 만들기

## 사람이 할 일 (딱 한 줄)

포크할 필요 없이, 이 저장소 링크를 그대로 자기가 쓰는 AI 코딩 도구에 주면서 이렇게만 말하면 됩니다.

> 이 깃허브 저장소로 우리 학교 부별공유를 만들고 싶어: https://github.com/cando8442/school-work-links . `docs/SETUP.md`를 읽고 그대로 진행해줘.

---

## AI에게 (이 문서를 읽고 있는 당신에게)

사람이 방금 이 저장소 링크를 주면서 이 문서를 읽고 진행해 달라고 한 상황입니다. 문서를 요약해 보여 주지 말고 아래 절차를 바로 실행하세요. 지금 만드는 것은 원 저작자(서울세종고)가 아니라 **이 요청을 한 사람의 학교** 부별공유입니다.

### -1단계 — 내 계정으로 복사하기

지금 폴더가 이미 사람 자신의 저장소면 건너뜁니다. 원본 주소만 받은 상태라면 사람에게 포크를 시키지 말고 직접 하세요.

1. `gh auth status` 로 GitHub CLI 로그인을 확인합니다.
2. 새 저장소 이름을 물어봅니다. 정하기 어려워하면 `school-sharing` 을 제안합니다.
3. `gh repo fork https://github.com/cando8442/school-work-links --fork-name <정한 이름> --clone` 으로 포크하고 그 폴더로 이동합니다.
4. `package.json` 의 `name`, `homepage`, `repository.url` 을 새 저장소에 맞게 고칩니다.

### 0단계 — 물어볼 것 다섯 가지

하나씩 순서대로 물어보세요.

1. 학교 이름 (예: 서울○○고등학교)
2. 학교 구글 도메인 (예: `abc.sen.hs.kr`) — 교사 계정 주소의 @ 뒤 부분
3. 최초 관리자로 쓸 학교 계정 주소 (권한을 나눠 줄 사람)
4. 학교 로고 그림 파일 (없으면 글자만 쓰겠다고 안내)
5. 부서 이름 목록 (예: 교감, 교무행정부, 교육과정부, 1~3학년부)

업무분장 내용은 지금 받지 마세요. 사이트를 띄운 뒤 각 부장이 화면에서 직접 적는 것이 이 도구의 사용법입니다.

### 1단계 — 코드 고치기

**`src/config/school.ts`** — 학교별 설정이 전부 여기 있습니다.

```ts
name: "받은 학교 이름",
domain: "받은 도메인",
ownerEmail: "받은 관리자 주소",
logo: "/assets/school-logo.png",   // 그림이 없으면 ""
dormsUrl: ""                        // 도름스 활동 링크가 있으면 넣기
```

**`src/config/departments.ts`** — 지금 들어 있는 서울세종고 업무분장은 **예시**입니다. 받은 부서 이름으로 `departments` 배열을 새로 짜고, 각 부서의 `duties` 는 빈 배열로 두세요. 내용은 부장들이 화면에서 채웁니다. `notices` 는 빈 배열 그대로 둡니다.

**`firestore.rules`** — 맨 위 두 곳을 고칩니다. 화면이 아니라 서버에서 막는 부분이라 반드시 같이 고쳐야 합니다.

```
// 1) schoolAccount() 안의 도메인
request.auth.token.email.matches('.*@abc[.]sen[.]hs[.]kr$')
// 점은 [.] 로 씁니다.

// 2) isOwner() 안의 관리자 주소
request.auth.token.email == 'teacher@abc.sen.hs.kr'
```

**로고와 아이콘** — 받은 그림을 `public/assets/school-logo.png` 로 넣고, 학교 문장으로 `public/favicon.ico`, `public/assets/icon-192.png`, `public/assets/icon-512.png` 를 만듭니다. 없으면 `src/config/school.ts` 의 `logo` 를 `""` 로 둡니다.

### 2단계 — 파이어베이스 만들기 (사람이 로그인해야 하는 부분)

사람에게 학교 계정으로 https://console.firebase.google.com 에 로그인하게 한 뒤, 브라우저를 조종할 수 있으면 직접, 아니면 순서를 안내하세요.

1. 프로젝트 만들기 (이름 예: `학교약칭-sharing`)
2. Authentication → 시작하기 → **Google** 사용 설정 → 지원 이메일에 학교 계정 선택
3. Authentication → 설정 → 승인된 도메인에 배포 주소 추가 (예: `myschool-sharing.netlify.app`)
4. Firestore Database → 만들기 → 위치 **asia-northeast3(서울)** → 프로덕션 모드
5. Firestore → 규칙 탭에 `firestore.rules` 내용을 붙여넣고 **게시**
6. 프로젝트 설정 → 웹 앱 추가 → `firebaseConfig` 값 6개 복사

### 3단계 — 배포 (넷리파이를 권합니다)

깃허브 페이지는 보안 헤더를 넣을 수 없어 점검 점수가 낮게 나옵니다. 넷리파이를 쓰세요.

1. https://app.netlify.com 에서 **학교 계정으로** 가입
2. 저장소 연결 (빌드 설정은 `netlify.toml` 이 알아서 잡습니다)
3. 환경변수에 파이어베이스 값 6개를 넣습니다.

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

4. 사이트 이름을 알아보기 쉬운 것으로 바꾸고, 프로젝트 공개 범위를 **Public** 으로 둡니다. 사이트 자체가 학교 계정 로그인을 요구하므로 내용은 보호됩니다.
5. 배포 후 그 주소를 2단계 3번의 승인된 도메인에 넣습니다.

### 4단계 — 확인하고 알려주기

1. `npm run build` 로 오류가 없는지 봅니다.
2. 배포 주소에서 학교 계정으로 로그인되는지 확인합니다.
3. 마지막 메시지로 완성된 주소를 알려 줍니다.

### 하지 말아야 할 것

- 학생 개인정보, 사안 기록, 대외비 문서를 코드나 화면 글에 적지 마세요. 자료는 구글 드라이브에 두고 **링크만** 겁니다.
- 파이어베이스 프로젝트를 대신 만들거나 계정에 로그인하려 하지 마세요. 사람이 해야 합니다.
- 서울세종고의 업무분장 예시를 그대로 두지 마세요. 다른 학교 것입니다.

---

## 이 도구로 할 수 있는 일

- 부서 탭마다 업무분장을 두고, 각 업무의 반복 업무·처리 절차·인수인계 메모·서식을 봅니다
- 마감을 달력과 목록으로 보고, 항목을 펼쳐 제출용 구글 시트로 바로 들어갑니다
- 제출 현황을 과목명·동아리명 단위로 표시해 누가 냈는지 한눈에 봅니다
- 연간학사일정과 금주의 일정표 PDF 를 읽어 일정 초안을 만듭니다
- 학교 구글 계정만 로그인할 수 있고, 편집 권한은 부장에게만 줍니다

## 권한 구조

| 하는 일 | 누가 |
| --- | --- |
| 보기 | 학교 계정으로 로그인한 모든 사람 |
| 제출 완료 표시, 제출 과제 만들기, 글쓰기 | 학교 계정 누구나 |
| 업무분장·서식·공유 드라이브 링크 | 권한을 받은 사람 |
| 권한 주고 빼기 | `school.ts` 의 관리자 한 명 |
