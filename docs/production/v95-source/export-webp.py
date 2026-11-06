from pathlib import Path
from PIL import Image
import json
report=[]
for p in Path('dist/assets/v95').rglob('*.png'):
 if p.name=='rarity-frames.png':continue
 out=p.with_suffix('.webp');im=Image.open(p);im.save(out,'WEBP',quality=91,method=6,exact=True)
 report.append({'png':str(p),'webp':str(out),'size':list(im.size),'source_bytes':p.stat().st_size,'runtime_bytes':out.stat().st_size})
Path('docs/production/v95-source/webp-export.json').write_text(json.dumps({'source_bytes':sum(x['source_bytes'] for x in report),'runtime_bytes':sum(x['runtime_bytes'] for x in report),'assets':report},indent=2)+'\n')
print('WebP:',sum(x['source_bytes'] for x in report),'->',sum(x['runtime_bytes'] for x in report))
