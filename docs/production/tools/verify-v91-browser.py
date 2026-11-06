#!/usr/bin/env python3
"""V9.1 browser integration with real taps/clicks and isolated player storage.

Requires Python 3.10+, `pip install playwright`, and a Chromium executable.
Start a separate static server from the repository root:
    python3 -m http.server 8011 --bind 127.0.0.1 --directory .
Run one case, or repeat for every name in CASES below:
    python3 docs/production/tools/verify-v91-browser.py portrait-safe
    python3 docs/production/tools/verify-v91-browser.py retry-safe
Use --base-url for another server origin/repository base path, --browser-path
for another Chromium executable, and --screenshots for evidence output.
Reports: /tmp/ember-v91-<case>-result.json; nonzero exit means failure.

The tutorial is the application's deliberately small teaching fixture. No
engine import, injected run, RNG edit, forced click, or hidden app-state access
is used. Only an isolated browser's existing best score is seeded to test
preservation. `safe` means the six-edge quiet return; `risk` the four-edge
shortcut through the real guard. Reward choices differ; spark recruitment is
an explicit fixed lesson, and the other purchase buttons must be disabled.
The purchased-card reveal runs naturally in normal-motion cases. Reduced
motion cases validate its summary and the actual resulting HUD resources.
This is Chromium device emulation, not an iOS/Android hardware test.
"""
import argparse
import json
import time
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

CASES = {
    'portrait-safe': (390, 844, 'quiet', False, True),
    'portrait-risk': (390, 844, 'short', False, True),
    'landscape-risk': (844, 390, 'short', False, True),
    'small-safe': (740, 320, 'quiet', True, True),
    'desktop-risk': (1280, 720, 'short', True, False),
    'retry-safe': (844, 390, 'quiet', True, True),
}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('case', choices=CASES)
parser.add_argument('--screenshots', default='/tmp/ember-v91-qa')
parser.add_argument('--base-url', default='http://127.0.0.1:8011')
parser.add_argument('--browser-path', default='/usr/bin/chromium')
args = parser.parse_args()
w, h, route, reduced, touch = CASES[args.case]
shots = Path(args.screenshots)
shots.mkdir(parents=True, exist_ok=True)
ROOT = args.base_url.rstrip('/')
BASE = ROOT + '/dist/'
SAVE = 'ember-vault-save-v2'
BEST = 'ember-vault-best-v1'
report = dict(case=args.case, viewport=[w, h], route=route,
              reduced_motion=reduced, touch=touch, stages=[], actions=[],
              screenshots=[], errors=[], request_failures=[], http_errors=[], layout=[])

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.browser_path, headless=True,
                               args=['--no-sandbox', '--disable-dev-shm-usage'])
    context = browser.new_context(viewport={'width': w, 'height': h},
                                  is_mobile=touch, has_touch=touch, device_scale_factor=1,
                                  reduced_motion='reduce' if reduced else 'no-preference')
    page = context.new_page()
    page.set_default_timeout(7000)
    page.on('pageerror', lambda e: report['errors'].append(str(e)))
    page.on('requestfailed', lambda r: report['request_failures'].append(dict(url=r.url, error=r.failure)))
    page.on('response', lambda r: report['http_errors'].append(dict(url=r.url, status=r.status)) if r.status >= 400 else None)

    def state():
        return page.evaluate('''()=>{const text=s=>document.querySelector(s)?.innerText||'';
          const resource=k=>Number(text('.resource.'+k+' strong'));
          return {step:document.querySelector('#tutorialCoach').dataset.stepKey,
          location:text('.hud-location'), hp:Number(document.querySelector('[aria-label="체력"]').getAttribute('aria-valuenow')),
          noise:Number(document.querySelector('[aria-label="용의 경계"]').getAttribute('aria-valuenow')),
          gold:Number(text('.hud-gold').trim()), move:resource('move'), sword:resource('sword'),skill:resource('skill'),block:resource('block'),
          mode:text('#stanceLabel'),handCount:Number(text('#handCount')),tokens:[...document.querySelectorAll('#hand .draw-token strong')].map(e=>e.innerText),
          enemy:text('#enemyOverlay'),coach:text('#tutorialCoach'),feedback:text('.coach-feedback'),
          dialogs:[...document.querySelectorAll('dialog[open]')].map(e=>({id:e.id,mode:e.dataset.mode,phase:e.dataset.phase}))};}''')

    def storage(key):
        return page.evaluate('(key)=>localStorage.getItem(key)', key)

    def preserved():
        assert storage(SAVE) == original, 'Original save changed during practice'
        assert storage(BEST) == original_best, 'Best score changed during practice'

    def activate(selector, index=None):
        el = page.locator(selector)
        if index is not None:
            el = el.nth(index)
        el.tap() if touch else el.click()

    def settle():
        empty = 0
        for _ in range(100):
            page.wait_for_timeout(100)
            if page.locator('#cutscene[open]').count():
                activate('.cut-skip'); empty = 0
            elif page.locator('#noiseMoment[open] [data-judge="draw"]').count():
                activate('[data-judge="draw"]'); empty = 0
            elif page.locator('#noiseMoment[open] [data-noise="skip"]').count():
                activate('[data-noise="skip"]'); empty = 0
            elif page.locator('#poolReveal[open]').count():
                activate('[data-reveal="skip"]'); empty = 0
            else:
                empty += 1
                if empty >= 8:
                    return
        raise AssertionError('Modal/cutscene flow did not settle')

    def check_layout():
        layout = page.evaluate('''()=>{const q=document.querySelector('#tutorialCoach'),c=q.getBoundingClientRect();
          const overlap=r=>Math.max(0,Math.min(r.right,c.right)-Math.max(r.left,c.left))*Math.max(0,Math.min(r.bottom,c.bottom)-Math.max(r.top,c.top));
          return {step:q.dataset.stepKey,w:innerWidth,h:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,
          coach:{x:c.x,y:c.y,w:c.width,h:c.height},overlaps:document.querySelector('dialog[open]')?[]:[...document.querySelectorAll('.coach-target')].map(e=>({id:e.id||e.dataset.id,area:overlap(e.getBoundingClientRect())})).filter(e=>e.area>0)};}''')
        report['layout'].append(layout)
        assert layout['scrollW'] <= w and layout['scrollH'] <= h, ('page overflow', layout)
        c = layout['coach']
        assert c['y'] >= 0 and c['y'] + c['h'] <= h, ('coach outside viewport', layout)
        assert not layout['overlaps'], ('coach covers active control', layout)

    def action(selector, index=None):
        activate(selector, index)
        settle()
        report['actions'].append(dict(selector=selector, state=state()))
        if page.locator('#tutorialCoach').is_visible():
            check_layout()

    def shot(name, wait_toast=True):
        if wait_toast:
            page.wait_for_function("!document.querySelector('#toast').classList.contains('show')", timeout=4500)
        path = shots / f'{args.case}-{name}.png'
        page.screenshot(path=str(path))
        report['screenshots'].append(str(path))

    def stage(key):
        page.wait_for_function('(key)=>document.querySelector("#tutorialCoach").dataset.stepKey===key', arg=key)
        report['stages'].append(key)
        check_layout()
        print(json.dumps(dict(case=args.case, stage=key, hp=state()['hp'], move=state()['move'], sword=state()['sword']), ensure_ascii=False), flush=True)

    def close_map():
        if page.locator('#mapToggle').get_attribute('aria-expanded') == 'true':
            action('#mapToggle')

    def walk_mode():
        if page.locator('#stanceLabel').inner_text() != '걷기':
            action('#stanceToggle')
            action('[data-act="mode"][data-id="walk"]')

    def reward(skip=False):
        if skip:
            action('[data-act="skipReward"]')
        else:
            buttons = page.locator('[data-act="reward"]')
            index = 1 if args.case == 'desktop-risk' else (0 if route == 'quiet' else buttons.count() - 1)
            report.setdefault('rewards', []).append(buttons.nth(index).get_attribute('data-id'))
            report.setdefault('reward_choices', []).append(dict(options=buttons.evaluate_all('els=>els.map(e=>e.dataset.id)'), selected=index))
            action('[data-act="reward"]', index)

    def travel(room):
        close_map()
        selector = f'.scene-exit[data-id="{room}"]'
        for _ in range(8):
            if page.locator(selector).get_attribute('aria-disabled') == 'false':
                action(selector)
                return
            if state()['enemy'] and state()['sword'] > 0:
                action('#sceneTarget')
                if page.locator('#modal[open][data-mode="reward"]').count():
                    reward(skip=True)
            else:
                action('#endTurn')
            assert not page.locator('#modal[open] [data-act="tutorialRetry"]').count(), 'Practice lost before movement'
        raise AssertionError(f'Movement still unavailable to room {room}')

    def observe_recruit_draw():
        activate('#endTurn')
        frames = []
        saw_pool = False
        blocked = False
        deadline = time.monotonic() + 25
        while time.monotonic() < deadline:
            page.wait_for_timeout(80)
            if page.locator('#cutscene[open]').count():
                if not blocked:
                    before = state()
                    for key in ['ArrowRight', 'ArrowUp', 'e']:
                        page.keyboard.press(key)
                    after = state()
                    assert all(before[k] == after[k] for k in ['step','location','hp','noise','move','sword','gold']), ('Background keyboard leak', before, after)
                    blocked = True
                activate('.cut-skip')
            if page.locator('#poolReveal[open]').count():
                saw_pool = True
                frame = page.locator('#poolReveal').evaluate('''e=>({phase:e.dataset.phase,name:e.querySelector('.reveal-name').innerText,sword:Number(e.querySelector('[data-total="sword"] strong').innerText),tokens:[...e.querySelectorAll('.sealed-token.opened')].map(x=>x.innerText),button:e.querySelector('[data-reveal="skip"]').innerText})''')
                if not frames or frame != frames[-1]:
                    frames.append(frame)
                if frame['phase'] == 'noise' and '다음 봉인' in frame['button']:
                    activate('[data-reveal="skip"]')
                if frame['phase'] == 'complete':
                    assert frame['sword'] == 5, frame
                    shot('recruited-draw', wait_toast=False)
                    if page.locator('#poolReveal[open]').count():
                        activate('[data-reveal="skip"]')
            elif saw_pool:
                break
        settle()
        assert saw_pool and any(f['phase'] == 'complete' and f['sword'] == 5 for f in frames), frames
        if not reduced:
            assert any(f['name'] == '불씨 화살' and f['sword'] == 3 for f in frames), frames
        assert state()['sword'] == 5 and state()['handCount'] == 6, state()
        if not blocked:
            # Reduced-motion summary can close before the deferred dialogue is
            # observed; settle may already dismiss it. Exercise the same dialog
            # explicitly instead of making timing part of the app contract.
            activate('[data-act="tutorialReplay"]')
            page.wait_for_selector('#cutscene[open]')
            before = state()
            for key in ['ArrowRight', 'ArrowUp', 'e']:
                page.keyboard.press(key)
            after = state()
            assert all(before[k] == after[k] for k in ['step','location','hp','noise','move','sword','gold']), ('Background keyboard leak', before, after)
            settle()
            report['keyboard_dialog_source'] = 'explicit replay after reduced-motion summary'
        else:
            report['keyboard_dialog_source'] = 'automatic approach dialogue'
        report['recruit_draw'] = dict(frames=frames, resulting=state(), natural_animation=not reduced)
        report['dialog_keyboard_blocked'] = True

    def finish_outbound(optional_chest):
        stage('approach')
        travel(11); stage('guardian')
        if optional_chest:
            before = state(); action('#sceneTarget'); after = state()
            assert after['gold'] > before['gold'], ('Optional chest did not grant gold', before, after)
            report['optional_chest'] = dict(before=before, after=after)
        travel(10); stage('attack')
        assert 'HP 5 / 5' in state()['enemy'] and state()['sword'] == 5, state()
        shot('guardian')
        action('#sceneTarget'); stage('reward')
        assert not state()['enemy'] and state()['sword'] == 0, state()
        reward(); stage('relic')
        action('#sceneTarget'); stage('forecast')
        assert '귀환 14턴' in state()['location'], state()
        action('#mapToggle'); stage('escape')
        forecast = page.locator('.breath-forecast').inner_text()
        assert '지금 턴을 마치면 숨결' in forecast and '현재 메아리 기준' in forecast, forecast
        report.setdefault('forecast', []).append(forecast)
        shot('forecast'); close_map(); shot('return-choice')

    try:
        page.goto(ROOT + f'/?tutorial=1&qa={args.case}#entry', wait_until='networkidle')
        assert page.url == BASE + f'?qa={args.case}#entry', page.url
        assert '18단계' in page.locator('.tutorial-intro').inner_text()
        shot('intro')
        page.locator('#tutorialAudio').uncheck(); action('[data-act="tutorialSkip"]')
        page.reload(wait_until='networkidle')
        assert not page.locator('#modal[open]').count()
        page.evaluate('(key)=>localStorage.setItem(key,"123")', BEST)
        page.goto(BASE + f'?tutorial=1&qa={args.case}#practice', wait_until='networkidle')
        original, original_best = storage(SAVE), storage(BEST)
        assert len(json.loads(original)['rooms']) == 20
        page.locator('#tutorialAudio').uncheck(); action('[data-act="tutorialStart"]'); stage('warehouse')
        # Exiting halfway and reloading restores the original game exactly.
        action('.scene-exit[data-id="1"]'); stage('chest')
        if args.case == 'desktop-risk':
            preserved(); page.reload(wait_until='networkidle'); preserved()
            assert not page.locator('[data-act="tutorialStart"]').count()
            assert not page.locator('#tutorialCoach').is_visible()
            report['active_practice_reload_restored_original'] = True
            page.goto(BASE + f'?tutorial=1&qa={args.case}#practice', wait_until='networkidle')
            page.locator('#tutorialAudio').uncheck(); action('[data-act="tutorialStart"]'); stage('warehouse')
        action('#tutorialCoach [data-act="tutorialExit"]'); preserved()
        page.reload(wait_until='networkidle'); preserved()
        assert not page.locator('[data-act="tutorialStart"]').count()
        report['exit_reload_preserved'] = True
        page.goto(BASE + f'?tutorial=1&qa={args.case}#practice', wait_until='networkidle')
        page.locator('#tutorialAudio').uncheck(); action('[data-act="tutorialStart"]'); stage('warehouse')
        activate('[data-act="tutorialReplay"]'); page.wait_for_selector('#cutscene[open]'); settle()
        action('.scene-exit[data-id="1"]'); stage('chest')
        action('#sceneTarget'); stage('sound')
        action('#mapToggle'); stage('hush'); shot('sound-map')
        close_map(); before_hide = state(); action('#hideAction'); stage('lure')
        assert state()['noise'] == max(0, before_hide['noise'] - 2) and state()['move'] == before_hide['move'] - 1
        before_lure = state(); action('#lureToggle'); action('.scene-exit[data-id="5"]'); stage('wait-lure')
        assert state()['skill'] == before_lure['skill'] - 1
        action('#mapToggle'); before_guard = page.locator('.enemy-report').inner_text(); close_map()
        assert '파편 회랑' in before_guard, before_guard
        action('#endTurn'); stage('pass-junction')
        action('#mapToggle'); after_guard = page.locator('.enemy-report').inner_text(); shot('lure-worked'); close_map()
        assert '부서진 무기고' in after_guard, after_guard
        walk_mode(); action('.scene-exit[data-id="2"]'); stage('pass-guard')
        action('.scene-exit[data-id="6"]'); stage('refuge')
        assert state()['enemy'] == '' and state()['hp'] == 22, state()
        report['lure'] = dict(before=before_guard, after=after_guard, empty_crossing=state())
        shot('empty-corridor'); action('.scene-exit[data-id="7"]'); stage('recruit')
        before_buy = state(); assert before_buy['sword'] == 2
        action('#marketToggle')
        disabled = page.locator('[data-act="buy"]:not([data-card="spark"])')
        assert disabled.count() == 3
        for i in range(disabled.count()):
            assert disabled.nth(i).is_disabled()
            assert '지금 안내된 능력을 먼저 영입하세요' in disabled.nth(i).get_attribute('aria-label')
        assert page.locator('[data-act="refresh"]').is_disabled()
        shot('market'); action('[data-act="buy"][data-card="spark"]'); stage('draw-recruit')
        after_buy = state()
        assert after_buy['sword'] == 2 and after_buy['skill'] == before_buy['skill'] - 3, (before_buy, after_buy)
        report['recruitment'] = dict(before=before_buy, after=after_buy, other_offers_disabled=3)
        observe_recruit_draw(); stage('approach'); checkpoint = state(); preserved()
        finish_outbound(optional_chest=route == 'short')
        if args.case == 'retry-safe':
            stalled = 0
            while not page.locator('#modal[open] [data-act="tutorialRetry"]').count() and stalled < 20:
                action('#endTurn'); stalled += 1
            assert page.locator('#modal[open][data-mode="tutorialRetry"]').count() == 1
            preserved(); shot('retry-prompt')
            failure = page.locator('#modal').inner_text()
            action('[data-act="tutorialRetry"]'); stage('approach')
            restored = state()
            for key in ['location','hp','noise','gold','move','sword','skill','block','handCount','tokens']:
                assert restored[key] == checkpoint[key], (key, restored[key], checkpoint[key])
            report['retry'] = dict(turns=stalled, failure=failure, restored=restored)
            shot('retry-restored'); finish_outbound(optional_chest=False)
        return_before = state()
        if route == 'quiet':
            action('#hideAction'); walk_mode(); travel(11); travel(7)
            action('#mapToggle'); quiet_forecast = page.locator('.breath-forecast').inner_text(); close_map()
            assert '비켜 갑니다' in quiet_forecast, quiet_forecast
            before_end = state(); action('#endTurn'); after_end = state()
            assert after_end['hp'] == before_end['hp'], (before_end, after_end)
            report['quiet_breath'] = dict(forecast=quiet_forecast, before=before_end, after=after_end)
            for room in [3,2,1,0]:
                travel(room)
        else:
            walk_mode(); travel(6)
            assert '금고의 파수병' in state()['enemy'], state()
            action('#mapToggle'); short_forecast = page.locator('.breath-forecast').inner_text(); close_map()
            assert '닿아요' in short_forecast, short_forecast
            before_end = state(); action('#endTurn'); after_end = state()
            assert after_end['hp'] < before_end['hp'], (before_end, after_end)
            report['short_breath'] = dict(forecast=short_forecast, before=before_end, after=after_end)
            action('#sceneTarget'); reward(skip=True)
            for room in [2,1,0]:
                travel(room)
        final_practice = state()
        report['return'] = dict(before=return_before, at_entry=final_practice)
        assert '무너진 입구' in final_practice['location'], final_practice
        action('#sceneTarget'); stage('complete'); preserved(); shot('escaped')
        action('#tutorialCoach [data-act="tutorialExit"]')
        assert page.locator('#modal').get_attribute('data-mode') == 'briefing'
        recap = page.locator('#modal').inner_text()
        stats = page.locator('.tutorial-results').evaluate('e=>Object.fromEntries([...e.children].map(x=>[x.querySelector("small").innerText,x.querySelector("strong").innerText]))')
        assert stats['남은 체력'].startswith(str(final_practice['hp']) + ' / '), stats
        assert stats['금화'] == str(final_practice['gold']) and int(stats['점수']) > 0, stats
        for expected in ['돌멩이 뒤에 열린 길','추출된 불씨 화살','공격 +3 합산','봉인의 수호자에게 5 피해', '귀환 6칸' if route == 'quiet' else '귀환 4칸', '조용한 귀환길' if route == 'quiet' else '짧은 귀환길']:
            assert expected in recap, (expected, recap)
        assert ('상자는 열지 않음' if route == 'quiet' else '이끼 서고 금화 +') in recap, recap
        if args.case == 'retry-safe':
            assert '다시 도전 1회' in recap, recap
        report['recap'] = dict(text=recap, stats=stats)
        assert storage('ember-vault-tutorial-v1') == 'completed'
        shot('recap'); action('#modal .modal-actions [data-act="close"]')
        page.reload(wait_until='networkidle'); preserved()
        assert page.url == BASE + f'?qa={args.case}#practice'
        assert not page.locator('[data-act="tutorialStart"]').count()
        assert not page.locator('#tutorialCoach').is_visible()
        assert not report['errors'], report['errors']
        assert not report['request_failures'], report['request_failures']
        assert not report['http_errors'], report['http_errors']
        report.update(result='PASS', original_save_preserved=True, original_best_preserved=True, completed_reload_no_intro=True)
    except Exception as exc:
        report.update(result='FAIL', error=str(exc), traceback=traceback.format_exc())
        try:
            report['failure_state'] = state()
            shot('FAIL')
        except Exception as capture:
            report['capture_error'] = str(capture)
    finally:
        Path(f'/tmp/ember-v91-{args.case}-result.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
        print(json.dumps(dict(case=args.case, result=report['result'], error=report.get('error'), errors=report['errors'], failure_state=report.get('failure_state')), ensure_ascii=False), flush=True)
        browser.close()
if report['result'] != 'PASS':
    raise SystemExit(1)
