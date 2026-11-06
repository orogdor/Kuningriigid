from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2];out=root/'previews/sapling-trees';out.mkdir(parents=True,exist_ok=True)
for kind,label in [('pine','Mänd'),('spruce','Kuusk'),('oak','Tamm'),('lime','Pärn'),('birch','Kask'),('palm','Palm')]:
 paths=sorted((root/'assets/sapling-trees').glob(kind+'_*/preview.png'))
 if not paths:continue
 sheet=Image.new('RGB',(1600,385),(211,220,218));d=ImageDraw.Draw(sheet)
 for i,p in enumerate(paths):
  im=Image.open(p).convert('RGBA');im.thumbnail((320,320));bg=Image.new('RGBA',im.size,(211,220,218,255));bg.alpha_composite(im);sheet.paste(bg.convert('RGB'),(i*320,35));d.text((i*320+18,360),f'{label} {i+1:02} | Sapling 1.0 / GLB render',fill=(25,40,35))
 d.text((18,12),label+' — viis tegelikku eksporditud mudelit',fill=(25,40,35));sheet.save(out/(kind+'.jpg'),quality=92)
