import {turnImpact} from './encounter.js?v=20261111b';
import {site} from './world.js?v=20261111b';
import {CARDS,dragonDue,breathPlan} from './engine.js?v=20261111b';
import {isStaged,stageIndex} from './expedition-stages.js?v=20261111b';
export function startFirstRun(s){
 if(!isStaged(s)||s.phase!=='playing')return;
 s.firstExpedition=true;
 s.firstRun??={version:1,enabled:true,memory:null,drawnTurn:0,used:false};
 s.firstRun.enabled=true;
}
// Observe committed actions only. Never draw, change resources or select a route.
export function recordFirstRun(before,action,s){
 const p=s.firstRun;if(!p?.enabled)return;
 if((action.type==='prepare'&&action.choice==='recruit')||action.type==='buy'){
  p.memory=action.type==='buy'?before.market[action.index]:action.id;p.drawnTurn=0;p.used=false;
 }
 if(action.type==='end'&&p.memory&&s.played.includes(p.memory))p.drawnTurn=s.turn;
 if(p.drawnTurn===s.turn&&p.memory){
  const e=CARDS[p.memory].e;
  if(action.type==='attack'&&e.sword&&before.resource.sword>s.resource.sword||action.type==='move'&&e.move&&before.resource.move>s.resource.move||e.noise<0&&before.resource.quiet>s.resource.quiet||e.block&&before.resource.block>s.resource.block)p.used=true;
 }
 if(stageIndex(s)>=2||stageIndex(s)>=1&&(p.used||!p.memory))p.enabled=false;
}
export function firstRunMemory(s){
 const p=s.firstRun;if(!p?.memory||p.drawnTurn!==s.turn||!s.played.includes(p.memory))return null;
 return {id:p.memory,source:'녹스에게 영입한 솜씨 · 이번 추출에서 공개',line:'차가웠던 문양에 다시 불빛이 닿았습니다. 아래 합계에 이 메달의 힘도 더해집니다.'};
}
export function firstRunGoal(s){
 if(!isStaged(s)||!s.firstRun?.enabled||s.phase!=='playing')return null;
 const r=s.rooms[s.pos],p=s.firstRun;
 if(s.relic)return {title:'유물을 입구까지',text:`회수로 끝나지 않습니다. ${s.countdown}턴 안에 무너진 입구에서 「탈출」하세요.`,hint:'소리 지도에서 지금 턴의 숨결과 귀환길을 확인하세요.'};
 if(s.pending)return {title:'얻은 기억을 고르세요',text:'마음에 드는 능력 하나를 받거나 건너뛰어 주머니를 가볍게 유지하세요.',hint:'보상은 지금 공격력을 바꾸지 않고 다음 주머니 순환에 합류합니다.'};
 if(r.enemy?.hp>0)return {title:s.resource.sword?'모은 공격으로 길 열기':'공격이 모자라면 다음 턴',text:`공격 ${s.resource.sword} · 적 체력 ${r.enemy.hp}. 공격은 적 위에서 합니다.`,hint:'남은 적은 턴 끝에 반격합니다. 위험하면 들어온 방으로 후퇴할 수 있어요.'};
 if(s.gimmicksVersion===1&&s.crystalStopTurn===s.turn)return {title:'수정이 울리는 동안',text:'이번 턴에는 더 걷지 못합니다. 상자를 열거나 숨죽인 뒤 다음 턴에 출발하세요.',hint:'힘과 주머니는 다음 턴에 새로 깨어납니다.'};
 if(r.type==='checkpoint'&&s.stagePrepared[r.stage]===null)return {title:'녹스에게 한 가지 준비',text:'새 기억·주머니 정리·보급 중 지금 필요한 것을 하나 고르세요.',hint:'영입은 식은 메달을 주머니에 넣는 일입니다. 이번 손의 힘은 바로 바뀌지 않아요.'};
 if(s.pos===0&&s.steps===0)return {title:'먼저 보급함을 열어볼까?',text:'금빛 「전초 보급함」을 눌러 가 보세요. 다른 길을 골라도 됩니다.',hint:'메달은 누르지 않아도 힘을 보탭니다. 이동력은 걸을 때 소비합니다.'};
 if(s.pos===site(s,1)&&!r.used)return {title:'보물은 상자 위에서',text:'「열기」를 눌러 보세요. 금화가 들어오지만 경첩 소리도 남습니다.',hint:'위쪽 경계 수치가 어떻게 바뀌는지 보세요.'};
 if(s.stagePrepared[0]===null)return {title:'금화는 어디에 쓸까?',text:'상층 정비소에서 녹스를 만나 보세요. 열쇠를 구입하거나 다음 길의 능력을 준비할 수 있어요.',hint:'정비소에 가기 전에도 전투·숨죽이기·유인을 자유롭게 시도할 수 있습니다.'};
 if(p.memory&&p.drawnTurn===s.turn)return {title:`${CARDS[p.memory].name}의 온기`,text:`이번 추출: ${CARDS[p.memory].text}. 지금 합계에 이미 더해졌습니다.`,hint:'남은 이동·공격을 써서 다음 길을 직접 골라 보세요.'};
 return {title:p.memory?'식은 메달을 기다리며':'첫 정비를 마쳤어요',text:p.memory?'새 기억은 주머니를 다시 섞을 때부터 나올 수 있어요. 다음 추출마다 어떤 힘이 열리는지 보세요.':'상층의 준비가 끝났습니다. 갈림길에서 다음 경로를 골라 보세요.',hint:'지금은 검문길과 수정고 중 선택할 수 있습니다. 메달을 기다리려고 안전한 방에서 턴을 넘겨도 됩니다.'};
}
export function actionReceipt(before,action,after){
 const noise=after.soundSeq!==before.soundSeq?after.lastSound?.strength:0;
 if(action.type==='attack'){
  const old=before.rooms[before.pos].enemy,foe=after.rooms[before.pos].enemy;
  return `공격 ${before.resource.sword} → ${after.resource.sword} · ${old.name} 체력 ${old.hp} → ${Math.max(0,foe?.hp||0)} · 소리 ${noise}`;
 }
 if(action.type==='move')return `이동력 ${before.resource.move} → ${after.resource.move} · 소리 ${noise} · 경계 ${before.noise} → ${after.noise}`;
 if(action.type==='interact'&&after.gold>before.gold)return `금화 +${after.gold-before.gold} · 소리 ${noise} · 경계 ${before.noise} → ${after.noise}`;
 if(action.type==='prepare'&&action.choice==='recruit')return `${CARDS[action.id].name} 영입 → 다음 주머니 순환에 합류 · 지금 합계는 그대로`;
 return '';
}
export function returnForecast(s){
 if(!s.relic||s.phase!=='playing')return null;
 const future=s.campaignVersion===1?turnImpact(s):null,due=future?.breathDue||dragonDue(s),plan=future?.breath||breathPlan(s);
 return {title:`귀환 ${s.countdown}턴 · 입구에서 탈출`,text:due?(plan.hit?`이번 턴 종료: 현재 방에 숨결 ${plan.damage} · 적 반격 후 남은 방어가 피해를 줄입니다.`:'이번 턴에는 숨결이 오지만 현재 방은 경로 밖입니다.'):`유물의 다음 주기 숨결은 ${s.turn+3-s.turn%3}턴 종료 때입니다. 소음 경계8에서도 숨결이 옵니다.`,hint:'메아리를 남기거나 이동하면 경로가 바뀝니다. 지도에서 확인하세요.'};
}
