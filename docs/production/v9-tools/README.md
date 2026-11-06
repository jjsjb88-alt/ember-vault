# V9 Agent Sprite Forge 실행 기록

2026-11-06. 사용 저장소는 [agent-sprite-forge](https://github.com/0x0funky/agent-sprite-forge), 커밋 `72fa5ad92d79b811acff464da32c8f3b1caa010f`, 검사 도구 버전 `0.4.0`이다. 도구는 외부 `/tmp/ember-tools/agent-sprite-forge`에서 실행하며 게임 런타임에 포함하지 않는다. [MIT 고지](../licenses/Agent-Sprite-Forge-LICENSE.txt).

읽고 적용한 지침은 저장소의 `skills/generate2dsprite/SKILL.md`, `skills/generate2dmap/SKILL.md`, `skills/generate2dmedia/SKILL.md`, `skills/video2dsprite/SKILL.md`다. 수치 검사가 화면의 미적 품질을 증명하지 않는다는 지침을 따라 검사 결과와 육안 확인, 확인하지 못한 범위를 나눠 기록한다.

## 환경 진단

```sh
cd /tmp/ember-tools/agent-sprite-forge
python3 skills/generate2dmedia/scripts/forge_doctor.py \
  --host-tools image_gen,image_edit --no-exec \
  --save /tmp/ember-tools/forge-doctor-20261106.json
```

[원본 진단 JSON](forge-doctor.json): Python 3.12.14, NumPy 2.3.5, Pillow 12.3.0, SciPy 1.17.0으로 로컬 검사가 가능했다. 전체 `OK`, 실패·경고는 0개이며 외부 API 키, Grok CLI, SVG 렌더러 등 선택 기능 7개는 `MISSING`이다. 내장 이미지 도구는 선언되었지만 동영상 생성 경로는 없다. `--no-exec` 진단이므로 로컬 CLI 로그인이나 생성 호출 성공을 검증한 기록으로 해석하면 안 된다. 실제 Forge 사용은 아래의 오프라인 자산·연결 검사다.

## 포커스 표시 atlas 검사

```sh
cd /workspace/ember-vault-v9
python3 /tmp/ember-tools/agent-sprite-forge/skills/generate2dsprite/scripts/sheet_qc.py spill \
  --input dist/assets/v9/props/focus/focus-ring.png \
  --rows 1 --cols 4 --key none \
  --output-dir docs/production/v9-tools/forge-focus-spill
```

[검사 JSON](forge-focus-spill/sheet-qc.json), [경계 표시](forge-focus-spill/spill-overlay.png). 결과는 **WARN**이다. 셀 사이 연결 성분, 희미한 경계 침범, 이미지 가장자리 잘림, 빈 프레임, 경계 1px 내부 콘텐츠, 알파 잡티는 모두 0개다. `safe_frame`은 4개 셀에서 경고: **“owned art closer than 15% of the cell to its edge; ask for more margin next time”**.

이 파일은 인물 애니메이션이 아닌 인터랙션 위치를 둘러싸는 마름모 UI 표식이다. 50×50 패킹 영역에서 관측된 외곽 여백은 3–6px이고, 실제 48×48 그림 셀도 3px 이상 여백을 유지한다. 이 의도적인 외곽 사용을 기록하고 경고를 숨기도록 임계값을 바꾸지 않았다. 시트와 밝음/어두움 미리보기를 직접 확인했다. 픽셀 복제·렌더 무결성·브라우저 APNG 재생은 [Pixelbolt 제작 기록](../tools/v9-props/README.md)에서 별도로 확인한다.

## 실제 엔진에서 추출한 던전 연결

[export-forge-chunks.mjs](export-forge-chunks.mjs)는 `dist/engine.js`의 `newRun`, `apply`, `neighbours`, `moveCost`를 직접 사용한다. `seed=20261106`의 기존 16방과 확장 20방을 추출하고 17번 방에서 실제 `interact` 명령을 실행해 승강 통로가 열린 상태를 추가한다. 상태를 고치거나 원본 게임 파일을 쓰지 않는 QA 전용 스크립트다.

인접한 방은 64×64 도식 청크의 맞물리는 문으로 표현한다. 서로 떨어진 9↔17 승강 연결은 별도 왕복 포털 번들로 표현하여 없는 인접문을 만들지 않는다. 스크립트와 결과의 출처 해시는 [source-and-routes.json](map-inputs/source-and-routes.json)에 기록했다. 이후 엔진의 다른 변경을 감지하여 다시 추출했고, 청크·포털 5개 입력과 모든 귀환 비용이 동일함을 [후속 해시·동등성 기록](map-inputs/latest-topology-recheck.json)으로 확인했다.

| 검증 상태 | 방 | 엔진 간선 | Forge 결과 |
| --- | ---: | ---: | --- |
| 기존 구조 | 16 | 23 | [strict PASS](map-classic/chunk-report.json), 경고 0 |
| B5 확장 | 20 | 28 | [strict PASS](map-expanded/chunk-report.json), 경고 0 |
| 승강 통로 개방 | 20 | 29 | [청크 strict PASS](map-expanded-winch/chunk-report.json), 경고 0 |
| 승강 출입구 9 | — | 9→17 | [내비게이션 PASS](lift-room-9/nav-report.json), 도달불가·좁은 틈 0 |
| 승강 출입구 17 | — | 17→9 | [내비게이션 PASS](lift-room-17/nav-report.json), 도달불가·좁은 틈 0 |

포털 양쪽에서 입구가 트리거 밖에 있고 반대편 귀환 포털과 연결되는지도 검사했다. [전체 방 도식](map-expanded/chunk-debug.png)은 직접 열어 확인했다.

| B5 출발 방 | 개방 전 입구까지 걷기 비용 | 개방 후 | 개방 전/후 통과 간선 수 |
| --- | ---: | ---: | --- |
| 16 이끼 숨터 | 5 | 5 | 4 / 4 |
| 17 귀환 윈치실 | 7 | 4 | 5 / 4 |
| 18 쇳소리 보물고 | 9 | 6 | 6 / 5 |
| 19 용의 기억실 | 8 | 8 | 7 / 6 |

걷기 비용은 엔진의 방별 이동비를 합산하며 살아 있는 적은 제외한다. 19번 방처럼 통과 방 수가 줄어도 다른 기존 경로의 이동비가 더 작아 최소 걷기 비용은 그대로일 수 있다. 이 수치만으로 적 교전, 은신/돌진, 보상, 최종 게임 균형을 증명하지 않는다. 도식 청크는 실제 배경 그림의 충돌이나 모바일 터치 영역을 검증하지 않는다.

재현 명령은 프로젝트 루트 기준이며, 출력 폴더는 새 경로여야 한다.

```sh
node docs/production/v9-tools/export-forge-chunks.mjs /tmp/ember-v9-forge-map-inputs

python3 /tmp/ember-tools/agent-sprite-forge/skills/generate2dmap/scripts/validate_chunks.py \
  --chunks /tmp/ember-v9-forge-map-inputs/classic.json --start room-0 \
  --output-dir /tmp/ember-v9-forge-classic --strict-qc
python3 /tmp/ember-tools/agent-sprite-forge/skills/generate2dmap/scripts/validate_chunks.py \
  --chunks /tmp/ember-v9-forge-map-inputs/expanded.json --start room-0 \
  --output-dir /tmp/ember-v9-forge-expanded --strict-qc
python3 /tmp/ember-tools/agent-sprite-forge/skills/generate2dmap/scripts/validate_chunks.py \
  --chunks /tmp/ember-v9-forge-map-inputs/expanded-winch.json --start room-0 \
  --output-dir /tmp/ember-v9-forge-expanded-winch --strict-qc

python3 /tmp/ember-tools/agent-sprite-forge/skills/generate2dmap/scripts/map_nav.py check \
  --bundle /tmp/ember-v9-forge-map-inputs/expanded-winch-lift-room-9.json \
  --link /tmp/ember-v9-forge-map-inputs/expanded-winch-lift-room-17.json \
  --output-dir /tmp/ember-v9-forge-lift-9 --debug-scale 4
python3 /tmp/ember-tools/agent-sprite-forge/skills/generate2dmap/scripts/map_nav.py check \
  --bundle /tmp/ember-v9-forge-map-inputs/expanded-winch-lift-room-17.json \
  --link /tmp/ember-v9-forge-map-inputs/expanded-winch-lift-room-9.json \
  --output-dir /tmp/ember-v9-forge-lift-17 --debug-scale 4
```

## 유물 회수 14프레임의 독립 검사

최종 `dist/assets/v9/motion/rogue-relic-se/fullframe/`를 입력으로 실제 `sheet_qc.py frames`와 `animation_review.py review`를 실행했다. 방향은 SE이므로 오른쪽 판정이며, **제자리에서 수행하는 단발 회수 동작**이므로 `--cycle none --no-loop`를 사용했다. 프레임 생성·수정·정렬은 이 Forge 검사에서 하지 않았다.

```sh
python3 /tmp/ember-tools/agent-sprite-forge/skills/generate2dsprite/scripts/sheet_qc.py frames \
  --frames dist/assets/v9/motion/rogue-relic-se/fullframe/*.png \
  --frames-per-row 7 --cycle none --no-loop --facing right --key none \
  --output-dir docs/production/v9-tools/forge-relic-frames

python3 /tmp/ember-tools/agent-sprite-forge/skills/video2dsprite/scripts/animation_review.py review \
  --frames-dir dist/assets/v9/motion/rogue-relic-se/fullframe \
  --out-dir docs/visual/implemented/v9/forge-relic-review \
  --fps 10 --preview-size 192

python3 docs/production/v9-tools/review-relic-browser.py
```

[원본 프레임 QC](forge-relic-frames/sheet-qc.json)의 전체 결과는 **FAIL**, 종료 코드 1이다. 기본 임계값을 완화해 결과를 통과로 바꾸지 않았다.

| 검사 | 실제 결과 | 해석 |
| --- | --- | --- |
| `identity_head_ratio` | **FAIL**: 1·2·3·5·7·9번의 머리 밴드 비율이 0.942 또는 1.058. 기준 0.95–1.05 | 최대 편차 5.8%가 기본 5%를 0.8%p 초과한다. 단순히 오탐이라고 단정하지 않으며 자동 기준 미충족을 남긴다. |
| `identity_residual` | PASS, 기준 1.5 이내 | 머리 템플릿의 색/모양 잔차 기준은 통과했다. 위 크기 기준과 별개다. |
| `near_duplicates` | WARN: 0↔13 | 원본 대기 자세로 되돌아가는 의도적인 같은 시작·끝 이미지. 인접 중복은 없다. |
| `torso_drift` | WARN: 35.3 source px, 기준 2px | 몸을 숙여 손을 내밀고 들어 올리는 포즈 변화가 포함된다. 이를 없애기 위한 몸통 고정 보정은 수행하지 않았다. |
| `row_baseline` | PASS: 두 행의 고체 알파 바닥 434, 행간 편차 0 | 프레임의 전체 알파 바닥은 436이다. 임계값에 따른 측정 차이를 구분한다. |
| `seam` | PASS: 최대/중앙 전환 비율 1.32, 기준 1.5 | 단발 동작의 13개 내부 전환. 마지막→처음 루프는 검사하지 않았다. |
| 보행 위상/발 교대 | SKIPPED | 정지 회수 동작이므로 보행 성능을 주장하지 않는다. |

[QC 표시 이미지](forge-relic-frames/frames-review.png)와 [전체 프레임 HTML 리뷰](../../visual/implemented/v9/forge-relic-review/index.html)를 사용했다. 리뷰 원본 JSON은 `needs-visual-review` 상태를 유지한다. 512×512 RGBA 14프레임, 1.4초, 고유 프레임 13개, 빈 프레임·인접 완전중복 0개다. 자동 반복 후보를 골라 보행 루프를 만든 작업이 아니다.

별도 [브라우저 검수 스크립트](review-relic-browser.py)는 실제 Chromium에서 이 리뷰를 재생하고 모든 프레임을 밝고 어두운 배경, 인물 높이 약 72px/128px로 캡처했다. [재생 결과 JSON](../../visual/implemented/v9/forge-relic-review/browser-review.json)은 브라우저 오류 0개와 실제 프레임 진행을 기록한다.

- [72px 어두운 배경](../../visual/implemented/v9/forge-relic-review/body-72-dark-all.png), [72px 밝은 배경](../../visual/implemented/v9/forge-relic-review/body-72-light-all.png): 숙임→손 올림→가슴 쪽 회수→원상복귀와 등불·망토의 구분은 읽힌다. 손의 청록 유물은 작은 점이므로 완료 텍스트와 봉인 해제 효과가 의미 전달을 보완해야 한다.
- [128px 어두운 배경](../../visual/implemented/v9/forge-relic-review/body-128-dark-all.png): 손의 청록 유물과 회수 흐름까지 읽힌다. 눈에 띄는 갑작스러운 머리 교체는 관찰하지 않았지만 자동 머리 크기 기준 실패를 취소하는 근거로 취급하지 않았다.
- 0/13번은 원본 보행 자산의 한 발 든 기본 자세, 중간 프레임은 양발로 버티는 회수 자세다. 발 기준이 화면에서 흔들리지 않고 캐릭터의 청록 망토·금속 장비·등불이 유지되는지 직접 확인했다.

추가 [머리 밴드 확대](forge-relic-frames/head-band-review.png)를 같은 화소 배율에서 확인했다. Forge의 이 측정은 얼굴만 분리하지 않고 몸 상단 35%를 템플릿으로 삼기 때문에 긴 머리·망토·어깨와 일부 손/등불도 포함한다. 숙임에 따라 이 영역이 달라지는 만큼 수치를 실제 얼굴 크기의 증감으로 바로 해석할 수 없다. 담당자는 전체 contact와 대표 72/128px 검토에서 정체성·동작 판독성을 확인해 이 단발 동작을 채택했다. 이는 기본 자동 기준을 통과했다는 판정과 구분한다.

이 리뷰는 대표 크기의 독립 미리보기이며 통합 게임 화면의 배경·배치·폰 성능을 검증하는 절차를 대신하지 않는다. 작은 손의 유물 판독성과 머리 밴드 자동 기준 미충족은 남는 품질 한계다.
