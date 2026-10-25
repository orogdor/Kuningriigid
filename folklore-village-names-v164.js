// V165: one national folklore pool per civilization. Do not mix names from
// neighbouring countries merely because they share some Nordic traditions.
// Names are gameplay flavour; some are places, other names are derived from
// characters, sagas and regional traditions, not necessarily Stone Age villages.
export const NORDIC_COUNTRIES=Object.freeze(['Eesti','Soome','Rootsi','Norra','Taani','Island']);
export const NORDIC_VILLAGE_NAMES=Object.freeze([
 // Eesti – Kalevipoeg, Suur Tõll, Leiger, Estonian folk tradition
 Object.freeze(['Kalevila','Lindamäe','Tõlluste','Piretila','Leigeri','Kaljuvald',
  'Sulevila','Alevila','Olevila','Vanemuise','Ilmarise','Ukuvere',
  'Taaramäe','Kääpa','Hiieoru','Kalevimäe']),
 // Soome – Kalevala and Finnish/Karelian poetic tradition
 Object.freeze(['Väinölä','Pohjola','Tapiola','Metsola','Ahtola','Sariola',
  'Hiitola','Kalevala','Tuonela','Joukola','Untamola','Kalervola',
  'Louhila','Ilmarila','Sampola','Ainola']),
 // Rootsi – Swedish Ynglinga, heroic legends, Swedish ancient places.
 // Skiringssal moved to Norway: the historical location was in Vestfold.
 Object.freeze(['Ynglinga','Svitjod','Bråvalla','Fornsigtuna','Birka','Vendel',
  'Fyrisvellir','Alvhem','Starkad','Hervor','Yngve',
  'Svea','Götaland','Järnsida','Runsten','Uppsala']),
 // Norra – Heimskringla and Norwegian old places and folklore
 Object.freeze(['Hlaðir','Skiringssal','Kaupang','Avaldsnes','Hrafnista','Dovre',
  'Hálogaland','Hǫrðaland','Hringaríki','Þrándheimr','Fitjar','Vík',
  'Sogn','Rogaland','Naumudalr','Niðaróss']),
 // Taani – Lejre / Skjoldung legends, Saxo and Danish heroic tradition
 Object.freeze(['Lejre','Hleiðra','Skjoldung','Heorot','Roarsborg','Rolfskilde',
  'Hrolfsholm','Frodesdal','Helgelund','Sigersted','Amledsby','Hadingsted',
  'Gramshøj','Thyraborg','Jelling','Hedeby']),
 // Island – Íslendingasögur and the sagas' Icelandic landscapes
 Object.freeze(['Hlíðarendi','Bergþórshváll','Reykholt','Hrafnkelsdalur',
  'Laxárdalur','Eiríksstaðir','Hjarðarholt','Hvammr',
  'Þingvellir','Borgarfjörður','Haukadalur','Skálholt',
  'Breiðafjörður','Keldur','Mývatn','Höskuldsstaðir'])
]);
export const NORDIC_NAME_SOURCES=Object.freeze([
 'Eesti pärimus ja Kalevipoeg',
 'Soome Kalevala',
 'Rootsi Ynglinga ja kangelaslood',
 'Norra kuningasaagad ja kohapärimus',
 'Taani Skjoldungi lood ja Saxo',
 'Islandi perekonnasaagad'
]);
export function countryForTeam(team=0){
 return NORDIC_COUNTRIES[((team%NORDIC_COUNTRIES.length)+NORDIC_COUNTRIES.length)%NORDIC_COUNTRIES.length];
}
export function nordicVillageName({seed=0,team=0,cityNumber=1,existingNames=[],factionNames=null}={}){
 const custom=factionNames?.[team];
 // Keep an explicitly user-set faction naming convention unchanged.
 if(typeof custom==='string'&&custom.trim())return custom.trim()+'küla '+cityNumber;
 const index=((team%NORDIC_VILLAGE_NAMES.length)+NORDIC_VILLAGE_NAMES.length)%NORDIC_VILLAGE_NAMES.length;
 const pool=NORDIC_VILLAGE_NAMES[index];
 const normalizedSeed=Number.isFinite(seed)?Math.trunc(seed):0;
 const offset=((normalizedSeed%pool.length)+pool.length)%pool.length;
 const start=(offset+team*7+Math.max(0,cityNumber-1))%pool.length;
 const used=new Set(existingNames);
 for(let i=0;i<pool.length;i++){
  const candidate=pool[(start+i)%pool.length];
  if(!used.has(candidate))return candidate;
 }
 let suffix=2;
 while(used.has(pool[start]+' '+suffix))suffix++;
 return pool[start]+' '+suffix;
}
