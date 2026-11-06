// 연습 대사 컷신: 화면 위아래를 검은 띠로 가리고, 말하는 쪽의 초상과 이름, 한 글자씩 써지는 대사.
// 화면 아무 곳이나 누르면(또는 Enter/Space) 글자를 다 보여 주고, 한 번 더 누르면 다음 대사.
// 컷신은 줄을 서서 차례로 재생된다. 추출·소음 연출처럼 움직이는 창이 열려 있으면 그것이 닫힐 때까지 기다린다.
import {makeFxLayer} from './fx-layer.js?v=20261106f';
import * as spiritFlame from './vendor/pixelfx/fx/fire/spirit-flame.js';

// 깜부기: 등불 속 잿불. spirit-flame을 따뜻한 잿불 색으로.
export const EMBER_FLAME = ['#120604','#2e0f06','#5e1e08','#9a3a10','#d8661e','#ffa13a','#ffd27a','#fff1c8','#ffffff'];
export const TYPE_MS = 26; // 한 글자에 걸리는 시간
const BLOCKING = '#poolReveal[open], #noiseMoment[open]';

/** 대사 한 줄을 다 쓰는 데 걸리는 시간(ms). */
export function typeDuration(line, ms = TYPE_MS){return [...String(line)].length * ms;}

/** 대기열: 순수 로직. 화면 없이 테스트한다. */
export function makeQueue(){
 const items = [];
 return {
  push(item){items.push(item); return items.length;},
  next(){return items.shift() || null;},
  get size(){return items.length;},
  clear(){items.length = 0;},
 };
}

export function makeCutscene({reduced = false, tutorName = '깜부기', heroPortrait = () => '', portraits = {}} = {}){
 const dialog = document.createElement('dialog');
 dialog.id = 'cutscene'; dialog.className = 'cutscene'; dialog.tabIndex=-1; dialog.setAttribute('aria-label', '대화');
 dialog.innerHTML = `<div class="cut-stage" hidden><img alt=""><div class="cut-location"><small></small><p></p></div></div><div class="cut-bar top" aria-hidden="true"></div><div class="cut-bar bottom" aria-hidden="true"></div>
  <div class="cut-panel"><div class="cut-portrait" aria-hidden="true"><canvas class="cut-flame" width="180" height="180"></canvas><span class="cut-hero"></span></div>
  <div class="cut-body"><b class="cut-name"></b><p class="cut-line" aria-live="polite"></p><span class="cut-more" aria-hidden="true">▼</span></div></div>
  <button type="button" class="cut-skip">건너뛰기 ≫</button><div class="cut-controls"><span class="cut-progress"></span><button type="button" class="cut-next">대화 계속 ›</button></div>`;
 document.body.appendChild(dialog);
 const $ = s => dialog.querySelector(s);
 const queue = makeQueue();
 let current = null, index = 0, typed = 0, typeTimer = 0, raf = 0, waiting = 0, playing = false;
 const fx = makeFxLayer(3), flame = $('.cut-flame'), fctx = flame.getContext('2d');
 let wisp = null, blinkAt = 0;

 function drawFlame(now){
  if(!playing) return;
  fctx.clearRect(0, 0, flame.width, flame.height);
  if(!wisp && !reduced) wisp = fx.add(spiritFlame, {x: 90, y: 174, palette: EMBER_FLAME, seed: 7, light: 1.1});
  if(!reduced) fx.render(fctx, flame.width, flame.height, now);
  else {fctx.fillStyle = '#ffa13a'; fctx.beginPath(); fctx.ellipse(90, 120, 26, 44, 0, 0, Math.PI * 2); fctx.fill();}
  // 눈: 불꽃 가운데 두 점, 가끔 깜빡인다. 말할 때는 살짝 위아래로 들썩.
  const talking = current && typed < [...current.lines[index][1]].length;
  const bob = talking && !reduced ? Math.round(Math.sin(now / 70)) * 2 : 0;
  if(now > blinkAt + 3200) blinkAt = now;
  const blink = now - blinkAt < 120;
  fctx.fillStyle = '#2a0c04';
  for(const ex of [79, 95]) fctx.fillRect(ex, 124 + bob, 6, blink ? 2 : 9);
  if(!blink){fctx.fillStyle = '#fff6dc'; for(const ex of [79, 95]) fctx.fillRect(ex + 3, 125 + bob, 2, 3);}
  raf = requestAnimationFrame(drawFlame);
 }

 function show(){
  const [who, line] = current.lines[index];
  const tutor = who === tutorName;
  dialog.dataset.speaker = tutor ? 'tutor' : Object.hasOwn(portraits,who) ? 'guest' : 'hero';
  $('.cut-name').textContent = who;
  $('.cut-hero').innerHTML = tutor ? '' : Object.hasOwn(portraits,who) ? portraits[who] : heroPortrait();
  $('.cut-progress').textContent=`${index+1} / ${current.lines.length}`;
  typed = 0; $('.cut-line').textContent = ''; $('.cut-more').hidden = true;
  clearInterval(typeTimer);
  const chars = [...line];
  if(reduced){typed = chars.length; $('.cut-line').textContent = line; $('.cut-more').hidden = false; return;}
  typeTimer = setInterval(() => {
   typed++; $('.cut-line').textContent = chars.slice(0, typed).join('');
   if(typed >= chars.length){clearInterval(typeTimer); $('.cut-more').hidden = false;}
  }, TYPE_MS);
 }
 function advance(){
  if(!current) return;
  const chars = [...current.lines[index][1]];
  if(typed < chars.length){clearInterval(typeTimer); typed = chars.length; $('.cut-line').textContent = current.lines[index][1]; $('.cut-more').hidden = false; return;}
  index++;
  if(index < current.lines.length) return show();
  finish();
 }
 function finish(){
  clearInterval(typeTimer);
  const done = current?.done; current = null;
  dialog.close(); playing = false; cancelAnimationFrame(raf); fx.clear(); wisp = null;
  document.body.classList.remove('cutscene-open');
  try{done?.();}catch{}
  pump();
 }
 function pump(){
  if(current || waiting) return;
  if(!queue.size) return;
  // 움직이는 연출(추출·소음)이 열려 있으면 닫힐 때까지 기다린다
  if(document.querySelector(BLOCKING)){waiting = setTimeout(() => {waiting = 0; pump();}, 180); return;}
  current = queue.next(); index = 0;
  if(!current?.lines?.length){const d = current?.done; current = null; try{d?.();}catch{} return pump();}
  document.body.classList.add('cutscene-open');
  const scene=current.scene;dialog.dataset.scene=scene?.key||'';$('.cut-stage').hidden=!scene;
  if(scene){$('.cut-stage img').src=scene.art;$('.cut-location small').textContent=scene.title;$('.cut-location p').textContent=scene.text;}
  dialog.showModal(); (scene?$('.cut-next'):dialog).focus({preventScroll:true}); playing = true; raf = requestAnimationFrame(drawFlame); show();
 }

 dialog.addEventListener('click', ev => {if(ev.target.closest('.cut-skip')) return finish(); advance();});
 dialog.addEventListener('keydown', ev => {if(!ev.target.closest('button')&&(ev.key === 'Enter' || ev.key === ' ')){ev.preventDefault(); advance();}});
 dialog.addEventListener('cancel', ev => {ev.preventDefault(); finish();});

 return {
  /** lines: [[화자, 대사], ...]. done: 이 컷신이 끝난 뒤 할 일. */
  play(lines, done, scene=null){queue.push({lines, done, scene}); pump();},
  clear(){queue.clear(); if(current){current.done = null; finish();} clearTimeout(waiting); waiting = 0;},
  get active(){return !!current || queue.size > 0;},
 };
}
