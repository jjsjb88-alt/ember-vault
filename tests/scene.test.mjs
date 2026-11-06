import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newRun,apply,moveStatus,neighbours,SHORTCUT_EDGE} from '../dist/engine.js';
import {travelVector,directionIndex,motionFrame,mapLayout,projectMap,hitMapRoom,mapPassage,passagePoint,exitAnchor,hitExit} from '../dist/scene-layout.js';
import {WALK_FRAMES} from '../dist/rogue-frames.js';
import {ATTACK_FRAMES} from '../dist/rogue-attack-frames.js';
import {RELIC_MOTION} from '../dist/rogue-relic-frames.js';
import {keepSilhouette} from '../dist/sprite-atlas.js';

test('return travel faces the opposite direction on every dungeon connection',()=>{
 for(const [from,to]of newRun({seed:1}).edges){
  const a=travelVector(from,to),b=travelVector(to,from);
  assert.ok(Math.abs(a.x+b.x)<1e-8&&Math.abs(a.y+b.y)<1e-8);
  assert.equal((a.direction+4)%8,b.direction);
  assert.ok(Math.abs(Math.hypot(a.x,a.y)-1)<1e-8);
 }
 const headings=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
 assert.deepEqual(headings.map(([x,y])=>directionIndex(x,y)),[0,1,2,3,4,5,6,7]);
});

test('every walk and attack frame lies within its delivered transparent PNG',()=>{
 for(const [name,frames,count]of [['rogue-walk-v5.png',WALK_FRAMES,4],['rogue-attack-v5.png',ATTACK_FRAMES,3]]){
  const png=readFileSync(new URL('../dist/assets/'+name,import.meta.url));
  const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  assert.equal(png[25],6,'RGBA transparent atlas');assert.equal(frames.length,count);
  for(const row of frames){assert.equal(row.length,8);for(const b of row){
   assert.ok(b.x>=0&&b.y>=0&&b.w>0&&b.h>0&&b.x+b.w<=w&&b.y+b.h<=h);
   assert.ok(b.foot>0&&b.foot<=b.h);
  }}
 }
});

test('atlas extraction keeps the actor and removes overlapping neighbour fragments',()=>{
 const data=new Uint8ClampedArray(7*5*4),body=[8,9,10,15,16,17,22,23,24],neighbour=[5,6,12,13];
 for(const p of [...body,...neighbour]){data[p*4]=180;data[p*4+3]=255;}
 keepSilhouette(data,7,5);
 for(const p of body){assert.equal(data[p*4+3],255);assert.equal(data[p*4],180);}
 for(const p of neighbour)assert.equal(data[p*4+3],0);
});

test('the relic pickup atlas fits its fourteen timed cells and keeps a fixed foot baseline',()=>{
 const base=new URL('../dist/assets/v9/motion/rogue-relic-se/',import.meta.url);
 const manifest=JSON.parse(readFileSync(new URL('manifest.json',base),'utf8'));
 const png=readFileSync(new URL('spritesheet.png',base)),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
 const frames=manifest.frame_layout.rows.relic,durations=manifest.animation.rows.relic.durations_ms;
 assert.equal(png[25],6,'pickup atlas has true RGBA transparency');
 assert.equal(frames.length,14);assert.ok(w<=4096&&h<=4096,'mobile atlas stays below a 4096-pixel texture limit');
 assert.equal(w,manifest.frame_layout.sheetWidth);assert.equal(h,manifest.frame_layout.sheetHeight);
 assert.deepEqual(RELIC_MOTION.frames,frames,'runtime reads delivered absolute rectangles');assert.deepEqual(RELIC_MOTION.durationsMs,durations);
 assert.deepEqual(RELIC_MOTION.anchor,manifest.anchor);assert.equal(RELIC_MOTION.bodyHeight,manifest.source.standardize.subjectSize[1]);assert.equal(RELIC_MOTION.durationMs,manifest.durationMs);
 assert.deepEqual(manifest.anchor,{x:287,y:436});assert.equal(durations.reduce((a,b)=>a+b,0),1400);assert.equal(manifest.loop,false);
 frames.forEach((b,i)=>{assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=w&&b.y+b.h<=h);assert.equal(durations[i],100);assert.equal(manifest.frames[i].bounds[3],436,'poses stay on the ground');assert.equal(motionFrame(i*100,durations),i);assert.equal(motionFrame(i*100+99,durations),i);});
 assert.equal(motionFrame(-1,durations),-1);assert.equal(motionFrame(1400,durations),-1,'one-shot returns to idle after its full duration');
 assert.equal(manifest.frames[0].sha256,manifest.frames[13].sha256,'the one-shot returns to its original pose');
});

test('visible room targets hit only connected exits, leaving the floor non-navigable',()=>{
 const s=newRun({seed:1});
 for(let pos=0;pos<s.rooms.length;pos++){
  s.pos=pos;const ids=neighbours(s);
  for(const id of ids){const p=exitAnchor(pos,id);assert.ok(p);assert.equal(hitExit(pos,ids,p.x,p.y),id);}
  assert.equal(hitExit(pos,ids,.4,.85),-1,'tapping below the heroine must not choose a random room');
 }
 assert.equal(hitExit(0,[1],.81,.66),-1,'a decorative door without a connection is not a target');
});

test('all classic and expanded rooms fit and remain separately clickable at phone map sizes',()=>{
 for(const roomCount of [16,20])for(const [w,h]of [[360,244],[390,369],[584,156],[480,260],[480,240]]){
  const options={roomCount},grid=mapLayout(w,h,options),points=[];
  assert.equal(grid.rows,roomCount/4);
  for(let id=0;id<roomCount;id++){
   const point=projectMap(id,w,h,options);points.push(point);
   assert.ok(point.x-10>=0&&point.y-10>=0&&point.x+10<w&&point.y+10<h,`room ${id}/${roomCount} within ${w}×${h}`);
   assert.equal(hitMapRoom(point.x,point.y,w,h,options),id);
   assert.equal(hitMapRoom(point.x+grid.columnGap*.2,point.y+grid.rowGap*.2,w,h,options),id,'room has a usable surrounding hit region');
  }
  assert.equal(new Set(points.map(p=>`${p.x},${p.y}`)).size,roomCount);
  assert.equal(hitMapRoom(-1,h/2,w,h,options),-1);
  assert.equal(hitMapRoom(w+1,h/2,w,h,options),-1);
  assert.equal(hitMapRoom(w/2,-1,w,h,options),-1);
  assert.equal(hitMapRoom(w/2,h+1,w,h,options),-1);
 }
 assert.deepEqual(projectMap(15,480,260),projectMap(15,480,260,{roomCount:16}),'three-argument callers keep the classic layout');
 const lower=projectMap(19,480,260,{roomCount:20});
 assert.equal(hitMapRoom(lower.x,lower.y,480,260,{roomCount:20}),19,'new lair is reachable by map input');
 assert.equal(hitMapRoom(lower.x,lower.y,480,260),15,'classic saved games still end at their own lair');
});

test('opening the return winch adds only its real connected exit and matching hit region',()=>{
 const s=newRun({seed:1});
 assert.equal(s.rooms.length,20,'new expeditions use the expanded layout');
 s.pos=17;s.resource.move=10;
 const destination=SHORTCUT_EDGE[0];
 assert.ok(!neighbours(s).includes(destination));
 const target=exitAnchor(17,destination);
 assert.equal(hitExit(17,neighbours(s),target.x,target.y),-1);
 const opened=apply(s,{type:'interact'});
 assert.equal(opened.ok,true,opened.message);
 assert.ok(neighbours(s).includes(destination));
 assert.equal(hitExit(17,neighbours(s),target.x,target.y),destination);
 assert.equal(moveStatus(s,destination).allowed,true);
 s.pos=destination;
 for(const id of neighbours(s)){const p=exitAnchor(s.pos,id);assert.equal(hitExit(s.pos,neighbours(s),p.x,p.y),id,'lift and ordinary downward exits have separate hit regions');}
 const options={roomCount:20},path=mapPassage(...SHORTCUT_EDGE,480,260,options),middle=passagePoint(path,.5),room13=projectMap(13,480,260,options);
 assert.ok(path.lift&&middle.x-room13.x>24,'lift bends around the intermediate room');
 assert.deepEqual(passagePoint(path,0),path.start);assert.deepEqual(passagePoint(path,1),path.end);
});

test('room target availability respects movement cost, combat retreat, and pending rewards',()=>{
 const s=newRun({seed:1});
 assert.equal(moveStatus(s,1).allowed,true);
 assert.equal(moveStatus(s,15).allowed,false);
 assert.equal(apply(s,{type:'move',id:4}).ok,true);
 assert.equal(moveStatus(s,0).retreat,true);assert.equal(moveStatus(s,0).allowed,true);
 assert.equal(moveStatus(s,5).allowed,false);
 const before=JSON.stringify(s);assert.equal(apply(s,{type:'move',id:5}).ok,false);assert.equal(JSON.stringify(s),before);
 s.resource.move=0;assert.equal(moveStatus(s,0).allowed,false);assert.match(moveStatus(s,0).reason,/다음 턴/);
 s.resource.move=5;s.pending={type:'reward',options:['step']};assert.equal(moveStatus(s,0).allowed,false);
});
