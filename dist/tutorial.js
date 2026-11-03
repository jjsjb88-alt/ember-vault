import {newRun} from './engine.js?v=20261104a';

// 연습은 그림자 도적의 첫 금고 털이. 등불 속 불씨 '깜부기'가 옆에서 떠든다.
// talk = 이 행동을 하는 이유(대사), text = 무엇을 누르고 무엇이 일어나는가. 한 단계의 사고가 다음 단계의 이유가 된다.
export const TUTOR_NAME='깜부기';
export const TUTORIAL_STEPS=[
 {title:'창고부터 털자',talk:[['깜부기','주머니가 텅텅이잖아. 저 창고, 아직 아무도 안 털었어. 내 불씨를 걸지.'],['도적','네 불씨, 원래 꺼져 가잖아.']],text:'금빛 「망각의 창고」를 누르세요. 이동력 1을 쓰고 발소리 3이 납니다.',action:'move',id:1,target:'.scene-exit[data-id="1"]'},
 {title:'상자를 여세요',talk:[['깜부기','금화다! …잠깐, 경첩 녹슨 거 보여? 살살, 아주 살살—']],text:'상자 위 「열기」를 누르세요. 금화를 얻지만 녹슨 경첩이 크게 삐걱입니다.',action:'interact',target:'#sceneTarget'},
 {title:'누가 들었는지 보세요',talk:[['도적','…살살이라며.'],['깜부기','경첩이 말을 안 들은 거지! 여긴 소리가 통로를 타고 퍼져. 누가 들었나 보자.']],text:'오른쪽 위 미니맵을 누르세요. 주황 칸까지 소리가 닿았고, 붉은 칸의 적이 들었습니다.',action:'panel',id:'sound',target:'#mapToggle'},
 {title:'저쪽에 돌을 던지세요',talk:[['깜부기','파수병이 들었네. 이쪽으로 온다. 돌멩이 하나, 반대편 무기고로. 고전이지만 고전엔 이유가 있어.']],text:'지도를 닫고 「유인」 → 「부서진 무기고」. 기술 1로 돌멩이를 던지면 들은 적이 턴 끝에 그쪽으로 갑니다. 대신 경계도 오릅니다.',action:'lure',id:5},
 {title:'지금이야, 뛰어!',talk:[['깜부기','고개 돌렸다! 저 방, 지금 질러가!'],['도적','뛰면 시끄럽다며?'],['깜부기','그건 다음 문제!']],text:'「이동 방식」에서 「질주」를 고르고 「파수병의 방」으로. 빠르지만 발소리가 커서 경계가 8을 넘습니다.',action:'move',id:2},
 {title:'다음 문제가 왔다',talk:[['깜부기','…바닥이 울려. 파수병은 돌아섰고, 아래층 용까지 깼어.'],['도적','힘도 다 썼는데?'],['깜부기','그럼 버텨. 방어 메달 꽉 쥐고.']],text:'「다음 턴」을 누르세요. 파수병의 반격과 용의 숨결 뒤 새 메달 5개가 열립니다. 방어는 둘 다 막아 주고, 쓰지 않은 자원은 사라집니다.',action:'end',target:'#endTurn'},
 {title:'파수병을 쓰러뜨리세요',talk:[['깜부기','돌멩이엔 한 번만 속는 타입이네. 문을 딱 막고 섰어.'],['도적','그럼 정면이지.']],text:'파수병 위 「공격」을 누르세요. 적이 있는 방에서는 쓰러뜨리거나 왔던 길로만 나갈 수 있습니다.',action:'attack',target:'#sceneTarget'},
 {title:'흘린 기억을 챙기세요',talk:[['깜부기','쓰러지면서 생전 솜씨를 흘렸어. 주워 담아. 주머니에선 메달이 되거든.'],['도적','도둑질 맞지?'],['깜부기','유산 상속이지.']],text:'능력 하나를 고르세요. 다음 턴부터 메달로 섞여 나옵니다. 이 밤은 회상이라 여기서 얻은 것은 실전에 이어지지 않습니다.',action:'reward',target:'.ability-choice'}
];
export const TUTORIAL_DONE=[['깜부기','첫날치곤 나쁘지 않네. 유물은 코빼기도 못 봤지만.'],['도적','다음엔 들고 나와.'],['깜부기','그 말, 용 앞에서도 해 봐.']];

// 연습 중 메달 추출 창 맨 위 한 줄: 추출도 행동이므로 이유를 말한다.
export const TUTORIAL_REVEALS={
 first:[['깜부기','봉인이 힘을 빌려준대. 메달 다섯 개. 아껴 써, 이자가 세.']],
 turn:[['깜부기','살았다! 봉인이 새 메달을 줬어. 남은 힘은 도로 가져갔지만. 구두쇠.']],
};
/** 대사 묶음을 HTML 한 덩어리로. */
export function talkHtml(lines,cls='coach-talk'){
 // 코치 상자 안은 블록(div), 추출 창의 <p> 안에서는 인라인(span)
 const tag=cls==='coach-talk'?'div':'span';
 return `<${tag} class="${cls}">${lines.map(([who,line])=>`<${tag} class="talk-line ${who===TUTOR_NAME?'tutor':'hero'}"><b>${who}</b> ${line}</${tag}>`).join('')}</${tag}>`;
}

export function createTutorialRun(){
 const s=newRun({seed:42028,role:'rogue'}),r=s.rooms[2];s.bag=null;s.clank=0;// the lesson keeps the fixed breath
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
