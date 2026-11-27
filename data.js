// 팀원 정보: 사용자 제공 원본 유지
const members = [
  {
    "id": "m1",
    "name": "이진우",
    "role": "조장",
    "tasks": "공통 예외·인터셉터, 회원가입·로그인·마이페이지, 전체 화면 디자인, 관리자 화면, 다국어 지원, AWS 배포, PR 검토·Merge"
  },
  {
    "id": "m2",
    "name": "한승환",
    "role": "부조장",
    "tasks": "공통 엔티티 설계, 포인트 충전, 참가비·보증금 결제, 환불, 회차 자동 상태 변경"
  },
  {
    "id": "m3",
    "name": "정윤아",
    "role": "팀원",
    "tasks": "행사 등록·수정, 회차, 카테고리, 대표 이미지, 회차 취소 신청, 후기"
  },
  {
    "id": "m4",
    "name": "김도현",
    "role": "팀원",
    "tasks": "참가 신청·정원 동시성·대기자 승격, 신청 내역, 커뮤니티, 기업 거절, QR 출석, 통합 테스트, 설계 문서·Wiki"
  },
  {
    "id": "m5",
    "name": "구도하",
    "role": "팀원",
    "tasks": "기업 가입·정보 수정, 사업자 진위 확인, 기업 심사, 보증금 상태 표시, 포인트·보증금 내역, 가입·로그인 비밀번호 검사"
  }
];

// 공개 문서: draft:false / 대표 문서: featured:true
const cases = [
  {
    "id": "case-001",
    "memberId": "m1",
    "title": "AI 번역 API 호출 최적화 및 핵심 트랜잭션 분리",
    "category": "Internationalization",
    "tags": [
      "Gemini",
      "AFTER_COMMIT",
      "Cache"
    ],
    "background": "기업이 등록하는 행사 제목과 소개는 사전 번역할 수 없어 Gemini API를 활용했다.",
    "symptoms": "초기 모델 호출에서 404 MODEL_INVALID가 발생했다. 또한 매 조회마다 API를 호출하는 설계는 응답 지연과 비용 증가, 외부 장애 전파 위험이 있었다. 후자는 설계 단계에서 식별한 위험이다.",
    "analysis": "모델 설정 변경으로 API 호출을 재검증했다. 번역 요청과 핵심 행사 트랜잭션의 책임을 분리하고 원본 변경 시 기존 번역의 유효성을 확인할 필요가 있었다.",
    "alternatives": "조회마다 번역하는 방식, 모든 언어를 사전 번역하는 방식, DB에 번역 결과를 저장하고 필요할 때 요청하는 방식을 비교했다.",
    "decision": "영어는 공개·변경 커밋 이후 번역 요청을 등록하고 일본어·중국어는 최초 조회 시 요청한다. 원본 해시로 번역 유효성을 확인하고 조회 DTO에만 번역을 반영한다. 번역 저장소는 별도 트랜잭션으로 격리하며 실패 시 원문을 제공한다.",
    "beforeCode": "// 검토한 초기 방식 (개념 코드)\n행사 조회 → Gemini API 호출 → 응답 반환",
    "afterCode": "// 최종 설계 (개념 코드)\nAFTER_COMMIT → 번역 요청 등록\n번역 처리 → DB 저장\n행사 조회 → 유효한 번역 조회 → DTO 반영\n번역 미존재 또는 실패 → 원문 반환",
    "verification": "초기 모델 호출 404 이후 모델 설정 변경으로 HTTP 200을 확인했다. 행사 ID 2의 영어 번역 성공 호출 1회 및 DB 저장, 동일 번역 재조회 시 추가 호출 0회를 확인했다. 전체 운영 성능을 측정한 결과는 아니다.",
    "limitations": "자동 워커 기본 비활성 상태. 운영 부하 및 번역 품질 검증 미완료.",
    "draft": false,
    "featured": true,
    "summary": "번역 결과를 DB에 저장·재사용하고 핵심 커밋 이후 요청을 등록하여 외부 API 의존성을 분리했다."
  },
  {
    "id": "case-002",
    "memberId": "m1",
    "title": "정적 UI와 동적 콘텐츠의 다국어 지원 설계",
    "category": "Internationalization",
    "tags": [
      "MessageSource",
      "Locale",
      "Cookie"
    ],
    "background": "비로그인 사용자와 회원 모두 한국어, 영어, 일본어, 중국어로 서비스를 이용할 수 있도록 설계했다.",
    "symptoms": "Mustache와 JavaScript에 한국어 문구가 분산되어 있었고 로그인·로그아웃 전후 언어 설정을 유지할 필요가 있었다.",
    "analysis": "고정 UI 문구는 사전 번역이 가능하지만 행사 콘텐츠는 기업 입력에 따라 달라진다. 언어 선택은 비로그인 쿠키와 회원 설정의 생명주기를 함께 고려해야 했다.",
    "alternatives": "전체 문구 실시간 AI 번역, 정적 메시지 파일만 사용, 정적 메시지 파일과 동적 AI 번역을 분리하는 방식 비교.",
    "decision": "정적 UI는 Spring MessageSource로 처리하고 Locale 쿠키와 회원 설정을 연동했다. 동적 콘텐츠는 별도 AI 번역 저장소를 사용하도록 분리했다.",
    "beforeCode": "개념: 템플릿에 한국어 직접 작성",
    "afterCode": "개념: 메시지 키 → Locale별 메시지 조회",
    "verification": "4개 언어 및 1,524개 메시지 키 구성 기록. 초기 Locale 선택·회원가입·로그인 동기화·로그아웃 유지 관련 테스트 38개 기록.",
    "limitations": "번역 품질 및 누락 키에 대한 지속적인 검토 필요.",
    "draft": false,
    "featured": false,
    "summary": "정적 메시지와 동적 콘텐츠의 번역 책임을 분리하고 로그인 전후 언어 설정을 유지했다."
  },
  {
    "id": "case-003",
    "memberId": "m1",
    "title": "HTTPS 로그인 리다이렉트 오류",
    "category": "Infrastructure",
    "tags": [
      "Nginx",
      "TLS",
      "Spring Boot"
    ],
    "background": "EC2에 Docker와 Nginx로 HTTPS 서비스를 배포했다.",
    "symptoms": "로그인 후 오류가 발생했지만 새로고침하면 로그인 상태였다. 응답 Location이 HTTP였다.",
    "analysis": "Nginx에서 TLS를 종료하고 내부 앱에 HTTP로 전달해 원래 프로토콜이 반영되지 않았다.",
    "alternatives": "컨트롤러별 URL 수정과 프록시 헤더 공통 설정 비교.",
    "decision": "원래 요청 정보를 전달하고 Spring Boot가 이를 인식하도록 구성했다.",
    "beforeCode": "HTTP 302\nLocation: http://busan-play.duckdns.org/",
    "afterCode": "proxy_set_header X-Forwarded-Proto $scheme;\n\nserver:\n  forward-headers-strategy: framework",
    "verification": "응답 헤더에서 원인을 확인했고 설정을 적용했다. 최종 브라우저 회귀 테스트 기록은 별도 첨부 권장.",
    "limitations": "신뢰할 수 있는 프록시만 헤더를 설정하도록 하고 앱 직접 접근을 제한할 필요가 있다.",
    "draft": false,
    "featured": false,
    "summary": "프록시 헤더와 Spring 설정으로 원래 HTTPS 요청 정보를 인식하도록 했다."
  },
  {
    "id": "case-004",
    "memberId": "m1",
    "title": "공통 파일 업로드 모듈 설계 및 파일·DB 정합성 확보",
    "category": "Backend",
    "tags": [
      "FileStorage",
      "UUID",
      "Transaction"
    ],
    "background": "기업 사업자등록증 등 파일을 안전하게 저장할 공통 기능이 필요했다.",
    "symptoms": "파일 확장자만 신뢰하면 위장 파일을 허용할 수 있고, DB 저장 또는 커밋 실패 시 이미 저장된 파일이 남을 수 있었다. 실제 장애 발생 기록이 아닌 설계 단계에서 식별한 위험이다.",
    "analysis": "파일 시스템은 DB 트랜잭션의 롤백 대상이 아니므로 별도의 보상 정리가 필요하다. 파일명과 확장자만으로는 실제 파일 형식이나 안전한 저장 경로를 보장할 수 없다.",
    "alternatives": "도메인별 저장 로직과 공통 저장 인터페이스를 비교했다. DB에 바이너리를 직접 저장하는 대신 로컬 파일과 DB 저장 키를 분리하는 구조를 채택했다.",
    "decision": "FileStorage 인터페이스와 LocalFileStorage 구현체, FileValidator로 책임을 분리했다. UUID 저장 키, 파일 시그니처 및 실제 읽은 바이트 크기 검증, 경로 정규화와 심볼릭 링크 검사, DB 저장·커밋 실패 시 파일 정리를 적용했다.",
    "beforeCode": "개념: 파일 저장 → DB 저장 (실패 정리 없음)",
    "afterCode": "개념: 형식·시그니처·크기 검증 → UUID 저장 키 → DB 저장 → 실패 시 파일 정리",
    "verification": "구현 기록에서 PDF/JPEG/PNG 허용, 파일 10MB·요청 12MB 제한, 경로 검증 및 실패 정리 로직을 확인했다. 이번 문서 작성 시 테스트를 재실행하지 않았다.",
    "limitations": "프로세스 강제 종료 시 고아 파일이 남을 수 있다. 외부 스토리지와 정기 정리 정책 검토 필요.",
    "draft": false,
    "featured": false,
    "summary": "파일 검증 및 저장 책임을 분리하고 DB 저장 실패 시 파일을 정리했다."
  }
];
