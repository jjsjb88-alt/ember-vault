#!/usr/bin/env python3
"""Actual new-game merchant encounter, resized for scene/shop layout checks.
Requires Playwright + Chromium and a repo HTTP server at --base-url.
No state injection. Evidence differs from full journey checks in verify-v93-browser.py.
"""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--base-url',default='http://127.0.0.1:8013');p.add_argument('--screenshots',default='/tmp/ember-v93-layout');args=p.parse_args()
out=Path(args.screenshots);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(args.base_url+'/dist/',wait_until='networkidle');page.locator('[data-act=tutorialSkip]').click()
 page.locator('[data-reveal=skip]').click();page.wait_for_selector('#poolReveal',state='hidden')
 page.locator('#marketToggle').click();page.wait_for_selector('#cutscene[open][data-scene=merchant]')
 results=[]
 for width,height in [(390,844),(740,320),(1280,720)]:
  page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(250)
  geometry=page.locator('.cut-panel').bounding_box();button=page.locator('.cut-next').bounding_box()
  assert geometry['y']>=0 and geometry['x']>=0
  assert button['y']+button['height']<=height and button['height']>=44
  assert page.locator('.cut-stage img').evaluate('(e)=>e.complete&&e.naturalWidth>0')
  page.screenshot(path=str(out/f'sera-scene-{width}x{height}.png'))
  results.append({'viewport':[width,height],'scene_panel':geometry,'continue_button':button})
 page.set_viewport_size({'width':740,'height':320});page.locator('.cut-skip').click()
 for width,height in [(390,844),(740,320),(1280,720)]:
  page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(250)
  page.locator('#modal').evaluate('(e)=>e.scrollTop=0')
  assert page.locator('#modal').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.screenshot(path=str(out/f'sera-workshop-{width}x{height}.png'))
 assert not errors,errors
 Path('/tmp/ember-v93-layout-results.json').write_text(json.dumps({'result':'PASS','cases':results,'errors':errors},indent=2)+'\n')
 print('PASS: three actual encounter/market layouts; landscape skip and 44px continue controls')
 b.close()
