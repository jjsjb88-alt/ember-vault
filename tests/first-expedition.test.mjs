import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,validSave} from '../dist/engine.js';
import {firstExpeditionGoal} from '../dist/first-expedition.js';

test('only an explicitly marked, still-playing first expedition gets a goal',()=>{
 const state=newRun({seed:42028});
 assert.equal(firstExpeditionGoal(state),null);
 for(const firstExpedition of [false,1,'true'])assert.equal(firstExpeditionGoal({...state,firstExpedition}),null);
 for(const phase of ['won','lost'])assert.equal(firstExpeditionGoal({...state,firstExpedition:true,phase}),null);
 assert.equal(firstExpeditionGoal(null),null);
});

test('the first real 20-room run and its saved copy retain the same one-relic goal',()=>{
 for(const role of ['rogue','knight','mage']){
  const state=newRun({seed:42028,role});state.firstExpedition=true;
  const before=structuredClone(state),goal=firstExpeditionGoal(state);
  assert.equal(state.rooms.length,20);assert.ok(validSave(state));
  assert.match(goal.title,/유물 하나/);assert.match(goal.detail,/B3.*달의 눈물/);assert.match(goal.note,/입구/);
  const restored=JSON.parse(JSON.stringify(state));assert.ok(validSave(restored));assert.deepEqual(firstExpeditionGoal(restored),goal);
  assert.deepEqual(state,before,'describing the goal does not change the live expedition');
 }
});

test('a held relic switches the goal to the real remaining return time',()=>{
 const state=newRun({seed:42028});state.firstExpedition=true;
 state.relic=structuredClone(state.rooms[10].relic);state.countdown=7;state.pos=10;
 const before=structuredClone(state),goal=firstExpeditionGoal(state);
 assert.match(goal.title,/입구/);assert.ok(goal.detail.includes(state.relic.name));assert.match(goal.detail,/7턴/);
 assert.deepEqual(state,before);
});

test('carrying a relic at the entrance explicitly asks for the exit action',()=>{
 const state=newRun({seed:42028});state.firstExpedition=true;
 state.relic=structuredClone(state.rooms[13].relic);state.countdown=3;state.pos=0;
 const goal=firstExpeditionGoal(state);
 assert.match(goal.title,/탈출/);assert.ok(goal.detail.includes(state.relic.name));assert.match(goal.detail,/「탈출」/);
 assert.equal(firstExpeditionGoal({...state,phase:'won'}),null);
});

test('the briefing does not inspect hidden rooms, enemy positions, or RNG',()=>{
 const state={firstExpedition:true,phase:'playing',pos:0,relic:null};
 Object.defineProperty(state,'rooms',{get(){throw new Error('hidden rooms must stay hidden');}});
 Object.defineProperty(state,'rng',{get(){throw new Error('the goal must not use game RNG');}});
 assert.ok(firstExpeditionGoal(state));
 state.relic={name:'달의 눈물',value:18};state.countdown=1;state.pos=10;
 assert.match(firstExpeditionGoal(state).detail,/1턴/);
});
