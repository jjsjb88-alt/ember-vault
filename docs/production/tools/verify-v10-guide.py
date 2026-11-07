#!/usr/bin/env python3
"""Fresh normal UI: preview is read-only, confirmation changes stance and travels.
No game state, RNG or storage injection. Chromium touch emulation, not hardware.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def settle():
  for _ in range(40):
   page.wait_for_timeout(150)
   if page.locator('#poolReveal[open]').count():page.locator('[data-reveal=skip]').tap()
   elif page.locator('#cutscene[open]').count():page.locator('.cut-skip').tap()
   else:page.wait_for_timeout(500);return
 def tap(s):page.locator(s).tap();settle()
 def saved():return page.evaluate('localStorage.getItem("ember-vault-save-v2")')
 page.goto('http://127.0.0.1:8037/dist/?v=20261107e',wait_until='networkidle');tap('[data-act=tutorialSkip]');before=saved();s=json.loads(before)
 tap('[data-act=menu]');tap('#modal [data-act=passageGuide]');tap('[data-act=guideMode][data-id=sneak]');assert saved()==before;tap('[data-act=guideTravel][data-id="1"]');after=json.loads(saved());assert after['pos']==1 and after['mode']=='sneak';assert after['resource']['move']==s['resource']['move']-2;assert after['lastSound']['strength']==max(0,min(12,s['resource']['rattle']-s['resource']['quiet']));assert not page.locator('#modal[open]').count();assert not errors,errors
 result=dict(result='PASS',scope=__doc__,read_only_preview=True,confirmed_stance_and_travel=True,errors=errors);Path('/tmp/ember-v10-guide-result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));b.close()
