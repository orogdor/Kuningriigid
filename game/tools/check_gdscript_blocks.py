"""Detect the GDScript indentation regression reported on Android Godot 4.7.2.
This is a lexical block check, NOT a substitute for the Godot parser/compiler.
"""
from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
errors=[]
headers=re.compile(r'^(?:(?:static\s+)?func\s+\w+|if\s|elif\s|else\s*:|for\s|while\s|match\s|class\s|when\s)')
for p in sorted(root.rglob('*.gd')):
    lines=p.read_text(encoding='utf-8').splitlines()
    indent_char=None
    for i, line in enumerate(lines):
        stripped=line.lstrip(' \t')
        if not stripped or stripped.startswith('#'): continue
        ind=len(line)-len(stripped)
        if ' ' in line[:ind] and '\t' in line[:ind]: errors.append((p,i+1,'Mixed spaces and tabs'))
        if stripped.endswith(':') and headers.match(stripped):
            j=i+1
            while j<len(lines) and (not lines[j].strip() or lines[j].lstrip().startswith('#')): j+=1
            if j>=len(lines) or len(lines[j])-len(lines[j].lstrip(' \t'))<=ind:
                errors.append((p,i+1,f'Missing indented body following {stripped[:50]!r}'))
        if stripped.startswith('continue') and stripped.rstrip() not in ('continue','continue # expected'):
            # Do not reject comments after a valid continue statement.
            pass
trade=(root/'scripts/core/trade_network_port.gd').read_text(encoding='utf-8')
if '            if path.is_empty():\n            cargo["status"]' in trade:
    errors.append(('trade_network_port.gd',248,'Original exact regression still present'))
if '        if cursor < path.size():\n            continue\n        # Arrival' not in trade:
    errors.append(('trade_network_port.gd',248,'Cargo arrival gate not correctly indented'))
for filename,lineno,description in errors:
    print(f'{filename}:{lineno}: {description}',file=sys.stderr)
if errors:sys.exit(1)
print('GDSCRIPT BLOCK/INDENTATION CHECK PASS:',len(list(root.rglob('*.gd'))),'scripts (not compiled)')
