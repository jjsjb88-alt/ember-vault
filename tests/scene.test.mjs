import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newRun} from '../dist/engine.js';
import {travelVector,directionIndex} from '../dist/scene-layout.js';
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
