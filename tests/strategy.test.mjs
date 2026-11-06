import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,enemyTurn,moveNoise,previewNoise} from '../dist/engine.js';
import {returnRoute,routeAdvice,lureForecast} from '../dist/strategy.js';
import {roomInteraction} from '../dist/encounter.js';
import {createTutorialRun} from '../dist/tutorial.js';

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
 s.rooms[9].enemy.hp=0;
 assert.equal(routeAdvice(s,9).label,'승강 통로');assert.equal(routeAdvice(s,9).tone,'shortcut');
 assert.equal(routeAdvice(s,16).label,'회복');assert.equal(routeAdvice(s,18).label,'전투');
});

test('accumulated noise previews match the real twelve-point sound cap',()=>{
 const s=newRun({seed:4});s.pos=17;s.resource.skill=2;s.resource.rattle=10;s.resource.quiet=0;
 assert.match(roomInteraction(s).detail,/소리 12/);assert.equal(routeAdvice(s,18).noise,12);
 apply(s,{type:'interact'});assert.equal(s.lastSound.strength,12);
});

test('route labels describe remaining rewards and living occupants, not the original room type',()=>{
 const s=newRun({seed:4});s.resource.quiet=0;s.resource.rattle=0;
 s.rooms[4].enemy=null;
 assert.equal(routeAdvice(s,4).label,'빈 방');assert.equal(routeAdvice(s,4).tone,'safe');
 s.rooms[5].enemy.hp=0;
 assert.equal(routeAdvice(s,5).label,'빈 방');assert.equal(routeAdvice(s,5).tone,'risk','shards still make noise even without an enemy');
 s.rooms[7].enemy=null;
 assert.equal(routeAdvice(s,7).tone,'neutral');
 const labels={chest:'회수 완료',relic:'유물 회수 완료',camp:'휴식 완료',merchant:'물약 품절',shrine:'정화 완료',mechanism:'지름길 개방됨'};
 for(const [type,label]of Object.entries(labels)){
  const room=s.rooms.find(r=>r.type===type);room.enemy=null;room.used=true;
  assert.equal(routeAdvice(s,room.id).label,label);
  room.enemy={hp:1};assert.equal(routeAdvice(s,room.id).label,'전투');assert.equal(routeAdvice(s,room.id).tone,'risk');
 }
 s.pos=17;s.rooms[17].enemy=null;s.rooms[17].used=false;s.resource.skill=2;
 assert.equal(routeAdvice(s,9).lift,false,'a closed lift is not a passage');
 assert.equal(apply(s,{type:'interact'}).ok,true);
 assert.equal(routeAdvice(s,9).label,'전투','an occupied lift destination still warns about combat');
 s.rooms[9].enemy=null;assert.equal(routeAdvice(s,9).label,'승강 통로');assert.equal(routeAdvice(s,9).tone,'shortcut');
});

const act=(s,action)=>assert.equal(apply(s,action).ok,true);
function verifyForecast(s,id){
 const before=structuredClone(s),actual=structuredClone(s);
 const actors=actual.rooms.filter(r=>r.enemy?.hp>0).map(r=>({from:r.id,enemy:r.enemy}));
 const forecast=lureForecast(s,id),result=apply(actual,{type:'lure',id});
 assert.equal(forecast.ok,result.ok);assert.deepEqual(s,before,'forecast must not consume state, logs or RNG');
 if(!result.ok){assert.equal(forecast.reason,result.message);assert.deepEqual(forecast.moves,[]);return forecast;}
 const heard=new Set(actual.lastSound.heard.map(e=>e.id));enemyTurn(actual);
 assert.equal(forecast.noise,actual.lastSound.strength);
 assert.equal(forecast.cost,s.resource.skill-actual.resource.skill);
 assert.deepEqual(forecast.moves.map(e=>e.from),actors.filter(e=>s.rooms[e.from].seen).map(e=>e.from));
 for(const e of forecast.moves){
  const actor=actors.find(a=>a.from===e.from).enemy,to=actual.rooms.find(r=>r.enemy===actor).id;
  assert.equal(e.to,s.rooms[to].seen?to:null);assert.equal(e.heard,heard.has(e.from));
  assert.equal(e.entersPlayer,to!==e.from&&to===s.pos);
  assert.equal(e.kind==='move',to!==e.from);
 }
 return forecast;
}
function scenario(edges,enemies,seen=null){
 const s=newRun({seed:71});s.edges=edges;s.resource.skill=3;
 s.rooms.forEach(r=>{r.enemy=null;r.seen=seen===null||seen.includes(r.id);r.terrain='stone';});
 for(const [id,patch]of enemies)s.rooms[id].enemy={name:`적 ${id}`,hp:4,maxHp:4,damage:2,gold:2,home:id,mode:'idle',target:null,memory:0,awareness:0,anchored:false,...patch};
 return s;
}

test('lure forecasts the real tutorial 6→5 movement without consuming the teaching run',()=>{
 const s=createTutorialRun();act(s,{type:'move',id:1});act(s,{type:'interact'});act(s,{type:'hide'});
 const forecast=verifyForecast(s,5),guard=forecast.moves.find(e=>e.from===6);
 assert.equal(guard.to,5);assert.equal(guard.heard,true);assert.equal(guard.kind,'move');
 assert.equal(forecast.entersPlayer,false);assert.equal(forecast.moves.length,1,'the hidden relic guardian is not exposed');
 assert.equal(forecast.noise,5,'quiet and rattling gear do not change thrown-stone noise');
});

test('luring from the main-game warehouse warns when the next step enters the player room',()=>{
 for(const seed of [4,31,42]){
  const s=newRun({seed});act(s,{type:'move',id:1});act(s,{type:'interact'});act(s,{type:'hide'});
  const forecast=verifyForecast(s,2),guard=forecast.moves.find(e=>e.from===5);
  assert.equal(guard.to,1);assert.equal(guard.entersPlayer,true);assert.equal(forecast.entersPlayer,true);
  assert.match(forecast.summary,/현재 방/);assert.match(forecast.assumption,/추가 행동 없이/);
 }
});

test('lure validation exactly follows the real action, including pending rewards and repeat use',()=>{
 const cases=[s=>{s.phase='won';},s=>{s.pending={type:'reward',options:['step']};},s=>{s.lureTurn=s.turn;},s=>{s.resource.skill=0;}];
 for(const change of cases){const s=newRun({seed:4});change(s);assert.equal(verifyForecast(s,1).ok,false);}
 for(const id of [-1,19,undefined,'1'])assert.equal(verifyForecast(newRun({seed:4}),id).ok,false);
});

test('lure distinguishes hearing from movement and preserves existing memory outside its sound field',()=>{
 const s=scenario([[0,1],[1,2],[2,3],[0,4],[4,5],[5,6]],[
  [1,{}],[2,{anchored:true}],[3,{}],
  [6,{mode:'hunt',target:4,memory:1,awareness:5}],[8,{mode:'hunt',target:7,memory:0}],[9,{}]
 ]);
 const forecast=verifyForecast(s,1),at=id=>forecast.moves.find(e=>e.from===id);
 assert.equal(at(1).kind,'at-target');assert.equal(at(2).kind,'anchored');assert.equal(at(2).heard,true);
 assert.equal(at(3).kind,'listen');assert.equal(at(3).heard,true);
 assert.equal(at(6).to,5);assert.equal(at(6).heard,false);assert.equal(at(6).targetChanged,false);
 assert.equal(at(8).kind,'idle');assert.equal(at(9).kind,'idle');
});

test('lure redirects remembered targets but never makes an enemy already in the player room leave',()=>{
 const s=scenario([[0,1],[1,2],[2,3]],[[0,{}],[2,{mode:'hunt',target:3,memory:2,awareness:5}]]);
 const forecast=verifyForecast(s,1),guard=forecast.moves.find(e=>e.from===2);
 assert.equal(guard.to,1);assert.equal(guard.targetChanged,true);
 assert.equal(forecast.moves.find(e=>e.from===0).kind,'counter');assert.match(forecast.summary,/반격/);
});

test('lure uses real enemy processing order for occupied and newly vacated passages',()=>{
 const vacated=scenario([[0,1],[1,2],[2,3]],[[2,{name:'같은 이름'}],[3,{name:'같은 이름',awareness:2}]]);
 assert.deepEqual(verifyForecast(vacated,1).moves.map(e=>[e.from,e.to]),[[2,1],[3,2]]);
 const blocked=scenario([[0,3],[3,2],[2,1]],[[1,{awareness:2}],[2,{}]]);
 const moves=verifyForecast(blocked,3).moves;
 assert.deepEqual(moves.map(e=>[e.from,e.to]),[[1,1],[2,3]]);assert.equal(moves[0].kind,'blocked');
});

test('lure never reveals hidden actors, hidden destinations or hidden occupancy details',()=>{
 const s=scenario([[0,1],[1,2],[2,3]],[[2,{name:'보이는 파수병'}],[3,{name:'숨은 비밀 적',awareness:2}]],[0,2]);
 s.rooms[1].name='숨은 목적지 이름';s.rooms[3].name='숨은 출발지 이름';
 const forecast=verifyForecast(s,1),serialized=JSON.stringify(forecast);
 assert.equal(forecast.moves.length,1);assert.equal(forecast.moves[0].to,null);assert.equal(forecast.moves[0].toName,'어둠 속');
 assert.doesNotMatch(serialized,/숨은 비밀 적|숨은 목적지 이름|숨은 출발지 이름/);
 const hiddenOnly=scenario([[0,1],[1,2]],[[2,{name:'숨은 적'}]],[0,1]);
 const unknown=verifyForecast(hiddenOnly,1);assert.deepEqual(unknown.moves,[]);assert.equal(unknown.entersPlayer,false);
 const occupied=scenario([[0,1],[1,2]],[[1,{name:'숨은 막는 적'}],[2,{name:'보이는 적'}]],[0,2]);
 const blocked=verifyForecast(occupied,1);assert.equal(blocked.moves[0].kind,'blocked');
 assert.doesNotMatch(JSON.stringify(blocked),/숨은 막는 적/);assert.equal(blocked.moves[0].to,2);
});
