"""Capture the real exported APNG in local Chromium; no network or game mutation."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[4]
REVIEW = ROOT / 'docs/visual/implemented/v9/props'

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(REVIEW)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 500, 'height': 650}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'http://127.0.0.1:{server.server_port}/focus-export/preview.html')
        img = page.locator('img')
        img.wait_for(state='visible')
        sample_times = []
        started = page.evaluate('performance.now()')
        for index, target in enumerate([50, 530, 1010], start=1):
            page.wait_for_timeout(max(0, started + target - page.evaluate('performance.now()')))
            sample_times.append(round(page.evaluate('performance.now()')))
            img.screenshot(path=str(REVIEW / f'focus-motion-{index:02d}.png'))
        images = [Image.open(REVIEW / f'focus-motion-{i:02d}.png').convert('RGB') for i in [1, 2, 3]]
        result = {
            'imageReady': img.evaluate('(image) => image.complete && image.naturalWidth === 48'),
            'browserErrors': errors,
            'samplePageTimesMs': sample_times,
            'sampleDiffBounds': [ImageChops.difference(images[0], image).getbbox() for image in images[1:]],
            'note': 'Live browser samples, timing includes capture overhead; compare with 960 ms authored cycle.'
        }
        (REVIEW / 'motion-review.json').write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result))
        browser.close()
finally:
    server.shutdown()
