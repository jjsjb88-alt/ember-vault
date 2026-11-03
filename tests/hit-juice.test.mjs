import test from 'node:test';
import assert from 'node:assert/strict';
import {hitPlan,swingClock,swingDuration,inHitStop,shakeOffset,popScale,CONTACT_MS,SWING_MS} from '../dist/hit-juice.js';

test('heavier blows freeze longer and shake harder; a kill gets the impact frame',()=>{
 const light=hitPlan(2,false,6),heavy=hitPlan(5,false,12),kill=hitPlan(3,true,3);
 assert.ok(light.stop<heavy.stop&&heavy.stop<kill.stop);
 assert.ok(light.shake<heavy.shake&&heavy.shake<=kill.shake);
 assert.equal(light.fx,'spark');assert.equal(heavy.fx,'crit');assert.equal(kill.fx,'crit');
 assert.equal(light.frame,false);assert.equal(kill.frame,true);
 assert.ok(kill.stop<=200,'a freeze never drags past ~12 frames');
 assert.ok(hitPlan(99,true,99).shake<=22,'shake is capped');
});

test('the swing holds still on contact for exactly the hit-stop, then runs to its normal end',()=>{
 const p=hitPlan(5,false,10);
 assert.equal(swingDuration(p),SWING_MS+p.stop);
 assert.equal(swingClock(CONTACT_MS-1,p),CONTACT_MS-1);
 assert.equal(swingClock(CONTACT_MS+p.stop/2,p),CONTACT_MS);
 assert.ok(inHitStop(CONTACT_MS+1,p)&&!inHitStop(CONTACT_MS+p.stop,p));
 assert.equal(swingClock(swingDuration(p),p),SWING_MS);
 assert.equal(swingClock(100,null),100);
});

test('shake starts along the blow, is deterministic and settles to nothing',()=>{
 const p=hitPlan(4,false,8);
 const [x0]=shakeOffset(0,p,1);assert.ok(x0>0);
 assert.deepEqual(shakeOffset(90,p,7),shakeOffset(90,p,7));
 assert.deepEqual(shakeOffset(261,p,7),[0,0]);assert.deepEqual(shakeOffset(-5,p,7),[0,0]);
 for(let t=0;t<=260;t+=10){const[x,y]=shakeOffset(t,p,3);assert.ok(Math.abs(x)<=Math.ceil(p.shake)&&Math.abs(y)<=Math.ceil(p.shake));}
});

test('the damage number slams in big and settles at normal size',()=>{
 assert.ok(popScale(0)>1.5);assert.equal(popScale(500),1);assert.equal(popScale(-1),0);
});
