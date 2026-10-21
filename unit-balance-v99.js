export const UNIT_BALANCE_VERSION=99;
export const BOW_DAMAGE_MULTIPLIER=.75;
export const BOW_UNITS=new Set(['archer','bronze_archer','iron_archer','crossbowman','chariot']);
// Definitions are shared with the naval/medieval modules. Apply once even
// when a legacy import URL loads another instance of civilization-core.
export function balanceUnitDefinitions(definitions){
 for(const [kind,d] of Object.entries(definitions)){
  if(d.unitBalanceVersion===UNIT_BALANCE_VERSION)continue;
  if(Number.isFinite(d.hp))d.hp*=2;
  if(BOW_UNITS.has(kind)&&Number.isFinite(d.dmg))d.dmg*=BOW_DAMAGE_MULTIPLIER;
  d.unitBalanceVersion=UNIT_BALANCE_VERSION;
 }
}
export function migrateUnitHealth(state){
 if(state.unitBalanceVersion===UNIT_BALANCE_VERSION)return;
 const seen=new Set();
 const scale=u=>{if(!u||seen.has(u))return;seen.add(u);for(const key of ['hp','maxHp'])if(Number.isFinite(u[key]))u[key]*=2;for(const m of [...(u.soldiers||[]),...(u.men||[])])scale(m);};
 for(const u of [...(state.units||[]),...(state.ships||[]),...(state.battle?.squads||[])])scale(u);
 // Buildings, city walls and fortresses retain their health.
 state.unitBalanceVersion=UNIT_BALANCE_VERSION;
}
