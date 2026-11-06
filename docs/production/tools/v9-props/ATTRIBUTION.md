# Asset provenance

All props, glyphs and the focus animation recipe in this folder were originally authored for Ember Vault. They do not reuse repository example artwork.

- Static props and glyphs were rendered with [Codixel](https://github.com/mankidev/codixel), commit `604a9dcbcc4e386bc48188b5f7f49099f5d04db7`, using `core/pixel.js`. MIT, Copyright (c) 2026 mankidev. Full notice: [codixel-LICENSE.txt](codixel-LICENSE.txt).
- The focus animation was validated, inspected and rendered with [Pixelbolt](https://github.com/skulitom/Pixelbolt), commit `200c301780ae4f4ba1eb2e8563e1b5994e31974a` (package 0.12.1). MIT, Copyright (c) 2026 PixelForge contributors. Full notice: [pixelbolt-LICENSE.txt](pixelbolt-LICENSE.txt). Its generated preview/player files are preserved under the visual review folder; the game assets contain only PNGs and atlas metadata.

Both tools ran locally without installing dependencies, calling a generation API or requiring a GPU. Their full skill files were read at `codixel/SKILL.md` and `Pixelbolt/skills/pixel-art/SKILL.md` within the checked-out tools.
