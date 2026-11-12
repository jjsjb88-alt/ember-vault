import {validSave} from './engine.js?v=20261112a';
import {validProfile} from './progression.js?v=20261112a';
import {validSettings} from './settings.js?v=20261112a';
import {loadTutorialProgress} from './tutorial-storage.js?v=20261112a';
export const TRANSFER_KEYS=['ember-vault-save-v2','ember-vault-profile-v1','ember-vault-settings-v1','ember-vault-best-v1','ember-vault-tutorial-v1','ember-vault-tutorial-progress-v1'];
export function exportSave(storage){return JSON.stringify({format:'ember-vault-save',version:1,created:new Date().toISOString(),data:Object.fromEntries(TRANSFER_KEYS.map(k=>[k,storage.getItem(k)]))},null,2);}
export function parseSave(text){
 if(typeof text!=='string'||text.length>2_000_000)throw Error('저장 파일이 너무 크거나 읽을 수 없습니다.');let p;try{p=JSON.parse(text);}catch{throw Error('JSON 저장 파일을 읽을 수 없습니다.');}
 if(p?.format!=='ember-vault-save'||p.version!==1||!p.data||Object.keys(p.data).some(k=>!TRANSFER_KEYS.includes(k)))throw Error('지원하지 않는 저장 형식입니다.');
 if(!TRANSFER_KEYS.every(k=>p.data[k]===null||typeof p.data[k]==='string'))throw Error('저장 항목의 형식이 잘못되었습니다.');
 const parse=k=>p.data[k]===null?null:JSON.parse(p.data[k]);const main=parse(TRANSFER_KEYS[0]);if(!validSave(main))throw Error('원정 저장의 규칙이나 버전을 확인할 수 없습니다.');
 const profile=parse(TRANSFER_KEYS[1]);if(profile&&!validProfile(profile))throw Error('불씨 기록이 잘못되었습니다.');const settings=parse(TRANSFER_KEYS[2]);if(settings&&!validSettings(settings))throw Error('설정 기록이 잘못되었습니다.');
 const best=parse(TRANSFER_KEYS[3]);if(best!==null&&(!Number.isSafeInteger(best)||best<0))throw Error('최고 기록이 잘못되었습니다.');const marker=p.data[TRANSFER_KEYS[4]];if(marker!==null&&!['seen','completed'].includes(marker))throw Error('연습 표시가 잘못되었습니다.');
 if(p.data[TRANSFER_KEYS[5]]!==null){const r=loadTutorialProgress({getItem:k=>p.data[k]??null});if(r.status==='invalid'||r.status==='unavailable'||!r.progress)throw Error('상세 연습 저장이 잘못되었습니다.');}
 return {data:p.data,main,profile,settings};
}
export function importSave(storage,parsed){const old=Object.fromEntries(TRANSFER_KEYS.map(k=>[k,storage.getItem(k)]));try{for(const k of TRANSFER_KEYS){const value=parsed.data[k];value===null?storage.removeItem(k):storage.setItem(k,value);}return {ok:true};}catch(error){let restored=true;for(const k of TRANSFER_KEYS)try{old[k]===null?storage.removeItem(k):storage.setItem(k,old[k]);}catch{restored=false;}return {ok:false,restored,error:String(error)};}}
export function downloadText(text,name,type='application/json'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
