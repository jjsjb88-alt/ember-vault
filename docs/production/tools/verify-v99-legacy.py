#!/usr/bin/env python3
"""Explicit isolated legacy-save fixture: preserve old progress until Start.
Builds an old expanded newRun with real move/interact/end actions, then injects
that explicit fixture in a separate context. This is not a normal play/learning test.
"""
import json,argparse,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--base-url',default='http://127.0.0.1:8037');args=p.parse_args()
repo=Path(__file__).resolve().parents[3]
script="import {newRun,apply,validSave} from './dist/engine.js';const s=newRun({seed:42,role:'mage',layout:'expanded'});for(const a of [{type:'move',id:1},{type:'interact'},{type:'end'}]){const r=apply(s,a);if(!r.ok)throw Error(r.message);}if(!validSave(s))throw Error('Invalid fixture');console.log(JSON.stringify(s));"
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=repo,text=True));out=Path('/tmp/ember-v99-legacy');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(args.base_url+'/dist/',wait_until='networkidle')
 page.evaluate('''s=>{localStorage.setItem('ember-vault-save-v2',JSON.stringify(s));localStorage.setItem('ember-vault-best-v1','123');localStorage.setItem('ember-vault-tutorial-v1','completed');}''',fixture)
 original=page.evaluate('localStorage.getItem("ember-vault-save-v2")');page.reload(wait_until='networkidle');assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==original
 assert not page.locator('body.staged-mode').count();page.screenshot(path=str(out/'old-expedition-kept.png'))
 page.locator('[data-act=menu]').click();page.locator('[data-act=new]').click();assert '상층' in page.locator('#modalContent').inner_text()
 page.locator('#modal .modal-actions [data-act=close]').click();assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==original
 page.locator('[data-act=menu]').click();page.locator('[data-act=new]').click();page.locator('[data-act=start]').click()
 now=json.loads(page.evaluate('localStorage.getItem("ember-vault-save-v2")'));assert now['layout']=='staged' and now['stagePrepared']==[None,None,None] and now['pos']==0
 assert page.evaluate('localStorage.getItem("ember-vault-best-v1")')=='123'
 page.reload(wait_until='networkidle');assert json.loads(page.evaluate('localStorage.getItem("ember-vault-save-v2")'))==now;assert page.locator('body.staged-mode').count()==1
 assert not errors,errors
 result=dict(result='PASS',scope='Explicit isolated legacy storage fixture, not normal play',old_progress_preserved=True,cancel_preserved=True,only_explicit_start_created_four_stages=True,new_progress_survived_reload=True,best_preserved=True,errors=errors)
 Path('/tmp/ember-v99-legacy-result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));b.close()
