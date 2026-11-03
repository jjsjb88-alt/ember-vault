import test from 'node:test';
import assert from 'node:assert/strict';
import {TUTORIAL_STEPS,TUTORIAL_REVEALS,TUTORIAL_DONE,talkHtml,TUTOR_NAME} from '../dist/tutorial.js';

const chars=talk=>talk.reduce((n,[who,line])=>n+who.length+line.length+1,0);
test('every practice step has a reason told as dialogue, plus the control text',()=>{
 assert.equal(TUTORIAL_STEPS.length,8);
 for(const s of TUTORIAL_STEPS){
  assert.ok(s.title&&s.text&&Array.isArray(s.talk)&&s.talk.length,s.title);
  assert.ok(s.talk.some(([who])=>who===TUTOR_NAME),`${TUTOR_NAME} speaks in every step: ${s.title}`);
  assert.ok(chars(s.talk)<=100,`dialogue fits the coach on a 320px-high screen: ${s.title} (${chars(s.talk)})`);
  for(const [,line] of s.talk)assert.ok(!/연습|튜토리얼/.test(line),`dialogue stays in the world: ${s.title}`);
 }
});
test('medal draws and the ending are voiced too, and render as speaker lines',()=>{
 for(const t of [TUTORIAL_REVEALS.first,TUTORIAL_REVEALS.turn,TUTORIAL_DONE])assert.ok(t.length&&chars(t)<=100);
 const html=talkHtml([[TUTOR_NAME,'a'],['도적','b']]);
 assert.match(html,/talk-line tutor"><b>깜부기<\/b> a/);assert.match(html,/talk-line hero"><b>도적<\/b> b/);
});
