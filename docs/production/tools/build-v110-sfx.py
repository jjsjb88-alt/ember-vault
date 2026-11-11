import json,subprocess,base64,hashlib
from pathlib import Path
repo=Path(__file__).resolve().parents[3];tmp=Path('/tmp/ember-real-sfx');tmp.mkdir(exist_ok=True)
meta='facebookincubator/Meta-open-sound';wy='wyzowl/sfx-kit'
meta_prefix='corpora/oculus-audio-pack/ogg/'
items={
 'stone':(meta,meta_prefix+'FEETHmn_ShoeConcreteWalk_OS_01.ogg',.6),
 'moss':(meta,meta_prefix+'FEETHmn_ShoeGrassWalk_OS_01.ogg',.6),
 'shards':(meta,meta_prefix+'FEETHmn_ShoeDirtWalk_OS_01.ogg',.6),
 'water':(wy,'sounds/everyday-props/props-splash.wav',.6),
 'attack':(meta,meta_prefix+'WEAPSwrd_SwordClash_OS_01.ogg',.7),
 'card':(wy,'sounds/foley/foley-paper-slide.wav',.55),
 'buy':(wy,'sounds/money/money-coins-pour.wav',1.1),
 'lure':(wy,'sounds/impacts/impact-light-firm.wav',.5),
 'breath':(wy,'sounds/reverse-whooshes/reverse-whoosh-medium-strong.wav',1.3),
 'collapse':(wy,'sounds/cinematic-hits/cinematic-slam-big.wav',1.2),
 'bad':(wy,'sounds/notifications/notification-error-soft.wav',.9),
 'win':(wy,'sounds/notifications/notification-success-chime.wav',1.5),
 'turn':(wy,'sounds/everyday-props/props-shop-bell.wav',.8),
}
def get(repository,path):
 data=json.loads(subprocess.check_output(['gh','api',f'repos/{repository}/contents/{path}'],text=True));return base64.b64decode(data['content']),data['sha']
rows=[]
for name,(repository,path,length) in items.items():
 data,gitsha=get(repository,path);src=tmp/Path(path).name;src.write_bytes(data);target=repo/f'dist/assets/audio/{name}.mp3'
 filters='afade=t=out:st='+str(max(0,length-.1))+':d=0.1,loudnorm=I=-22:TP=-2:LRA=7'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-t',str(length),'-af',filters,'-ac','1','-ar','44100','-b:a','80k',str(target)],check=True)
 rows.append({'file':f'{name}.mp3','sourceRepository':'https://github.com/'+repository,'sourcePath':path,'sourceUrl':f'https://github.com/{repository}/blob/main/{path}','author':'Oculus VR, LLC' if repository==meta else 'Wyzowl','license':'CC-BY-4.0' if repository==meta else 'CC0-1.0','sourceGitBlob':gitsha,'sourceSha256':hashlib.sha256(data).hexdigest(),'gameSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'edit':f'Excerpt up to {length}s, fade, -22 LUFS, mono 44.1kHz MP3 80k.'})
for repository,path,name in [(meta,'corpora/oculus-audio-pack/LICENSE','LICENSE-OCULUS.txt'),(wy,'LICENSE','LICENSE-WYZOWL.txt')]:
 data,_=get(repository,path);(repo/'dist/assets/audio'/name).write_text(data.decode().rstrip()+'\n')
(repo/'dist/assets/audio/ATTRIBUTION.md').write_text('''# Sound effects\n\n“Oculus Audio Pack 01” by Oculus VR, LLC (https://developers.meta.com/vr/downloads/package/oculus-audio-pack-1/), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Files renamed to the UCS naming convention; OGG previews transcoded from the original WAVs. Ember Vault excerpts, normalizes, fades and converts selected footsteps and sword clash to MP3.\n\nSFX Kit original effects by Wyzowl (https://github.com/wyzowl/sfx-kit), CC0 1.0. Ember Vault excerpts, normalizes, fades and converts selected effects to MP3.\n\nFull file mappings and checksums: docs/production/SFX-SOURCES.json in the source repository.\n''')
(repo/'docs/production/SFX-SOURCES.json').write_text(json.dumps({'files':rows},ensure_ascii=False,indent=2)+'\n')
m=json.loads((repo/'docs/production/AUDIO-SOURCES.json').read_text());m['effects']='Dedicated effects documented in SFX-SOURCES.json (Oculus Audio Pack 01, CC BY 4.0; Wyzowl SFX Kit, CC0). No music slices are used as effects.';(repo/'docs/production/AUDIO-SOURCES.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print('13 dedicated effects ready')
