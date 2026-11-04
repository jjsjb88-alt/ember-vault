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
test('the prologue shows why medals fall each breath without lecturing',()=>{
 assert.ok(ok(TUTORIAL_PROLOGUE)&&ok(TUTORIAL_TURN)&&ok(TUTORIAL_DONE));
 const pro=TUTORIAL_PROLOGUE.map(x=>x[1]).join(' '),turn=TUTORIAL_TURN.map(x=>x[1]).join(' ');
 for(const w of ['숨','메달','따뜻','다음 숨'])assert.ok(pro.includes(w),w);
 assert.ok(/떨어진다/.test(turn)&&/재/.test(turn),'the next breath drops new medals and turns the unused to ash');
 // 설명조 금지: 자원 이름을 나열하거나 규칙을 숫자로 말하지 않는다
 for(const [,line] of [...TUTORIAL_PROLOGUE,...TUTORIAL_TURN]){
  const named=['공격','이동','기술','방어'].filter(w=>line.includes(w)).length;
  assert.ok(named<2,`no resource list in dialogue: ${line}`);
  assert.ok(!/[0-9]|다섯 개|한 턴|매 턴/.test(line),`no rule numbers in dialogue: ${line}`);
 }
});
test('cutscenes play in the order they were queued; typing time grows with the line',()=>{
 const q=makeQueue();q.push('a');q.push('b');assert.equal(q.next(),'a');assert.equal(q.next(),'b');assert.equal(q.next(),null);
 assert.ok(typeDuration('가나다라')>typeDuration('가'));assert.ok(typeDuration('x'.repeat(70))<2500,'a full line types in under 2.5 s');
});
