import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,moveNoise,previewNoise} from '../dist/engine.js';
import {returnRoute,routeAdvice} from '../dist/strategy.js';
import {roomInteraction} from '../dist/encounter.js';

test('return estimate respects charted passages and the working lift without changing state',()=>{
 const s=newRun({seed:41});s.pos=17;s.rooms.forEach(r=>r.seen=true);
 const before=JSON.stringify(s);assert.equal(returnRoute(s).cost,7);assert.equal(JSON.stringify(s),before);
 s.resource.skill=2;assert.equal(apply(s,{type:'interact'}).ok,true);
 assert.deepEqual(returnRoute(s),{path:[17,9,5,1,0],cost:4,steps:4});
 s.rooms.forEach(r=>r.seen=false);s.rooms[17].seen=true;s.rooms[0].seen=true;
 assert.equal(returnRoute(s),null,'unknown rooms cannot silently become the recommended return route');
});

test('route previews expose the actual sound cost, enemy and lift tradeoffs',()=>{
 const s=newRun({seed:4});
 assert.equal(routeAdvice(s,1).noise,previewNoise(s,moveNoise(s,1)));
 assert.equal(routeAdvice(s,4).label,'전투');
 s.pos=17;s.resource.skill=2;apply(s,{type:'interact'});
 assert.equal(routeAdvice(s,9).label,'승강 통로');assert.equal(routeAdvice(s,9).tone,'shortcut');
 assert.equal(routeAdvice(s,16).label,'회복');assert.equal(routeAdvice(s,18).label,'전투');
});

test('accumulated noise previews match the real twelve-point sound cap',()=>{
 const s=newRun({seed:4});s.pos=17;s.resource.skill=2;s.resource.rattle=10;s.resource.quiet=0;
 assert.match(roomInteraction(s).detail,/소리 12/);assert.equal(routeAdvice(s,18).noise,12);
 apply(s,{type:'interact'});assert.equal(s.lastSound.strength,12);
});
