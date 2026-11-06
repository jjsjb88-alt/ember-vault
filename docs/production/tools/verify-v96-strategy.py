#!/usr/bin/env python3
"""Real UI replay: apply a second lure on the independent return, without state injection."""
import argparse
import json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url',default='http://127.0.0.1:8015')
parser.add_argument('--screenshots',default='/tmp/ember-v96-strategy-replay')
args=parser.parse_args()
out=Path(args.screenshots);out.mkdir(parents=True,exist_ok=True);records=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');page.set_default_timeout(8000)
 def ui():return page.evaluate('''()=>({step:document.querySelector('#tutorialCoach').dataset.stepKey,coach:document.querySelector('#tutorialCoach').innerText,toast:document.querySelector('#toast').innerText,location:document.querySelector('.hud-location').innerText,dialogs:[...document.querySelectorAll('dialog[open]')].map(e=>({id:e.id,mode:e.dataset.mode,text:e.innerText})),exits:[...document.querySelectorAll('.scene-exit')].map(e=>({id:e.dataset.id,text:e.innerText,disabled:e.getAttribute('aria-disabled')}))})''')
 def state():
  s=page.evaluate('localStorage.getItem("ember-vault-tutorial-progress-v1")');x=json.loads(s)
  return x['progress']['state']
 def record(label):
  s=state();x=ui();x.update(label=label,turn=s['turn'],hp=s['hp'],gold=s['gold'],pos=s['pos'],noise=s['noise'],countdown=s['countdown'],resource=s['resource'],pursuits=s['pursuits']);records.append(x);(out/'actions.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n');page.screenshot(path=str(out/(label+'.png')));print(label,x['step'],x['pos'],x['hp'],x['resource'],flush=True)
 def settle():
  quiet=0
  for _ in range(180):
   page.wait_for_timeout(100)
   if page.locator('#cutscene[open]').count():page.locator('.cut-skip').tap();quiet=0
   elif page.locator('#noiseMoment[open] [data-judge=draw]').count():page.locator('[data-judge=draw]').tap();quiet=0
   elif page.locator('#noiseMoment[open] [data-noise=skip]').count():page.locator('[data-noise=skip]').tap();quiet=0
   elif page.locator('#poolReveal[open]').count():page.locator('[data-reveal=skip]').tap();quiet=0
   else:
    quiet+=1
    if quiet>=8:return
  raise Exception('Animations did not settle')
 def act(sel):page.locator(sel).tap();settle()
 def move(i):act(f'.scene-exit[data-id="{i}"]')
 page.goto(args.base_url.rstrip('/')+'/dist/?v=20261107a&tutorial=1',wait_until='networkidle');page.locator('#tutorialAudio').uncheck();act('[data-act=tutorialStart]');record('01-start')
 move(1);act('#sceneTarget');act('#mapToggle');record('02-sound-map');act('[data-act=tutorialContinue]');act('#hideAction');record('03-lure-before')
 act('#lureToggle');move(5);record('05-prescribed-bait-preview');act('[data-act=lureConfirm]');act('#endTurn');record('06-lure-result')
 move(2);move(6);move(7);act('#marketToggle');record('07-shop-before-buy');act('[data-card=spark]');record('08-purchased-not-drawn');act('#endTurn');record('09-new-draw')
 move(11);record('10-optional-chest-decision');act('#sceneTarget');record('11-opened-optional-chest');move(10);act('#sceneTarget');act('[data-act=skipReward]');act('#sceneTarget');act('#mapToggle');record('12-return-forecast');act('[data-act=tutorialContinue]');record('13-return-choice')
 assert page.locator('.coach-target').count()==0
 assert '4칸' not in page.locator('#tutorialCoach').inner_text()
 assert page.locator('[data-act=tutorialHelp]').get_attribute('aria-pressed')=='false'
 act('#lureToggle');move(11)
 # Intention: use what the first chapter taught me to pull the guard off the short path.
 record('14-return-lure-preview')
 assert page.locator('#modal[open][data-mode=lurePreview]').count()
 preview=page.locator('#modalContent').inner_text()
 assert '파편 회랑' in preview and '이끼 회랑' in preview,preview
 before=state();act('[data-act=lureConfirm]');after=state()
 assert after['resource']['skill']==before['resource']['skill']-1
 record('15-lure-confirmed')
 act('#endTurn');record('16-waited-guard-move')
 after_turn=state()
 assert any(x['from']==6 and x['to']==7 for x in after_turn['pursuits']),after_turn['pursuits']
 assert after_turn['rooms'][6]['enemy'] is None
 for i in [6,2,1,0]:
  if page.locator(f'.scene-exit[data-id="{i}"]').get_attribute('aria-disabled')!='false':act('#endTurn')
  move(i);record(f'17-return-room-{i}')
 act('#sceneTarget');record('18-independent-lure-escape')
 act('#tutorialCoach [data-act=tutorialExit]');page.screenshot(path=str(out/'19-recap.png'))
 recap=page.locator('#modalContent').inner_text();records.append({'label':'recap','text':recap})
 assert '직접 선택해 완주한 귀환' in recap,recap
 assert '유물 하나' in recap and '귀환' in recap
 assert any(x in recap for x in ['유인','파수병','우회']),recap
 (out/'actions.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n');print('PASS',recap,flush=True);b.close()
