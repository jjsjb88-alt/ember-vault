import {newRun} from './engine.js?v=20261104g';

// 연습은 그림자 도적의 첫 금고 털이. 등불 속 불씨 '깜부기'가 옆에서 떠든다.
// talk = 이 행동을 하는 이유(대사), text = 무엇을 누르고 무엇이 일어나는가. 한 단계의 사고가 다음 단계의 이유가 된다.
export const TUTOR_NAME='깜부기';
export const TUTORIAL_STEPS=[
 {title:'창고부터 털자',talk:[['깜부기','주머니 텅 빈 거 알지? 저 창고부터 털자. 아무도 안 건드렸어. 내 불씨를 걸지.'],['도적','네 불씨, 원래 꺼져 가잖아.'],['깜부기','…그러니까 거는 거지.']],text:'금빛 「망각의 창고」를 누르세요. 이동력 1을 쓰고 발소리 3이 납니다.',action:'move',id:1,target:'.scene-exit[data-id="1"]'},
 {title:'상자를 여세요',talk:[['깜부기','오, 금화다! …잠깐, 경첩 녹슨 거 봐. 살살 열어. 살살.']],text:'상자 위 「열기」를 누르세요. 금화를 얻지만 녹슨 경첩이 크게 삐걱입니다.',action:'interact',target:'#sceneTarget'},
 {title:'누가 들었는지 보세요',talk:[['도적','…살살 열었는데.'],['깜부기','알아, 경첩이 문제지. 근데 저 소리, 꽤 멀리 갔어. 누가 들었나 봐 봐.']],text:'오른쪽 위 미니맵을 누르세요. 주황 칸까지 소리가 닿았고, 붉은 칸의 적이 들었습니다.',action:'panel',id:'sound',target:'#mapToggle'},
 {title:'저쪽에 돌을 던지세요',talk:[['깜부기','파수병이 들었네. 곧 이쪽으로 올 거야.'],['깜부기','저쪽 무기고에 돌 하나 던져 봐. 그쪽으로 고개 돌리게.']],text:'지도를 닫고 「유인」 → 「부서진 무기고」. 기술 1로 돌멩이를 던지면 들은 적이 턴 끝에 그쪽으로 갑니다. 대신 경계도 오릅니다.',action:'lure',id:5},
 {title:'지금이야, 뛰어!',talk:[['깜부기','됐다, 저쪽 봤어! 지금 저 방 뛰어서 지나가!'],['도적','뛰면 시끄럽잖아.'],['깜부기','그건 이따 생각해!']],text:'「이동 방식」에서 「질주」를 고르고 「파수병의 방」으로. 빠르지만 발소리가 커서 경계가 8을 넘습니다.',action:'move',id:2},
 {title:'다음 문제가 왔다',talk:[['깜부기','…바닥 울리는 거 느껴져? 파수병은 돌아섰고, 네 발소리 따라 맨 아래 그것도 올라와.'],['도적','남은 힘도 없는데.'],['깜부기','그럼 버텨. 내가 다시 깜빡일 때까지만.']],text:'「다음 턴」을 누르세요. 파수병의 반격과 용의 숨결 뒤 새 메달 5개가 열립니다. 방어는 둘 다 막아 주고, 쓰지 않은 자원은 사라집니다.',action:'end',target:'#endTurn'},
 {title:'파수병을 쓰러뜨리세요',talk:[['깜부기','돌멩이엔 두 번 안 속나 보네. 문 앞을 딱 막고 있어.'],['도적','그럼 뚫고 가야지.']],text:'파수병 위 「공격」을 누르세요. 적이 있는 방에서는 쓰러뜨리거나 왔던 길로만 나갈 수 있습니다.',action:'attack',target:'#sceneTarget'},
 {title:'흘린 기억을 챙기세요',talk:[['깜부기','쓰러지면서 뭔가 흘렸어. 저 사람이 평생 몸에 익힌 거야. 챙겨 둬.'],['도적','죽은 사람 걸 가져가도 돼?'],['깜부기','여기 두면 그냥 재가 돼.']],text:'능력 하나를 고르세요. 다음 턴부터 메달로 섞여 나옵니다. 이 밤은 회상이라 여기서 얻은 것은 실전에 이어지지 않습니다.',action:'reward',target:'.ability-choice'}
];
export const TUTORIAL_DONE=[['깜부기','첫날치곤 나쁘지 않았어. 유물은 구경도 못 했지만.'],['도적','다음엔 들고 나올 거야.'],['깜부기','그 말, 맨 아래 그것 앞에서도 할 수 있으면 인정.']];

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
 const s=newRun({seed:42028,role:'rogue'}),r=s.rooms[2];s.echo=null;// the lesson keeps the fixed breath
 r.name='파수병의 방';r.type='enemy';r.enemy={kind:'skeleton',name:'금고의 파수병',hp:2,maxHp:2,damage:1,gold:2,home:2,mode:'idle',target:null,memory:0,awareness:0,anchored:false};
 return s;
}
export function tutorialAllows(index,action){
 const step=TUTORIAL_STEPS[index];if(!step)return false;
 if(index===4&&action.type==='mode')return action.id==='rush';
 if(index===7&&action.type==='skipReward')return true;
 return action.type===step.action&&(step.id===undefined||step.id===action.id);
}
export function tutorialAdvance(index,action){
 return action.type!=='mode'&&tutorialAllows(index,action)?index+1:index;
}
