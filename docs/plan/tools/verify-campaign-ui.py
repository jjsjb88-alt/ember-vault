#!/usr/bin/env python3
"""Fresh mobile campaign play, including generated rooms and unlocked pools. No game state, seed or storage injection.
A deterministic normal-action policy supplies legal controls after reading the
browser's randomly generated seed. This is not a human novice or hardware test.
"""
import argparse,json,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('width',type=int,choices=[360,390,740,800]);parser.add_argument('--base-url',default='http://127.0.0.1:8038');parser.add_argument('--language',choices=['ko','en','ja'],default='ko');args=parser.parse_args();w=args.width;h={360:640,390:844,740:320,800:360}[w];role={360:'mage',390:'knight',740:'rogue',800:'rogue'}[w];quiet=w!=360;repo=Path(__file__).resolve().parents[3];out=Path(f'/tmp/ember-campaign-ui-{w}'+('' if args.language=='ko' else '-'+args.language));out.mkdir(exist_ok=True);report=dict(viewport=[w,h],role=role,policy='managed-stealth',result='RUNNING',errors=[],http_errors=[],request_failures=[],checks=[]);KEY='ember-vault-save-v2'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,reduced_motion='reduce');page.set_default_timeout(8000)
 page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('response',lambda r:report['http_errors'].append(r.status) if r.status>=400 else None);page.on('requestfailed',lambda r:report['request_failures'].append(r.url))
 def state():return json.loads(page.evaluate('(k)=>localStorage.getItem(k)',KEY))
 def tap(s):page.locator(s).tap()
 def settle():
  wait=0
  for _ in range(160):
   page.wait_for_timeout(100)
   if page.locator('#cutscene[open]').count():tap('.cut-skip');wait=0
   elif page.locator('#noiseMoment[open] [data-judge=draw]').count():tap('[data-judge=draw]');wait=0
   elif page.locator('#noiseMoment[open] [data-noise=skip]').count():tap('[data-noise=skip]');wait=0
   elif page.locator('#poolReveal[open]').count():tap('[data-reveal=skip]');wait=0
   else:
    wait+=1
    if wait>=10:return
  raise AssertionError('Transient UI did not settle')
 def act(s):tap(s);settle()
 def shot(name):page.screenshot(path=str(out/(name+'.png')))
 def close():
  for _ in range(5):
   if not page.locator('#modal[open]').count():return
   act('#modal .close-button')
  raise AssertionError('Modal did not close')
 try:
  page.goto(args.base_url+'/dist/?v=20261111b',wait_until='networkidle');act('[data-act=tutorialSkip]');
  if args.language!='ko':
   act('[data-act=menu]');act('[data-act=settings]');page.select_option('#prefLanguage',args.language);act('[data-act=applySettings]');page.wait_for_timeout(300);close()
  act('[data-act=menu]');act('#modal [data-act=new]');act(f'[data-act=role][data-id={role}]');act('[data-act=start]');s=state();assert s['riskVersion']==1 and s['healingUsed']==0
  # The policy does not inspect hidden draws or branch on seed numbers.
  script="import {playCampaign} from './docs/plan/tools/campaign-bot.mjs';import {unlocks,freshProfile} from './dist/progression.js';const u=unlocks(freshProfile());const r=playCampaign("+str(s['seed'])+",{role:'"+role+"',axis:'stealth',unlockedCards:u.cards,unlockedKeepsakes:u.keepsakes,capture:true});console.log(JSON.stringify({actions:r.actions,state:r.state,trace:r.trace}));"
  expected=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=repo,text=True));report['seed']=s['seed'];report['expected_outcome']=expected['state']['phase'];assert expected['state']['phase']!='playing'
  shown=set()
  for i,a in enumerate(expected['actions']):
   report['action_index']=i;report['last_action']=a;
   if i%20==0:print('action',i,flush=True)
   t=a['type'];s=state()
   if t not in ['skipReward','reward','keepsake','skipKeepsake','ending']:close()
   if t=='mode':act('#stanceToggle');act(f'[data-act=mode][data-id="{a["id"]}"]')
   elif t=='move':
    sel=f'.scene-exit[data-id="{a["id"]}"]';assert page.locator(sel).get_attribute('aria-disabled')=='false';act(sel);assert state()['pos']==a['id']
   elif t=='prepare':
    act('#sceneTarget');assert '남은 회복' in page.locator('#modalContent').inner_text() if s['stagePrepared'][s['rooms'][s['pos']]['stage']] else True
    shot('stage-preparation');act('[data-act=stageRecruit]');act(f'[data-act=prepare][data-id="{a["id"]}"]');close()
   elif t=='buy':act('#marketToggle');act(f'#market [data-act=buy][data-index="{a["index"]}"]');close()
   elif t=='lure':act('#lureToggle');act(f'.scene-exit[data-id="{a["id"]}"]');act('[data-act=lureConfirm]')
   elif t=='buyKeepsake':
    act('#sceneTarget');page.locator('.artifact-shop summary').click();act(f'[data-act=buyKeepsake][data-index="{a["index"]}"]');close()
   elif t=='quietSeal':act('#sceneTarget');shot('conduit-preview');act('[data-act=quietSeal]');close()
   elif t=='interact' and s['pos']==s['worldSites'][16]:act('#sceneTarget');shot('conduit-recovery');act('[data-act=conduitRest]');close()
   elif t in ['interact','attack','sluice']:act('#sceneTarget')
   elif t=='end':act('#endTurn')
   elif t=='hide':act('#hideAction')
   elif t=='provision':
    title=page.locator('#provisionAction').get_attribute('title');assert title;act('#provisionAction')
   elif t in ['reward','keepsake','ending']:act(f'[data-act={t}][data-id="{a["id"]}"]')
   elif t in ['skipReward','skipKeepsake']:act(f'[data-act={t}]')
   else:raise AssertionError('Unknown action '+str(a))
   now=state();assert 0<=now['healingUsed']<=12
   for k in ['pos','turn','hp','noise','resource','rng','played','deck','soundSeq']:
    assert now[k]==expected['trace'][i][k],('Action mismatch',i,a,k,now[k],expected['trace'][i][k])
   if now['noise']>=5 and now['noise']<8 and 'alert' not in shown:shot('intermediate-alert');shown.add('alert')
   if now['pos']==19 and 'deep' not in shown:shot('deep-guardian');shown.add('deep')
  after=state();end=expected['state']
  for k in ['phase','turn','pos','hp','noise','rng','healingUsed','stagePrepared','deck','played','discard','provisions','sealQuiet','sealForce','soundSeq']:assert after[k]==end[k],(k,after[k],end[k])
  assert page.locator('#modal').get_attribute('data-mode')=='result';shot('outcome');report['translationBeforeReload']=page.evaluate("async()=>(await import('./i18n.js?v=20261111b')).translationStatus()");committed=page.evaluate('(k)=>localStorage.getItem(k)',KEY);page.reload(wait_until='networkidle');settle();assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)==committed
  report['translation']=page.evaluate("async()=>(await import('./i18n.js?v=20261111b')).translationStatus()");report['outcome']={k:after[k] for k in ['phase','hp','turn','reason','healingUsed','noiseMade']};report['checks']=['new-campaign-profile','mapped-routes-and-checkpoints','normal-action-policy-match','state-and-rng-match','reload-preserves-result'];assert not report['errors'] and not report['http_errors'] and not report['request_failures'],report;report['result']='PASS';print(report['outcome'],flush=True)
 except Exception as e:report.update(result='FAIL',failure=str(e));shot('FAIL');raise
 finally:(out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');b.close()
