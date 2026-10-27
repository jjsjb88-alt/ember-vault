# 목업 생성 기록

제작일: 2026-10-27. 제작 방식: 내장 이미지 생성 도구. 생성 이미지는 목표 디자인이며 런타임 스프라이트 시트가 아닙니다.

## 탐험 화면 초안

파일: [archive/exploration-first-draft.png](archive/exploration-first-draft.png)

현재 런타임의 heroines-v4.png와 rooms-v4.png를 외형·색감 참조로 사용.

```text
Use case: ui-mockup.
Create ONE finished commercial-quality gameplay-screen art-direction mockup for the original Korean 2D pixel-art pool-building dungeon crawler "잿불 금고 / EMBER VAULT". This must look like a believable, fully functioning premium game on a LANDSCAPE PHONE, not a poster, website, infographic, board game, or a phone photographed on a desk. Edge-to-edge screen, very wide 2.16:1 aspect ratio (composition corresponding to 932×430 logical px, render high resolution around 2048×944). NO device frame, NO explanatory callouts outside UI, NO collage.

REFERENCE IMAGES: Image1 = identity/palette reference only. Use the LEFT adult black-haired, green-eyed beautiful woman rogue in a dark teal cloak, tailored black leather adventuring outfit, brass details, dagger in her physical RIGHT hand, small brass lantern in physical LEFT. Preserve her striking elegant mature beauty and costume vocabulary. Do not use the middle knight or right mage in this screen. Her small readable portrait appears in the HUD; in-world character is a properly scaled full-body sprite, NOT an oversized illustration.
Image2 = environment color/material reference only. Evolve its moonlit cathedral and flooded archive atmosphere into a THREE-QUARTER OVERHEAD 2D GAME ROOM with visible traversable floor, orthographic game camera, no cinematic vanishing-point backdrop. Reusable modular stone floor tiles, ruined arch-wall segments, separate pillar/bookcase/chest props, reusable stairs/doorway pieces; a clear flat floor lane for actual eight-facing walking/attack sprites. It must be feasible to build as 2D tile layers plus independent sprite objects. Occluding walls are low/cut away near the player. No perspective-rendered 3D world.

Art direction: exceptional hand-clustered PIXEL ART with clearly deliberate pixel edges, limited coherent indigo/slate/teal/antique-gold palette, tiny amber candle accents, restrained particles. Rich detail primarily at edges, quiet readable floor around actors. NOT painterly blur with a pixel filter. Warm heroine silhouette against cold stone. Use depth ordering and simple separate light masks, not expensive cinematic volumetric fog. All UI is separate crisp legible typography and scalable dark translucent flat panels with slim brass corners, refined 9-sliceable frames; no excessive filigree or bevels.

Production-realistic composition:
- slim top HUD, ~12% screen height. Left: small beautiful rogue face portrait, compact HP "17 / 24" bar and "18 G". Center small location "B2 · 잊힌 서고". Right a compact ear/noise meter with exactly five of eight marks lit, label "경계 5 / 8", then one menu button. Do not place decorative huge logo.
- Left/main gameplay width ~74%. Directly beneath HUD, a very shallow clear resource strip with two DOMINANT LARGE numbers "공격력 7" and "이동력 4"; secondary smaller "기술 2" and "방어 3". These are automatically pooled resources, not cards to play.
- The dungeon takes the middle of that left main region. Show the rogue near lower-left center, facing northeast in a clearly stepped walking pose, lantern held steady and cape following. One skeletal guard is farther away in an ADJACENT room visible through the arch on right, responding with a small ear/? status indicator. The nearby room is safe; do not present a current combat attack button. A short subtle thin gold floor path leads toward an actual exit. A few localized amber sound-wave contour arcs flow toward the open doorway and STOP at the wall; the adjacent guard has heard the sound. No huge circular radar covering everything. One concise small world label "발소리 2".
- Always visible SEMI-TRANSPARENT MINI MAP at the upper-right corner of the DUNGEON viewport, below resources, roughly 120×85 logical px. Four-by-four room-node graph with corridors, gold triangular player marker, muted visited nodes, 2 red enemy markers, gray unexplored nodes and a faint amber sound trail. See the dungeon through its charcoal backing. Tiny "B2" and expand arrow, no tiny unreadable labels, not a separate opaque dashboard. Does not cover the heroine.
- Right side ~24% width is thumb-friendly gameplay controls. Three compact tabs "이동", "소리", "교역". A 3-position stance selector "은밀", "걷기", "질주" with 걷기 selected. Then FOUR generous movement choice buttons in a 2×2 grid: directional arrow plus short destination "서고", "회랑", "계단", "입구", each a short second line like "1 발 · 소리 2". One unavailable exit visibly muted. Beneath: two clearly pressable compact buttons "유인" and "숨죽이기". At the bottom a strong warm-gold primary button "풀 뽑기", second line "턴 종료 · 능력 5개". All touch targets approximately 44 logical px high. No joystick, no keyboard shortcuts, no desktop hover dependencies.
- Bottom strip under dungeon: a small "이번 추출" label followed by exactly FIVE small circular/hexagonal ability seals with distinct pixel glyphs (dagger, boot, boot, shield, book). Modest effects numbers may appear, but no rectangular playing cards, no card fan, no dragging cards. A compact "5 / 5" label. This strip is thinner than gameplay and easy to tap for details.
- Keep everything visible inside one fixed-height screen; no scrolling, no off-screen controls. Comfortable safe area, 10–12 logical px side inset. Environment and characters remain the hero, the UI has disciplined contrast and generous negative space.
Text accuracy: short Korean labels exactly as above, use readable UI typography, not decorative pseudo-text. Avoid unnecessary microcopy. The visible screen must convince a game developer the layout, layer separation and sprite sizes can be implemented. This is a target visual design, not evidence of a running build. No watermarks or claims stamped on the artwork.
```

## 탐험 화면 확정

파일: [approved/exploration-landscape.png](approved/exploration-landscape.png)

탐험 화면 초안을 편집. 도적 HP22, 자원 숫자, 풀 토큰, 지도 투명도 수정.

```text
Use case: ui-mockup, precise-object-edit. Edit this gameplay mockup, preserving its exact beautiful rogue identity, coherent premium pixel art, orthographic dungeon room, mobile landscape proportions, overall composition, environment detail, right thumb controls and sound-conduit scene. This is final production-oriented polish, no redesign.
Make only the following corrections:
1. Top-left HP is exactly "17 / 22" (the rogue has 22 max HP).
2. The resource strip must prioritize the numbers. Make "7" and "4" approximately 1.5× larger and heavier than in this reference, comfortably occupying the strip vertically without touching borders. Labels exactly "공격력" and "이동력" smaller next to their numbers. Keep smaller "기술 2" and "방어 3". These dominant resources must read instantly on a 932×430 phone.
3. Bottom "이번 추출" has exactly FIVE seals, from left to right: red crossed-blades glyph, amber-red fire glyph, teal-violet folded star-map glyph, gold shield glyph, blue boot glyph. REMOVE the tiny effect numbers below those icons entirely. Keep "5 / 5" on far right. These are the existing abilities 달빛 쌍검, 불씨 화살, 별의 지도, 나무 방패, 잰걸음: 7 attack,5 movement before spending1,2 skill,3 block. Do not add these full names to the screen.
4. On the right active route buttons, short cost lines read "1 발 · 소리 1"; disabled unconnected fourth route displays "통로 없음". Keep its muted style. Stance choices exactly "은밀", "걷기", "질주"; 걷기 selected. Keep "유인", "숨죽이기" and "풀 뽑기".
5. Keep minimap at upper-right of world. Make its dark backing more transparent (around55% alpha appearance), so the room pixels underneath are subtly visible while navigation markers remain opaque and crisp. Show a clear compact sixteen-room 4×4 node graph, some corridor connections, a gold player triangle and two small red enemy markers. No text clutter. It is a small overlay, not a full opaque panel.
Preserve all readable Korean text, pixel sharpness, crisp HUD, safe area and no-scroll fixed viewport. No illustration captions or outside annotations.
```

## 추출 화면 초안

파일: [archive/pool-before-spoiler-fix.png](archive/pool-before-spoiler-fix.png)

탐험 화면 초안을 참조하여 마지막 봉인 상태 제작.

```text
Use case: ui-mockup.
Create the SECOND SCREEN STATE of this exact game mockup: the most tense moment of automatically DRAWING FROM THE ABILITY POOL, the fifth and final ability about to open. Same mobile landscape2.16:1 frame, exact same mature beautiful black-haired teal-cloaked rogue and pixel-art dungeon palette. This is a coherent modal overlay over the same game, not a different title or a poster. No device frame.

Underlying dungeon and HUD remain faintly identifiable behind a dark charcoal-teal translucent full-screen scrim. Keep the small semitransparent minimap identifiable in the upper-right background. Underlying movement/action buttons are dark and inactive. No visible selectable hand of playing cards. No casino imagery, roulette, odds, loot-box purchase UI or pay buttons. This is tactical turn-based resource extraction already decided by the game.

Main composition:
- Top center medium elegant Korean headline exactly "마지막 하나." with plenty of breathing space.
- Beneath it short legible stakes line exactly "공격력 2가 더 필요하다".
- An unmistakable gigantic sealed hexagonal medallion/rune at center-left, ~95 logical px, suspended just above a thin circular amber ring. Its center is still DARK with an abstract closed seal, a single hairline crack emitting restrained molten gold; the unknown outcome is not yet visible. Delicate few sharp pixel sparks hang frozen. Sharp highlights and negative space, not a giant bloom effect. A short luminous gold thread points from the seal toward the attack counter.
- Right of the center seal: two enormous highly readable resource numbers "공격력 3" and "이동력 3". Beneath them much smaller "기술 2" and "방어 3". These are the cumulative values from FOUR opened abilities: 불씨 화살, 잰걸음, 작은 발견, 나무 방패, plus1 base movement. They must be visually separated from the dim background resource bar. No totals prematurely showing the unopened fifth ability.
- A horizontal row of EXACTLY FIVE compact seal sockets below this focal arrangement. First4 opened icons in order: small amber flame, blue boot, violet book, gold shield; fifth socket is dark with a faint gold outline and a lock/diamond mark. A thin progress line stopping just short of the fifth. Label below exactly "4 / 5 공개 · 자동 합산".
- At lower center small calm text exactly "어둠 속에서, 마지막 힘이 깨어난다".
- A single modest but finger-sized button bottom-right "결과 바로 보기". It skips animation only; do not add a giant Draw or Open button. Small sound-toggle icon at top-right. No confirmation buttons, no false player control over the outcome.
- Keep full screen visible without scrolling and all text readable at932×430 logical size. Maintain top/bottomsafe area. UI as crisp layered scalable flat metal-corner frames, fonts and glyphs; effect budget just1 seal sprite,2 rings, a few particles and a darkened game layer. Commercial premium pixel dungeon art and beautiful typography, color richness, strong anticipation from restrained gold against cool nearblack, NOT a concept-art poster.
The image should look realistically buildable using the existing resource reveal state machine and a small effect sprite atlas. No watermarks, no annotation labels outside the real UI.
```

## 추출 화면 확정

파일: [approved/pool-final-seal.png](approved/pool-final-seal.png)

추출 화면 초안을 편집. 배경 최종 수치·토큰의 조기 노출 제거, HP22 수정, 건너뛰기 버튼 확대.

```text
Use case: ui-mockup / precise-object-edit. Edit the provided final-draw scene with ONLY these production-critical fixes. Preserve its composition, beautiful pixel art, rogue identity, suspenseful cracked sealed medallion, four revealed token icons plus fifth sealed token, central cumulative attack3/move3/skill2/block3, exact Korean title and all current typography styling.
1. The underlying game's top resource bar currently shows attack7/move4 and its bottom pool strip shows revealed tokens. These would SPOIL the final result. COMPLETELY hide the background resource bar and bottom token strip under the dark scrim, replacing their rectangle areas with the same nearblack translucent overlay; no numbers, no ability glyphs, no white labels visible in those two background areas. The ONLY visible resource values anywhere in this image must be the central cumulative values: "공격력 3", "이동력 3", "기술 2", "방어 3". Keep the dungeon itself and semitransparent minimap faintly discernible. It is fine to keep the right route controls extremely subdued and clearly inactive.
2. Top-left HP is "17 / 22", faint but correct; no "17 / 24".
3. Make bottom-right "결과 바로 보기" button taller, with a minimum of approximately88 renderedpx on this1848px-wide image (~44 logical px), still wholly inside the viewport with12 logicalpx safe bottom margin. Preserve text and gold border, ensure no collision with subtitle or progress row.
4. Preserve exactly: "마지막 하나.", "공격력 2가 더 필요하다", "4 / 5 공개 · 자동 합산", "어둠 속에서, 마지막 힘이 깨어난다". No new text.
Do not reveal the sealed medallion result. No changes to the central4known glyphs or final sealed fifth socket. No extra UI, no device frame, no watermark. This is the final coherent target mockup.
```


