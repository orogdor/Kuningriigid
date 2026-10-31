#!/usr/bin/env python3
"""Point every import spelling of the given modules at ?v=VERSION in index.html's importmap.
   python3 tools/bump-importmap.py 250 roads.js navigation.js ...
Existing mappings are redirected; import spellings found in the code but missing from the map are added,
so a browser never keeps a stale cached copy (or a second module instance) of a changed file."""
import json,re,sys,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
version,files=sys.argv[1],sys.argv[2:]
html=(root/'index.html').read_text()
m=re.search(r'<script type="importmap">(.*?)</script>',html,re.S)
imports=json.loads(m.group(1))['imports']
code='\n'.join(p.read_text(errors='ignore') for p in root.glob('*.js'))
for f in files:
    name='./'+f
    spellings={k for k in imports if k.split('?')[0]==name}
    spellings|=set(re.findall(r"['\"](\./"+re.escape(f)+r"(?:\?[^'\"]*)?)['\"]",code))
    for k in sorted(spellings):imports[k]=f'{name}?v={version}'
    print(f, len(spellings), 'spellings ->', f'?v={version}')
body=json.dumps({'imports':imports},indent=2,ensure_ascii=False)
html=html[:m.start(1)]+body+html[m.end(1):]
(root/'index.html').write_text(html)
