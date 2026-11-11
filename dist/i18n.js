let language='ko',dictionary={},generation=0,ready=true,ordered=[],templates=[];
const originals=new WeakMap(),attributeOriginals=new WeakMap(),missing=new Set();
const hasKorean=text=>/[가-힣]/.test(text);
function compileDictionary(loaded){
 dictionary=loaded;
 ordered=Object.entries(loaded).filter(([key])=>!key.includes('{')).sort((a,b)=>b[0].length-a[0].length);
 templates=Object.entries(loaded).filter(([key])=>key.includes('{')).map(([key,replacement])=>{
  const names=[...key.matchAll(/\{(\w+)\}/g)].map(m=>m[1]);
  const parts=key.split(/\{\w+\}/g).map(part=>part.replace(/[.*+?^$()|[\]\\]/g,'\\$&'));
  let pattern=parts[0];names.forEach((name,i)=>{pattern+=(/^\d+$/.test(name)?'(\\d+)':'(.+?)')+parts[i+1];});
  return {pattern:new RegExp('^'+pattern+'$'),replacement,names};
 });
}
function translated(value,depth=0){
 const text=String(value),trimmed=text.trim();if(language==='ko'||!ready||!trimmed||!hasKorean(trimmed))return text;
 if(Object.hasOwn(dictionary,trimmed))return text.replace(trimmed,dictionary[trimmed]);
 for(const {pattern,replacement,names} of templates){
  const match=trimmed.match(pattern);if(!match)continue;
  return text.replace(trimmed,replacement.replace(/\{(\w+)\}/g,(_,name)=>{const captured=match[names.indexOf(name)+1];return depth<3?translated(captured,depth+1):captured;}));
 }
 // Compose compact labels only when the entire result is covered; sentences fall back intact.
 if(!/(니다|세요|어요|아요|었|으며|하면|습니다|거든|겠어)/.test(trimmed)){
  let out=text;
  for(const [key,val]of ordered)if(key.length>=2||['턴','개','점','종','회','적'].includes(key))out=out.replaceAll(key,val);
  if(!hasKorean(out))return out;
 }
 if(missing.size<1000)missing.add(trimmed);
 return text;
}
export const translate=value=>translated(value);
function visit(root){
 if(typeof document==='undefined'||!root?.nodeType)return;
 for(const el of [root,...(root.querySelectorAll?.('[aria-label],[title],[alt],[placeholder]')||[])]){
  if(el.nodeType!==1)continue;
  const saved=attributeOriginals.get(el)||{};
  for(const attr of ['aria-label','title','alt','placeholder'])if(el.hasAttribute(attr)){
   const value=el.getAttribute(attr),old=saved[attr],raw=old&&value===old.shown?old.raw:value,shown=translate(raw);
   saved[attr]={raw,shown};if(value!==shown)el.setAttribute(attr,shown);
  }
  attributeOriginals.set(el,saved);
 }
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(node.parentElement?.closest('script,style,textarea,code,pre'))continue;
  const old=originals.get(node),raw=old&&node.data===old.shown?old.raw:node.data,shown=translate(raw);
  originals.set(node,{raw,shown});if(node.data!==shown)node.data=shown;
 }
}
export async function setLanguage(lang){
 const tag=++generation;language=['ko','en','ja'].includes(lang)?lang:'ko';ready=language==='ko';compileDictionary({});missing.clear();
 if(language!=='ko'){
  try{const response=await fetch(`./locales/${language}.json`);if(!response.ok)throw Error('Locale unavailable');const loaded=await response.json();if(tag!==generation)return;compileDictionary(loaded);}
  catch{if(tag!==generation)return;language='ko';}
 }
 ready=true;missing.clear();
 if(typeof document!=='undefined'){document.documentElement.lang=language;visit(document.body);}
}
export const translationStatus=()=>({language,ready,missing:[...missing]});
if(typeof document!=='undefined'&&document.body){
 new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')visit(record.target.parentNode);for(const node of record.addedNodes||[])if(node.nodeType===1)visit(node);else if(node.nodeType===3)visit(node.parentNode);}}).observe(document.body,{subtree:true,childList:true,characterData:true});
}
