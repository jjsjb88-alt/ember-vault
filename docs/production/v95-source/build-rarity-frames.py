import json,math
from pathlib import Path
palettes=[['#172128','#594737','#907451','#d6bd88','#fff0c4','#c1a77a'],['#10272a','#285b5c','#4e9b91','#a6e4ca','#e8fff2','#6ee0c7'],['#121e38','#264d7e','#438bd0','#a4d5ff','#edf6ff','#64c1ff'],['#211435','#57326f','#a264c4','#ead0f3','#fff0cf','#ddaeff']]
names=['common','uncommon','rare','epic'];frames=[]
for rank,(name,cols) in enumerate(zip(names,palettes)):
 rows=[]
 for y in range(96):
  row=''
  for x in range(96):
   dx,dy=x-47.5,y-47.5;r=math.hypot(dx,dy);v='.'
   if 39.5<=r<=45.5:
    v='d' if r<40.5 or r>44.5 else 'h' if dx+dy<-10 else 'm'
    if 42.0<r<43.2:v='l' if dx+dy<0 else 'h'
   for i in range(4+rank*4):
    a=2*math.pi*i/(4+rank*4);gx,gy=47.5+43*math.cos(a),47.5+43*math.sin(a);dd=abs(x-gx)+abs(y-gy)
    if dd<(3 if rank<2 else 4):v='g' if dd>1 else 'w'
   row+=v
  rows.append(row)
 frames.append({'name':name,'duration':160,'palette':dict(zip('dmhlwg',cols)),'ops':[{'op':'grid','x':0,'y':0,'rows':rows}]})
p={'version':1,'name':'memory-rarity-frames','width':96,'height':96,'palette':dict(zip('dmhlwg',palettes[0])),'frames':frames,'animations':{name:{'frames':[name],'loop':False} for name in names}}
Path('docs/production/v95-source/rarity-frames.json').write_text(json.dumps(p,indent=2)+'\n')
