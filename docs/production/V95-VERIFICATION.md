# V9.5 · 에셋 통합 검수

2026-11-06 Asia/Seoul. 제작 대상·도구 실행 범위는 [아트 기준](V95-ART-DIRECTION.md), 실제 결과는 [브라우저 JSON](V95-BROWSER-RESULTS.json)에 기록한다. 이전 버전의 결과와 화면은 덮어쓰지 않았다.

## 검사

- 런타임 23모듈 문법 검사, 테스트 89개 통과. 새 검사는 24개 능력의 독립 256px 원본·12종 유물/소품·4등급 프레임이 실제 존재하는지, 기존에 같은 기호를 공유하던 메달이 별도 원화를 쓰는지, 등급 외형 변경이 카드 데이터를 바꾸지 않는지 확인한다.
- 360×640·740×320 실제 클릭/터치 튜토리얼 완주. 녹스 소개·새 메달 4종 작업대·구매 전달 중 새로고침·동일 구매 복원·유물 획득·귀환·결산까지 진행한다. 본게임과 최고점 저장을 매번 비교한다. 작은 화면에서는 던전의 녹스를 직접 눌러 교역을 여는 경로도 검수한다.
- 390×844·1280×900 금고도감 검수. 실제 이미지 24종 메달·12종 물건·3직업·녹스 로드, 네 등급으로 전환해도 동일 원화 유지, 상세 보기에서 실제 pixelfx 캔버스의 불투명 픽셀 존재와 효과 제거, 페이지 가로 넘침 없음, JavaScript·HTTP 오류 없음 확인.
- 도감 전에 실제 본게임을 열어 저장을 만든 뒤, 등급 변경·상세 각성·닫기 뒤에도 본게임 저장과 최고점 문자열이 같은지 비교한다. 게임 상태나 RNG를 주입하지 않는다.
- 키포즈·토큰·물건·전신·적 접촉시트를 별도로 직접 읽었다. 첫 키포즈의 소품 손 바뀜을 재생성으로 고친 뒤, 최종 네 장의 손·얼굴·의상·뿔·공통 발 기준을 확인했다. 원본 Forge `safe_frame` 경고는 지우지 않고 아트 기록에 설명한다.

게임 브라우저 도구: [verify-v95-browser.py](tools/verify-v95-browser.py). 도감·효과·저장 보호: [verify-v95-artbook.py](tools/verify-v95-artbook.py).

```bash
npm run check
npm test
python3 -m http.server 8015 --bind 127.0.0.1 --directory .
# 별도 터미널. Python Playwright와 /usr/bin/chromium 필요
python3 docs/production/tools/verify-v95-browser.py compact-map
python3 docs/production/tools/verify-v95-browser.py landscape-map
python3 docs/production/tools/verify-v95-artbook.py
```

## 화면과 검수 한계

[대표 화면](../visual/implemented/v95/)에는 원화 접촉시트와 최종 게임·도감 화면을 포함한다. 360px 화면에서 안내가 인물을 가려 모바일 배우 크기·높이를 조정했고 교역 소개 때 어둠막도 약하게 했다. 이는 별도 새 던전을 주입한 장면이 아니라 실제 튜토리얼에서 확인했다. 4등급 도감은 외형 비교로 표시해 능력 강화와 혼동하지 않게 했다.

검수는 로컬 Chromium의 모바일 화면·터치 에뮬레이션이며 실제 iPhone/Safari·Android 기기 인증이 아니다. 공개 Pages 직접 접속은 환경 프록시로 제한되므로 로컬 플레이와 GitHub Actions 배포 완료는 구분한다. 영상 생성·Sprite Sheet Diffusion 추론·모든 인물의 신규 14프레임 애니메이션까지 실행했다고 주장하지 않는다.
