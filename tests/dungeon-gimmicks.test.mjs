import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,moveStatus,passagePreview,soundField,breathPlan,enemyTurn,validSave,neighbours,moveCost} from '../dist/engine.js';
import {hasGimmicks,worldPassageOpen,gimmickPassable} from '../dist/dungeon-gimmicks.js';
import {returnRoute} from '../dist/strategy.js';
import {roomInteraction,soundWavePlan} from '../dist/encounter.js';
import {exitAnchor,hitExit,mapPassage,passagePoint} from '../dist/scene-layout.js';
const fresh=()=>newRun({seed:731,layout:'staged'});
function prepared(s){s.stagePrepared=['recruit','recruit','recruit'];for(const id of [5,7,13])s.rooms[id].used=true;s.memory=3;return s;}
function at(id){const s=prepared(fresh());s.pos=id;s.resource={move:12,sword:0,skill:4,block:0,quiet:0,rattle:0};return s;}
function doIt(s,action){const r=apply(s,action);assert.equal(r.ok,true,r.message);return r;}
function unchangedFailure(s,action){const before=JSON.stringify(s);assert.equal(apply(s,action).ok,false);assert.equal(JSON.stringify(s),before);}
test('new staged maps opt into gimmicks; historical saves retain their original movement and draw',()=>{
 const modern=fresh(),old=newRun({seed:731,layout:'staged',gimmicks:false});assert(hasGimmicks(modern));assert(!hasGimmicks(old));
 for(const k of ['rng','deck','discard','played','resource'])assert.deepEqual(modern[k],old[k]);assert(validSave(modern));assert(validSave(old));
 old.pos=6;old.memory=1;old.stagePrepared[0]='recruit';old.rooms[5].used=true;old.resource.move=2;assert(moveStatus(old,7).allowed);
});
test('passage preview matches guard attack, defense, health, extra movement and actual noise without mutation',()=>{
 for(const [sword,block,quiet,rattle] of [[1,0,0,0],[0,1,1,2],[0,0,4,0]]){
  const s=at(6);Object.assign(s.resource,{sword,block,quiet,rattle});const before=JSON.stringify(s),p=passagePreview(s,7);
  assert.equal(JSON.stringify(s),before);assert.equal(p.cost,2);const hp=s.hp,mv=s.resource.move;doIt(s,{type:'move',id:7});
  assert.equal(s.hp,hp-p.damage);assert.equal(s.resource.sword,sword-p.attackSpent);assert.equal(s.resource.block,block-p.blockSpent);assert.equal(s.resource.move,mv-p.cost);assert.equal(s.lastSound.strength,p.noise);
 }
 const fatal=at(6);fatal.hp=1;doIt(fatal,{type:'move',id:7});assert.equal(fatal.phase,'lost');
});
test('crystal cave ends movement for that turn while its chest grants a permanent key and other actions remain possible',()=>{
 const s=at(6);s.rooms.forEach(r=>{if(r.enemy)r.enemy.anchored=true;});doIt(s,{type:'move',id:2});assert.equal(s.crystalStopTurn,s.turn);assert(s.resource.move>0);unchangedFailure(s,{type:'move',id:3});
 doIt(s,{type:'interact'});assert(s.hasKey&&s.rooms[2].used);doIt(s,{type:'hide'});assert(validSave(s));doIt(s,{type:'end'});assert(moveStatus(s,3).allowed||moveStatus(s,3).reason.includes('이동'));assert(!moveStatus(s,3).reason.startsWith('수정'));
});
test('key purchase is once, spends gold and needs a prepared checkpoint without consuming its trade allowance',()=>{
 const s=at(5);s.gold=8;doIt(s,{type:'buyKey'});assert.equal(s.gold,3);assert(s.hasKey);assert.equal(s.stageTrades[0],0);unchangedFailure(s,{type:'buyKey'});
 const away=at(6);away.gold=99;unchangedFailure(away,{type:'buyKey'});const waiting=fresh();waiting.pos=5;waiting.gold=99;unchangedFailure(waiting,{type:'buyKey'});
});
test('locked shortcut blocks traversal, thrown stones, sound, breath and pursuers until its first key crossing',()=>{
 const s=at(9);s.edges=[[9,13]];s.echo.fill(0);s.echo[9]=8;s.echo[13]=7;s.rooms[13].terrain='stone';
 unchangedFailure(s,{type:'move',id:13});unchangedFailure(s,{type:'lure',id:13});assert.equal(soundField(s,9,10).length,1);assert.deepEqual(breathPlan(s).path,[9]);
 const e=s.rooms[10].enemy;s.rooms[10].enemy=null;s.rooms[13].enemy=e;Object.assign(e,{target:9,memory:3,mode:'hunt'});enemyTurn(s);assert.equal(s.rooms[13].enemy,e);
 s.rooms[13].enemy=null;s.hasKey=true;doIt(s,{type:'move',id:13});assert(s.keyDoorOpen&&s.hasKey);assert.equal(soundField(s,9,10).length,2);assert.deepEqual(breathPlan(s).path,[9,13]);
 s.rooms[9].enemy=e;Object.assign(e,{target:13,memory:3,mode:'hunt'});enemyTurn(s);assert.equal(s.rooms[13].enemy,e);
});
test('a drop transmits sound both ways but moves enemies and players only forward until the actual sluice is opened',()=>{
 const s=at(15);s.edges=[[11,15]];assert(!moveStatus(s,11).allowed);assert.equal(soundField(s,15,9).length,2);
 const e=s.rooms[10].enemy;s.rooms[10].enemy=null;s.rooms[15].enemy=e;s.pos=0;Object.assign(e,{target:11,memory:3,mode:'hunt'});enemyTurn(s);assert.equal(s.rooms[15].enemy,e);
 s.rooms[15].enemy=null;s.rooms[11].enemy=e;Object.assign(e,{target:15,memory:3,mode:'hunt'});enemyTurn(s);assert.equal(s.rooms[15].enemy,e);
 s.rooms[15].enemy=null;s.pos=14;const skill=s.resource.skill;doIt(s,{type:'sluice'});assert(s.sluiceOpen);assert.equal(s.resource.skill,skill-1);assert.equal(s.lastSound.raw,5);unchangedFailure(s,{type:'sluice'});s.pos=15;assert(moveStatus(s,11).allowed);
});
test('pressure floor noise is avoidable by stance and previews include quiet and first-sound debt',()=>{
 for(const mode of ['walk','sneak','rush']){const s=at(10);s.rooms[10].enemy=null;s.mode=mode;s.resource.quiet=1;s.resource.rattle=2;const p=passagePreview(s,9);doIt(s,{type:'move',id:9});assert.equal(p.noise,s.lastSound.strength);assert.equal(s.lastSound.raw,mode==='sneak'?3:mode==='walk'?7:10);}
});
test('both deep entrances are physically sealed; defeating the original seal guard opens them even after pursuit',()=>{
 const s=at(15);assert(!moveStatus(s,19).allowed);assert(!worldPassageOpen(s,15,19));const e=s.rooms[18].enemy;s.rooms[18].enemy=null;s.rooms[15].enemy=e;s.resource.sword=8;doIt(s,{type:'attack'});assert(s.sealForce);assert(worldPassageOpen(s,15,19));doIt(s,{type:'skipReward'});assert(moveStatus(s,19).allowed);
});
test('quiet seal spends current skill and stealth once, emits no sound, and adds an actual secret corridor independently of rest',()=>{
 const s=at(16);s.resource.quiet=2;unchangedFailure(s,{type:'quietSeal'});doIt(s,{type:'hide'});const seq=s.soundSeq,rng=s.rng,skill=s.resource.skill,quiet=s.resource.quiet;s.resource.rattle=2;
 doIt(s,{type:'quietSeal'});assert(s.sealQuiet&&!s.sealForce);assert.equal(s.resource.skill,skill-2);assert.equal(s.resource.quiet,quiet-3);assert.equal(s.resource.rattle,2);assert.equal(s.rng,rng);assert.equal(s.soundSeq,seq);assert(neighbours(s).includes(19));assert.equal(soundField(s,16,8).some(x=>x.id===19),true);assert(validSave(s));unchangedFailure(s,{type:'quietSeal'});
 s.hp-=3;doIt(s,{type:'interact'});assert(s.rooms[16].used);assert.equal(roomInteraction(s).act,'conduit');assert(moveStatus(s,19).allowed);
 const rested=at(16);rested.hp-=4;doIt(rested,{type:'interact'});rested.resource.quiet=3;doIt(rested,{type:'quietSeal'});assert(validSave(rested));
});
test('new state validation rejects incomplete flags, impossible door state and a phantom secret edge but accepts old staged saves',()=>{
 const s=fresh();for(const patch of [{hasKey:undefined},{keyDoorOpen:true},{crystalStopTurn:2},{gimmicksVersion:2},{sealQuiet:true}])assert(!validSave({...s,...patch}));
 const phantom=structuredClone(s);phantom.edges.push([16,19]);assert(!validSave(phantom));assert(validSave(newRun({layout:'staged',gimmicks:false})));
});
test('return estimate obeys locks, drop direction and each future passage cost; secret map anchors match a real exit',()=>{
 const s=at(15);s.rooms.forEach(r=>r.seen=true);const closed=returnRoute(s);assert(!closed.path.includes(11)||closed.steps>2);assert(!closed.path.some((id,i)=>id===11&&closed.path[i-1]===15));
 s.sluiceOpen=true;const open=returnRoute(s);assert(open.path.some((id,i)=>id===11&&open.path[i-1]===15));
 assert.equal(open.cost,open.path.slice(1).reduce((sum,id,i)=>sum+moveCost(s,id,'walk',open.path[i]),0));
 s.pos=16;s.resource.quiet=3;doIt(s,{type:'quietSeal'});const anchor=exitAnchor(16,19);assert.equal(hitExit(16,neighbours(s),anchor.x,anchor.y),19);const path=mapPassage(16,19,360,300,{roomCount:20});assert(path.secret&&path.control);assert(passagePoint(path,.5).y<path.start.y);
});
test('sound animation never draws a sealed edge even when both ends are audible through an alternate route',()=>{
 const s=at(9);s.edges=[[9,13],[9,8],[8,13]];s.rooms[13].terrain='stone';const field=soundField(s,9,12),sound={strength:12,origin:9,field,heard:[]};const plan=soundWavePlan(s,sound);assert(!plan.edges.some(e=>[e.from,e.to].includes(9)&&[e.from,e.to].includes(13)));
});
