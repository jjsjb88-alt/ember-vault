import {newRun} from './engine.js';

export const TUTORIAL_STEPS=[
 {title:'첫 발을 들이세요',story:'무너진 입구 너머로, 주인 잃은 창고가 보입니다.',text:'금빛 「망각의 창고」를 누르세요. 이동력 1을 쓰고 발소리 3이 납니다.',action:'move',id:1,target:'.scene-exit[data-id="1"]'},
 {title:'상자를 여세요',story:'먼지 쌓인 상자에 잊힌 금화가 남아 있습니다.',text:'상자 위 「열기」를 누르세요. 금화를 얻지만 낡은 경첩이 삐걱입니다.',action:'interact',target:'#sceneTarget'},
 {title:'누가 들었는지 보세요',story:'금고는 소리를 벽이 아닌 통로로 옮깁니다.',text:'오른쪽 위 미니맵을 누르세요. 주황 칸까지 소리가 닿았고, 붉은 칸의 적이 들었습니다.',action:'panel',id:'sound',target:'#mapToggle'},
 {title:'다른 곳에 소리를 던지세요',story:'들킨 소리는 더 큰 소리로 덮을 수 있습니다.',text:'지도를 닫고 「유인」 → 「부서진 무기고」. 기술 1로 돌멩이를 던져 적을 그쪽으로 보냅니다.',action:'lure',id:5},
 {title:'서두르면 용이 깨어납니다',story:'빠른 발소리는 금고 깊은 곳까지 울립니다.',text:'「이동 방식」에서 「질주」(키보드 3)를 고르고 「파수병의 방」으로. 경계가 8을 넘습니다.',action:'move',id:2},
 {title:'턴을 마치고 새 힘을 뽑으세요',story:'경계 8 이상으로 턴을 마치면 용이 숨을 내쉽니다.',text:'「풀 뽑기」를 누르세요. 적의 반격과 용의 숨결 뒤 메달 5개가 새로 열립니다. 남은 자원은 사라집니다.',action:'end',target:'#endTurn'},
 {title:'파수병을 쓰러뜨리세요',story:'첫 발소리를 기억하는 문지기가 길을 막습니다.',text:'파수병 위 「공격」을 누르세요. 공격력만큼 피해를 주고, 방어는 반격을 막습니다.',action:'attack',target:'#sceneTarget'},
 {title:'남은 기억을 거두세요',story:'쓰러진 자리에 기억 하나가 남았습니다.',text:'능력 하나를 고르세요. 다음 턴부터 메달로 섞여 나옵니다.',action:'reward',target:'.ability-choice'}
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
