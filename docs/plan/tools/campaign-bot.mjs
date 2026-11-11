import {newRun,apply,CARDS,moveCost,moveStatus,stageOffers,stageStock,validSave} from '../../../dist/engine.js';
import {site} from '../../../dist/world.js';
import {KEEPSAKES,hasKeepsake,liftCost} from '../../../dist/content/keepsakes.js';
import {endDamage} from './risk-bots.mjs';
export function playCampaign(seed,{role='rogue',axis='stealth',heat=0,unlockedCards=null,unlockedKeepsakes=null,capture=false,policy='managed'}={}){
 const reckless=policy==='walk';const s=newRun({seed,role,layout:'staged',risk:true,campaign:true,heat,unlockedCards,unlockedKeepsakes}),actions=[],trace=[],acquisitions=[];let path=[...s.worldPaths[reckless?'quick':'quiet']],index=1,returning=false,backTo=null;const paidWait=[0,0,0];
 const score=id=>{if(reckless)return 0;const c=CARDS[id],e=c.e;return(c.axis===axis?9:0)+(e.sword||0)*(axis==='noise'?1.7:1)+(e.move||0)+(e.block||0)*.6+(e.draw||0)*1.2+Math.max(0,-(e.noise||0))*.6;};
 const artifactScore=id=>({ember:4,dragonscale:7,mistseal:7,waystone:6,copperward:4,mirrorheart:8,inklens:3,ironheart:3,echothread:4,emberedge:5,silentpurse:2,returnspindle:4,decoybell:axis==='echo'?6:2,memorycup:2,hollowkey:1,stalestone:1}[id]||0);
 const act=a=>{const recruited=a.type==='buy'?s.market[a.index]:(a.type==='reward'||a.type==='prepare'&&a.choice==='recruit')?a.id:null;const r=apply(s,a);if(!r.ok)throw Error(`${r.message} ${JSON.stringify(a)} @${s.pos}`);actions.push(a);if(recruited)acquisitions.push(recruited);if(!validSave(s))throw Error('Invalid campaign save after '+JSON.stringify(a));if(capture)trace.push(structuredClone(s));};
 function travel(to){for(const mode of reckless?['walk']:axis==='noise'?['walk','sneak']:['sneak','walk'])if(moveStatus(s,to,mode).allowed){if(s.mode!==mode)act({type:'mode',id:mode});act({type:'move',id:to});return true;}return false;}
 for(let loop=0;s.phase==='playing'&&loop<500&&actions.length<700;loop++){
  if(s.pending){if(s.pending.type==='reward'){const best=[...s.pending.options].sort((a,b)=>score(b)-score(a))[0];if(reckless||CARDS[best].axis===axis||score(best)>=6)act({type:'reward',id:best});else act({type:'skipReward'});}else if(s.pending.type==='keepsake'){act({type:'keepsake',id:[...s.pending.options].sort((a,b)=>artifactScore(b)-artifactScore(a))[0]});}else if(s.pending.type==='ending')act({type:'ending',id:['noise','ward','path'].includes(axis)?'remember':'seal'});continue;}
  const r=s.rooms[s.pos];
  if(!reckless&&s.hp<=s.maxHp-4&&s.provisions&&s.provisionTurn!==s.turn&&s.healingUsed<12){act({type:'provision'});continue;}
  if(r.enemy?.hp>0){if(s.resource.sword){act({type:'attack'});continue;}if(!reckless&&backTo===null&&s.from!==null&&endDamage(s)>1&&moveStatus(s,s.from,'walk').allowed){const target=s.pos;if(travel(s.from)){backTo=target;continue;}}act({type:'end'});continue;}
  if(backTo===s.pos)backTo=null;
  if(backTo!==null){if(s.resource.sword&&travel(backTo)){backTo=null;continue;}if(s.resource.move&&s.hideTurn!==s.turn&&s.resource.quiet<3){act({type:'hide'});continue;}act({type:'end'});continue;}
  if(r.type==='checkpoint'){
   const k=r.stage;if(s.stagePrepared[k]===null){act({type:'prepare',choice:'recruit',id:[...stageOffers(s,k)].sort((a,b)=>score(b)-score(a))[0]});continue;}
   if(!reckless&&!returning&&s.gold>=7&&!s.keepsakeTrades[k]&&s.keepsakes.length<3){const ids=s.artifactStock[k].filter(id=>!s.keepsakes.includes(id)).sort((a,b)=>artifactScore(b)-artifactScore(a));if(ids.length){act({type:'buyKeepsake',index:s.artifactStock[k].indexOf(ids[0])});continue;}}
   if(!reckless&&!returning&&!s.stageTrades[k]){const ids=[...s.market].filter(id=>CARDS[id].cost<=s.resource.skill).sort((a,b)=>score(b)-score(a));if(ids.length){act({type:'buy',index:s.market.indexOf(ids[0])});continue;}if(!paidWait[k]&&s.noise<5&&endDamage(s)===0){paidWait[k]++;act({type:'end'});continue;}}
   if(k===2&&!returning){const quiet=!reckless&&(s.keepsakes.includes('ember')||[...s.played,...s.deck,...s.discard].some(id=>CARDS[id].e.noise<0));path=path.slice(0,index);path.push(17,site(s,quiet?16:18),19);}
  }
  if(r.type==='chest'&&!r.used){act({type:'interact'});continue;}
  if(s.pos===site(s,14)&&!s.sluiceOpen){if(s.resource.skill)act({type:'sluice'});else act({type:'end'});continue;}
  if(s.pos===17&&!r.used){if(s.resource.skill>=liftCost(s))act({type:'interact'});else act({type:'end'});continue;}
  if(s.pos===site(s,16)&&!s.sealQuiet&&!returning){if(!r.used&&(s.hp<s.maxHp||s.noise)){act({type:'interact'});continue;}if(s.resource.quiet<3&&s.resource.move&&s.hideTurn!==s.turn){act({type:'hide'});continue;}if(s.resource.quiet>=3&&s.resource.skill>=2)act({type:'quietSeal'});else act({type:'end'});continue;}
  if(s.pos===19&&!s.relic){if(!reckless&&s.resource.move&&s.hideTurn!==s.turn&&s.resource.quiet<3){act({type:'hide'});continue;}act({type:'interact'});continue;}
  if(s.relic&&!returning){returning=true;path=[site(s,s.sealQuiet?16:18),17,5,site(s,1),0];index=0;}
  if(s.pos===0&&s.relic){act({type:'interact'});continue;}
  const to=path[index];if(to===undefined)throw Error('No campaign objective');
  if(!reckless&&s.rooms[to].enemy?.hp>0&&s.resource.sword&&s.resource.move>=moveCost(s,to,'walk')+1&&s.hideTurn!==s.turn&&s.resource.quiet<3){act({type:'hide'});continue;}
  if(travel(to)){index++;continue;}
  if(!reckless&&s.resource.move&&s.hideTurn!==s.turn&&(s.noise>=5||s.resource.quiet<2)){act({type:'hide'});continue;}
  act({type:'end'});
 }
 return {state:s,actions,trace,acquisitions,axis,role,seed,cutoff:s.phase==='playing'};
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
 const rows=[];for(const axis of ['stealth','noise','echo','ward','cycle','path']){let wins=0,totalTurns=0,cutoffs=0;for(let seed=1;seed<=60;seed++){const r=playCampaign(seed,{axis});if(r.state.phase==='won'){wins++;totalTurns+=r.state.turn;}if(r.cutoff)cutoffs++;}rows.push({axis,wins,of:60,meanWinTurns:wins?+(totalTurns/wins).toFixed(2):null,cutoffs});}console.log(JSON.stringify(rows,null,2));
}
