"""Additional structural guards; deliberately not a Godot parser or emulator."""
from pathlib import Path
import re,hashlib,json
root=Path(__file__).resolve().parents[1]
modules=list(root.rglob('*.gd'))
errors=[]
for file in modules:
    content=file.read_text(encoding='utf-8')
    # Scan delimiter syntax, accounting for quoted text and line comments.
    stack=[];quoted=False;esc=False;comment=False
    for i,ch in enumerate(content):
        if ch=='\n': comment=False
        if comment: continue
        if quoted:
            if esc: esc=False
            elif ch=='\\':esc=True
            elif ch=='"':quoted=False
            continue
        if ch=='#':comment=True;continue
        if ch=='"':quoted=True;continue
        if ch in '([{':stack.append((ch,i))
        if ch in ')]}':
            if not stack or {'}':'{',']':'[',')':'('}[ch]!=stack[-1][0]:errors.append(f'{file}: mismatched {ch} at {i}')
            else:stack.pop()
    if quoted or stack: errors.append(f'{file}: unmatched string/delimiter {stack[-1] if stack else "quote"}')
    # Rudimentary duplicate function identifier guard.
    funcs=re.findall(r'^func\s+(\w+)\(',content,re.M)
    funcs+=re.findall(r'^static func\s+(\w+)\(',content,re.M)
    dupe={x for x in funcs if funcs.count(x)>1}
    if dupe: errors.append(f'{file}: duplicate functions {dupe}')
    for rel in re.findall(r'preload\("res://([^\"]+)"\)',content):
        if not (root/rel).is_file(): errors.append(f'{file}: missing {rel}')
main=(root/'scripts/main.gd').read_text()
assert main.count('_setup_army_view()')>=2
assert 'ArmyView.new()' in main
assert 'Military.train(preview_state' in main
assert 'v131_godot_measurements_v33.csv' in main
assert 'v131_godot_preview_v12.json' in (root/'scripts/core/preview_sim_port.gd').read_text()
checks=(root/'tests/port_checks.gd').read_text()
assert len(re.findall(r'^\s+_check\(',checks,re.M))==647
assert not errors, '\n'.join(errors)
print('PASS: %d GDScript files structurally scanned for matching delimiters, duplicate functions, existing preloads; 647 test cases prepared. NOT compiled.'%len(modules))
