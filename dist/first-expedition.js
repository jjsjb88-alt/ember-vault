// A presentation-only goal for an explicitly started first real expedition.
// It never inspects undiscovered rooms, changes rules, or creates a run.
export function firstExpeditionGoal(state){
 if(state?.firstExpedition!==true||state.phase!=='playing')return null;
 if(state.layout==='staged'&&!state.relic)return {title:'심층의 유물을 회수하고 귀환',detail:'상층 → 중층 → 하층 → 심층. 층간 정비소에서 능력 풀과 보급을 준비하세요.',note:'심층의 용의 기억을 챙겨 입구에서 탈출해야 완료됩니다.'};
 if(!state.relic)return {
  title:'첫 목표 · 유물 하나와 함께 귀환',
  detail:'길을 살피며 유물을 하나 찾으세요. B3의 달의 눈물도 첫 탈출에 충분합니다.',
  note:'더 깊이 내려갈 필요는 없습니다. 유물을 얻으면 입구로 돌아오세요.',
 };
 if(state.pos===0)return {
  title:'입구에 도착했어요 · 지금 탈출하세요',
  detail:`${state.relic.name} 회수 완료. 입구의 「탈출」을 누르면 첫 탐험이 끝납니다.`,
  note:'유물을 들고 있는 것만으로는 완료되지 않습니다. 살아서 금고를 나가세요.',
 };
 return {
  title:'첫 유물 확보 · 입구로 돌아가세요',
  detail:`${state.relic.name} 회수 · 귀환 제한 ${state.countdown}턴. 무너진 입구를 향하세요.`,
  note:'다른 유물을 찾기보다 남은 체력과 자원으로 돌아갈 길을 고르세요.',
 };
}
