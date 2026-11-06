# V9.1 체험 검수

검수일: 2026-11-06 Asia/Seoul. 대상은 V9.1의 18단계 회상, 실제 메달 추출과 전투, 선택한 귀환길에 따른 결산이다. 아래 브라우저 결과는 개발 서버 `http://127.0.0.1:8011/dist/`에서 확인했으며 배포 완료를 뜻하지 않는다.

## 재현

```bash
npm run check
npm test
python3 -m http.server 8011 --bind 127.0.0.1 --directory .
# 별도 터미널; Python 3.10+, pip install playwright, Chromium 필요
python3 docs/production/tools/verify-v91-browser.py portrait-safe \
  --browser-path /usr/bin/chromium --screenshots docs/visual/implemented/v91
# DOM 없는 별도 규칙 조합 검수
node docs/production/tools/verify-v91-rules.mjs
```

브라우저 케이스 이름은 `portrait-safe`, `portrait-risk`, `landscape-risk`, `small-safe`, `desktop-risk`, `retry-safe`다. `safe`는 6개 통로의 이끼 우회 귀환, `risk`는 파수병이 있는 4개 통로의 짧은 귀환을 가리킨다. 원본 V9 재현 도구와 결과는 그대로 보존했다.

실행 환경은 Playwright 1.62.0, Chromium 154.0.8037.57이다. 브라우저 도구는 분리된 Playwright context에서 실제 `tap` 또는 `click`으로 진행한다. 앱 내부 상태·RNG를 주입하지 않는다. 원래 저장 보존 확인을 위해 그 context의 최고점만 123으로 지정한다. 회상 자체는 게임이 제공하는 고정 소형 주머니와 지도로 시작하며, 이후 추출·이동·전투·피해는 실제 게임 규칙으로 처리한다.

## 자동 검사

- `npm run check`: 런타임 모듈 19개 문법 검사 통과.
- `npm test`: 69개 테스트 통과(루트 최종 검수).
- [규칙 조합 검수](V91-RULES-RESULTS.json): 별도 엔진 시뮬레이션 결과. 브라우저 검수와 구분한다.

## 브라우저 검수 범위

모든 케이스에서 다음을 실제 UI로 확인한다.

1. 루트 주소가 `/dist/`로 이동하며 `tutorial=1`만 소비하고 다른 쿼리·해시를 보존한다. 연습 건너뛰기·중간 종료·완료 뒤 새로고침은 회상을 강제로 다시 열지 않는다.
2. 실제 18단계 `data-step-key`를 순서대로 진행한다. 숨죽이기 비용과 경계 감소, 유인 기술 비용을 확인한다. 파수병은 유인 즉시 움직이지 않고 턴 종료 뒤 파편 회랑 6에서 무기고 5로 이동한다. 비어진 6을 체력 22로 통과한다.
3. 불씨 화살만 선택할 수 있는 명시적 영입 시연을 확인한다. 다른 세 능력과 목록 교체는 비활성화되며 이유가 접근성 이름에 표시된다. 기술 3을 써도 현재 공격은 2다. 다음 실제 추출에서 불씨 화살 공격 3과 단검 공격 2가 합산되어 공격 5, 추가 추출을 포함한 메달 6개가 된다. 일반 모션 케이스는 이 추출을 결과 바로 보기 없이 관찰한다.
4. 체력 5의 수호자를 실제 공격 5로 처치한다. 금지된 서고와 숲의 물약 보상을 각각 고르며 파수병의 추가 보상은 건너뛰기도 한다. 선택 서고 상자는 열거나 남겨 둔다.
5. 유물을 획득하면 실제 14턴 귀환 제한이 시작된다. 미니맵 예보를 읽고 이끼 길에서 숨결이 비껴가는 것과 짧은 길에서 실제 피해를 받는 것을 비교한다. 입구의 탈출 상호작용까지 완료한다.
6. 결산의 남은 체력·금화가 실제 HUD와 같고 점수가 양수인지 확인한다. 유인으로 열린 빈방, 새 능력 공격 +3와 수호자에게 5피해, 선택 상자의 개봉 여부, 실제 4/6칸 귀환 기록을 대조한다.
7. 원래 20방 탐험 저장과 최고점은 연습 진행·완료·복구 뒤 동일하다. 대화가 열려 있을 때 방향키와 E가 배경 탐험을 진행시키지 않는다.
8. 각 단계의 페이지 넘침, 코치의 화면 밖 배치, 현재 강조 대상과 코치의 겹침, JavaScript 오류, 요청 실패와 HTTP 오류를 검사한다. 강제 클릭은 사용하지 않는다.

## 케이스 결과

**6케이스 모두 PASS.** 4개 화면 크기에서 두 귀환길을 실제로 완료했다. JavaScript 오류·실패 요청·HTTP 오류는 모두 0이었다. 단계별 배치 관찰 392회에서 페이지 넘침과 코치/강조 대상 겹침은 0이었다.

| 케이스 | 화면·입력·모션 | 귀환·보상 | 최종 체력 / 금화 / 점수 | 결과 |
| --- | --- | --- | --- | --- |
| portrait-safe | 390×844 · 터치 · 일반 | 이끼 6칸 · 금지된 서고 | 22 / 10 / 86 | PASS |
| portrait-risk | 390×844 · 터치 · 일반 | 파수병 4칸 · 금지된 서고 | 18 / 18 / 88 | PASS |
| landscape-risk | 844×390 · 터치 · 일반 | 파수병 4칸 · 금지된 서고 | 18 / 18 / 88 | PASS |
| small-safe | 740×320 · 터치 · 축소 | 이끼 6칸 · 금지된 서고 | 22 / 10 / 86 | PASS |
| desktop-risk | 1280×720 · 마우스 · 축소 | 파수병 4칸 · 숲의 물약 | 21 / 18 / 91 | PASS |
| retry-safe | 844×390 · 터치 · 축소 | 실제 붕괴→복구→이끼 6칸 | 22 / 10 / 86 | PASS |

짧은 귀환길에서는 파수병 반격 1과 숨결 3으로 총 피해 4를 받았다. 숲의 물약을 선택한 데스크톱 케이스는 다음 추출에서 체력 3을 회복해 최종 체력이 21이었지만, 결산의 받은 피해는 정확히 4로 남았다. 이끼 길에서는 미니맵의 비껴감 예보와 실제 무피해가 일치했다.

재도전 케이스는 유물 획득 뒤 UI에서 14턴을 넘겨 실제 붕괴시켰다. 복구 버튼으로 수호자 전 T3의 방·체력 22·공격 5·이동/기술/방어·추출 메달이 돌아왔고, 재완주 결산에는 `다시 도전 1회`가 표시됐다. 포기한 시도의 피해는 최종 귀환 기록에 섞이지 않았다. 데스크톱에서는 연습 도중 종료 버튼 없이 바로 새로고침해도 원래 저장으로 돌아오는 것을 추가 확인했다.

축소 모션 합산창은 1.6초 후 자동으로 닫힌다. 초기 QA가 캡처를 기다린 뒤 닫힌 버튼을 누르던 경합은 즉시 캡처/열림 재확인으로 수정했다. 또 740×320에서 지연된 자동대화를 QA가 이미 건너뛴 경우에는 대화 다시보기로 동일한 키보드 차단을 검증했다. 이 두 초기 실패는 QA 타이밍 문제였으며 게임 코드 변경 없이 재실행을 통과했다. 높이 320의 결산은 모달 내부 세로 스크롤을 사용하고 하단 버튼도 실제 클릭으로 도달했다.

원시 행동·자원·예보·결산 기록은 [V91-BROWSER-RESULTS.json](V91-BROWSER-RESULTS.json)에 보존했다. 전체 캡처는 로컬 `/tmp/ember-v91-qa-archive`에 두고 저장소에는 대표 이미지 22장만 남겼다. 초기 세로 캡처 일부는 최종 조사 교정 전 제목을 담고 있으며, 이후 케이스에는 `첫 불씨를 품고 돌아왔어요`가 반영돼 있다.

대표 증거:

- [유인 뒤 적의 실제 이동](../visual/implemented/v91/portrait-safe-lure-worked.png), [비어진 회랑 통과](../visual/implemented/v91/portrait-safe-empty-corridor.png)
- [고정 영입 시연](../visual/implemented/v91/portrait-safe-market.png), [실제 추출 공격 5](../visual/implemented/v91/portrait-safe-recruited-draw.png), [수호자 HP 5](../visual/implemented/v91/portrait-safe-guardian.png)
- [세로 귀환 선택](../visual/implemented/v91/portrait-safe-return-choice.png), [가로 두 출구와 코치](../visual/implemented/v91/landscape-risk-return-choice.png), [740×320 귀환 조작](../visual/implemented/v91/small-safe-return-choice.png)
- [조용한 귀환 결산](../visual/implemented/v91/small-safe-recap.png), [짧은 귀환 결산](../visual/implemented/v91/landscape-risk-recap.png), [물약 선택 결과](../visual/implemented/v91/desktop-risk-recap.png)
- [14턴 붕괴](../visual/implemented/v91/retry-safe-retry-prompt.png), [체크포인트 복구](../visual/implemented/v91/retry-safe-retry-restored.png), [다시 도전 1회 결산](../visual/implemented/v91/retry-safe-recap.png)

## 규칙 조합 보조 검수

[verify-v91-rules.mjs](tools/verify-v91-rules.mjs)는 DOM 없는 별도 게임 규칙 시뮬레이션이다. 1,224 **시나리오 조합**이며 중복 행동열이 있으므로 1,224개의 고유 경로를 뜻하지 않는다.

- 1,200조합: 자유 행동 단계 5곳 × 해당 단계의 대기 0/1/2/4/8턴 × 이동 방식 3개 × 귀환길 2개 × 보상 3종/건너뛰기 × 선택 상자 개봉/미개봉. 짝수 대기 설정에서는 허용되고 비용을 낼 수 있을 때 숨죽이기도 사용한다.
- 24조합: 자유 행동 단계 5곳 모두 2턴 대기, 가능한 숨죽이기와 상자 개봉을 고정한 뒤 이동 방식 3개 × 귀환길 2개 × 보상 4선택.
- 모든 행동의 허용 여부와 실제 규칙 적용, 자원 부족 시 새 추출, 보상 해결, 적과 전투, 유물→예보→입구 탈출을 확인했다. 성공 1,224 / 손실 0 / 예외 0. 유인 후 체력 22로 통과와 실제 불씨 화살+단검 공격 5도 각 1,224회 확인했다.
- 이 결과는 터치·모달·시각 배치를 검증하지 않는다. 위 실제 브라우저 결과가 그 부분을 담당한다.

## 검증의 한계

Chromium의 모바일 화면·터치·축소 모션 에뮬레이션을 사용했다. 실제 iPhone/Safari 및 Android 기기에서는 검증하지 않았다. 이번 브라우저 완주는 고정된 회상 지도이며 임의의 실전 20방 탐험 완주를 뜻하지 않는다. 실전 B5 윈치·20방 지도·유물 회수 모션의 이전 증거는 [V9 검수](V9-VERIFICATION.md)에 따로 남아 있다.

## 공개 주소

준비된 [V9.1 플레이 주소](https://jjsjb88-alt.github.io/ember-vault/dist/?v=20261106b)와 [배포 Actions](https://github.com/jjsjb88-alt/ember-vault/actions/workflows/jekyll-gh-pages.yml)를 참고한다. 이 문서는 로컬 검수 결과만 기록하며 공개 주소의 직접 접속·배포 성공은 검증하지 않았다.
