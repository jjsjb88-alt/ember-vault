import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS,ROLES,newRun,apply,validSave,neighbours,moveCost,moveStatus,soundField,emitNoise,enemyTurn,breathPlan,lairRoom,SHORTCUT_EDGE} from '../dist/engine.js';

const act=(s,a)=>{const result=apply(s,a);assert.equal(result.ok,true,result.message);return result;};
const mechanismRun=()=>{const s=newRun({seed:42});s.pos=17;s.resource.skill=3;s.resource.rattle=0;s.resource.quiet=0;return s;};

test('new expeditions use a connected twenty-room dungeon and retain the original relic choices',()=>{
 const s=newRun({seed:42});assert.equal(s.layout,'expanded');assert.equal(s.rooms.length,20);assert.equal(s.echo.length,20);assert.equal(lairRoom(s),19);
 assert.deepEqual(s.rooms.slice(16).map(r=>[r.id,r.row,r.col,r.type,r.terrain]),[
  [16,4,0,'camp','moss'],[17,4,1,'mechanism','stone'],[18,4,2,'chest','shards'],[19,4,3,'relic','stone']
 ]);
 assert.deepEqual([10,13,15,19].map(id=>s.rooms[id].relic.value),[18,28,42,56]);
 for(const [a,b]of [[12,16],[16,17],[17,18],[18,19],[15,19]])assert.ok(neighbours(s,a).includes(b));
 assert.ok(!neighbours(s,17).includes(9));
 const reached=new Set([0]),queue=[0];while(queue.length)for(const next of neighbours(s,queue.shift()))if(!reached.has(next)){reached.add(next);queue.push(next);}
 assert.equal(reached.size,20);assert.ok(validSave(s));
 for(const mode of ['walk','sneak','rush'])assert.equal(moveCost(s,16,mode),moveCost(s,12,mode));
 assert.equal(moveCost(s,16,'walk'),2);assert.equal(moveCost(s,16,'sneak'),3);assert.equal(moveCost(s,16,'rush'),1);
 s.pos=12;const moves=s.resource.move;act(s,{type:'move',id:16});assert.equal(s.resource.move,moves-2);
});

test('classic runs keep the old RNG, starting deck and market and need no layout marker',()=>{
 const expected=[
  [1,333695716,['step','slash','focus','guard','scout'],['step','wisdom','potion','rush']],
  [42,2205989583,['scout','slash','guard','focus','step'],['step','bash','healing','ghost']],
  [42028,1807487078,['step','guard','slash','scout','focus'],['step','greed','bash','spark']]
 ];
 for(const [seed,rng,deck,market]of expected){
  const s=newRun({seed,layout:'classic'});assert.equal(s.layout,undefined);assert.equal(s.rooms.length,16);assert.equal(s.echo.length,16);assert.equal(lairRoom(s),15);
  assert.equal(s.rng,rng);assert.deepEqual(s.deck,deck);assert.deepEqual(s.market,market);assert.ok(validSave(s));
  const saved=JSON.parse(JSON.stringify(s));act(s,{type:'end'});act(saved,{type:'end'});assert.deepEqual(saved,s);
 }
 const old=newRun({seed:8,layout:'classic'});delete old.echo;delete old.memory;old.bag={black:12,mine:3};old.clank=2;
 assert.ok(validSave(old));emitNoise(old,0,4,'이전 저장의 소리');assert.equal(old.echo.length,16);assert.equal(old.bag,undefined);assert.ok(validSave(old));
});

test('invalid room counts, links and echo data are rejected without rejecting old sixteen-room saves',()=>{
 const cases=[
  s=>{delete s.layout;},s=>{s.rooms.pop();},s=>{s.pos=20;},s=>{s.rooms[19].id=15;},s=>{s.rooms[19].row=3;},
  s=>{s.edges.push([17,20]);},s=>{s.edges.push([-1,17]);},s=>{s.edges.push([17,17]);},s=>{s.edges.push([16,12]);},
  s=>{s.echo.pop();},s=>{s.echo[19]=NaN;},s=>{s.echo[19]=10;}
 ];
 for(const corrupt of cases){const s=newRun({seed:1});corrupt(s);assert.equal(validSave(s),false);}
 const legacy=newRun({seed:1,layout:'classic'});delete legacy.echo;assert.ok(validSave(legacy));legacy.echo=null;assert.ok(validSave(legacy));legacy.pos=19;assert.equal(validSave(legacy),false);
});

test('the winch charges once, reveals its destination and emits sound through the newly opened passage',()=>{
 const s=mechanismRun();s.rooms[9].seen=false;
 assert.equal(moveStatus(s,9).allowed,false);assert.equal(soundField(s,17,6).some(p=>p.id===9),false);
 const rng=s.rng,edges=s.edges.length;act(s,{type:'interact'});
 assert.equal(s.resource.skill,1);assert.equal(s.rng,rng);assert.equal(s.edges.length,edges+1);assert.equal(s.rooms[17].used,true);assert.equal(s.rooms[9].seen,true);
 assert.equal(s.lastSound.strength,6);assert.equal(s.lastSound.field.find(p=>p.id===9).level,4);assert.equal(s.echo[17],3);
 assert.equal(moveStatus(s,9).allowed,true);assert.equal(s.rooms[9].enemy.target,17);
 const saved=JSON.parse(JSON.stringify(s)),before=JSON.stringify(s);
 assert.equal(apply(s,{type:'interact'}).ok,false);assert.equal(JSON.stringify(s),before);
 assert.ok(validSave(saved));assert.equal(saved.edges.filter(e=>e.includes(9)&&e.includes(17)).length,1);
 act(saved,{type:'move',id:9});assert.equal(saved.pos,9);
});

test('failed winch interactions do not spend skill, change RNG, or add a duplicate corridor',()=>{
 for(const setup of [s=>{s.resource.skill=1;},s=>{s.rooms[17].enemy={...s.rooms[9].enemy};},s=>{s.rooms[17].used=true;},s=>{s.edges.push([17,9]);}]){
  const s=mechanismRun();setup(s);const before=JSON.stringify(s);
  assert.equal(apply(s,{type:'interact'}).ok,false);assert.equal(JSON.stringify(s),before);
 }
});

test('the lift makes the shortest return both fewer passages and cheaper to traverse',()=>{
 const s=mechanismRun();assert.deepEqual(SHORTCUT_EDGE,[9,17]);
 const distance=weighted=>{
  const costs=Array(s.rooms.length).fill(Infinity),pending=new Set(s.rooms.map(r=>r.id));costs[17]=0;
  while(pending.size){
   const here=[...pending].sort((a,b)=>costs[a]-costs[b])[0];pending.delete(here);
   for(const next of neighbours(s,here))costs[next]=Math.min(costs[next],costs[here]+(weighted?moveCost(s,next,'walk'):1));
  }
  return costs[0];
 };
 assert.equal(distance(false),5);assert.equal(distance(true),7);
 act(s,{type:'interact'});
 assert.equal(distance(false),4);assert.equal(distance(true),4);
});

test('opening the winch changes real pursuit and breath routes, including the new lair tie break',()=>{
 const s=mechanismRun();s.echo.fill(0);s.echo[17]=9;s.echo[9]=5;s.pos=9;
 assert.equal(breathPlan(s).hit,false);
 s.pos=17;act(s,{type:'interact'});s.pos=9;
 const plan=breathPlan(s);assert.deepEqual(plan.path,[17,9]);assert.equal(plan.hit,true);
 s.noise=8;s.resource.block=0;s.rooms[9].enemy=null;const hp=s.hp;act(s,{type:'end'});
 assert.equal(s.attack.hit,true);assert.deepEqual(s.attack.path,[17,9]);assert.equal(s.hp,hp-plan.damage);assert.equal(s.echo[17],0);assert.equal(s.echo[9],0);

 const pursuit=open=>{const state=mechanismRun();if(open)act(state,{type:'interact'});state.pos=0;const guard={...state.rooms[4].enemy,target:9,mode:'hunt',memory:3,anchored:false};for(const room of state.rooms)room.enemy=null;state.rooms[17].enemy=guard;enemyTurn(state);return state;};
 assert.equal(pursuit(false).rooms[16].enemy?.target,9);assert.equal(pursuit(true).rooms[9].enemy?.target,9);
 const tie=newRun({seed:3});tie.echo[15]=5;tie.echo[19]=5;assert.equal(breathPlan(tie).start,19);
});

test('deep rewards require their guards and preserve the fourteen-turn return limit on an upgrade',()=>{
 const s=newRun({seed:4});s.pos=18;assert.equal(apply(s,{type:'interact'}).ok,false);
 s.rooms[18].enemy.hp=0;s.resource.rattle=0;s.resource.quiet=0;const gold=s.gold;act(s,{type:'interact'});
 assert.equal(s.gold,gold+14);assert.equal(s.lastSound.strength,9);assert.equal(apply(s,{type:'interact'}).ok,false);
 s.pos=15;s.rooms[15].enemy.hp=0;act(s,{type:'interact'});assert.equal(s.countdown,14);
 s.countdown=9;s.pos=19;assert.equal(apply(s,{type:'interact'}).ok,false);s.rooms[19].enemy.hp=0;
 act(s,{type:'interact'});assert.equal(s.relic.value,56);assert.equal(s.countdown,9);assert.equal(s.memory,2);
 s.pos=0;act(s,{type:'interact'});assert.equal(s.phase,'won');assert.ok(validSave(s));
 const late=newRun({seed:5});late.pos=16;late.relic={name:'용의 기억',value:56};late.countdown=1;act(late,{type:'end'});assert.equal(late.phase,'lost');assert.match(late.reason,/무너/);
});

function expandedJourney(seed,role){
 const s=newRun({seed,role});let returning=false,actions=0,path=[4,8,12,16,17,18,19],index=0;
 while(s.phase==='playing'&&actions++<700){
  if(s.pending){const id=['fury','blade','ambush','spark','bash','wisdom','step','potion','healing'].find(id=>s.pending.options.includes(id));act(s,id?{type:'reward',id}:{type:'skipReward'});continue;}
  const room=s.rooms[s.pos];
  if(room.type==='mechanism'&&!room.used){if(s.resource.skill>=2)act(s,{type:'interact'});else{act(s,{type:'end'});continue;}}
  if(s.purchases<4){const buy=['fury','blade','spark','ambush','bash','wisdom','step','potion','healing'].map(id=>s.market.indexOf(id)).find(i=>i>=0&&CARDS[s.market[i]].cost<=s.resource.skill);if(buy!==undefined){act(s,{type:'buy',index:buy});continue;}}
  if(room.enemy?.hp>0){act(s,{type:s.resource.sword?'attack':'end'});continue;}
  if(room.type==='camp'&&!room.used&&(s.hp<s.maxHp||s.noise>0)||room.type==='chest'&&!room.used){act(s,{type:'interact'});continue;}
  if(s.pos===19&&!returning){act(s,{type:'interact'});returning=true;path=[18,17,9,8,4,0];index=0;continue;}
  if(returning&&s.pos===0){act(s,{type:'interact'});continue;}
  if(apply(s,{type:'move',id:path[index]}).ok)index++;else act(s,{type:'end'});
  assert.ok(validSave(s));
 }
 assert.ok(actions<700,'expanded expedition must terminate');return s;
}

test('ninety expanded expeditions can earn the deepest relic and return through the real winch passage',()=>{
 const results={};
 for(const role of Object.keys(ROLES)){
  let wins=0;
  for(let seed=1;seed<=30;seed++){
   const s=expandedJourney(seed,role);assert.ok(['won','lost'].includes(s.phase));assert.ok(validSave(s));
   if(s.phase==='won'){wins++;assert.equal(s.relic.value,56);assert.equal(s.rooms[17].used,true);assert.ok(neighbours(s,17).includes(9));assert.ok(s.rooms[9].visited);assert.ok(s.countdown>0);}
  }
  assert.ok(wins>0,`${role} must be able to recover the deepest relic`);results[role]=wins;
 }
 console.log('Expanded route wins / 30 (earned purchases, winch return):',JSON.stringify(results));
});
