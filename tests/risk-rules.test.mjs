import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,validSave,soundField,emitNoise,moveCost,breathPlan,resolvePool} from '../dist/engine.js';
import {hasRisk,RISK,healingLeft,healingAmount} from '../dist/risk-rules.js';
import {turnImpact,roomInteraction} from '../dist/encounter.js';
import {runBot,summarize,endDamage} from '../docs/plan/tools/risk-bots.mjs';
const run=()=>newRun({seed:42,role:'rogue',layout:'staged',risk:true});
function act(s,a){const r=apply(s,a);assert(r.ok,r.message);return r;}
function prepared(s){s.stagePrepared=['recruit','recruit','recruit'];[5,7,13].forEach(id=>s.rooms[id].used=true);s.memory=3;return s;}
test('risk is an explicit new-run generation; legacy saves and detailed practice retain their rules and RNG',()=>{
 const old=newRun({seed:42,layout:'staged'}),same=newRun({seed:42,layout:'staged',risk:false}),modern=run();assert.deepEqual(old,same);assert(!hasRisk(old));assert(hasRisk(modern));assert(validSave(old)&&validSave(modern));
 for(const k of ['rng','deck','played','resource','edges'])assert.deepEqual(old[k],modern[k]);
 assert(!hasRisk(newRun({layout:'classic',risk:true})));assert(!hasRisk(newRun({layout:'expanded',risk:true})));assert(!hasRisk(newRun({layout:'staged',gimmicks:false,risk:true})));
 assert.equal(old.rooms[18].enemy.hp,7);assert.equal(modern.rooms[18].enemy.hp,20);assert.equal(modern.rooms[4].enemy.hp,3);
});
test('all actual healing shares a persistent twelve-health budget, including medals, supplies and rest',()=>{
 const s=prepared(run());s.hp=1;s.pos=8;assert.equal(roomInteraction(s).detail.split(' · ')[0],'체력 +3');act(s,{type:'interact'});assert.equal(s.hp,4);assert.equal(s.healingUsed,3);
 act(s,{type:'provision'});assert.equal(s.hp,8);assert.equal(s.healingUsed,7);s.pos=16;act(s,{type:'interact'});assert.equal(s.hp,11);assert.equal(s.healingUsed,10);
 s.played=[];resolvePool(s,['potion']);assert.equal(s.hp,13);assert.equal(s.healingUsed,12);assert.equal(healingLeft(s),0);assert(validSave(JSON.parse(JSON.stringify(s))));
 const prior=JSON.stringify(s);assert(!apply(s,{type:'provision'}).ok);assert.equal(JSON.stringify(s),prior);resolvePool(s,['healing']);assert.equal(s.hp,13);assert.equal(s.healingUsed,12);
});
test('unused capacity is not charged at full health and resupply still provides a real limited ration',()=>{
 const s=run();act(s,{type:'move',id:1});act(s,{type:'move',id:5});act(s,{type:'prepare',choice:'resupply'});assert.equal(s.healingUsed,0);assert.equal(s.provisions,2);assert.equal(healingAmount(s,6),0);
 s.hp-=1;s.provisionTurn=0;act(s,{type:'provision'});assert.equal(s.healingUsed,1);assert.equal(healingLeft(s),11);assert.equal(s.hp,s.maxHp);
});
test('breath grows with the actual current-room echo and depth; armor spent on enemies cannot block it again',()=>{
 const s=prepared(run());s.pos=19;s.sealForce=true;s.noise=8;s.echo.fill(0);s.echo[19]=3;s.rooms[19].enemy.damage=4;s.resource.block=5;
 const p=breathPlan(s);assert.equal(p.damage,12);const f=turnImpact(s);assert.equal(f.block,1);const predicted=endDamage(s),hp=s.hp;act(s,{type:'end'});assert.equal(s.attack.blocked,1);assert.equal(s.hp,Math.max(0,hp-predicted));
 const old=newRun({layout:'staged'});old.pos=19;old.echo.fill(0);old.echo[19]=3;assert.equal(breathPlan(old).damage,3);
});
test('crossing alert five immediately extends sound through real passages and never through a sealed door',()=>{
 const s=prepared(run());s.edges=[[0,1],[1,2],[2,3],[9,13]];[0,1,2,3].forEach(id=>s.rooms[id].terrain='stone');s.noise=4;s.resource.rattle=0;s.resource.quiet=0;
 assert(!soundField(s,0,4).some(x=>x.id===2));emitNoise(s,0,4,'threshold');assert.equal(s.noise,6);assert(s.lastSound.field.some(x=>x.id===3));assert(!soundField(s,9,10).some(x=>x.id===13));
 const old=newRun({layout:'staged'});old.edges=[[0,1],[1,2]];[0,1,2].forEach(id=>old.rooms[id].terrain='stone');old.noise=6;assert(!soundField(old,0,4).some(x=>x.id===2));
});
test('new movement costs follow stage depth while the entire upper introduction remains unchanged',()=>{
 const s=prepared(run()),old=newRun({layout:'staged'});assert.equal(moveCost(s,1),moveCost(old,1));assert.equal(moveCost(s,6),2);assert.equal(moveCost(s,11),2);assert.equal(moveCost(s,19),2);assert.equal(moveCost(s,19,'sneak'),3);
 s.pos=7;s.resource.move=2;s.resource.quiet=10;act(s,{type:'move',id:11});assert.equal(s.resource.move,0);assert(validSave(s));
});
test('malformed risk counters are rejected without forcing an old save into the new profile',()=>{
 const s=run();for(const patch of [{riskVersion:2},{healingUsed:-1},{healingUsed:13},{healingUsed:0.5},{healingUsed:undefined}])assert(!validSave({...s,...patch}));const old=newRun({layout:'staged'});assert(validSave(old));act(old,{type:'move',id:1});assert.equal(old.riskVersion,undefined);
});
test('calibration policies meet the declared risk, noise-control and completed-run duration targets without action cutoffs',()=>{
 for(const role of ['rogue','knight','mage']){
  const walking=Array.from({length:60},(_,i)=>runBot(i+1,role,false)),quiet=Array.from({length:60},(_,i)=>runBot(i+1,role,true)),a=summarize(walking),b=summarize(quiet);
  assert(a.winRate<=.1);assert(a.deaths>a.losses/2);assert(b.winRate>=.5&&b.winRate<=.7,role+JSON.stringify(b));assert(b.winRate-a.winRate>=.4);assert(b.winTurns>=18&&b.winTurns<=25);assert.equal(a.cutoffs+b.cutoffs,0);
  assert(quiet.some(r=>r.metrics.lures>0));assert(quiet.some(r=>r.metrics.hides>0));assert([...walking,...quiet].every(r=>r.metrics.invalid===0));
 }
});
