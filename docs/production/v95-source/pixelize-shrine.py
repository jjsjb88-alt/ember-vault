"""Selective PixelOE field texture; preserve the approved inventory original."""
from PIL import Image
import numpy as np
from pixeloe.legacy.pixelize import pixelize
im=Image.open('dist/assets/v95/props/shrine.png').convert('RGBA')
src=np.array(im)
out=pixelize(src[:,:,:3][:,:,::-1].copy(),target_size=96,patch_size=4,thickness=1,color_matching=True,no_upscale=True)
result=Image.fromarray(out[:,:,::-1])
result.putalpha(im.getchannel('A').resize(result.size,Image.Resampling.LANCZOS))
result.save('dist/assets/v95/field-shrine.png')
