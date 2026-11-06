# Notices

**Hugo Duprez.** `src/core/sim.js` and the effects that say so at the top of their file adapt Sprite Fusion's
open-source pixel art VFX (https://www.spritefusion.com/pixel-art-vfx), Copyright (c) 2026 Hugo Duprez, MIT License.

**Hollow Crown.** `src/core/act.js` adapts how Hollow Crown plays its skills (poses on 12 fps steps, hit-stops, the springy
straw target), from
https://github.com/rehan-remade/hollow-crown, Copyright (c) 2026 rehan-remade, MIT License.


Vendored from https://github.com/patch-gg/pixelfx at commit a841596 (MIT). Only src/core and nine effects are included (fire-breath, ripples, soul-rise, spirit-flame, hit-spark, crit-hit, impact-frame, parry, collect-burst).
Files under dist/vendor/pixelfx/fx/*/lib.js were renamed from _lib.js so GitHub Pages (Jekyll) publishes them.

The pickups helper includes only the glint function used by collect-burst. The host supplies muted teal metal and warm gold palettes for the winch and relic interactions.

V9.5 also uses arcane/rune-circle and its shared arcane helper for the epic memory aura (same MIT library and original notices retained).
