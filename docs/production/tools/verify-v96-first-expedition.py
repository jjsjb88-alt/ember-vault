#!/usr/bin/env python3
"""V9.6 first real expedition handoff checks: real clicks/taps, maps, lure confirmation, and resume.

Requires Python 3.10+, `pip install playwright`, and Chromium. Serve the repo
separately: python3 -m http.server 8015 --bind 127.0.0.1 --directory .
Then: python3 docs/production/tools/verify-v96-first-expedition.py portrait-resume
Use --base-url, --browser-path, and --screenshots to change the defaults.
Reports are /tmp/ember-review-v96-firstmission-final-<case>-result.json; failures exit nonzero.

Normal cases never inject a game or manipulate RNG. They only read the game's
localStorage snapshots to compare committed state across reload/confirmation.
The storage-guards case explicitly injects malformed tutorial storage and a
write failure in isolated contexts. Mobile cases emulate Chromium touch and
viewport dimensions; they are not hardware Safari/Android certification.
"""
import argparse
import json
import time
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

CASES = {
    'portrait-resume': (390, 844, False, True),
    'compact-map': (360, 640, True, True),
    'landscape-map': (740, 320, True, True),
    'desktop-map': (1280, 720, True, False),
    'normal-lure': (390, 844, True, True),
    'normal-market': (390, 844, True, True),
    'storage-guards': (390, 844, True, True),
}
SAVE = 'ember-vault-save-v2'
BEST = 'ember-vault-best-v1'
PROGRESS = 'ember-vault-tutorial-progress-v1'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('case', choices=CASES)
parser.add_argument('--base-url', default='http://127.0.0.1:8015')
parser.add_argument('--browser-path', default='/usr/bin/chromium')
parser.add_argument('--screenshots', default='/tmp/ember-review-v96-firstmission-final-qa')
args = parser.parse_args()
w, h, reduced, touch = CASES[args.case]
ROOT = args.base_url.rstrip('/')
BASE = ROOT + '/dist/'
shots = Path(args.screenshots)
shots.mkdir(parents=True, exist_ok=True)
report = dict(case=args.case, viewport=[w,h], reduced_motion=reduced, touch=touch,
              actions=[], checks=[], screenshots=[], errors=[], request_failures=[], http_errors=[])

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.browser_path, headless=True,
                               args=['--no-sandbox','--disable-dev-shm-usage'])
    context = browser.new_context(viewport={'width':w,'height':h}, is_mobile=touch,
                                  has_touch=touch, device_scale_factor=1,
                                  reduced_motion='reduce' if reduced else 'no-preference')
    page = context.new_page()
    page.set_default_timeout(7000)
    page.on('pageerror', lambda e: report['errors'].append(str(e)))
    page.on('requestfailed', lambda r: report['request_failures'].append(dict(url=r.url,error=r.failure)))
    page.on('response', lambda r: report['http_errors'].append(dict(url=r.url,status=r.status)) if r.status>=400 else None)

    def storage(key):
        return page.evaluate('(key)=>localStorage.getItem(key)', key)

    def progress():
        data = json.loads(storage(PROGRESS))
        # Accommodate the helper envelope without reading any private app state.
        for key in ['progress','payload','data']:
            if 'state' not in data and isinstance(data.get(key),dict):
                data = data[key]
        assert 'state' in data and 'index' in data, data.keys()
        return data

    def run_state():
        return progress()['state'] if storage(PROGRESS) else json.loads(storage(SAVE))

    def ui():
        return page.evaluate('''()=>{const t=s=>document.querySelector(s)?.innerText||'';return {
          step:document.querySelector('#tutorialCoach')?.dataset.stepKey,location:t('.hud-location'),
          coach:t('#tutorialCoach'),enemy:t('#enemyOverlay'),map:document.querySelector('#mapToggle')?.getAttribute('aria-expanded'),
          resources:t('.combat-bar'),dialogs:[...document.querySelectorAll('dialog[open]')].map(e=>({id:e.id,mode:e.dataset.mode,text:e.innerText}))};}''')

    def activate(selector,index=None):
        el = page.locator(selector)
        if index is not None: el = el.nth(index)
        el.tap() if touch else el.click()

    def settle():
        quiet = 0
        for _ in range(130):
            page.wait_for_timeout(100)
            if page.locator('#cutscene[open]').count():
                activate('.cut-skip'); quiet=0
            elif page.locator('#noiseMoment[open] [data-judge="draw"]').count():
                activate('[data-judge="draw"]'); quiet=0
            elif page.locator('#noiseMoment[open] [data-noise="skip"]').count():
                activate('[data-noise="skip"]'); quiet=0
            elif page.locator('#poolReveal[open]').count():
                activate('[data-reveal="skip"]'); quiet=0
            else:
                quiet += 1
                if quiet >= 10: return
        raise AssertionError('Transient animation did not settle')

    def action(selector,index=None):
        activate(selector,index); settle()
        report['actions'].append(dict(selector=selector,ui=ui()))

    def shot(name):
        path = shots/f'{args.case}-{name}.png'
        page.screenshot(path=str(path))
        report['screenshots'].append(str(path))

    def check(name,value):
        report['checks'].append(dict(name=name,evidence=value))
        print(json.dumps(dict(case=args.case,check=name,evidence=value),ensure_ascii=False),flush=True)

    def stage(key):
        page.wait_for_function('(key)=>document.querySelector("#tutorialCoach").dataset.stepKey===key',arg=key)

    def preserved():
        assert storage(SAVE)==original, 'Original main save changed'
        assert storage(BEST)==original_best, 'Original best score changed'

    def map_lesson(key,next_key):
        stage(key)
        action('#mapToggle')
        stage(key)
        assert page.locator('[data-act="tutorialContinue"]').is_visible()
        layout = page.evaluate('''()=>{const visible=e=>!!e&&getComputedStyle(e).display!=='none'&&!e.hidden&&e.getBoundingClientRect().height>0;
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
          return {reading:document.body.classList.contains('tutorial-map-reading'),coachVisible:visible(document.querySelector('#tutorialCoach')),
          spotlightVisible:visible(document.querySelector('.coach-spot')),lesson:rect(document.querySelector('#tutorialMapLesson')),
          canvas:rect(document.querySelector('#dungeon')),report:rect(document.querySelector('#soundPanel')),
          w:innerWidth,h:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight};}''')
        assert layout['reading'] and not layout['spotlightVisible'] and not layout['coachVisible'], layout
        assert layout['scrollW']<=w and layout['scrollH']<=h, layout
        lesson_text = page.locator('#tutorialMapLesson').inner_text()
        assert lesson_text.strip(), lesson_text
        if key=='forecast':
            assert page.locator('.breath-forecast').is_visible()
            geometry=page.evaluate('''()=>{const p=document.querySelector('#dangerPanel'),f=document.querySelector('.breath-forecast'),a=p.getBoundingClientRect(),b=f.getBoundingClientRect();return {panel:{top:a.top,bottom:a.bottom,scrollH:p.scrollHeight,clientH:p.clientHeight},forecast:{top:b.top,bottom:b.bottom},visibleInitially:b.top>=a.top&&b.bottom<=a.bottom};}''')
            check('forecast-panel-geometry',geometry)
        page.wait_for_timeout(500)
        stage(key)  # Merely looking/waiting must not mark the lesson complete.
        shot(key+'-reading')
        check(key+'-read-before-confirm',dict(layout=layout,text=lesson_text))
        action('#mapToggle'); stage(key)
        action('#mapToggle'); stage(key)
        if args.case=='portrait-resume':
            reload_resume(key+'-map')
            stage(key)
            assert ui()['map']=='true'
        action(f'[data-act="tutorialContinue"][data-id="{key}"]')
        stage(next_key)
        close_map()

    def close_map():
        if ui()['map']=='true': action('#mapToggle')

    def reload_resume(label,restart=False):
        before = progress()
        preserved()
        page.reload(wait_until='networkidle')
        page.wait_for_selector('[data-act="tutorialResume"]')
        assert page.locator('[data-act="tutorialRestart"]').is_visible()
        shot(label+'-resume-prompt')
        preserved()
        action('[data-act="tutorialRestart"]' if restart else '[data-act="tutorialResume"]')
        after = progress()
        preserved()
        if restart:
            assert after['index']==0 and after['state']['pos']==0 and after['state']['gold']==0, after
        else:
            assert after['state']==before['state'], ('Committed state changed after reload',label,before['state'],after['state'])
            assert after['index']==before['index'], ('Stage changed after reload',label,before['index'],after['index'])
            assert after.get('mapOpen')==before.get('mapOpen'), ('Map state changed',label)
        check('reload-'+label,dict(restart=restart,index=after['index'],pos=after['state']['pos'],turn=after['state']['turn'],gold=after['state']['gold'],pending=after['state']['pending'],rng_unchanged=restart or before['state']['rng']==after['state']['rng']))

    def lure_preview(destination,normal=False):
        action('#lureToggle')
        key = SAVE if normal else PROGRESS
        before_raw=storage(key)
        before=run_state()
        action(f'.scene-exit[data-id="{destination}"]')
        page.wait_for_selector('[data-act="lureConfirm"]')
        preview=page.locator('#modal').inner_text()
        assert storage(key)==before_raw, 'Opening lure preview mutated saved state'
        shot('lure-preview')
        action('[data-act="lureCancel"]')
        assert storage(key)==before_raw, 'Cancelling lure preview changed state/resources/RNG'
        assert run_state()==before
        check('lure-cancel-pure',dict(normal=normal,preview=preview))
        if not page.locator('#lureToggle').get_attribute('aria-pressed')=='true':
            action('#lureToggle')
        action(f'.scene-exit[data-id="{destination}"]')
        action('[data-act="lureConfirm"]')
        after=run_state()
        assert after['resource']['skill']==before['resource']['skill']-1
        assert after['lureTurn']==after['turn']
        check('lure-confirm-spent-once',dict(before_skill=before['resource']['skill'],after_skill=after['resource']['skill'],preview=preview))
        return preview,before,after

    def walk():
        if page.locator('#stanceLabel').inner_text()!='걷기':
            action('#stanceToggle'); action('[data-act="mode"][data-id="walk"]')

    def travel(room):
        close_map()
        for _ in range(8):
            exit=f'.scene-exit[data-id="{room}"]'
            if page.locator(exit).get_attribute('aria-disabled')=='false':
                action(exit); return
            s=run_state()
            if s['pending']:
                action('[data-act="skipReward"]')
            elif s['rooms'][s['pos']].get('enemy') and s['rooms'][s['pos']]['enemy']['hp']>0 and s['resource']['sword']>0:
                action('#sceneTarget')
            else:
                action('#endTurn')
            assert not page.locator('#modal[open] [data-act="tutorialRetry"]').count()
        raise AssertionError(f'Unable to travel to {room}')

    def start_first_practice():
        page.goto(ROOT+f'/?tutorial=1&qa95={args.case}#entry',wait_until='networkidle')
        assert page.url==BASE+f'?qa95={args.case}#entry'
        assert page.locator('[data-act="tutorialStart"]').is_visible()
        assert storage('ember-vault-tutorial-v1') is None
        if page.locator('#tutorialAudio').count(): page.locator('#tutorialAudio').uncheck()
        return storage(SAVE),storage(BEST)

    def tutorial_case():
        global original,original_best
        original,original_best=start_first_practice()
        action('[data-act="tutorialStart"]'); stage('warehouse')
        preserved()
        if args.case=='portrait-resume':
            action('.scene-exit[data-id="1"]'); stage('chest')
            reload_resume('restart-choice',restart=True); stage('warehouse')
        action('.scene-exit[data-id="1"]'); stage('chest')
        if args.case=='portrait-resume':
            activate('#sceneTarget')
            assert progress()['index']==2
            check('chest-committed-before-reload',ui())
            reload_resume('chest-commit')
        else:
            action('#sceneTarget')
        stage('sound')
        assert run_state()['rooms'][1]['used'] and run_state()['gold']==7
        map_lesson('sound','hush')
        action('#hideAction'); stage('lure')
        preview,before,after=lure_preview(5)
        assert '파편 회랑' in preview and '부서진 무기고' in preview,preview
        stage('wait-lure')
        assert after['rooms'][6]['enemy']['home']==6 and not after['rooms'][5]['enemy']
        action('#endTurn'); stage('pass-junction')
        s=run_state()
        assert s['rooms'][6]['enemy'] is None and s['rooms'][5]['enemy']['home']==6,s['pursuits']
        action('.scene-exit[data-id="2"]'); stage('pass-guard')
        label=page.locator('.scene-exit[data-id="6"]').inner_text()
        assert '전투' not in label,label
        action('.scene-exit[data-id="6"]'); stage('refuge')
        assert not ui()['enemy'] and run_state()['hp']==22
        check('empty-corridor',dict(exit_label=label,ui=ui()))
        shot('empty-corridor')
        action('.scene-exit[data-id="7"]'); stage('recruit')
        assert run_state()['rooms'][7]['host']=='nox'
        shot('nox-in-dungeon')
        before_meeting=progress()['state']
        assert page.locator('#sceneTarget[data-act="market"]').is_visible()
        activate('#sceneTarget')
        page.wait_for_selector('#cutscene[open][data-scene="merchant"]')
        meeting=[]
        while page.locator('#cutscene[open]').count():
            page.wait_for_function('!document.querySelector(".cut-more").hidden')
            meeting.append(dict(name=page.locator('.cut-name').inner_text(),line=page.locator('.cut-line').inner_text()))
            if page.locator('.cut-name').inner_text()=='녹스' and len(meeting)==2:shot('nox-first-meeting')
            activate('.cut-next')
        assert len(meeting)==5 and any(x['name']=='녹스' for x in meeting),meeting
        assert progress()['state']['resource']==before_meeting['resource']
        assert progress()['state']['rng']==before_meeting['rng']
        assert progress()['state']['gold']==before_meeting['gold']
        assert page.locator('.nox-hero img').evaluate('(e)=>e.complete&&e.naturalWidth>0')
        assert page.locator('#market .memory-token').count()==4
        assert page.locator('#market > .market-card > canvas[data-icon]').count()==0
        assert page.locator('[data-card="spark"] .memory-token').get_attribute('data-tier')=='uncommon'
        shot('nox-workshop')
        check('nox-meeting-and-workshop',dict(lines=meeting,resources_unchanged=True))
        activate('[data-act="merchantTalk"]')
        page.wait_for_selector('#cutscene[open][data-scene="merchant"]')
        activate('.cut-skip')
        assert page.locator('#modal[open][data-mode="market"]').count()
        before_buy=progress()['state']
        activate('[data-card="spark"]')
        page.wait_for_selector('#cutscene[open][data-scene="merchant"]')
        after_buy=progress()['state']
        assert after_buy['resource']['skill']==before_buy['resource']['skill']-3
        assert after_buy['purchases']==before_buy['purchases']+1
        assert after_buy['gold']==before_buy['gold']
        assert after_buy['discard'].count('spark')==before_buy['discard'].count('spark')+1
        shot('nox-handoff')
        page.reload(wait_until='networkidle')
        activate('[data-act="tutorialResume"]');settle();stage('draw-recruit')
        assert progress()['state']==after_buy
        check('nox-purchase-reload-once',dict(skill=after_buy['resource']['skill'],purchases=after_buy['purchases'],main_unchanged=storage(SAVE)==original))
        action('#endTurn'); stage('approach')
        assert run_state()['resource']['sword']==5
        travel(11); stage('guardian'); travel(10); stage('attack')
        if args.case=='portrait-resume':
            activate('#sceneTarget')
            page.wait_for_timeout(100)
            assert progress()['state']['pending']['type']=='reward'
            assert ui()['step']=='attack', 'Expected to interrupt before the attack animation completed'
            check('attack-animation-interrupted',dict(ui=ui(),committed_index=progress()['index']))
            reload_resume('reward-animation')
        else:
            action('#sceneTarget')
        stage('reward')
        assert page.locator('#modal[open][data-mode="reward"]').count()
        options=run_state()['pending']['options']
        page.keyboard.press('Escape')
        assert page.locator('#modal[open][data-mode="reward"]').count()
        action('[data-act="skipReward"]'); stage('relic')
        assert run_state()['pending'] is None
        check('reward-resolved-once',dict(options=options,kills=run_state()['kills'],gold=run_state()['gold']))
        action('#sceneTarget'); stage('forecast')
        map_lesson('forecast','escape')
        if args.case=='portrait-resume':
            reload_resume('escape-18'); stage('escape')
            assert run_state()['relic']['name']=='첫 불씨' and run_state()['countdown']==14
        action('#hideAction'); walk(); travel(11); travel(7); action('#endTurn')
        for room in [3,2,1,0]:travel(room)
        action('#sceneTarget'); stage('complete')
        preserved()
        shot('completed')
        action('#tutorialCoach [data-act="tutorialExit"]')
        assert page.locator('#modal[open][data-mode="briefing"]').count()
        assert storage(PROGRESS) is None, 'Finished tutorial remains resumable after recap'
        shot('recap')
        # First-expedition transfer, reached through a real complete tutorial.
        button=page.locator('[data-act="firstExpedition"]')
        assert button.is_visible()
        geometry=button.bounding_box()
        assert geometry['y']>=0 and geometry['y']+geometry['height']<=h,geometry
        assert '첫 실전 목표' in page.locator('.first-expedition-brief').inner_text()
        check('first-expedition-brief-visible',dict(button=geometry,text=page.locator('#modal').inner_text()))
        action('[data-act="firstExpedition"]')
        assert page.locator('#modal[data-mode="new"][open]').count()
        preserved()
        action('[data-act="role"][data-id="knight"]')
        assert page.locator('[data-act="role"][data-id="knight"]').get_attribute('aria-checked')=='true'
        preserved()
        shot('role-selection-before-start')
        action('#modal .modal-actions [data-act="close"]')
        preserved()
        shot('cancelled-selection')
        check('cancel-kept-main-save',dict(main_unchanged=True,best_unchanged=True,ui=ui()))
        assert page.locator('[data-act="firstExpedition"]').is_visible(),'Cancelling removed the only first-expedition preparation CTA'
        action('[data-act="firstExpedition"]')
        action('[data-act="role"][data-id="knight"]')
        preserved()
        action('[data-act="start"]')
        real=json.loads(storage(SAVE))
        assert real['firstExpedition'] is True and real['role']=='knight' and len(real['rooms'])==20
        assert real['phase']=='playing' and real['pos']==0 and real['turn']==1 and real['relic'] is None
        assert storage(PROGRESS) is None
        assert storage(BEST)==original_best
        goal=page.locator('#expeditionGoal').inner_text()
        assert '첫 목표' in goal and '유물 하나' in goal,goal
        assert page.locator('#expeditionGoal').is_visible()
        shot('first-knight-expedition')
        saved=storage(SAVE)
        page.reload(wait_until='networkidle')
        assert storage(SAVE)==saved
        assert page.locator('#expeditionGoal').inner_text()==goal
        assert not page.locator('[data-act="tutorialResume"]').count()
        shot('first-expedition-reloaded')
        check('first-expedition-start-and-reload',dict(role=real['role'],rooms=len(real['rooms']),flag=real['firstExpedition'],goal=goal))

    def normal_case():
        global original,original_best
        page.goto(BASE,wait_until='networkidle')
        action('[data-act="tutorialSkip"]')
        action('.scene-exit[data-id="1"]'); action('#sceneTarget')
        s=run_state()
        assert s['pos']==1 and s['rooms'][1]['used']
        preview,before,after=lure_preview(0,normal=True)
        assert any(word in preview for word in ['현재 방','내 방','당신의 방','지금 방']),preview
        assert '들어' in preview or '유입' in preview or '도착' in preview,preview
        action('#endTurn')
        actual=run_state()
        assert any(move['to']==before['pos'] for move in actual['pursuits']),actual['pursuits']
        actual_named_moves=[before['rooms'][m['from']]['name']+' → '+before['rooms'][m['to']]['name'] for m in actual['pursuits'] if before['rooms'][m['from']]['seen'] and before['rooms'][m['to']]['seen']]
        assert all(pair in preview for pair in actual_named_moves),(actual_named_moves,preview)
        check('normal-lure-current-room-warning',dict(preview=preview,pursuits=actual['pursuits'],position=actual['pos'],actual_named_moves=actual_named_moves))
        shot('lure-actual-arrival')

    def guard_case():
        global original,original_best
        original,original_best=start_first_practice()
        action('[data-act="tutorialStart"]'); stage('warehouse')
        action('#stanceToggle')
        for mode in ['sneak','rush']:
            assert page.locator(f'[data-act="mode"][data-id="{mode}"]').is_disabled()
        check('guided-mode-disabled',dict(sneak=True,rush=True))
        action('#stanceToggle')
        page.reload(wait_until='networkidle')
        page.wait_for_selector('[data-act="tutorialKeepMain"]')
        action('[data-act="tutorialKeepMain"]')
        preserved()
        assert not page.locator('#tutorialCoach').is_visible()
        assert progress()['paused'] is True
        action('[data-act="menu"]'); action('[data-act="tutorialIntro"]')
        action('[data-act="tutorialResume"]'); stage('warehouse')
        check('keep-main-then-resume',dict(main_unchanged=True,practice_kept=True))
        # Explicit fault injection: only the separate tutorial key is corrupted.
        page.evaluate('(key)=>localStorage.setItem(key,"{broken-json")',PROGRESS)
        page.reload(wait_until='networkidle')
        preserved()
        assert not page.locator('[data-act="tutorialResume"]').count()
        text=page.locator('body').inner_text()
        assert '저장' in text and any(x in text for x in ['손상','읽을 수','복원','이전','처음']),text
        if not page.locator('[data-act="tutorialStart"]').is_visible():
            action('[data-act="menu"]'); action('[data-act="tutorialIntro"]')
        assert page.locator('[data-act="tutorialStart"]').is_visible()
        check('corrupt-progress-isolated',dict(message=text,main_unchanged=True,best_unchanged=True))
        shot('corrupt-progress')
        action('[data-act="tutorialStart"]'); stage('warehouse')
        # Explicit fault injection: progress writes fail; main-save APIs still work.
        page.evaluate('''(key)=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('QA quota fault','QuotaExceededError');return original.call(this,k,v);};}''',PROGRESS)
        action('.scene-exit[data-id="1"]'); stage('chest')
        text=page.locator('body').inner_text()
        assert '저장' in text and any(x in text for x in ['못','불가','실패','유지되지','수 없']),text
        check('blocked-progress-write-notice',dict(message=text,practice_continues=True))
        shot('blocked-progress')
        page.add_init_script("""(()=>{const original=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k==='ember-vault-tutorial-progress-v1')throw new DOMException('QA access fault','SecurityError');return original.call(this,k);};})();""")
        page.reload(wait_until='networkidle')
        preserved()
        text=page.locator('body').inner_text()
        assert '저장' in text and any(x in text for x in ['못','불가','실패','읽을 수','제한','수 없']),text
        if not page.locator('[data-act="tutorialStart"]').is_visible():
            action('[data-act="menu"]'); action('[data-act="tutorialIntro"]')
        assert page.locator('[data-act="tutorialStart"]').is_visible()
        check('blocked-progress-read-notice',dict(message=text,main_unchanged=True,best_unchanged=True))
        shot('blocked-progress-read')

    def normal_market_case():
        page.goto(BASE,wait_until='networkidle')
        action('[data-act="tutorialSkip"]')
        before=json.loads(storage(SAVE))
        activate('#marketToggle')
        page.wait_for_selector('#cutscene[open][data-scene="merchant"]')
        assert '황동 기억함' in page.locator('.cut-location').inner_text()
        shot('nox-remote-meeting')
        assert page.locator('.cut-next').evaluate('(e)=>e===document.activeElement')
        page.keyboard.press('Enter')
        assert page.locator('#cutscene[open]').count()
        assert page.locator('.cut-progress').inner_text()=='2 / 3'
        page.keyboard.press('Escape')
        assert '잔상' in page.locator('.modal-top').inner_text()
        after=json.loads(storage(SAVE))
        for key in ['rng','resource','gold','turn','purchases']:assert after[key]==before[key]
        action('#modal [data-act="close"]')
        page.reload(wait_until='networkidle')
        action('#marketToggle')
        assert not page.locator('#cutscene[open]').count(),'Meeting replayed after reload'
        for _ in range(10):
            if page.locator('#market .market-card:not(:disabled)').count():break
            action('#modal [data-act="close"]');action('#endTurn');action('#marketToggle')
        card=page.locator('#market .market-card:not(:disabled)').first
        card_id=card.get_attribute('data-card')
        cost=page.evaluate('(id)=>import("./engine.js?v=20261106f").then(m=>m.CARDS[id].cost)',card_id)
        before=json.loads(storage(SAVE));activate(f'#market [data-card="{card_id}"]')
        page.wait_for_selector('#cutscene[open][data-scene="merchant"]')
        after=json.loads(storage(SAVE))
        assert after['resource']['skill']==before['resource']['skill']-cost
        assert after['purchases']==before['purchases']+1
        assert after['gold']==before['gold']
        activate('.cut-skip')
        assert page.locator('#modal[open][data-mode="market"]').count()
        assert '주머니에 넣었습니다' in page.locator('.nox-conversation').inner_text()
        shot('nox-normal-receipt')
        action('#modal [data-act="close"]');page.reload(wait_until='networkidle')
        assert json.loads(storage(SAVE))==after
        check('normal-memory-case-purchase',dict(card=card_id,cost=cost,meeting_saved=True,purchase_saved_once=True))
        # Explicit V9.3 metadata migration fixture: keep the actual earned state,
        # remove only the new identity marker to simulate the prior human merchant.
        page.evaluate('''(key)=>{const s=JSON.parse(localStorage.getItem(key));delete s.tradeStory.identity;localStorage.setItem(key,JSON.stringify(s));}''',SAVE)
        page.reload(wait_until='networkidle');activate('#marketToggle')
        page.wait_for_selector('#cutscene[open][data-scene="merchant"]')
        assert page.locator('.cut-name').inner_text()=='녹스'
        migrated=json.loads(storage(SAVE))
        assert migrated==after,'Changing merchant identity modified earned gameplay state'
        activate('.cut-skip')
        check('legacy-merchant-metadata-migrated',dict(identity=migrated['tradeStory']['identity'],earned_state_unchanged=True))

    try:
        if args.case=='normal-market':normal_market_case()
        elif args.case=='normal-lure':normal_case()
        elif args.case=='storage-guards':guard_case()
        else:tutorial_case()
        assert not report['errors'],report['errors']
        assert not report['request_failures'],report['request_failures']
        assert not report['http_errors'],report['http_errors']
        report['result']='PASS'
    except Exception as exc:
        report.update(result='FAIL',error=str(exc),traceback=traceback.format_exc())
        try:
            report['failure_ui']=ui();shot('FAIL')
        except Exception as capture:
            report['capture_error']=str(capture)
    finally:
        Path(f'/tmp/ember-review-v96-firstmission-final-{args.case}-result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(dict(case=args.case,result=report['result'],error=report.get('error')),ensure_ascii=False),flush=True)
        browser.close()
if report['result']!='PASS':raise SystemExit(1)
