# V6 에셋 제작 기록

OpenAI 내장 이미지 생성 도구로 제작했습니다. CLI/API 대체 경로는 사용하지 않았습니다. 원본 픽셀을 후처리하지 않고 프로젝트의 버전별 파일로 복사했으며, 배치·밝기 변화·파동·문구는 게임 런타임에서 처리합니다. 파일 경로·크기·해시는 [ASSETS-V6.json](ASSETS-V6.json)에 있습니다.

## 소음의 봉인

저장 경로: `/workspace/sites/ember-vault-dungeon/dist/assets/noise-seal-v6.png`

기존 `seal-v5.png`를 모양과 화풍의 참고 이미지로 사용한 새 에셋입니다. 투명 배경과 알파를 유지합니다. 최종 생성 프롬프트:

> Use case: stylized-concept. Asset type: transparent game UI sprite, a dangerous NOISE seal for Ember Vault, mobile pixel-art dungeon crawler. The reference image is the visual style and hexagonal shape reference. Generate a NEW variation: one front-facing thick hexagonal medallion of obsidian iron, weathered gold rim, a simple large recognizable antique alarm-bell relief in the center, the bell and plate split by a single violent crimson-orange molten crack. A few tiny square ember fragments just outside the rim. Sharp masterful hand-placed pixel-art clusters, crisp 16-bit gothic game aesthetic at high fidelity, strong silhouette readable at 100 pixels. Nearly black slate and dull brass with intense concentrated red-orange crack. Symmetric centered full object with generous transparent padding on all sides. Actual transparent background; no black backdrop, no floor, no shadows outside object, no text, no letters, no UI frame. No dragon, no extra objects. Match the reference's precious sculpted pixel-art detail.

## 깨어나는 용의 눈

저장 경로: `/workspace/sites/ember-vault-dungeon/dist/assets/dragon-eye-v6.png`

최종 생성 프롬프트:

> Use case: stylized-concept. Asset type: actual cinematic game background for a masterful mobile 2D pixel-art dungeon crawler called Ember Vault. Landscape 16:9. EXTREME CLOSE-UP of a single ancient sleeping dragon's eye awakening from deep blackness. The enormous narrow eye is centered slightly to the right, radiant amber-gold iris with a razor vertical black pupil, a thin internal crimson ember glow. Surrounding obsidian-blue reptilian scales and heavy angular black brow, a few antique gold highlights on the textured scales. Most of the left third, bottom and corners disappear into almost solid blue-black darkness with tasteful deep red ember haze, leaving room for HTML UI. Fear comes from restrained detail, darkness and attention, not gore. Crisp premium handcrafted pixel art, real visible clusters and stepped diagonals, no blurry painting, no glossy 3D rendering, no photography. One eye only, no complete face or dragon body, no letters, no text, no UI, no card, no frame. Readable silhouette, dramatic chiaroscuro, dark navy / charcoal / molten amber palette. This plate will be revealed under the game UI when a noise token is drawn and when dragon rage crosses a threshold.

## 환경 배경 2종

이 두 배경은 앞선 작업의 제작 요약을 보존합니다. 아래는 프롬프트의 문자 그대로인 전사본이 아닙니다.

| 저장 경로 | 제작 방향 | 실제 사용 |
| --- | --- | --- |
| `/workspace/sites/ember-vault-dungeon/dist/assets/lunar-vault-v6.png` | 기존 `library-stage-v5.png`의 등각 카메라와 푸른 돌·금빛 조명 화풍. 달의 문양과 봉인실. 인물·UI 없이 왼쪽 40% / 높이 73%의 캐릭터 자리와 오른쪽 66% / 높이 59%의 물체 자리를 확보. | 유물·제단 방 |
| `/workspace/sites/ember-vault-dungeon/dist/assets/ember-refuge-v6.png` | 같은 카메라와 픽셀 화풍의 이끼 낀 회랑·따뜻한 불씨의 쉼터. 인물·UI 없이 동일한 게임 합성 공간 확보. | 캠프·상인 방 |

세 환경은 같은 캐릭터·물체 좌표계를 사용합니다. 소음 전파 지도, 공격력·이동력 숫자, 경계 게이지와 버튼은 이미지에 그려 넣지 않고 실제 게임 상태로 렌더링합니다.
