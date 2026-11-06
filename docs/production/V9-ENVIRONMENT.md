# V9 B5 환경 배경 — 선택적 PixelOE 표면 정리

2026-11-06 제작. 기존 달의 봉인실 원본을 유지한 채 B5 전용 파생 배경의 돌바닥·석벽 일부에만 **실제 PixelOE legacy API**를 적용했다. 새로운 방 구조를 생성하거나 모든 배경을 저해상도로 변환한 작업이 아니다. 중앙 달 봉인, 횃불, 금빛 반사광, 푸른 수로, 외곽 건축 실루엣을 보존한다.

## 원본과 결과

| 항목 | 경로 / 정보 |
| --- | --- |
| 원본 | `dist/assets/lunar-vault-v6.png` — 1672×941 |
| 원본 제작 출처 | 프로젝트의 OpenAI 내장 이미지 생성 도구 제작물. [V6 제작 기록](../visual/PROMPTS-V6.md), [V6 에셋 목록](../visual/ASSETS-V6.json) 참조 |
| B5 결과 | `dist/assets/v9/environment/b5-moonstone-vault.png` — 1672×941 |
| 전체 화면 + 1:1 바닥 비교 | [b5-before-after.png](../visual/implemented/v9/environment/b5-before-after.png) |
| 실제 합성 마스크 | [b5-surface-mask.png](../visual/implemented/v9/environment/b5-surface-mask.png) — 검정은 원본 유지 |
| 생성 수치와 해시 | [b5-generation.json](../visual/implemented/v9/environment/b5-generation.json) |
| 재현 스크립트 | [prepare-v9-environment.py](tools/prepare-v9-environment.py) |

원본 SHA-256: `dc6e08e6f4f9bb9f28caf0d359746251e069fd3a73e2ff99735e8d5389ca7488`.

결과 SHA-256: `a5d0d838af1ea2bf562e839846d64636f1ab3d74eabdf948439cb5c763274952`.

## 사용 도구와 라이선스

- 원본 저장소: <https://github.com/KohakuBlueleaf/PixelOE>.
- 사용 커밋: `7ce444b36d3876a151d845d4493240e904454d89`; `pyproject.toml`의 패키지 버전은 `1.0.1`.
- 원본 `README.md`의 legacy Python API 설명과 `LICENSE`를 직접 읽고, 소스의 `pixeloe.legacy.pixelize.pixelize`를 호출했다. PixelOE 소스는 수정하지 않았다.
- PixelOE 라이선스: **Apache-2.0**, `Copyright 2024 KohakuBlueLeaf`. 원문 사본: [PixelOE-LICENSE.txt](licenses/PixelOE-LICENSE.txt).
- PixelOE는 오프라인 제작 도구로만 사용한다. 게임 런타임에 PixelOE, PyTorch, Python 패키지를 포함하지 않는다. 도구 라이선스가 기존 생성 이미지의 권리를 새로 정하거나 이미지 자체를 자동으로 Apache-2.0으로 바꾸는 것은 아니다.

README는 legacy API를 NumPy/OpenCV 기반으로 설명하지만, 이 커밋의 `legacy/outline.py`, `legacy/utils.py`, `legacy/downscale/contrast_based.py`는 torch를 직접 import한다. 따라서 도구 소스를 변조하거나 torch 동작을 흉내 내지 않고 **CPU 전용 torch**를 설치해 해당 구현을 그대로 실행했다. GPU, CUDA, torchvision, kornia, Slang은 사용하지 않았다.

## 실행 환경과 명령

게임 의존성을 변경하지 않고 외부 `/tmp/ember-tools/pixeloe-venv`에 설치했다. 시스템 Pillow만 재사용했으며, NumPy 및 신규 패키지는 이 venv에 설치되었다.

- Python 3.12, torch `2.9.0+cpu`, OpenCV headless 패키지 `4.12.0.88`(런타임 `4.12.0`), NumPy `2.2.6`.
- 실제 설치는 기본 PyPI와 공식 CPU wheel 인덱스의 TLS/패키지 검증을 유지했다. 서명·해시·TLS 검증을 끄지 않았다.
- CPU 병렬성은 torch/OpenCV 각각 2스레드로 제한했다.

실행한 설치·생성 명령:

```bash
python3 -m venv --system-site-packages /tmp/ember-tools/pixeloe-venv
/tmp/ember-tools/pixeloe-venv/bin/python -m pip install --disable-pip-version-check \
  opencv-python-headless==4.12.0.88 'torch==2.9.0+cpu' \
  --extra-index-url https://download.pytorch.org/whl/cpu
cd /workspace/ember-vault-v9
/tmp/ember-tools/pixeloe-venv/bin/python \
  docs/production/tools/prepare-v9-environment.py \
  --pixeloe-source /tmp/ember-tools/PixelOE
```

다른 머신에서는 PixelOE 공식 저장소를 별도 도구 디렉터리에 복제하고 위 커밋을 체크아웃한 뒤 `--pixeloe-source`를 그 경로로 지정한다. 스크립트는 자기 위치에서 프로젝트 루트를 찾으므로 게임 체크아웃 경로가 달라도 된다. `/tmp` 환경이 없어져도 배포 PNG는 그대로 사용할 수 있다.

## 처리 설정

1. 원본 하단 3행만 복제 패딩하여 1672×944 작업 캔버스를 만든다.
2. PixelOE: `mode='contrast'`, `target_size=(418,236)`, `patch_size=4`, `pixel_size=4`, `thickness=1`, `color_matching=True`, `contrast=1.0`, `saturation=1.0`, `colors=None`. 팔레트 수 제한과 추가 색보정은 하지 않는다.
3. 이 legacy 버전의 부동소수점 크기 절삭으로 실제 PixelOE 출력은 1668×940이다. 이를 nearest-neighbor로 패딩 캔버스 1672×944에 맞춘 후 하단 패딩을 제거한다. 최종 프레임 크기와 게임 좌표계는 원본 그대로다.
4. 바닥 다각형 하나와 좁은 석벽 다각형 둘에만 합성한다. 좌표는 재현 스크립트에 명시했다. 중앙 봉인 타원은 제외하고 경계를 12px Gaussian으로 부드럽게 한다.
5. 따뜻한 금빛, 밝은 시안, 고휘도 픽셀은 원본 그대로 유지한다. Sobel 경사량 95 초과 선의 주변에서는 합성량을 줄여 돌의 줄눈과 조각 선을 보존한다.
6. 최종 PixelOE 혼합 상한은 **38%**다. 원래 조명과 건축 세부를 유지하면서 선택된 표면의 작은 잡티와 질감을 정리하는 정도로 제한했다. 알파가 없는 원본과 동일하게 RGB PNG로 저장한다.

## 검수 결과와 적용 범위

원본, 최종 결과, 전후 비교 이미지를 실제 이미지 뷰어로 열어 확인했다. 1:1 바닥 크롭에서는 선택된 돌 표면이 조금 단정해지고, 전체 화면에서는 원래의 푸른 석재·금빛 조명과 초승달 봉인이 유지된다. 강한 전체 픽셀화보다 변화가 작도록 의도한 결과다.

- 실제 변경 픽셀: 전체의 **10.507%**. 마스크에 가중치가 있는 영역은 **11.247%**.
- 전체 채널 평균 절대 차이: **0.3284 / 255**.
- 마스크 밖 픽셀과 보호된 조명 픽셀은 원본과 정확히 일치함을 스크립트 assertion으로 검증했다.
- PNG 3개(배경·비교·마스크)의 디코딩 무결성을 `PIL.Image.verify()`로 확인했다.
- 원본 파일 해시가 유지되었고 `git diff --exit-code -- dist/assets/lunar-vault-v6.png`가 통과했다.
- 게임 JavaScript는 이 에셋 제작 작업에서 수정하지 않았다. B5 방의 실제 선택·색조·오브젝트 연결은 런타임 담당 변경에서 처리한다.

이 파일은 기존 달의 봉인실을 바탕으로 한 **B5 전용 표면 변형**이다. 새 구조의 완전히 독립된 배경, 새 생성 이미지, 모든 배경의 PixelOE 변환으로 표시하지 않는다.
