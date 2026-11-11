import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const root=path.resolve(new URL('..',import.meta.url).pathname),dist=path.join(root,'dist'),out=path.resolve(process.argv[2]||path.join(root,'_site'));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const all=files(dist).sort(),texts=all.filter(p=>/\.(js|css|html)$/.test(p)).map(p=>fs.readFileSync(p,'utf8')).join('\n');
const usedPng=new Set([...texts.matchAll(/assets\/[\w./-]+\.png/g)].map(m=>m[0]));
const selected=all.filter(p=>{if(path.basename(p)==='sw-assets.json')return false;const r=path.relative(dist,p).split(path.sep).join('/');return !r.startsWith('assets/')||!r.endsWith('.png')||usedPng.has(r)||r.startsWith('assets/v9/props/')||r.startsWith('assets/v9/motion/')||r.startsWith('assets/app-icon-');});
const relative=selected.map(p=>'./'+path.relative(dist,p).split(path.sep).join('/'));
const core=relative.filter(p=>!p.endsWith('.mp3')&&(!p.startsWith('./assets/')||p.endsWith('.webp')||p.includes('app-icon-')));
const coreBytes=core.reduce((n,p)=>n+fs.statSync(path.join(dist,p)).size,0);if(coreBytes>10_000_000)throw Error('Cold core exceeds 10 MB: '+coreBytes);
const integrity=Object.fromEntries(selected.map(p=>['./'+path.relative(dist,p).split(path.sep).join('/'),createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));integrity['./']=integrity['./index.html'];
const releaseId=createHash('sha256').update(JSON.stringify(integrity)).digest('hex').slice(0,16);
const manifest={version:1,releaseId,integrity,core:[...new Set(['./','./index.html',...core])],pack:relative,coreBytes,totalBytes:selected.reduce((n,p)=>n+fs.statSync(p).size,0)};
fs.writeFileSync(path.join(dist,'sw-assets.json'),JSON.stringify(manifest,null,2)+'\n');
if(out===root||out===dist||out===path.dirname(root)||out==='/'||root.startsWith(out+path.sep)||out.startsWith(dist+path.sep))throw Error('Unsafe release output');
const marker=path.join(out,'.ember-release');if(fs.existsSync(out)&&fs.readdirSync(out).length){if(!fs.existsSync(marker))throw Error('Refusing to replace unmarked output: '+out);fs.rmSync(out,{recursive:true});}fs.mkdirSync(out,{recursive:true});fs.writeFileSync(marker,'ember-vault release output\n');
for(const p of selected){const target=path.join(out,'dist',path.relative(dist,p));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(p,target);}fs.copyFileSync(path.join(dist,'sw-assets.json'),path.join(out,'dist/sw-assets.json'));fs.copyFileSync(path.join(root,'index.html'),path.join(out,'index.html'));fs.writeFileSync(path.join(out,'sw.js'),`self.EMBER_RELEASE_ID=${JSON.stringify(releaseId)};\n`+fs.readFileSync(path.join(root,'sw.js'),'utf8'));fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log(JSON.stringify({out,coreBytes,totalBytes:manifest.totalBytes,files:selected.length}));
