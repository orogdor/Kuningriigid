/* V293: illustrated research portrait images, one unique SVG per technology.
 * Uses data:image/svg+xml URLs so Android and desktop display them consistently.
 * Every picture is a separate image element; shapes are cached by technology ID.
 */
const cache=new Map();
const themes=[['#231f1b','#906436'],['#2d2420','#a46b40'],['#222e34','#829198'],
 ['#1c2a43','#b49b59'],['#352a43','#a98cba'],['#202f37','#c19569'],['#132f46','#52a7bb']];
const shapes={
 stone:'<path d="m22 81 59-56 11 11-60 57z" fill="#8f673f"/><path d="M31 35q18-18 43-13l-5 14 15 16-20 20-31-29z" fill="#c3c6c0"/><path d="M38 40 64 66" stroke="#fff1cb" stroke-width="4"/>',
 hunt:'<path d="M36 78q-8-30 25-33 35-2 30 34M44 47 29 27l-7-4m21 17-2-17m39 20 13-21 10-8m-21 22 3-19" fill="none"/><path d="M48 60q10-16 24 0v19H49z" fill="#af8250"/>',
 fish:'<path d="M21 63q27-35 66 0-39 36-66 0zm59-2 22-20v41z" fill="#88baca"/><circle cx="41" cy="60" r="3" fill="#16334a"/>',
 fire:'<path d="M57 21q29 22 8 40 20-4 15-24 23 28 7 48-21 23-43 7-30-18-10-45-3 18 13 22-4-25 10-48z" fill="#f0a245"/><path d="M57 60q20 13 5 28-18 6-18-10z" fill="#fff0a9"/>',
 field:'<path d="M63 92V26m0 47-22-21m22 6 23-23m-23 8L50 26M44 69Q25 66 28 45q20 5 25 16M75 55q6-21 24-24 0 21-17 28" fill="none" stroke="#eac778" stroke-width="6"/>',
 book:'<path d="M22 32q23-11 42 3 19-13 43-5v57q-22-9-43 4-21-13-42-5z" fill="#e4c88a"/><path d="M64 35v56M31 48q15-7 25 0M31 61q15-7 25 0M73 47q11-5 23-2M73 60q11-5 23-2" stroke="#78553a" stroke-width="3" fill="none"/>',
 castle:'<path d="M21 93V45h14V30h12v15h14V25h14v20h11V34h13v59z" fill="#adb2b0"/><path d="M27 55h12m13-3h11m19 0h10M57 93V76q8-13 17 0v17" stroke="#634932" stroke-width="5" fill="none"/>',
 ship:'<path d="M18 78h90L93 92H33z" fill="#a77447"/><path d="M62 20v58M63 30q31 13 30 40H63z" fill="#efe3bf"/><path d="M57 38Q35 49 34 70h23z" fill="#cbb28e"/><path d="M22 100q13-8 25 0 12 7 23 0 12-8 24 0" stroke="#8ac8d8" fill="none" stroke-width="4"/>',
 market:'<path d="M25 95h80M66 22v70M29 35h74M41 35 25 70h32zm52 0L77 70h32z" fill="none" stroke="#e8c884" stroke-width="5"/><path d="M25 72h32q-15 18-32 0m52 0h32q-17 18-32 0" fill="#d9a655"/>',
 wheel:'<circle cx="65" cy="63" r="35" fill="#8c5d3a" stroke="#e5c283" stroke-width="8"/><circle cx="65" cy="63" r="10" fill="#efcf94"/><path d="M65 30v65M32 63h65M42 39l46 48M89 39 42 87" stroke="#ddb87a" stroke-width="5"/>',
 metal:'<path d="M24 78 39 44h53l17 34z" fill="#bfc5c4"/><path d="m39 44 15 33m36-33 13 34M30 81h73M50 26l10 12 14-13" fill="none" stroke="#f2d99f" stroke-width="4"/>',
 sword:'<path d="m39 96 49-72 11 9-51 71z" fill="#c7d6d7"/><path d="m34 82 24 18M31 102 53 80" stroke="#f0c56e" stroke-width="10"/>',
 water:'<path d="M65 19Q38 60 38 78a27 27 0 0 0 54 0Q92 60 65 19z" fill="#7fbacb"/><path d="M53 78q2 15 15 14" stroke="#e1f5ed" fill="none" stroke-width="5"/>',
 healing:'<path d="M51 25h29v24h23v27H80v24H51V76H27V49h24z" fill="#dedacc"/><path d="M61 35h10v24h23v9H71v22H61V68H38v-9h23z" fill="#ba4945" stroke="none"/>',
 stars:'<path d="m86 21 6 17 18 2-14 11 4 18-15-11-16 9 5-18-13-12 18 0z" fill="#f9d98b"/><circle cx="51" cy="71" r="24" fill="none" stroke="#8fbbcd" stroke-width="4"/><path d="M36 92 89 37" stroke="#f3dc9a" stroke-width="5"/>',
 learning:'<path d="m23 49 42-23 43 23-43 22z" fill="#bdb6d2"/><path d="M41 67v12q24 19 48 0V67M101 50v25" fill="none" stroke="#e5c57a" stroke-width="6"/>',
 factory:'<path d="M24 97V53l28 14V44l26 23V35h19v62z" fill="#a7aaaa"/><path d="M31 76h12m23 0h12m13 0h10" stroke="#e8d3a3" stroke-width="6"/>',
 train:'<path d="M24 30h77v54H24z" fill="#ac9f81"/><path d="M32 40h22v22H32z" fill="#80acb8"/><path d="M63 48h29M36 85l-11 18m65-18 13 18M24 103h83" stroke="#e4c27d" fill="none" stroke-width="5"/>',
 lightning:'<path d="M75 15 43 60h24l-17 50 50-58H76z" fill="#ffe180" stroke="#fff5ba" stroke-width="3"/>',
 flying:'<path d="M18 67 62 53 79 24l14-5-13 43 22 19-9 9-29-17-31 9z" fill="#afc5ce"/><path d="M51 54 26 38M70 76 55 95" fill="none" stroke="#efdaab" stroke-width="6"/>',
 gear:'<circle cx="65" cy="65" r="30" fill="#b1b8b9" stroke="#ebca87" stroke-width="7"/><circle cx="65" cy="65" r="12" fill="#122e43"/><path d="M65 19v13M65 98v13M19 65h14M98 65h13M33 33l11 11M86 86l11 11M97 33 86 44M44 86 33 97" stroke="#e3be7a" stroke-width="9"/>'
};
function symbolFor(id,tech){
 const t=(id+' '+(tech.name||'')).toLowerCase();
 if(/fish|kalap|nets|ocean/.test(t))return 'fish';
 if(/hunt|jahi|animal|loom|horse|ratsa|kari|livestock/.test(t))return 'hunt';
 if(/fire|tule|smelt|sulatus|powder/.test(t))return 'fire';
 if(/health|medicine|haavat|sanitation|hospita/.test(t))return 'healing';
 if(/aviat|lennund|airfield/.test(t))return 'flying';
 if(/electric|electronics|power_grid|electromagn/.test(t))return 'lightning';
 if(/rail|raudtee/.test(t))return 'train';
 if(/astron|observ|navigation|cartograph|survey|maamõõt/.test(t))return 'stars';
 if(/bridge|road|sild|tee|wheel|ratas|wagon|transport/.test(t))return 'wheel';
 if(/castle|fortif|linnus|wall|tower|defend|defens/.test(t))return 'castle';
 if(/war|military|soldier|sword|armor|knight|crossbow|archery|rifle|artillery|siege|weapon|sõja|piiram/.test(t))return 'sword';
 if(/ship|sailing|sail|harbor|laev|purjet/.test(t))return 'ship';
 if(/trade|market|commerce|bank|guild|kaup|raha|logistic|supply/.test(t))return 'market';
 if(/farm|crop|grain|irrigation|food|fertili|seed|agricult|põld|vilja|toit|milling|meadow|plough|scythe|sickle/.test(t))return 'field';
 if(/industry|industrial|factory|machin|engine|steam|autom|pneumatic/.test(t))return 'factory';
 if(/iron|steel|bronze|metal|smith|copper|ore|tin|sep|terase|raud/.test(t))return 'metal';
 if(/storage|cellar|jar|pottery|pott|lao|kiln/.test(t))return 'book';
 if(/water|veev|veevaru|drainage|kanal/.test(t))return 'water';
 if(/writing|printing|book|monastic|kirja|trüki|paper|literacy/.test(t))return 'book';
 if(/school|learning|education|science|comput|filoso|teadus|õpet|haridus|scholast/.test(t))return 'learning';
 if(/city|settle|civic|town|village|asund|küla|linn|hoone/.test(t))return 'castle';
 if(/wood|forest|mets|puu|lumber|timber|stone|kivi|mining|mine|cut|mason|craft|tool|drill|peitel|pick/.test(t))return 'stone';
 return 'gear';
}
function svgFor(id,tech){
 const h=[...id].reduce((n,c)=>(n*37+c.codePointAt(0))>>>0,5381);
 const age=Math.min(6,Math.max(0,Number(tech.age)||0)),theme=themes[age];
 const pattern=Array.from({length:6},(_,i)=>{
  const a=((h>>((i%4)*5))&31)*10+i*51,r=48+((h>>i)&3);
  return '<circle cx="'+(64+Math.cos(a*Math.PI/180)*r).toFixed(1)+'" cy="'+(64+Math.sin(a*Math.PI/180)*r).toFixed(1)+'" r="'+(1+(i%3)*.35)+'" fill="#f3d89e" opacity=".5"/>';
 }).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs>'+
 '<radialGradient id="bg"><stop stop-color="'+theme[1]+'" stop-opacity=".9"/><stop offset=".7" stop-color="'+theme[0]+'"/><stop offset="1" stop-color="#071523"/></radialGradient>'+
 '<linearGradient id="gold" x2="1" y2="1"><stop stop-color="#fff0ac"/><stop offset=".28" stop-color="#a86e32"/><stop offset=".55" stop-color="#f0cf80"/><stop offset="1" stop-color="#75411e"/></linearGradient>'+
 '</defs><circle cx="64" cy="64" r="62" fill="#081a2b" stroke="#70451c" stroke-width="4"/>'+
 '<circle cx="64" cy="64" r="57.5" fill="url(#bg)" stroke="url(#gold)" stroke-width="5"/>'+
 '<circle cx="64" cy="64" r="50" fill="none" stroke="#dab773" stroke-width="1.3" stroke-dasharray="1 5" opacity=".8"/>'+pattern+
 '<g stroke="#503c2d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,-2)">'+shapes[symbolFor(id,tech)]+'</g>'+
 '<path d="M51 8l13-6 13 6-13 6Z M51 120l13-6 13 6-13 6Z" fill="#edc575" stroke="#6c451f"/>'+
 '<path d="M15 64l8-11 8 11-8 11Z M97 64l8-11 8 11-8 11Z" fill="#d9ab58" stroke="#422c1b"/></svg>';
}
export function techArtSrc(id,tech={}){
 const safe=/^[a-z][a-z0-9_]*$/.test(String(id||''))?id:'unknown';
 const key=safe+'|'+(tech.name||'')+'|'+(tech.age||0);
 if(!cache.has(key))cache.set(key,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgFor(safe,tech)));
 return cache.get(key);
}
export function techArtMotif(id,tech={}){return symbolFor(id,tech);}
if(typeof window!=='undefined')window.KuningriigidTechArtV293={src:techArtSrc,motif:techArtMotif};
