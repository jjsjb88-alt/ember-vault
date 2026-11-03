import test from 'node:test';
import assert from 'node:assert/strict';
import {TUTORIAL_STEPS,TUTORIAL_REVEALS} from '../dist/tutorial.js';

test('every practice step gives an in-world reason (story) and the control (text)',()=>{
 assert.equal(TUTORIAL_STEPS.length,8);
 for(const s of TUTORIAL_STEPS){
  assert.ok(s.title&&s.story&&s.text,s.title);
  assert.ok(s.story.length>=20&&s.story.length<=90,`story fits the coach on a 320px-high screen: ${s.title}`);
  assert.ok(!/연습|실전에서는/.test(s.story),`story stays in the world, not about the tutorial: ${s.title}`);
 }
});

test('both medal draws in the practice explain why they happen',()=>{
 assert.ok(TUTORIAL_REVEALS.first.length>20&&TUTORIAL_REVEALS.turn.length>20);
});
