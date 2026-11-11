export function setupPwa(onStatus=()=>{}){
 let installPrompt=null,registration=null,reloading=false,reloaded=false;
 const rootScope=new URL('../',location.href).href;
 const reloadOnce=()=>{if(!reloading||reloaded)return;reloaded=true;location.reload();};
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
 if('serviceWorker'in navigator){
  navigator.serviceWorker.register('../sw.js',{scope:'../',updateViaCache:'none'}).then(result=>{
   registration=result;
   if(result.waiting)onStatus('새 버전이 준비되었습니다.');
   result.addEventListener('updatefound',()=>{const worker=result.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)onStatus('새 버전이 준비되었습니다.');});});
  }).catch(async()=>{
   try{registration=await navigator.serviceWorker.getRegistration(rootScope);}catch{}
   if(!registration)onStatus('오프라인 저장을 준비하지 못했습니다. 온라인 플레이는 계속할 수 있습니다.');
  });
  navigator.serviceWorker.addEventListener('controllerchange',reloadOnce);
  navigator.serviceWorker.addEventListener('message',event=>{
   const data=event.data;
   if(data?.type==='offline-progress')onStatus(`오프라인 저장 ${data.done}/${data.total}`);
   if(data?.type==='offline-complete')onStatus('전체 오프라인 저장을 마쳤습니다.');
   if(data?.type==='offline-error')onStatus('일부 파일을 저장하지 못했습니다. 연결과 저장 공간을 확인하세요.');
  });
 }
 return {
  status:()=>({scope:registration?.scope,waiting:registration?.waiting?.state,installing:registration?.installing?.state,reloading}),
  install:async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else onStatus('브라우저 메뉴의 홈 화면에 추가를 사용할 수 있습니다.');},
  pack:async()=>{
   const result=registration||await navigator.serviceWorker?.ready;
   if(!result?.active){onStatus('이 브라우저에서는 오프라인 저장을 사용할 수 없습니다.');return;}
   result.active.postMessage({type:'offline-pack'});
  },
  update:async()=>{
   try{
    // Refresh the registration object after an offline visit: its worker slots may have changed.
    registration=await navigator.serviceWorker?.getRegistration(rootScope)||registration;
    if(!registration){onStatus('이 브라우저에서 업데이트를 준비하지 못했습니다.');return;}
    const waiting=registration.waiting;
    if(waiting){
     onStatus('새 버전으로 전환합니다.');reloading=true;
     waiting.addEventListener('statechange',()=>{if(waiting.state==='activated')reloadOnce();});
     waiting.postMessage({type:'skip-waiting'});
    }else{
     await registration.update();
     onStatus('업데이트를 확인했습니다. 새 버전이 준비되면 이 버튼으로 적용할 수 있습니다.');
    }
   }catch{onStatus('업데이트를 확인하지 못했습니다. 연결을 확인하세요.');}
  },
 };
}
