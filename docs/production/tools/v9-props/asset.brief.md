# Ember Vault V9 utility props and focus cue

These original assets support room choices and tutorial focus. They use the game's teal, indigo stone, gold and ember palette. No external artwork or named board-game imagery was copied.

The three props are transparent 64×64 images, intended for 32–64 CSS pixels with nearest-neighbor rendering. Landmarks are the winch's chain/gear/raised lever; the echo's pointed flame/open diamond traces/low stone base; and the cache's stepped lid/sealed face/darker right plane. They use a slightly elevated three-quarter view, with light from upper left and grounded bases. The icon-like winch keeps its gear facing the player so the crank remains legible. Mechanical outlines and material highlights stay connected; no randomized texture or baked blur is used.

The four 24×24 glyphs are front-facing UI symbols: healing shield, warning triangle, sealed cache and return-arrow gear. Their purpose is recognition beside text, so they are not scaled-down copies of the scene props. Use 24 or 48 CSS pixels when possible. Keep text labels or accessible names; color alone is not the meaning.

The Pixelbolt focus cue is a transparent 48×48 hollow diamond, centered at (24,24), with dark outer pixels, teal sides and gold corner segments. Its negative space keeps the focused room or control visible. Four frames expand by one pixel twice and contract by one pixel before looping: 260/220/260/220 ms, 960 ms total. Frames 1 and 3 intentionally share artwork to make the contraction symmetric. It is a UI overlay with no ground contact or cast shadow. For reduced motion use the first atlas cell as a static marker.

Review: all prop/glyph images were inspected at 1× and 4× on dark and pale backgrounds. Winch, echo and crate silhouettes remain distinct; the glyphs retain their shield/triangle/crate/gear outlines at native size. Codixel's edge findings on the winch and echo describe deliberate teeth, the pointed flame and open concentric traces; they were inspected and retained. The focus cue was inspected in every frame at native and enlarged size, silhouette, grayscale and onion view, then exported and sampled from live Chromium APNG playback. It grows without shifting its center; the browser samples show a changed expanded pose and a return to its initial pose across the loop. Atlas checks verify 48×48 cells, four frames, transparency and looping.

These checks establish local asset quality. Final size, occlusion and contrast within actual game screens still belong to the integrating scene/UI review.
