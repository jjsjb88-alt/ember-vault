import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,validSave,CARDS,objectParticle,dragonDue,breathPlan} from '../dist/engine.js';
import {startFirstRun,recordFirstRun,firstRunGoal,firstRunMemory,actionReceipt,returnForecast} from '../dist/first-run.js';
function act(s,a){const before=structuredClone(s),expected=structuredClone(s),r=apply(s,a);assert(r.ok,r.message);assert(apply(expected,a).ok);recordFirstRun(before,a,s);const actual=structuredClone(s);delete actual.firstRun;delete expected.firstRun;assert.deepEqual(actual,expected,'guidance cannot alter rules, RNG or resources');assert(validSave(s));return before;}
function recruit(seed=1){const s=newRun({seed,layout:'staged'});startFirstRun(s);act(s,{type:'move',id:1});act(s,{type:'interact'});act(s,{type:'move',id:5});act(s,{type:'prepare',choice:'recruit',id:'spark'});return s;}
test('short guidance uses the real staged campaign and allows normal alternatives; old runs have no unsolicited progress',()=>{
 const old=newRun({layout:'classic'}),modern=newRun({layout:'staged'});assert.equal(firstRunGoal(old),null);assert.equal(firstRunGoal(modern),null);const original=structuredClone(modern);startFirstRun(modern);assert(firstRunGoal(modern));delete modern.firstRun;delete modern.firstExpedition;assert.deepEqual(modern,original);startFirstRun(old);assert.equal(old.firstRun,undefined);
 const s=newRun({layout:'staged'});startFirstRun(s);act(s,{type:'move',id:4});assert.match(firstRunGoal(s).title,/공격/);act(s,{type:'attack'});assert(firstRunGoal(s));
});
test('recruitment waits for an actual future draw and survives save round trips without granting or guaranteeing a draw',()=>{
 for(let seed=1;seed<=30;seed++){
  let s=recruit(seed);assert.equal(firstRunMemory(s),null);assert.equal(s.firstRun.memory,'spark');const skill=s.resource.skill;assert.equal(skill,3);
  act(s,{type:'end'});assert.equal(firstRunMemory(s),null,'first untouched starter bag cannot contain the new spark');
  for(let i=0;i<5&&!firstRunMemory(s);i++){s=JSON.parse(JSON.stringify(s));assert(validSave(s));act(s,{type:'end'});}
  const memory=firstRunMemory(s);assert(memory);assert(s.played.includes(memory.id));assert.equal(s.firstRun.drawnTurn,s.turn);assert.equal(s.resource.sword,s.played.reduce((n,id)=>n+(CARDS[id].e.sword||0),0));
 }
});
test('the first use completes optional help only after drawing and spending the relevant force; dismissing does not block play',()=>{
 const s=recruit(4);while(!firstRunMemory(s))act(s,{type:'end'});const source=structuredClone(s);s.pos=6;s.memory=1;s.resource.move=Math.max(2,s.resource.move);act(s,{type:'move',id:7});
 // Guard spending alone is not presented as an attack lesson; use the actual enemy action.
 const t=source;t.pos=3;t.memory=1;t.resource.sword=Math.max(t.resource.sword,3);act(t,{type:'attack'});assert(t.firstRun.used);assert.equal(t.firstRun.enabled,false);assert.equal(firstRunGoal(t),null);
 const quiet=recruit(4);quiet.firstRun.enabled=false;assert.equal(firstRunGoal(quiet),null);assert(validSave(quiet));
});
test('receipts report committed gold, sound and attack changes rather than invented ability bonuses',()=>{
 const s=newRun({layout:'staged',seed:2});startFirstRun(s);act(s,{type:'move',id:1});const b=act(s,{type:'interact'}),receipt=actionReceipt(b,{type:'interact'},s);assert(receipt.includes(`금화 +${s.gold-b.gold}`));assert(receipt.includes(`경계 ${b.noise} → ${s.noise}`));
 const t=newRun({layout:'staged',seed:2});startFirstRun(t);act(t,{type:'move',id:4});const prior=act(t,{type:'attack'}),text=actionReceipt(prior,{type:'attack'},t);assert(text.includes('체력 3 → 1'));assert(text.includes('공격 2 → 0'));
});
test('new optional guidance rejects corrupt metadata while legacy saves remain valid',()=>{
 const s=recruit();for(const p of [null,{...s.firstRun,memory:'invented'},{...s.firstRun,drawnTurn:s.turn+1},{...s.firstRun,enabled:1},{...s.firstRun,used:undefined}])assert(!validSave({...s,firstRun:p}));assert(validSave(newRun({layout:'staged'})));
});
test('return advice reflects actual current breath and the next absolute trigger turn without changing state',()=>{
 const s=newRun({layout:'staged'});s.relic={name:'용의 기억',value:56};s.countdown=14;
 for(const turn of [4,5,6]){s.turn=turn;const before=JSON.stringify(s),forecast=returnForecast(s);assert(forecast.title.includes('14턴'));assert.equal(JSON.stringify(s),before);if(!dragonDue(s))assert(forecast.text.includes('6턴 종료'));else assert(forecast.text.includes(breathPlan(s).hit?'현재 방에':'경로 밖'));}
});
test('object particles match the actual artifact name when escaping',()=>{
 for(const [name,p]of [['첫 불씨','를'],['달의 눈물','을'],['용의 기억','을'],['잊힌 왕관','을']]){
  assert.equal(objectParticle(name),p);const s=newRun({layout:'classic'});s.relic={name,value:18};assert(apply(s,{type:'interact'}).ok);assert(s.reason.includes(name+p+' 품고'));
 }
});
