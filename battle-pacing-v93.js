import {BATTLEFIELD} from './battlefield-v88.js';
export const BATTLE_TIME_SCALE=.5;
export const BATTLE_EMPTY_HALF_WIDTH=BATTLEFIELD.tileWidth/2;
export const BATTLE_FRONT_DEPTH=BATTLE_EMPTY_HALF_WIDTH+19;
export const battleDelta=dt=>dt*BATTLE_TIME_SCALE;
export function allowedDeployment(u,p,b){return !b.deploymentGap||b.fortress||u.guardPost||u.civilian||u.manualOrder||p.x*(u.battleSide||1)<=-BATTLE_EMPTY_HALF_WIDTH-(p.radius||0);}
