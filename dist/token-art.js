import {CARDS} from './engine.js?v=20261107d';
import {makeFxLayer} from './fx-layer.js?v=20261107d';
import * as collectBurst from './vendor/pixelfx/fx/pickups/collect-burst.js';
import * as runeCircle from './vendor/pixelfx/fx/arcane/rune-circle.js';

export const TOKEN_IDS=Object.keys(CARDS);
export const GRADES={
 common:{name:'일반',rank:0,color:'#bda785',palette:['#111b20','#263039','#4b4940','#70634e','#a48a60','#d4be91','#f3e4bd','#fff8e7']},
 uncommon:{name:'고급',rank:1,color:'#7edac5',palette:['#071b20','#10343b','#215b60','#32817c','#4bb2a0','#88ddc3','#cdf5df','#ffffff']},
 rare:{name:'희귀',rank:2,color:'#83bdff',palette:['#081528','#122c52','#234b80','#3d70b1','#669fe0','#9bcaff','#d7eaff','#ffffff']},
 epic:{name:'영웅',rank:3,color:'#d2a2ff',palette:['#1b1028','#39214f','#62377d','#8b55af','#bb7cdb','#e3a7f0','#ffe0f2','#fff5d6']},
};
export const PROP_IDS=['moon','crown','heart','dragon-memory','chest','camp','shrine','mechanism','key','seal','lantern','coin'];
const iconCards={boot:'step',compass:'scout',dagger:'slash',book:'focus',shield:'guard',cloak:'sneak',flame:'spark',wing:'rush',swords:'blade',tome:'insight',ghost:'ghost',potion:'potion',axe:'fury',feather:'acrobat',tower:'sentinel',leaf:'healing',map:'wisdom'};
const iconProps={crystal:'moon',crown:'crown',heartgem:'heart',chest:'chest',camp:'camp',shrine:'shrine',mechanism:'mechanism',key:'key',seal:'seal',lantern:'lantern',merchant:'lantern',coin:'coin'};
export function tokenInfo(id,grade){
 const card=CARDS[id];if(!card)throw new Error(`Unknown memory: ${id}`);
 const tier=grade|| (card.cost<=2?'common':card.cost<=4?'uncommon':card.cost===5?'rare':'epic');
 if(!GRADES[tier])throw new Error(`Unknown grade: ${tier}`);
 return {id,card,tier,...GRADES[tier],src:`./assets/v95/tokens/${id}.webp`};
}
export function tokenMarkup(id,{size=48,grade,awaken=false}={}){
 const info=tokenInfo(id,grade);
 return `<span class="memory-token tier-${info.tier}${awaken?' token-awaken':''}" data-token="${id}" data-tier="${info.tier}" role="img" aria-label="${info.card.name} · ${info.name}" style="--token-size:${size}px;--grade:${info.color};--frame-x:${info.rank*100/3}%"><img class="memory-token-art" src="${info.src}" alt="" decoding="async"><span class="memory-token-frame" aria-hidden="true"></span><span class="memory-token-mark" aria-hidden="true">${'◆'.repeat(info.rank+1)}</span></span>`;
}
export function gradeLabel(id){const i=tokenInfo(id);return `<span class="memory-grade tier-${i.tier}">${i.name}</span>`;}
export function itemMarkup(id,size=48){
 if(!PROP_IDS.includes(id))throw new Error(`Unknown relic or item: ${id}`);
 return `<span class="vault-item" style="--item-size:${size}px"><img src="./assets/v95/props/${id}.webp" alt="" decoding="async"></span>`;
}
export function richGlyph(name,size=32){
 return iconCards[name]?tokenMarkup(iconCards[name],{size}):iconProps[name]?itemMarkup(iconProps[name],size):null;
}
const images=new Map();
export function drawAssetIcon(ctx,name,x,y,size){
 const id=iconCards[name],prop=iconProps[name];if(!id&&!prop||typeof Image==='undefined')return false;
 const src=id?`./assets/v95/tokens/${id}.webp`:`./assets/v95/props/${prop}.webp`;
 if(!images.has(src)){const img=new Image();img.src=src;images.set(src,img);}
 const img=images.get(src);if(!img.complete||!img.naturalWidth)return false;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(img,x,y,size,size);ctx.restore();return true;
}

// A short, seeded pixelfx pickup on inspection or awakening; never touches engine RNG.
// There are no continuous per-token canvas loops. Disconnected effects are discarded.
const mounted=new WeakSet(),active=new Map();let raf=0;
function tick(now){
 raf=0;
 for(const [el,entry]of active){
  if(!el.isConnected||document.hidden||now>=entry.end){entry.canvas.remove();active.delete(el);continue;}
  entry.ctx.clearRect(0,0,256,256);entry.layer.render(entry.ctx,256,256,now);
 }
 if(active.size)raf=requestAnimationFrame(tick);
}
export function awakenToken(el){
 if(!el?.isConnected||active.has(el)||active.size>=6||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const info=tokenInfo(el.dataset.token,el.dataset.tier),canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;canvas.className='memory-token-fx';canvas.setAttribute('aria-hidden','true');el.appendChild(canvas);
 const layer=makeFxLayer(2),ctx=canvas.getContext('2d');
 layer.add(collectBurst,{x:128,y:188,palette:info.palette,seed:TOKEN_IDS.indexOf(info.id)+17,light:.25+info.rank*.2});
 if(info.rank===3)layer.add(runeCircle,{x:128,y:174,palette:info.palette,seed:41,light:.28},{until:performance.now()+800});
 active.set(el,{canvas,ctx,layer,end:performance.now()+1400});if(!raf)raf=requestAnimationFrame(tick);
}
export function paintTokens(root=document){
 root.querySelectorAll('.memory-token').forEach(el=>{
  if(mounted.has(el))return;mounted.add(el);
  const target=el.closest('button')||el;
  target.addEventListener('pointerenter',()=>awakenToken(el));target.addEventListener('focus',()=>awakenToken(el));
  if(el.classList.contains('token-awaken'))awakenToken(el);
 });
}
