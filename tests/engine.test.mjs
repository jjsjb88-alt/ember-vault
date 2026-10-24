import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,CARDS,ROLES,validSave,neighbours,resolvePool,emitNoise,soundField,enemyTurn,moveNoise,moveCost,previewNoise,migrateSave} from '../dist/engine.js';
const doAction=(s,a)=>{const r=apply(s,a);assert.equal(r.ok,true,r.message);return r;};
const total=s=>s.hand.length+s.deck.length+s.discard.length+s.played.length;
test('all roles automatically resolve a complete starting pool, with deterministic save round trip',()=>{
 for(const role of Object.keys(ROLES)){const s=newRun({seed:1,role});assert.equal(total(s),10);assert.equal(s.hand.length,0);assert.equal(s.played.length,5);assert.equal(s.resource.move,role==='rogue'?5:4);assert.equal(s.resource.sword,role==='mage'?3:2);assert.equal(s.hp,ROLES[role].hp);assert.ok(validSave(JSON.parse(JSON.stringify(s))));assert.deepEqual(s,newRun({seed:1,role}));assert.equal(apply(s,{type:'play',index:0}).ok,false);}
 assert.equal(validSave(null),false);assert.equal(validSave({...newRun(),deck:['nonexistent']}),false);
});
test('additional draws cannot re-draw the active pool or loop forever',()=>{
 const s=newRun({seed:11});s.deck=['echo','insight','echo'];s.discard=['echo','echo'];s.played=[];s.resource={move:1,sword:0,skill:0,block:0,quiet:0,rattle:0};
 const n=total(s);resolvePool(s);assert.equal(s.played.length,5);assert.equal(total(s),n);assert.equal(s.deck.length+s.discard.length,0);assert.equal(s.resource.skill,3);
});
test('purchases circulate automatically without losing or duplicating abilities',()=>{
 const s=newRun({seed:2});doAction(s,{type:'buy',index:0});assert.equal(s.discard.at(-1),'step');assert.equal(total(s),11);
 for(let i=0;i<8;i++){doAction(s,{type:'end'});assert.equal(total(s),11);assert.equal(s.hand.length,0);assert.ok(s.played.length>=5);assert.ok(validSave(s));}
});
test('movement uses terrain and stance; retreat restriction remains enforced',()=>{
 const s=newRun({seed:3});assert.equal(apply(s,{type:'move',id:15}).ok,false);
 assert.equal(moveCost(s,1),1);assert.equal(moveNoise(s,1),4);assert.equal(previewNoise(s,4),3);
 doAction(s,{type:'mode',id:'sneak'});assert.equal(moveCost(s,1),2);assert.equal(moveNoise(s,1),2);
 doAction(s,{type:'move',id:4});assert.equal(s.resource.move,3);assert.equal(s.lastSound.strength,0);assert.ok(s.rooms[8].seen);assert.equal(apply(s,{type:'move',id:8}).ok,false);
 doAction(s,{type:'move',id:0});assert.equal(s.resource.move,1);assert.equal(s.lastSound.strength,1);
 doAction(s,{type:'mode',id:'rush'});assert.equal(moveCost(s,13),1);assert.equal(moveNoise(s,13),5);
});
test('sound travels only through connected corridors, losing 2 per room plus moss absorption',()=>{
 const s=newRun({seed:31});s.resource.quiet=0;s.resource.rattle=0;
 const a=soundField(s,1,5);assert.equal(a.find(x=>x.id===1).level,5);assert.equal(a.find(x=>x.id===5).level,3);assert.equal(a.find(x=>x.id===0).level,3);assert.equal(a.find(x=>x.id===4),undefined);assert.equal(a.find(x=>x.id===15),undefined);
 emitNoise(s,1,5,'검증');assert.equal(s.rooms[5].enemy.target,1);assert.equal(s.rooms[5].enemy.mode,'investigate');assert.equal(s.rooms[4].enemy.mode,'idle');assert.equal(s.noise,3);
});
test('guards investigate last-heard location, lures redirect them, and arrival never causes immediate damage',()=>{
 const s=newRun({seed:32});s.resource.quiet=0;s.resource.rattle=0;const hp=s.hp;
 doAction(s,{type:'lure',id:1});assert.equal(s.resource.skill,2);assert.equal(apply(s,{type:'lure',id:4}).ok,false);const guard=s.rooms[5].enemy;enemyTurn(s);assert.equal(s.rooms[1].enemy,guard);assert.equal(s.rooms[5].enemy,null);assert.equal(s.hp,hp);
 s.pos=0;emitNoise(s,0,6,'유도');enemyTurn(s);assert.equal(s.rooms[0].enemy,guard);assert.equal(s.hp,hp);
 enemyTurn(s);assert.ok(s.hp<hp);assert.equal(guard.target,0);
});
test('stationary relic guards hear but never leave their chamber; investigation expires',()=>{
 const s=newRun({seed:33});const guard=s.rooms[10].enemy;emitNoise(s,6,6,'유인',false);assert.equal(guard.target,6);
 for(let i=0;i<3;i++)enemyTurn(s);assert.equal(s.rooms[10].enemy,guard);assert.equal(guard.mode,'idle');assert.equal(guard.target,null);
});
test('stealth absorbs personal sounds but not thrown stones; hiding costs movement and is limited',()=>{
 const s=newRun({seed:34});emitNoise(s,0,1,'발걸음');assert.equal(s.lastSound.strength,0);assert.equal(s.resource.quiet,0);assert.equal(s.resource.rattle,0);assert.equal(s.noise,0);
 s.noise=5;doAction(s,{type:'hide'});assert.equal(s.noise,3);assert.equal(s.resource.move,4);assert.equal(s.resource.quiet,2);assert.equal(apply(s,{type:'hide'}).ok,false);
 doAction(s,{type:'lure',id:1});assert.equal(s.lastSound.strength,5);assert.equal(s.resource.quiet,2);assert.equal(s.noise,6);
});
test('combat spends attack pool, partial damage persists, and rewards are chosen once',()=>{
 const s=newRun({seed:4});doAction(s,{type:'move',id:4});doAction(s,{type:'attack'});assert.equal(s.rooms[4].enemy.hp,1);assert.equal(s.resource.sword,0);s.resource.sword=2;doAction(s,{type:'attack'});assert.equal(s.kills,1);assert.equal(s.resource.sword,1);assert.equal(apply(s,{type:'end'}).ok,false);
 const id=s.pending.options[0];doAction(s,{type:'reward',id});assert.equal(total(s),11);assert.equal(apply(s,{type:'reward',id}).ok,false);
});
test('armor, dragon alarm, natural decay, and collapse resolve in order',()=>{
 const s=newRun({seed:5});s.pos=4;s.resource.block=2;s.noise=8;const hp=s.hp;doAction(s,{type:'end'});assert.equal(s.hp,hp-3);assert.equal(s.noise,0);
 s.hp=1;s.resource.block=0;s.noise=8;doAction(s,{type:'end'});assert.equal(s.phase,'lost');
 const t=newRun();t.relic={name:'달의 눈물',value:18};t.countdown=1;doAction(t,{type:'end'});assert.equal(t.phase,'lost');assert.match(t.reason,/무너/);
});
test('artifact guards, countdown, upgrades, exit and scoring',()=>{
 const s=newRun({seed:6});assert.equal(apply(s,{type:'interact'}).ok,false);s.pos=10;assert.equal(apply(s,{type:'interact'}).ok,false);s.rooms[10].enemy.hp=0;doAction(s,{type:'interact'});assert.equal(s.countdown,14);assert.equal(s.relic.value,18);assert.equal(s.lastSound.strength,7);s.countdown=9;s.pos=15;s.rooms[15].enemy.hp=0;doAction(s,{type:'interact'});assert.equal(s.relic.value,42);assert.equal(s.countdown,9);s.pos=0;doAction(s,{type:'interact'});assert.equal(s.phase,'won');assert.equal(s.score,42+22+2+20);
});
test('camp, merchant and ability removal remain one-use',()=>{
 const s=newRun({seed:7});s.pos=8;s.hp-=8;s.noise=4;doAction(s,{type:'interact'});assert.equal(s.hp,s.maxHp-2);assert.equal(s.noise,1);assert.equal(apply(s,{type:'interact'}).ok,false);
 s.pos=s.rooms.find(r=>r.type==='shrine').id;doAction(s,{type:'interact'});doAction(s,{type:'purge',id:s.pending.options[0]});assert.equal(total(s),9);assert.ok(s.rooms[s.pos].used);
 s.pos=s.rooms.find(r=>r.type==='merchant').id;s.gold=5;doAction(s,{type:'merchant'});assert.equal(s.gold,0);assert.equal(s.hp,s.maxHp);assert.equal(apply(s,{type:'merchant'}).ok,false);
});
test('v1 saves retain progress and only unresolved hand effects are added',()=>{
 const v=newRun({seed:42});v.version=1;v.pos=1;v.hp=16;v.gold=8;v.played=['scout'];v.hand=['step','slash','focus','sneak'];v.resource={move:2,sword:0,skill:1,block:0};
 const s=migrateSave(v);assert.ok(validSave(s));assert.equal(s.pos,1);assert.equal(s.hp,16);assert.equal(s.gold,8);assert.equal(s.resource.move,5);assert.equal(s.resource.sword,2);assert.equal(s.resource.skill,3);assert.equal(total(s),10);assert.equal(v.version,1);assert.equal(v.hand.length,4);
});
function journey(seed,role,target=10){
 const s=newRun({seed,role});const path=target===10?[1,2,6,10]:[1,2,3,7,11,15];let returning=false,pathIndex=0,actions=0;
 while(s.phase==='playing'&&actions++<500){
  if(s.pending){const options=s.pending.options,pick=['blade','spark','ambush','potion','fury','wisdom','rush','step'].find(x=>options.includes(x));doAction(s,pick?{type:'reward',id:pick}:{type:'skipReward'});continue;}
  const r=s.rooms[s.pos];
  if(r.enemy?.hp>0){if(s.resource.sword)doAction(s,{type:'attack'});else doAction(s,{type:'end'});continue;}
  if(r.type==='camp'&&!r.used&&(s.hp<s.maxHp||s.noise>0)){doAction(s,{type:'interact'});continue;}
  if(s.pos===target&&!returning){doAction(s,{type:'interact'});returning=true;pathIndex=path.length-2;continue;}
  if(s.pos===0&&returning){doAction(s,{type:'interact'});continue;}
  const next=returning?(pathIndex<0?0:path[pathIndex]):path[pathIndex];
  const result=apply(s,{type:'move',id:next});if(result.ok)pathIndex+=returning?-1:1;else doAction(s,{type:'end'});
  assert.ok(s.hp>=0&&s.noise>=0&&s.noise<=12);assert.ok(validSave(s));
 }
 assert.ok(actions<500,'no infinite game loop');return s;
}
test('180 complete seeded journeys remain bounded and each role can escape both depths',()=>{
 const results={};for(const role of Object.keys(ROLES))for(const target of [10,15]){let wins=0;for(let seed=1;seed<=30;seed++){const s=journey(seed,role,target);assert.ok(['won','lost'].includes(s.phase));if(s.phase==='won'){wins++;assert.equal(s.relic.value,target===10?18:42);}}results[role+'_'+target]=wins;assert.ok(wins>0,'each role/depth must be winnable');}
 console.log('Route wins / 30 (no shop, no stealth):',JSON.stringify(results));
});
