# V9 검수 — 길을 고르고, 유물과 함께 귀환

검수일: 2026-11-06 KST. 별도 브라우저 저장 공간과 로컬 정적 서버에서 Python Playwright·Chromium으로 검사했습니다. 모바일 크기는 터치를 지원하는 브라우저 에뮬레이션이며 실제 휴대폰 검수가 아닙니다.

## 실제 조작으로 확인한 범위

새 튜토리얼 14단계 전체를 클릭·탭으로 진행했습니다. 추출 → 이동 → 상자 → 소리 지도 → 유인 → 질주 → 숨결 → 전투와 보상 → 교역 → 숨죽이기 → 두 경로 중 선택 → 물체 사용 → 유물 회수 → 입구 복귀와 탈출을 실행했습니다. 화면의 `data-step=15`는 14단계 후 완료 상태입니다.

| CSS 뷰포트 | 입력·모션 | 경로 | 결과 |
| --- | --- | --- | --- |
| 390×844 | 터치·기본 모션 | 이끼 쉼터 | 탈출·실전 준비·새로고침 통과 |
| 390×844 | 터치·기본 모션 | 파편 보물고 | 탈출·실전 준비·새로고침 통과 |
| 844×390 | 터치·기본 모션 | 파편 보물고 | 탈출·실전 준비·새로고침 통과 |
| 740×320 | 터치·모션 감소 | 이끼 쉼터 | 탈출·실전 준비·새로고침 통과 |
| 1280×720 | 마우스·모션 감소 | 파편 보물고 | 탈출·실전 준비·새로고침 통과 |

고정된 연습 시드에서 쉼터 사용 후 체력은 18→22, 금화는 9였습니다. 보물고 사용 후 체력은 18, 금화는 9→15였습니다. 두 경로 모두 첫 불씨를 회수하고 실제 입구 상호작용으로 탈출했습니다. 일반 탐험 전체를 이 브라우저 검사에서 완주한 결과는 아닙니다.

다음 항목도 검사했습니다.

- 시작 주소의 `?tutorial=1`은 한 번만 적용되고 다른 쿼리와 해시는 보존됩니다. 건너뛰기와 완료 뒤 새로고침해도 안내가 다시 열리지 않습니다.
- 연습 전의 20개 방 탐험 저장 문자열과 최고 기록 `123`을 비교했습니다. 연습 중·완료 후·새로고침 후 모두 동일했습니다. 연습 결과가 실제 최고 기록에 섞이지 않습니다.
- 11단계 자동 대화가 열린 동안 `ArrowRight`, `ArrowUp`, `E`를 입력해도 방·단계·체력·경계·금화·이동력이 변하지 않았습니다. 네 대표 화면에서 확인했습니다.
- 390×844의 4단계에서 대화 버튼이 유인할 방을 덮던 문제를 재현한 뒤, 코치 위치 수정 후 같은 중앙 탭으로 재검사했습니다. 4·11·12·14단계의 두 경로 조작이 통과했습니다. 강제 클릭으로 우회하지 않았습니다.
- 이후 가로 14단계에서 코치 본문이 귀환 방 이름을 가리는 시각 문제를 발견해 상하·좌우 배치 수정 후 별도로 재검사했습니다. 390×844와 844×390에서 4단계 유인 대상, 11단계 두 갈림길, 14단계 회수·귀환 대상과 코치의 전체 사각형 교차 면적이 0임을 확인했습니다. 두 화면 모두 다시 탈출과 새로고침까지 통과했고 해당 이미지를 갱신했습니다.
- 모든 기록 단계에서 문서 크기가 뷰포트를 넘지 않았고, 코치가 화면 밖으로 벗어나지 않았습니다. 최종 실행의 JavaScript 오류·요청 실패·HTTP 400 이상 응답은 모두 0건입니다.

## 실패 후 다시 시도

844×390·모션 감소에서 유물을 회수한 뒤 실제 `다음 턴` 버튼을 14회 눌러 금고 붕괴를 발생시켰습니다. `갈림길부터 다시`를 누르자 11단계, T02, 체력 18, 경계 3, 금화 9, 이동력 3이 체크포인트와 정확히 일치했습니다.

그 상태에서 쉼터 → 유물 회수 → 입구 탈출을 다시 수행했습니다. 실패·복원·재탈출 전 과정에서 원래 탐험 저장과 최고 기록은 그대로였습니다.

## B5 윈치와 새 지도

20개 방 탐험의 B5 귀환 윈치실에 위치한 **준비된 저장 상태**를 사용했습니다. 실제 터치로 윈치를 작동시켜 기술 2 소비, 발생 소리 6, 17↔9 승강 연결 생성, 새로고침 후 연결 보존, B3 속삭이는 묘실로 이동을 확인했습니다. 이동력은 4→3이었습니다. 새 B5 배경·소품을 포함한 요청 실패와 JavaScript 오류는 없었습니다.

승강 출구를 미니맵·적 타깃·일반 출구·하단 조작과 분리했습니다. 740×320, 844×390, 390×844, 360×780에서 적이 살아 있는 B3에 들어가 실제 공격으로 피해 1을 주고 승강 통로로 후퇴했습니다. 최종 위치에서 각 영역과의 교차 면적은 0입니다. [검사 범위와 결과](../visual/implemented/v9/lift-layout-qa.json).

이 검사는 장치와 UI의 통합 검증입니다. B1부터 B5까지 플레이하여 도착한 탐험 기록으로 해석하지 않습니다. 지도 좌표·표식·FX 및 도적 회수 애니메이션의 별도 검사 결과는 해당 구현 검증 기록과 함께 확인합니다.

## 회수 동작과 효과

준비된 일반 탐험 B5 유물 방에서 실제 상호작용으로 신규 회수 동작을 검사했습니다. 390×844와844×390에서14개 프레임이 순서대로 재생되고, 발 기준·배율이 고정되며1400ms 후 기본 자세로 돌아왔습니다. 다른 방으로 움직이면 취소되고 저장 상태와RNG는 변하지 않았습니다. 모션 감소에서는 신규 동작을 재생하지 않습니다. [실행 결과 JSON](../visual/implemented/v9/rogue-relic-motion-qa.json), [세로 중간 동작](../visual/implemented/v9/rogue-relic-motion-portrait.png), [가로 중간 동작](../visual/implemented/v9/rogue-relic-motion-landscape.png).

3584×1024 시트의 실제 manifest에서14개 절대 사각형·프레임 시간·앵커를 추출해 런타임 메타데이터를 생성했습니다. 게임의 재생 검증과 제작 도구의 품질 판정은 다릅니다. Forge의 머리 밴드 자동FAIL과 별도 시각 채택 근거는 [도구 기록](V9-TOOLS.md)과 [모션 기록](V9-MOTION.md)에 보존했습니다.

## 실행 화면

- [세로폰 경로 선택](../visual/implemented/v9/portrait-safe-choice.png), [위험 경로 선택](../visual/implemented/v9/portrait-risk-choice.png), [세로폰 귀환 완료](../visual/implemented/v9/portrait-safe-escaped.png)
- [가로폰 유물 회수 후](../visual/implemented/v9/landscape-risk-return.png), [작은 가로 화면의 경로 선택](../visual/implemented/v9/small-safe-choice.png), [데스크톱 귀환 완료](../visual/implemented/v9/desktop-risk-escaped.png)
- [실제 붕괴 후 다시 시도](../visual/implemented/v9/retry-safe-retry-prompt.png), [체크포인트 복원](../visual/implemented/v9/retry-safe-retry-restored.png)
- [준비된 B5 윈치 상태](../visual/implemented/v9/b5-winch-fixture-before.png), [실제 작동 후 승강 연결](../visual/implemented/v9/b5-winch-fixture-open.png)

## 재현 방법과 결과

브라우저 검사 도구는 [verify-v9-browser.py](tools/verify-v9-browser.py), 요약 데이터는 [V9-BROWSER-RESULTS.json](V9-BROWSER-RESULTS.json)입니다. Python 3.10 이상, Python `playwright` 패키지, Chromium 실행 파일이 필요합니다. 저장소에 브라우저 의존성을 추가하지 않았습니다.

저장소 루트에서 별도 터미널로 정적 서버를 시작합니다.

```bash
python3 -m http.server 8011 --bind 127.0.0.1 --directory .
```

그다음 필요한 케이스를 실행합니다. 실패하면 0이 아닌 종료 코드를 반환하며 JSON 보고서는 `/tmp/ember-v9-<case>-result.json`에 기록합니다.

```bash
python3 docs/production/tools/verify-v9-browser.py portrait-safe
python3 docs/production/tools/verify-v9-browser.py portrait-risk
python3 docs/production/tools/verify-v9-browser.py landscape-risk
python3 docs/production/tools/verify-v9-browser.py small-safe
python3 docs/production/tools/verify-v9-browser.py desktop-risk
python3 docs/production/tools/verify-v9-browser.py retry-safe
```

다른 서버에는 `--base-url`, 다른 Chromium에는 `--browser-path`, 이미지 출력 위치에는 `--screenshots`를 사용합니다. 정상 사용자 브라우저의 저장 공간과 서버 프로세스는 변경하지 않습니다.

배포 전 `npm run check`의 18개 런타임 모듈 문법 검사와 `npm test` **58개 테스트가 모두 통과**했습니다. 기존 180회·확장 90회 시드 탐험, 튜토리얼 96개 선택 조합, 지름길·숨결·노이즈 상한·저장 호환·지도 클릭·회수 아틀라스 검사 등이 포함됩니다. `git diff --check`도 통과했습니다. 브라우저 검사와 단위 테스트의 실행 범위는 서로 다릅니다.

## 검증 한계

실제 iOS Safari·Android 기기의 터치 정확도, 오디오 출력, 진동, 장시간 프레임률·배터리 사용량은 확인하지 않았습니다. 모든 일반 탐험 시드와 모든 직업을 브라우저에서 완주한 검사는 아닙니다. 준비된 B5 상태와 실제 튜토리얼 플레이를 위에서 구분했습니다.

## 배포 상태

기존 `main`의 GitHub Pages 워크플로로 배포합니다. 환경 보호 규칙이나 배포 설정은 변경하지 않습니다. 공개 주소는 [게임](https://jjsjb88-alt.github.io/ember-vault/dist/?v=20261106a)이며, 첫 주소도 같은 게임으로 연결됩니다. [Actions 실행 기록](https://github.com/jjsjb88-alt/ember-vault/actions)에서 배포 커밋과 성공 상태를 확인할 수 있습니다.

이 실행환경에서 Pages 도메인으로 직접 접속하면 프록시의 HTTP 403으로 차단됩니다. 따라서 로컬 Chromium 플레이 검증, GitHub Actions 배포 성공, 실제 사용자 기기의 공개 URL 접속은 각각 구분합니다. 공개 도메인에서 직접 플레이 검수를 마쳤다고 표시하지 않습니다.
