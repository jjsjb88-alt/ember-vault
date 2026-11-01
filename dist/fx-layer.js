// Pixel effects from pixelfx (MIT, vendor/pixelfx) drawn on a low-resolution layer and scaled up,
// so one effect pixel matches the chunky pixels of the painted stage.
import {createFrame,clearFrame,createFx,composite} from './vendor/pixelfx/core/index.js';
import * as fireBreath from './vendor/pixelfx/fx/fire/fire-breath.js';
import * as ripples from './vendor/pixelfx/fx/water/ripples.js';
import * as soulRise from './vendor/pixelfx/fx/spawn/soul-rise.js';

export const FX = {fireBreath, ripples, soulRise};
// One effect pixel = 4 stage pixels (the stage canvas is 1200 wide, about 300 effect pixels across).
export const FX_PIXEL = 4;
export const PALETTES = {
 // a quiet sound: teal water light, matching the vault's channels
 quiet: ['#03121a','#08222d','#0e3742','#185462','#2a8088','#5cc4b8','#b2f0e4','#ffffff'],
 // a loud sound (5 or more): ember gold turning to warning orange
 loud: ['#160904','#331607','#5e260c','#9a3e16','#d86a24','#ffad48','#ffe2a6','#ffffff'],
 // a fallen guard: pale vault-blue soul
 soul: ['#0b1420','#1a3048','#2f5a7e','#5a92b8','#9cc9e2','#dcf2ff','#ffffff'],
};

/** A layer of live effects for one canvas. Positions and sizes are given in canvas pixels. */
export function makeFxLayer(px = FX_PIXEL){
 let fw = 0, fh = 0, frame, img, cv, cx, last = null;
 const live = [];
 function fit(w, h){
  const nw = Math.ceil(w / px), nh = Math.ceil(h / px);
  if(nw === fw && nh === fh) return;
  fw = nw; fh = nh; frame = createFrame(fw, fh); img = new ImageData(fw, fh);
  cv = document.createElement('canvas'); cv.width = fw; cv.height = fh; cx = cv.getContext('2d');
 }
 return {
  /** Start an effect. opts.x/opts.y in canvas pixels. until: ms (performance time) to let it fade out. */
  add(mod, opts = {}, {until = Infinity, tag = ''} = {}){
   const fx = createFx(mod, {...opts, x: (opts.x ?? 0) / px, y: (opts.y ?? 0) / px});
   const entry = {fx, until, tag};
   live.push(entry);
   return entry;
  },
  has(tag){return live.some(e => e.tag === tag);},
  stop(tag){for(const e of live) if(!tag || e.tag === tag) e.fx.stop();},
  clear(){live.length = 0; last = null;},
  get active(){return live.length > 0;},
  /** Advance and draw every live effect onto ctx (w x h canvas pixels). */
  render(ctx, w, h, now){
   if(!live.length){last = null; return;}
   fit(w, h);
   const dt = last === null ? 1 / 60 : Math.min(0.1, Math.max(0, (now - last) / 1000));
   last = now;
   clearFrame(frame);
   for(const e of live){
    if(now >= e.until) e.fx.stop();
    e.fx.update(dt);
    e.fx.draw(frame);
   }
   for(let i = live.length - 1; i >= 0; i--) if(live[i].fx.done()) live.splice(i, 1);
   composite(frame, img.data, null);
   cx.putImageData(img, 0, 0);
   const smooth = ctx.imageSmoothingEnabled;
   ctx.imageSmoothingEnabled = false;
   ctx.drawImage(cv, 0, 0, fw * px, fh * px);
   ctx.imageSmoothingEnabled = smooth;
  },
 };
}

/**
 * A pixelfx actor (mask + colors, feet at 0,0) made from a sprite drawn the way the stage draws it,
 * at effect resolution, so the soul that rises has the fallen creature's own silhouette.
 */
export function actorFromSprite(image, sx, sy, sw, sh, width, height, {flip = false, px = FX_PIXEL} = {}){
 const w = Math.max(4, Math.round(width / px)), h = Math.max(4, Math.round(height / px));
 const c = document.createElement('canvas'); c.width = w; c.height = h;
 const g = c.getContext('2d', {willReadFrequently: true});
 g.imageSmoothingEnabled = true;
 if(flip){g.translate(w, 0); g.scale(-1, 1);}
 g.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);
 const d = g.getImageData(0, 0, w, h).data, data = new Uint8Array(w * h), pixels = new Array(w * h).fill(null);
 const hx = v => v.toString(16).padStart(2, '0');
 for(let i = 0; i < w * h; i++){
  if(d[i * 4 + 3] > 110){data[i] = 1; pixels[i] = '#' + hx(d[i * 4]) + hx(d[i * 4 + 1]) + hx(d[i * 4 + 2]);}
 }
 return {mask: {w, h, data}, pixels, x: -Math.floor(w / 2), y: -h};
}
