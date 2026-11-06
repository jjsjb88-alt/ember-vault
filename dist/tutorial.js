import {newRun,moveCost} from './engine.js?v=20261106a';

// 연습은 그림자 도적의 첫 금고 털이. 등불 속 불씨 '깜부기'가 옆에서 떠든다.
// talk = 이 행동을 하는 이유(대사), text = 무엇을 누르고 무엇이 일어나는가. 한 단계의 사고가 다음 단계의 이유가 된다.
export const TUTOR_NAME='깜부기';
export const TUTORIAL_STEPS=[
 {title:'창고부터 털자',talk:[['깜부기','주머니 텅 빈 거 알지? 저 창고부터 털자. 아무도 안 건드렸어. 내 불씨를 걸지.'],['도적','네 불씨, 원래 꺼져 가잖아.'],['깜부기','…그러니까 거는 거지.']],text:'금빛 「망각의 창고」를 누르세요. 이동력 1을 쓰고 발소리 3이 납니다.',action:'move',id:1,target:'.scene-exit[data-id="1"]'},
 {title:'상자를 여세요',talk:[['깜부기','오, 금화다! …잠깐, 경첩 녹슨 거 봐. 살살 열어. 살살.']],text:'상자 위 「열기」를 누르세요. 금화를 얻지만 녹슨 경첩이 크게 삐걱입니다.',action:'interact',target:'#sceneTarget'},
 {title:'누가 들었는지 보세요',talk:[['도적','…살살 열었는데.'],['깜부기','알아, 경첩이 문제지. 근데 저 소리, 꽤 멀리 갔어. 누가 들었나 봐 봐.'],['깜부기','상자 자리에 불씨 남은 것도 보여? 금고가 기억하는 자리야.']],text:'오른쪽 위 미니맵을 누르세요. 주황 칸까지 소리가 닿았고 붉은 칸의 적이 들었습니다. 방 옆 숫자는 「메아리」: 소리를 낸 자리에 남고 턴마다 1씩 옅어집니다.',action:'panel',id:'sound',target:'#mapToggle'},
 {title:'저쪽에 돌을 던지세요',talk:[['깜부기','파수병이 들었네. 곧 이쪽으로 올 거야.'],['깜부기','저쪽 무기고에 돌 하나 던져 봐. 그쪽으로 고개 돌리게.'],['깜부기','돌 떨어진 자리에도 메아리가 남아. 나중에 쓸모 있을 거야.']],text:'지도를 닫고 「유인」 → 「부서진 무기고」. 기술 1로 돌멩이를 던지면 들은 적이 턴 끝에 그쪽으로 갑니다. 그 방에 메아리도 남고, 경계도 오릅니다.',action:'lure',id:5},
 {title:'지금이야, 뛰어!',talk:[['깜부기','됐다, 저쪽 봤어! 지금 저 방 뛰어서 지나가!'],['도적','뛰면 시끄럽잖아.'],['깜부기','그건 이따 생각해!']],text:'「이동 방식」에서 「질주」를 고르고 「파수병의 방」으로. 빠르지만 발소리가 커서 경계가 8을 넘습니다.',action:'move',id:2},
 {title:'다음 문제가 왔다',talk:[['깜부기','…바닥 울리는 거 느껴져? 파수병은 돌아섰고, 네 발소리 따라 맨 아래 그것도 올라와.'],['도적','남은 힘도 없는데.'],['깜부기','불길은 메아리를 타고 와. 버텨. 내가 다시 깜빡일 때까지만.']],text:'「다음 턴」을 누르세요. 경계 8 이상이면 시간이 멈추고, 숨결이 가장 진한 메아리에서 이어진 메아리를 따라 번집니다. 내 방에 메아리가 있으면 닿습니다. 방어가 반격과 숨결을 막고, 쓰지 않은 자원은 사라집니다.',action:'end',target:'#endTurn'},
 {title:'파수병을 쓰러뜨리세요',talk:[['깜부기','돌멩이엔 두 번 안 속나 보네. 문 앞을 딱 막고 있어.'],['도적','그럼 뚫고 가야지.']],text:'파수병 위 「공격」을 누르세요. 적이 있는 방에서는 쓰러뜨리거나 왔던 길로만 나갈 수 있습니다.',action:'attack',target:'#sceneTarget'},
 {title:'흘린 기억을 챙기세요',talk:[['깜부기','쓰러지면서 뭔가 흘렸어. 저 사람이 평생 몸에 익힌 거야. 챙겨 둬.'],['도적','죽은 사람 걸 가져가도 돼?'],['깜부기','여기 두면 그냥 재가 돼.']],text:'능력 하나를 고르세요. 주머니를 다시 섞을 때부터 뽑힐 수 있습니다. 이 밤은 회상이라 여기서 얻은 것은 실전에 이어지지 않습니다.',action:'reward',target:'.ability-choice'},
 {title:'아직 식지 않은 기억',talk:[['깜부기','기술 남았지? 교역소 가 보자.'],['도적','여기서 누가 장사를 해?'],['깜부기','장사는 아니고. 덜 식은 기억이 모여 있어. 기술로 손 내밀면 따라와.']],text:'「교역」을 열고 기술로 능력 하나를 영입하세요. 기술도 턴이 끝나면 사라지니 남기지 마세요. 영입한 능력은 주머니를 다시 섞을 때 들어옵니다.',action:'buy',target:'#marketToggle'},
 {title:'숨을 죽이세요',talk:[['깜부기','방금 싸운 소리, 이 방에 메아리로 남았어.'],['도적','그럼 빨리 나가야지.'],['깜부기','아니, 움직이면 또 울려. 그 자리에서 숨 죽여. 경계부터 내리자.']],text:'「숨죽이기」를 누르세요. 이동 1로 경계 −2, 은신 +2. 다음 소리를 흡수할 준비가 됩니다.',action:'hide',target:'#hideAction'},
 {title:'이번 길은 당신이 고르세요',talk:[['깜부기','왼쪽엔 이끼와 모닥불, 오른쪽엔 깨진 돌과 금화. 둘 다 봉인실로 이어져.'],['도적','어느 쪽이 맞는데?'],['깜부기','살아 돌아오면 맞는 길이지. 발밑과 남은 힘을 봐.']],text:'「이끼 쉼터」는 조용한 회복 길, 「파편 보물고」는 시끄러운 보물 길. 두 방의 소리를 비교하고 하나를 고르세요.',action:'move',ids:[3,6]},
 {title:'쉴지, 챙길지, 그냥 갈지',talk:[['깜부기','방에 뭐가 있다고 전부 건드릴 필요는 없어. 돌아갈 힘도 남겨.']],text:'필요하면 방의 물체를 사용하고, 「회상의 봉인실」로 이동하세요. 이동력이 부족하면 다음 턴으로 넘깁니다.',action:'move',id:7},
 {title:'유물은 시작이지, 끝이 아니에요',talk:[['깜부기','드디어 찾았다. 그런데 저걸 들면 금고도 널 놓아주지 않을 거야.'],['도적','왔던 길 기억해. 들고 나가자.']],text:'「봉인 해제」로 유물을 회수하세요. 14턴 귀환이 시작되고 메아리가 더 오래 남습니다.',action:'interact',target:'#sceneTarget'},
 {title:'유물을 품고 입구로',talk:[['깜부기','이제 욕심은 그만. 메아리를 피해 입구로 돌아가!'],['도적','이번엔 걸어 나간다.']],text:'지도에서 왔던 길을 확인하고 입구로 돌아가 「탈출」을 누르세요. 힘이 부족하면 다음 턴, 시끄러우면 은밀 이동이나 숨죽이기.',action:'escape'}
];
export const TUTORIAL_DONE=[
 ['깜부기','유물도 챙겼고, 네 두 발로 돌아왔어. 이제 좀 도적 같네.'],
 ['도적','다음엔 더 아래로 내려갈 거야.'],
 ['깜부기','가도 돼. 대신 돌아올 길부터 열어 둬. 아래층 윈치가 그럴 때 쓰는 거야.']
];

// 설정(대사로 직접 설명하지 않는다): 금고는 발소리를 기억한다. 시끄럽게 걸은 자리에 메아리가 남고, 맨 아래의 '그것'이
// 그 메아리를 따라 올라온다(보스 정체는 열어 둔다). 등불 속 잿불 깜부기가 한 번 크게 깜빡일 때마다(= 한 턴) 그 불빛에
// 이곳에 묻힌 사람들의 기억이 메달로 떠오른다. 불빛이 다시 잦아들면 쓰지 않은 기억은 식어서 재가 된다.
export const TUTORIAL_PROLOGUE=[
 ['깜부기','쉿. 발밑 조심.'],
 ['도적','아무도 없잖아.'],
 ['깜부기','금고가 듣고 있어. 여긴 발소리를 기억하거든.'],
 ['도적','…그래서, 어두워서 아무것도 안 보이는데.'],
 ['깜부기','잠깐만. 크게 한 번 깜빡여 볼게.'],
 ['도적','…바닥에서 뭐가 떠올라. 메달?'],
 ['깜부기','주워 봐. 따뜻하지?'],
 ['도적','누가 방금까지 쥐고 있던 것 같아.'],
 ['깜부기','여기 묻힌 사람들 기억이야. 내 불빛에만 떠올라. 내가 다시 깜빡이기 전에 다 써. 남기면 식어서 재 돼.'],
];
export const TUTORIAL_TURN=[
 ['깜부기','휴… 살았다.'],
 ['깜부기','자, 다시 깜빡인다. 또 떠오른다.'],
 ['도적','아까 남겨 둔 건… 진짜 재가 됐네.'],
 ['깜부기','거봐, 남기지 말랬잖아.'],
];
export const TUTORIAL_REVEALS={first:TUTORIAL_PROLOGUE,turn:TUTORIAL_TURN};
/** 대사 묶음을 HTML 한 덩어리로. */
export function talkHtml(lines,cls='coach-talk'){
 // 코치 상자 안은 블록(div), 추출 창의 <p> 안에서는 인라인(span)
 const tag=cls==='coach-talk'?'div':'span';
 return `<${tag} class="${cls}">${lines.map(([who,line])=>`<${tag} class="talk-line ${who===TUTOR_NAME?'tutor':'hero'}"><b>${who}</b> ${line}</${tag}>`).join('')}</${tag}>`;
}

export function createTutorialRun(){
 const s=newRun({seed:42028,role:'rogue',layout:'classic'}),r=s.rooms[2];
 // An isolated practice route uses the real engine, including noise, loot and the escape clock.
 // It never changes the player's saved expedition.
 s.edges=[[0,1],[1,2],[1,5],[2,3],[2,6],[3,7],[6,7]];
 s.rooms.forEach(room=>{room.enemy=null;room.seen=[0,1].includes(room.id);});
 r.name='파수병의 방';r.type='enemy';r.enemy={kind:'skeleton',name:'금고의 파수병',hp:2,maxHp:2,damage:1,gold:2,home:2,mode:'idle',target:null,memory:0,awareness:0,anchored:false};
 Object.assign(s.rooms[3],{name:'이끼 쉼터',type:'camp',terrain:'moss',used:false});
 Object.assign(s.rooms[6],{name:'파편 보물고',type:'chest',terrain:'shards',used:false});
 Object.assign(s.rooms[7],{name:'회상의 봉인실',type:'relic',terrain:'stone',used:false,relic:{name:'첫 불씨',value:18,icon:'crystal'}});
 return s;
}
export function tutorialAllows(index,action,state){
 const step=TUTORIAL_STEPS[index];if(!step)return false;
 if(index===4&&action.type==='mode')return action.id==='rush';
 if(index===7&&action.type==='skipReward')return true;
 if(index>=10){
  if(['mode','hide','end'].includes(action.type))return true;
  if(index===11&&action.type==='interact')return [3,6].includes(state?.pos);
  if(index===13){
   if(action.type==='move')return [0,1,2,3,6,7].includes(action.id);
   if(action.type==='interact')return [0,3,6].includes(state?.pos);
  }
 }
 return action.type===step.action&&(step.id===undefined||step.id===action.id)&&(!step.ids||step.ids.includes(action.id));
}
export function tutorialAdvance(index,action,state){
 const step=TUTORIAL_STEPS[index];if(!step)return index;
 if(index===13)return state?.phase==='won'&&action.type==='interact'?index+1:index;
 if(action.type!==step.action&&!(index===7&&action.type==='skipReward'))return index;
 return tutorialAllows(index,action,state)?index+1:index;
}

export function tutorialChapter(index){return index<4?'1 · 힘과 소리':index<10?'2 · 위기 다루기':'3 · 선택과 귀환';}
export function tutorialTargets(index,s){
 const targets=ids=>ids.some(id=>s.resource.move>=moveCost(s,id))?ids.map(id=>`.scene-exit[data-id="${id}"]`).join(','):'#endTurn';
 if(index===10)return targets([3,6]);
 if(index===11)return targets([7]);
 if(index===13){
  if(s.pos===0)return '#sceneTarget';
  const next={7:[3,6],3:[2],6:[2],2:[1],1:[0]}[s.pos]||[];
  return targets(next);
 }
 return TUTORIAL_STEPS[index]?.target||'';
}
