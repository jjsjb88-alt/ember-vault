import {CARDS,MODES,TERRAINS,validSave} from './engine.js?v=20261107a';
import {TUTORIAL_STEPS} from './tutorial.js?v=20261107a';

// Separate from the real expedition and its best score. Bump the scenario when
// a lesson change makes an old position/resource/checkpoint unsafe to resume.
export const TUTORIAL_SAVE_KEY='ember-vault-tutorial-progress-v1';
const VERSION=1,SCENARIO='first-ember-2',MAX_CHARS=2_000_000;
const signature=()=>TUTORIAL_STEPS.map(step=>step.key).join('|');
const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const text=(x,max=240)=>typeof x==='string'&&x.length<=max;
const int=(x,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const num=(x,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isFinite(x)&&x>=min&&x<=max;
const bool=x=>typeof x==='boolean';
const list=(x,check,max=10000)=>Array.isArray(x)&&x.length<=max&&x.every(check);
const id=x=>int(x,0,15);
const nullableId=x=>x===null||id(x);
const card=x=>typeof x==='string'&&Object.hasOwn(CARDS,x);
const cards=x=>list(x,card);
const roomTypes=new Set(['entry','chest','enemy','camp','merchant','shrine','relic']);
const resource=x=>obj(x)&&['move','sword','skill','block','quiet','rattle'].every(k=>num(x[k]));
const relic=x=>obj(x)&&text(x.name)&&num(x.value)&&text(x.icon);
const enemy=x=>x===null||obj(x)&&text(x.name)&&text(x.kind)&&num(x.hp)&&num(x.maxHp,1)&&x.hp<=x.maxHp&&num(x.damage)&&num(x.gold)&&id(x.home)&&['idle','listen','investigate','hunt'].includes(x.mode)&&nullableId(x.target)&&int(x.memory)&&num(x.awareness)&&bool(x.anchored);

function stateShape(s){
 if(!validSave(s)||!Object.hasOwn(MODES,s.mode)||!['hand','deck','discard','played','market'].every(k=>cards(s[k]))||s.rooms.length!==16||s.role!=='rogue'||!int(s.turn,1)||!int(s.seed,0,0xffffffff)||!int(s.rng,0,0xffffffff))return false;
 if(!nullableId(s.from)||!num(s.maxHp,1)||!num(s.hp,0,s.maxHp)||!num(s.gold)||!num(s.noise,0,12)||!resource(s.poolTotal))return false;
 if(!['soundSeq','noiseMade','hideTurn','lureTurn','kills','purchases','refreshTurn','steps'].every(k=>int(s[k]))||!bool(s.hidden)||!int(s.memory,0,3))return false;
 if(!list(s.echo,n=>num(n,0,9),16)||s.echo.length!==16||!list(s.pursuits,p=>obj(p)&&id(p.from)&&id(p.to)))return false;
 if(!s.rooms.every(r=>text(r.name)&&roomTypes.has(r.type)&&Object.hasOwn(TERRAINS,r.terrain)&&bool(r.seen)&&bool(r.visited)&&bool(r.used)&&enemy(r.enemy)&&(r.type==='relic'?relic(r.relic):r.relic===undefined||relic(r.relic))))return false;
 if(s.relic!==null&&!relic(s.relic)||s.countdown!==null&&!int(s.countdown,0,14)||!!s.relic!==(s.countdown!==null))return false;
 if(!list(s.log,l=>obj(l)&&int(l.turn,1,s.turn)&&text(l.message,2000)&&text(l.tone)))return false;
 if(s.pending!==null&&!(obj(s.pending)&&s.pending.type==='reward'&&cards(s.pending.options)&&s.pending.options.length>0))return false;
 if(s.phase==='playing'&&(s.hp<=0||s.countdown===0))return false;
 if(s.phase!=='playing'&&(!text(s.reason,2000)||!num(s.score)||s.pending!==null))return false;
 if(s.phase==='won'&&(!s.relic||s.pos!==0||s.hp<=0))return false;
 if(s.lastSound!==null){
  const n=s.lastSound;
  if(!obj(n)||!int(n.seq)||!id(n.origin)||!num(n.strength,0,12)||!num(n.raw)||!num(n.gear)||!num(n.absorbed)||!text(n.label)||!int(n.turn,1,s.turn)||!list(n.field,p=>obj(p)&&id(p.id)&&num(p.level))||!list(n.heard,p=>obj(p)&&id(p.id)&&num(p.level)&&text(p.name)))return false;
 }
 if(s.attack!==undefined&&s.attack!==null){
  const a=s.attack;
  if(!obj(a)||!['noise','relic'].includes(a.cause)||!nullableId(a.start)||!list(a.path,id,16)||!num(a.reach)||!bool(a.hit)||!num(a.damage)||!num(a.echo)||!list(a.echoes,n=>num(n,0,9),16)||a.echoes.length!==16||!id(a.pos)||!num(a.beforeHp)||!num(a.afterHp)||!num(a.taken)||!num(a.blocked))return false;
 }
 return true;
}
const room=r=>obj(r)&&id(r.id)&&text(r.name)&&text(r.type)&&[null,'safe','risky'].includes(r.route)&&[null,'short','quiet'].includes(r.returnRoute)&&bool(r.optional);
const outcome=o=>obj(o)&&int(o.turn,1)&&num(o.hp)&&num(o.gold)&&num(o.score);
function journalShape(j,s){
 if(!obj(j)||j.version!==1||!int(j.retryCount)||!obj(j.initial)||!int(j.initial.turn,1,s.turn)||!id(j.initial.pos)||!num(j.initial.hp)||!num(j.initial.gold))return false;
 if(!['actionCount','returnEnds','damageTaken','healed'].every(k=>int(j[k])))return false;
 const turn=x=>int(x,1,s.turn),event=x=>obj(x)&&turn(x.turn);
 if(!list(j.outboundPath,room)||!j.outboundPath.length||!list(j.returnPath,room))return false;
 if(!list(j.moves,x=>event(x)&&id(x.from)&&id(x.to)&&bool(x.returning)&&room(x.room)&&x.room.id===x.to&&bool(x.guarded)))return false;
 if(!list(j.lures,x=>event(x)&&id(x.origin)&&id(x.target)&&int(x.seq)&&list(x.listeners,l=>obj(l)&&text(l.key)&&id(l.room)&&text(l.name))&&list(x.displacements,d=>event(d)&&id(d.from)&&id(d.to)&&text(d.name)&&bool(d.clear))))return false;
 const lureIndex=x=>int(x,0,j.lures.length-1);
 if(!obj(j.signals)||!Object.entries(j.signals).every(([k,v])=>text(k)&&lureIndex(v)))return false;
 if(!list(j.vacancies,x=>event(x)&&lureIndex(x.lure)&&id(x.room)&&id(x.to)&&text(x.enemy)&&bool(x.closed)&&bool(x.entered)))return false;
 if(!list(j.bypasses,x=>event(x)&&room(x.room)&&lureIndex(x.lure)&&text(x.enemy)))return false;
 if(!list(j.purchases,x=>event(x)&&card(x.id)&&text(x.name)&&int(x.index,0,3)))return false;
 if(!list(j.draws,x=>event(x)&&cards(x.played)&&cards(x.bought)&&x.bought.every(c=>x.played.includes(c))))return false;
 if(!list(j.combats,x=>event(x)&&id(x.room)&&text(x.name)&&num(x.damage)&&bool(x.kill)&&bool(x.returning)&&cards(x.bought)))return false;
 if(!list(j.interactions,x=>event(x)&&room(x.room)&&bool(x.returning)&&num(x.healed)&&num(x.gold)&&num(x.noiseReduced)))return false;
 if(!list(j.relics,x=>event(x)&&id(x.room)&&text(x.name)&&num(x.value)))return false;
 if(j.relicTurn!==null&&!turn(j.relicTurn))return false;
 if(!!s.relic!==(j.relicTurn!==null))return false;
 if(!list(j.breaths,x=>event(x)&&id(x.room)&&bool(x.hit)&&num(x.taken)&&num(x.healthLost)&&num(x.blocked)&&nullableId(x.start)&&list(x.path,id,16)))return false;
 if(s.phase==='won')return outcome(j.escaped)&&j.escaped.turn===s.turn&&j.escaped.hp===s.hp&&j.escaped.gold===s.gold&&j.escaped.score===s.score;
 return j.escaped===null;
}
function lessonState(p){
 if(!obj(p)||!int(p.index,0,TUTORIAL_STEPS.length)||!stateShape(p.state)||!journalShape(p.journal,p.state))return false;
 const s=p.state,step=TUTORIAL_STEPS[p.index],relicIndex=TUTORIAL_STEPS.findIndex(x=>x.key==='relic');
 const connected=(a,b)=>s.edges.some(edge=>edge.includes(a)&&edge.includes(b));let lastRoom=0;
 for(const goal of TUTORIAL_STEPS){
  if(goal.action==='lure'&&Number.isInteger(goal.id)&&!connected(lastRoom,goal.id))return false;
  if(goal.action==='move'&&Number.isInteger(goal.id)){if(!connected(lastRoom,goal.id))return false;lastRoom=goal.id;}
 }
 // Required interactions must still be executable in the rooms reached by the lesson.
 for(const [i,goal]of TUTORIAL_STEPS.entries())if(['chest','relic'].includes(goal.key)){
  const destination=TUTORIAL_STEPS.slice(0,i).findLast(x=>x.action==='move'&&Number.isInteger(x.id))?.id;
  if(s.rooms[destination]?.type!==goal.key)return false;
 }
 if(p.index===TUTORIAL_STEPS.length)return s.phase==='won';
 if(s.phase==='won')return false;
 if(step.key!=='escape'){
  const lastMove=TUTORIAL_STEPS.slice(0,p.index).findLast(x=>x.action==='move'&&Number.isInteger(x.id));
  if(s.pos!==(lastMove?.id??0))return false;
 }
 if(relicIndex>=0&&!!s.relic!==(p.index>relicIndex))return false;
 if(s.phase==='playing'){
  if(step.action==='reward'&&s.pending?.type!=='reward')return false;
  if(s.pending&&!step.free&&step.action!=='reward')return false;
  if(step.action==='attack'&&!(s.rooms[s.pos].enemy?.hp>0))return false;
 }
 return true;
}
function checkpointValue(checkpoint){
 if(checkpoint===null||checkpoint===undefined)return null;
 return typeof checkpoint==='string'?JSON.parse(checkpoint):checkpoint;
}
/** Validate the committed state AND its already advanced lesson index. */
export function validTutorialProgress(p){
 try{
  if(!lessonState(p)||p.feedback!==undefined&&!text(p.feedback,500)||p.mapOpen!==undefined&&!bool(p.mapOpen)||p.paused!==undefined&&!bool(p.paused)||Object.hasOwn(p,'returnHelp')&&!bool(p.returnHelp)||Object.hasOwn(p,'returnHelpUsed')&&!bool(p.returnHelpUsed))return false;
  const cp=checkpointValue(p.checkpoint),firstCheckpoint=TUTORIAL_STEPS.findIndex(step=>step.checkpoint);
  if(!cp)return firstCheckpoint<0||p.index<firstCheckpoint;
  return lessonState(cp)&&TUTORIAL_STEPS[cp.index]?.checkpoint===true&&cp.state.phase==='playing'&&cp.index<=p.index&&cp.state.turn<=p.state.turn&&cp.journal.actionCount<=p.journal.actionCount;
 }catch{return false;}
}
function snapshot(p){
 // An absent flag identifies an older guided return. Do not silently turn it into
 // a new independent attempt when loading a previously started expedition.
 return {state:p.state,index:p.index,journal:p.journal,checkpoint:p.checkpoint==null?null:typeof p.checkpoint==='string'?p.checkpoint:JSON.stringify(p.checkpoint),feedback:p.feedback||'',mapOpen:p.mapOpen??false,paused:p.paused??false,...(Object.hasOwn(p,'returnHelp')?{returnHelp:p.returnHelp}:{}),...(Object.hasOwn(p,'returnHelpUsed')?{returnHelpUsed:p.returnHelpUsed}:{})};
}
export function clearTutorialProgress(storage){
 try{storage.removeItem(TUTORIAL_SAVE_KEY);return true;}catch{return false;}
}
/** Never reads or writes the main expedition, best score, or seen marker. */
export function saveTutorialProgress(storage,progress){
 try{
  if(!validTutorialProgress(progress))return {ok:false,reason:'invalid'};
  const value=JSON.stringify({version:VERSION,scenario:SCENARIO,steps:signature(),step:TUTORIAL_STEPS[progress.index]?.key||'complete',progress:snapshot(progress)});
  if(value.length>MAX_CHARS)return {ok:false,reason:'invalid'};
  try{storage.setItem(TUTORIAL_SAVE_KEY,value);return {ok:true};}catch{return {ok:false,reason:'unavailable'};}
 }catch{return {ok:false,reason:'invalid'};}
}
export function loadTutorialProgress(storage){
 let value;
 try{value=storage.getItem(TUTORIAL_SAVE_KEY);}catch{return {status:'unavailable',progress:null};}
 if(value===null||value===undefined)return {status:'missing',progress:null};
 try{
  if(typeof value!=='string'||value.length>MAX_CHARS)throw new Error('invalid');
  const data=JSON.parse(value),p=data?.progress;
  if(data.version!==VERSION||data.scenario!==SCENARIO||data.steps!==signature()||!validTutorialProgress(p)||data.step!==(TUTORIAL_STEPS[p.index]?.key||'complete'))throw new Error('invalid');
  return {status:'loaded',progress:snapshot(p)};
 }catch{clearTutorialProgress(storage);return {status:'invalid',progress:null};}
}
