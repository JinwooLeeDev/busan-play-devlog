# Busan Play Devlog

정적 HTML/CSS/JavaScript 트러블슈팅 기록 사이트입니다.

## 내용 수정
- 팀원별 대표 문서는 `featured: true`로 지정합니다. 미지정 시 첫 공개 문서를 표시합니다. `summary`에는 카드에 표시할 해결 요약을 입력합니다.
- `data.js`의 members에 팀원 5명의 이름, 역할, 담당 기능을 입력합니다.
- cases의 예시 객체를 복제하여 문서를 추가합니다. id는 문서마다 고유하게 지정하고 memberId는 팀원 id와 일치시킵니다.
- draft를 false로 변경하면 목록에 표시됩니다. draft는 공개 저장소에서 비밀을 보장하지 않습니다. 민감 정보는 저장소에 넣지 마세요.
- 링크는 실제 확인된 URL만 입력합니다. 코드 및 내용은 일반 텍스트로 표시됩니다.

## 배포
1. GitHub에 busan-play-devlog 공개 저장소를 생성합니다.
2. 이 폴더 안의 파일을 저장소 루트에 커밋하고 main에 push합니다.
3. Settings > Pages > Build and deployment > Deploy from a branch > main / (root) > Save.
4. Pages에 표시되는 실제 배포 URL을 기존 프로젝트 README에 연결합니다.

로컬에서는 index.html을 브라우저로 열어 확인할 수 있습니다.
