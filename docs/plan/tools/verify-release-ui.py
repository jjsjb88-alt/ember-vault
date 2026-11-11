#!/usr/bin/env python3
"""Chromium software checks. Fresh UI for settings/transfer/offline; an isolated audio
component fixture for decoding and gain checks. No human hearing or device claims."""
import json,threading,functools,http.server,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
repo=Path(__file__).resolve().parents[3];out=Path('/tmp/ember-v110-release');out.mkdir(exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
 bytes=0
 update_fixture=False
 def do_GET(self):
  key=self.path.split("?")[0]
  if Handler.update_fixture and key in ["/sw.js","/dist/sw-assets.json"]:
   payload=(repo/"_site"/key.lstrip("/")).read_text()
   current=json.loads((repo/"_site/dist/sw-assets.json").read_text())["releaseId"]
   payload=payload.replace(current,"0123456789abcdef").encode()
   self.send_response(200);self.send_header("Content-Type","application/javascript" if key=="/sw.js" else "application/json");self.send_header("Content-Length",str(len(payload)));self.end_headers();self.wfile.write(payload);return
  return super().do_GET()
 def log_message(self,*a):pass
 def copyfile(self,source,outputfile):
  while chunk:=source.read(65536):Handler.bytes+=len(chunk);outputfile.write(chunk)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(repo/'_site')));threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}';report={'scope':__doc__,'result':'RUNNING','errors':[],'http_errors':[],'checks':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':800,'height':360},has_touch=True,is_mobile=True,reduced_motion='reduce');page=ctx.new_page();page.set_default_timeout(15000);page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('response',lambda r:report['http_errors'].append({'status':r.status,'url':r.url}) if r.status>=400 else None)
 def wait_async(expression,timeout=30):
  deadline=time.monotonic()+timeout
  while time.monotonic()<deadline:
   if page.evaluate(expression):return
   page.wait_for_timeout(100)
  raise AssertionError('Async browser condition did not become true')
 def click(selector):page.locator(selector).click();page.wait_for_timeout(100)
 def settle():
  for _ in range(100):
   if page.locator('#cutscene[open]').count():click('.cut-skip')
   elif page.locator('#poolReveal[open]').count():click('[data-reveal=skip]')
   elif page.locator('#noiseMoment [data-judge=draw]').count():click('[data-judge=draw]')
   elif page.locator('#noiseMoment[open] [data-noise=skip]').count():click('[data-noise=skip]')
   else:page.wait_for_timeout(700);return
  raise AssertionError('UI did not settle')
 def close():
  while page.locator('#modal[open]').count():click('#modal .close-button')
 def menu(act):close();click('[data-act=menu]');click('#modal [data-act='+act+']')
 try:
  page.goto(url+'/',wait_until='networkidle');page.evaluate('navigator.serviceWorker.ready.then(()=>true)');page.wait_for_function('!!navigator.serviceWorker.controller');page.wait_for_timeout(500);report['coldPayloadBytes']=Handler.bytes;report['coldBudgetPass']=Handler.bytes<10_000_000
  click('[data-act=tutorialSkip]');settle();menu('settings');page.select_option('#prefLanguage','en')
  for key in ['largeText','colorSafe','reduceMotion']:page.locator('#pref-'+key).check()
  page.locator('#pref-vibration').uncheck();page.locator('#pref-story').uncheck();click('[data-act=applySettings]');page.wait_for_function('document.documentElement.lang==="en"');assert page.locator('body.large-text.color-safe.user-reduced-motion').count();assert page.locator('body').get_attribute('data-vibration')=='false';page.screenshot(path=str(out/'settings-en-800.png'))
  report['checks'].append('settings-accessibility-language-through-controls');assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  with page.expect_download() as dl:click('[data-act=exportSave]')
  saved=out/'export.json';dl.value.save_as(saved);payload=json.loads(saved.read_text());assert payload['format']=='ember-vault-save';assert len(payload['data'])==6
  before=page.evaluate('localStorage.getItem("ember-vault-save-v2")')
  def choose_import():
   with page.expect_file_chooser() as chooser:click('[data-act=importSave]')
   chooser.value.set_files(str(saved));page.wait_for_selector('#modal[data-mode=confirmImport]')
  choose_import();assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==before;close();menu('settings');choose_import();click('[data-act=confirmImport]');page.wait_for_load_state('networkidle');settle();assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==payload['data']['ember-vault-save-v2'];report['checks'].append('export-import-review-before-replacement')
  menu('settings');page.select_option('#prefLanguage','ja');click('[data-act=applySettings]');page.wait_for_function('document.documentElement.lang==="ja"');assert '設定' in page.locator('#modalTitle').inner_text();page.screenshot(path=str(out/'settings-ja-800.png'));assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
  click('[data-act=offlinePack]')
  wait_async('async()=>{const keys=await caches.keys();const pack=await caches.open(keys.find(k=>k.endsWith("-pack")));const manifest=await (await fetch("./sw-assets.json")).json();return (await Promise.all(manifest.pack.map(p=>caches.match(new URL(p,location.href),{ignoreSearch:true})))).every(Boolean);}')
  page.wait_for_timeout(800);close();committed=page.evaluate('JSON.parse(localStorage.getItem("ember-vault-save-v2")).turn');ctx.set_offline(True);page.goto(url+'/',wait_until='networkidle');settle();assert '/dist/' in page.url;click('#endTurn');settle();assert page.evaluate('JSON.parse(localStorage.getItem("ember-vault-save-v2")).turn')==committed+1;page.screenshot(path=str(out/'offline-ja-800.png'));report['checks'].append('full-offline-pack-root-link-reopen-and-real-turn');ctx.set_offline(False)
  # Audio component fixture: decode actual files, then test lazy playback and danger gain.
  decoded=page.evaluate('''async()=>{const C=new AudioContext(),out=[];for(const name of ['upper','middle','lower','deep','refuge','danger','won','lost','stone','water','shards','moss','attack','buy','card','lure','breath','collapse','win','bad','turn']){const buffer=await C.decodeAudioData(await (await fetch('./assets/audio/'+name+'.mp3')).arrayBuffer());out.push({name,duration:buffer.duration});}await C.close();return out;}''');assert all(x['duration']>=44 if x['name'] in ['upper','middle','lower','deep','refuge','danger','won','lost'] else x['duration']>.05 for x in decoded);report['audioDecoded']=decoded
  page.evaluate('''async()=>{const {makeAudioDirector}=await import('./audio-director.js?v=20261111b');const {newRun}=await import('./engine.js?v=20261111b');window.audioFixture={d:makeAudioDirector(),s:newRun({seed:1,layout:'staged',risk:true,campaign:true})};const button=document.createElement('button');button.id='audioTest';button.textContent='Audio test';button.style='position:fixed;top:0;left:0;z-index:999999';button.onclick=()=>audioFixture.d.update(audioFixture.s,true,{volume:.4});document.body.append(button);}''');click('#audioTest');page.wait_for_timeout(300);base=page.evaluate('audioFixture.d.status()');assert base['ready'] and base['basePlaying'];page.evaluate('audioFixture.s.noise=9;audioFixture.d.update(audioFixture.s,true,{volume:.4})');page.wait_for_timeout(900);danger=page.evaluate('audioFixture.d.status()');assert danger['layerPlaying'] and danger['layerGain']>0;page.evaluate('audioFixture.d.update(audioFixture.s,false)');assert not page.evaluate('audioFixture.d.status().basePlaying');report['checks'].append('eight-music-decodes-user-gesture-playback-danger-gain-and-mute');report['audioBase']=base;report['audioDanger']=danger;report['audioStageTracks']=page.evaluate("()=>{const {d,s}=audioFixture,out=[];for(const pos of [0,2,8,19,5]){s.pos=pos;d.update(s,true,{volume:0});out.push(d.status().track);}for(const phase of ['won','lost']){s.phase=phase;d.update(s,true,{volume:0});out.push(d.status().track);}d.update(s,false);return out;}");assert report['audioStageTracks']==['upper','middle','lower','deep','refuge','won','lost']
  # Isolated update fixture changes the worker release ID, not game state or assets.
  menu('settings');before_update=page.evaluate('localStorage.getItem("ember-vault-save-v2")');Handler.update_fixture=True;click('[data-act=applyUpdate]');wait_async('async()=>!!(await navigator.serviceWorker.getRegistration()).waiting')
  report['uiBeforeUpdate']=page.evaluate("async()=>(await import('./app.js?v=20261111b')).uiStatus()")
  with page.expect_navigation(wait_until='networkidle',timeout=30000):click('[data-act=applyUpdate]')
  settle();assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==before_update;assert not page.evaluate('async()=>!!(await navigator.serviceWorker.getRegistration()).waiting');report['checks'].append('explicit-update-fixture-preserves-save-and-reloads-once')
  assert not report['errors'] and not report['http_errors'],report;assert report['coldBudgetPass'],report['coldPayloadBytes'];report['result']='PASS';print(json.dumps(report,ensure_ascii=False),flush=True)
 except Exception as e:
  try:report['workerDebug']=page.evaluate('async()=>{const r=await navigator.serviceWorker.getRegistration();return {registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({scope:r.scope,waiting:r.waiting?.state})),waiting:r?.waiting?.state,active:r?.active?.state,controller:navigator.serviceWorker.controller?.scriptURL,caches:await caches.keys(),status:document.querySelector("#offlineStatus")?.textContent,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.id)}}')
  except:pass
  report.update(result='FAIL',failure=str(e));page.screenshot(path=str(out/'FAIL.png'));raise
 finally:(out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');b.close();server.shutdown()
