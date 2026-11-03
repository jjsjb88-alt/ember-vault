import {newRun} from './engine.js';

// 연습은 그림자 도적이 처음 금고에 숨어든 밤의 회상이다. 모든 단계는 "왜 지금 이걸 하는가"(story)와
// "무엇을 누르고 무엇이 일어나는가"(text)를 함께 말한다. 한 단계의 결과가 다음 단계의 이유가 된다.
export const TUTORIAL_STEPS=[
 {title:'창고부터 뒤지세요',story:'빈손으로 내려왔습니다. 깊이 가려면 쓸 금화가 필요하고, 입구 옆 창고는 아직 아무도 털지 않았습니다.',text:'금빛 「망각의 창고」를 누르세요. 이동력 1을 쓰고 발소리 3이 납니다.',action:'move',id:1,target:'.scene-exit[data-id="1"]'},
 {title:'상자를 여세요',story:'왕국이 무너진 날 그대로 잠긴 상자. 안의 금화면 쉼터에서 물약을 살 수 있습니다.',text:'상자 위 「열기」를 누르세요. 금화를 얻지만 녹슨 경첩이 크게 삐걱입니다.',action:'interact',target:'#sceneTarget'},
 {title:'누가 들었는지 보세요',story:'경첩 소리가 통로를 타고 번졌습니다. 이 금고에서 소리는 벽이 아니라 길을 따라 흐릅니다. 누가 들었는지부터 알아야 합니다.',text:'오른쪽 위 미니맵을 누르세요. 주황 칸까지 소리가 닿았고, 붉은 칸의 적이 들었습니다.',action:'panel',id:'sound',target:'#mapToggle'},
 {title:'반대편에 돌을 던지세요',story:'들은 것은 파수병. 곧 이쪽으로 옵니다. 그 귀를 반대편 무기고로 돌려야 합니다.',text:'지도를 닫고 「유인」 → 「부서진 무기고」. 기술 1로 돌멩이를 던지면 들은 적이 턴 끝에 그쪽으로 갑니다. 대신 경계도 오릅니다.',action:'lure',id:5},
 {title:'틈이 닫히기 전에 달리세요',story:'돌멩이 소리에 파수병이 무기고 쪽으로 몸을 튼 지금, 그 방을 질러가야 합니다. 조용히 걷기엔 틈이 너무 짧습니다.',text:'「이동 방식」에서 「질주」를 고르고 「파수병의 방」으로. 빠르지만 발소리가 커서 경계가 8을 넘습니다.',action:'move',id:2},
 {title:'용의 숨결을 버티세요',story:'급한 발소리에 파수병이 돌아섰고, 금고 밑바닥에 잠든 용까지 눈을 떴습니다. 메달의 힘은 다 썼으니 이번엔 버티는 수밖에 없습니다.',text:'「다음 턴」을 누르세요. 파수병의 반격과 용의 숨결 뒤 새 메달 5개가 열립니다. 방어는 둘 다 막아 주고, 쓰지 않은 자원은 사라집니다.',action:'end',target:'#endTurn'},
 {title:'파수병을 쓰러뜨리세요',story:'돌멩이에 잠깐 속았던 문지기가 제 방 문을 막고 섰습니다. 물러날 길은 왔던 길뿐. 안쪽으로 가려면 넘어서야 합니다.',text:'파수병 위 「공격」을 누르세요. 적이 있는 방에서는 쓰러뜨리거나 왔던 길로만 나갈 수 있습니다.',action:'attack',target:'#sceneTarget'},
 {title:'남은 기억을 거두세요',story:'쓰러진 파수병에게서 생전의 솜씨가 기억으로 흘러나왔습니다. 주머니에 담으면 메달이 되어 당신의 힘이 됩니다.',text:'능력 하나를 고르세요. 다음 턴부터 메달로 섞여 나옵니다. 이 밤은 회상이라 여기서 얻은 것은 실전에 이어지지 않습니다.',action:'reward',target:'.ability-choice'}
];

// 연습 중 메달 추출 창에 뜨는 한 줄: 추출도 행동이므로 이유를 말한다.
export const TUTORIAL_REVEALS={
 first:'입구를 넘자 봉인 메달 다섯 개가 손에 쥐어집니다. 금고는 침입자에게 딱 이만큼의 힘만 빌려줍니다. 이 힘이 다하면 움직일 수 없습니다.',
 turn:'숨결을 견뎌 낸 손에 봉인이 새 메달을 쥐여 줍니다. 남은 힘은 사라졌고, 이번 턴은 이 다섯 개로 버팁니다.',
};

export function createTutorialRun(){
 const s=newRun({seed:42028,role:'rogue'}),r=s.rooms[2];
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
