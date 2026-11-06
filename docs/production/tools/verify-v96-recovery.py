#!/usr/bin/env python3
"""Explicit legacy completed-practice/main-pending modal fixture, isolated from play reviews."""
import json,argparse
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--base-url',default='http://127.0.0.1:8026');args=parser.parse_args()
data=json.loads(Path('/tmp/ember-v96-recovery-fixture.json').read_text());out=Path('/tmp/ember-v96-recovery');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(args.base_url+'/dist/',wait_until='networkidle')
 page.evaluate('''(d)=>{localStorage.setItem('ember-vault-save-v2',JSON.stringify(d.main));localStorage.setItem('ember-vault-best-v1','123');localStorage.setItem('ember-vault-tutorial-v1','completed');localStorage.setItem('ember-vault-tutorial-progress-v1',JSON.stringify(d.progress));}''',data)
 page.reload(wait_until='networkidle');before=page.evaluate('localStorage.getItem("ember-vault-save-v2")')
 page.locator('[data-act=tutorialResume]').click();page.locator('#tutorialCoach [data-act=tutorialExit]').click()
 assert '도움과 함께 확인한 귀환' in page.locator('#modalContent').inner_text()
 for method in ['button','escape']:
  page.locator('[data-act=firstExpedition]').click();assert page.locator('#modal').get_attribute('data-mode')=='new'
  if method=='button':page.locator('#modal .modal-actions [data-act=close]').click()
  else:page.keyboard.press('Escape')
  assert page.locator('#modal').get_attribute('data-mode')=='briefing'
  assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==before
 page.screenshot(path=str(out/'pending-main-cancel-back-to-recap.png'))
 page.locator('#modal .modal-actions [data-act=close]').click()
 assert page.locator('#modal').get_attribute('data-mode')=='reward'
 assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==before
 assert page.evaluate('localStorage.getItem("ember-vault-best-v1")')=='123'
 page.screenshot(path=str(out/'main-reward-restored.png'))
 assert not errors,errors
 result={'result':'PASS','scope':'Explicit recovery fixture, not a normal play or learning test','legacy_completed_guided':True,'first_preparation_button_and_escape_cancel_return_to_recap':True,'main_reward_restored':True,'main_and_best_unchanged':True,'errors':errors}
 Path('/tmp/ember-v96-recovery-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));b.close()
