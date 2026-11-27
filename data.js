// 팀원 정보
const members = [
  {
    id: "m1",
    name: "이진우",
    role: "조장",
    tasks:
      "공통 예외·인터셉터, 회원가입·로그인·마이페이지, 전체 화면 디자인, 관리자 화면, 다국어 지원, AWS 배포, PR 검토·Merge",
  },
  {
    id: "m2",
    name: "한승환",
    role: "부조장",
    tasks:
      "공통 엔티티 설계, 포인트 충전, 참가비·보증금 결제, 환불, 회차 자동 상태 변경",
  },
  {
    id: "m3",
    name: "정윤아",
    role: "팀원",
    tasks: "행사 등록·수정, 회차, 카테고리, 대표 이미지, 회차 취소 신청, 후기",
  },
  {
    id: "m4",
    name: "김도현",
    role: "팀원",
    tasks:
      "참가 신청·정원 동시성·대기자 승격, 신청 내역, 커뮤니티, 기업 거절, QR 출석, 통합 테스트, 설계 문서·Wiki",
  },
  {
    id: "m5",
    name: "구도하",
    role: "팀원",
    tasks:
      "기업 가입·정보 수정, 사업자 진위 확인, 기업 심사, 보증금 상태 표시, 포인트·보증금 내역, 가입·로그인 비밀번호 검사",
  },
];

// 공개 문서
const cases = [
  {
    id: "case-001",
    memberId: "m1",
    title: "AI 번역 API 호출 최적화 및 핵심 트랜잭션 분리",
    category: "Internationalization",
    tags: ["Gemini", "AFTER_COMMIT", "Cache"],
    background:
      "부산 문화행사 플랫폼에서 외국인 사용자에게 기업이 직접 입력하는 행사 제목과 소개를 제공하기 위해 동적 콘텐츠 번역을 설계했다. 정적 메시지 파일만으로는 등록·수정되는 콘텐츠를 처리할 수 없었다. 자연스러운 행사 소개 번역을 목표로 Gemini API를 선택했으며, 번역 품질의 우위 자체를 정량 검증한 것은 아니다. 제한된 API 사용량 안에서 기존 행사 공개 및 보증금 결제 흐름을 유지하는 것이 핵심 요구사항이었다.\n\n번역 대상은 기업이 입력하는 행사 콘텐츠이며, 정적 UI 번역과 별개로 관리한다. 초기 요구사항은 영어 기본 지원과 일본어·중국어의 필요 시 번역이었다. API 키는 환경 설정으로 분리하고 모델 변경을 코드 수정 없이 처리할 수 있도록 구성했다.",
    symptoms:
      "실제 오류: 최초 행사 ID 2 영어 번역 요청에서 HTTP 404 MODEL_INVALID가 발생했다.\n설계상 위험: 조회마다 외부 API를 호출하면 동일 콘텐츠의 반복 번역, 응답 지연 및 사용량 증가가 발생할 수 있다. 행사 저장 트랜잭션 안에서 외부 호출을 수행하면 번역 장애가 핵심 처리에 영향을 줄 수 있다. 이 위험들은 운영 장애로 측정된 것이 아니라 설계 단계에서 발견한 문제다.",
    analysis:
      "먼저 모델 설정을 변경하여 동일한 번역 요청을 재검증했다. 이후 번역 시점과 조회 시점을 분리하는 구조를 검토했다. 기존 번역이 있더라도 원문 수정 이후에는 오래된 결과가 될 수 있으므로 원본 해시를 기준으로 유효성을 판단할 필요가 있었다. 또한 공개 행사 목록에서 행사별로 번역을 조회하면 DB 조회가 반복될 수 있어 일괄 조회 구조를 고려했다. 번역은 표시용 데이터이므로 관리되는 Event 엔티티에 덮어쓰지 않고 응답 DTO에만 반영해야 했다.\n\n번역 요청 등록과 실제 API 호출을 구분했다. 커밋 전에 번역 작업을 등록하면 행사 저장 실패에도 작업이 남을 수 있으며, 외부 호출을 트랜잭션 안에서 기다리면 DB 자원 점유가 길어질 수 있다. 원문 해시는 수정 이전 번역을 그대로 표시하지 않기 위한 유효성 기준이며, 번역 누락은 원문 표시로 처리한다.",
    alternatives:
      "1. 조회 시마다 실시간 번역: 구현은 단순하지만 요청마다 외부 API에 의존한다.\n2. 모든 언어 사전 번역: 조회 시 지연을 줄일 수 있으나 실제 사용되지 않는 언어에도 호출이 발생한다.\n3. 언어별 요청 시점과 DB 재사용을 결합: 영어는 공개·변경 후 요청하고 일본어·중국어는 최초 조회 시 요청한다. 초기 조회에 원문이 표시될 수 있지만 불필요한 호출을 줄일 수 있다.\n핵심 저장 처리와 번역 요청은 같은 트랜잭션에 묶는 대신 커밋 이후 요청을 등록하는 방향을 선택했다.\n\n| 방식 | 장점 | 한계 |\n| --- | --- | --- |\n| 매 조회 번역 | 항상 최신 원문 기준 | 반복 호출·외부 응답 대기 |\n| 전체 사전 번역 | 조회 시 번역 준비 가능 | 미사용 언어까지 비용 발생 |\n| 언어별 요청 + DB 재사용 | 호출 시점과 재사용 제어 | 첫 조회 원문 노출 가능 |",
    decision:
      "Event 저장·수정 생명주기에서 번역 요청 이벤트를 연결하고 AFTER_COMMIT 이후 요청을 등록하도록 구성했다. 번역 저장소는 REQUIRES_NEW를 이용한 별도 트랜잭션으로 분리하여 저장 오류가 기존 핵심 처리에 영향을 주는 범위를 줄였다. 조회에서는 원본 해시와 일치하는 번역을 우선 사용하고 목록은 일괄 조회하며, 번역 결과는 DTO에만 반영한다. 번역이 없거나 처리 중 오류가 발생하면 원문을 반환한다. 영어 선요청과 일본어·중국어 지연 요청을 결합해 사용량과 사용자 경험 사이의 균형을 고려했다. AFTER_COMMIT 자체가 비동기 실행을 보장하는 것은 아니며, 실제 번역 처리는 별도 워커 구조로 구분했다.\n\n| 구성 요소 | 책임 |\n| --- | --- |\n| EventTranslationLifecycle | 행사 저장·수정 감지 |\n| EventTranslationAfterCommit | 커밋 이후 번역 요청 등록 |\n| EventTranslationStore | 별도 트랜잭션에서 번역 저장·일괄 조회 |\n| EventTranslationPresentation | 공개 행사 조회 DTO에 번역 반영 및 원문 fallback |\n\n핵심 트랜잭션과 번역의 성공 조건을 구분했다. 행사 공개나 보증금 결제는 번역 성공을 전제로 하지 않는다. 별도 저장 트랜잭션은 DB 오류의 영향을 제한하지만, 커밋 후 작업 등록 실패까지 자동 복구하는 것은 아니다.",
    beforeCode:
      "// 검토했던 초기 방식 (의사 코드, 실제 변경 전 소스 아님)\n행사 조회 → 외부 번역 API 호출 → 번역 응답 반환",
    afterCode:
      "// 최종 구조 요약 (의사 코드)\n행사 저장·변경 → 핵심 트랜잭션 커밋\n→ AFTER_COMMIT → 번역 요청 등록\n워커 → Gemini 호출 → 번역 저장\n행사 조회 → 원본 해시 기준 번역 일괄 조회\n→ 유효한 번역은 DTO에 반영\n→ 번역 없음 또는 실패 시 원문 반환",
    verification:
      "최초 모델 호출 404 이후 모델 설정을 변경하여 HTTP 200을 확인했다. 행사 ID 2의 영어 번역 성공 호출 1회, DB 저장 및 동일 번역 재조회 시 추가 호출 0회를 확인했다. 관련 구현 기록에는 번역 관련 핵심 테스트 14개에 대한 기록이 있다. 이는 특정 행사에 대한 기능 검증이며 전체 서비스의 응답 시간이나 비용 절감률을 측정한 결과는 아니다.\n\n| 검증 항목 | 관찰 결과 |\n| --- | --- |\n| 최초 모델 요청 | HTTP 404 MODEL_INVALID |\n| 모델 변경 후 | HTTP 200 |\n| 행사 ID 2 영어 번역 | 성공 호출 1회 및 DB 저장 |\n| 동일 번역 재조회 | 추가 API 호출 0회 |\n| 핵심 테스트 | 14개 기록; 이번 문서에서 재실행하지 않음 |",
    limitations:
      "자동 번역 워커는 기본 비활성화 상태이므로 지속적인 운영 번역이 검증된 것은 아니다. 대량 행사에 대한 부하 테스트, 언어별 번역 품질 평가, 재시도·실패 작업 관리 및 API 사용량 모니터링이 필요하다. 커밋 이후 요청 등록이 실패하는 경우에 대비한 재처리 정책도 개선 대상으로 남아 있다.\n\n배운 점: 외부 API 연동은 호출 성공 여부뿐 아니라 핵심 도메인과의 실패 경계, 재사용 기준, 재처리 정책을 함께 설계해야 한다.",
    draft: false,
    featured: true,
    summary:
      "번역 결과를 DB에 저장·재사용하고 핵심 커밋 이후 요청을 등록하여 외부 API 의존성을 분리했다.",
  },
  {
    id: "case-002",
    memberId: "m1",
    title: "정적 UI와 동적 콘텐츠의 다국어 지원 설계",
    category: "Internationalization",
    tags: ["MessageSource", "Locale", "Cookie"],
    background:
      "비회원도 행사 탐색이 가능한 SSR 플랫폼에서 한국어·영어·일본어·중국어를 지원하고자 했다. 메뉴와 버튼은 고정된 문구지만 행사 제목과 소개는 기업이 입력하는 가변 데이터이므로 두 종류를 동일한 방식으로 번역하는 것은 적절하지 않았다.",
    symptoms:
      "Mustache 템플릿과 JavaScript에 한국어 문구가 분산되어 있었다. 단순히 화면 일부만 번역하면 동적 버튼, 안내 메시지 등에서 언어가 혼재할 수 있었다. 비로그인 상태에서 선택한 언어가 회원가입·로그인·로그아웃 과정에서 초기화되지 않도록 하는 것도 요구사항이었다. 이는 구현 전 확인한 구조적 문제와 요구사항이다.",
    analysis:
      "기존 Mustache 파일 80개와 정적 JS 파일 10개를 조사했고, 문구 번역 대상은 템플릿 58개와 JS 8개로 정리했다. 고정 UI는 메시지 키로 치환하고 동적 행사 콘텐츠는 별도 번역 저장소에서 조회하는 책임 분리가 필요했다. 비회원은 DB 사용자 설정이 없으므로 쿠키가 필요하며 회원가입과 로그인 시에는 사용자 설정과 쿠키를 연동해야 했다. 언어 선택 이후 기존 페이지로 돌아가는 흐름과 요청 검증도 고려했다.\n\n| 조사 대상 | 전체 | 번역 대상 |\n| --- | --- | --- |\n| Mustache | 80 | 58 |\n| 정적 JavaScript | 10 | 8 |\n| 합계 | 90 | 66 |\n\n고정 문구와 기업 입력 데이터를 구분한 뒤, 화면에서 사용하는 메시지와 JS 안내 문구를 함께 관리하는 구조를 선택했다.",
    alternatives:
      "1. 모든 문구를 AI로 실시간 번역: 고정 문구에도 반복 호출이 발생하고 UI 표현의 일관성을 관리하기 어렵다.\n2. 메시지 파일만 사용: 고정 문구에는 적합하지만 기업이 입력하는 콘텐츠에는 대응하기 어렵다.\n3. MessageSource와 AI 번역 분리: 정적 UI는 사전 번역으로 일관성을 확보하고 가변 콘텐츠에만 AI를 사용한다.\n\n| 방식 | 장점 | 한계 |\n| --- | --- | --- |\n| 전체 AI 번역 | 가변 데이터 대응 | 고정 UI 반복 호출 및 표현 불일치 |\n| 메시지 파일만 | 일관된 고정 UI | 동적 콘텐츠 대응 불가 |\n| 혼합 구조 | 책임별 최적화 | 두 번역 경로 관리 필요 |",
    decision:
      "Spring MessageSource를 기반으로 4개 언어의 메시지 리소스를 구성하고 Mustache와 JS에서 공통 메시지를 사용할 수 있도록 연결했다. Locale 쿠키를 통해 비회원 언어 선택을 유지하고 회원가입 시 언어 설정을 저장하며 로그인 시 설정을 동기화했다. 로그아웃 이후에도 쿠키 기반 언어 선택은 유지하도록 했다. 동적 행사 콘텐츠 번역은 별도 저장소와 표시용 DTO에서 처리하여 UI 번역과 분리했다.\n\n| 사용자 상태 | 언어 처리 |\n| --- | --- |\n| 최초 방문 | 언어 선택 UI 및 Locale 쿠키 |\n| 비회원 재방문 | 쿠키 기반 선택 유지 |\n| 회원가입 | 선택 언어를 회원 설정에 저장 |\n| 로그인 | 회원 설정과 쿠키 동기화 |\n| 로그아웃 | 언어 쿠키 유지 |\n\nLocaleCookieResolver는 언어 선택을 쿠키로 관리한다. 쿠키의 보안 속성 및 복귀 URL 검증도 고려했다. 메시지 리소스와 동적 번역 저장소를 분리하여 한쪽의 변경이 다른 쪽의 저장 구조를 변경하지 않도록 했다.",
    beforeCode:
      "<!-- 설명용 예시: 고정 한국어 문구 -->\n<button>로그인</button>",
    afterCode:
      "// 설명용 구조 (실제 템플릿 키 및 문법을 그대로 옮긴 것은 아님)\n메시지 키 + 현재 Locale → MessageSource → 언어별 UI 문구\n비회원 언어 선택 → Locale 쿠키\n회원가입·로그인 → 회원 언어 설정 연동\n행사 콘텐츠 → 별도 번역 저장소",
    verification:
      "정적 UI 4개 언어, 1,524개 메시지 키 구성 기록을 확인했다. 초기 언어 선택, 회원가입 저장, 로그인 동기화, 로그아웃 유지, 요청 검증 및 복귀 URL 관련 초기 단계 테스트 38개 기록이 있다. 모든 번역 문구의 자연스러움이나 전체 화면의 언어별 표시를 정량 평가한 것은 아니다.\n\n| 항목 | 기록 |\n| --- | --- |\n| 지원 언어 | 한국어·영어·일본어·중국어 |\n| 메시지 키 | 1,524개 |\n| 초기 단계 테스트 | 38개 |\n| 공통 전달 구성 | Mustache·JS 각 1개 추가 |",
    limitations:
      "메시지 키 누락과 언어별 표현 품질을 지속적으로 점검해야 한다. 언어별 문자열 길이에 따른 UI 깨짐 및 접근성 검증, 번역 리소스 변경 시 누락 키 자동 검사 등을 추가할 수 있다.\n\n배운 점: 국제화는 문자열 치환만이 아니라 사용자 상태 변화와 데이터의 생명주기를 함께 다루는 설계 문제다.",
    draft: false,
    featured: false,
    summary:
      "정적 메시지와 동적 콘텐츠의 번역 책임을 분리하고 로그인 전후 언어 설정을 유지했다.",
  },
  {
    id: "case-003",
    memberId: "m1",
    title: "HTTPS 로그인 리다이렉트 오류",
    category: "Infrastructure",
    tags: ["Nginx", "TLS", "Spring Boot"],
    background:
      "AWS EC2 Ubuntu에 Spring Boot 애플리케이션을 Docker로 실행하고 Nginx 리버스 프록시를 연결했다. DuckDNS 도메인과 Certbot 인증서를 사용해 HTTPS 접속 환경을 구성했다. 로컬 HTTP 환경에서 정상 동작하던 로그인 기능을 배포 환경에서도 검증하는 과정에서 문제가 발생했다.",
    symptoms:
      "HTTPS 페이지에서 로그인 요청을 보내면 모달의 응답 처리 과정에서 오류가 발생했다. 그러나 새로고침하면 이미 로그인된 상태로 표시되었다. 실제 로그인 응답은 302였으며 Location 헤더가 HTTPS가 아닌 HTTP 주소를 가리켰다.",
    analysis:
      "새로고침 이후 로그인 상태가 유지되는 점을 근거로 인증 실패보다 인증 성공 이후 응답 처리 문제를 의심했다. 실제 HTTP 응답의 Location을 확인해 프로토콜 불일치를 발견했다. 배포 구조에서는 브라우저와 Nginx 사이의 TLS 연결이 Nginx에서 종료되고, Nginx는 내부 Spring Boot에 HTTP로 요청을 전달한다. 애플리케이션이 내부 요청 정보만 기준으로 리다이렉트 URL을 생성하면 외부 사용자의 HTTPS 요청을 반영하지 못한다.\n\n요청 흐름: 브라우저(HTTPS) → Nginx(TLS 종료) → Docker 내부 Spring Boot(HTTP) → 302 응답 → 브라우저. 내부 HTTP 연결 자체는 정상이며, 외부 요청의 프로토콜 정보가 리다이렉트 생성에 반영되지 않는 것이 문제였다. 로그인 상태가 유지되는 증상과 Location 헤더를 함께 확인해 인증 로직을 불필요하게 변경하지 않았다.",
    alternatives:
      "1. 컨트롤러마다 HTTPS URL을 직접 지정: 특정 오류는 우회할 수 있지만 다른 리다이렉트에도 동일 수정이 필요할 수 있고 환경별 주소 의존성이 생긴다.\n2. Nginx에서 원래 요청 정보를 전달하고 Spring Boot가 이를 해석하도록 설정: 공통 프록시 환경의 문제를 애플리케이션 설정 수준에서 해결할 수 있다.\n\n| 방식 | 장점 | 한계 |\n| --- | --- | --- |\n| HTTPS 주소 직접 지정 | 해당 화면 빠른 우회 | 환경별 주소 의존·다른 경로 반복 수정 |\n| 프록시 헤더 공통 설정 | 원래 요청 정보 복원 | 신뢰 경계 설정 필요 |",
    decision:
      "Nginx에서 Host, X-Forwarded-Proto, X-Forwarded-For 정보를 전달하고 Spring Boot의 server.forward-headers-strategy를 framework로 설정하는 방향을 적용했다. 개별 인증 컨트롤러를 수정하는 대신 원래 요청의 프로토콜을 공통으로 인식하도록 구성했다.",
    beforeCode:
      "// 실제 확인한 응답 요약\nPOST https://busan-play.duckdns.org/login\n302 Found\nLocation: http://busan-play.duckdns.org/",
    afterCode:
      "# Nginx 설정 핵심 부분\nproxy_set_header Host $host;\nproxy_set_header X-Forwarded-Proto $scheme;\nproxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\n# Spring Boot application 설정\nserver:\n  forward-headers-strategy: framework",
    verification:
      "실제 로그인 요청의 302 응답 및 HTTP Location 헤더를 확인하여 원인을 특정했다. 새로고침 시 세션이 유지되는 증상도 확인했다. 프록시 헤더와 Spring 설정을 적용했으며, 최종 브라우저 회귀 테스트의 응답 캡처는 별도 첨부가 필요하다.\n\n| 관찰 | 판단 |\n| --- | --- |\n| 로그인 후 모달 오류 | 응답 처리 문제 의심 |\n| 새로고침 후 로그인 유지 | 세션 생성 확인 |\n| 302 Location: http://… | 프로토콜 불일치 확인 |\n| 설정 적용 후 최종 응답 캡처 | 별도 확인 필요 |",
    limitations:
      "Forwarded Header는 신뢰할 수 있는 프록시에서 전달된 정보만 사용하도록 구성해야 한다. 애플리케이션 포트 직접 접근 제한과 헤더 덮어쓰기 정책을 검토하고 로그인·로그아웃 등 전체 리다이렉트 흐름을 재검증할 필요가 있다.\n\n배운 점: 배포 환경에서 발생한 인증 증상도 애플리케이션 코드만의 문제가 아닐 수 있다. 프록시와 브라우저 사이의 실제 HTTP 응답을 먼저 확인하는 것이 중요하다.",
    draft: false,
    featured: false,
    summary:
      "프록시 헤더와 Spring 설정으로 원래 HTTPS 요청 정보를 인식하도록 했다.",
  },
  {
    id: "case-004",
    memberId: "m1",
    title: "공통 파일 업로드 모듈 설계 및 파일·DB 정합성 확보",
    category: "Backend",
    tags: ["FileStorage", "UUID", "Transaction"],
    background:
      "기업 회원가입에서 사업자등록증 등 파일을 저장해야 했다. 각 도메인이 저장 경로와 검증 정책을 직접 관리하면 중복 코드와 정책 불일치가 생길 수 있으므로 공통 저장 모듈을 설계했다. 파일 저장과 기업 정보 저장이 서로 다른 자원을 사용한다는 점도 고려했다.",
    symptoms:
      "설계 단계에서 발견한 위험은 확장자를 위장한 파일, 사용자 파일명을 이용한 경로 조작, 과도한 파일 크기, DB 저장 또는 커밋 실패 이후 남는 파일이었다. 실제 운영 장애나 보안 침해가 발생했다는 기록은 아니다.",
    analysis:
      "파일 시스템에 기록된 파일은 JPA 또는 DB 트랜잭션이 롤백되어도 자동으로 제거되지 않는다. 따라서 파일 저장 이후 기업 정보 저장이 실패하면 별도 정리 처리가 필요하다. 또한 파일명과 확장자만으로 실제 형식을 보장할 수 없고, 요청에서 전달된 크기 정보만으로 실제 저장량을 제한하기 어렵다. 저장 경로 정규화와 심볼릭 링크 검사도 필요했다.",
    alternatives:
      "1. 도메인별 파일 저장 구현: 초기 구현은 간단하지만 검증 정책과 저장 방식 변경이 여러 곳에 영향을 준다.\n2. DB에 바이너리 직접 저장: 파일과 메타데이터를 함께 관리할 수 있으나 DB 용량과 조회 특성을 고려해야 한다.\n3. 공통 저장 인터페이스와 로컬 파일 저장: 도메인은 저장 키를 관리하고 저장 정책은 모듈에 집중시킬 수 있다. 다만 DB 실패 시 파일 정리 처리가 별도로 필요하다.\n\n| 방식 | 장점 | 한계 |\n| --- | --- | --- |\n| 도메인별 저장 | 초기 구현 단순 | 검증 정책 중복 |\n| DB 바이너리 | DB 트랜잭션 활용 가능 | DB 용량·조회 부담 고려 |\n| 공통 저장 모듈 | 저장 책임 분리·교체 가능 | 파일 정리 보상 필요 |",
    decision:
      "FileStorage 인터페이스와 LocalFileStorage 구현체, FileValidator로 저장 및 검증 책임을 분리했다. PDF/JPEG/PNG 허용, 파일 시그니처 확인, 실제 읽은 바이트 크기 제한, UUID 저장 키 생성, 경로 정규화 및 심볼릭 링크 검사를 적용했다. 기업 정보에는 저장 키를 관리하며 DB 저장 또는 커밋 실패 시 이미 저장한 파일을 정리하는 보상 처리를 구성했다. 향후 외부 스토리지 구현체로 전환할 때 도메인 변경 범위를 줄일 수 있도록 했다.\n\n| 검증·처리 | 목적 |\n| --- | --- |\n| PDF/JPEG/PNG 시그니처 | 확장자 위장 위험 감소 |\n| 실제 바이트 제한 | 과도한 저장량 방지 |\n| UUID 저장 키 | 원본 파일명 충돌 방지 |\n| 경로 정규화·심볼릭 링크 검사 | 저장 경로 이탈 위험 감소 |\n| DB 실패 시 정리 | 고아 파일 발생 위험 감소 |\n\n도메인은 저장 키를 참조하고 저장 구현은 인터페이스 뒤에 둔다. 파일 저장 성공 후 DB 커밋 실패까지 고려해야 하므로 단순히 save 호출의 예외만 처리하는 것으로는 충분하지 않다.",
    beforeCode:
      "// 설계 비교용 의사 코드 (실제 기존 소스 아님)\n파일 저장 → 기업 정보 DB 저장\n// DB 실패 시 파일이 남을 수 있음",
    afterCode:
      "// 구현 구조 요약 (의사 코드)\nFileValidator → 형식·시그니처·크기 검증\nFileStorage / LocalFileStorage → UUID 저장 키 생성 및 저장\n기업 정보 DB 저장 → 저장 키 관리\nDB 저장·커밋 실패 → 저장 파일 정리",
    verification:
      "관련 구현 기록에서 PDF/JPEG/PNG 허용, 파일 10MB·요청 12MB 제한, 실제 바이트 제한, 경로 검증 및 실패 정리 로직을 확인했다. 이번 문서 작성 과정에서 테스트를 재실행하지 않았으며 실제 장애 상황에서의 정리 성공률을 측정한 것은 아니다.\n\n| 항목 | 구현 기록 |\n| --- | --- |\n| 허용 형식 | PDF/JPEG/PNG |\n| 파일 크기 | 10MB |\n| 요청 크기 | 12MB |\n| 저장 키 | UUID |\n| 실패 정리 | DB 저장·커밋 실패 시 보상 처리 |",
    limitations:
      "프로세스 강제 종료 또는 파일 삭제 실패 시 고아 파일이 남을 수 있다. 파일과 DB 간 완전한 원자성을 보장하는 구조는 아니므로 정기적인 고아 파일 정리, 삭제 실패 재처리 및 외부 스토리지 전환을 검토할 수 있다. 파일 시그니처 검증만으로 악성 파일 여부를 완전히 판단할 수는 없다.\n\n배운 점: 서로 다른 저장 자원에 대한 정합성은 DB 트랜잭션만으로 해결되지 않는다. 보상 처리와 실패 이후 복구 정책을 함께 고려해야 한다.",
    draft: false,
    featured: false,
    summary:
      "파일 검증 및 저장 책임을 분리하고 DB 저장 실패 시 파일을 정리했다.",
  },
  {
    id: "case-013",
    memberId: "m1",
    title: "개인·기업·관리자 인증 및 인가 구조 설계",
    category: "Security",
    tags: ["HttpSession", "BCrypt", "Interceptor", "Authorization"],
    draft: false,
    featured: false,
    summary:
      "SSR 환경에서 공통 로그인 식별자와 역할별 인터셉터를 구성하여 인증 상태와 접근 권한을 구분했다.",
    background:
      "개인과 기업은 서로 다른 가입·로그인 흐름을 가지며 관리자는 별도 권한이 필요했다. Mustache 기반 SSR 환경과 개발 일정을 고려해 인증 체계를 선정했다.",
    symptoms:
      "설계 단계에서 확인한 위험: 로그인 유형이 바뀔 때 기존 세션 정보가 남거나, 로그인 여부만 확인하여 관리자·기업 전용 경로에 잘못 접근할 수 있다. 세션 고정 공격과 평문 비밀번호 저장 위험도 고려했다. 실제 침해가 발생했다는 기록은 없다.",
    analysis:
      "인증은 사용자가 누구인지 확인하는 과정이고 인가는 해당 기능에 접근할 권한이 있는지 판단하는 과정이다. 개인·기업의 세션 정보를 별도로 유지하더라도 공통 식별자가 없으면 접근 검사마다 분기가 늘어난다. 기업은 승인 상태도 검사해야 한다. 로그인 성공 후 세션 ID 변경과 기존 로그인 유형 정리가 필요했다.",
    alternatives:
      "| 방식 | 장점 | 판단 |\n| --- | --- | --- |\n| JWT | 토큰 기반 인증 | SSR에서 토큰 관리 및 폐기 정책 추가 필요 |\n| Spring Security 전체 도입 | 표준 필터·보안 기능 | 기존 구조 통합 및 일정 고려로 보류 |\n| HttpSession + 인터셉터 | SSR과 기존 흐름에 적합 | 직접 관리할 보안 정책 증가 |",
    decision:
      "HttpSession을 유지하고 BCrypt로 비밀번호를 검증한다. LoginIdentity 및 LoginSession으로 공통 로그인 식별자를 관리하고 개인·기업 로그인 유형을 구분한다. 로그인 성공 시 세션 ID를 변경하고 이전 유형 정보를 정리한다. 인터셉터는 인증 여부와 역할별 접근 조건을 검사한다. 기업 로그인은 승인된 상태인지 확인한다.\n\n| 조건 | 처리 |\n| --- | --- |\n| 미인증 | 401 |\n| 권한 부족 | 403 |\n| 개인·기업 로그인 전환 | 이전 유형 정보 정리 |\n| 로그인 성공 | 세션 ID 변경 |",
    beforeCode:
      "// 설계 비교용 의사 코드 (실제 변경 전 코드 아님)\n로그인 여부만 확인 → 기능 접근\n// 역할 및 로그인 유형별 검증이 별도로 필요",
    afterCode:
      "// 구현 흐름 요약 (의사 코드)\n이메일 조회 → BCrypt 검증 → 계정 상태 검사\n→ 세션 ID 변경 → 공통 LoginIdentity 저장\n→ 인터셉터에서 인증·역할 검사",
    verification:
      "개발 기록에서 잘못된 로그인 시 401 및 세션 미생성, H2 회원가입과 헤더 이름 표시, BCrypt 더미 계정 5개 검증을 확인했다. 초기 인터셉터 구현 시 역할별 접근 검증은 추가 과제로 남아 있었다. 이번 문서에서 테스트를 재실행하지 않았다.",
    limitations:
      "세션 방식 자체가 모든 보안 문제를 해결하지는 않는다. CSRF, 세션 만료, 접근 경로 누락, 쿠키 보안 속성 및 다중 서버 세션 공유 정책을 검토해야 한다. 배운 점: 인증과 인가를 구분하고 공통 식별자와 접근 정책을 일관되게 관리해야 한다.",
  },
  {
    id: "case-014",
    memberId: "m1",
    title: "전역 예외 처리 및 HTTP 상태별 오류 응답 표준화",
    category: "Backend",
    tags: ["GlobalExceptionHandler", "Spring MVC", "Mustache", "HTTP Status"],
    draft: false,
    featured: false,
    summary:
      "예외 처리 책임을 공통화하고 HTTP 상태에 맞는 오류 화면을 제공하도록 구성했다.",
    background:
      "5인 팀이 각 도메인을 개발하면서 예외 응답과 오류 화면의 일관성이 필요했다. SSR 서비스에서는 브라우저가 이해할 수 있는 오류 화면과 실제 HTTP 상태를 함께 제공해야 했다.",
    symptoms:
      "설계 단계에서 발견한 문제: 도메인별로 예외 처리 방식이 달라지면 같은 실패에도 다른 응답이 발생할 수 있다. 오류 화면만 표시하고 상태 코드가 정상 응답이면 클라이언트와 운영자가 실패를 구분하기 어렵다.",
    analysis:
      "예외를 발생시키는 도메인 로직과 사용자에게 응답하는 MVC 계층의 책임을 분리했다. 잘못된 요청, 미인증, 권한 부족, 없는 리소스, 지원하지 않는 메서드, 예상하지 못한 서버 오류를 구분해야 했다. 내부 오류 정보와 사용자 안내도 구분할 필요가 있었다.",
    alternatives:
      "| 방식 | 장점 | 한계 |\n| --- | --- | --- |\n| 컨트롤러별 try-catch | 개별 제어 | 중복 및 정책 불일치 |\n| 기본 오류 화면 | 구현 부담 적음 | 서비스 UI와 안내 통일 어려움 |\n| 전역 예외 처리 | 공통 정책 및 상태 관리 | 예외 매핑과 응답 유형 관리 필요 |",
    decision:
      "GlobalExceptionHandler를 통해 예외를 HTTP 상태와 Mustache 오류 화면으로 연결했다. ModelAndView에 상태를 지정하고 공통 오류 화면을 구성했다. 서버 오류는 로그로 확인할 수 있도록 처리했다.\n\n| 상태 | 의미 |\n| --- | --- |\n| 400 | 잘못된 요청 |\n| 401 | 인증 필요 |\n| 403 | 권한 부족 |\n| 404 | 리소스 없음 |\n| 405 | 지원하지 않는 HTTP 메서드 |\n| 500 | 서버 내부 오류 |",
    beforeCode:
      "// 설계 비교용 의사 코드\n각 컨트롤러에서 개별 예외 처리 → 개별 오류 응답",
    afterCode:
      "// 구현 구조 요약 (의사 코드)\n도메인 예외 발생 → GlobalExceptionHandler\n→ HTTP 상태 지정 → Mustache 오류 화면 반환\n→ 서버 오류 로그 기록",
    verification:
      "초기 개발 기록에서 Gradle 테스트 성공 및 H2 환경(포트 18080)의 상태별 오류 화면 확인 기록이 있다. 당시 예상하지 못한 예외와 일부 경로는 추가 검증 대상으로 남았다. 이번 문서 작성 시 재실행하지 않았다.",
    limitations:
      "HTML 화면과 JSON API의 오류 계약을 구분하고, 예외별 상태 코드와 민감 정보 노출 여부를 자동 테스트로 검증할 필요가 있다. 배운 점: 예외 처리는 단순 화면 꾸미기가 아니라 서비스 전체의 응답 계약을 정하는 작업이다.",
  },
  {
    id: "case-015",
    memberId: "m1",
    title: "회차 취소 승인 시 환불 데이터 누락으로 발생한 404 및 롤백",
    category: "Payment",
    tags: ["Transaction", "Refund", "Data Integrity", "Integration Test"],
    draft: false,
    featured: false,
    summary:
      "통합 테스트에서 발견된 기업 환불 대기 데이터 누락을 처리하여 회차 취소 승인 흐름의 데이터 전제 조건을 보완했다.",
    background:
      "관리자가 회차 취소를 승인하면 참가자 환불, 신청 정리, 기업 보증금 처리가 연계된다. 김도현 팀원이 통합 테스트에서 결함을 발견하고 원인과 수정안을 보고했으며, 이후 수정 작업이 진행됐다.",
    symptoms:
      "관리자 회차 취소 승인 시 404가 발생했다. 전체 트랜잭션이 롤백되면서 취소 요청이 PENDING 상태에 남고 신규 신청 제한, 참가자 환불 및 보증금 반환 미처리가 이어질 수 있었다.",
    analysis:
      "RefundService.refundCompany가 PENDING 기업 환불 데이터를 조회하지만 해당 행을 만드는 경로가 누락되어 있었다. 승인 시 필요한 데이터가 항상 존재한다는 가정이 실제 저장 흐름과 일치하지 않았다. 통합 테스트 보고에서 Refund.companyBuilder 호출 누락을 원인으로 특정했다.",
    alternatives:
      "| 대안 | 장점 | 고려 사항 |\n| --- | --- | --- |\n| 취소 신청 저장 시 PENDING 생성 | 승인 전에 데이터 준비 | 신청·철회 흐름과 연동 필요 |\n| 승인 시 없으면 생성 | 기존 누락 데이터도 처리 | 중복 생성 및 환불 방지 필요 |",
    decision:
      "기존 PENDING 환불 데이터가 있으면 재사용하고 없으면 기업 환불 데이터를 생성하는 방식으로 수정했다. 기존 보증금 상태와 환불 정책을 유지하면서 승인 흐름에서 누락 데이터 때문에 실패하지 않도록 했다. 이 사례는 팀원의 결함 발견·보고와 수정 작업을 구분하여 기록하며, 수정 커밋 작성자와 작업 요청 작성자가 달라 단독 구현으로 단정하지 않는다.",
    beforeCode:
      "// 원인 구조 요약 (의사 코드)\nPENDING 기업 환불 조회 → 데이터 없음 → 404\n→ 회차 취소 승인 트랜잭션 롤백",
    afterCode:
      "// 수정 구조 요약 (의사 코드)\nPENDING 기업 환불 조회\n→ 존재하면 재사용 / 없으면 기업 환불 데이터 생성\n→ 기존 환불 정책에 따라 처리\n→ 승인 트랜잭션 완료",
    verification:
      "수정 기록에 신규 테스트 5개와 기존 테스트 1개에 대한 검증 기록이 있으며 중복 환불 방지 시나리오가 포함됐다. 전체 빌드는 테스트 제외 옵션으로 수행된 기록이 있어 전체 테스트 통과로 해석하지 않는다. 김도현 팀원의 통합 테스트 문서에는 최종 main에서 수정 확인이 기록되어 있다. 이번 문서 작성 시 재실행하지 않았다.",
    limitations:
      "환불 데이터의 중복 생성 및 동시 승인에 대한 DB 수준 보장, 상태 전이 규칙과 전체 취소 흐름의 자동 회귀 테스트를 추가 검토할 필요가 있다. 배운 점: 도메인 간 데이터 생성 책임과 후속 처리의 전제 조건을 통합 테스트로 확인해야 한다.",
  },
  {
    title:
      "마지막 한 자리 동시 신청 시 정원 초과 → 회차 1행 비관적 락으로 차단",
    category: "Backend",
    tags: [
      "Spring Boot",
      "JPA",
      "Pessimistic Lock",
      "Concurrency",
      "Transaction",
    ],
    draft: false,
    featured: false,
    summary:
      "인기 회차에 신청이 몰리면 두 요청이 같은 잔여석을 보고 둘 다 확정되어 정원을 넘을 수 있었습니다. 회차 1행을 비관적 락으로 잠그고 정원을 필드로 관리해, 동시 신청에도 확정 인원이 정원을 넘지 않게 했습니다.",
    background:
      "- f/3까지의 신청 코드는 회차를 잠그지도, 정원을 확인하지도 않고 신청을 바로 저장했습니다.\n- f/4에서 회차별 정원과 대기열을 만들고 있었습니다.\n- 정원이 차면 대기로 넘기고, 확정 좌석이 비면 접수 번호 순으로 대기자를 자동 승격해야 합니다.\n- 부산 문화행사·팝업은 인기 회차에 신청이 짧은 시간에 몰리는 서비스라, 정원 판단이 동시에 일어나는 상황을 전제로 설계해야 했습니다.",
    symptoms:
      "- 예상: 마지막 1자리에 2명이 동시에 신청하면 1명 확정, 1명 대기\n- 위험: 두 요청이 같은 잔여석 1개를 동시에 읽고 둘 다 확정 → 정원 초과",
    analysis:
      '- 잔여석을 count 쿼리로 세면 세는 순간과 저장하는 순간 사이에 다른 요청이 끼어들 수 있습니다.\n- 즉, "읽고 → 판단하고 → 쓰는" 세 단계가 하나로 묶여 있지 않은 것이 원인입니다.\n- 같은 회차의 좌석을 바꾸는 작업이 신청만이 아니라 취소 · 거절 · 승격까지 있다는 점도 확인했습니다. 이 네 가지가 모두 같은 규칙으로 줄을 서야 했습니다.',
    alternatives:
      "- 낙관적 락 — 장점: 평소에는 잠금 비용이 없음 / 단점·판단: 인기 회차는 충돌이 잦아 재시도가 몰림 → ❌\n- 분산 락 — 장점: 서버가 여러 대여도 동작 / 단점·판단: 현재 DB가 하나라 도구만 늘어남 → ❌\n- 비관적 락 — 장점: 충돌 시 기다렸다가 순서대로 처리 / 단점·판단: 잠금 범위를 회차 1행으로 좁히면 대기 비용이 작음 → ✅",
    decision:
      '- 회차 1행만 짧게 잠그는 비관적 락(PESSIMISTIC_WRITE)을 적용했습니다.\n- f/4 첫 구현은 락을 잡은 뒤 count 쿼리로 정원을 셌고, f/5에서 정원을 회차의 필드(occupiedCount)로 관리하도록 바꿨습니다. 이 값은 락을 잡은 상태에서만 바꾸고, 취소·승격도 같은 값을 씁니다.\n- 안정성: 충돌이 잦은 자원에는 "기다렸다가 한 명씩"이 재시도 폭주보다 예측 가능합니다.\n- 유지보수성: 신청 · 취소 · 거절 · 승격이 모두 같은 락 하나를 거치므로 규칙이 하나입니다.\n- 일정: DB 하나로 해결되어 새 인프라가 필요 없습니다.',
    beforeCode:
      '// f/3 RegistrationService.applyForEvent() — 회차를 잠그지도, 정원을 확인하지도 않고 바로 저장\n@Transactional\npublic Registration applyForEvent(User user, EventSession session) {\n    boolean isPaidEvent = session.getFee() != null && session.getFee() > 0;\n    RegistrationStatus initialStatus;\n\n    if (isPaidEvent) {\n        if (user.getPoint() < session.getFee()) {\n            throw new Exception400("잔액이 부족합니다. (현재 잔액: " + user.getPoint() + ")");\n        }\n        user.deductPoint(session.getFee());\n        initialStatus = RegistrationStatus.PENDING_APPROVAL;\n    } else {\n        initialStatus = RegistrationStatus.WAITING;   // 정원 확인 없음\n    }\n\n    Registration registration = Registration.builder()\n            .user(user)\n            .session(session)              // 락 없이 넘겨받은 회차 그대로\n            .status(initialStatus)\n            .queueNumber(1)                // 임시 대기열 번호\n            .build();\n    return registrationRepository.save(registration);\n}\n\n// 출처: 30b0434 (11-05, [f/3] feat(registration): 유료 행사 포인트 선차감 로직 및 테스트 구현)\n// 이후 변화: f/4 첫 커밋 852a1bf(11-05)에서 회차 비관적 락(findSessionWithPessimisticLock) + count 쿼리로 정원 판단 → f/5 e1dbc29(11-10)에서 정원을 회차의 occupiedCount 필드로 관리하도록 변경',
    afterCode:
      '// EventSessionRepository — 회차 1행을 잠근다\n@Lock(LockModeType.PESSIMISTIC_WRITE)\n@Query("select s from EventSession s where s.id = :id")\nOptional<EventSession> findByIdForUpdate(Long id);\n\n// 잠긴 상태에서 남은 자리를 확인하고 줄인다 (정원은 count 대신 필드로)\nif (session.hasRemainingSeat()) {\n    session.occupySeat();      // 자리 1개 차감\n    status = CONFIRMED;        // 확정\n} else {\n    status = WAITING;          // 대기 번호 발급\n}',
    verification:
      "- 동시성 테스트: 정원 1명인 회차에 2명 동시 신청 → 확정 1 · 대기 1, 각자 포인트 한 번만 차감\n- 신청 · 취소 · 거절 · 승격이 같은 회차 락을 거쳐 한 줄로 실행되는 것을 확인",
    limitations:
      '- 한계: DB 행 락이라 서버를 여러 대로 늘리고 DB까지 나뉘는 구조가 되면 다시 검토해야 합니다. 같은 회차에 요청이 아주 많이 몰리면 락 대기 시간이 길어질 수 있습니다(측정하지는 않았습니다).\n- 개선 방향: 트래픽이 커지면 분산 락이나 대기열(큐) 방식을 다시 비교하고, 락 대기 시간을 먼저 측정해 판단하겠습니다.\n- 배운 점: 락은 "어떤 락을 쓰나"보다 "무엇을, 얼마나 좁게, 어떤 작업들이 같이 잠그나"를 먼저 정해야 합니다.',
    id: "case-005",
    memberId: "m4",
  },
  {
    title:
      "신청과 결제가 따로 호출되어 결제가 두 번 시도되던 흐름 → 검증·결제·저장 한 트랜잭션으로 재설계",
    category: "Payment",
    tags: [
      "Spring Boot",
      "Transaction",
      "Payment",
      "Circular Dependency",
      "Refactoring",
    ],
    draft: false,
    featured: false,
    summary:
      "결제 화면이 신청(안에서 결제함)과 결제를 따로 연달아 불러, 결제가 두 번 시도되며 '이미 결제처리된 행사입니다'가 나오고 신청과 결제가 한 트랜잭션으로 묶여 있지 않았습니다. 검증 → 결제 → 저장 순서만 아는 흐름 클래스를 만들어 한 트랜잭션으로 묶었습니다.",
    background:
      "- f/5에서 참가 신청 API를 만들며 결제는 포인트 파트에 위임했습니다.\n- f/6에서 화면과 연결하는 중이었고, 유료 행사는 신청할 때 포인트를 먼저 차감하는 구조(대기 신청도 선결제)였습니다.\n- 돈이 오가는 기능이라 신청과 결제가 항상 함께 성공하거나 함께 실패해야 했습니다.",
    symptoms:
      "- 예상: 결제 화면에서 [결제하기]를 누르면 신청 1건과 결제 1건이 함께 저장된다\n- 실제: 결제 쪽 오류 이미 결제처리된 행사입니다가 나왔다. 그런데 신청과 결제는 이미 저장되어 있었다\n- 신청과 결제가 함께 성공하거나 함께 실패한다는 보장이 없는 구조였다",
    analysis:
      "- 오류 메시지가 어디서 나오는지 따라가 보니, 결제 화면 컨트롤러가 신청 서비스 apply()와 결제 서비스 purchase()를 연달아 부르고 있었습니다.\n- apply() 안에서 이미 결제를 하므로, 뒤의 purchase()가 같은 회차를 한 번 더 결제하려다 결제 파트의 중복 결제 검사에 걸린 것입니다.\n- 컨트롤러에는 트랜잭션이 없어서, 앞의 신청·결제는 커밋된 채 오류만 화면에 보였습니다.\n- 결제를 부르는 곳이 컨트롤러와 신청 서비스 두 군데였고, 신청 서비스가 결제 서비스를 직접 주입하고 있어 결제 쪽에서 신청을 알아야 하면 순환 참조가 생길 구조였습니다.\n- 최종 원인: 검증 → 결제 → 저장 순서와 트랜잭션 경계를 책임지는 곳이 없었다는 구조 문제였습니다.",
    alternatives:
      "- 결제 화면에서 신청 호출만 빼기 (0f8e71a, 중간 조치) — 장점: 중복 결제가 바로 사라짐 / 단점·판단: 결제와 신청이 여전히 따로 움직이고, 순서·트랜잭션을 책임지는 곳이 없음 → ❌\n- 신청 서비스가 결제 서비스를 계속 직접 호출 — 장점: 수정 범위가 작음 / 단점·판단: 신청 ↔ 결제가 서로 알게 되어 순환 참조 위험 → ❌\n- 순서만 아는 흐름 클래스 분리 — 장점: 두 서비스가 서로를 몰라도 됨, 순서가 한 곳에 보임 / 단점·판단: 클래스 하나가 늘어남 → ✅ (포인트 담당자와 합의)",
    decision:
      '- 원칙: "돈이 움직이기 전에 검증한다."\n- 포인트 담당자와 흐름을 같이 그려 보고, 검증 → 결제 → 저장 순서만 아는 흐름 클래스를 두기로 합의했습니다.\n- 세 단계를 하나의 @Transactional로 묶어, 어느 단계가 실패해도 전부 되돌아가게 했습니다.\n- 신청과 결제를 purchase_id로 1:1 연결해, 취소 후 다시 신청해도 결제가 섞이지 않게 했습니다.\n- 유지보수성: 순서가 코드 세 줄에 그대로 보여, 다른 팀원도 흐름을 바로 읽을 수 있습니다.',
    beforeCode:
      '// PurchaseController.purchaseAction() — 결제 화면의 [결제하기] 요청\n@PostMapping("/event/purchase/{id}")\npublic String purchaseAction(@PathVariable(name = "id") Long eventId , HttpSession session) {\n    LoginIdentity loginIdentity = LoginSession.requireIdentity(session);\n\n    registrationService.apply(eventId , loginIdentity);   // ① 신청 — 이 안에서 이미 결제(purchase)를 호출\n\n    purchaseService.purchase(eventId , loginIdentity);    // ② 결제를 한 번 더 → "이미 결제처리된 행사입니다"\n\n    return "redirect:/mypage"; // TODO 결제처리 완료후 어떤 페이지로 이동시킬지 추후 결정. 일단 myPage로.\n}\n\n// RegistrationService.apply() 안 — 신청 서비스가 결제 서비스를 직접 주입해 호출\n// 4. 결제 위임 (잔액 부족 / 중복 결제 예외는 PurchaseService 가 던짐 → 점유·접수번호 포함 전체 롤백)\npurchaseService.purchase(sessionId, loginIdentity);\n\n// 출처: 컨트롤러 83ff531 (11-10 17:39, refactor : 패키지 구조 변경 수정), 신청 서비스 e1dbc29 (11-10 12:39, (구현중)feat: 참가 신청 PurchaseService 연동…)\n// 컨트롤러에는 @Transactional이 없어 ①과 ②가 서로 다른 트랜잭션이었습니다. ①이 커밋된 뒤 ②가 실패하므로, 신청·결제는 저장되고 화면에는 결제 오류가 나옵니다.\n// 수정: 0f8e71a(11-12)에서 컨트롤러의 apply() 호출을 빼고, f2fbe5d(11-12, refactor(registration): 신청과 결제를 검증-결제-저장 흐름 클래스로 분리하고 신청에 결제 연결)에서 변경 후 코드의 흐름 클래스를 만들었습니다.',
    afterCode:
      "@Transactional   // ①②③ 중 하나라도 실패하면 전부 롤백\npublic RegistrationRes.ApplyDto applyWithPayment(Long sessionId, LoginIdentity login) {\n    ApplyContext ctx = registrationService.prepareApply(sessionId, login); // ① 검증만 — 실패하면 차감 시도조차 안 함\n    Purchase purchase = purchaseService.pay(ctx.user(), ctx.session());    // ② 결제 — 잔액 부족·중복 결제면 예외 → 전체 롤백\n    return registrationService.completeApply(ctx, purchase);               // ③ 신청 저장 + 결제 연결\n}",
    verification:
      "- 검증 실패 → 포인트 그대로, 저장 실패 → 결제까지 롤백 확인\n- 연타·동시 신청 테스트: 같은 계정으로 동시에 2번 신청 → 1건 성공, 1건은 이미 신청한 행사 회차입니다(400) → 신청 1건 · 결제 1건 · 차감 1번\n- 락 타임아웃이나 DB 오류를 정상 거부로 착각하지 않도록 예외 종류까지 확인\n- PR 4번(#99 #105 #109 #116)에 나눠 main에 반영",
    limitations:
      "- 한계: DB 유니크 제약은 두지 않았습니다. 취소·거절 후 재신청을 허용해야 해서, 대신 회차 락 안에서 '진행 중인 신청'만 검사합니다. 따라서 이 검사는 락을 거치는 코드 경로에서만 보장됩니다.\n- 한계: 포인트 결제가 같은 DB 안에 있어서 한 트랜잭션으로 묶을 수 있었습니다. 외부 PG 결제로 바뀌면 이 방식만으로는 롤백할 수 없습니다.\n- 개선 방향: 외부 결제가 붙으면 결제 취소(보상) 처리와 멱등 키를 함께 설계하겠습니다. '진행 중 신청 1건'을 DB에서도 보장할 방법(부분 유니크 인덱스 등)을 검토하겠습니다.\n- 배운 점: 돈이 얽힌 기능은 구현 전에 트랜잭션 경계와 호출 순서를 담당자와 먼저 그림으로 합의해야 구조를 뒤집는 비용이 줄어듭니다.",
    id: "case-006",
    memberId: "m4",
  },
  {
    title:
      "취소와 대기자 승격이 겹치면 좌석 반납이 빠지는 문제 → 락 순서 고정과 환불 후 반납",
    category: "Backend",
    tags: [
      "JPA",
      "Pessimistic Lock",
      "Transaction",
      "Refund",
      "Race Condition",
    ],
    draft: false,
    featured: false,
    summary:
      "취소할 때 신청을 먼저 읽고 회차 락을 나중에 잡아, 그 사이 대기자 승격이 일어나면 오래된 상태로 판단해 좌석 반납이 빠질 수 있었습니다. 락 순서를 고정하고 환불 성공 뒤에 좌석을 반납하도록 바꿔 '취소됐는데 환불 안 됨' 상태를 없앴습니다.",
    background:
      "- f/6에서 본인 취소와 환불을 연결하고 있었습니다.\n- 환불 규칙: 4일 전 전액 / 3일 전 2/3 / 2일 전 1/2 / 1일 전 0P, 대기 중 취소는 전액\n- 확정자가 취소하면 좌석을 반납하고 대기자를 승격해야 하므로, 취소 · 환불 · 좌석 · 승격이 한 번에 맞아떨어져야 했습니다.",
    symptoms:
      "- 테스트하다가 직접 찾은 버그입니다.\n- 예상: 확정자가 취소하면 좌석 1개 반납 → 대기자 1명 승격\n- 위험 1: 취소와 승격이 겹치면 좌석 반납이 빠져 좌석 수가 어긋남\n- 위험 2: 환불이 실패하면 '취소는 됐는데 환불은 안 된' 상태가 남음",
    analysis:
      '- 취소 코드를 따라가 보니 신청을 먼저 읽고, 회차 락은 나중에 잡고 있었습니다.\n- 그 사이에 다른 요청이 승격을 처리하면, 취소 쪽은 락 이전에 읽은 오래된 상태를 기준으로 "좌석을 반납할지"를 판단합니다.\n- 환불은 취소와 따로 처리되고 있어서, 환불만 실패하는 경우를 막을 장치가 없었습니다.',
    alternatives:
      "- 지금 순서 유지 + 반납 직전에 상태 다시 확인 — 확인과 반납 사이에 또 끼어들 수 있어 근본 해결이 아님 → ❌\n- 환불을 취소 뒤 별도 처리 — 환불 실패 시 '취소됨 + 환불 안 됨' 상태가 남음 → ❌\n- 락 순서 고정 + 같은 트랜잭션에서 환불 + 환불 후 반납 — 상태 판단과 변경이 모두 락 안에서, 실패 시 전부 롤백 → ✅",
    decision:
      "1. 락 순서를 한 방향으로 고정: 항상 회차 락 → 그다음 신청 조회 (최신 상태로 판단)\n2. 환불을 취소와 같은 트랜잭션에서 호출 (실패하면 취소도 롤백)\n3. 좌석 반납 · 대기자 승격은 환불이 성공한 뒤에 (실패하면 다른 사람의 승격도 일어나지 않음)\n4. 환불 금액은 포인트 파트의 공통 RefundPolicy 하나로 계산 (화면 예상 환불액 = 실제 환불액)\n\n안정성과 데이터 일치를 가장 우선했습니다. 금액과 좌석이 어긋나면 사용자 신뢰에 바로 영향을 주기 때문입니다.",
    beforeCode:
      '// RegistrationService.cancel() — 신청을 먼저 읽고, 회차 락은 나중에\npublic void cancel(Long registrationId, LoginIdentity loginIdentity) {\n    if (!loginIdentity.isUser()) {\n        throw new RegistrationForbiddenException("개인 회원만 신청을 취소할 수 있습니다");\n    }\n\n    Registration registration = findRegistration(registrationId);   // ① 락 없이 신청을 읽음\n    if (!registration.isOwnedBy(loginIdentity.getId())) {\n        throw new RegistrationForbiddenException("본인의 신청만 취소할 수 있습니다");\n    }\n\n    // 승격 로직과 동시 신청이 겹치지 않도록 회차 락\n    EventSession session = lockSession(registration.getEventSession().getId());   // ② 락은 나중에\n\n    boolean releasedSeat = registration.getStatus().isSeatOccupying();   // ①에서 읽은 상태로 판단\n    registration.cancel();\n    recordHistory(registration, RegistrationStatus.CANCELLED, registration.getUser(), "본인 취소");\n\n    // TODO: 포인트 파트 환불 메서드 완성 후 연결\n    // purchaseService.refund(session.getId(), registration.getUser().getId());   // 환불이 취소와 묶여 있지 않음\n\n    if (releasedSeat) {\n        session.releaseSeat();\n        promoteWaitingUsersIfAny(session);\n    }\n}\n\n// 출처: e1dbc29 (11-10, (구현중)feat: 참가 신청 PurchaseService 연동, 대기열 승격, 이력 기록 및 API 인증 보완)\n// 수정: 0f8e71a(11-12)에서 회차 번호만 먼저 조회해 회차 락을 잡은 뒤 신청을 읽는 findRegistrationWithSessionLock()을 추가했습니다. 환불 연결은 4b66141(11-16, feat(registration): 참가 취소 시 포인트 환불 연동…)입니다.\n\n// 0f8e71a — 회차 락 → 신청 조회 순서로 고정\nprivate Registration findRegistrationWithSessionLock(Long registrationId) {\n    Long sessionId = registrationRepository.findSessionIdById(registrationId)\n            .orElseThrow(() -> new Exception404("신청 내역을 찾을 수 없습니다"));\n    lockSession(sessionId);\n    return findRegistration(registrationId);\n}',
    afterCode:
      "// 회차 락을 먼저 잡은 뒤 신청을 읽는다\nRegistrationStatus before = registration.getStatus();   // 회차 락을 잡은 뒤 읽은 최신 상태\nregistration.cancel();  recordHistory(...);  publishStatusChanged(registration, before);\nif (registration.getPurchase() != null)\n    refundService.refundUser(userId, registration, before);   // 실패하면 여기서 전체 롤백\nif (before.isSeatOccupying()) { session.releaseSeat(); promoteWaitingUsersIfAny(session); }",
    verification:
      "- 취소 · 거절 · 승격이 겹쳐도 좌석 수가 맞는 것을 확인\n- 환불이 실패하면 취소도, 다른 사람의 승격도 함께 롤백되는 것을 확인\n- 화면의 예상 환불액과 실제 환불액이 같은 정책으로 계산되는 것을 확인",
    limitations:
      '- 한계: 락 순서는 코드 규칙이라, 새 기능을 만드는 사람이 순서를 지키지 않으면 같은 문제가 다시 생길 수 있습니다.\n- 개선 방향: "회차 락 먼저"를 공통 메서드로 감싸 우회할 수 없게 하고, 취소·승격 동시 실행 테스트를 자동 회귀 테스트로 남기겠습니다.\n- 배운 점: 동시성 버그는 기능이 정상 동작할 때는 보이지 않습니다. "두 작업이 동시에 오면?"을 직접 만들어 보는 테스트가 있어야 찾을 수 있습니다.',
    id: "case-007",
    memberId: "m4",
  },
  {
    title:
      "신청 상태에 따른 커뮤니티 자동 입장·퇴장 → 커밋 후 이벤트로 결합과 불일치 제거",
    category: "Backend",
    tags: [
      "Spring Boot",
      "TransactionalEventListener",
      "WebSocket",
      "STOMP",
      "Scheduler",
    ],
    draft: false,
    featured: false,
    summary:
      "참가 확정·취소에 따라 회차 커뮤니티에 자동 입장·퇴장시켜야 했는데, 신청 서비스가 커뮤니티를 직접 부르면 결합이 커지고 롤백 시 불일치가 생길 수 있었습니다. 상태 변경 이벤트를 커밋 후에만 반영하는 구조로 분리해, 이후 기능도 신청 코드 수정 없이 연결했습니다.",
    background:
      "- f/40에서 회차별 실시간 커뮤니티(STOMP 채팅 · 공지 · 자정 종료)를 만들고 있었습니다.\n- 요구사항: 참가가 확정되면 자동 입장, 취소·거절되면 자동 퇴장\n- 커뮤니티는 클래스 22개 규모라, 신청 코드와 얽히면 양쪽 모두 고치기 어려워질 상황이었습니다.",
    symptoms:
      "설계 단계에서 확인한 위험입니다.\n- 신청 서비스가 커뮤니티를 직접 부르면 신청 코드가 커뮤니티를 알게 되어 결합이 커짐\n- 취소가 롤백됐는데 퇴장만 일어나는 불일치 가능\n- 커뮤니티 반영이 실패하면 신청 응답까지 실패할 수 있음\n- 자정 종료를 스케줄러에만 맡기면, 서버가 꺼져 있던 시간에는 방이 닫히지 않음",
    analysis:
      '- 핵심은 "신청 트랜잭션이 확정(커밋)되기 전에 다른 기능이 움직이면 안 된다"는 점이었습니다.\n- 커뮤니티 입장·퇴장은 신청의 결과이지 신청의 일부가 아니라고 판단했습니다. 커뮤니티가 실패해도 신청은 성공해야 합니다.',
    alternatives:
      "- 신청 서비스에서 커뮤니티 직접 호출 — 가장 쉽지만 결합 증가, 롤백 불일치, 실패 전파 → ❌\n- 일반 이벤트(@EventListener) — 결합은 줄지만 커밋 전에 실행되어 롤백 불일치는 남음 → ❌\n- 커밋 후 이벤트(AFTER_COMMIT) — 커밋된 변경만 반영, 실패해도 신청 응답은 정상 → ✅",
    decision:
      '- 상태 변경 이벤트 발행 — 신청 서비스는 "상태가 바뀌었다"는 사실만 알림\n- AFTER_COMMIT 리스너 — 커밋된 변경만 커뮤니티에 반영\n- 실패 시 로그 + 서버 시작 시 재동기화 — 리스너가 실패해도 나중에 확정자 기준으로 다시 맞춤\n- 자정 종료 이중 차단 — 스케줄러 + 화면 진입·메시지 전송 때 종료 시각 재계산\n- STOMP 권한 4겹 검사 — 연결 · 구독/전송 · 저장 · 화면 출력(textContent)\n\n유지보수성을 가장 크게 봤습니다. 신청과 커뮤니티를 서로 모르게 두면, 새 상태가 생겨도 이벤트만 연결하면 됩니다.',
    beforeCode:
      "// 직접 호출 방식은 설계 단계에서 검토만 했고, 커밋한 적이 없습니다.\n// (저장소 전체 기록에서 신청 패키지가 CommunityService를 참조한 커밋 없음)\n// 이벤트 발행 전까지 신청 서비스에는 커뮤니티와 연결하는 코드가 없었습니다.\n// → 41a9403 (11-16, feat(registration): 참가 신청 상태 변경 이벤트 발행)에서\n//   RegistrationStatusChangedEvent와 publishStatusChanged()를 추가해 처음부터 이벤트로 연결",
    afterCode:
      '@TransactionalEventListener(phase = AFTER_COMMIT)\nvoid onStatusChanged(RegistrationStatusChangedEvent e) {\n    try {\n        if (e.becameConfirmed()) community.join(...);\n        else if (e.leftConfirmed()) community.leave(...);\n    } catch (Exception ex) {\n        log.error("멤버십 반영 실패", ex);   // 신청 응답은 정상\n    }\n}',
    verification:
      "- 확정 시 자동 입장, 취소·거절 시 자동 퇴장 확인\n- 이후 f/41의 기업 거절 · 회차 취소도 신청 코드를 바꾸지 않고 같은 이벤트로 연결됨\n- 서버 시작 시 확정자 기준 재동기화, 자정 종료 이중 차단이 동작하도록 구성",
    limitations:
      '- 한계: 리스너가 실패하면 서버를 다시 시작할 때까지 멤버십이 어긋난 채로 남을 수 있습니다. 실패는 로그로만 남습니다.\n- 한계: STOMP 브로커가 서버 메모리 내장 방식(enableSimpleBroker, CommunityWebSocketConfig.java:38)이라, 서버를 여러 대로 늘리면 메시지가 서버 사이에 공유되지 않습니다.\n- 개선 방향: 실패한 이벤트를 저장해 재시도하는 구조(아웃박스 등)를 검토하고, 서버를 확장할 때는 외부 메시지 브로커를 검토하겠습니다.\n- 배운 점: 다른 파트와 연결할 때는 "이 작업이 실패하면 원래 작업도 실패해야 하나?"를 먼저 물으면 직접 호출과 이벤트 중 무엇을 쓸지 정해집니다.',
    id: "case-008",
    memberId: "m4",
  },
  {
    title:
      "기업 거절·회차 취소의 정책 빈칸 → 기준 통일과 호출 순서 고정으로 손해·이중 환불 차단",
    category: "Payment",
    tags: ["Spring Boot", "Business Rule", "Refund", "Transaction"],
    draft: false,
    featured: false,
    summary:
      "기업 거절과 회차 취소는 코드보다 정책의 빈칸이 먼저 문제였습니다. 빈칸을 질문으로 정리해 조장과 결정하고, 거절 기준 통일 · 검토 중 차단 · 호출 순서 고정으로 사용자 손해와 이중 환불을 막았습니다.",
    background:
      "- f/41에서 기업의 참가 거절(전액 환불)과 회차 취소 검토 중 신청·취소 차단을 만들고 있었습니다.\n- 회차 취소가 승인되면 참가자 전원 환불 · 신청 일괄 정리 · 커뮤니티 종료 · 기업 보증금 처리가 함께 일어납니다.",
    symptoms:
      "요구사항에 답이 없던 경우들입니다.\n- 회차가 시작된 뒤에도 기업이 거절할 수 있나?\n- 회차 취소 검토 중에 사용자가 본인 취소를 하면 부분 환불만 받고 손해를 본다\n- 회차 취소가 승인될 때 일괄 정리와 전원 환불이 겹치면 환불이 두 번 일어날 수 있다",
    analysis:
      "- 본인 취소 규칙(날짜별 환불)과 기업 거절 · 회차 취소 규칙이 서로 다른 기준으로 정해지면 사용자마다 결과가 달라진다는 점을 확인했습니다.\n- 회차 취소 승인 흐름을 단계별로 나눠 보니, 환불을 하는 곳이 두 군데가 되면 이중 환불이 생긴다는 것이 보였습니다.\n- 최종 원인: 기능이 아니라 정책과 호출 순서가 정해지지 않은 것이었습니다.",
    alternatives:
      "- 거절 가능 시점 — 검토한 선택: 언제든 거절 / 회차 시작 전까지만 / 결정: 시작 전까지 (본인 취소와 같은 기준)\n- 검토 중 본인 취소 — 검토한 선택: 허용(부분 환불) / 차단 후 승인 시 전액 환불 안내 / 결정: 차단 + 안내\n- 환불 위치 — 검토한 선택: 일괄 정리 안에서도 환불 / 전원 환불 한 곳에서만 / 결정: 전원 환불 한 곳, 일괄 정리는 환불 안 함",
    decision:
      "- 질문 목록을 정리해 조장(이진우)과 함께 결정했습니다.\n- 거절 기준 = '회차 시작 전'. 현재 시각과 시작 시각을 비교하므로 스케줄러 상태와 무관합니다.\n- 검토 중에는 신규 신청 · 본인 취소 차단, 안내 문구: 승인되면 결제한 포인트가 전액 환불됩니다\n- 회차 일괄 정리 순서를 고정: ① 회차 CANCELLED → ② 참가자 전원 전액 환불 → ③ 신청 일괄 정리(환불하지 않음) → ④ 기업 보증금 처리\n- 사용자 보호와 일관성을 기준으로 정했습니다. 같은 상황이면 누구나 같은 결과를 받아야 합니다.",
    beforeCode:
      "// 코드 변경 전 상태: 거절 기능 신규 개발로, 기존 코드는 없음\n// 정책 미정 상태 — 거절 가능 시점, 검토 중 취소, 환불 위치가 정해지지 않음",
    afterCode:
      '// reject() — 시각 기준이라 스케줄러와 무관\nif (!LocalDateTime.now().isBefore(session.getStartsAt()))\n    throw new Exception400("이미 시작된 회차의 신청은 거절할 수 없습니다");\nregistration.reject();                     // 상태·이력·이벤트\nrefundService.refundByCompany(registration);',
    verification:
      "- 통합 테스트 기업 거절 6항목 모두 통과: 전액 환불, 이중 거절 방지, 시작 후 거절 차단 등\n- 이중 환불 없음 확인\n- 거절된 신청·환불이 '기업 거절'로 구분 표시되도록 후속 작업(#156)까지 진행",
    limitations:
      '- 한계: 호출 순서는 서비스 코드의 순서로만 지켜집니다. 다른 사람이 순서를 바꾸면 이중 환불이 다시 생길 수 있습니다.\n- 개선 방향: 환불에 "이미 환불됨" 검사를 결제 단위로 한 번 더 두고, 회차 취소 전체 흐름을 자동 테스트로 남기겠습니다.\n- 배운 점: 코드보다 먼저 "시작 후에는? 검토 중에는? 두 번 일어나면?" 같은 경계 질문을 만들고 결정권자와 정하면 구현이 단순해집니다.',
    id: "case-009",
    memberId: "m4",
  },
  {
    title:
      "회차 id만 바꾸면 되는 QR 출석 위험 → HMAC 서명 QR과 회차 락 안 1회 저장",
    category: "Security",
    tags: ["Spring Boot", "HmacSHA256", "QR", "Pessimistic Lock", "Mobile"],
    draft: false,
    featured: false,
    summary:
      "QR 출석은 주소의 회차 id만 바꾸면 다른 회차에 출석되거나, 연타로 중복 저장될 위험이 있었습니다. 회차 id를 HmacSHA256으로 서명한 QR과 회차 락 안 1회 저장으로 막고, 오류 대신 안내 문구를 보여 현장에서 바로 이해할 수 있게 했습니다.",
    background:
      "- f/42(F04)에서 현장 QR 출석을 만들고 있었습니다.\n- 출석한 사람만 후기를 쓸 수 있으므로, 출석 기록은 정확하고 위조할 수 없어야 했습니다.\n- 사용자는 행사장에서 휴대폰으로 한 번 인식하고 끝나야 했습니다.",
    symptoms:
      "설계 단계에서 확인한 위험입니다.\n- QR 주소의 회차 id만 바꾸면 다른 회차에 출석될 수 있음\n- 버튼 연타 → 출석이 두 번 저장될 수 있음\n- 휴대폰에 오류 페이지가 뜨면 현장에서 이유를 알 수 없음",
    analysis:
      '- QR에 회차 id만 넣으면 누구나 만들 수 있는 주소가 됩니다. 서버가 "이 QR이 진짜 우리가 발급한 것인지" 확인할 방법이 필요했습니다.\n- 중복은 "이미 출석했나?" 검사와 저장 사이에 다른 요청이 끼어들 수 있어서 생깁니다 (1번 동시성 문제와 같은 구조).\n- 화면 표시와 실제 저장이 서로 다른 검사를 쓰면, 화면은 "가능"인데 저장은 실패하는 어긋남이 생길 수 있다고 봤습니다.',
    alternatives:
      '- 회차 id만 QR에 포함 — 구현은 쉽지만 id만 바꾸면 위조 가능 → ❌\n- 회차 id + HmacSHA256 서명 코드 — 서버 비밀키 없이는 맞는 서명을 만들 수 없음 → ✅\n- 오류는 예외(에러 페이지)로 처리 — 현장 휴대폰에서 이유를 알 수 없음 → ❌\n- 규칙 위반은 안내 문구로 반환 — "이미 출석했습니다"처럼 바로 이해 가능 → ✅',
    decision:
      "- QR에 회차 id를 HmacSHA256으로 서명한 코드 포함 → 번호만 바꾸면 서명이 맞지 않음\n- 규칙: 확정자만 · 시작 30분 전 ~ 종료 · 신청당 1회, 저장할 때는 회차 락\n- 검사 순서: ① 서명 → ② 로그인·개인 회원 → ③ 본인 확정 신청 → ④ 이미 출석? → ⑤ 출석 시간\n- 화면 표시와 실제 저장이 같은 검사 코드를 사용\n- 보안과 현장 사용성을 함께 고려했습니다.",
    beforeCode:
      "// 출석 기능 신규 개발로, 기존 코드는 없음\n// 검토한 단순 방식: /attendance?sessionId=12 → id만 바꾸면 다른 회차 출석 가능",
    afterCode:
      '// 1. 서명 확인 → 2. 로그인·개인 회원 → 3. 본인 확정 신청 → 4. 이미 출석? → 5. 출석 시간\nif (!qrSigner.matches(sessionId, code)) return error("유효하지 않은 출석 QR입니다.");\nif (attendanceRepository.existsByRegistrationId(reg.getId())) return done("이미 출석 체크되었습니다.");\nattendanceRepository.save(Attendance.create(reg, companyId));   // 회차 락 안에서 1번만',
    verification:
      "- 통합 테스트: 정상 출석, 중복 출석 · 미신청 출석 · 변조 코드 모두 차단\n- 실기기 확인(11-22): 실제 휴대폰으로 QR 인식 → 로그인 → 같은 화면 복귀 → 출석 완료, 다시 인식하면 이미 출석 체크되었습니다\n- 출석한 사람만 후기 작성 버튼이 보이도록 연결",
    limitations:
      '- 한계: 서명 코드는 attendance:{회차 id}만 서명하므로 회차마다 고정입니다 (AttendanceQrSigner.java:41). 확정자가 QR 사진을 전달받으면 현장에 없어도 출석 시간 안에 출석할 수 있습니다.\n- 개선 방향: 일정 시간마다 바뀌는 QR(시간값 포함 서명)이나 위치 확인을 검토하겠습니다. 서명 비밀키(attendance.qr-secret)는 지금 설정하지 않으면 코드의 기본값을 쓰므로, 환경 변수·비밀 관리 도구로 반드시 주입하도록 바꾸겠습니다.\n- 배운 점: 사용자가 직접 보는 입력(주소, QR)은 "화면은 편의, 서버가 진짜 방어"라는 원칙으로 설계해야 합니다.',
    id: "case-010",
    memberId: "m4",
  },
  {
    title:
      "상태별 회차 목록이 항상 비어 보이는 문제 → 모델 이름과 화면용 DTO 통일",
    category: "Frontend",
    tags: ["Mustache", "Spring MVC", "DTO", "Debugging"],
    draft: false,
    featured: false,
    summary:
      "상태별 회차 목록(F02)이 데이터가 있어도 항상 비어 보였습니다. 모델 이름 불일치와 화면에 필요한 값이 없는 엔티티 전달이라는 두 원인을 찾아, 일반 목록과 같은 화면용 DTO로 통일해 해결했습니다.",
    background:
      "- 사용자가 신청 상태별로 회차 목록을 보는 화면(F02)이었습니다.\n- Mustache 템플릿은 넘겨받은 값이 없으면 오류 없이 그냥 아무것도 그리지 않습니다.",
    symptoms:
      "- 예상: 상태별로 해당 회차 목록이 표시됨\n- 실제: 데이터가 있는데도 목록이 항상 비어 보임\n- 오류 메시지도, 예외 로그도 없었습니다.",
    analysis:
      "- 오류가 없으니, 컨트롤러가 넘기는 값과 템플릿이 읽는 값을 하나씩 대조했습니다.\n- 원인 1: 컨트롤러는 모델을 복수형 eventSessions로 넘기는데, 템플릿(list.mustache)은 단수형 eventSession을 읽고 있었습니다.\n- 원인 2: 화면에 필요한 값이 없는 엔티티를 그대로 넘기고 있었습니다. 이름을 맞춰도 일부 칸이 비게 됩니다.",
    alternatives:
      "- 모델 이름만 맞추기 — 원인 1만 해결, 엔티티 전달 문제는 남음 → ❌\n- 엔티티에 화면용 값 추가 — 엔티티가 화면에 끌려다님 → ❌\n- 일반 목록과 같은 화면용 DTO로 통일 — 두 원인 모두 해결, 두 화면이 같은 형식을 씀 → ✅",
    decision:
      "- 이미 일반 회차 목록에서 쓰던 화면용 DTO(EventSessionDto)를 그대로 재사용하고, 모델 이름을 템플릿과 일반 목록이 쓰는 eventSession으로 맞췄습니다 (#149).\n- 유지보수성: 같은 정보를 보여 주는 두 화면이 같은 형식을 쓰면, 한쪽을 고칠 때 다른 쪽도 함께 맞춰집니다.",
    beforeCode:
      '// EventSessionController.listByStatus() — 컨트롤러는 복수형 이름으로 전달\n@GetMapping("/events/sessions/status/{eventId}")\npublic String listByStatus(@PathVariable Long eventId, @RequestParam EventSessionStatus status, Model model) {\n    model.addAttribute("eventSessions", eventSessionService.findAllByEventIdAndStatus(eventId, status));\n    model.addAttribute("status", status);\n\n    return "event_session/list";   // list.mustache는 단수형 eventSession을 읽음 → 항상 비어 보임\n}\n\n// EventSessionService — 화면에 필요한 값이 없는 엔티티를 그대로 반환\n// 행사별 상태별 회차 조회\npublic List<EventSession> findAllByEventIdAndStatus(Long eventId, EventSessionStatus status) {\n    return eventSessionRepository.findAllByEventIdAndStatus(eventId, status);\n}\n\n// 출처: a6a24d4의 변경 전 코드 (변경 작업 이전 main)',
    afterCode:
      '// EventSessionController.listByStatus() — 템플릿(list.mustache)이 읽는 이름으로 맞춤\nmodel.addAttribute("eventSession", eventSessionService.findAllByEventIdAndStatus(eventId, status));\n\n// EventSessionService — ★ [F02] 일반 목록(findByEventId)과 같은 화면용 DTO로 반환 (capacityLabel·신청 가능 여부 포함)\npublic List<EventSessionResponse.EventSessionDto> findAllByEventIdAndStatus(Long eventId, EventSessionStatus status) {\n    return eventSessionRepository.findAllByEventIdAndStatus(eventId, status)\n            .stream()\n            .map(session -> new EventSessionResponse.EventSessionDto(session, registrationService.getClosedReason(session)))\n            .toList();\n}\n\n// 출처: a6a24d4 (11-19, fix(eventSession): 상태별 회차 목록이 비어 보이는 문제 수정) → 변경 작업로 main에 반영 (11-20)\n// 템플릿을 고치지 않고 컨트롤러 쪽 이름을 템플릿(eventSession)에 맞췄습니다. 일반 목록 화면이 이미 eventSession 이름과 EventSessionDto를 쓰고 있었기 때문입니다.',
    verification:
      "- 상태별 목록이 정상 표시되는 것을 화면에서 확인 (#149)\n- 같은 계열의 결함도 재현 → 원인 → 수정 → 재확인 순서로 닫았습니다.\n\n- 기업 거절 환불이 그냥 '환불'로 보임 — 원인: 환불 내역에 거절 여부 정보가 없음 / 해결: 결제 id로 거절 여부를 쿼리 1번에 조회 (#156)\n- 내용 없는 '환불 내역' 제목이 보임 — 원인: Mustache는 빈 문자열도 '값 있음'으로 봄 / 해결: 숨길 값은 null로 전달\n- 커뮤니티 화면이 하얗게 멈춤 — 원인: 섹션 밖에서 null 출력 시 예외 / 해결: {{#값}}{{.}}{{/값}} 형태로 출력\n- 화면이 무한 로딩 — 원인: JS 주석 안의 {{> partial}}도 실행됨 / 해결: 주석에 템플릿 문법 사용 금지\n- 빈 파일이 커밋될 뻔함 — 원인: IDE가 새 파일을 빈 상태로 staged / 해결: commit 전 git status, 경로 지정 git add",
    limitations:
      "- 한계: Mustache는 이름이 틀려도 오류를 내지 않아, 같은 실수를 화면을 직접 봐야만 찾을 수 있습니다.\n- 개선 방향: 화면 데이터 이름을 상수·DTO로 통일하고, 컨트롤러 테스트에서 모델 값의 이름과 내용을 검사하겠습니다. 위 Mustache 함정은 팀 체크리스트로 공유하겠습니다.\n- 배운 점: 오류가 없는 버그는 넘기는 쪽과 받는 쪽을 나란히 놓고 대조하는 것이 가장 빠릅니다.",
    id: "case-011",
    memberId: "m4",
  },
  {
    title:
      "기능별로는 정상이던 main의 숨은 결함 → 81항목 통합 테스트와 원인·수정안 보고",
    category: "Collaboration",
    tags: ["Integration Test", "QA", "Git", "Documentation", "Collaboration"],
    draft: false,
    featured: false,
    summary:
      "기능별로는 동작하던 코드가 main에서 합쳐진 뒤 실제 흐름에서 막히는 문제가 있었습니다. 최신 main을 81항목으로 통합 테스트해 문제 18건을 재현 방법 · 원인 위치 · 수정안과 함께 보고했고, 일부가 최종 main에 반영됐습니다.",
    background:
      "- 5명이 각자 브랜치에서 만든 기능(가입 · 행사 등록 · 심사 · 포인트 · 신청 · 출석 · 취소)이 main에서 하나로 합쳐졌습니다.\n- 개발 마감 뒤에는 전체 흐름을 사용자 입장에서 처음부터 끝까지 확인하는 과정이 필요했습니다.",
    symptoms:
      "- 관리자의 회차 취소 승인이 항상 404\n- 회차 상세 화면이 빈 화면\n- 최종 main(11-23) 이후: 테스트 계정과 예전에 가입한 계정이 로그인 400, 빈 비밀번호는 500 가능\n- 그 밖에 막힘 5 · 이상함 6 · 개선 7, 총 18건",
    analysis:
      "- 실제 화면과 같은 순서로 12단계 요청을 보냈습니다: 가입 → 등록 → 심사 → 결제 → 신청 → 출석 → 취소\n- 실패하면 응답과 로그를 확인하고 원인이 되는 파일과 줄까지 찾았습니다.\n- 예: 회차 취소 승인 404 → 환불 대기 행을 만드는 코드가 어디서도 호출되지 않아, 승인 단계에서 찾을 데이터가 없었습니다.\n- 예: 로그인 불가 → 가입용 비밀번호 규칙(영문·숫자·특수문자 8–16자)이 로그인 검사에도 들어가 있었습니다. 빈 값 검사보다 규칙 검사가 먼저라 빈 비밀번호는 500이 날 수 있었습니다.\n- DB를 직접 바꿔야 할 때는 사전 승인을 받고 이유를 기록했습니다.",
    alternatives:
      "- 찾은 문제를 main에서 바로 직접 수정 — 빠르지만 담당자의 의도·다른 기능 영향을 모른 채 바꾸게 됨 → ❌\n- 증상만 알리기 — 담당자가 다시 처음부터 재현·분석해야 함 → ❌\n- 재현 방법 · 원인 위치 · 수정안 · 담당 영역을 함께 보고 — 담당자가 바로 판단·수정 가능, 결정권은 담당자와 팀에 → ✅",
    decision:
      "- main은 직접 고치지 않았습니다. 그 코드의 담당자와 팀이 결정할 일이기 때문입니다.\n- 대신 문제마다 재현 방법 · 원인 파일과 줄 · 수정안 · 담당 영역을 적어 즉시 공유했습니다.\n- 최종 Merge 뒤에도 다시 확인하고, 반영된 수정은 재테스트 대상으로 남겼습니다.\n- 결과 문서는 팀 Wiki에 남겼습니다: 설계 문서 8종, 협업 매뉴얼(Git 문제 해결 11가지), 통합·화면 테스트 결과와 화면 캡처 34장",
    beforeCode:
      "// 코드 변경이 아닌 협업·검증 과정 개선 항목\n// 변경 전: 기능별 개별 확인만 있고, 합쳐진 main 전체 흐름 검증과 결함 보고 형식이 없음",
    afterCode:
      '// 변경 후: 문제 보고 형식 (18건 모두 같은 형식)\n[증상]      관리자 회차 취소 승인이 항상 404\n[재현]      회차 취소 요청 → 관리자 승인 클릭\n[원인]      RefundService.java:95-96 refundCompany가 PENDING 기업 환불 행을 찾는데,\n            그 행을 만드는 Refund.companyBuilder()가 본 코드 어디서도 호출되지 않음\n            (Refund.java:61-62 "TODO 기업이 취소 요청시 이 생성자 사용!" 주석)\n[영향]      전체 롤백 → 취소 신청이 PENDING에 갇혀 그 회차는 신규 신청도 막힘,\n            참가자 환불·보증금 반환 모두 안 됨\n[수정안]    취소 신청 저장(EventCancelService.save) 때 PENDING 행 생성,\n            또는 refundCompany에서 없으면 새로 생성\n[담당 영역] 회차 취소·환불·보증금\n[상태]      11-23 변경 작업에서 "없으면 생성" 방식으로 수정 반영 → 재테스트 대상',
    verification:
      "- 81항목: 통과 61 · 실패 8 · 건너뜀 12\n\n💡 건너뜀 12란?\n실패가 아니라, API 요청만으로는 판정할 수 없고 화면으로만 확인할 수 있는 항목이라 이번 테스트에서 빼고 따로 표시해 둔 것입니다.\n→ 이후 화면 확인 테스트(11-22–23, 14항목)에서 점검했습니다.\n\n- 문제 18건 보고 (막힘 5 · 이상함 6 · 개선 7)\n- 회차 취소 승인 404 → 수정됨, 회차 상세 빈 화면 → 수정됨 (최종 main에서 확인)\n- 로그인 불가 문제는 원인 위치 · 영향 · 수정안을 담당자에게 공유\n- 다국어 기능 · 번역 테이블 · 기본 데이터 변경을 설계서에 반영",
    limitations:
      '- 한계: 회귀 테스트를 수동으로 반복한 비중이 컸습니다. main이 바뀔 때마다 사람이 다시 돌려야 했습니다.\n- 개선 방향: 신청 · 취소 · 환불 · 출석 흐름을 테스트 코드로 자동화해 머지할 때마다 자동으로 돌게 하겠습니다.\n- 배운 점: 기능별로 정상이어도 합쳐진 뒤의 흐름은 따로 확인해야 합니다. 그리고 결함 보고는 "고쳐 주세요"가 아니라 재현 · 원인 · 수정안까지 있어야 팀이 빨리 움직입니다.',
    id: "case-012",
    memberId: "m4",
  },
  {
    id: "case-016",
    memberId: "m2",
    title: "결제 완료 상태만 변경되고 포인트가 지급되지 않는 문제 해결",
    category: "Payment",
    tags: ["Spring Boot", "JPA", "Transaction", "PortOne"],
    draft: false,
    featured: false,
    summary:
      "결제 검증 후 결제 상태만 변경하던 로직에 회원 포인트 증가 처리를 추가하여 결제 완료와 잔액 변경을 같은 트랜잭션에서 처리했다.",
    background:
      "네이버페이로 결제한 금액을 플랫폼 포인트로 충전하는 기능을 개발했다. 외부 결제 완료뿐 아니라 내부 회원 잔액에도 충전 금액이 반영되어야 했다.",
    symptoms:
      "변경 전 코드는 결제 검증을 통과해도 payment.confirmPay()만 호출했다. 회원 잔액을 증가시키는 호출이 없어 결제 상태와 포인트 잔액이 분리되어 있었다. 근거: MIKY-0의 509970d(2026-11-05). 당시 실행 로그는 확인되지 않았다.",
    analysis:
      "509970d의 변경 전후 PaymentService.complete()를 비교했다. 기존 코드에서 User를 조회하고 있었지만 최종 처리 단계에서 해당 객체의 포인트를 수정하지 않았음을 확인했다. 이는 코드와 커밋 메시지로 확인한 원인이며, 개발 당시의 조사 순서는 기록되어 있지 않다.",
    alternatives:
      "기존 구현은 결제 상태만 저장했다. 적용된 방식은 UserRepository에서 회원을 조회하고 동일 트랜잭션에서 포인트를 증가시키는 것이다. 별도 비동기 지급 방식은 지급 재시도 설계가 추가로 필요하지만, 실제 검토·시도 기록은 없어 당시 대안으로 단정하지 않는다.",
    decision:
      "기존 @Transactional 메서드에서 관리 중인 회원 엔티티를 수정하는 방식을 적용했다. 결제 상태와 회원 포인트를 함께 변경하여 내부 데이터 변경을 하나의 트랜잭션으로 묶는 구조다.",
    beforeCode:
      '// 509970d 변경 전: 검증을 통과한 뒤\npayment.confirmPay();\nlog.info("payment 수정 후 : {}", payment.getStatus());\nreturn new PaymentRes.CompleteDto(payment.getAmount());',
    afterCode:
      "// 509970d 변경 후: 검증을 통과한 뒤\npayment.confirmPay();\nuser.chargePoint(payment.getAmount());\nreturn new PaymentRes.CompleteDto(payment.getAmount());",
    verification:
      "개발 과정에서 테스트 코드를 실행했다(개발자 확인). 509970d의 변경 전후 코드와 현재 PaymentService를 대조하여 결제 완료 시 포인트 지급 호출이 추가되고 유지되는 것을 확인했다. 결제 조회 관련 테스트는 PaymentTest에 작성되어 있다.",
    limitations:
      "외부 결제 성공과 내부 DB 커밋은 하나의 원자적 트랜잭션이 아니다. 내부 반영 실패 시 재조회·재처리와 웹훅 기반 정합성 복구를 보완할 수 있다. 결제 상태와 실제 잔액 변경을 각각 확인해야 한다는 점이 드러나는 사례다.",
  },
  {
    id: "case-017",
    memberId: "m2",
    title: "개인회원 전용 충전 로직을 기업회원까지 구분하도록 확장",
    category: "Payment",
    tags: ["LoginIdentity", "JPA", "회원 유형", "포인트"],
    draft: false,
    featured: false,
    summary:
      "개인회원만 조회하던 결제 로직을 로그인 유형에 따라 분기하여 기업회원도 자신의 결제 내역과 포인트 잔액을 사용하도록 변경했다.",
    background:
      "개인회원은 행사 참가비를, 기업회원은 행사 보증금을 포인트로 납부하므로 두 유형 모두 충전 기능이 필요했다.",
    symptoms:
      "기존 메서드는 Long userId를 받고 UserRepository만 사용했다. 기업 로그인 유형을 표현하거나 Company 잔액을 충전하는 경로가 없었다. 실제 오충전 사고가 발생했다는 로그는 없으며, 코드상 지원 범위의 문제다. 근거: ab03d14(2026-11-06).",
    analysis:
      "ab03d14에서 createPayment(), complete(), currentPoint()의 입력과 조회 대상을 비교했다. 숫자 ID만으로 처리하던 구조에 계정 유형 정보가 추가되었고, 결제 소유자 검사도 LoginIdentity를 받도록 변경되었다.",
    alternatives:
      "개인회원 전용 흐름을 유지하는 기존 구조와 공통 서비스 내부에서 유형을 분기하는 변경 구조가 확인된다. 회원 유형별 서비스를 완전히 분리하는 방안은 분기 제거에 도움이 될 수 있지만, 실제 검토 기록은 없다.",
    decision:
      "LoginIdentity의 isUser()/isCompany()로 회원 유형을 구분하고 각각 User 또는 Company에 연결된 결제건을 생성했다. 충전 완료와 잔액 조회도 동일한 유형 구분을 사용하도록 맞췄다.",
    beforeCode:
      '// ab03d14 변경 전\npublic String createPayment(Long userId, int amount) {\n    String paymentId = createPaymentId(userId);\n    User user = userRepository.findById(userId)\n            .orElseThrow(() -> new RuntimeException("유저없음 추후 변경."));\n    // 이후 user에 연결된 결제건 생성\n}',
    afterCode:
      '// ab03d14 변경 후: 충전 반영 부분 발췌\nif (loginIdentity.isUser()) payment.getUser().chargePoint(payment.getAmount());\nelse if (loginIdentity.isCompany()) payment.getCompany().chargePoint(payment.getAmount());\nelse throw new Exception400("결제 처리가 완료되지 않았습니다.");',
    verification:
      "개발 과정에서 테스트 코드를 실행했다(개발자 확인). ab03d14와 현재 PaymentService를 대조하여 개인·기업별 결제 생성, 결제 소유자 검사, 충전 반영 및 잔액 조회가 로그인 유형에 따라 처리되는 것을 확인했다.",
    limitations:
      "회원 유형이 늘어나면 여러 메서드의 분기를 함께 수정해야 한다. 또한 제시한 변경 후 코드는 당시 커밋의 발췌이며, 현재 버전은 잔액 갱신 전 회원·기업을 잠금 조회하는 처리가 추가되어 있다.",
  },
  {
    id: "case-018",
    memberId: "m2",
    title: "네이버페이 고정 설정을 분리하여 카카오페이 충전 지원",
    category: "Payment",
    tags: ["PortOne", "Naver Pay", "Kakao Pay", "결제 수단"],
    draft: false,
    featured: false,
    summary:
      "네이버페이 설정으로 고정되어 있던 결제 준비·조회 경로를 결제 수단별로 분리하고, 충전 내역에도 사용한 결제 수단을 전달했다.",
    background:
      "네이버페이 기반 포인트 충전에 카카오페이를 추가하면서 결제 수단에 맞는 채널·상점 설정과 내역 표시가 필요했다.",
    symptoms:
      "기존 prepare()는 네이버페이 채널 키와 상점 ID만 반환했다. 기존 complete()에도 결제 수단 인자가 없어 카카오페이를 독립적으로 처리할 수 없는 구조였다. 실제 결제 오류 로그는 확인되지 않았다.",
    analysis:
      "0aa8656(2026-11-17)에서 PaymentPortOneService와 결제 컨트롤러 변경을 확인했다. 432db6b(2026-11-20)에서는 결제 수단 정보를 응답 DTO와 포인트 내역까지 전달하는 변경을 확인했다.",
    alternatives:
      "결제 수단별 서비스를 복제하면 개별 변경은 쉽지만 공통 검증 로직이 중복된다. 적용된 구현은 공통 서비스에 payType을 전달하여 설정만 분기했다. 서비스 복제 방안을 실제 시도한 기록은 없다.",
    decision:
      "공통 결제 검증·포인트 반영 흐름을 재사용하면서 결제 준비와 외부 조회에 결제 수단을 전달했다. PaymentTypeStatus로 NAVER/KAKAO를 구분하여 내역 표시에도 활용했다.",
    beforeCode:
      "// 0aa8656 변경 전\nreturn PaymentRes.PrepareDto.builder()\n        .channelKey(portOneApiConst.getNaverChannelKey())\n        .paymentId(paymentId)\n        .storeId(portOneApiConst.getNaverStoreId())\n        .amount(amount)\n        .build();",
    afterCode:
      "// 0aa8656 변경 후: 카카오 분기 발췌\nelse if (payType.equals(Define.KAKAO)) {\n    return PaymentRes.PrepareDto.builder()\n            .channelKey(portOneApiConst.getKakaoChannelKey())\n            .paymentId(paymentId)\n            .storeId(portOneApiConst.getKakaoStoreId())\n            .amount(amount)\n            .build();\n}\n// 결제 조회에도 수단 전달\nportOnePayment = portOneApiConst.paymentInfo(paymentId, payType);",
    verification:
      "개발 과정에서 테스트 코드를 실행했다(개발자 확인). 0aa8656과 432db6b의 변경 내역에서 결제 수단별 설정 분기, PaymentTypeStatus 저장, 응답 DTO 전달 및 화면 반영 코드를 확인했다.",
    limitations:
      "현재 prepare()는 알 수 없는 payType에 null을 반환한다. enum 기반 입력 검증과 명시적 예외 처리를 보완할 수 있다. 클라이언트가 전달한 수단과 저장된 결제 수단의 일치 여부도 검증 대상이다.",
  },
  {
    id: "case-019",
    memberId: "m2",
    title: "회차별 보증금에 전체 회차 수가 곱해지는 계산 구조 수정",
    category: "Payment",
    tags: ["Deposit", "JPA", "비관적 잠금", "회차별 결제"],
    draft: false,
    featured: false,
    summary:
      "개별 회차의 보증금에 전체 회차 수를 곱하던 계산을 회차당 고정 금액으로 수정하고, 기업 잔액을 잠금 조회하도록 변경했다.",
    background:
      "기업은 각 행사 회차에 대해 보증금을 납부한다. 현재 기준 금액은 회차당 150,000포인트이며, 납부 내역도 회차별로 저장한다.",
    symptoms:
      "변경 전 Deposit 생성자는 eventSession과 sessionCount를 함께 받고 amount를 sessionCount * SESSION_DEPOSIT으로 계산했다. 여러 회차가 있는 행사의 단일 회차 결제에서 전체 회차 수만큼 금액이 산정되는 구조였다. 근거: 98fd18a(2026-11-16). 실제 과다 차감 로그는 확인되지 않았다.",
    analysis:
      "DepositService가 전체 회차 수를 조회해 생성자에 전달하는 부분과 Deposit.amount 계산식을 함께 확인했다. 회차 단위 저장 구조와 행사 전체 회차 수를 사용하는 계산 단위가 일치하지 않았다.",
    alternatives:
      "전체 행사 보증금을 한 번에 결제하려면 저장 모델과 납부 흐름도 행사 단위로 맞춰야 한다. 적용된 변경은 회차별 저장 구조를 유지하고 금액도 회차별 고정 금액으로 맞추는 방식이다. 행사 단위 결제 방안을 실제 구현한 기록은 없다.",
    decision:
      "payDeposit()과 Deposit 생성자에서 sessionCount를 제거하고 SESSION_DEPOSIT을 직접 사용했다. 동일 커밋에서 Company 조회를 LockFindById로 바꾸어 잔액 갱신 시 잠금 조회를 사용했다.",
    beforeCode:
      '// 98fd18a 변경 전: Deposit 생성자 내부\nthis.amount = sessionCount * SESSION_DEPOSIT;\n// DepositService\nCompany company = companyRepository.findById(companyId)\n        .orElseThrow(() -> new Exception404("존재하지 않는 기업세션입니다"));',
    afterCode:
      '// 98fd18a 변경 후: Deposit 생성자 내부\nthis.amount = SESSION_DEPOSIT;\n// DepositService\nCompany company = companyRepository.LockFindById(companyId)\n        .orElseThrow(() -> new Exception404("존재하지 않는 기업세션입니다"));\nDeposit deposit = Deposit.builder()\n        .company(company)\n        .eventSession(eventSession)\n        .build();',
    verification:
      "개발 과정에서 테스트 코드를 실행했다(개발자 확인). DepositTest에는 선택한 회차의 150,000P 차감·납부 내역 저장, 중복 납부 시 추가 차감 방지, 잔액 부족 시 상태 변경 방지를 검사하는 테스트가 작성되어 있다. 98fd18a에서 전체 회차 수를 곱하던 계산식이 회차당 고정 금액으로 변경된 것도 확인했다.",
    limitations:
      "Mockito 단위 테스트만으로 실제 DB 잠금 경합과 동시 결제를 검증할 수 없다. 실제 DB 기반 동시성 테스트와 잠금 순서 검증을 추가할 수 있다.",
  },
  {
    id: "case-020",
    memberId: "m2",
    title: "기업의 참가 거절 시 포인트 반환과 구매·환불 이력을 함께 갱신",
    category: "Payment",
    tags: ["Refund", "Transaction", "상태 전이", "JPA"],
    draft: false,
    featured: false,
    summary:
      "참가 거절 환불에서 잔액만 증가시키던 처리를 수정하여 구매 상태 변경과 환불 이력 저장을 함께 수행하고, 구매 내역이 없는 신청을 검사했다.",
    background:
      "주최 기업이 유료 참가 신청을 거절하면 참가자에게 결제한 포인트 전액을 반환하고, 구매·환불 화면에서도 해당 결과가 일치해야 했다.",
    symptoms:
      "0b3ba20 변경 전 refundByCompany()는 user.addPoint(amount)까지만 처리했다. 구매 상태를 환불로 변경하거나 Refund를 저장하는 코드가 없어 잔액과 이력이 불일치하는 구조였다. 무료 신청 등 purchase가 없는 경우를 위한 명시적 검사도 부족했다.",
    analysis:
      "0b3ba20(2026-11-17)의 전후 코드를 비교하여 Refund 생성·저장과 purchase.setPurchaseRefunded()가 추가된 것을 확인했다. 동시에 회원 잠금 조회와 purchase == null 검사가 추가되었다.",
    alternatives:
      "화면에서 신청 거절 상태만 보고 환불을 추정하면 잔액 변경 근거가 저장되지 않는다. 적용된 방식은 환불 엔티티를 저장하고 구매 상태도 변경하는 것이다. 화면 추정 방식을 실제 시도했다는 기록은 없다.",
    decision:
      "회원 포인트 증가, 구매 상태 전환, Refund 저장을 @Transactional 환불 메서드 안에서 처리했다. 신청 상태·결제 이력·금액 검증을 통과한 후 데이터를 함께 변경하도록 구성했다.",
    beforeCode:
      "// 0b3ba20 변경 전: refundByCompany() 마지막 처리\nint amount = RefundPolicy.forCompanyReject(purchase.getPrice());\nuser.addPoint(amount);",
    afterCode:
      "// 0b3ba20 변경 후: 마지막 처리 발췌\nint amount = RefundPolicy.forCompanyReject(purchase.getPrice());\nRefund refund = Refund.builder()\n        .user(user)\n        .purchase(purchase)\n        .amount(amount)\n        .build();\nuser.addPoint(amount);\npurchase.setPurchaseRefunded();\nrefundRepository.save(refund);",
    verification:
      "개발 과정에서 테스트 코드를 실행했다(개발자 확인). RefundServiceTest에는 기업의 신청 반려 시 포인트 전액 반환, 구매 상태의 REFUNDED 전환, 환불 이력 저장을 검사하는 테스트와 연결된 구매가 없을 때 지급하지 않는 테스트가 작성되어 있다. 0b3ba20에서 관련 상태 변경과 저장 호출이 추가된 것을 확인했다.",
    limitations:
      "유료·무료 신청의 서비스 호출 규칙을 상위 흐름과 맞춰야 한다. 중복·동시 환불 방지는 실제 DB 잠금과 개별 구매 상태 검사를 포함한 통합 검증이 필요하다. 다른 행사 취소·개인 취소 환불도 동일한 정합성 기준으로 관리해야 한다.",
  },
  {
    id: "case-021",
    memberId: "m2",
    title: "행사 시작·종료 상태를 자동 전환하고 정상 종료 보증금 반환 연결",
    category: "Backend",
    tags: ["Spring Scheduler", "TaskScheduler", "Transaction", "보증금 반환"],
    draft: false,
    featured: false,
    summary:
      "행사 회차의 시작 예약과 종료 주기 작업을 추가하여 진행 상태를 변경하고, 정상 종료된 회차의 기업 보증금을 반환하도록 연결했다.",
    background:
      "행사 시간이 지나면 회차 상태가 실제 일정과 일치해야 하며, 정상 종료된 행사에 대해서는 기업 보증금이 반환되어야 했다.",
    symptoms:
      "5f9a16b 이전 버전에는 해당 EventSessionScheduler 파일과 startSession()/completedSession() 처리 경로가 없었다. 자동 전환·정산 연결 기능의 부재로 확인되며, 실제 지연 건수나 운영 장애 로그는 확인되지 않았다.",
    analysis:
      "5f9a16b(2026-11-19)에서 추가한 스케줄러·서비스·대상 조회 쿼리를 확인했다. 시작과 종료를 서로 다른 예약 방식으로 처리하고, 종료 상태 변경 뒤 refundEventCompleted()를 호출하는 구조를 확인했다.",
    alternatives:
      "시작은 TaskScheduler의 회차별 예약, 종료는 4시간 주기의 대상 조회로 구현되었다. 전부 주기 조회로 통일하거나 영속 작업 큐를 사용하는 대안은 개선 시 비교할 수 있으나 당시 시도 기록은 없다.",
    decision:
      "시작 시각에는 개별 작업을 예약하고, 종료는 주기적으로 후보 회차를 조회한 뒤 회차별 트랜잭션에서 상태 전환과 반환을 처리했다. 현재 스케줄러는 @Component로 등록되어 있다. 최초 5f9a16b 버전에는 이 등록 어노테이션이 없으므로 최초 커밋만으로 실행 가능했다고 판단하지 않았다.",
    beforeCode:
      "// 5f9a16b 이전 구조\n// EventSessionScheduler 파일 없음\n// EventSessionService에 startSession(), completedSession() 없음",
    afterCode:
      '// 5f9a16b 추가 코드: 시작 예약\npublic void processEventStarted(EventSession es) {\n    taskScheduler.schedule(() -> eventSessionService.startSession(es.getId()),\n            es.getStartsAt().atZone(CommunityPolicy.ZONE).toInstant());\n}\n// completedSession() 핵심 처리\nes.setCompleted();\nrefundService.refundEventCompleted(company.getId(), es.getId());\n// 종료 조회 작업 주기\n// @Scheduled(cron = "0 0 */4 * * *", zone = "Asia/Seoul")',
    verification:
      "개발 과정에서 테스트 코드를 실행했으며, 로컬 XML 결과에서도 EventSessionSchedulerTest의 3개 테스트가 모두 통과한 기록을 확인했다(2026-11-19, tests=3, failures=0, errors=0, skipped=0). 검증 항목은 회차 시작 시각의 작업 예약, 한 회차의 종료 처리 실패 후 다음 회차 처리, 종료 대상이 없을 때 처리 미호출이다. 결과 파일: build/test-results/test/TEST-com.busan.eventplatform.event.eventSession.EventSessionSchedulerTest.xml. 별도로 RefundServiceTest에는 정상 종료 시 보증금을 한 번만 반환하고 별도 환불 기록을 만들지 않는 테스트가 작성되어 있다.",
    limitations:
      "종료 처리는 최대 다음 4시간 주기까지 지연될 수 있다. 메모리 기반 시작 예약은 재시작 시 재등록을 검토해야 하고, 다중 인스턴스에서는 중복 실행을 고려해야 한다. 스케줄러 등록과 실제 호출 경로도 기능 구현과 별도로 검증해야 한다.",
  },
  {
    id: "case-022",
    memberId: "m2",
    title: "포인트 내역에 결제 수단이 빠지는 문제와 화면 구분 개선",
    category: "Frontend",
    tags: ["Mustache", "DTO", "포인트 내역", "결제 수단"],
    draft: false,
    featured: false,
    summary:
      "저장된 결제 수단을 응답 DTO와 내역 생성 흐름까지 전달하고, 개인·기업 포인트 내역 화면의 정보 구분을 개선했다.",
    background:
      "사용자는 보유 포인트뿐 아니라 충전·행사 구매·환불 내역과 충전에 사용한 결제 수단을 확인할 수 있어야 했다. MIKY-0는 구매·충전 내역 구현 후 표시 정보를 보완했다.",
    symptoms:
      "432db6b 변경 전 내역 생성 흐름에는 결제 수단 전달이 빠져 있었다. 저장된 NAVER/KAKAO 정보를 내역 DTO와 화면까지 이어주는 변경이 필요했다. 잘못 표시된 실제 화면 캡처는 확인되지 않았다.",
    analysis:
      "467bf60의 구매·충전 내역 구현과 432db6b의 PaymentRes/PurchaseRes/PurchaseService 변경을 확인했다. 이후 915deff에서는 기업 포인트 내역 화면과 CompanyPointResponse가 수정되었다. 이는 협업으로 발전한 기능이므로 현재 포인트 내역 전체를 MIKY-0 단독 구현으로 보지 않는다.",
    alternatives:
      "브라우저에서 직전 선택한 결제 수단만 표시하면 과거 내역과 일치하지 않을 수 있다. 적용된 방식은 저장된 Payment의 유형을 DTO로 전달하는 것이다. 브라우저 상태 기반 표시를 실제 시도한 기록은 없다.",
    decision:
      "저장된 결제 수단을 내역 데이터에 포함하고 Mustache 화면에서 표현하도록 연결했다. 데이터 출처를 결제 이력으로 유지하고 화면에서는 충전·사용 등 정보를 구분하도록 수정했다.",
    beforeCode:
      "// 432db6b 변경 전: 충전 내역 생성 핵심 구조\n// occurredAt / typeLabel / title / statusLabel / amount 전달\n// typeStatus 전달 없음",
    afterCode:
      '// 현재 PurchaseService.pointHistory()의 관련 부분 발췌\npaymentService.paymentList(userId).forEach(payment -> history.add(\n        PurchaseRes.PointHistoryDto.builder()\n                .occurredAt(payment.getPaidAt())\n                .typeLabel("충전")\n                .title("포인트 충전")\n                .typeStatus(payment.getTypeStatus())\n                .statusLabel("충전 완료")\n                .amount(payment.getAmount())\n                .build()));',
    verification:
      "개발 과정에서 테스트 코드를 실행했다(개발자 확인). 467bf60, 432db6b, 915deff와 현재 코드를 대조하여 구매·충전 내역 조회, 충전 수단의 DTO 전달, 개인·기업 포인트 내역 화면 변경을 확인했다. 이 항목에서 확인한 화면 관련 근거는 템플릿과 데이터 전달 코드다.",
    limitations:
      "beforeCode는 변경 전 데이터 흐름의 설명이며 실행 가능한 원본 코드가 아니다. afterCode는 현재 관련 부분 발췌다. 충전 수단이 없는 과거 데이터의 표시 방식과 내역 증가 시 조회 성능은 추가 검증 대상이다.",
  },
  {
    id: "case-023",
    memberId: "m2",
    title: "행사 카드에 대표 이미지가 두 번 표시되는 중복 마크업 제거",
    category: "Frontend",
    tags: ["Mustache", "HTML", "행사 카드", "중복 렌더링"],
    draft: false,
    featured: false,
    summary:
      "대표 이미지를 출력하는 두 개의 영역 중 중복 영역을 제거하여 카드의 이미지 표시 경로를 하나로 정리했다.",
    background:
      "행사 목록 카드에서 대표 이미지를 보여주는 공통 Mustache 템플릿을 사용하고 있었다.",
    symptoms:
      "변경 전 event-card.mustache에는 imageUrl을 사용하는 영역과 /event-files/{{id}}를 사용하는 영역이 나란히 존재했다. 두 경로가 모두 유효하면 이미지가 두 개 표시될 수 있었다. 915deff(2026-11-20)의 커밋 메시지에도 이미지가 두 개 보이는 버그 수정이라고 명시되어 있다.",
    analysis:
      "915deff의 템플릿 diff에서 event-card__visual 영역이 두 번 선언된 것을 확인했다. 각 영역이 별도 img를 출력하므로 데이터 조회보다 템플릿의 중복 출력 구조가 직접적인 원인으로 확인된다.",
    alternatives:
      "CSS로 한 영역을 숨기면 중복 DOM과 이미지 요청 경로가 남는다. 실제 변경은 중복 마크업 자체를 제거하는 방식이다. CSS 숨김을 먼저 시도했다는 기록은 없다.",
    decision:
      "imageUrl을 사용하는 기존 영역과 기본 안내 요소를 유지하고 /event-files/{{id}} 이미지 영역을 삭제했다. 하나의 카드에서 대표 이미지 출력 경로를 하나로 정리했다.",
    beforeCode:
      '<!-- 915deff 변경 전: 관련 영역 축약 -->\n<div class="event-card__visual">\n  {{#imageUrl}}<img class="event-card__image" src="{{imageUrl}}" alt="">{{/imageUrl}}\n</div>\n<div class="event-card__visual">\n  <img src="/event-files/{{id}}" alt="{{title}} 대표 이미지"\n       onerror="this.parentElement.style.display=\'none\'">\n</div>',
    afterCode:
      '<!-- 915deff 변경 후: 이미지와 기본 안내 요소 발췌 -->\n<div class="event-card__visual" data-category="{{#categoryName}}{{categoryName}}{{/categoryName}}" aria-hidden="true">\n  {{#imageUrl}}\n    <img class="event-card__image" src="{{imageUrl}}" alt="" loading="lazy" decoding="async">\n  {{/imageUrl}}\n  <span class="event-card__art">DISCOVER<br>BUSAN</span>\n  <span class="event-card__visual-caption">이미지 준비 중</span>\n</div>',
    verification:
      "915deff의 변경 전후 템플릿을 비교하여 대표 이미지를 출력하던 두 번째 영역이 제거되고 imageUrl 기반 표시 영역 하나로 정리된 것을 확인했다. 해당 커밋 메시지에도 이미지가 두 개 보이는 버그 수정이 명시되어 있다. 제시한 변경 전 코드는 비교를 위한 축약본이다.",
    limitations:
      "imageUrl이 존재하지만 요청이 실패하는 경우의 대체 표시 동작은 별도로 검증해야 한다. 이미지 유무·잘못된 URL·지연 로딩 조합을 브라우저에서 확인할 수 있다.",
  },

  {
    id: "case-024",
    memberId: "m3",
    title:
      "행사 단위 접수 기간을 회차별 접수 기간으로 분리해 신청 가능 여부 판단 수정",
    category: "Backend",
    tags: ["Java", "Spring Boot", "JPA", "Event", "EventSession"],
    draft: false,
    featured: false,
    summary:
      "하나의 행사에 여러 회차가 존재하는 구조에서 행사 자체의 접수 기간을 기준으로 신청 가능 여부를 판단하면 회차별 접수 기간을 독립적으로 운영하기 어려웠다. 접수 시작일과 종료일을 Event에서 EventSession으로 이동하고, 신청 마감 여부도 선택한 회차를 기준으로 판단하도록 변경했다.",
    background:
      "행사 하나에 여러 회차가 존재할 수 있도록 Event와 EventSession을 분리했다.\n\n각 회차는 서로 다른 일정과 신청 기간을 가질 수 있어야 했다.\n\n그런데 기존에는 접수 기간이 Event에 포함되어 있어 여러 회차가 동일한 접수 기간을 공유하는 구조였다.",
    symptoms:
      "- 하나의 행사에 여러 회차가 있을 때 회차별로 접수 기간을 다르게 설정하기 어려웠다.\n- 신청 가능 여부를 판단하는 로직도 Event의 접수 기간을 기준으로 동작하고 있었다.",
    analysis:
      "문제는 신청 마감 여부를 판단하는 데이터의 **소유 위치**에 있었다.\n\n접수 기간은 행사 전체의 공통 속성이 아니라 실제 신청 대상인 회차의 속성이어야 했다.\n\n따라서 Event에 접수 기간을 두는 구조 자체를 변경할 필요가 있었다.",
    alternatives:
      "**방법 1. Event의 접수 기간을 유지하고 회차별 예외 조건을 추가하는 방식**\n\n- 기존 구조를 유지할 수 있다.\n- 하지만 회차별 접수 기간을 관리하기 어렵고 조건이 복잡해진다.\n\n**방법 2. EventSession에 접수 기간을 이동하는 방식 (선택)**\n\n- 회차별로 접수 기간을 독립적으로 관리할 수 있다.\n- 신청 가능 여부를 판단할 때 선택한 회차의 정보를 사용하면 된다.",
    decision:
      "접수 시작일과 종료일을 EventSession에서 관리하도록 변경했다.\n\n신청 마감 여부를 판단하는 `getClosedReason`에서도 Event가 아닌 선택한 session의 접수 기간을 사용하도록 수정했다.",
    beforeCode:
      "// 기존 구조의 핵심\nevent.getApplyStartAt();\nevent.getApplyEndAt();",
    afterCode:
      "// 변경된 구조의 핵심\nsession.getApplyStartAt();\nsession.getApplyEndAt();\n\n// 신청 마감 판단도 선택한 회차 기준으로 수행\ngetClosedReason(session);",
    verification:
      "접수 기간 관련 필드를 Event에서 EventSession으로 이동하고, `getClosedReason`에서 session의 접수 시작일과 종료일을 사용하도록 수정한 기록이 확인된다.\n\n> 다만 회차별 접수 기간이 서로 다를 때 신청 기능 전체가 정상 동작하는지에 대한 최종 테스트 결과는 별도 확인이 필요하다.",
    limitations:
      "- 접수 기간을 회차로 이동하면 기존 Event에 저장되어 있던 접수 기간 데이터의 이전도 고려해야 한다.\n- 이후 회차별 신청 가능 여부를 판단하는 모든 로직에서 Event의 접수 기간을 참조하지 않는지 확인해야 한다.",
  },
  {
    id: "case-025",
    memberId: "m3",
    title: "카테고리 수정 시 자기 자신의 이름까지 중복으로 판단하는 문제 해결",
    category: "Backend",
    tags: ["Java", "Spring Boot", "JPA", "EventCategory"],
    draft: false,
    featured: false,
    summary:
      "카테고리 수정 시 기존 이름을 유지해도 중복 오류가 발생할 수 있었다. 이름이 같은 카테고리가 조회되더라도 현재 수정 대상과 동일한 ID라면 중복으로 처리하지 않도록 변경했다.",
    background:
      "관리자가 행사 카테고리를 등록하고 수정할 수 있도록 기능을 구현했다.\n\n카테고리 이름은 중복으로 등록되면 안 되지만, 기존 이름을 그대로 유지하는 수정은 허용해야 했다.",
    symptoms:
      "기존 카테고리의 이름을 변경하지 않고 수정하는 경우에도 이름 중복으로 판단될 수 있었다.\n\n단순히 같은 이름의 카테고리가 존재하는지만 검사하면 수정 대상 자신도 조회 결과에 포함되기 때문이다.",
    analysis:
      "신규 등록과 수정은 중복 검사 기준이 달라야 했다.\n\n신규 등록은 같은 이름이 하나라도 존재하면 중복이지만, 수정은 조회된 카테고리가 현재 수정하려는 카테고리 자신인지 다른 카테고리인지 구분해야 했다.",
    alternatives:
      "**방법 1. 이름이 같은 카테고리가 존재하는지만 확인**\n\n- 자기 자신도 중복으로 판단하는 문제가 있다.\n\n**방법 2. 조회된 카테고리 ID와 현재 수정 대상 ID 비교 (선택)**\n\n- 자기 자신은 제외하고 다른 카테고리와의 중복만 검사할 수 있다.",
    decision:
      "`findByName()`으로 같은 이름의 카테고리를 조회한 다음, 조회 결과의 ID가 현재 수정 대상 ID와 다른 경우에만 중복 오류를 발생시키도록 변경했다.",
    beforeCode:
      'EventCategory findCategory =\n    eventCategoryRepository.findByName(dto.getName());\n\nif (findCategory != null) {\n    throw new Exception400("이미 존재하는 카테고리입니다");\n}',
    afterCode:
      'EventCategory findCategory =\n    eventCategoryRepository.findByName(dto.getName());\n\nif (findCategory != null\n    && !findCategory.getId().equals(id)) {\n    throw new Exception400("이미 존재하는 카테고리입니다");\n}',
    verification:
      "- 동일한 이름을 가진 카테고리가 조회되더라도 현재 수정 대상과 ID가 같으면 중복 오류를 발생시키지 않도록 조건을 변경했다.\n- 다른 카테고리의 이름을 사용하면 중복으로 판단하도록 구성했다.\n\n> 실제 테스트 실행 결과는 현재 기록에서 확인되지 않는다.",
    limitations:
      "서비스 로직에서 중복을 확인하더라도 동시에 같은 이름으로 등록하는 요청이 들어오는 경우까지 완전히 방지할 수는 없다.\n\n데이터베이스 `UNIQUE` 제약 조건을 함께 적용하면 중복 데이터 저장을 추가로 방지할 수 있다.",
  },
  {
    id: "case-026",
    memberId: "m3",
    title:
      "동일 회원의 행사 좋아요 중복 등록을 방지하도록 관계 데이터 관리 개선",
    category: "Backend",
    tags: ["Java", "Spring Boot", "JPA", "EventFavorite", "Unique Constraint"],
    draft: false,
    featured: false,
    summary:
      "회원과 행사 사이의 좋아요 관계에서 동일 회원이 같은 행사에 중복으로 좋아요를 등록하지 못하도록 구성했다. 회원 ID와 행사 ID의 조합을 기준으로 중복을 방지하고, 좋아요 취소 시 해당 관계 데이터를 제거하는 구조로 정리했다.",
    background:
      "회원이 관심 있는 행사를 좋아요로 등록하고, 다시 취소할 수 있는 기능을 구현했다.\n\n좋아요는 회원과 행사 사이의 관계이므로 EventFavorite을 통해 관리했다.",
    symptoms:
      "좋아요는 회원과 행사의 조합으로 관리해야 한다.\n\n동일 회원이 동일 행사에 여러 번 좋아요를 요청하면 중복 데이터가 생성될 수 있으므로 이를 방지할 필요가 있었다.",
    analysis:
      "좋아요 데이터는 단순히 행사 ID만으로 구분할 수 없다.\n\n서로 다른 회원이 같은 행사를 좋아요 할 수 있기 때문이다.\n\n따라서 회원 ID와 행사 ID를 하나의 조합으로 관리해야 했다.\n\n또한 서비스 로직에서만 중복을 확인하면 동시 요청 상황에서 중복 데이터가 들어갈 가능성이 남는다.",
    alternatives:
      "**방법 1. 서비스에서 기존 좋아요를 조회하고 없으면 저장**\n\n- 일반적인 중복 요청을 방지할 수 있다.\n- 하지만 동시에 요청이 들어오는 상황에서는 한계가 있다.\n\n**방법 2. DB에 회원 ID와 행사 ID의 복합 UNIQUE 제약 조건 적용 (선택)**\n\n- 동일한 회원과 행사의 조합이 중복 저장되는 것을 데이터베이스 수준에서 방지할 수 있다.\n\n**방법 3. 좋아요 취소 시 데이터 삭제 (선택)**\n\n- 별도의 취소 상태를 두지 않고 관계 데이터를 제거하는 방식이다.",
    decision:
      "EventFavorite에서 `user_id`와 `event_id` 조합을 유일하게 관리하고, 좋아요 취소 시 해당 관계 데이터를 제거하는 구조로 정리했다.",
    beforeCode: "// 회원과 행사 조합의 중복을 별도로 제한하지 않는 구조",
    afterCode:
      '@Table(\n    uniqueConstraints = {\n        @UniqueConstraint(\n            columnNames = {"user_id", "event_id"}\n        )\n    }\n)\n// 실제 컬럼명과 엔티티 선언은 프로젝트 코드 확인 필요',
    verification:
      "회원 ID와 행사 ID 조합에 UNIQUE 제약 조건을 적용하고 좋아요 취소 기능을 함께 관리하는 방향이 과거 작업 기록에서 확인된다.\n\n> 중복 요청 및 취소 후 재등록에 대한 최종 실행 결과는 별도 확인이 필요하다.",
    limitations:
      "DB UNIQUE 제약 조건만으로 사용자에게 친절한 중복 요청 응답을 제공할 수는 없다.\n\n서비스에서 중복 여부를 먼저 확인하고, 데이터베이스 제약 조건을 최종 방어선으로 사용하는 방식이 적절하다.",
  },
  {
    id: "case-027",
    memberId: "m3",
    title: "행사 전용 파일 저장 구조를 공통 파일 저장소와 연결하도록 변경",
    category: "Backend",
    tags: ["Java", "Spring Boot", "JPA", "EventFile", "FileStorage"],
    draft: false,
    featured: false,
    summary:
      "행사에 첨부되는 파일을 행사 도메인 내부에서 별도로 관리하는 대신 공통 파일 저장소와 연결하는 구조로 정리했다. 파일 자체의 저장 정보와 행사와의 연결 정보를 분리해 공통 파일 관리 구조를 활용하도록 변경했다.",
    background:
      "행사 등록 및 수정 과정에서 대표 이미지나 첨부파일을 연결할 필요가 있었다.\n\n파일 저장 기능은 행사뿐 아니라 다른 도메인에서도 활용할 수 있으므로 공통 저장소를 사용하는 방향으로 구성했다.",
    symptoms:
      "- 행사 파일 정보를 행사 도메인에서 직접 관리하면 파일 저장 및 관리 로직이 다른 도메인과 중복될 수 있었다.\n- 파일 자체의 정보와 특정 행사에 연결된 파일 정보도 구분할 필요가 있었다.",
    analysis:
      "파일 데이터와 행사와의 관계는 서로 다른 책임을 가진다.\n\n파일 저장소는 실제 파일의 경로, 이름 등 파일 자체의 정보를 관리하고, EventFile은 해당 파일이 어떤 행사에 연결되는지 관리하는 구조가 적절했다.",
    alternatives:
      "**방법 1. Event 테이블에 파일 경로를 직접 저장**\n\n- 단순하다.\n- 하지만 여러 파일을 관리하거나 다른 도메인에서 재사용하기 어렵다.\n\n**방법 2. EventFile에서 파일 정보를 모두 관리**\n\n- 행사 파일은 관리하기 쉽다.\n- 하지만 다른 도메인에서 동일한 파일 관리 로직이 반복될 수 있다.\n\n**방법 3. 공통 FileStorage와 EventFile을 연결 (선택)**\n\n- 파일 저장 책임과 행사 연결 책임을 분리할 수 있다.\n- 공통 파일 기능을 다른 도메인에서도 재사용할 수 있다.",
    decision:
      "공통 FileStorage를 활용하고 EventFile을 통해 행사와 파일의 관계를 관리하는 방향으로 변경했다.",
    beforeCode:
      "// 행사 도메인에서 파일 정보를 직접 관리하는 구조\n// 실제 변경 전 코드 전문은 기록에서 확인되지 않음",
    afterCode:
      "// 구조 개념\nEvent\n    |\n    | 1:N\n    |\nEventFile\n    |\n    | N:1\n    |\nFileStorage",
    verification:
      "공통 FileStorage와 EventFile을 연결하는 구조로 작업한 내용은 확인된다.\n\n> 실제 파일 업로드, 행사 연결, 파일 조회 및 삭제까지 전체 흐름이 정상 동작했는지는 현재 기록에서 확인되지 않는다.",
    limitations:
      "- 파일 자체를 삭제하는 것과 행사와의 연결만 해제하는 것은 구분해야 한다.\n- 다른 도메인에서도 사용하는 공통 파일이라면 행사 삭제 시 실제 파일까지 삭제하지 않도록 삭제 정책을 명확하게 정해야 한다.",
  },
  {
    id: "case-028",
    memberId: "m3",
    title: "종료된 회차가 없는 행사에서 후기 탭이 노출되는 문제",
    category: "Backend",
    tags: [
      "Java",
      "Spring Boot",
      "JPA",
      "EventReview",
      "EventSession",
      "Mustache",
    ],
    draft: false,
    featured: false,
    summary:
      "여러 회차로 구성된 행사에서 일부 회차가 종료되면 행사 상세 화면에 후기 탭을 노출하도록 구현했다. 하지만 아직 종료된 회차가 하나도 없는 행사에서도 후기 탭이 계속 노출되는 문제가 남아 있다.",
    background:
      "하나의 행사에 여러 회차가 존재할 수 있으며, 각 회차의 진행 상태는 서로 다를 수 있다.\n\n예를 들어 1회차와 2회차는 종료되었지만 3회차는 아직 진행 중인 행사가 있을 수 있다. 이런 경우 종료된 회차에 대한 후기를 확인할 수 있도록 행사 상세 화면에 후기 탭을 노출할 필요가 있었다.\n\n반대로 모든 회차가 아직 진행 전이거나 진행 중이라면 작성할 수 있는 후기가 없으므로 후기 탭을 숨기는 것이 목표였다.",
    symptoms:
      "다음 두 상황에서 서로 다른 동작이 필요했다.\n\n1. 1회차와 2회차는 종료되고 3회차는 진행 중인 경우\n   - 종료된 회차가 있으므로 후기 탭을 노출할 수 있다.\n2. 종료된 회차가 하나도 없는 경우\n   - 후기 탭이 노출되지 않아야 한다.\n\n현재 첫 번째 상황은 구현했지만, 두 번째 상황에서는 종료된 회차가 없어도 후기 탭이 계속 노출되는 문제가 남아 있다.",
    analysis:
      "문제의 핵심은 행사 전체의 회차 목록을 기준으로 종료된 회차가 존재하는지 판단하는 조건이다.\n\n단순히 행사에 속한 회차가 존재하는지만 확인하거나 후기 관련 데이터를 전달하는 것만으로는 후기 탭의 노출 여부를 정확하게 구분할 수 없다.\n\n행사에 속한 회차 중 종료 상태인 회차가 최소 하나 존재하는지 확인하는 조건이 필요하다.\n\n> 다만 현재 기록만으로는 실제 원인이 Controller의 Model 전달 조건인지, Service의 종료 회차 조회 조건인지, Mustache의 화면 조건인지 확정할 수 없다.",
    alternatives:
      "**방법 1. 행사에 속한 회차가 존재하는지만 확인**\n\n- 회차가 하나라도 있으면 후기 탭이 노출되므로 종료 여부를 구분할 수 없다.\n\n**방법 2. 행사에 속한 모든 회차가 종료되었는지 확인**\n\n- 모든 회차가 종료되어야 후기 탭이 노출된다.\n- 일부 회차만 종료된 행사에서도 후기를 보여줘야 하는 현재 정책과 맞지 않는다.\n\n**방법 3. 종료된 회차가 하나 이상 존재하는지 확인 (선택)**\n\n- 일부 회차만 종료된 행사에서도 후기 탭을 노출할 수 있다.\n- 종료된 회차가 하나도 없는 행사는 탭을 숨길 수 있다.",
    decision:
      "현재 정책에 맞는 기준은 전체 회차의 종료 여부가 아니라 **종료된 회차가 하나 이상 존재하는지 여부**다.\n\n따라서 행사에 속한 회차 중 종료 상태인 회차가 존재하는지를 확인하는 방식이 적절하다.\n\n현재 일부 회차가 종료된 행사에서 후기 탭을 노출하는 기능은 구현했지만, 종료된 회차가 없는 행사에서 탭을 숨기는 부분은 아직 해결하지 못했다.",
    beforeCode:
      "// 종료된 회차가 없는 경우에도\n// 후기 탭이 노출되는 상태\n\n// 실제 당시 코드 전문은 기록에서 확인되지 않음",
    afterCode:
      "// 목표 조건의 예시\n\nboolean hasEndedSession =\n    eventSessions.stream()\n        .anyMatch(session -> session.isEnded());\n\n// 종료된 회차가 하나 이상 있을 때만 후기 탭 노출\n// 실제 프로젝트의 상태 enum 및 메서드명 확인 필요",
    verification:
      "일부 회차는 종료되고 나머지 회차는 진행 중인 행사에서 후기 탭이 노출되는 동작은 구현했다.\n\n그러나 종료된 회차가 하나도 없는 행사에서도 후기 탭이 노출되는 문제는 아직 해결되지 않았다.\n\n따라서 전체 요구사항을 충족한 상태는 아니며, 다음 두 경우를 구분해 추가 검증해야 한다.\n\n- 종료된 회차가 1개 이상: 후기 탭 노출\n- 종료된 회차가 0개: 후기 탭 미노출",
    limitations:
      "현재 후기 탭 노출 조건이 완성되지 않아 종료된 회차가 없는 행사에서도 불필요한 탭이 표시될 수 있다.\n\n이후에는 회차 상태를 기준으로 후기 탭 노출 여부를 판단하는 조건을 명확하게 분리하고, 행사 상세 화면에 전달되는 값과 Mustache의 조건문이 일치하는지 확인해야 한다.\n\n이번 작업을 통해 여러 회차를 가진 행사에서는 행사 전체의 상태만으로 후기 노출 여부를 판단할 수 없으며, **회차별 상태를 기준으로 판단해야 한다**는 점을 확인했다.",
  },
  {
    id: "case-029",
    memberId: "m3",
    title: "회차가 없는 행사 등록 시 기본 회차를 자동 생성하여 신청 기능 연결",
    category: "Backend / Database",
    tags: ["Spring Boot", "JPA", "Entity Relationship", "Business Logic"],
    draft: false,
    featured: false,
    summary:
      "행사에 회차가 여러 개 있는 경우와 회차 개념이 없는 일반 행사를 함께 운영해야 했다. 하지만 참가 신청과 결제 등 후속 기능은 회차 ID를 기준으로 동작하는 구조였다. 회차가 없는 행사도 신청할 수 있도록 행사 등록 시 기본 회차를 자동 생성하고, 기존 참가 신청 흐름을 그대로 사용할 수 있도록 처리했다.",
    background:
      "- 부산 플레이에서는 시간대별로 신청받는 행사와 별도의 회차 구분 없이 신청받는 행사를 모두 지원해야 했다.\n- 기존 참가 신청 구조는 `event_session_id`를 기준으로 신청 대상을 구분하고 있었다.\n- 따라서 회차가 없는 행사는 신청할 대상인 회차 데이터가 존재하지 않는 문제가 있었다.\n- 일반 행사까지 별도의 신청 로직으로 처리하면 기존 참가 신청 기능과 결제·환불 구조를 별도로 관리해야 하는 상황이었다.",
    symptoms:
      "- 회차가 없는 행사는 `event_sessions`에 연결할 데이터가 없었다.\n- 참가 신청은 회차 ID를 필요로 하므로 기존 신청 구조를 그대로 사용할 수 없었다.\n- 회차가 없는 행사를 위해 신청 기능을 별도로 만들면 기존 회차 기반 로직과 중복되는 문제가 발생할 수 있었다.",
    analysis:
      "문제의 핵심은 화면에 회차 목록이 없다는 것이 아니라, **백엔드의 참가 신청 구조가 회차를 기준으로 설계되어 있다**는 점이었다.\n\n일반 행사도 참가 신청, 참가비 처리, 취소 및 환불 등의 기능을 이용해야 했기 때문에 회차 자체를 생략하는 방식은 기존 구조와 맞지 않았다.\n\n따라서 회차가 없는 행사도 **내부적으로는 신청 가능한 회차 하나를 가지도록** 만드는 것이 적절하다고 판단했다.",
    alternatives:
      "| 방법 | 판단 |\n| :--- | :--- |\n| 회차가 없는 행사만 별도의 신청 API 구현 | 기존 신청 로직과 중복되는 코드가 발생할 수 있음 |\n| `event_session_id`가 없는 신청 허용 | 기존 회차 기반 신청·결제 구조를 변경해야 함 |\n| **기본 회차 자동 생성 (선택)** | 기존 신청 구조를 유지하면서 일반 행사까지 지원할 수 있음 |",
    decision:
      "행사 등록 과정에서 회차가 없는 경우 기본 회차를 자동 생성하는 방식을 선택했다.\n\n| 구분 | 처리 |\n| :--- | :--- |\n| 회차가 있는 행사 | 입력한 회차 정보를 그대로 저장 |\n| 회차가 없는 행사 | 기본 회차 자동 생성 |\n| 시작·종료 시간 | 행사 시작일과 종료일을 기준으로 설정 |\n| 정원 | `Integer.MAX_VALUE`로 설정하여 사실상 제한 없이 운영 |\n| 참가비 유형과 금액 | 기업이 입력한 행사 정보를 기본 회차에 반영 |\n| 신청 기간 | 행사에 설정한 기간을 기본 회차에 반영 |\n\n기본 회차 생성은 `EventService.save()`에서 처리하고, 실제 회차 저장은 `EventSessionService.save()`를 호출하도록 구성했다.",
    beforeCode:
      "// 회차가 없는 행사\n// event_sessions에 연결할 회차 데이터가 없음\n\n// 참가 신청은 event_session_id를 필요로 함",
    afterCode:
      'if (hasSessions) {\n    // 기업이 등록한 회차 정보 저장\n    // ...\n} else {\n    // 회차가 없는 행사라면 기본 회차 생성\n    EventSession.SaveDto sessionDto = new EventSession.SaveDto();\n\n    sessionDto.setName("기본 회차");\n    sessionDto.setStartAt(eventStartAt);\n    sessionDto.setEndAt(eventEndAt);\n    sessionDto.setCapacity(Integer.MAX_VALUE);\n\n    sessionDto.setPricingType(saveDto.getPricingType());\n    sessionDto.setFee(saveDto.getFee());\n\n    sessionDto.setApplyStartAt(saveDto.getApplyStartAt());\n    sessionDto.setApplyEndAt(saveDto.getApplyEndAt());\n\n    eventSessionService.save(\n        event.getId(),\n        companyId,\n        sessionDto\n    );\n}\n\n// 실제 당시 구현의 핵심 흐름을 재구성한 예시 코드이며,\n// 저장소의 원본 코드와 완전히 동일한 코드는 아니다.',
    verification:
      "- 회차를 입력한 행사와 입력하지 않은 행사를 구분하여 저장하도록 구성했다.\n- 회차가 없는 행사에서는 기본 회차를 생성하도록 처리했다.\n- 기본 회차 저장 시 행사 ID, 신청 기간, 참가비 유형 및 금액을 연결하도록 구성했다.\n\n> 실제 테스트 통과 여부는 현재 확인 가능한 기록만으로 확정하지 않았다.",
    limitations:
      "다음 프로젝트에서는 기능을 구현하기 전에 해당 데이터가 후속 기능에서 어떻게 사용되는지 먼저 확인해야 한다.\n\n특히 참가 신청처럼 특정 데이터의 ID를 기준으로 동작하는 기능은, 예외적인 데이터가 들어왔을 때 별도 로직을 계속 추가하기보다 **공통 구조를 유지할 수 있는 방법**을 먼저 고민해야 한다.\n\n이번 경험을 통해 화면에 보이는 기능만 구현하는 것이 아니라, **이후 연결되는 신청·결제·취소 기능까지 고려해 데이터 구조를 설계하는 것**이 중요하다는 점을 배웠다.",
  }
];
