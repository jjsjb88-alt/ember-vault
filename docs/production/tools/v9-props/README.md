# V9 props: actual Codixel and Pixelbolt use

Original source, license notices and repeatable commands for the tutorial/route assets. The tool checkouts were read before execution; no setup script, dependency installation, generation API or GPU was used.

| Tool | Applied work | Exact revision |
|---|---|---|
| [Codixel](https://github.com/mankidev/codixel) | `core/pixel.js` draws three props and four UI glyphs; creates native/enlarged dark/light review | `604a9dcbcc4e386bc48188b5f7f49099f5d04db7` |
| [Pixelbolt](https://github.com/skulitom/Pixelbolt) | Validates and inspects the original focus recipe, then renders a checked atlas and APNG | `200c301780ae4f4ba1eb2e8563e1b5994e31974a` (0.12.1) |

Read skills: `codixel/SKILL.md` and `Pixelbolt/skills/pixel-art/SKILL.md`. See [art brief and observed review](asset.brief.md), [attribution](ATTRIBUTION.md), [Codixel MIT notice](codixel-LICENSE.txt), and [Pixelbolt MIT notice](pixelbolt-LICENSE.txt).

## Delivered runtime files

All paths are relative to `dist/assets/v9/props/`.

| Files | Native size | Meaning |
|---|---|---|
| `shortcut-key.png` | 64×64 | Return winch: chain, gear and raised lever |
| `echo-marker.png` | 64×64 | Ember trace and concentric diamond echoes |
| `supply-cache.png` | 64×64 | Sealed supply cache |
| `glyph-safe.png`, `glyph-risk.png`, `glyph-cache.png`, `glyph-shortcut.png` | 24×24 each | Recovery, risk, cache and shortcut choices |
| `focus/focus-ring.png` | 200×50 sheet | Four padded 48×48 cells |
| `focus/focus-ring.atlas.json` | Metadata | Rectangles, anchors, durations and loop |
| `focus/animations/focus.png` | 48×48 APNG | Direct browser animation, four frames |

The complete runtime directory is **6,930 bytes**, including atlas metadata and the optional APNG. Transparent pixels are binary alpha (0/255), with no baked background. File hashes and dimensions are in [runtime-check.json](../../../visual/implemented/v9/props/runtime-check.json).

For Canvas, load the sheet and atlas, read `atlas.frames[name].frame`, and draw that source rectangle. The four rectangles have `x = 1, 51, 101, 151`, `y = 1`, `w = h = 48`; each anchor is `(24,24)`. `atlas.animations.focus.frames` gives order. Durations are 260/220/260/220 ms, total 960 ms, looping. `imageSmoothingEnabled = false` preserves pixels. Static reduced-motion display can use `focus-0`. The APNG is an alternative direct `<img>` asset. These files were produced for integration; this asset task did not edit gameplay or UI code.

## Reproduce from repository root

The original sources are [build-props.cjs](build-props.cjs) and [focus-ring.json](focus-ring.json). Checked-out tool paths below match the production environment. The first script accepts a different Codixel core path as its first argument; no tool source is bundled in the game.

```sh
node docs/production/tools/v9-props/build-props.cjs /tmp/ember-tools/codixel/core/pixel.js

node /tmp/ember-tools/Pixelbolt/bin/pixelbolt.js validate docs/production/tools/v9-props/focus-ring.json
node /tmp/ember-tools/Pixelbolt/bin/pixelbolt.js inspect docs/production/tools/v9-props/focus-ring.json --out /tmp/focus-review.png --native --diagnostics --background '#101b24'
node /tmp/ember-tools/Pixelbolt/bin/pixelbolt.js inspect docs/production/tools/v9-props/focus-ring.json --out /tmp/focus-light.png --native --background '#e2dcc8'
node /tmp/ember-tools/Pixelbolt/bin/pixelbolt.js inspect docs/production/tools/v9-props/focus-ring.json --out /tmp/focus-silhouette.png --view silhouette
node /tmp/ember-tools/Pixelbolt/bin/pixelbolt.js inspect docs/production/tools/v9-props/focus-ring.json --out /tmp/focus-grayscale.png --view grayscale
node /tmp/ember-tools/Pixelbolt/bin/pixelbolt.js inspect docs/production/tools/v9-props/focus-ring.json --out /tmp/focus-onion.png --animation focus --view onion
node /tmp/ember-tools/Pixelbolt/bin/pixelbolt.js render docs/production/tools/v9-props/focus-ring.json --out /tmp/ember-v9-focus-export --expect '{"width":48,"height":48,"frames":{"focus":4},"transparent":true,"loop":true}'
```

Use a fresh render output directory for each revision. Copy `focus-ring.png`, `focus-ring.atlas.json`, and optional `animations/focus.png` to `dist/assets/v9/props/focus/` after inspecting the result. The original validated recipe was first rendered in the assets folder, then sources and preview artifacts were moved to these document paths; runtime files were unchanged by that move.

## Checks and review evidence

- Codixel generator syntax check passed. The prop/glyph images have transparent margins and coherent silhouettes at native size; [props-review.png](../../../visual/implemented/v9/props/props-review.png) shows 1×/4× on pale and dark backgrounds. [props-analysis.json](../../../visual/implemented/v9/props/props-analysis.json) retains the actual edge findings, including deliberate gear teeth, pointed flame and open echo traces.
- Pixelbolt `validate` returned no warnings. Inspection covered every frame in native, enlarged, silhouette, grayscale and onion views. There were no corner or stray-pixel diagnostics; repeated `focus-1`/`focus-3` artwork intentionally creates a symmetric pulse.
- Render `check.ok` passed for 48×48, four focus frames, transparency and looping. The 200×50 sheet includes one-pixel packing gutters; atlas cell content remains inset.
- The actual exported APNG loaded in Chromium without browser errors. [motion-review.json](../../../visual/implemented/v9/props/motion-review.json) and three `focus-motion-*.png` captures show the expanded middle pose and matching first pose approximately one 960 ms cycle later. This is local preview playback; final game-screen contrast and placement need scene integration review.

The generated [preview HTML](../../../visual/implemented/v9/props/focus-export/preview.html), APNG, atlas and auxiliary exporter files are retained under `docs/visual/implemented/v9/props/focus-export/`. To repeat live browser captures with installed Playwright, Pillow and `/usr/bin/chromium`:

```sh
python docs/production/tools/v9-props/review-motion.py
```

The preview script serves only the review folder on an ephemeral loopback port and shuts down its server when finished.
