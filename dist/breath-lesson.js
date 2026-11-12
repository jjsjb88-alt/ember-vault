// 숨결 수업: 난이도는 그대로 두고, 이 게임의 핵심(메아리 → 경계 → 숨결)을 깜부기가 처음 닥치는 순간에 한 번씩 알려 준다.
// 기기마다 한 번. 수치는 바꾸지 않는다. 대사는 고정 문장만 써서 번역 사전이 그대로 잡는다.
export const LESSON_KEY='ember-vault-breath-lessons-v1';
export const LESSONS={
 echo:[
  ['깜부기','방금 그 소리, 이 방에 남았어. 지도에 불씨 숫자로 보일 거야.'],
  ['도적','남으면 어떻게 되는데.'],
  ['깜부기','맨 아래 그것이 그 메아리를 따라와. 메아리는 턴마다 옅어지니까, 시끄러웠던 방엔 오래 서 있지 마.']
 ],
 alert:[
  ['깜부기','금고가 귀를 세웠어. 경계가 다섯을 넘으면 적들이 더 멀리서 듣고, 소리도 더디게 가라앉아.'],
  ['깜부기','여덟이 되면 그것이 숨을 내쉬어. 그 전에 「숨죽이기」로 내리거나 「살금살금」 걸어.']
 ],
 breathHit:[
  ['깜부기','…왔다. 맨 아래 그것이 숨을 내쉬어.'],
  ['깜부기','불길은 가장 진한 메아리에서 시작해서, 이어진 메아리를 타고 번져. 메아리 없는 방엔 못 들어와.'],
  ['도적','이 방엔 내 발소리가 남아 있는데.'],
  ['깜부기','그래서 위험해. 「턴으로 돌아가기」를 눌러. 조용한 방으로 옮기거나 숨죽여서 경계를 여덟 아래로 내려. 못 하겠으면 방어를 쥐고 버텨.']
 ],
 breathSafe:[
  ['깜부기','…왔다. 맨 아래 그것이 숨을 내쉬어.'],
  ['깜부기','불길은 가장 진한 메아리에서 시작해서, 이어진 메아리를 타고 번져. 메아리 없는 방엔 못 들어와.'],
  ['도적','이 방은 조용해.'],
  ['깜부기','그래서 여긴 못 찾아. 지도에서 불길이 어디를 태우는지 봐 둬. 다음엔 네 발소리가 그 길이 될 수도 있어.']
 ]
};
export function loadLessons(storage){try{const v=JSON.parse(storage?.getItem(LESSON_KEY)||'[]');return Array.isArray(v)?v.filter(k=>typeof k==='string'):[];}catch{return [];}}
export function markLesson(storage,seen,key){if(!seen.includes(key))seen.push(key);try{storage?.setItem(LESSON_KEY,JSON.stringify(seen));}catch{}return seen;}
const talk=(lines,hero)=>lines.map(([who,line])=>[who==='도적'?hero:who,line]);
/** 행동 직후에 볼 수업. 메아리 2 이상(상자·전투·큰 발소리)부터: 첫 걸음의 1은 지나친다. 메아리 규칙이 있는 원정에서만. 한 번에 하나. */
export function lessonAfterAction(s,seen,hero='도적'){
 if(!s?.echo||s.phase!=='playing'||s.pending)return null;
 if(!seen.includes('echo')&&s.echo[s.pos]>=2)return {key:'echo',lines:talk(LESSONS.echo,hero)};
 if(!seen.includes('alert')&&s.noise>=5&&s.noise<8)return {key:'alert',lines:talk(LESSONS.alert,hero)};
 return null;
}
/** 첫 숨결 직전에 볼 수업. plan = 이번 숨결의 예측(breathPlan/turnImpact). */
export function lessonBeforeBreath(s,plan,seen,hero='도적'){
 if(!s?.echo||seen.includes('breath'))return null;
 return {key:'breath',lines:talk(plan?.hit?LESSONS.breathHit:LESSONS.breathSafe,hero)};
}
/** 숨결이 예정된 턴에 화면에 계속 떠 있는 예고. 유물 여부와 무관. */
export function breathWarning(s,plan,due){
 if(!s?.echo||s.phase!=='playing'||!due||!plan)return null;
 return plan.hit
  ?{danger:true,title:`숨결이 이 방으로 옵니다 · 피해 ${plan.damage}`,text:`이 방의 메아리 ${plan.echo}. 이대로 턴을 넘기면 숨결이 닿습니다.`,hint:'메아리 없는 방으로 옮기거나, 「숨죽이기」로 경계를 8 아래로 내리거나, 방어를 남겨 두세요.'}
  :{danger:false,title:'숨결이 오지만 이 방은 조용합니다',text:'숨결은 메아리가 이어진 방만 태웁니다. 지금 방은 경로 밖입니다.',hint:'이 방에서 소리를 내면 경로가 바뀝니다. 소리 지도에서 확인하세요.'};
}
