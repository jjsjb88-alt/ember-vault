#!/usr/bin/env python3
"""Play the narrative handoff through the real UI; never inject a run, RNG or storage.

Serve the repository root and install Python Playwright + /usr/bin/chromium.
390 uses animated draws; 360/740 cover reduced motion. Evidence goes to /tmp.
"""
import argparse
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('width',type=int,choices=[360,390,740])
parser.add_argument('--base-url',default='http://127.0.0.1:8037')
args=parser.parse_args()
w=args.width;h={360:640,390:844,740:320}[w];reduced=w!=390
out=Path(f'/tmp/ember-v97-story-{w}');out.mkdir(exist_ok=True)
SAVE='ember-vault-save-v2';BEST='ember-vault-best-v1';PROGRESS='ember-vault-tutorial-progress-v1'
report=dict(viewport=[w,h],reduced_motion=reduced,scope='Local Chromium touch emulation, real UI and read-only storage. Not human learning or hardware testing.',scenes=[],checks=[],errors=[],http_errors=[])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,reduced_motion='reduce' if reduced else 'no-preference')
 page.set_default_timeout(10000)
 page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.on('response',lambda r:report['http_errors'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 def storage(key):return page.evaluate('(key)=>localStorage.getItem(key)',key)
 def state():return json.loads(storage(PROGRESS))['progress']['state']
 def check(name,**evidence):report['checks'].append(dict(name=name,**evidence));print(name,flush=True)
 def shot(name):page.screenshot(path=str(out/(name+'.png')))
 def tap(sel):page.locator(sel).tap()
 def geometry(sel):
  return page.locator(sel).evaluate('''e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,viewport:innerWidth,screenHeight:innerHeight,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}}''')
 def fits(sel):
  r=geometry(sel)
  assert r['width']>0 and r['height']>0 and r['x']>=-1 and r['y']>=-1 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,r
  assert r['scrollWidth']<=r['clientWidth']+1,r
  return r
 def read_scene(label):
  page.wait_for_selector('#cutscene[open]');lines=[]
  while page.locator('#cutscene[open]').count():
   page.wait_for_function('!document.querySelector(".cut-more").hidden')
   line=dict(who=page.locator('.cut-name').inner_text(),line=page.locator('.cut-line').inner_text(),geometry=fits('.cut-line'))
   lines.append(line)
   if label in ['prologue','purchase','remembered-archer'] and (len(lines)==7 if label=='prologue' else len(lines)==3 if label=='purchase' else len(lines)==1):shot(label)
   tap('.cut-line');page.wait_for_timeout(60)
  report['scenes'].append(dict(label=label,lines=lines));return lines
 def settle():
  quiet=0
  for _ in range(180):
   page.wait_for_timeout(100)
   if page.locator('#cutscene[open]').count():tap('.cut-skip');quiet=0
   elif page.locator('#noiseMoment[open] [data-judge=draw]').count():tap('[data-judge=draw]');quiet=0
   elif page.locator('#noiseMoment[open] [data-noise=skip]').count():tap('[data-noise=skip]');quiet=0
   elif page.locator('#poolReveal[open]').count():tap('[data-reveal=skip]');quiet=0
   else:
    quiet+=1
    if quiet>=6:return
  raise AssertionError('Transient animation did not settle')
 def act(sel):tap(sel);settle()
 def stage(key):page.wait_for_function('(key)=>document.querySelector("#tutorialCoach").dataset.stepKey===key',arg=key)
 def move(i):act(f'.scene-exit[data-id="{i}"]')
 def travel(i):
  for _ in range(6):
   if page.locator(f'.scene-exit[data-id="{i}"]').get_attribute('aria-disabled')=='false':move(i);return
   act('#endTurn')
  raise AssertionError(f'Unable to travel to {i}')
 try:
  page.goto(args.base_url+'/dist/?v=20261107b&tutorial=1',wait_until='networkidle')
  original=storage(SAVE);best=storage(BEST);page.locator('#tutorialAudio').uncheck();tap('[data-act=tutorialStart]')
  read_scene('prologue');settle();stage('warehouse')
  check('prologue-lines-visible',main_unchanged=storage(SAVE)==original)
  move(1);act('#sceneTarget');act('#mapToggle');act('[data-act=tutorialContinue]');act('#hideAction')
  act('#lureToggle');move(5);act('[data-act=lureConfirm]');act('#endTurn')
  move(2);move(6);move(7);before_meeting=state();tap('#marketToggle');read_scene('meeting');settle()
  assert {k:v for k,v in state().items() if k!='tradeStory'}=={k:v for k,v in before_meeting.items() if k!='tradeStory'}
  before_buy=state();tap('[data-card=spark]');read_scene('purchase');settle();stage('draw-recruit')
  after_buy=state();assert after_buy['resource']['skill']==before_buy['resource']['skill']-3
  assert after_buy['resource']['sword']==before_buy['resource']['sword']==2
  assert after_buy['discard'].count('spark')==before_buy['discard'].count('spark')+1
  assert '작은 주머니' not in page.locator('#tutorialCoach').inner_text()
  shot('cold-arrow');check('purchase-only-binds-cold-memory',skill_spent=3,attack_before=2,attack_after=2)
  # Reload only naturally earned, already committed progress. No storage writes.
  page.reload(wait_until='networkidle');tap('[data-act=tutorialResume]');settle();stage('draw-recruit');assert state()==after_buy
  tap('#endTurn');page.wait_for_selector('#poolReveal[open]')
  snapshots=[];saw_spark=False;summary_seen=False;deadline=time.monotonic()+25
  while page.locator('#poolReveal[open]').count():
   snapshot=page.locator('#poolReveal').evaluate('''e=>{const t=s=>e.querySelector(s).textContent;return {phase:e.dataset.phase,name:t('.reveal-name'),count:t('.reveal-count'),effect:t('.reveal-effect'),title:t('#revealTitle'),stakes:t('#revealStakes')}}''')
   phase=snapshot['phase'];name=snapshot['name'];count=snapshot['count'];effect=snapshot['effect']
   memory_visible='녹스가 맡긴' in count or '끝까지 겨눴던' in snapshot['stakes']
   if phase!='complete':
    if name=='불씨 화살':
     assert memory_visible
     if not saw_spark:
      assert snapshot['title']=='불씨 화살'
      # Keep the atomic snapshot as evidence: taking a screenshot can outlast
      # this short reveal and accidentally capture the following sealed token.
      fits('.reveal-count');fits('#revealTitle');fits('#revealStakes');saw_spark=True
    elif memory_visible:raise AssertionError(f'Memory revealed before its token: {phase}, {name}')
   elif memory_visible and not summary_seen:
    summary_seen=True
    assert '불씨 화살' in name
    assert snapshot['title']=='불씨 화살'
    fits('#revealTitle');fits('#revealStakes');fits('.reveal-count')
    assert page.locator('.reveal-orb-core [data-token=spark]').count()==1
    shot('archer-reveal-summary')
   if not snapshots or snapshot!=snapshots[-1]:snapshots.append(snapshot)
   if page.locator('#poolReveal [data-reveal=skip]').inner_text()=='다음 봉인 →':tap('#poolReveal [data-reveal=skip]')
   page.wait_for_timeout(35)
   assert time.monotonic()<deadline
  report['reveal_snapshots']=snapshots
  if not reduced:assert saw_spark,'Animated reveal was not observed'
  assert any(x['phase']=='complete' and '끝까지 겨눴던' in x['effect'] for x in snapshots)
  read_scene('remembered-archer');settle();stage('approach')
  awakened=state();assert awakened['resource']['sword']==5 and 'spark' in awakened['played']
  check('real-redraw-then-memory-dialogue',attack=5,animated_spark_observed=saw_spark,redraw_same_after_reload=True)
  travel(11);travel(10);stage('attack');act('#sceneTarget');stage('reward');assert state()['rooms'][10]['enemy']['hp']==0
  act('[data-act=skipReward]');act('#sceneTarget');act('#mapToggle');act('[data-act=tutorialContinue]');stage('escape')
  act('#hideAction');travel(11);travel(7);act('#endTurn')
  for i in [3,2,1,0]:travel(i)
  act('#sceneTarget');assert state()['phase']=='won';act('#tutorialCoach [data-act=tutorialExit]');shot('recap')
  assert page.locator('#modal').get_attribute('data-mode')=='briefing'
  assert storage(SAVE)==original and storage(BEST)==best and storage(PROGRESS) is None
  check('complete-and-preserve-original',won=True,main_unchanged=True,best_unchanged=True)
  assert not report['errors'] and not report['http_errors'],report
  report['result']='PASS'
 except Exception as exc:
  report['result']='FAIL';report['failure']=str(exc);shot('FAIL');raise
 finally:
  (out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');browser.close()
print(json.dumps(dict(result=report['result'],viewport=[w,h])),flush=True)
