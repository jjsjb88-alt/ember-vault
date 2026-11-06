# V9 — 요청된 8개 도구의 실제 적용 기록

2026-11-06. 튜토리얼의 목표·위험·귀환 수단을 화면에서 구분하고, B5의 작은 확장을 검증하는 데 도구를 사용했다. README 확인과 실제 실행을 구분한다. **7개는 제작 또는 검사에 실행했고, Sprite-Sheet-Diffusion은 연구 검토만 수행했다.** Python·GPU 모델을 게임에 추가하는 방식이 아니라 제작된 이미지, 작은 효과 모듈과 검사 증거를 보존한다.

| 도구 | 이번 작업에서 실제 수행한 일 | 산출물·증거 |
| --- | --- | --- |
| [agent-sprite-forge](https://github.com/0x0funky/agent-sprite-forge) | 환경 진단, 포커스 atlas·14프레임 모션 독립 QC, 브라우저 리뷰, 엔진에서 추출한 16/20방 청크 및 9↔17 왕복 승강 연결 검사 | [Forge 실행·명령·제한](v9-tools/README.md), 원본 JSON·도식. 모션의 자동 머리 비율 FAIL도 원문 보존 |
| [Codixel](https://github.com/mankidev/codixel) | `core/pixel.js`로 윈치·메아리 흔적·보급함 3종과 전략 선택 글리프 4종을 실제 생성 | [소품 제작 기록](tools/v9-props/README.md), [밝음/어두움 1×·4× 비교](../visual/implemented/v9/props/props-review.png) |
| [Pixelbolt](https://github.com/skulitom/Pixelbolt) | 포커스 표시 원본을 validate → inspect → render `--expect`로 제작하고 APNG를 Chromium에서 재생 | 48×48 4프레임, 960ms, [atlas·재현 기록](tools/v9-props/README.md) |
| [PixelOE](https://github.com/KohakuBlueleaf/PixelOE) | 실제 legacy API를 CPU에서 실행해 기존 배경의 돌 표면 일부만 처리 | [환경 제작 기록](V9-ENVIRONMENT.md), B5 배경 PNG, 마스크·전후 비교 |
| [pixelfx](https://github.com/patch-gg/pixelfx) | 윈치 체결 `impacts/parry`, 유물 봉인 해제 `pickups/collect-burst`를 팔레트 지정해 렌더·검수·검사 후 연결 | [명령·contact·2 PASS](../visual/implemented/v9/fx/README.md), [런타임 고지](../../dist/vendor/pixelfx/NOTICE.md) |
| [2dimg2motion](https://github.com/WU-HAOTIAN34/2dimg2motion) | 기존 도적의 정체성을 기준으로 유물 회수의 키프레임과 전체 프레임 제작 절차 적용 | 단발 회수 14프레임, 10fps / 1.4초. [실행·프롬프트·원본 기록](V9-MOTION.md), [manifest](../../dist/assets/v9/motion/rogue-relic-se/manifest.json) |
| [sprite-gen](https://github.com/aldegad/sprite-gen) | 실제 pack·inspect·inspect-motion으로 회수 프레임을 atlas로 포장하고 발 기준·중복·전환 검사 | 512×512 셀, 고정 기준점 (287,436). pack/inspect 통과와 inspect-motion의 `needs-review`·stride 미검증을 [구분 기록](V9-MOTION.md) |
| [Sprite-Sheet-Diffusion](https://github.com/chenganhsieh/Sprite-Sheet-Diffusion) | README·추론 코드·설정·라이선스 조사만 수행. 설치·훈련·추론 미실행 | 아래의 미실행 근거. SSD 생성물이나 모델 가중치는 포함하지 않음 |

## 재현 기준과 라이선스

| 도구 | 검토·실행한 commit | 라이선스 확인 |
| --- | --- | --- |
| agent-sprite-forge | `72fa5ad92d79b811acff464da32c8f3b1caa010f` | MIT, [원문](licenses/Agent-Sprite-Forge-LICENSE.txt) |
| Codixel | `604a9dcbcc4e386bc48188b5f7f49099f5d04db7` | MIT, [원문](tools/v9-props/codixel-LICENSE.txt) |
| Pixelbolt | `200c301780ae4f4ba1eb2e8563e1b5994e31974a` | MIT, [원문](tools/v9-props/pixelbolt-LICENSE.txt) |
| PixelOE | `7ce444b36d3876a151d845d4493240e904454d89` | Apache-2.0, [원문](licenses/PixelOE-LICENSE.txt) |
| pixelfx | `a84159688af3ca37a4be05a0d422b94451b2e24e` | MIT와 포함 코드 고지, [NOTICE](../../dist/vendor/pixelfx/NOTICE.md) |
| 2dimg2motion | `d4d73e243b6ff64b7cbb3879e45e951f972a7e62` | MIT, 저장소 `LICENSE` 및 모션 제작 기록 참조 |
| sprite-gen | `4f5ccd55c7cf06685a41f954acc1e476b7772ece` | Apache-2.0, 저장소 `LICENSE` 및 모션 제작 기록 참조 |
| Sprite-Sheet-Diffusion | `382c2e7a3ae8d6e012963ec19c43415159e439c7` | README의 MIT 설명과 번들 코드의 별도 조건을 구분, 아래 참조 |

작업용 복제본은 `/tmp/ember-tools/<repository>`에 두었다. 게임 재실행에 이 경로나 제작 도구가 필요하지 않다. 복제본이 삭제된 뒤 재현하려면 각 저장소를 위 commit으로 준비하고 개별 제작 문서의 커맨드에서 도구 경로를 지정한다. Codixel·Pixelbolt는 Node와 기본 라이브러리만 사용했고 API 키·GPU·추가 패키지 설치가 없었다. PixelOE의 CPU 패키지는 게임 의존성과 분리된 임시 venv에 설치했으며 상세 버전을 [환경 문서](V9-ENVIRONMENT.md)에 기록했다.

## 적용한 skill 원문

- Forge: `skills/generate2dsprite/SKILL.md`, `skills/generate2dmap/SKILL.md`, `skills/generate2dmedia/SKILL.md`, `skills/video2dsprite/SKILL.md`. [지정 commit의 skills](https://github.com/0x0funky/agent-sprite-forge/tree/72fa5ad92d79b811acff464da32c8f3b1caa010f/skills).
- Codixel: [SKILL.md](https://github.com/mankidev/codixel/blob/604a9dcbcc4e386bc48188b5f7f49099f5d04db7/SKILL.md). 1× 및 확대 미리보기·명시적 팔레트·실루엣 검토를 적용했다. 여기서는 정적 PNG를 만들었으며 Codixel sprite-sheet 내보내기는 사용하지 않았다.
- Pixelbolt: [skills/pixel-art/SKILL.md](https://github.com/skulitom/Pixelbolt/blob/200c301780ae4f4ba1eb2e8563e1b5994e31974a/skills/pixel-art/SKILL.md), `AGENTS.md`, `docs/agent-quick-start.md`. 검증·전 프레임 검사·실루엣/명도/잔상 보기·조건을 명시한 렌더를 실행했다.
- pixelfx: [skills/pixelfx/SKILL.md](https://github.com/patch-gg/pixelfx/blob/a84159688af3ca37a4be05a0d422b94451b2e24e/skills/pixelfx/SKILL.md). 기준 torch 렌더부터 후보 효과를 직접 확인하고 check 이후 포함했다.
- 2dimg2motion와 sprite-gen은 각 저장소의 `SKILL.md` 및 모션 제작 지침을 적용했다. 제작 담당의 명령·프롬프트·검사 원본은 [모션 기록](V9-MOTION.md)에서 구분한다.
- PixelOE와 SSD에서는 이 작업을 위한 `SKILL.md` 대신 README·실제 코드·라이선스를 읽었다.

## SSD를 실행하지 않은 구체적 이유

이 commit의 [readme.md](https://github.com/chenganhsieh/Sprite-Sheet-Diffusion/blob/382c2e7a3ae8d6e012963ec19c43415159e439c7/readme.md)는 Python 3.10 conda 환경과 외부 Google Drive의 fine-tuned 가중치를 안내한다. `ModelTraining/configs/prompts/inference.yaml`도 Stable Diffusion, VAE, image encoder, reference/denoising UNet, pose guider, motion module의 여러 로컬 가중치 경로를 요구한다. 가중치는 체크아웃에 들어 있지 않다.

[ModelTraining/inference.py](https://github.com/chenganhsieh/Sprite-Sheet-Diffusion/blob/382c2e7a3ae8d6e012963ec19c43415159e439c7/ModelTraining/inference.py)는 CUDA 배치를 직접 지정하며 환경에 노출된 NVIDIA GPU가 없었다. 모델 전체를 내려받거나 GPU 추론을 CPU 대체물로 흉내 내지 않았다. 다른 제작 도구에 CPU torch를 설치한 사실은 SSD의 가중치·CUDA 요건을 충족하지 않는다.

또한 README의 “MIT License / CC0 training data” 설명과 별개로 루트 `LICENSE`는 없고, 추론 코드가 가져오는 `ModelTraining/openpose`에는 **ACADEMIC OR NON-PROFIT ORGANIZATION NONCOMMERCIAL RESEARCH USE ONLY** 조건의 [별도 LICENSE](https://github.com/chenganhsieh/Sprite-Sheet-Diffusion/blob/382c2e7a3ae8d6e012963ec19c43415159e439c7/ModelTraining/openpose/LICENSE)가 있다. 포함된 다른 모듈도 원래 라이선스를 가진다. 저장소 전체를 조건 없는 MIT로 간주하지 않았으며 이 구현·가중치·생성물을 게임에 포함하지 않았다. 이것은 사용자의 게임 자체에 대한 법률 판단이 아니라 해당 도구를 이번 제작에서 제외한 근거다.

## 검사 결과의 범위

Forge의 3개 청크 검사와 양쪽 승강 연결은 통과했지만 실제 그림의 충돌, 게임 균형, 모바일 터치 영역까지 증명하지 않는다. 포커스 표시 QC의 15% 여백 경고 4개와, 회수 모션의 기본 머리 비율 기준 FAIL(최대 5.8%, 기준 5%)은 숨기지 않고 [실제 수치·대표 크기 육안 결과](v9-tools/README.md)에 기록했다. 자동 검사 전체 통과를 주장하지 않는다. 정지 회수 동작에 보행 속도나 좌우 발 교대 규칙을 억지로 적용하지 않는다. 최종 화면과 플레이 흐름 검증은 제작 도구 검사와 별도로 수행한다.
