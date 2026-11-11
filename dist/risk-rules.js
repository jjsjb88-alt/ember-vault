// Generation marker keeps existing expeditions and the optional detailed practice unchanged.
export const RISK=Object.freeze({healing:12,heal:4,prepareHeal:3,campHeal:3,breathBase:3,echoFactor:2,depthFactor:1,detectAt:5,move:Object.freeze([1,2,2,2]),enemies:Object.freeze([[3,8,3],[10,12,4],[12,10,4],[18,20,5],[19,20,4]].map(Object.freeze))});
export const hasRisk=s=>s?.layout==='staged'&&s.riskVersion===1;
export function configureRisk(s){
 s.riskVersion=1;s.healingUsed=0;
 for(const [id,hp,damage]of RISK.enemies)Object.assign(s.rooms[id].enemy,{hp,maxHp:hp,damage});
}
export function healingLeft(s){return hasRisk(s)?Math.max(0,RISK.healing-s.healingUsed):Infinity;}
export function healingAmount(s,amount){return Math.max(0,Math.min(s.maxHp-s.hp,amount,healingLeft(s)));}
export function heal(s,amount){const actual=healingAmount(s,amount);s.hp+=actual;if(hasRisk(s))s.healingUsed+=actual;return actual;}
export function riskBreathDamage(s,echo){return hasRisk(s)?RISK.breathBase+Math.floor(RISK.echoFactor*echo)+RISK.depthFactor*s.rooms[s.pos].stage:2+Math.floor(echo/3);}
export function soundLoss(s,noise=s.noise){return hasRisk(s)&&noise>=RISK.detectAt?1:2;}

export function healingNote(s){return hasRisk(s)?`원정 회복 한도 ${RISK.healing} · 남은 회복 ${healingLeft(s)}`:'';}
