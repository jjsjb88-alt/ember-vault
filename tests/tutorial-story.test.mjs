import test from 'node:test';
import assert from 'node:assert/strict';
import {TUTORIAL_STEPS,TUTORIAL_PROLOGUE,TUTORIAL_TURN,TUTORIAL_DONE,TUTOR_NAME} from '../dist/tutorial.js';
import {makeQueue,typeDuration} from '../dist/cutscene.js';

const ok=talk=>Array.isArray(talk)&&talk.length&&talk.every(([who,line])=>who&&line&&!/연습|튜토리얼/.test(line));
test('every practice step has a reason told as dialogue and a control line',()=>{
 assert.equal(TUTORIAL_STEPS.length,8);
 for(const s of TUTORIAL_STEPS){
  assert.ok(s.title&&s.text&&ok(s.talk),s.title);
  assert.ok(s.talk.some(([who])=>who===TUTOR_NAME),`${TUTOR_NAME} speaks: ${s.title}`);
  for(const [,line] of s.talk)assert.ok(line.length<=70,`one cutscene line stays short: ${line}`);
 }
});
test('the prologue explains why five medals open every turn, in the world',()=>{
 assert.ok(ok(TUTORIAL_PROLOGUE)&&ok(TUTORIAL_TURN)&&ok(TUTORIAL_DONE));
 const all=TUTORIAL_PROLOGUE.map(x=>x[1]).join(' ');
 for(const word of ['용','숨','봉인','메달 다섯','공격','이동','기술','방어','삼켜'])assert.ok(all.includes(word),word);
 assert.ok(TUTORIAL_TURN.map(x=>x[1]).join(' ').includes('메달'));
});
test('cutscenes play in the order they were queued; typing time grows with the line',()=>{
 const q=makeQueue();q.push('a');q.push('b');assert.equal(q.next(),'a');assert.equal(q.next(),'b');assert.equal(q.next(),null);
 assert.ok(typeDuration('가나다라')>typeDuration('가'));assert.ok(typeDuration('x'.repeat(70))<2500,'a full line types in under 2.5 s');
});
