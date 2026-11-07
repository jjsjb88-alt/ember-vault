#!/usr/bin/env python3
"""Explicit isolated pre-V10 storage fixtures; not normal play or user learning tests."""
import json,argparse,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--base-url',default='http://127.0.0.1:8037');args=p.parse_args();repo=Path(__file__).resolve().parents[3];results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for layout in ['classic','expanded','staged']:
  script=f"import {{newRun,apply,validSave}} from './dist/engine.js';const s=newRun({{seed:42,role:'mage',layout:'{layout}',gimmicks:false}});for(const a of [{{type:'move',id:1}},{{type:'interact'}},{{type:'end'}}]){{if(!apply(s,a).ok)throw Error('Fixture action failed');}}if(!validSave(s))throw Error('Invalid fixture');console.log(JSON.stringify(s));"
  fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=repo,text=True));page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(args.base_url+'/dist/',wait_until='networkidle')
  page.evaluate("s=>{localStorage.setItem('ember-vault-save-v2',JSON.stringify(s));localStorage.setItem('ember-vault-best-v1','123');localStorage.setItem('ember-vault-tutorial-v1','completed');}",fixture)
  original=page.evaluate('localStorage.getItem("ember-vault-save-v2")');page.reload(wait_until='networkidle');assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==original;assert not page.locator('body.gimmick-mode').count()
  page.locator('[data-act=menu]').click();assert not page.locator('#modal [data-act=passageGuide]').count();page.locator('#modal [data-act=new]').click();page.locator('#modal .modal-actions [data-act=close]').click();assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==original
  page.locator('[data-act=menu]').click();page.locator('#modal [data-act=new]').click();page.locator('[data-act=start]').click();now=json.loads(page.evaluate('localStorage.getItem("ember-vault-save-v2")'));assert now['gimmicksVersion']==1 and now['pos']==0 and now['stagePrepared']==[None,None,None]
  page.reload(wait_until='networkidle');assert json.loads(page.evaluate('localStorage.getItem("ember-vault-save-v2")'))==now;assert page.locator('body.gimmick-mode').count()==1;assert page.evaluate('localStorage.getItem("ember-vault-best-v1")')=='123';assert not errors,errors
  results.append(dict(layout=layout,result='PASS',original_preserved_until_start=True,new_marker_survives_reload=True,errors=errors));page.close()
 b.close()
Path('/tmp/ember-v10-legacy-result.json').write_text(json.dumps(dict(result='PASS',scope=__doc__,fixtures=results),indent=2)+'\n');print(json.dumps(results))
