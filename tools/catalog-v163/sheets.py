# Builds the labelled contact sheets from catalog-v163/tiles/index.json (python3 tools/catalog-v163/sheets.py)
import json,os
from PIL import Image,ImageDraw,ImageFont
D='catalog-v163';idx=json.load(open(D+'/tiles/index.json'))
font=lambda s,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf'%('-Bold' if b else ''),s)
F1,F2,FT,FS=font(17,True),font(14),font(30,True),font(15)
cats={}
for it in idx:cats.setdefault(it['cat'],[]).append(it)
T,COLS,LAB=300,5,58
for cat,items in cats.items():
    rows=(len(items)+COLS-1)//COLS;W,H=COLS*T+(COLS+1)*12,98+rows*(T+LAB+12)+12
    sh=Image.new('RGB',(W,H),'#1d2b2c');d=ImageDraw.Draw(sh)
    d.text((16,16),'Kuningriigid · kiviaeg · '+cat[2:]+'  ('+str(len(items))+')',fill='#f3d58f',font=FT)
    note='Mõõdud detailkaardi ühikutes (1 ühik ≈ 1,05 m)' if cat[0]!='6' else 'Maakaardi mudelid: mõõdud maakaardi ühikutes'
    d.text((18,58),note+' · number = ID vahetamiseks',fill='#9fb0a8',font=FS)
    for i,it in enumerate(items):
        x=12+(i%COLS)*(T+12);y=98+(i//COLS)*(T+LAB+12)
        sh.paste(Image.open(D+'/tiles/'+it['file']).resize((T,T)),(x,y));d.rectangle([x,y+T,x+T,y+T+LAB],fill='#132022')
        d.text((x+8,y+T+6),f"{it['file'][:3]}  {it['id']}",fill='#ffffff',font=F1)
        sz=it['size'];extra='' if it['id'].startswith('unit:') else f" · {sz[0]:.1f}×{sz[2]:.1f}×{sz[1]:.1f}"
        d.text((x+8,y+T+31),f"{it['label'][:26]}{extra}",fill='#c9d3c8',font=F2)
    sh.save(D+'/kiviaeg_'+cat[0]+'_'+cat[2:].split()[0].lower().replace('õ','o')+'.png')
print('ok')
