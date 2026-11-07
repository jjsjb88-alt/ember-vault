#!/usr/bin/env python3
"""Real UI checks of readable effects, contextual keywords and safe glossary return.

No game/RNG/storage injection. Local Chromium touch emulation, not hardware testing.
Requires Python Playwright and /usr/bin/chromium; serve the repo root separately.
"""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('width',type=int,choices=[360,390,740]);parser.add_argument('--base-url',default='http://127.0.0.1:8037');args=parser.parse_args()
w=args.width;h={360:640,390:844,740:320}[w];out=Path(f'/tmp/ember-v98-{w}');out.mkdir(exist_ok=True)
PROGRESS='ember-vault-tutorial-progress-v1';SAVE='ember-vault-save-v2';BEST='ember-vault-best-v1'
report=dict(viewport=[w,h],result='RUNNING',checks=[],errors=[],http_errors=[],request_failures=[])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 context=browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,reduced_motion='reduce');page=context.new_page();page.set_default_timeout(10000)
 page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.on('requestfailed',lambda r:report['request_failures'].append(r.url))
 page.on('response',lambda r:report['http_errors'].append(r.status) if r.status>=400 else None)
 def storage(key):return page.evaluate('(key)=>localStorage.getItem(key)',key)
 def state():return json.loads(storage(PROGRESS))['progress']['state']
 def tap(sel):page.locator(sel).tap()
 def shot(name):page.screenshot(path=str(out/(name+'.png')))
 def check(name,**data):report['checks'].append(dict(name=name,**data));print(name,flush=True)
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
    if quiet>=6:return
  raise AssertionError('Animations did not settle')
 def act(sel):tap(sel);settle()
 def move(i):act(f'.scene-exit[data-id="{i}"]')
 def fonts(selector,minimum):
  rows=page.locator(selector).evaluate_all('''es=>es.map(e=>({text:e.textContent.trim(),size:parseFloat(getComputedStyle(e).fontSize),width:e.clientWidth,scrollWidth:e.scrollWidth}))''')
  assert rows and all(r['size']>=minimum and r['scrollWidth']<=r['width']+1 for r in rows),rows
  return rows
 def glossary(back,escape=False):
  before=state();tap('[data-act=glossary]');assert page.locator('#modal').get_attribute('data-mode')=='glossary'
  text=page.locator('#modalContent').inner_text();assert all(word in text for word in ['은신','첫 소음','추가 추출','메아리','유물의 대가','14턴','3·6·9'])
  fonts('.keyword-list dd',16);shot('glossary-'+back)
  if escape:page.keyboard.press('Escape')
  else:tap('#modal .close-button')
  assert page.locator('#modal').get_attribute('data-mode')==back
  assert state()==before,'Reading glossary changed committed state'
 try:
  page.goto(args.base_url+'/dist/?v=20261107c&tutorial=1',wait_until='networkidle');original=storage(SAVE);best=storage(BEST);page.locator('#tutorialAudio').uncheck()
  if w==390:
   # Exercise the actual animated first token; the remaining touch route uses reduced motion.
   page.emulate_media(reduced_motion='no-preference');tap('[data-act=tutorialStart]')
   page.wait_for_selector('#cutscene[open]');tap('.cut-skip')
   page.wait_for_selector('#poolReveal[open][data-phase=revealed]')
   visible=page.locator('#poolReveal').evaluate('''e=>({phase:e.dataset.phase,title:e.querySelector('#revealTitle').textContent,name:e.querySelector('.reveal-name').textContent,effect:e.querySelector('#revealStakes').textContent,font:parseFloat(getComputedStyle(e.querySelector('#revealStakes')).fontSize)})''')
   assert visible['phase']=='revealed' and visible['title']==visible['name'] and '+' in visible['effect'] and visible['font']>=16,visible
   check('actual-animated-token-has-visible-name-and-effect',snapshot=visible)
   page.emulate_media(reduced_motion='reduce');settle()
  else:act('[data-act=tutorialStart]')
  assert page.locator('#poolDetails .pool-heading>strong').inner_text().startswith('능력 보기')
  assert page.locator('#poolDetails .pool-heading>strong').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=13
  act('#poolDetails');assert page.locator('#modal').get_attribute('data-mode')=='deck'
  effects=fonts('.deck-item .ability-effect',16);fonts('.deck-item .ability-effect b',20);fonts('.deck-item .ability-name',18)
  assert '첫 소음' in page.locator('.deck-list').inner_text() and '한 번 추가' in page.locator('.deck-list').inner_text()
  shot('large-medal-list');glossary('deck');tap('[data-act=deckPage][data-page="1"]');assert '숨죽이기' in page.locator('.deck-list').inner_text()
  assert '남은 양' in page.locator('.deck-list').inner_text();shot('quiet-context');glossary('deck',escape=True)
  assert '숨죽이기' in page.locator('.deck-list').inner_text();act('#modal .close-button')
  check('readable-current-medals',effects=effects,glossary_and_page_preserved=True)
  move(1);act('#sceneTarget');act('#mapToggle');act('[data-act=tutorialContinue]');act('#hideAction');act('#lureToggle');move(5);act('[data-act=lureConfirm]');act('#endTurn');move(2);move(6);move(7);act('#marketToggle')
  fonts('.market-card .ability-effect',16);fonts('.market-card .ability-name',18);fonts('.market-card .price',16)
  rect=page.locator('[data-card=spark] .price').evaluate('''e=>{const r=e.getBoundingClientRect(),d=e.closest('dialog').getBoundingClientRect();return {y:r.y,bottom:r.bottom,height:r.height,dialogBottom:d.bottom}}''')
  assert rect['height']>0 and rect['y']>=0 and rect['bottom']<=min(h,rect['dialogBottom']),rect
  shot('readable-nox-market');glossary('market',escape=True);assert page.locator('[data-card=spark]').is_enabled()
  check('shop-effects-price-and-safe-return',price=rect)
  act('[data-card=spark]');act('#endTurn');move(11);move(10);act('#sceneTarget')
  assert state()['pending']['type']=='reward';options=list(state()['pending']['options'])
  fonts('.ability-choice .ability-effect',16);fonts('.ability-choice .ability-name',18);shot('readable-reward')
  glossary('reward');assert state()['pending']['options']==options
  glossary('reward',escape=True);assert state()['pending']['options']==options
  check('reward-reading-never-selects',options_unchanged=True)
  act('[data-act=skipReward]');act('#sceneTarget');act('#mapToggle');act('[data-act=tutorialContinue]')
  act('#menuButton' if page.locator('#menuButton').count() else '[data-act=menu]');act('[data-act=glossary]')
  text=page.locator('#modalContent').inner_text();assert '지금은 첫 불씨 회수' in text and '2턴마다 1씩' in text
  shot('artifact-cost-explained');act('#modal .close-button');act('#modal .close-button')
  act('#hideAction');move(11);move(7);act('#endTurn')
  for i in [3,2,1,0]:
   if page.locator(f'.scene-exit[data-id="{i}"]').get_attribute('aria-disabled')!='false':act('#endTurn')
   move(i)
  act('#sceneTarget');assert state()['phase']=='won';act('#tutorialCoach [data-act=tutorialExit]');shot('completed')
  assert storage(SAVE)==original and storage(BEST)==best and storage(PROGRESS) is None
  check('tutorial-complete-and-original-protected',won=True)
  page.goto(args.base_url+'/dist/artbook.html?v=20261107c',wait_until='networkidle')
  assert page.locator('.memory-card').count()==24;fonts('.memory-card .ability-effect',16)
  tap('[data-memory=echo]');assert page.locator('#detail[open]').count();fonts('#detailBody .ability-effect',16)
  text=page.locator('#detailBody').inner_text()
  assert '추가 추출' in text and '한 번 추가' in text and '자동 합산' in text
  shot('artbook-keyword-detail');tap('#closeDetail');assert storage(SAVE)==original and storage(BEST)==best
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  check('all-24-artbook-effects-and-keywords',cards=24,main_unchanged=True)
  assert not report['errors'] and not report['http_errors'] and not report['request_failures'],report
  report['result']='PASS'
 except Exception as exc:
  report.update(result='FAIL',failure=str(exc));shot('FAIL');raise
 finally:
  (out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');browser.close()
print(json.dumps(dict(result=report['result'],viewport=[w,h])),flush=True)
