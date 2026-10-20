// V73: preserve V71/V72 localStorage format (version 4) and previous autosaves.
// This module has no DOM dependencies and can be tested in Node or the browser.
export const ACTIVE_SAVE_KEY='kingdoms-civ4';
export const BACKUP_SAVE_KEY='kingdoms-civ4-backup';

export function decodeValidGame(raw,isValid){
 if(typeof raw!=='string'||!raw.trim())return null;
 try{const value=JSON.parse(raw);return isValid(value)?value:null}catch{return null}
}

export function loadProtectedGame(storage,isValid){
 for(const key of [ACTIVE_SAVE_KEY,BACKUP_SAVE_KEY]){
  let value=null;
  try{value=decodeValidGame(storage.getItem(key),isValid)}catch{}
  if(value)return {state:value,recovered:key===BACKUP_SAVE_KEY};
 }
 return {state:null,recovered:false};
}

// Backups are best-effort: low quota must never block saving the active game.
// Preserve the legacy snapshot exactly; do not change the version or cargo fields.
export function writeAutosave(storage,serialized,time,lastBackupTime,isValid){
 let backedUp=false;
 if(time-lastBackupTime>=60){
  try{
   const old=storage.getItem(ACTIVE_SAVE_KEY);
   if(decodeValidGame(old,isValid)){
    storage.setItem(BACKUP_SAVE_KEY,old);
    backedUp=true;
   }
  }catch{/* keep writing the main slot even if the backup fails */}
 }
 storage.setItem(ACTIVE_SAVE_KEY,serialized);
 return backedUp;
}

// Loading a manual slot, importing a file, or creating a new world is reversible:
// keep the prior good autosave as a recovery point where quota allows.
export function replaceProtectedGame(storage,serialized,isValid){
 if(!decodeValidGame(serialized,isValid))throw Error('Vigane või ühildumatu mänguseis');
 let backedUp=false;
 try{
  const old=storage.getItem(ACTIVE_SAVE_KEY);
  if(decodeValidGame(old,isValid)){
   storage.setItem(BACKUP_SAVE_KEY,old);
   backedUp=true;
  }
 }catch{/* do not prevent importing a valid saved game */}
 storage.setItem(ACTIVE_SAVE_KEY,serialized);
 return {backedUp};
}
