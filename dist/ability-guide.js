import {CARDS} from './engine.js?v=20261107e';

// Display rules shared by the game and artbook. These never resolve a draw or
// inspect a run; numbers always come from the existing card definitions.
export const KEYWORDS={
 sword:{name:'공격',text:'공격할 때 적에게 준 피해만큼 사용합니다. 남은 공격력은 이번 턴의 다른 전투에 쓸 수 있습니다.',example:'공격 5로 체력 3인 적을 쓰러뜨리면 공격 2가 남습니다.'},
 move:{name:'이동',text:'연결된 방으로 이동할 때 사용합니다. 이동 방식과 깊이에 따라 필요한 양이 달라지며, 방 버튼에 최종 비용이 표시됩니다.',example:'걷기에 이동 1이 필요한 방이면 이동 2로 두 통로를 지날 수 있습니다.'},
 skill:{name:'기술',text:'녹스에게 능력을 영입하거나 유인 등에 사용합니다. 영입한 메달은 바로 힘을 주지 않고 다음 주머니 순환부터 나올 수 있습니다.',example:'기술 3으로 불씨 화살을 영입하거나, 기술 1로 연결된 방에 유인할 수 있습니다.'},
 block:{name:'방어',text:'적의 반격과 용의 숨결 피해를 받으면 먼저 소모됩니다. 남은 방어는 같은 턴의 다음 피해에도 쓰이며 새 턴에는 다시 계산합니다.',example:'방어 3으로 피해 2를 막으면 방어 1이 남습니다.'},
 quiet:{name:'은신',short:'내 소음을 줄이고 사용한 만큼 감소합니다. 남은 양은 이번 턴에 계속 사용 · 유인 제외.',text:'내 이동·공격·상자 열기 등의 소음을 줄이는 남은 양입니다. 줄인 만큼만 소모되며 남은 양은 같은 턴에 계속 쓸 수 있습니다. 유인의 돌멩이 소리에는 적용되지 않습니다.',example:'은신 3에서 소리 2를 내면 무음이 되고 은신 1이 남습니다. 이미 남긴 메아리는 지우지 않습니다.'},
 rattle:{name:'첫 소음',short:'다음 내 소리 행동에 한 번 추가됩니다. 해당 행동 뒤 사라짐 · 유인 제외.',text:'다음 내 이동·공격·상자 열기 등의 소리에 한 번 더합니다. 그 행동 뒤에는 모두 사라집니다. 은신으로 줄일 수 있으며 유인에는 소모되지 않습니다.',example:'첫 소음 +1, 기본 소리 2, 은신 2라면 실제 소리는 1입니다.'},
 draw:{name:'추가 추출',short:'이번 추출에서 메달을 더 공개하고 효과를 자동 합산합니다. 다시 누를 필요가 없습니다.',text:'이번 추출 중 주머니에서 메달을 더 공개하고 그 효과도 바로 합칩니다. 주머니가 비면 식은 메달을 섞되, 이번에 공개 중인 메달은 다시 뽑지 않습니다.',example:'1개 추가 추출이면 실제 뽑을 수 있는 메달이 있을 때 한 개를 더 공개합니다.'},
 heal:{name:'회복',short:'추출되는 즉시 체력을 회복합니다. 최대 체력을 넘지 않습니다.',text:'메달이 추출되는 즉시 체력을 회복합니다. 최대 체력보다 높아지지 않으며 회복한 체력은 다음 턴에도 남습니다.',example:'최대 체력 22에서 현재 21이면 회복 3으로 체력 22가 됩니다.'},
 gold:{name:'금화',short:'추출되는 즉시 얻습니다. 남은 금화는 다음 턴에도 유지됩니다.',text:'메달이 추출되는 즉시 금화를 얻습니다. 금화는 다음 턴에도 유지되며 교역 목록 교체 등 원정 중 준비에 사용합니다.',example:'금화 +2는 지금 가진 금화에 2를 더합니다.'},
};
export function abilityEffects(id){
 const e=CARDS[id].e,items=[];
 for(const key of ['sword','move','skill','block','draw','heal','gold'])if(e[key])items.push({key,name:KEYWORDS[key].name,value:e[key]});
 if(e.noise)items.push({key:e.noise<0?'quiet':'rattle',name:e.noise<0?'은신':'첫 소음',value:Math.abs(e.noise)});
 return items;
}
export function abilityEffectsMarkup(id){return `<span class="ability-effects">${abilityEffects(id).map(({key,name,value})=>`<span class="ability-effect effect-${key}"><span>${name}</span> <b>+${value}${key==='draw'?'개':''}</b></span>`).join('')}</span>`;}
export function abilityNotesMarkup(id){
 const keys=abilityEffects(id).map(e=>e.key).filter(key=>KEYWORDS[key].short);
 return keys.length?`<span class="ability-notes">${keys.map(key=>`<span><b>${KEYWORDS[key].name}</b> · ${KEYWORDS[key].short}</span>`).join('')}</span>`:'';
}
export function glossaryMarkup(){return `<dl class="keyword-list">${Object.values(KEYWORDS).map(k=>`<div><dt>${k.name}</dt><dd>${k.text}<small>예: ${k.example}</small></dd></div>`).join('')}<div><dt>소리 · 경계 · 메아리</dt><dd>소리는 한 행동에서 퍼지는 크기, 경계는 용이 깨어나는 누적 수치, 메아리는 소리를 낸 방에 남는 흔적입니다. 은신은 새 소리를 줄이며 이미 남긴 메아리는 지우지 않습니다.</dd></div><div><dt>등급</dt><dd>메달 테두리와 빛의 외형 구분입니다. 등급 자체가 능력이나 가격에 추가 보너스를 주지는 않습니다. 실제 효과는 큰 숫자에 표시된 그대로입니다.</dd></div></dl>`;}
