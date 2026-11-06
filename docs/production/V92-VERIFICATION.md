# V9.2 체험 검수

검수일: 2026-11-06 Asia/Seoul. V9.2에서 바뀐 지도 관찰·유인 예고·빈방 표시·연습 이어하기를 로컬 개발 서버에서 확인했다. 이전 [V9.1 검수](V91-VERIFICATION.md)와 도구는 보존했으며 아래 결과는 새로 실행한 범위만 기록한다.

## 재현

```bash
npm run check
npm test
python3 -m http.server 8011 --bind 127.0.0.1 --directory .
# 별도 터미널: Python 3.10+, pip install playwright, Chromium 필요
python3 docs/production/tools/verify-v92-browser.py portrait-resume
```

도구는 `--base-url`, `--browser-path`, `--screenshots`를 지원한다. 기본 서버는 `http://127.0.0.1:8011`, 기본 브라우저는 `/usr/bin/chromium`이다. 케이스별 보고서는 `/tmp/ember-v92-<case>-result.json`에 기록되고 실패 시 종료 코드가 1이다.

정상 케이스는 실제 `tap`/`click`으로 플레이한다. 게임 상태·RNG를 주입하지 않고 게임이 직접 저장한 main/연습 snapshot을 읽어 비교한다. `storage-guards`에서만 별도 연습 key의 손상 JSON, 쓰기 `QuotaExceededError`, 읽기 `SecurityError`를 명시적으로 주입한다. 본게임 key와 최고점은 건드리지 않는다.

## 자동 검사와 브라우저 결과

- 런타임 모듈 20개 문법 검사 통과.
- 단위 테스트 86개 통과(릴리스 담당자 최종 검사).
- 브라우저 실행: Playwright 1.62.0 / Chromium 154.0.8037.57.

**6케이스 모두 PASS.** 정상 플레이에서 JavaScript 오류·실패 요청·HTTP 오류는 모두 0이었다. 결함 주입 케이스도 예외가 페이지 오류로 새지 않고 안내를 표시했다.

| 케이스 | 화면·입력·모션 | 실제 검수 | 결과 |
| --- | --- | --- | --- |
| portrait-resume | 390×844 · 터치 · 일반 | 처음부터/이어하기 6회, 공격 연출 중 보상 복원, 귀환 완주 | PASS |
| compact-map | 360×640 · 터치 · 축소 | 지도·예보 확인, 유인 취소/확정, 빈방 통과, 귀환 완주 | PASS |
| landscape-map | 740×320 · 터치 · 축소 | 지도·예보 확인, 유인 취소/확정, 빈방 통과, 귀환 완주 | PASS |
| desktop-map | 1280×720 · 마우스 · 축소 | 지도·예보 확인, 유인 취소/확정, 빈방 통과, 귀환 완주 | PASS |
| normal-lure | 390×844 · 터치 · 축소 | 일반 탐험에서 현재방 유입 경고와 실제 이동 일치 | PASS |
| storage-guards | 390×844 · 터치 · 축소 | 기존 탐험 전환/재개, 손상·읽기·쓰기 차단, 이동 방식 제한 | PASS |

지도 관찰 화면은 소리/예보 × 4화면의 8개 실제 진행 지점에서 단계 유지, 어둠막·코치 숨김, 페이지 넘침 0, 확인 버튼 클릭을 검사했다. 예보 4개 모두 스크롤하기 전 보고서 안에 전체가 들어왔다. [원시 행동·검사 결과](V92-BROWSER-RESULTS.json)와 대표 캡처 19장을 보존했다.

## 확인한 동작

### 지도를 읽고 확인하기

첫 소리 지도는 `sound`(3/18), 귀환 예보는 `forecast`(17/18)를 유지한다. 지도를 열거나 기다리거나 닫았다 다시 여는 것만으로 단계를 완료하지 않는다. `지도 확인 · 계속`을 실제로 눌러야 진행한다.

관찰 중 코치와 외곽 어둠막이 숨겨진다. 네 화면에서 페이지 넘침이 없고, 예보 전체가 보고서의 최초 표시 범위 안에 들어오는지 좌표로 확인한다. 대표 캡처는 별도로 직접 읽어 지도 노드와 예보가 밝게 보이는지도 확인한다.

### 유인하기 전에 결과 보기

회상에서 무기고 5를 누르면 먼저 예고 창이 열린다. 파수병의 `파편 회랑 → 부서진 무기고`가 표시된다. 취소 전후 저장 문자열 전체와 자원/RNG가 같고, 확정 시 기술 1만 소비된다. 실제 다음 턴에는 파수병이 6에서 5로 이동한다. 이후 6의 이동 표시는 `전투` 대신 `빈 방`이며 체력 22로 전투 없이 통과한다.

일반 탐험에서도 실제 입구→창고 이동→상자 열기→입구에 유인 순서로 확인한다. 예고는 `현재 방으로 다가옵니다`라는 경고와 적의 이동을 보여 준다. 확인 후 바로 턴을 마쳤을 때 실제 `pursuits`가 예고와 일치하는지 비교한다. 준비된 저장 상태를 주입하지 않는다.

### 처음 시작한 연습 이어하기

`portrait-resume`는 신규 context에서 안내를 한 번도 건너뛰지 않고 시작한다. 다음 지점에서 실제 새로고침과 이어하기를 수행한다.

- 창고 진입 후 `처음부터 다시` 선택: 1/18, 입구, 금화 0으로 연습만 초기화.
- 상자 획득 직후: 이미 열린 상자와 금화 7 보존, 중복 획득 없음.
- 첫 지도 및 귀환 예보 관찰 중: 같은 단계와 지도 열린 상태 보존.
- 수호자 공격 연출 중: UI가 아직 `attack`인 동안 저장은 다음 `reward` 단계와 보상 선택을 포함. 새로고침 후 동일 보상 후보·금화 10·격파 1·RNG 복원.
- 18/18 귀환 직전: 같은 위치·유물·14턴 제한 보존.
- 완료 후 결산으로 나가기: 이어하기 기록 삭제, 새로고침해도 재개/시작 안내가 다시 나타나지 않음.

각 복원에서 게임이 확정해 저장한 상태 전체를 비교한다. 본게임 저장과 최고점 문자열은 모든 지점에서 처음 값과 같다. 별도 가드 케이스에서는 `기존 탐험 계속`으로 연습을 일시 보류하고 메뉴에서 다시 이어갈 수 있는지도 확인한다.

### 손상·차단 저장 안내

손상된 연습 기록은 본게임을 유지하며 초기화되고 안내를 보여야 한다. 연습 쓰기 실패는 플레이를 계속하면서 새로고침 시 최근 진행을 잃을 수 있음을 표시한다. 읽기 권한 실패도 시작 화면과 메뉴에서 안내된다. 이 검증은 브라우저 저장 API에 대한 명시적 결함 주입이며 정상 플레이 결과와 구분한다.

초기 실행에서 이미 `seen`인 사용자에게 손상/읽기 실패 안내가 보이지 않는 문제가 발견됐다. 시작 알림과 메뉴의 안내를 연결한 뒤 가드 전체를 다시 실행해 통과했다. 쓰기 실패 시에도 현재 연습은 계속됐고, 고정 이동 단계의 은밀/질주 옵션은 비활성화됐다.

## 대표 화면 증거

- [360×640 첫 지도](../visual/implemented/v92/compact-map-sound-reading.png), [같은 화면의 귀환 예보](../visual/implemented/v92/compact-map-forecast-reading.png)
- [740×320 첫 지도](../visual/implemented/v92/landscape-map-sound-reading.png), [가로 귀환 예보](../visual/implemented/v92/landscape-map-forecast-reading.png), [데스크톱 예보](../visual/implemented/v92/desktop-map-forecast-reading.png)
- [유인하기 전 예고](../visual/implemented/v92/portrait-resume-lure-preview.png), [빈 회랑 실제 통과](../visual/implemented/v92/portrait-resume-empty-corridor.png)
- [일반 탐험의 현재방 유입 경고](../visual/implemented/v92/normal-lure-lure-preview.png), [다음 턴 실제 도착](../visual/implemented/v92/normal-lure-lure-actual-arrival.png)
- [처음부터/이어하기 선택](../visual/implemented/v92/portrait-resume-restart-choice-resume-prompt.png), [공격 연출 중 끊긴 보상 재개](../visual/implemented/v92/portrait-resume-reward-animation-resume-prompt.png), [18/18 귀환 재개](../visual/implemented/v92/portrait-resume-escape-18-resume-prompt.png)
- [손상 기록 안내](../visual/implemented/v92/storage-guards-corrupt-progress.png), [쓰기 차단 안내](../visual/implemented/v92/storage-guards-blocked-progress.png), [읽기 차단 안내](../visual/implemented/v92/storage-guards-blocked-progress-read.png)

전체 캡처는 로컬 `/tmp/ember-v92-qa`에 남겼다. 초기 QA가 상자마다 긴 소음 연출이 열린다고 가정했던 부분은 수정했고, 실제 연출 중 중단은 수호자의 공격이 끝나기 전에 재로딩하는 별도 검사로 확인했다.

## 검증 범위와 한계

Chromium의 화면 크기·터치·축소 모션 에뮬레이션이다. 실제 iPhone/Safari 및 Android 실기기에서는 확인하지 않았다. 회상 완주는 고정된 연습 지도이고 일반 탐험 검수는 유인 예고가 실제 이동과 일치하는 구간까지다. 무작위 20방 실전 전체 완주나 사람의 난이도 평가를 의미하지 않는다.

준비된 [플레이 주소](https://jjsjb88-alt.github.io/ember-vault/dist/?v=20261106c)와 [GitHub Actions](https://github.com/jjsjb88-alt/ember-vault/actions/workflows/jekyll-gh-pages.yml)는 로컬 브라우저 검수와 구분한다. 이 문서는 공개 주소의 직접 접속 성공을 증명하지 않는다.
