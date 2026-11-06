# Winch clasp and relic unseal effects

Source: [pixelfx](https://github.com/patch-gg/pixelfx), revision `a84159688af3ca37a4be05a0d422b94451b2e24e`, MIT. Followed the source `skills/pixelfx/SKILL.md`: baseline `fire/torch` render and contact inspection, effect search, candidate renders, contact inspection, and `tools/check` before vendoring.

Run in the pixelfx checkout:

```sh
node tools/render.mjs fire/torch
node tools/render.mjs impacts/parry --opts '{"palette":["#10212c","#284853","#48717a","#79a4a4","#b8d9c9","#f3edc7"],"light":0.45}'
node tools/render.mjs pickups/collect-burst --opts '{"palette":["#2a140b","#563013","#966025","#c99547","#eacb82","#fff0c5"],"light":0.55}'
node tools/check.mjs impacts/parry pickups/collect-burst
```

The two preserved contact sheets show the actual selected recolors. Parry's short metal star, separating ring, and cooling sparks mark the winch latching. Collect-burst's warm ring and dispersing glints mark a relic's seal opening. They remain separate effects, each triggered once by successful engine interactions after blocking dialogs close. They add no camera shake. Reduced motion keeps the static prop outline and completion text and creates neither effect.

Runtime: `dist/fx-layer.js`, `dist/scene-v5.js`, two effect modules and the one required `glint` helper under `dist/vendor/pixelfx`. Existing core and impacts helpers are reused. The source notices remain intact; the vendor NOTICE records additions and helper reduction. Runtime smoke drawing verified visible pixels and finite one-shot completion for both vendored modules. The source check report is `check.txt`.
