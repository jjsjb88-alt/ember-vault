"""Review Forge's generated HTML at source and representative game sprite sizes."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
REVIEW = ROOT / 'docs/visual/implemented/v9/forge-relic-review'

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1180, 'height': 900}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/docs/visual/implemented/v9/forge-relic-review/index.html')
        page.wait_for_function("document.getElementById('readout').textContent.includes('Frame')")
        page.locator('#play').click()
        page.locator('#ground').fill('436')
        canvas = page.locator('#view')
        captures = []
        for body_height in [72, 128]:
            width = round(512 * body_height / 360)
            canvas.evaluate('(c,w) => { c.style.width=w+"px"; c.style.maxWidth="none"; }', width)
            for background in ['dark', 'light']:
                page.locator('#back').select_option(background)
                row = []
                for frame in range(14):
                    page.locator('#scrub').evaluate('(e,i) => { e.value=i; e.dispatchEvent(new Event("input")); }', frame)
                    page.wait_for_function('(n) => document.getElementById("readout").textContent.startsWith("Frame "+n+" /")', arg=frame)
                    name=f'body-{body_height}-{background}-{frame:02d}.png'
                    canvas.screenshot(path=str(REVIEW / name))
                    row.append(Image.open(REVIEW / name).convert('RGB'))
                image = Image.new('RGB', (7*(width+8), 2*(width+26)), '#26313a')
                draw=ImageDraw.Draw(image)
                for i, frame_image in enumerate(row):
                    x=(i%7)*(width+8); y=(i//7)*(width+26)
                    image.paste(frame_image,(x,y)); draw.text((x+3,y+width+3),str(i),fill='white')
                target=f'body-{body_height}-{background}-all.png'
                image.save(REVIEW / target)
                captures.append({'bodyHeightPx':body_height,'canvasCssWidth':width,'background':background,'contact':target})
        page.locator('#scrub').evaluate('(e) => { e.value=0; e.dispatchEvent(new Event("input")); }')
        page.locator('#play').click()
        times=[]
        for _ in range(4):
            page.wait_for_timeout(160)
            times.append(page.locator('#readout').inner_text())
        report={'browserErrors':errors,'playbackSamples':times,'playbackChanged':len(set(times))>1,'captures':captures,'scope':'Forge reduced preview, fixed original registration, representative 72/128px body sizes; not the integrated game. Ground red line is review annotation.'}
        assert not errors and report['playbackChanged']
        (REVIEW / 'browser-review.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report))
        browser.close()
finally:
    server.shutdown()
