// Science is a civic service: each completed, enabled institution multiplies
// its parent city's resident science by 1.5, including district institutions.
export const EDUCATION_TYPES=Object.freeze(['study','scriptorium','library','academy','school','university','monastery','chapel','observatory','public_school','high_school','polytechnic','laboratory']);
export const EDUCATION_MULTIPLIER=1.5;
export const EDUCATION_BUILDINGS={
 library:{name:'Raamatukogu',icon:'▤',cost:{wood:35,stone:25},requires:['house'],workers:1,time:65},
 school:{name:'Linnakool',icon:'✎',cost:{plank:40,stone:30},requires:['house'],workers:2,time:80},
 public_school:{name:'Üldhariduskool',icon:'✎',cost:{plank:65,stone:55,paper:10},requires:['house','saw'],workers:2,time:110},
 high_school:{name:'Keskkool',icon:'✥',cost:{plank:80,stone:75,paper:15},requires:['public_school'],workers:3,time:135}
};
export const EDUCATION_TECHS={
 literacy:{name:'Lugemine ja kirjaoskus',age:1,turns:3,requires:['writing'],unlocks:'Raamatukogu; +10% teadust kõigis riigi linnades'},
 public_education:{name:'Üldine kooliharidus',age:5,turns:6,requires:['industrialization','printing'],unlocks:'Üldhariduskool; +15% teadust kõigis riigi linnades'},
 secondary_education:{name:'Keskharidus',age:5,turns:7,requires:['public_education','scholasticism'],unlocks:'Keskkool; +10% teadust kõigis riigi linnades'}
};
export const EDUCATION_BUILD_TECH={library:'literacy',school:'scholasticism',public_school:'public_education',high_school:'secondary_education'};
// Percentages add together, then apply to the whole city's education output.
export const KNOWLEDGE_BONUSES=Object.freeze({writing:.10,literacy:.10,philosophy:.10,printing:.15,experimental_science:.15,public_education:.15,secondary_education:.10,computing:.20});
export function knowledgeMultiplier(known=[]){return 1+Object.entries(KNOWLEDGE_BONUSES).reduce((sum,[id,bonus])=>sum+(known.includes(id)?bonus:0),0);}
