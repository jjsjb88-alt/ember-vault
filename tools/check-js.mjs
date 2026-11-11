import {readdirSync} from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=['sw.js',...walk('dist'),...walk('tools')].filter(p=>/\.(m?js)$/.test(p));for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'inherit'});console.log(`${files.length} JavaScript modules checked`);
