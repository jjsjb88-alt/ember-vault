import {newRun,moveCost,resolvePool,breathPlan,dragonDue,previewNoise} from './engine.js?v=20261107b';

// 연습은 그림자 도적의 첫 금고 털이. 등불 속 불씨 '깜부기'가 옆에서 떠든다.
// talk = 이 행동을 하는 이유(대사), text = 무엇을 누르고 무엇이 일어나는가. 한 단계의 사고가 다음 단계의 이유가 된다.
export const TUTOR_NAME='깜부기';
export const TUTORIAL_STEPS=[
 {key:'warehouse',chapter:'1 · 소리로 길 열기',title:'창고부터 털자',talk:[['깜부기','손도 풀렸으니 저 창고부터 보자. 돌아올 입구는 여기야.']],text:'금빛 「망각의 창고」를 누르세요. 깜부기가 깨운 기억들의 힘으로 첫 발을 뗍니다.',action:'move',id:1,target:'.scene-exit[data-id="1"]'},
 {key:'chest',title:'상자를 여세요',talk:[['깜부기','금화다! 경첩이 녹슬었으니까 천천히…'],['도적','이미 삐걱했어.']],text:'상자 위 「열기」를 누르세요. 금화와 함께 경계가 오르고 이 방에 메아리가 남습니다.',action:'interact',target:'#sceneTarget'},
 {key:'sound',observe:true,title:'소리가 남은 자리를 보세요',talk:[['깜부기','금화는 네 주머니에, 소리는 금고에 남았어. 어디까지 퍼졌는지 보자.']],text:'미니맵을 열어 주황빛과 방 옆 메아리 숫자를 보세요. 아직 멀리 있는 파수병은 듣지 못했습니다. 다 살펴본 뒤 「지도 확인 · 계속」을 누르세요.',action:'panel',id:'sound',target:'#mapToggle'},
 {key:'hush',title:'경계부터 낮추세요',talk:[['깜부기','더 소란을 피우기 전에 잠깐 가만히 있어. 다음엔 우리가 듣게 만들 차례야.']],text:'「숨죽이기」를 누르세요. 이동 1로 경계 −2, 은신 +2. 메아리 자체가 지워지지는 않습니다.',action:'hide',target:'#hideAction'},
 {key:'lure',title:'돌멩이로 길을 여세요',talk:[['깜부기','파편 회랑의 파수병을 옆 무기고로 부르자. 그 사이를 지나가는 거야.']],text:'「유인」 → 「부서진 무기고」. 기술 1로 돌멩이를 던집니다. 적은 즉시 움직이지 않고 턴 끝에 소리를 따라갑니다.',action:'lure',id:5},
 {key:'wait-lure',title:'움직일 때까지 기다리세요',talk:[['도적','아직 거기 서 있는데?'],['깜부기','서두르지 마. 우리가 조용히 기다려야 저쪽 소리를 따라가지.']],text:'「다음 턴」을 누르세요. 파수병이 파편 회랑에서 무기고로 이동합니다. 쓰지 않은 힘은 사라지고 새 메달이 열립니다.',action:'end',target:'#endTurn'},
 {key:'pass-junction',title:'정말 길이 열렸어요',autoTalk:true,titleHint:'유인 성공',talk:[['깜부기','갔다! 지도에서 파편 회랑이 빈 것 보이지? 이제 갈림목으로 가자.']],text:'「돌의 갈림목」으로 이동하세요. 유인한 적이 떠난 동안 다음 통로로 접근합니다.',action:'move',id:2,mode:'walk',target:'.scene-exit[data-id="2"]'},
 {key:'pass-guard',title:'비어 있는 회랑을 통과하세요',talk:[['깜부기','아까 그 녀석이 서 있던 자리야. 싸우지 않고 지나갈 수 있어.']],text:'「파편 회랑」으로 이동하세요. 적은 무기고에 있습니다. 파편을 밟는 소리는 다시 들을 수 있으니 여기서 멈추지 마세요.',action:'move',id:6,mode:'walk',target:'.scene-exit[data-id="6"]'},
 {key:'refuge',title:'추적하기 전에 한 방 더',talk:[['깜부기','발소리를 들었네. 돌아오기 전에 이끼 회랑으로 빠져나가자.']],text:'「이끼 회랑」으로 이동하세요. 적의 추적은 다음 턴에 일어납니다. 지금 열린 길을 끝까지 통과해 두세요.',action:'move',id:7,mode:'walk',target:'.scene-exit[data-id="7"]'},
 {key:'recruit',chapter:'2 · 새 능력으로 돌파',title:'녹스에게 불씨를 건네받으세요',talk:[['깜부기','뿔에 등불을 단 녀석이 보여? 기억 먹는 녹스야. 아직 주인을 기다리는 솜씨도 모아 둬.']],text:'「교역」에서 녹스를 만나 「불씨 화살」을 건네받으세요. 영입 비용은 기술 3. 식은 메달을 받아도 지금 손의 힘은 바로 늘지 않습니다.',action:'buy',card:'spark',target:'#marketToggle'},
 {key:'draw-recruit',title:'아직 식어 있는 화살',talk:[['도적','녹스가 쥐여 준 건 아직 차가워.'],['깜부기','저 사수도 오래 기다렸으니까. 네 다른 기억들 곁에 넣어 둬. 다음 불빛이 닿게.']],text:'「다음 턴」을 눌러 깜부기의 불빛을 기다리세요. 녹스가 건넨 식은 메달도 주머니의 기억들과 함께 다시 깨어납니다.',action:'end',target:'#endTurn'},
 {key:'approach',checkpoint:true,fastDraw:true,title:'마지막 화살이 네 손끝에',autoTalk:true,talk:[['도적','손끝이 뜨거워. 방금… 끊어진 다리 저편을 겨누고 있었어.'],['깜부기','그 사수는 마지막 사람이 건널 때까지 버텼대. 이번엔 네가 돌아갈 길을 열어.'],['도적','단검 끝에도 불씨가 붙었어. 저 문지기를 넘을 수 있겠군.']],text:'불씨 화살의 온기가 단검에 이어졌습니다. 공격 5를 확인하고 「이끼 서고」로 이동하세요.',action:'move',id:11,free:true},
 {key:'guardian',title:'금화와 귀환 길을 함께 보세요',talk:[['깜부기','서고 상자도 남아 있네. 열면 금화, 남겨 두면 돌아올 길이 조용해.'],['도적','돌아올 때도 이 방을 지날 수 있겠군.']],text:'상자는 선택입니다. 열면 금화와 메아리를 얻습니다. 「회상의 봉인실」로 이동해 수호자를 만나세요.',action:'move',id:10,free:true},
 {key:'attack',title:'빌려온 불씨로 길을 여세요',talk:[['깜부기','그 손끝의 온기를 놓치지 마. 누군가를 끝까지 지켰던 불씨야.']],text:'수호자 위 「공격」. 체력 5인 적을 단검 2 + 불씨 화살 3으로 쓰러뜨립니다. 적이 있는 방에서는 처치하거나 왔던 길로만 나갈 수 있습니다.',action:'attack',target:'#sceneTarget',free:true},
 {key:'reward',title:'쓰러진 적의 기억',talk:[['깜부기','갑옷 안에도 메달이 있었네. 이 문을 지키던 솜씨야. 데려가면 내 불빛으로 깨워 줄게.']],text:'보상 능력 하나를 고르거나 건너뛰세요. 받은 메달은 식은 기억들과 함께 주머니로 갑니다. 회상에서 얻은 것은 기존 탐험에 섞이지 않습니다.',action:'reward',target:'.ability-choice'},
 {key:'relic',chapter:'3 · 예보를 보고 귀환',autoTalk:true,title:'유물을 들면 귀환이 시작돼요',talk:[['깜부기','찾았다. 하지만 여기서 들고 있는 것만으론 네 보물이 아니야.'],['도적','입구까지 가져가야지.']],text:'「봉인 해제」로 첫 불씨를 회수하세요. 실제 14턴 귀환이 시작됩니다. 메아리는 더 오래 남고 3의 배수 턴에도 숨결이 옵니다.',action:'interact',target:'#sceneTarget',free:true},
 {key:'forecast',observe:true,title:'위험을 먼저 보고 고르세요',talk:[['깜부기','짧은 길엔 아까 그 파수병, 긴 길엔 이끼가 있어. 남긴 소리까지 보고 골라.']],text:'미니맵을 열어 숨결 예보와 적의 위치를 확인하세요. 귀환할 길을 생각한 뒤 「지도 확인 · 계속」을 누르세요.',action:'panel',id:'sound',target:'#mapToggle'},
 {key:'escape',title:'이번 귀환은 당신의 선택',talk:[['도적','빠르게 뚫을까, 조용히 돌아갈까.'],['깜부기','어느 쪽이든 유물과 네 두 발을 같이 데려와.']],text:'파편 회랑 지름길은 4칸, 이끼 우회로는 6칸입니다. 이동 방식·숨죽이기·전투·휴식을 골라 입구에서 「탈출」을 누르세요.',action:'escape',free:true,fastDraw:true}
];
export const TUTORIAL_DONE=[
 ['깜부기','유물도 챙겼고, 네 두 발로 돌아왔어. 이제 좀 도적 같네.'],
 ['도적','다음엔 더 아래로 내려갈 거야.'],
 ['깜부기','가도 돼. 대신 돌아올 길부터 열어 둬. 아래층 윈치가 그럴 때 쓰는 거야.']
];

// Shared world rule: medals are tangible keepsakes, not visions exclusive to the hero.
// Anyone carrying the lantern can borrow their stored skills. Each pulse lends temporary
// warmth; the metal and memory persist when that warmth fades. Cold medals wait for a
// later bag cycle, including Nox's purchases. No game rules or draw order are changed.
export const TUTORIAL_PROLOGUE=[
 ['깜부기','쉿. 발밑 조심.'],
 ['도적','아무도 없잖아.'],
 ['깜부기','금고가 듣고 있어. 여긴 발소리를 기억하거든.'],
 ['도적','네 등불 밑에 묶인 주머니… 안에서 메달들이 부딪쳐.'],
 ['깜부기','전에 이 길을 걷던 이들이 맡긴 솜씨야. 잠깐, 크게 깜빡여 볼게.'],
 ['도적','문양이 움직여. 따뜻해… 손이 저절로 단검을 고쳐 쥐었어.'],
 ['깜부기','불빛 안에선 누구나 볼 수 있어. 등불을 든 손에는 저들의 솜씨도 전해지지.'],
 ['도적','그럼 나보다 먼저 걸었던 사람들하고 같이 가는 거네.'],
 ['깜부기','그래. 온기가 가시기 전에 빌려 써. 식은 메달은 주머니에 모아 둬. 다시 깨워 줄 테니.'],
];
export const TUTORIAL_TURN=[
 ['깜부기','저쪽으로 간다. 길이 열렸어.'],
 ['도적','손의 온기가 빠졌어. 메달은 그대로인데.'],
 ['깜부기','빌린 힘만 식은 거야. 저 기억들까지 없어진 건 아니고.'],
 ['깜부기','식은 건 아래칸에 넣어 둬. 자, 다시 깜빡인다. 이번엔 누가 길을 빌려줄까.'],
];
export const TUTORIAL_REVEALS={first:TUTORIAL_PROLOGUE,turn:TUTORIAL_TURN};
/** 대사 묶음을 HTML 한 덩어리로. */
export function talkHtml(lines,cls='coach-talk'){
 // 코치 상자 안은 블록(div), 추출 창의 <p> 안에서는 인라인(span)
 const tag=cls==='coach-talk'?'div':'span';
 return `<${tag} class="${cls}">${lines.map(([who,line])=>`<${tag} class="talk-line ${who===TUTOR_NAME?'tutor':'hero'}"><b>${who}</b> ${line}</${tag}>`).join('')}</${tag}>`;
}

export function createTutorialRun(){
 const s=newRun({seed:42028,role:'rogue',layout:'classic'});
 // A small, fixed teaching bag. The normal engine shuffles/discards/draws every token;
 // insight's real extra draw guarantees slash + the newly bought spark in a six-token cycle.
 s.deck=[];s.discard=[];s.played=[];s.log=[];
 s.resource={move:1,sword:0,skill:0,block:0,quiet:0,rattle:0};
 resolvePool(s,['scout','step','slash','insight','sneak']);
 s.market=['spark','step','blade','sentinel'];
 s.edges=[[0,1],[1,2],[1,5],[5,6],[2,6],[6,7],[7,11],[6,10],[10,11],[2,3],[3,7]];
 s.rooms.forEach(room=>{room.enemy=null;room.seen=[0,1,6].includes(room.id);});
 Object.assign(s.rooms[2],{name:'돌의 갈림목',type:'enemy',terrain:'stone'});
 Object.assign(s.rooms[3],{name:'이끼 쉼터',type:'camp',terrain:'moss',used:false,lessonOptional:true});
 Object.assign(s.rooms[6],{name:'파편 회랑',type:'enemy',terrain:'shards',lessonReturn:'short',enemy:{kind:'skeleton',name:'금고의 파수병',hp:2,maxHp:2,damage:1,gold:2,home:6,mode:'idle',target:null,memory:0,awareness:0,anchored:false}});
 Object.assign(s.rooms[7],{name:'이끼 회랑',type:'enemy',terrain:'moss',host:'nox'});
 Object.assign(s.rooms[11],{name:'이끼 서고',type:'chest',terrain:'moss',used:false,lessonReturn:'quiet',lessonOptional:true});
 Object.assign(s.rooms[10],{name:'회상의 봉인실',type:'relic',terrain:'stone',used:false,relic:{name:'첫 불씨',value:18,icon:'crystal'},enemy:{kind:'sentinel',name:'봉인의 수호자',hp:5,maxHp:5,damage:1,gold:3,home:10,mode:'idle',target:null,memory:0,awareness:0,anchored:true}});
 return s;
}
const RETURN_ROOMS=[0,1,2,3,6,7,10,11];
export function tutorialAllows(index,action,state){
 const step=TUTORIAL_STEPS[index];if(!step)return false;
 if(step.observe&&action.type==='tutorialContinue')return action.id===step.key;
 if(step.mode&&action.type==='mode')return action.id===step.mode;
 if(step.action==='buy')return action.type==='buy'&&state?.market[action.index]===step.card;
 if(step.key==='reward')return ['reward','skipReward'].includes(action.type);
 if(step.free){
  if(action.type==='attack')return state?.rooms[state.pos].enemy?.hp>0;
  if(['reward','skipReward'].includes(action.type))return state?.pending?.type==='reward';
  if(['mode','hide','end'].includes(action.type))return true;
  if(step.key==='guardian'&&action.type==='interact')return state?.pos===11;
  if(step.key==='escape'){
   if(action.type==='lure')return true;
   if(action.type==='move')return RETURN_ROOMS.includes(action.id);
   if(action.type==='interact')return [0,3,11].includes(state?.pos);
   if(['attack','reward','skipReward'].includes(action.type))return true;
  }
 }
 return action.type===step.action&&(step.id===undefined||step.id===action.id)&&(!step.ids||step.ids.includes(action.id))&&(!step.mode||state?.mode===step.mode);
}
export function tutorialAdvance(index,action,state){
 const step=TUTORIAL_STEPS[index];if(!step)return index;
 if(step.observe)return action.type==='tutorialContinue'&&tutorialAllows(index,action,state)?index+1:index;
 if(step.key==='escape')return state?.phase==='won'&&action.type==='interact'?index+1:index;
 if(step.key==='attack')return action.type==='attack'&&state?.rooms[10].enemy?.hp===0&&state?.pending?.type==='reward'?index+1:index;
 if(step.key==='relic')return action.type==='interact'&&state?.relic?.name==='첫 불씨'?index+1:index;
 if(action.type!==step.action&&!(step.key==='reward'&&action.type==='skipReward'))return index;
 // The bought card is no longer in the market after apply; only the purchase action advances this guided step.
 if(step.action==='buy')return index+1;
 return tutorialAllows(index,action,state)?index+1:index;
}
export function tutorialChapter(index){
 let chapter=TUTORIAL_STEPS[0].chapter;
 for(const step of TUTORIAL_STEPS.slice(0,index+1))if(step.chapter)chapter=step.chapter;
 return chapter;
}
export function tutorialTargets(index,s,{mapOpen=false,returnHelp=false}={}){
 const step=TUTORIAL_STEPS[index];if(!step)return '';
 if(step.key==='escape'&&!returnHelp)return '';
 if(step.observe&&mapOpen)return `[data-act="tutorialContinue"][data-id="${step.key}"]`;
 const targets=ids=>ids.some(id=>s.resource.move>=moveCost(s,id))?ids.map(id=>`.scene-exit[data-id="${id}"]`).join(','):'#endTurn';
 if(step.free&&s.pending)return '.ability-choice';
 if(step.free&&s.rooms[s.pos].enemy?.hp>0)return s.resource.sword>0?'#sceneTarget':'#endTurn';
 if(step.key==='escape'){
  if(s.pending)return '.ability-choice';
  if(s.rooms[s.pos].enemy?.hp>0)return s.resource.sword>0?'#sceneTarget':'#endTurn';
  if(s.pos===0)return '#sceneTarget';
  return targets(({10:[6,11],11:[7],7:[3],3:[2],6:[2],2:[1],1:[0]})[s.pos]||[]);
 }
 if(step.action==='move')return targets(step.ids||[step.id]);
 return step.target||'';
}
export function tutorialMapLesson(index,s){
 const step=TUTORIAL_STEPS[index];if(!step?.observe)return null;
 const forecast=step.key==='forecast';
 return {key:step.key,title:forecast?'귀환 전 숨결 예보':'소리와 메아리 읽기',text:forecast?'예보와 적 위치를 보고 돌아갈 길을 생각해 보세요.':'주황빛은 퍼진 소리, 숫자는 남은 메아리예요.',continueLabel:'지도 확인 · 계속',count:`${index+1}/${TUTORIAL_STEPS.length}`};
}
export function tutorialActionReason(index,action,state){
 const step=TUTORIAL_STEPS[index];if(!step||tutorialAllows(index,action,state))return '';
 if(step.observe)return '먼저 지도를 살펴본 뒤 「지도 확인 · 계속」을 누르세요.';
 if(step.mode&&(action.type==='mode'||action.type==='move'))return `지금은 ${step.mode==='walk'?'걷기':step.mode==='sneak'?'은밀 이동':'질주'}로 열린 길을 지나가는 단계예요. 「이동 방식」에서 안내된 방식을 선택하세요.`;
 if(step.action==='buy')return '녹스가 맡긴 사수의 기억을 먼저 데려가세요. 「교역」에서 「불씨 화살」을 고르세요.';
 return tutorialHint(index,state);
}
export function tutorialHint(index,s,{returnHelp=false}={}){
 const step=TUTORIAL_STEPS[index];if(!step)return '';
 if(step.free&&s.pending)return '다가온 적의 보상을 고르거나 건너뛴 뒤 원래 목표를 계속하세요.';
 if(step.free&&step.key!=='escape'&&s.rooms[s.pos].enemy?.hp>0){
  const enemy=s.rooms[s.pos].enemy;
  return `현재 공격 ${s.resource.sword} · ${enemy.name} 체력 ${enemy.hp}. ${s.resource.sword>0?'공격해서 길을 여세요.':'다음 턴에 새 메달을 받을 수 있지만 적의 반격도 진행됩니다.'} 불씨 화살은 추출될 때 공격 +3을 더합니다.`;
 }
 if(step.key==='guardian'&&s.pos===11){
  if(s.rooms[11].used)return '상자는 이미 열었습니다. 「회상의 봉인실」로 이동해 수호자를 만나세요.';
  return `상자를 열면 금화 5~7·소리 ${previewNoise(s,3)}. 닫아 두면 추가 소리가 남지 않습니다. 선택한 뒤 「회상의 봉인실」로 이동하세요.`;
 }
 if(step.key==='forecast'){
  const plan=breathPlan(s),due=dragonDue(s),damage=Math.max(0,plan.damage-s.resource.block);
  return `미니맵을 여세요. ${due?(plan.hit?`지금 턴을 마치면 이 방에 숨결 피해 ${damage} 예상.`:'지금 턴을 마치면 숨결이 현재 방을 빗나갑니다.'):'지금은 숨결 발동 조건이 아닙니다.'} 예보를 읽고 「지도 확인 · 계속」을 누르세요.`;
 }
 if(step.key==='escape'){
  if(s.pending)return '전투 보상을 고르거나 건너뛴 뒤 귀환을 계속하세요.';
  if(s.rooms[s.pos].enemy?.hp>0)return s.resource.sword>0?'파수병이 길을 막았습니다. 「공격」으로 돌파하거나 들어온 방으로 후퇴하세요.':'공격이 소진되었습니다. 새 메달을 받으면 반격과 숨결도 진행됩니다. 위험하면 들어온 방으로 후퇴하세요.';
  if(s.pos===0)return '입구에 돌아왔습니다. 「탈출」을 눌러 유물과 함께 탐험을 마치세요.';
  if(!returnHelp)return `${s.relic?.name||'유물'}를 품고 입구로 돌아가 「탈출」하세요. 남은 ${s.countdown}턴. 위험은 소리 지도에서 살피고, 막히면 「도움 보기」를 누르세요.`;
  if(s.pos===10){
   const guard=s.rooms[6].enemy?.hp>0?'파수병이 있는':'적이 없는';
   return `${guard} 지름길은 4칸, 이끼 우회는 6칸. ${s.resource.move>=3?'「숨죽이기」와 걷기로 서고→이끼 회랑을 지나면 소리를 줄일 수 있어요. 방의 메아리도 확인하세요.':'남은 이동과 메아리를 보고 이동 방식·턴 종료를 고르세요.'}`;
  }
  const plan=breathPlan(s);
  if(dragonDue(s)&&plan.hit)return `지금 턴을 마치면 숨결 피해 ${Math.max(0,plan.damage-s.resource.block)} 예상. 메아리 없는 방으로 조용히 이동하거나 방어를 준비하세요. 입구에서 탈출해야 완료됩니다.`;
  if(dragonDue(s))return '현재 방은 숨결 경로 밖입니다. 「다음 턴」으로 새 힘을 받고 입구로 돌아가세요. 필요하면 이끼 쉼터에서 쉬어 갈 수 있습니다.';
 }
 return step.text;
}
