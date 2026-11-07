#!/usr/bin/env python3
"""Play a full four-stage expedition through actual touch controls.
No game/RNG/storage injection. State is read only to choose legal actions and
compare committed progress across a real reload. These are scripted route and
layout checks, not human learning or hardware certification.
"""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('width',type=int,choices=[360,390,740]);p.add_argument('--base-url',default='http://127.0.0.1:8037');args=p.parse_args()
w=args.width;h={360:640,390:844,740:320}[w];role={360:'knight',390:'rogue',740:'mage'}[w]
out=Path(f'/tmp/ember-v10-{w}');out.mkdir(exist_ok=True)
KEY='ember-vault-save-v2';report=dict(viewport=[w,h],role=role,result='RUNNING',actions=[],checks=[],errors=[],http_errors=[],request_failures=[])
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,reduced_motion='reduce');page.set_default_timeout(9000)
 page.on('pageerror',lambda e:report['errors'].append(str(e)))
 page.on('requestfailed',lambda r:report['request_failures'].append(r.url))
 page.on('response',lambda r:report['http_errors'].append(dict(url=r.url,status=r.status)) if r.status>=400 else None)
 def saved():return page.evaluate('(k)=>localStorage.getItem(k)',KEY)
 def state():return json.loads(saved())
 def tap(sel):page.locator(sel).tap()
 def shot(name):page.screenshot(path=str(out/(name+'.png')))
 def check(name,**data):report['checks'].append(dict(name=name,**data));print(name,flush=True)
 def snap(a):
  s=state();report['actions'].append(dict(action=a,pos=s['pos'],turn=s['turn'],hp=s['hp'],noise=s['noise'],pool=len(s['deck'])+len(s['discard'])+len(s['played']),prepared=s['stagePrepared'],trades=s['stageTrades'],provisions=s['provisions'],resource=s['resource'],phase=s['phase']))
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
  raise AssertionError('Transient UI did not settle')
 def act(sel):tap(sel);settle();snap(sel)
 def close_dialogs():
  for _ in range(4):
   if not page.locator('#modal[open]').count():return
   act('#modal .close-button')
  raise AssertionError('Modal did not close')
 def mode(id):
  if state()['mode']!=id:act('#stanceToggle');act(f'[data-act=mode][data-id={id}]')
 def supply():
  s=state()
  if s['hp']<=s['maxHp']-6 and s['provisions']>0 and s['provisionTurn']!=s['turn']:
   before=s['provisions'];act('#provisionAction');assert state()['provisions']==before-1
 def resolve():
  for _ in range(16):
   s=state();assert s['phase']=='playing',s.get('reason')
   if s['pending']:act('[data-act=skipReward]');continue
   if not (s['rooms'][s['pos']]['enemy'] and s['rooms'][s['pos']]['enemy']['hp']>0):return
   supply();s=state();act('#sceneTarget' if s['resource']['sword'] else '#endTurn')
  raise AssertionError('Combat did not finish')
 def move(id):
  for _ in range(15):
   resolve();supply();mode('sneak');sel=f'.scene-exit[data-id="{id}"]'
   if page.locator(sel).get_attribute('aria-disabled')!='false':mode('walk')
   if page.locator(sel).get_attribute('aria-disabled')=='false':act(sel);assert state()['pos']==id;return
   assert '준비 후 이동' not in page.locator(sel).get_attribute('aria-label'),'Missing mandatory preparation'
   act('#endTurn')
  raise AssertionError(f'Unable to move to {id}')
 def camp(index,choice='recruit'):
  before=state();nextid=[6,11,17][index];button=f'.scene-exit[data-id="{nextid}"]'
  assert page.locator(button).get_attribute('aria-disabled')=='true'
  assert page.locator(button).is_disabled();assert state()==before
  act('#sceneTarget');assert page.locator('#modal').get_attribute('data-mode')=='stageCamp'
  assert page.locator('.stage-services>button').count()==3;shot(f'checkpoint-{index+1}-choices')
  if choice=='recruit':
   act('[data-act=stageRecruit]');assert page.locator('.stage-offer').count()==3
   assert all(x>=16 for x in page.locator('.stage-offer .ability-effect').evaluate_all('es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize))'))
   tap(f'[data-act=prepare][data-choice=recruit][data-id="{["spark","blade",("ghost" if w==740 else "fury")][index]}"]')
  elif choice=='refine':
   act('[data-act=prepare][data-choice=refine]');pending=state()['pending'];committed=saved()
   page.reload(wait_until='networkidle');assert saved()==committed;assert state()['pending']==pending;assert page.locator('#modal').get_attribute('data-mode')=='purge'
   act('[data-act=cancelPurge]');assert state()['stagePrepared'][index] is None
   act('[data-act=prepare][data-choice=refine]');tap('[data-act=purge][data-id=slash]')
  else:tap('[data-act=prepare][data-choice=resupply]')
  committed=saved();after=state();assert after['stagePrepared'][index]==choice
  count_before=len(before['deck'])+len(before['discard'])+len(before['played']);count_after=len(after['deck'])+len(after['discard'])+len(after['played'])
  assert count_after==count_before+(1 if choice=='recruit' else -1 if choice=='refine' else 0)
  if choice=='resupply':assert after['provisions']==before['provisions']+1
  if index==0:
   # Actual reload during the committed handoff, without rewriting storage.
   page.reload(wait_until='networkidle');settle();assert saved()==committed
   act('#sceneTarget')
  else:settle()
  assert not page.locator('.stage-services').count();shot(f'checkpoint-{index+1}-prepared')
  assert state()['stagePrepared'][index]==choice
  if state()['stageTrades'][index]==0:
   act('#modal [data-act=market]');assert page.locator('#modal').get_attribute('data-mode')=='market'
   affordable=page.locator('#market .market-card:not(:disabled)')
   if affordable.count():
    cards=affordable.evaluate_all('es=>es.map(e=>e.dataset.card)')
    wanted=next((x for x in ['fury','blade','spark','scout','acrobat','wisdom'] if x in cards),cards[0]);act(f'[data-card="{wanted}"]')
    assert state()['stageTrades'][index]==1;assert page.locator('#market .market-card:not(:disabled)').count()==0
   close_dialogs()
  else:close_dialogs()
  check('checkpoint-prepared',index=index+1,choice=choice,pool=count_after,reload_did_not_duplicate=index==0)
 try:
  page.goto(args.base_url+'/dist/?v=20261107e',wait_until='networkidle');act('[data-act=tutorialSkip]')
  # Select a role through the normal new-expedition confirmation.
  act('[data-act=menu]');act('[data-act=new]');act(f'[data-act=role][data-id={role}]');act('[data-act=start]')
  s=state();assert s['gimmicksVersion']==1;assert s['layout']=='staged' and s['role']==role and s['stagePrepared']==[None,None,None]
  assert len([r for r in s['rooms'] if r['type']=='relic'])==1 and s['rooms'][19]['relic']['name']=='용의 기억'
  assert page.locator('#marketToggle').is_disabled();assert not page.locator('#provisionAction').is_hidden()
  assert all(x>=44 for x in page.locator('.field-tools>button:visible').evaluate_all('es=>es.map(e=>e.getBoundingClientRect().width)'))
  act('[data-act=menu]');act('[data-act=stagePlan]');assert all(x in page.locator('#modalContent').inner_text() for x in ['상층','중층','하층','심층','용의 기억']);shot('four-stage-plan');close_dialogs()
  move(1);act('#sceneTarget');move(5);camp(0,'resupply' if w==740 else 'recruit')
  if w==360:
   act('#sceneTarget');assert page.locator('[data-act=buyKey]').is_enabled();act('[data-act=buyKey]');assert state()['hasKey'];close_dialogs()
  move(6)
  # A real preview must not spend anything, including a stance comparison.
  before=saved();act('[data-act=menu]');act('#modal [data-act=passageGuide]');act('[data-act=guideMode][data-id=sneak]');assert saved()==before
  assert '검문 통로' in page.locator('#modalContent').inner_text();shot('passage-guide-guard');close_dialogs()
  if w==390:
   move(2);assert state()['crystalStopTurn']==state()['turn'];act('#sceneTarget');assert state()['hasKey'];shot('crystal-key')
   assert page.locator('.scene-exit[data-id="3"]').get_attribute('aria-disabled')=='true';act('#endTurn');move(3);resolve()
  move(7);camp(1,'recruit')
  move(11)
  if w==360:
   move(10);resolve();move(9);assert not state()['keyDoorOpen'];before=saved();act('[data-act=menu]');act('#modal [data-act=passageGuide]');assert saved()==before;shot('key-shortcut-preview');close_dialogs()
  else:
   move(15);before=state();assert page.locator('.scene-exit[data-id="19"]').get_attribute('aria-disabled')=='true';assert page.locator('.scene-exit[data-id="19"]').is_disabled();assert state()==before;move(14);act('#sceneTarget');assert state()['sluiceOpen'];shot('sluice-open')
  move(13);camp(2)
  if w==360:assert state()['keyDoorOpen']
  committed=saved();act('#mapToggle');shot('lower-full-map');act('#soundPanel [data-act=passageGuide]');assert saved()==committed;shot('lower-map-guide');close_dialogs();act('#mapToggle')
  move(17)
  if True:
   for _ in range(7):
    if state()['resource']['skill']>=3:break
    supply();act('#endTurn')
   assert state()['resource']['skill']>=3
   act('#sceneTarget');assert state()['rooms'][17]['used'];assert page.locator('.scene-exit[data-id="5"]').count()==1
   shot('real-return-lift')
   if w==740:
    move(16)
    for _ in range(20):
     supply();s=state()
     if s['resource']['quiet']<3 and s['resource']['move']>=1 and s['hideTurn']!=s['turn']:act('#hideAction')
     s=state()
     if s['resource']['quiet']>=3 and s['resource']['skill']>=2:break
     act('#endTurn')
    s=state();assert s['resource']['quiet']>=3 and s['resource']['skill']>=2
    act('#sceneTarget');assert page.locator('#modal').get_attribute('data-mode')=='conduit';shot('quiet-conduit-before');act('[data-act=quietSeal]');assert state()['sealQuiet'] and not state()['sealForce'];shot('quiet-conduit-open');close_dialogs();move(19)
   else:move(18);resolve();assert state()['sealForce'];move(19)
  assert state()['rooms'][state()['pos']]['stage']==3;shot('deep-guardian');resolve();act('#sceneTarget')
  assert state()['relic']['name']=='용의 기억' and state()['countdown']==14 and state()['stagePrepared'].count(None)==0;shot('deep-relic-recovered')
  committed=saved();page.reload(wait_until='networkidle');settle();assert saved()==committed and state()['relic']['name']=='용의 기억'
  for room in ([16,17,5,1,0] if w==740 else [18,17,5,1,0] if state()['rooms'][17]['used'] else [15,11,7,6,5,1,0]):move(room)
  resolve();act('#sceneTarget');assert state()['phase']=='won';assert page.locator('#modal').get_attribute('data-mode')=='result'
  text=page.locator('#modalContent').inner_text();assert '진행 효율' in text and '소음 관리' in text and '심층 유물' in text
  shot('full-expedition-result');end=state();report['outcome']={k:end[k] for k in ['seed','turn','hp','score','noiseMade','stagePrepared','stageTrades','provisions','hasKey','keyDoorOpen','sluiceOpen','sealForce','sealQuiet']}
  check('four-stages-deep-relic-and-return-complete',**report['outcome'])
  assert not report['errors'] and not report['http_errors'] and not report['request_failures'],report
  report['result']='PASS'
 except Exception as e:report.update(result='FAIL',failure=str(e));shot('FAIL');raise
 finally:(out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');b.close()
print(json.dumps(dict(result=report['result'],width=w)),flush=True)
