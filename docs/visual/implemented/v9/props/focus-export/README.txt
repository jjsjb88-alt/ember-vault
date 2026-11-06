focus-ring — Pixelbolt export

focus-ring.png: transparent RGBA sprite sheet
focus-ring.atlas.json: TexturePacker-style frames, named animation sequences and Aseprite-style frame tags
focus-ring.tres: Godot 4 SpriteFrames; it finds focus-ring.png in its own folder, so keep the two together
focus-ring.css: CSS classes with per-frame timing
frames/: individual PNGs
animations/: animated PNGs (APNG)
focus-ring.pixel.json: editable source
player.js: dependency-free Canvas player
preview.html: open directly in a browser, or serve this folder

Canvas: import { SpritePlayer } from './player.js';
const player = await SpritePlayer.load(canvas, './focus-ring.atlas.json');
player.play('focus');

Godot 4: copy focus-ring.png and focus-ring.tres into one folder of your project, give an AnimatedSprite2D the Sprite Frames focus-ring.tres and play("focus"). Set the node's Texture Filter to Nearest for crisp pixels.

CSS: <link rel="stylesheet" href="focus-ring.css">
<span class="pf-focus-ring pf-focus-ring-focus"></span>

Timing:
focus: 4 frames of 220 to 260 ms, 960 ms in all
