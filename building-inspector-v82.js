// V82: game-data-driven building inspector usable in EVERY era.
// Pure read-only model: never mutates a building, save state, or economy.
export const BUILDING_ROLES=Object.freeze({
 hall:'Linna keskus. Näitab linna juhtimise, elanike ja varude lähtekohta.',
 house:'Elamu annab elanikele elukohti ja toetab asula kasvu.',
 warehouse:'Hoiab linna ehitus- ja tootmismaterjalide varusid.',
 cellar:'Hoiab toiduaineid ja suurendab toiduhoidla mahutavust.',
 market:'Viib toitu majapidamistesse ning võimaldab elanikel turul käia.',
 well:'Toodab vett elanike ja teiste hoonete jaoks.',
 farm:'Kasvatab vilja, millest saab jahvatada jahu.',
 mill:'Jahvatab teravilja jahuks.',
 bakery:'Küpsetab jahust ja veest toitu.',
 lumber:'Kogub metsast puitu.',
 forester:'Istutab ja hooldab metsa, et puiduvaru taastuks.',
 saw:'Muudab puidu ehituslaudadeks.',
 quarry:'Kogub ja töötleb kivi.',
 mason:'Lõikab ja töötleb ehituskivi.',
 hunter:'Varub metsloomade küttimisega toitu.',
 fisher:'Püüab kalu ja varustab linna toiduga.',
 mine:'Kaevandab rauamaaki.',
 coal:'Toodab söevaru metalli tootmiseks.',
 smelter:'Sulatab maagi ning valmistab rauda.',
 smith:'Valmistab metallist tööriistu ja relvi.',
 bronze_foundry:'Valab vasest ja tinast pronksesemeid.',
 coppermine:'Kaevandab vasemaaki.',
 tinmine:'Kaevandab tina.',
 printer:'Trükikojas valmistatakse paberile trükitud materjale.',
 observatory:'Tähetornis tehakse astronoomilisi vaatlusi ja teadustööd.',
 university:'Kõrgem õppeasutus suurendab linna teadustööd.',
 academy:'Õppehoone tegeleb teadmiste arendamisega.',
 polytechnic:'Tehnikaülikool edendab inseneriteadust ja tööstust.',
 scriptorium:'Raamatute ja käsikirjade valmistamise koht.',
 study:'Õpikoda, mis aitab kaasa tehnoloogia arengule.',
 chapel:'Palvela ja linna ühiskondlik hoone.',
 monastery:'Klooster, kus tegeldakse õppimise ja kogukonnaeluga.',
 guildhall:'Käsitöömeistrite ja kaupmeeste kogunemiskoht.',
 inn:'Kõrts ja reisijate peatuskoht.',
 barracks:'Sõdurite väljaõppe ja garnisoni hoone.',
 archery:'Vibu- ja kaugvõitlejate harjutuskoht.',
 crossbow_range:'Amburite väljaõppeplats.',
 stable:'Hobuste pidamise ja ratsaväe väljaõppe koht.',
 keep:'Kindlustatud peatorn, mis toetab linna kaitset.',
 gatehouse:'Väravahoone, mis kontrollib läbipääsu kindlustusse.',
 watchtower:'Vahitorn vaenlaste jälgimiseks ja tõrjumiseks.',
 stonetower:'Kivist kaitsetorn.',
 stonewall:'Linna kaitsemüüri lõik.',
 palisade:'Puitkindlustuse müürilõik.',
 reinforced_wall:'Tugevdatud kaitsemüür.',
 harbor:'Sadam ja laevatehas laevade ehitamiseks ja liikumiseks.',
 bridge:'Sild ühendab raskesti läbitavaid kaldapiirkondi.',
 watermill:'Vesiratta abil töötav tootmishoone.',
 windmill:'Tuule abil töötav veski.',
 trade_yard:'Kaupade ümberlaadimise ja kaubanduse keskus.',
 road_depot:'Teede, vankrite ja kaupade varustuspunkt.',
 cartwright:'Valmistab ja parandab vankreid.',
 armor_workshop:'Valmistab ja hooldab sõjavarustust.',
 master_workshop:'Meistrite tootmistöökoda.',
 siegeworkshop:'Valmistab piiramisvarustust.',
 claypit:'Kogub savi.',
 pottery_kiln:'Põletab keraamikaesemeid.',
 pasture:'Kariloomade kasvatusala.',
 nitrate:'Salpeetritöökoda püssirohutootmiseks.',
 powdermill:'Püssirohutehas.',
 steelworks:'Terase tootmise ja töötlemise tehas.',
 engineworks:'Masinate ja aurumootorite tootmiskeskus.',
 railstation:'Raudteejaam linnadevaheliseks transpordiks.',
 oilwell:'Puurib ja kogub naftat.',
 refinery:'Rafineerib naftat kütuseks.',
 powerplant:'Toodab elektrienergiat.',
 autofactory:'Valmistab mootorsõidukeid.',
 laboratory:'Teaduslaboratoorium.',
 airfield:'Lennuväli õhusõidukitele.'
});
const number=n=>Number.isFinite(n)?Number(n.toFixed(2)):0;
const formatResource=(resources,labels)=>Object.entries(resources||{})
 .filter(([,v])=>v!=null&&Number(v)!==0)
 .map(([k,v])=>(labels?.[k]||k)+': '+number(Number(v))).join(' · ');
export function describeBuilding({game,city,building,definitions,resourceNames,techByBuilding,techNames,ages}){
 if(!building?.type)return null;
 const def=definitions?.[building.type]||{};
 const owner=building.team??city?.team??0;
 const era=game?.s?.ages?.[owner]??0;
 const visual=building.previewAge??game?.buildingAge?.(owner,building.type)??era;
 const workerLimit=Math.max(0,Number(building.workerLimit??def.workers??0));
 const assigned=Math.max(0,Number(building.assigned??0));
 const efficiency=Math.max(0,Number(building.efficiency??(workerLimit?assigned/workerLimit:1)));
 const expectedHP=Math.max(1,Number(building.maxHp||def.hp||350),Number(building.hp||0));
 const ready=!!building.ready,baseRate=Number(def.rate||0);
 const ageLabel=ages?.[era]?.name||'Ajastu '+era;
 const techKey=techByBuilding?.[building.type];
 const techLabel=techKey?(techNames?.[techKey]?.name||techKey):'—';
 const from=resourceNames||{};
 const costs=formatResource(def.cost,from),inputs=formatResource(def.input,from);
 const output=def.out?(from[def.out]||def.out)+' · '+number(baseRate)+' ühikut'+(def.cycle?' / '+number(Number(def.cycle))+' s':''):'—';
 const limit=game?.constructionTime?.(building.type)||def.time||0;
 const remaining=ready?0:Math.max(0,limit-(building.progress||0));
 const phase=ready?'Valmis':(building.status||'Ehitamisel');
 const eta=ready?'—':(efficiency>0?number(remaining/efficiency)+' s':'Ootab töötajaid');
 const purpose=BUILDING_ROLES[building.type]||
  (def.out?'Toodab linna jaoks ressurssi: '+(from[def.out]||def.out)+'.':
   'Linna taristu või teenindushoone.');
 const level=Number(building.upgradeLevel||0);
 return {
  type:building.type,icon:def.icon||'⌂',name:def.name||building.type,
  purpose,age:era,ageLabel,visualAge:visual,
  owner,cityName:city?.name||'',ready,phase,
  hp:number(building.hp||0),maxHp:number(expectedHP),
  workers:number(assigned),workerLimit:number(workerLimit),
  efficiency:number(efficiency*100),constructionProgress:ready?100:number(Math.min(100,Math.max(0,(building.progress||0)/Math.max(1,limit)*100))),
  eta,upgradeLevel:level,technology:techLabel,
  cost:costs||'—',inputs:inputs||'—',output,cycle:def.cycle||0,
  location:{x:number(building.x||0),z:number(building.z||0)},
  status:building.status||phase,
  disabled:!!building.disabled,production:!!def.out,
  storageInfo:building.type==='warehouse'?'Materjalide ladu':building.type==='cellar'?'Toidulao maht':null
 };
}
