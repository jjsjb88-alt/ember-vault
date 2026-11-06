#!/usr/bin/env python3
"""V9 browser integration using real clicks/taps; isolated browser storage only.

Requires Python 3.10+, the `playwright` Python package, and Chromium.
From repository root, start a separate static server:
    python3 -m http.server 8011 --bind 127.0.0.1 --directory .
Then run, for example:
    python3 docs/production/tools/verify-v9-browser.py portrait-safe
    python3 docs/production/tools/verify-v9-browser.py retry-safe
Use --base-url for another server origin/repository base path, --browser-path
for another Chromium executable, and --screenshots for evidence output.
JSON reports are written to /tmp/ember-v9-<case>-result.json. The script exits
nonzero on failure. It never edits application files or real player storage.

Cases: portrait-safe / portrait-risk (390x844 touch, normal motion),
landscape-risk (844x390 touch, normal motion), small-safe (740x320 touch,
reduced motion), desktop-risk (1280x720 mouse, reduced motion), and
retry-safe (844x390 touch, reduced motion; deliberately waits 14 turns for
collapse, restores the practice checkpoint, then completes the expedition).
"""
import argparse,json,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser();parser.add_argument('case');parser.add_argument('--screenshots',default='/tmp/ember-v9-qa');parser.add_argument('--base-url',default='http://127.0.0.1:8011');parser.add_argument('--browser-path',default='/usr/bin/chromium');args=parser.parse_args()
CASES={'portrait-safe':(390,844,3,False,True),'retry-safe':(844,390,3,True,True),'portrait-risk':(390,844,6,False,True),'landscape-risk':(844,390,6,False,True),'small-safe':(740,320,3,True,True),'desktop-risk':(1280,720,6,True,False)}
w,h,route,reduced,touch=CASES[args.case]
shots=Path(args.screenshots);shots.mkdir(parents=True,exist_ok=True)
report={'case':args.case,'viewport':[w,h],'route':route,'reduced_motion':reduced,'touch':touch,'stages':[],'actions':[],'screenshots':[],'errors':[],'request_failures':[],'http_errors':[],'layout':[]}
ROOT=args.base_url.rstrip('/')
BASE=ROOT+'/dist/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=args.browser_path,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 context=browser.new_context(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch,device_scale_factor=1,reduced_motion='reduce' if reduced else 'no-preference')
 page=context.new_page();page.set_default_timeout(7000)
 page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.on('requestfailed',lambda r:report['request_failures'].append({'url':r.url,'error':r.failure}))
 page.on('response',lambda r:report['http_errors'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 def state():
  return page.evaluate('''()=>({step:document.querySelector('#tutorialCoach').dataset.step,location:document.querySelector('.hud-location').innerText,hp:Number(document.querySelector('[aria-label="체력"]').getAttribute('aria-valuenow')),noise:Number(document.querySelector('[aria-label="용의 경계"]').getAttribute('aria-valuenow')),gold:document.querySelector('.hud-gold').innerText,move:Number(document.querySelector('.resource.move strong').innerText),coach:document.querySelector('#tutorialCoach').innerText,dialogs:[...document.querySelectorAll('dialog[open]')].map(e=>({id:e.id,mode:e.dataset.mode,phase:e.dataset.phase}))})''')
 def activate(selector,first=False):
  el=page.locator(selector);el=el.first if first else el
  el.tap() if touch else el.click()
 def settle():
  empty=0
  for _ in range(75):
   page.wait_for_timeout(100)
   if page.locator('#cutscene[open]').count():activate('.cut-skip');empty=0
   elif page.locator('#noiseMoment[open] [data-judge="draw"]').count():activate('[data-judge="draw"]');empty=0
   elif page.locator('#noiseMoment[open] [data-noise="skip"]').count():activate('[data-noise="skip"]');empty=0
   elif page.locator('#poolReveal[open]').count():activate('[data-reveal="skip"]');empty=0
   else:
    empty+=1
    if empty>=10:return
  raise AssertionError('Modal/cutscene flow did not settle')
 def action(selector,first=False):
  activate(selector,first)
  if selector=='#hideAction' and page.locator('#tutorialCoach').get_attribute('data-step')=='11':
   page.wait_for_selector('#cutscene[open]')
   before_keys=state()
   for key in ['ArrowRight','ArrowUp','e']:
    page.keyboard.press(key)
   after_keys=state()
   for key in ['step','location','hp','noise','gold','move']:
    assert after_keys[key]==before_keys[key],('background key leak',key,before_keys[key],after_keys[key])
   report['dialog_keyboard_blocked']=True
  settle();report['actions'].append({'selector':selector,'state':state()})
  if selector in ['#lureToggle','#hideAction'] or page.locator('#tutorialCoach').get_attribute('data-step')=='14':
   overlaps=page.evaluate('''()=>{if(document.querySelector('dialog[open]'))return [];const coach=document.querySelector('#tutorialCoach').getBoundingClientRect();return [...document.querySelectorAll('.coach-target')].map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.id,rect:{x:r.x,y:r.y,w:r.width,h:r.height},coach:{x:coach.x,y:coach.y,w:coach.width,h:coach.height},overlap:Math.max(0,Math.min(r.right,coach.right)-Math.max(r.left,coach.left))*Math.max(0,Math.min(r.bottom,coach.bottom)-Math.max(r.top,coach.top))}}).filter(x=>x.overlap>0)}''')
   assert not overlaps,('coach covers target',selector,overlaps)
 def shot(name):
  page.wait_for_function("!document.querySelector('#toast').classList.contains('show')",timeout=4500)
  path=shots/f'{args.case}-{name}.png';page.screenshot(path=str(path));report['screenshots'].append(str(path))
 def stage(n):
  page.wait_for_function('(n)=>document.querySelector("#tutorialCoach").dataset.step===String(n)',arg=n)
  report['stages'].append(n)
  print(json.dumps({'case':args.case,'stage':n,'state':state()},ensure_ascii=False),flush=True)
  report['layout'].append(page.evaluate('''()=>({step:document.querySelector('#tutorialCoach').dataset.step,w:innerWidth,h:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,coach:(()=>{const r=document.querySelector('#tutorialCoach').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()})'''))
  layout=report['layout'][-1]
  assert layout['scrollW']<=layout['w'] and layout['scrollH']<=layout['h'],('page overflow',layout)
  assert layout['coach']['y']>=0 and layout['coach']['y']+layout['coach']['h']<=layout['h'],('coach outside viewport',layout)
 def travel(room):
  selector=f'.scene-exit[data-id="{room}"]'
  for _ in range(5):
   if page.locator(selector).get_attribute('aria-disabled')=='false':break
   action('#endTurn')
   assert not page.locator('#modal[open] [data-act="tutorialRetry"]').count(),'Practice lost before movement'
  else:raise AssertionError(f'Movement still unavailable to room{room}')
  action(selector)
 try:
  page.goto(ROOT+f'/?tutorial=1&qa={args.case}#entry',wait_until='networkidle')
  assert page.url==BASE+f'?qa={args.case}#entry',page.url
  assert '14단계' in page.locator('.tutorial-intro').inner_text()
  shot('intro')
  page.locator('#tutorialAudio').uncheck();action('[data-act="tutorialSkip"]')
  page.reload(wait_until='networkidle');assert not page.locator('#modal[open]').count()
  page.evaluate("localStorage.setItem('ember-vault-best-v1','123')")
  page.goto(BASE+f'?tutorial=1&qa={args.case}#practice',wait_until='networkidle')
  original=page.evaluate("localStorage.getItem('ember-vault-save-v2')")
  original_best=page.evaluate("localStorage.getItem('ember-vault-best-v1')")
  assert len(json.loads(original)['rooms'])==20
  page.locator('#tutorialAudio').uncheck();action('[data-act="tutorialStart"]');stage(1)
  # Optional dialogue remains reachable without automatically blocking every step.
  activate('[data-act="tutorialReplay"]');page.wait_for_selector('#cutscene[open]');settle()
  action('.scene-exit[data-id="1"]');stage(2)
  action('#sceneTarget');stage(3)
  action('#mapToggle');stage(4)
  shot('sound-map')
  action('#mapToggle');action('#lureToggle');action('.scene-exit[data-id="5"]');stage(5)
  action('#stanceToggle');action('[data-act="mode"][data-id="rush"]');action('.scene-exit[data-id="2"]');stage(6)
  action('#endTurn');stage(7)
  action('#sceneTarget');stage(8)
  action('[data-act="reward"]',True);stage(9)
  action('#marketToggle');action('[data-act="buy"]:not([disabled])',True);stage(10)
  action('#hideAction');stage(11)
  shot('choice')
  before_route=state();travel(route);stage(12)
  before_object=state();action('#sceneTarget');after_object=state()
  if route==3:assert after_object['hp']>before_object['hp'],'Camp should heal'
  else:assert int(after_object['gold'].strip())>int(before_object['gold'].strip()),'Chest should give gold'
  report['branch']={'before':before_route,'arrived':before_object,'used_object':after_object}
  travel(7);stage(13)
  shot('relic')
  action('#sceneTarget');stage(14)
  assert '귀환 14턴' in state()['location'],state()
  shot('return')
  if args.case=='retry-safe':
   stalled_turns=0
   while not page.locator('[data-act="tutorialRetry"]').count() and stalled_turns<20:
    action('#endTurn');stalled_turns+=1
   assert page.locator('[data-act="tutorialRetry"]').count()==1,'Expected recoverable failure'
   assert page.locator('#modal').get_attribute('data-mode')=='tutorialRetry'
   failure_text=page.locator('#modal').inner_text()
   assert page.evaluate("localStorage.getItem('ember-vault-save-v2')")==original
   assert page.evaluate("localStorage.getItem('ember-vault-best-v1')")==original_best
   shot('retry-prompt')
   action('[data-act="tutorialRetry"]');stage(11)
   restored=state()
   for key in ['hp','noise','gold','move','location']:
    assert restored[key]==before_route[key],(key,restored[key],before_route[key])
   report['retry']={'stalled_turns':stalled_turns,'failure_text':failure_text,'checkpoint_restored':True,'restored':restored}
   shot('retry-restored')
   travel(route);stage(12);action('#sceneTarget');travel(7);stage(13);action('#sceneTarget');stage(14)
  # Use the return route through the branch actually chosen, then leave at the entry.
  for room in [route,2,1,0]:travel(room)
  assert '무너진 입구' in state()['location']
  action('#sceneTarget');stage(15)
  assert '첫 불씨를 품고 돌아왔습니다' in state()['coach']
  assert not page.locator('#modal[open] [data-act="tutorialRetry"]').count()
  shot('escaped')
  assert page.evaluate("localStorage.getItem('ember-vault-save-v2')")==original
  assert page.evaluate("localStorage.getItem('ember-vault-best-v1')")==original_best
  action('#tutorialCoach [data-act="tutorialExit"]')
  assert page.locator('#modal').get_attribute('data-mode')=='briefing'
  assert page.evaluate("localStorage.getItem('ember-vault-tutorial-v1')")=='completed'
  shot('briefing')
  action('#modal .modal-actions [data-act="close"]')
  assert not page.locator('#tutorialCoach').is_visible()
  page.reload(wait_until='networkidle')
  assert page.url==BASE+f'?qa={args.case}#practice'
  assert not page.locator('[data-act="tutorialStart"]').count()
  assert page.evaluate("localStorage.getItem('ember-vault-save-v2')")==original
  assert page.evaluate("localStorage.getItem('ember-vault-best-v1')")==original_best
  report.update({'result':'PASS','original_save_preserved':True,'original_best_preserved':True,'completed_reload_no_intro':True,'final':state()})
  assert not report['errors'],report['errors']
  assert not report['request_failures'],report['request_failures']
  assert not report['http_errors'],report['http_errors']
 except Exception as exc:
  report.update({'result':'FAIL','error':str(exc),'traceback':traceback.format_exc()})
  try:report['failure_state']=state()
  except Exception as probe:report['failure_state']={'probe_error':str(probe)}
  try:shot('FAIL')
  except Exception as capture:report['capture_error']=str(capture)
 finally:
  Path(f'/tmp/ember-v9-{args.case}-result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
  print(json.dumps({'case':args.case,'result':report['result'],'stages':report['stages'],'error':report.get('error'),'errors':report['errors'],'failure_state':report.get('failure_state')},ensure_ascii=False),flush=True)
  browser.close()
if report['result']!='PASS':raise SystemExit(1)
