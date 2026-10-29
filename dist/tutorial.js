import {newRun} from './engine.js';

export const TUTORIAL_STEPS=[
 {title:'금빛 방 이름을 누르세요',text:'망각의 창고로 이동하세요. 이동력 1을 사용합니다.',action:'move',id:1,target:'.scene-exit[data-id="1"]'},
 {title:'상자를 직접 눌러 여세요',text:'금화는 얻지만 경첩 소리가 납니다. 주변의 귀를 조심하세요.',action:'interact',target:'#sceneTarget'},
 {title:'누가 들었는지 확인하세요',text:'오른쪽 위 미니맵을 누르세요. 소리는 벽을 뚫지 않고 통로로 퍼집니다.',action:'panel',id:'sound',target:'#mapToggle'},
 {title:'다른 방으로 시선을 돌리세요',text:'지도를 닫고 유인 → 부서진 무기고. 기술 1로 돌멩이를 던집니다.',action:'lure',id:5},
 {title:'큰 발소리가 금고를 깨웁니다',text:'이동 방식에서 질주를 고르고 파수병의 방으로 이동하세요. 경계가 8을 넘습니다.',action:'move',id:2},
 {title:'분노는 턴 끝에 터집니다',text:'풀 뽑기를 누르세요. 적의 반격 뒤 용의 숨결이 닥칩니다.',action:'end',target:'#endTurn'},
 {title:'모인 공격력으로 적을 누르세요',text:'파수병을 직접 눌러 공격하세요. 방어는 반격 피해를 자동으로 막습니다.',action:'attack',target:'#sceneTarget'},
 {title:'보상으로 풀을 성장시키세요',text:'능력 하나를 고르세요. 영입한 능력은 다음 순환부터 뽑힙니다.',action:'reward',target:'.ability-choice'}
];

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
