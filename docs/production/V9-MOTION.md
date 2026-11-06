# V9 SE 유물 회수 동작 제작 기록

기존 `dist/assets/rogue-walk-v5.png`의 SE 도적을 기준으로, 유물을 발견해 손을 뻗고 들어 올린 뒤 허리 주머니에 넣고 원래 자세로 돌아오는 14프레임 동작을 제작했다. **2dimg2motion의 참조 기반 전체 캐릭터 생성 절차와 실제 sprite-gen CLI를 사용했다.** 코드로 관절을 회전하거나 새 자세를 그리지 않았다.

최종 산출물: [`dist/assets/v9/motion/rogue-relic-se/`](../../dist/assets/v9/motion/rogue-relic-se/). 이 기록의 범위는 에셋 제작이며 게임 이벤트 연결은 별도 작업이다.

## 런타임 계약

| 항목 | 값 |
| --- | --- |
| 방향 / 동작 | SE / 정지 상태의 단발 유물 회수 |
| PNG 셀 | RGBA, 512 × 512, 14장 |
| 시트 | `spritesheet.png`, 3584 × 1024, 7열 × 2행, 1,701,341 bytes |
| 재생 | 10 fps, 각 100 ms, 총 1,400 ms, `loop: false` |
| 발 기준 / 앵커 | `footBaseline: 436`, `anchor: {x:287,y:436}` |
| 시트 좌표 | `manifest.json`의 `frame_layout.rows.relic[]` |
| 키포즈 | 02, 05, 08, 11 |
| 앵커 / 삽입 수 | 00,02,05,08,11,13 / 1,2,2,2,1 |
| 이벤트 | 02 발견, 05 유물 접촉, 08 들어 올림, 10 주머니 수납, 13 원복 |
| 기준 높이 | 원본을 표준화한 몸체 높이 360 px. 셀 전체 높이와 다름 |
| 프리뷰 | `preview.gif`: 14프레임, 100 ms, 순백 배경. 검토 편의를 위한 반복 GIF이며 런타임 동작은 단발 |

`00`과 `13`은 파일 바이트까지 동일하다. 원본 보행의 한 발 든 자세로 시작하고 끝나며, 중간에 양발을 내려 회수한다. 이동 거리를 발생시키는 보행 애니메이션이 아니므로 stride/root-motion 값을 적용하지 않는다.

## 원본 분석과 정체성 고정

- 원본 위치는 `WALK_FRAMES[0][1]`, `x202 y36 w152 h245`. `scene-layout.js`의 방향 순서 `E,SE,S,SW,W,NW,N,NE`를 확인했다.
- 성인 여성 도적의 작은 얼굴과 가는 체형, 화면 왼쪽으로 흐르는 검은 머리, 청록 망토, 검정 가죽과 금색 테두리, 벨트/주머니/긴 부츠를 고정했다.
- **화면 왼쪽 어깨에 연결된 왼쪽 손이 은색 단검을 아래 왼쪽으로 든다. 화면 오른쪽 어깨/팔/손이 황동 랜턴을 소유한다.** 해부학적 좌우를 혼용하지 않고 모든 프롬프트와 manifest를 screen-space로 작성했다.
- 원본의 양손이 이미 차 있으므로 오른쪽 손목/손잡이에 랜턴이 계속 매달리고, 같은 오른손 바닥이 작은 청록 유물을 받도록 했다. 유물은 05에서 생기고 08에서 올라가며 10에서 기존 허리 주머니에 들어간다. 세 번째 손이나 소품의 좌우 교환은 허용하지 않았다.
- 생성 배경은 캐릭터에 없는 마젠타. 분리된 마법 효과, 바닥, 그림자, 텍스트를 생성하지 않았다.

자세별 프롬프트 및 사이프레임 지시는 [`keyframe-prompts.md`](../../dist/assets/v9/motion/rogue-relic-se/keyframe-prompts.md)에 기록했다. 기록은 제작에 사용한 정체성 블록, 자세 지시 및 호출 설정을 정리한 것이며 모델의 결정론적 재현을 보장하지 않는다.

## 사용한 원본 도구

| 도구 | 고정 버전 / 라이선스 | 실제 수행 |
| --- | --- | --- |
| [2dimg2motion](https://github.com/WU-HAOTIAN34/2dimg2motion) | `d4d73e243b6ff64b7cbb3879e45e951f972a7e62`, MIT | SKILL/참조 절차, baseline 표준화, 4키포즈+8사이프레임 생성 계획, GIF 생성, 14프레임 검증 |
| [sprite-gen](https://github.com/aldegad/sprite-gen) | 3.15.0, `4f5ccd55c7cf06685a41f954acc1e476b7772ece`, Apache-2.0 | 마젠타 컷아웃/edge decontamination, 프레임 import, atlas pack, inspect/score, preview, inspect-motion |
| 호스트 `image_gen` | 세션 제공 이미지 생성 도구 | 전체 캐릭터 키포즈 시트 2회와 사이프레임 시트 2회 생성. 첫 키포즈는 폐기, 총 4회 |

읽고 적용한 2dimg2motion 파일: `SKILL.md`, `references/keypose-redraw.md`, `references/motion-prompt-patterns.md`, `skills/img2mo-std/SKILL.md`. sprite-gen의 독립 utility/import 경로와 `docs/curation.md`, `docs/engine-export.md`, `docs/qa-motion.md`를 적용했다. sprite-gen 자체의 유료 생성 API를 호출했다고 주장하지 않는다. 이미지 생성은 호스트 도구, 후처리/패킹/검수는 실제 sprite-gen 실행이다.

## 실제 제작 순서와 호출

작업 디렉터리는 `/tmp/ember-motion-v9`, 도구 설치는 `/tmp/ember-tools/{2dimg2motion,sprite-gen}`를 사용했다. sprite-gen은 자체 `.venv`의 CLI로 실행했다.

1. 원본 SE 영역을 자르고 `view_image`로 확인했다. 다음 도구로 몸체를 360 px로 표준화했다.

```bash
python3 /tmp/ember-tools/2dimg2motion/scripts/standardize_baseline.py \
  /tmp/ember-motion-v9/rogue-se-source.png \
  --output /tmp/ember-motion-v9/rogue-se-standard.png \
  --subject-max 360 --margin-ratio 0.55
```

결과는 몸체 223×360, 캔버스 619×756, 여백 각198, 원본 대비 배율 `1.469387755102041`, 경고 0. 참조 편의를 위해 투명 768×768에 평행이동하여 넣었다. 최종 512×512 endpoint는 이 표준 원본을 다시 평행이동한 것뿐이며 재생성하지 않았다.

2. 참조 이미지와 정체성 블록으로 **4키포즈를 하나의 image_gen 호출에서 함께 생성**했다. 첫 시트는 얼굴/상체가 다소 둥글고 두꺼워 보여 제외했다. 두 번째 호출은 표준 참조와 원본 확대 참조를 함께 주고 성인의 가는 비율을 강조했다. 두 번째 시트만 승인했다.
3. 승인 키포즈/표준 원본/원본 크롭을 모두 참조하여 사이프레임을 4장씩 두 번 생성했다. 투명 배경을 요청한 것이 아니라 `transparent_background:false`와 마젠타 배경을 사용했다. 실제 시트는 모두 1254×1254, 셀 627×627이었다.
4. sprite-gen으로 각 승인 시트의 마젠타를 제거했다. 세 시트 모두 같은 옵션을 사용하고 cyan/magenta/yellow 합성 확인 이미지를 만들었다.

```bash
/tmp/ember-tools/sprite-gen/.venv/bin/sprite-gen cutout \
  /tmp/ember-motion-v9/keyposes-approved-source.png \
  --out /tmp/ember-motion-v9/keyposes-cutout.png \
  --key magenta --decontam auto --white-check
```

5. 투명한 셀을 분리한 뒤 **모든 생성 프레임에 한 배율 `515/627`**을 적용했다. 전체 셀의 수평 이동은 15 px로 고정하고 수직 이동만 발끝 `y436`에 맞췄다. 프레임별 자동 확대, 신체 일부 이동, 보간, 워프, 픽셀 그림 생성은 하지 않았다. A 시트의 두 깊이 중간 자세는 실제 숙임 정도에 맞춰 최종03/04의 순서를 선택했다. 키포즈04장이 확정된 뒤 `keyframe/`과 `fullframe/`에 동일 픽셀을 복사했다.
6. 정규화된 프레임을 실제 sprite-gen run으로 import했다. 동작 메타데이터를 `fps:10, loop:false`로 지정하고 패킹했다.

```bash
/tmp/ember-tools/sprite-gen/.venv/bin/sprite-gen unpack-atlas \
  --pngs-dir /tmp/ember-motion-v9/approved/fullframe --state-name relic \
  --out-dir /tmp/ember-motion-v9/sprite-gen-run --force
/tmp/ember-tools/sprite-gen/.venv/bin/sprite-gen compose-atlas \
  --run-dir /tmp/ember-motion-v9/sprite-gen-run \
  --atlas spritesheet.png --manifest manifest.json --report pack-report.json
/tmp/ember-tools/sprite-gen/.venv/bin/sprite-gen inspect \
  --run-dir /tmp/ember-motion-v9/sprite-gen-run --states relic --report qa-inspect.json
/tmp/ember-tools/sprite-gen/.venv/bin/sprite-gen score \
  --inspect-report /tmp/ember-motion-v9/sprite-gen-run/qa-inspect.json \
  --output /tmp/ember-motion-v9/sprite-gen-run/qa-score.json
/tmp/ember-tools/sprite-gen/.venv/bin/python \
  /tmp/ember-tools/sprite-gen/scripts/preview_animation.py \
  --run-dir /tmp/ember-motion-v9/sprite-gen-run
```

`compose-atlas`는 raw 생성 경로가 없는 PNG import run을 유지한다는 heal 메시지를 출력했다. 이는 의도된 PNG import이며 재생성을 시도하지 않았다. **패킹 후 14개 시트 셀을 다시 잘라 입력 프레임과 RGBA 전체 바이트가 동일함을 별도로 검사했다.** manifest의 `frame_variant:pixel`은 import 경로 기본 표기이며 추가 픽셀화가 수행되었다는 뜻이 아니다.

최종 모바일 배포 시트는4096px 이하로 유지하도록 **같은14PNG를 sprite-gen으로 다시7열×2행 패킹**했다. 이 버전의 `compose-atlas`는 state당 한 행이며 max-width 옵션이 없다. 따라서 임시 `mobile-packing-input/pack_00`에00–06, `pack_01`에07–13 원본 파일을 복사하고 두 그룹을 실제 CLI로 import/compose했다. 프레임 그림이나 배율을 변경하지 않았다.

```bash
/tmp/ember-tools/sprite-gen/.venv/bin/sprite-gen unpack-atlas \
  --pngs-dir /tmp/ember-motion-v9/mobile-packing-input \
  --out-dir /tmp/ember-motion-v9/mobile-packing-run --force
/tmp/ember-tools/sprite-gen/.venv/bin/sprite-gen compose-atlas \
  --run-dir /tmp/ember-motion-v9/mobile-packing-run \
  --atlas spritesheet.png --manifest packing-manifest.json --report packing-report.json
```

실제 import 출력은 `layout_source:"imported-pngs", states:["pack_00","pack_01"], cell:[512,512], frames:14, ok:true`, compose 출력은 `ok:true`였다. **픽셀 패킹은 sprite-gen 결과를 그대로 사용했다.** 그 후 런타임 메타데이터만 두 물리 행의7+7 rect를 `frame_layout.rows.relic`의14개 순서로 합쳤다. 논리 애니메이션은 여전히14프레임/10fps/1400ms/단발이다. 새 시트의14crop 모두 기존 fullframe RGBA 바이트와 동일하며 개별 프레임의 SHA256도 변하지 않았다. 최종 manifest를 실제 `inspect-motion` 입력으로 다시 실행하여14프레임과1.4초가 유지됨을 확인했다.

7. 2dimg2motion으로 순백 GIF를 만들고 구조 검사했다. sprite-gen의 checker/transparent QA 프리뷰는 임시 작업에서 사용하고, 최종 GIF는 요구된 흰 배경 파일을 사용했다.

```bash
python3 /tmp/ember-tools/2dimg2motion/scripts/fullframes_to_gif.py \
  /tmp/ember-motion-v9/approved/fullframe \
  --output /tmp/ember-motion-v9/approved/preview.gif --duration-ms 100
python3 /tmp/ember-tools/2dimg2motion/scripts/validate_14frame_pattern.py \
  --baseline /tmp/ember-motion-v9/rogue-se-baseline.png \
  --keyframes-dir /workspace/ember-vault-v9/dist/assets/v9/motion/rogue-relic-se/keyframe \
  --fullframes-dir /workspace/ember-vault-v9/dist/assets/v9/motion/rogue-relic-se/fullframe \
  --preview /workspace/ember-vault-v9/dist/assets/v9/motion/rogue-relic-se/preview.gif \
  --prefix rogue-relic-se
```

## 검수와 제한

- 구조 검사: `OK`. RGBA 14장, 키4장, 투명 모서리, 동일 셀, 발끝436, endpoint 바이트 동일, 표준 원본 보존, key/full 픽셀 동일, 흰 GIF14장을 확인했다.
- sprite-gen pack/inspect: `ok:true`, errors0, warnings0. histogram intersection 최솟값0.8193, dHash similarity 최솟값0.8594, motion presence0.02687. score100. **이 수치는 미술 품질의 확정 판정으로 사용하지 않았다.**
- `inspect-motion`: 13/13 인접 전환에 실제 픽셀/실루엣 변화, 인접 중복0, 전체 중복1(의도한00=13), 셀 가장자리 접촉0. 몸체 높이310–372는 숙임/복귀 자세를 포함한다. 전체 발끝 범위436–436.
- 시트 전체와 흰 배경 GIF를 열어 확인했고, 모든 자세의 단검 손/랜턴 손/어깨 연결, 두 다리, 머리/망토/금색 장비를 확인했다. 외곽 마젠타나 잘린 신체는 보이지 않았다. `clank_docs`의 독립 contact-sheet 검토에서도 정체성과 발견→숙임→유물 상승→수납→원복 흐름이 읽힌다고 판정했다.
- `inspect-motion`은 `status:needs-review`, `stride_verified:false`를 유지한다. 이 도구는 지면 접촉이 불명확하면 보행 속도를 검증하지 않는다. 시험적으로 사용한 발 ROI는 두 신발을 함께 잡아 접촉 추정이 실패했으므로 해당 추정값을 버렸다. 최종 관측 명령은 접촉 구간/ROI를 선언하지 않았다. 정지 회수 동작의 검수에 보행 stride 통과를 주장하지 않는다.

### Forge 자동 FAIL과 별도 시각 채택

다른 담당자가 최종 배포 경로의 파일로 실행한 Agent Sprite Forge 원문 보고서는 [`v9-tools/forge-relic-frames/sheet-qc.json`](v9-tools/forge-relic-frames/sheet-qc.json)에 보존한다. **전체 자동 판정은 FAIL이며 이를 PASS로 바꾸지 않았다.** `identity_head_ratio`가 프레임01,02,03,05,07,09에서0.942 또는1.058로 기본 허용 범위0.95–1.05를 벗어났다. `identity_residual`은PASS, seam1.32는PASS, row baseline은PASS다. 중복00=13과 torso drift35.3에는WARN이 있다.

원본 `sheet_qc.py:626–695`를 읽고 실제 측정 영역을 확인했다. `head_ratio`는 얼굴/두개골 분할 측정이 아니라 **전체 몸의 상단35% band**를 비교한다. 원본 band는200×123px이며 긴 머리, 망토와 어깨, 원본의 오른손/랜턴 일부도 포함한다. 이 영역을 약32px 높이로 축소한 뒤0.90–1.10 배율을0.02 간격으로 맞추고 전체 중앙값1.04로 나눈다. 따라서 보고된1.058은1.10/1.04,0.942는0.98/1.04다. 원본 그대로인00과13도0.962로 보고된다. 숙인 자세에서는 몸체 높이에 따라 band 높이가107/109px로 바뀌며 머리카락/어깨/팔이 차지하는 비율도 변한다. 측정 도구 자체도 band에 머리만 들어 있다는 것을 증명하지 않는다고 명시한다.

같은 화소 배율의 [14개 head-band](v9-tools/forge-relic-frames/head-band-review.png)와 전체 contact sheet, 별도 [72px 게임 크기](../visual/implemented/v9/forge-relic-review/body-72-dark-all.png)/128px 검토에서 얼굴/머리 크기와 의상/무기 소유의 갑작스러운 변경이 관찰되지 않았다. 제작 담당, 독립 검토 담당, root 담당이 이를 확인하여 **정지 회수 동작을 시각적으로 채택**했다. 원문 FAIL을 유지하면서 이 동작의 자세 변화가 band에 섞이는 한계를 기록한 판정이며, 모든 자동 검사가 통과했다는 뜻이 아니다. 프레임별 배율 수정, threshold 완화, 실패 report 덮어쓰기, 검사 항목 삭제를 하지 않았다. 검수 원문/게임 크기 자료와 실행 명령은 [`V9-TOOLS.md`](V9-TOOLS.md)에 종합한다.

```bash
/tmp/ember-tools/sprite-gen/.venv/bin/sprite-gen inspect-motion \
  --source /workspace/ember-vault-v9/dist/assets/v9/motion/rogue-relic-se/manifest.json --state relic \
  --fps 10 --anchor-x 287 --anchor-y 436 --facing right \
  --out /tmp/ember-motion-v9/mobile-final-motion.json
```

최종 manifest의 `production` 필드에 도구 커밋, 구조/패킹/자동 검사 요약 및 미검증 stride 경고를 남겼다. 최종 동작 디렉터리에는 계약 파일만 두고 생성 원본/실패안/크로마 시트/임시 분리물을 넣지 않았다. 호스트 image_gen이 자동 저장한 원본은 도구 요구대로 `/workspace/generated_images/`에 보존하며 게임 배포에는 포함하지 않는다.

## 생성 출처와 체크섬

| 단계 | 호스트 자동 저장 파일 | 판정 |
| --- | --- | --- |
| 첫 키포즈 | `exec-bcb72b14-3e1e-4dfe-ba31-4a6a55ba162b.png` | 비율이 두꺼워 제외 |
| 승인 키포즈 | `exec-3256322d-7785-4c31-b4b5-567e4e62ed3e.png` | 사용 |
| 사이프레임 A | `exec-4c928fb7-e339-4919-9b9a-726fd6249f54.png` | 사용 |
| 사이프레임 B | `exec-52c0c0ba-87f8-44f2-bc32-6c65d04ce2e9.png` | 사용 |

원본 SE 크롭 SHA256: `28f794047b715e5e4c34287c1e2191c69b6fa4c044af8c84242ba1e6620b75a4`.

승인 키포즈 원본 SHA256: `5ee4718347219edbdf0d4a654e06027b9973eadfaa1176197d3c7913aaac0429`.

최종7×2 시트 SHA256: `d27f2855877a896b20f4673c55dcc57175b4cefb9ff48cb3e5f36134b1cf9e30`. 개별 PNG와 원본 atlas의 SHA256은 manifest에 기록했다.
