// V164: Nordic saga/epic-inspired settlement names. Names are flavour, not
// a claim that every name was a historically attested village.
// Pool 0: Kalevipoeg, Suur Tõll, Leiger and Estonian folklore.
// Pool 1: Kalevala and Finnish/Karelian poetic tradition.
// Pool 2: Swedish Ynglinga/heroic sagas and Old Swedish places.
// Pool 3: Edda, Icelandic sagas and Danish heroic storytelling.
export const NORDIC_VILLAGE_NAMES = Object.freeze([
 Object.freeze(['Kalevila','Lindamäe','Tõlluste','Piretila','Leigeri','Kaljuvald',
  'Sulevila','Alevila','Olevila','Vanemuise','Ilmarise','Ukuvere',
  'Taaramäe','Kääpa','Hiieoru','Kalevimäe']),
 Object.freeze(['Väinölä','Pohjola','Tapiola','Metsola','Ahtola','Sariola',
  'Hiitola','Kalevala','Tuonela','Joukola','Untamola','Kalervola',
  'Louhila','Ilmarila','Sampola','Ainola']),
 Object.freeze(['Ynglinga','Svitjod','Bråvalla','Fornsigtuna','Birka','Vendel',
  'Gamla Uppsala','Skiringssal','Alvhem','Starkad','Hervor','Yngve',
  'Svea','Sköldung','Järnsida','Runsten']),
 Object.freeze(['Ásgarðr','Miðgarðr','Útgarðr','Álfheimr','Nóatún','Breiðablik',
  'Fólkvangr','Himinbjörg','Glitnir','Þrymheimr','Valaskjálf',
  'Glaðsheimr','Iðavöllr','Jötunheimr','Lejre','Hlíðarendi'])
]);
export const NORDIC_NAME_SOURCES = Object.freeze(['Eesti pärimus','Kalevala','Rootsi saagad','Edda ja Põhjala saagad']);
export function nordicVillageName({seed=0,team=0,cityNumber=1,existingNames=[],factionNames=null}={}){
 const custom=factionNames?.[team];
 // Explicit saved player-created faction names keep their previous behaviour.
 if(typeof custom==='string'&&custom.trim())return custom.trim()+'küla '+cityNumber;
 const pool=NORDIC_VILLAGE_NAMES[((team%4)+4)%4];
 const normalizedSeed=Number.isFinite(seed)?Math.trunc(seed):0;
 const offset=((normalizedSeed%pool.length)+pool.length)%pool.length;
 const start=(offset+team*7+Math.max(0,cityNumber-1))%pool.length;
 const used=new Set(existingNames);
 for(let i=0;i<pool.length;i++){
  const candidate=pool[(start+i)%pool.length];
  if(!used.has(candidate))return candidate;
 }
 // Only after the pool is exhausted: readable numbered names, still unique.
 let suffix=2;
 while(used.has(pool[start]+' '+suffix))suffix++;
 return pool[start]+' '+suffix;
}
