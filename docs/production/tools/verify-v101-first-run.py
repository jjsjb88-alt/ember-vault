#!/usr/bin/env python3
"""Normal fresh touch play, without state/RNG/storage injection. Scripted UI checks,
not a human novice study or physical-device certification.
"""
import argparse,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('width',type=int,choices=[360,390,740]);args=p.parse_args();w=args.width;h={360:640,390:844,740:320}[w];out=Path(f'/tmp/ember-v101-{w}');out.mkdir(exist_ok=True);report=dict(viewport=[w,h],result='RUNNING',checks=[],errors=[],http_errors=[],request_failures=[]);KEY='ember-vault-save-v2'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,reduced_motion='reduce');page.set_default_timeout(8000)
 page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('response',lambda r:report['http_errors'].append(r.status) if r.status>=400 else None);page.on('requestfailed',lambda r:report['request_failures'].append(r.url))
 def saved():return page.evaluate('(k)=>localStorage.getItem(k)',KEY)
 def state():return json.loads(saved())
 def tap(sel):page.locator(sel).tap()
 def shot(name):page.screenshot(path=str(out/(name+'.png')))
 def settle():
  quiet=0
  for _ in range(160):
   page.wait_for_timeout(100)
   if page.locator('#cutscene[open]').count():tap('.cut-skip');quiet=0
   elif page.locator('#noiseMoment[open] [data-judge=draw]').count():tap('[data-judge=draw]');quiet=0
   elif page.locator('#noiseMoment[open] [data-noise=skip]').count():tap('[data-noise=skip]');quiet=0
   elif page.locator('#poolReveal[open]').count():tap('[data-reveal=skip]');quiet=0
   else:
    quiet+=1
    if quiet>=5:return
  raise AssertionError('UI did not settle')
 def act(sel):tap(sel);settle()
 def check(name,**kw):report['checks'].append(dict(name=name,**kw));print(name,flush=True)
 def reachable():
  covered=page.locator('.scene-exit[aria-disabled=false],#sceneTarget[aria-disabled=false]:not([hidden])').evaluate_all('''es=>es.filter(e=>{const r=e.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !e.contains(top)}).map(e=>e.outerHTML)''');assert not covered,covered
 def close():
  for _ in range(4):
   if not page.locator('#modal[open]').count():return
   act('#modal .close-button')
 def move(id):
  for _ in range(15):
   s=state();assert s['phase']=='playing',s.get('reason')
   if s['pending']:act('[data-act=skipReward]');continue
   e=s['rooms'][s['pos']]['enemy']
   if e and e['hp']>0:act('#sceneTarget' if s['resource']['sword'] else '#endTurn');continue
   sel=f'.scene-exit[data-id="{id}"]'
   if page.locator(sel).get_attribute('aria-disabled')=='false':reachable();act(sel);assert state()['pos']==id;return
   act('#endTurn')
  raise AssertionError('Route unavailable')
 try:
  started=time.monotonic();page.goto('http://127.0.0.1:8037/dist/?v=20261109a',wait_until='networkidle');assert page.locator('#modal').get_attribute('data-mode')=='welcome';shot('welcome')
  assert not page.locator('#cutscene[open]').count();tap('[data-act=firstRunStart]');page.wait_for_timeout(2200);assert page.locator('#poolReveal[open]').count();assert page.locator('.reveal-source').count()==5;assert state()['layout']=='staged' and state()['firstRun']['enabled'];assert not page.locator('body.tutorial-mode').count();shot('medals-to-totals')
  assert all(x>=16 for x in page.locator('.reveal-source .ability-effect').evaluate_all('es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize))'))
  if w==740:
   original=saved();page.locator('.reveal-source').last.scroll_into_view_if_needed();assert saved()==original;shot('ledger-last-medal');check('landscape-ledger-scroll-preserves-state')
  act('[data-reveal=skip]');reachable();shot('first-choice');check('real-campaign-first-choice',seconds=round(time.monotonic()-started,2))
  assert page.locator('#marketToggle').is_disabled();assert '정비소에서 열림' in page.locator('#marketToggle').inner_text();move(1);before=state();act('#sceneTarget');after=state();assert after['gold']>before['gold'];assert after['noise']>before['noise'];assert '금화 +' in page.locator('#toast').inner_text();shot('chest-consequence');check('chest-to-gold-and-noise')
  move(5);act('#sceneTarget');act('[data-act=stageRecruit]');tap('[data-act=prepare][data-id=spark]');committed=saved();assert state()['firstRun']['memory']=='spark';page.reload(wait_until='networkidle');settle();assert saved()==committed;assert state()['layout']=='staged' and len(state()['rooms'])==20;check('same-expedition-reload-after-recruit')
  for _ in range(6):
   tap('#endTurn');page.wait_for_timeout(200)
   # This phase is held only when the recruited ability is actually in the draw.
   if state()['firstRun']['drawnTurn']==state()['turn']:
    page.wait_for_timeout(1900);assert page.locator('#poolReveal[open]').count();assert page.locator('.reveal-source [data-token=spark]').count();shot('recruited-memory-returns');settle();break
   settle()
  assert state()['firstRun']['drawnTurn']==state()['turn'];check('actual-later-draw-not-immediate-grant')
  move(4);before=state();act('#sceneTarget');assert state()['rooms'][4]['enemy']['hp']==0;assert '공격 ' in page.locator('#modal .action-receipt').inner_text();shot('attack-consequence');act('[data-act=skipReward]');move(5);move(6);assert state()['rooms'][state()['pos']]['stage']==1;assert not state()['firstRun']['enabled'];assert not page.locator('body.tutorial-mode').count();shot('continues-in-middle');check('same-run-growth-combat-and-next-stage',seconds=round(time.monotonic()-started,2),turn=state()['turn'])
  assert not report['errors'] and not report['http_errors'] and not report['request_failures'],report;report['result']='PASS'
 except Exception as e:report.update(result='FAIL',failure=str(e));shot('FAIL');raise
 finally:(out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');b.close()
print(json.dumps(dict(result=report['result'],width=w)))
