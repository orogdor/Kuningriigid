// The campaign pace changes long-term progression costs, not physical movement,
// production yields per worker, or hourly food and water consumption.
export const TEMPOS = Object.freeze({
 fast: {name:'Kiire',factor:.7,description:'30% lühemad ehitused, väljaõpe, kasv ja teadusuuringud'},
 normal: {name:'Tavaline',factor:1,description:'Tasakaalustatud arengutempo'},
 epic: {name:'Eepiline',factor:1.5,description:'50% pikemad ehitused, väljaõpe, kasv ja teadusuuringud'}
});
export const tempoMultiplier = state => TEMPOS[state?.tempo]?.factor ?? 1;
export const tempoName = state => TEMPOS[state?.tempo]?.name ?? TEMPOS.normal.name;
