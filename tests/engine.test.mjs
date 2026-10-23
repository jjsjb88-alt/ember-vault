import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,CARDS,ROLES,validSave,neighbours} from '../dist/engine.js';
const doAction=(s,a)=>{const r=apply(s,a);assert.equal(r.ok,true,r.message);return r;};
const total=s=>s.hand.length+s.deck.length+s.discard.length+s.played.length;
test('starting decks, roles, deterministic rooms, save round trip',()=>{
 for(const role of Object.keys(ROLES)){const s=newRun({seed:1,role});assert.equal(total(s),10);assert.equal(s.hand.length,5);assert.equal(s.hp,ROLES[role].hp);assert.ok(validSave(JSON.parse(JSON.stringify(s))));assert.deepEqual(s,newRun({seed:1,role}));}
 assert.equal(validSave(null),false);assert.equal(validSave({...newRun(),deck:['nonexistent']}),false);
});
test('card purchases join discard and circulate without duplicate or lost cards',()=>{
 const s=newRun({seed:2});doAction(s,{type:'play',index:3});doAction(s,{type:'buy',index:0});assert.equal(s.discard.at(-1),'step');assert.equal(total(s),11);
 for(let i=0;i<8;i++){doAction(s,{type:'end'});assert.equal(total(s),11);assert.equal(s.hand.length,5);assert.ok(validSave(s));}
});
test('movement is connected, costs resource, reveals neighbours, and enemy allows only retreat',()=>{
 const s=newRun({seed:3});assert.equal(apply(s,{type:'move',id:15}).ok,false);doAction(s,{type:'move',id:4});assert.equal(s.resource.move,0);assert.ok(s.rooms[8].seen);assert.equal(apply(s,{type:'move',id:8}).ok,false);
 doAction(s,{type:'play',index:1});assert.equal(apply(s,{type:'move',id:8}).ok,false);doAction(s,{type:'move',id:0});assert.equal(s.noise,1);
});
test('partial combat, reward choice blocks play and increases deck once',()=>{
 const s=newRun({seed:4});doAction(s,{type:'play',index:2});doAction(s,{type:'move',id:4});doAction(s,{type:'attack'});assert.equal(s.rooms[4].enemy.hp,1);s.resource.sword=2;doAction(s,{type:'attack'});assert.equal(s.kills,1);assert.equal(s.resource.sword,1);assert.equal(apply(s,{type:'end'}).ok,false);
 const id=s.pending.options[0];doAction(s,{type:'reward',id});assert.equal(total(s),11);assert.equal(apply(s,{type:'reward',id}).ok,false);
});
test('armor absorbs attacks; noise and countdown can lose a run',()=>{
 const s=newRun({seed:5});s.pos=4;s.resource.block=2;s.noise=8;const hp=s.hp;doAction(s,{type:'end'});assert.equal(s.hp,hp-3);assert.equal(s.noise,2);
 s.hp=1;s.noise=8;doAction(s,{type:'end'});assert.equal(s.phase,'lost');assert.equal(apply(s,{type:'play',index:0}).ok,false);
 const t=newRun();t.relic={name:'달의 눈물',value:18};t.countdown=1;doAction(t,{type:'end'});assert.equal(t.phase,'lost');assert.match(t.reason,/무너/);
});
test('artifact guards, countdown, swapping, exit and score',()=>{
 const s=newRun({seed:6});assert.equal(apply(s,{type:'interact'}).ok,false);s.pos=10;assert.equal(apply(s,{type:'interact'}).ok,false);s.rooms[10].enemy.hp=0;doAction(s,{type:'interact'});assert.equal(s.countdown,14);assert.equal(s.relic.value,18);assert.equal(s.noise,3);s.countdown=9;s.pos=15;s.rooms[15].enemy.hp=0;doAction(s,{type:'interact'});assert.equal(s.relic.value,42);assert.equal(s.countdown,9);s.pos=0;doAction(s,{type:'interact'});assert.equal(s.phase,'won');assert.equal(s.score,42+22+2+20);
});
test('one-use camp, merchant and card removal maintain invariants',()=>{
 const s=newRun({seed:7});s.pos=8;s.hp-=8;s.noise=4;doAction(s,{type:'interact'});assert.equal(s.hp,s.maxHp-2);assert.equal(s.noise,1);assert.equal(apply(s,{type:'interact'}).ok,false);
 s.pos=s.rooms.find(r=>r.type==='shrine').id;doAction(s,{type:'interact'});doAction(s,{type:'purge',id:s.pending.options[0]});assert.equal(total(s),9);assert.ok(s.rooms[s.pos].used);
 s.pos=s.rooms.find(r=>r.type==='merchant').id;s.gold=5;doAction(s,{type:'merchant'});assert.equal(s.gold,0);assert.equal(s.hp,s.maxHp);assert.equal(apply(s,{type:'merchant'}).ok,false);
});
function journey(seed,role,target=10){
 const s=newRun({seed,role});const path=target===10?[1,2,6,10]:[1,2,3,7,11,15];let returning=false,pathIndex=0;let actions=0;
 while(s.phase==='playing'&&actions++<500){
  if(s.pending){const options=s.pending.options;const pick=['blade','spark','ambush','potion','fury','wisdom','rush','step'].find(x=>options.includes(x));doAction(s,pick?{type:'reward',id:pick}:{type:'skipReward'});continue;}
  if(s.hand.length){let i=s.hand.findIndex(id=>(CARDS[id].e.noise||0)>=0);if(i<0)i=0;doAction(s,{type:'play',index:i});continue;}
  const r=s.rooms[s.pos];
  if(r.enemy?.hp>0){if(s.resource.sword)doAction(s,{type:'attack'});else doAction(s,{type:'end'});continue;}
  if(r.type==='camp'&&!r.used&&(s.hp<s.maxHp||s.noise>0)){doAction(s,{type:'interact'});continue;}
  if(s.pos===target&&!returning){doAction(s,{type:'interact'});returning=true;pathIndex=path.length-2;continue;}
  if(s.pos===0&&returning){doAction(s,{type:'interact'});continue;}
  const next=returning?(pathIndex<0?0:path[pathIndex]):path[pathIndex];
  const result=apply(s,{type:'move',id:next});if(result.ok){pathIndex+=returning?-1:1;}else{doAction(s,{type:'end'});}
  assert.ok(s.hp>=0&&s.noise>=0&&s.noise<=12);assert.ok(validSave(s));
 }
 assert.ok(actions<500,'no infinite game loop');return s;
}
test('180 seeded journeys terminate; first relic is accessible and deep relic carries risk',()=>{
 const results={};for(const role of Object.keys(ROLES))for(const target of [10,15]){let wins=0;for(let seed=1;seed<=30;seed++){const s=journey(seed,role,target);assert.ok(['won','lost'].includes(s.phase));if(s.phase==='won'){wins++;assert.equal(s.relic.value,target===10?18:42);}}results[role+'_'+target]=wins;if(target===10)assert.equal(wins,30);else assert.ok(wins>0,'deep relic must be winnable');}
 console.log('Seeded route wins / 30 (no shop purchases):',JSON.stringify(results));
});
