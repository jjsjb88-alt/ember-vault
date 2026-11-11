import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,apply,validSave,emitNoise,enemyTurn,resolvePool,breathPlan,echoFadeEvery,breathReach,previewNoise,CARDS,ROLES,stageOffers} from '../dist/engine.js';
import {site,worldSignature,structuralRoutes} from '../dist/world.js';
import {EXTRA_CARDS,AXES} from '../dist/content/memories.js';
import {ENEMIES} from '../dist/content/enemies.js';
import {KEEPSAKES,lureRaw,liftCost,liftRaw,provisionRaw} from '../dist/content/keepsakes.js';
import {freshProfile,unlocks,settleProfile,validProfile} from '../dist/progression.js';
import {noxChapter,endingStory} from '../dist/campaign-story.js';
import {lureForecast} from '../dist/strategy.js';
import {conduitMarkup} from '../dist/gimmick-presentation.js';
import {turnImpact} from '../dist/encounter.js';
import {buildRevealPlan} from '../dist/pool-reveal.js';
import {playCampaign} from '../docs/plan/tools/campaign-bot.mjs';
const run=(seed=1,opts={})=>newRun({seed,layout:'staged',risk:true,campaign:true,...opts});
const inert=s=>{for(const r of s.rooms)r.enemy=null;};
const bare=s=>{s.resource={move:0,sword:0,skill:0,block:0,quiet:0,rattle:0};s.played=[];s.deck=[];s.discard=[];};

test('200 seeded worlds vary room order, preserve both routes and remain connected after collapse',()=>{
 const signatures=new Set(),orders=new Map();
 for(let seed=1;seed<=200;seed++){
  const s=run(seed);assert.ok(validSave(s));assert.deepEqual(s,run(seed));signatures.add(worldSignature(s));
  const key=s.worldPaths.quiet.join(',');orders.set(key,(orders.get(key)||0)+1);
  assert.equal(new Set(s.rooms.map(r=>r.biome).filter(Boolean)).size,3);
  assert.ok(s.worldPaths.quiet.includes(site(s,2)));assert.ok(!s.worldPaths.quick.includes(site(s,2)));
  assert.ok(structuralRoutes(s).all);s.blockedEdges.push([...s.fragileEdge]);assert.ok(structuralRoutes(s).all);assert.ok(validSave(JSON.parse(JSON.stringify(s))));
 }
 assert.ok(signatures.size>=150);assert.ok(Math.max(...orders.values())/200<=.2);
});
test('biomes double or absorb echoes and loud sound collapses only an optional shortcut',()=>{
 for(const biome of ['resonant','absorb']){const s=run();bare(s);const id=s.rooms.find(r=>r.biome===biome).id;emitNoise(s,id,4,'test',false);assert.equal(s.echo[id],biome==='resonant'?4:0);}
 const s=run();emitNoise(s,site(s,10),9,'test',false);assert.equal(s.blockedEdges.length,1);assert.ok(structuralRoutes(s).all);
 const protectedRun=run(1,{startingKeepsake:'stalestone'});emitNoise(protectedRun,site(protectedRun,10),9,'test',false);assert.equal(protectedRun.blockedEdges.length,0);assert.ok(protectedRun.collapseSaved);emitNoise(protectedRun,site(protectedRun,10),9,'test',false);assert.equal(protectedRun.blockedEdges.length,1);
});
test('60 medals, ten enemy rules and sixteen persistent artifacts are defined',()=>{assert.equal(Object.keys(CARDS).length,60);assert.equal(Object.keys(EXTRA_CARDS).length,36);assert.equal(Object.keys(ENEMIES).length,10);assert.equal(Object.keys(KEEPSAKES).length,16);for(const axis of AXES)assert.equal(Object.values(EXTRA_CARDS).filter(c=>c.axis===axis).length,6);});
test('conditional attack/skill use current alert and actual reveal ledger, without replaying drawn cards',()=>{
 const s=run();bare(s);s.noise=12;resolvePool(s,['thunder','brassdeal']);assert.equal(s.resource.sword,8);assert.equal(s.resource.skill,6);assert.equal(s.drawEffects[0].delta.sword,8);assert.equal(s.drawEffects[1].delta.skill,6);const snapshot=JSON.stringify(s),plan=buildRevealPlan(s);assert.equal(plan.steps.at(-1).totals.sword,8);assert.equal(plan.steps.at(-1).totals.skill,6);assert.equal(plan.base.sword,0);assert.equal(JSON.stringify(s),snapshot);
 bare(s);s.deck=['step','guard'];resolvePool(s,['archive']);assert.deepEqual(s.played,['archive','guard','step']);assert.equal(s.deck.length,0);assert.equal(s.resource.move,2);
});
test('echo manipulation transfers only through open real passages, and trim leaves active medals intact',()=>{
 const s=run();bare(s);s.from=site(s,1);s.pos=5;s.echo[5]=7;resolvePool(s,['memoryriver','echojar']);assert.equal(s.echo[5],1);assert.equal(s.echo[s.from],3);assert.equal(s.resource.block,5);
 bare(s);s.from=19;s.pos=0;s.echo[0]=4;resolvePool(s,['farvoice']);assert.equal(s.echo[19],0);
 s.discard=['slash','guard'];resolvePool(s,['farewell']);assert.deepEqual(s.discard,['guard']);assert.ok(s.played.includes('farewell'));
});
test('all five professions have a distinct active opening and persistent starting rule',()=>{
 const starters=new Set(),artifacts=new Set();for(const role of Object.keys(ROLES)){const s=run(9,{role});assert.ok(validSave(s));starters.add(s.played.join(':'));artifacts.add(s.keepsakes[0]);}assert.equal(starters.size,5);assert.equal(artifacts.size,5);
});
test('per-turn artifacts change resources, and single-use breath protection is spent by the real hit',()=>{
 const fields={ember:'quiet',waystone:'move',inklens:'skill',copperward:'block',emberedge:'sword'};
 for(const [id,field]of Object.entries(fields)){const s=run(1,{startingKeepsake:id});inert(s);s.deck=Array(5).fill('focus');s.discard=[];s.noise=0;assert.ok(apply(s,{type:'end'}).ok);const base=field==='move'?1:field==='skill'?10:0;assert.equal(s.resource[field],base+1);}
 const s=run(2,{startingKeepsake:'mirrorheart'});inert(s);s.echo[0]=9;s.noise=12;s.resource.block=0;const hp=s.hp;assert.equal(breathPlan(s).damage,0);apply(s,{type:'end'});assert.equal(s.hp,hp);assert.equal(s.mirrorSpent,true);s.echo[0]=9;s.noise=12;assert.ok(breathPlan(s).damage>0);
 const scaled=run(2,{startingKeepsake:'dragonscale'});scaled.echo[0]=9;const unscaled=structuredClone(scaled);unscaled.keepsakes=[];assert.equal(breathPlan(unscaled).damage-breathPlan(scaled).damage,2);
});
test('artifacts affect lure, lifting, recovery budget, key and echo timing',()=>{
 const s=run();s.keepsakes=['decoybell','returnspindle','silentpurse'];assert.equal(lureRaw(s),7);assert.equal(liftCost(s),2);assert.equal(liftRaw(s),6);assert.equal(provisionRaw(s),0);
 s.keepsakes=['mistseal'];s.resource.rattle=0;s.resource.quiet=0;assert.equal(previewNoise(s,4),3);assert.equal(emitNoise(s,0,4,'test').strength,3);
 const key=run(1,{startingKeepsake:'hollowkey'});assert.equal(key.hasKey,true);assert.equal(run(1,{startingKeepsake:'ironheart'}).maxHp,25);
 s.memory=3;s.keepsakes=['echothread'];assert.equal(echoFadeEvery(s),3);s.keepsakes=[];assert.equal(echoFadeEvery(s),4);s.heat=10;assert.ok(breathReach(s)>=6);
 s.pos=site(s,16);s.rooms[s.pos].used=false;s.hp=1;s.healingUsed=11;s.keepsakes=['memorycup'];assert.ok(apply(s,{type:'interact'}).ok);assert.equal(s.healingUsed,12);assert.equal(s.hp,2);
});
function enemyFixture(kind){const s=run();inert(s);bare(s);const home=site(s,1);s.pos=0;s.rooms[home].enemy={kind,sense:ENEMIES[kind].sense,name:kind,hp:10,maxHp:10,damage:1,gold:1,home,mode:'idle',target:null,memory:0,awareness:0,anchored:false};return {s,home,e:s.rooms[home].enemy};}
test('sight, echo and quiet sensing ignore generic sound and acquire their own cues',()=>{
 for(const kind of ['deaf','echohound','moth']){const {s,e}=enemyFixture(kind);emitNoise(s,0,5,'test',false);assert.equal(e.target,null);s.echo.fill(0);if(kind==='echohound')s.echo[0]=6;if(kind==='moth')s.resource.quiet=3;enemyTurn(s);assert.equal(e.target,0);}
 const {s,e}=enemyFixture('bellrunner');emitNoise(s,0,3,'test',false);assert.equal(e.target,null);emitNoise(s,0,9,'test',false);assert.equal(e.target,0);
});
test('drummer creates real sound, priest drains stealth and choir restores only adjacent allies',()=>{
 const d=enemyFixture('drummer');enemyTurn(d.s);assert.equal(d.s.lastSound.label,'뼈 북지기의 북소리');assert.ok(d.s.echo[d.home]>0);
 const p=enemyFixture('hushpriest');p.s.pos=p.home;p.s.resource.quiet=4;enemyTurn(p.s);assert.equal(p.s.resource.quiet,2);
 const c=enemyFixture('choir');c.e.anchored=true;c.s.rooms[0].enemy={...c.e,kind:'skeleton',home:0,hp:5};enemyTurn(c.s);assert.equal(c.s.rooms[0].enemy.hp,6);
});
test('thirty settled expeditions unlock all medals, professions and new tenth-run dialogue once',()=>{
 const p=freshProfile(),initial=noxChapter(p);assert.equal(new Set(unlocks(p).cards.map(id=>CARDS[id].axis)).size,6);for(let n=1;n<=30;n++){const s=run(n);s.runId='settle-'+n;s.phase='lost';assert.ok(settleProfile(p,s).changed);assert.equal(settleProfile(p,s).changed,false);if(n===10){assert.notDeepEqual(noxChapter(p),initial);assert.ok(unlocks(p).roles.includes('cantor'));}if(n===29)assert.ok(unlocks(p).cards.length<36);}
 assert.equal(p.runs,30);assert.equal(unlocks(p).cards.length,36);assert.equal(unlocks(p).keepsakes.length,16);assert.equal(unlocks(p).roles.length,5);assert.ok(validProfile(p));
 for(let n=0;n<10;n++){const s=run(n+100,{heat:n});s.phase='won';s.ending=n%2?'remember':'seal';s.runId='win-'+n;settleProfile(p,s);}assert.equal(p.maxHeat,10);assert.deepEqual([...p.endings].sort(),['remember','seal']);assert.notDeepEqual(endingStory('seal'),endingStory('remember'));
});
test('campaign metadata corruption is rejected and legacy runs retain original rules',()=>{
 for(const key of ['worldSites','availableCards','availableKeepsakes','stageStock','artifactStock','keepsakeTrades']){const s=run();s[key]=null;assert.equal(validSave(s),false,key);}
 const legacy=newRun({seed:12,layout:'staged',risk:true});assert.equal(legacy.campaignVersion,undefined);assert.equal(legacy.worldVersion,undefined);assert.ok(validSave(legacy));assert.deepEqual(stageOffers(legacy,0),['spark','scout','silence']);
});
test('six build policies win through normal engine actions and both endings survive save/load',()=>{
 const endings=new Set(),builds=new Set();for(const axis of AXES){let winner;for(let seed=1;seed<=6;seed++){const r=playCampaign(seed,{axis});if(r.state.phase==='won'){winner=r;break;}}assert.ok(winner,axis);assert.ok(validSave(JSON.parse(JSON.stringify(winner.state))));endings.add(winner.state.ending);builds.add(winner.state.played.concat(winner.state.deck,winner.state.discard).sort().join(','));assert.ok(winner.actions.some(a=>a.type==='prepare'));assert.ok(winner.actions.some(a=>a.type==='ending'));}assert.equal(endings.size,2);assert.ok(builds.size>=5);
});
test('role offers favor unlocked role memories and heat increases combat and memory pressure',()=>{for(const role of Object.keys(ROLES)){const s=run(11,{role});assert.ok(s.roleMemories.length>=6);for(let i=0;i<3;i++){const eligible=s.roleMemories.filter(id=>i===0?CARDS[id].cost<=4:i===1?CARDS[id].cost>=3&&CARDS[id].cost<=5:CARDS[id].cost>=4);if(eligible.length)assert.ok(s.stageOffers[i].some(id=>s.roleMemories.includes(id)));}}
 const base=run(20),hot=run(20,{heat:10});assert.ok(hot.rooms[19].enemy.hp>base.rooms[19].enemy.hp);assert.ok(hot.rooms[19].enemy.damage>base.rooms[19].enemy.damage);assert.ok(echoFadeEvery(hot)>echoFadeEvery(base));assert.ok(breathReach(hot)>breathReach(base));
});

test('lure preview includes the bell artifact and predicts a runner crossing two real passages',()=>{const s=run();inert(s);bare(s);s.keepsakes=['decoybell'];s.noise=5;s.pos=site(s,4);s.resource.skill=3;s.rooms.forEach(r=>r.seen=true);s.rooms[5].enemy={kind:'bellrunner',sense:'loud',name:'runner',hp:5,maxHp:5,damage:1,gold:1,home:5,mode:'idle',target:null,memory:0,awareness:0,anchored:false};const before=JSON.stringify(s),forecast=lureForecast(s,0);assert.equal(JSON.stringify(s),before);assert.equal(forecast.noise,7);assert.ok(forecast.ok);apply(s,{type:'lure',id:0});assert.equal(s.lastSound.strength,forecast.noise);enemyTurn(s);assert.equal(s.pursuits.length,2);assert.equal(s.rooms[0].enemy.kind,'bellrunner');assert.equal(forecast.moves[0].to,0);});
test('a drummer can trigger the coming breath; preview and committed enemy phase agree',()=>{const {s}=enemyFixture('drummer');s.noise=7;s.echo[0]=9;s.resource.block=0;const before=JSON.stringify(s),forecast=turnImpact(s);assert.equal(JSON.stringify(s),before);assert.equal(forecast.breathDue,'noise');assert.ok(forecast.breath.hit);apply(s,{type:'end'});assert.equal(s.attack.damage,forecast.breath.damage);assert.equal(s.hp,Math.max(0,forecast.afterHp-forecast.breath.damage));});

test('campaign creation enables its required risk rules and accepts a starter-only artifact pool',()=>{const s=newRun({seed:7,layout:'staged',campaign:true,unlockedCards:[],unlockedKeepsakes:[]});assert.equal(s.riskVersion,1);assert.ok(validSave(s));assert.equal(s.artifactStock[0].length,1);});

test('rest preview includes the healing artifact and stays within the shared cap',()=>{const s=run();s.keepsakes=['memorycup'];s.pos=site(s,16);s.hp=1;assert.match(conduitMarkup(s),/체력 \+4/);apply(s,{type:'interact'});assert.equal(s.hp,5);assert.equal(s.healingUsed,4);});
