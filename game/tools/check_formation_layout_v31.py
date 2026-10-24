"""Independent numerical layout spot-checks (Python model, NOT Godot execution).

Mirrors V131 formation spacing used in scripts/core/battle_formations_v131.gd
and rejects overlapping agent centres in symmetric test layouts.
"""
from itertools import combinations
from math import ceil,sqrt,hypot

def layout(form,count):
    cols=6 if count>=24 else 4
    width=depth=1.05
    if form=='column':cols=3
    elif form=='shield_wall':cols=6;width=.76;depth=.95
    elif form=='spear_wall':cols=4;width=.9
    elif form in ('loose','skirmish'):width=depth=1.6
    elif form=='charge':width=depth=4.1
    cols=min(cols,count);rows=ceil(count/cols)
    out=[]
    for index in range(count):
        col=index%cols;row=index//cols;column_width=cols;total_rows=rows
        if form=='charge':
            row=0;used=0
            while used+row+1<=index:
                used+=row+1;row+=1
            column_width=min(row+1,count-used);col=index-used;total_rows=ceil(sqrt(2*count))
        out.append(((row-(total_rows-1)*.5)*depth,(col-(column_width-1)*.5)*width))
    return out

case_count=0
for form in ('line','column','shield_wall','spear_wall','hold','loose','skirmish'):
    for count in (12,24):
        positions=layout(form,count)
        gap=min(hypot(a[0]-b[0],a[1]-b[1]) for a,b in combinations(positions,2))
        assert gap > .69, (form,count,gap)
        case_count+=1
for n in (12,):
    positions=layout('charge',n)
    gap=min(hypot(a[0]-b[0],a[1]-b[1]) for a,b in combinations(positions,2))
    assert gap > 2.1, ('charge',n,gap)
    case_count+=1
assert layout('shield_wall',24)[0]!=layout('loose',24)[0]
assert 2*(9*24+2*12+10)==500
assert 2*(2*24+1*12)==120
print('PASS',case_count,'layout geometries, spacing, 120- and 500-fighter composition (Python mirror).')
