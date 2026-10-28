import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newRun,apply,moveStatus,neighbours} from '../dist/engine.js';
import {travelVector,directionIndex,exitAnchor,hitExit} from '../dist/scene-layout.js';
import {WALK_FRAMES} from '../dist/rogue-frames.js';
import {ATTACK_FRAMES} from '../dist/rogue-attack-frames.js';
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

test('visible room targets hit only connected exits, leaving the floor non-navigable',()=>{
 const s=newRun({seed:1});
 for(let pos=0;pos<16;pos++){
  s.pos=pos;const ids=neighbours(s);
  for(const id of ids){const p=exitAnchor(pos,id);assert.ok(p);assert.equal(hitExit(pos,ids,p.x,p.y),id);}
  assert.equal(hitExit(pos,ids,.4,.85),-1,'tapping below the heroine must not choose a random room');
 }
 assert.equal(hitExit(0,[1],.81,.66),-1,'a decorative door without a connection is not a target');
});

test('room target availability respects movement cost, combat retreat, and pending rewards',()=>{
 const s=newRun({seed:1});
 assert.equal(moveStatus(s,1).allowed,true);
 assert.equal(moveStatus(s,15).allowed,false);
 assert.equal(apply(s,{type:'move',id:4}).ok,true);
 assert.equal(moveStatus(s,0).retreat,true);assert.equal(moveStatus(s,0).allowed,true);
 assert.equal(moveStatus(s,5).allowed,false);
 const before=JSON.stringify(s);assert.equal(apply(s,{type:'move',id:5}).ok,false);assert.equal(JSON.stringify(s),before);
 s.resource.move=0;assert.equal(moveStatus(s,0).allowed,false);assert.match(moveStatus(s,0).reason,/풀 뽑기/);
 s.resource.move=5;s.pending={type:'reward',options:['step']};assert.equal(moveStatus(s,0).allowed,false);
});
