import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--base-url',default='http://127.0.0.1:8015');parser.add_argument('--screenshots',default='/tmp/ember-v95-qa');args=parser.parse_args();base=args.base_url.rstrip('/')
out=Path(args.screenshots);out.mkdir(parents=True,exist_ok=True)
reports=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(390,844),(1280,900)]:
  page=b.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference');errors=[];bad=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append([r.url,r.status]) if r.status>=400 else None)
  page.goto(base+'/dist/',wait_until='networkidle')
  main_before=page.evaluate('localStorage.getItem("ember-vault-save-v2")');best_before=page.evaluate('localStorage.getItem("ember-vault-best-v1")')
  page.goto(base+'/dist/artbook.html',wait_until='networkidle')
  page.wait_for_function('[...document.images].every(i=>i.complete&&i.naturalWidth>0)')
  assert page.locator('.memory-card').count()==24
  assert page.locator('.prop-card').count()==12
  assert page.locator('.hero img').count()==3
  before=page.locator('[data-memory=spark] img').get_attribute('src')
  for grade in ['common','uncommon','rare','epic']:
   page.locator(f'[data-grade={grade}]').click()
   assert page.locator(f'#memoriesGrid .tier-{grade}[data-token]').count()==24
   assert page.locator('[data-memory=spark] img').get_attribute('src')==before
  page.locator('#memories').scroll_into_view_if_needed();page.screenshot(path=str(out/f'artbook-memories-{width}.png'))
  page.locator('[data-memory=spark]').click();page.wait_for_timeout(180)
  assert page.locator('#detail .memory-token-fx').count()==1
  alpha=page.locator('#detail .memory-token-fx').evaluate('(e)=>{const d=e.getContext("2d").getImageData(0,0,e.width,e.height).data;let a=0;for(let i=3;i<d.length;i+=4)a+=d[i];return a}')
  assert alpha>0,alpha
  page.screenshot(path=str(out/f'epic-token-detail-{width}.png'))
  page.wait_for_timeout(1600);assert page.locator('#detail .memory-token-fx').count()==0
  page.locator('#closeDetail').click()
  geometry=page.evaluate('''()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,14).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))})''');print(geometry,flush=True)
  assert geometry['scroll']<=width,geometry
  assert page.evaluate('localStorage.getItem("ember-vault-save-v2")')==main_before
  assert page.evaluate('localStorage.getItem("ember-vault-best-v1")')==best_before
  assert not errors,errors
  assert not bad,bad
  reports.append(dict(viewport=[width,height],tokens=24,props=12,grades=4,fx_alpha=alpha,errors=errors,http_errors=bad))
  page.close()
 b.close()
Path('/tmp/ember-v95-art-results.json').write_text(json.dumps({'result':'PASS','cases':reports},indent=2)+'\n');print('PASS: artbook all assets, four rarity variants, actual pixelfx canvas, cleanup and two viewport layouts')
