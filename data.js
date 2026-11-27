// 팀원 이름, 역할, 담당 기능을 수정하세요. id는 고유하게 유지합니다.
const members = [
  {id:'m1', name:'이진우', role:'조장', tasks:'공통 예외·인터셉터, 회원가입·로그인·마이페이지, 전체 화면 디자인, 관리자 화면, 다국어 지원, AWS 배포, PR 검토·Merge', retrospective:''},
  {id:'m2', name:'한승환', role:'부조장', tasks:'공통 엔티티 설계, 포인트 충전, 참가비·보증금 결제, 환불, 회차 자동 상태 변경', retrospective:''},
  {id:'m3', name:'정윤아', role:'팀원', tasks:'행사 등록·수정, 회차, 카테고리, 대표 이미지, 회차 취소 신청, 후기', retrospective:''},
  {id:'m4', name:'김도현', role:'팀원', tasks:'참가 신청·정원 동시성·대기자 승격, 신청 내역, 커뮤니티, 기업 거절, QR 출석, 통합 테스트, 설계 문서·Wiki', retrospective:''},
  {id:'m5', name:'구도하', role:'팀원', tasks:'기업 가입·정보 수정, 사업자 진위 확인, 기업 심사, 보증금 상태 표시, 포인트·보증금 내역, 가입·로그인 비밀번호 검사', retrospective:''}
];
// 아래 예시를 복제하여 작성하고, 공개할 문서는 draft:false로 변경하세요.
// featured:true인 문서를 대표로 표시합니다. 미지정 시 첫 공개 기록을 사용합니다.
// summary에 카드에 표시할 해결 요약을 입력합니다. 비어 있으면 decision을 사용합니다.
const cases = [
  {
    id:'case-001', memberId:'m1', title:'트러블슈팅 제목 입력', category:'Backend', tags:['Spring Boot'], draft:true, featured:true, summary:'',
    background:'문제 발생 배경', symptoms:'실제 오류 및 증상', analysis:'원인 분석 과정', alternatives:'해결 방법 및 대안 비교', decision:'최종 기술 선택 이유',
    beforeCode:'// 변경 전 코드', afterCode:'// 변경 후 코드', verification:'테스트 및 검증 결과', limitations:'기술적 한계 및 개선 방향',
    links:[] // 예: {label:'PR #번호', url:'https://github.com/JinwooLeeDev/event-platform/pull/번호'}
  }
];
