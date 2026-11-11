import {hasRisk,RISK,healingLeft,healingAmount,healingNote,soundLoss} from './risk-rules.js?v=20261111a';
import {hasGimmicks,roomGimmick,STAGE_GIMMICK_PLANS} from './dungeon-gimmicks.js?v=20261111a';
import {neighbours,passagePreview,MODES,previewNoise} from './engine.js?v=20261111a';
import {stageIndex} from './expedition-stages.js?v=20261111a';
import {itemMarkup} from './token-art.js?v=20261111a';
export function passageGuideMarkup(s,mode=s.mode){
 if(!hasGimmicks(s))return '';
 const here=roomGimmick(s,s.pos);
 return `<p class="gimmick-inventory">${s.hasKey?'✓ 황동 열쇠 보유 · 소모 없음':'황동 열쇠 없음 · 수정고 / 정비소에서 획득'}<br>${s.sealForce||s.sealQuiet?'✓ 기억실 봉인 해제':'기억실 봉인 닫힘'} · ${s.sluiceOpen?'수문 사다리 개방':'수문 사다리 닫힘'}</p>${here?`<aside class="gimmick-here"><strong>${here.symbol} ${here.label}</strong><p>${here.description}</p></aside>`:''}<p class="gimmick-intro">이동 방식을 비교하세요. 이 화면을 살펴보는 동안 자원과 턴은 변하지 않습니다. 예상 소리는 이번 턴의 은신과 첫 소음을 반영합니다.</p><div class="gimmick-modes">${Object.entries(MODES).map(([id,m])=>`<button data-act="guideMode" data-id="${id}" aria-pressed="${mode===id}">${m.name}</button>`).join('')}</div><div class="passage-list">${neighbours(s).map(id=>{
 const p=passagePreview(s,id,mode),room=s.rooms[id],g=roomGimmick(s,id);
 return `<article class="${p.allowed?'':'unavailable'}"><h3>${room.seen?room.name:'미탐험 통로'}${room.enemy?.hp>0&&room.seen?' · 적 있음':''}</h3><div class="passage-costs"><span>이동 <b>${p.cost}</b></span><span>소리 <b>${p.noise}</b></span>${p.attackSpent?`<span>공격 −<b>${p.attackSpent}</b></span>`:''}${p.blockSpent?`<span>방어 −<b>${p.blockSpent}</b></span>`:''}${p.damage?`<span class="danger">피해 <b>${p.damage}</b>${s.hp<=p.damage?' · 치명적':''}</span>`:''}</div>${p.rule.description?`<p><strong>${p.rule.label}</strong> · ${p.rule.description}</p>`:''}${g?`<p><strong>${g.label}</strong> · ${g.description}</p>`:''}${p.allowed?'':`<p class="passage-reason">${p.reason}</p>`}<button data-act="guideTravel" data-id="${id}" ${p.allowed?'':'disabled'}>${MODES[mode].name}로 이 경로 이동 →</button></article>`;
 }).join('')}</div><details class="gimmick-legend"><summary>지도 기호와 이번 층의 준비</summary><p>◆ 수정 동굴 · ▦ 압력 바닥 · ⚙ 수문 · ◇ 공명제단 · ▣ 봉인<br>검: 검문 통로 · 열쇠: 잠긴 지름길 · ↓: 일방 낙하 · 점선: 개방한 승강기 / 비밀길</p><p>${STAGE_GIMMICK_PLANS[stageIndex(s)]}</p></details>`;
}
export function conduitMarkup(s){
 const canSeal=!s.sealQuiet&&s.resource.skill>=2&&s.resource.quiet>=3,canRest=!s.rooms[16].used&&(healingAmount(s,hasRisk(s)?RISK.campHeal:6)>0||s.noise>0);
 return `<div class="conduit-art">${itemMarkup('shrine',100)}<p>등불의 불꽃이 흔들림을 멈춥니다.<br>“쇠붙이를 부수는 대신, 기억의 떨림을 맞춰 봐.”</p></div><div class="conduit-options"><article><h3>기억에 호흡 맞추기</h3><p>기술 <b>2</b> · 은신 <b>3</b> 소비 · 소리 <b>0</b><br>기억실의 봉인과 바로 통하는 비밀길을 엽니다. 수호룡은 남아 있습니다.</p><p>현재 기술 ${s.resource.skill} · 은신 ${s.resource.quiet}. ${s.sealQuiet?'이미 비밀길을 열었습니다.':'숨죽이기와 은신 메달을 같은 턴에 조합하세요.'}</p><button data-act="quietSeal" ${canSeal?'':'disabled'}>${s.sealQuiet?'비밀길 개방 완료':'고요의 봉인 풀기'}</button></article><article><h3>제단 곁에서 휴식</h3><p>체력 +${healingAmount(s,hasRisk(s)?RISK.campHeal:6)} · 경계 −${Math.min(3,s.noise)} · 한 번<br>봉인을 푸는 일과 별도로 이용할 수 있습니다. ${healingNote(s)}</p><button data-act="conduitRest" ${canRest?'':'disabled'}>${s.rooms[16].used?'휴식 완료':'따뜻한 불 곁에서 쉬기'}</button></article></div>`;
}
export function keyOfferMarkup(s){return hasGimmicks(s)?`<div class="key-offer">${itemMarkup('key',48)}<div><strong>${s.hasKey?'황동 열쇠 보유':'황동 열쇠 · 금화 5'}</strong><p>하층 지름길 개방 · 영구 보유. 능력 교역 횟수는 쓰지 않습니다.</p></div><button data-act="buyKey" ${s.hasKey||s.gold<5?'disabled':''}>${s.hasKey?'보유 중':'열쇠 구입'}</button></div>`:'';}
