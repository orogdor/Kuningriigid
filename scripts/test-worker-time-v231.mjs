import assert from 'node:assert/strict';
import {gather} from '../navigation.js';
function fixture(workDt,phase='out'){
 const b={type:'lumber',workerKey:'basic:wood',team:0,x:0,z:0},w={x:0,z:0,phase,resourceId:0,goal:{x:10,z:0},work:0};
 const world={resources:[{id:0,kind:'tree',x:10,z:0,amount:100}],workers:{'basic:wood':w}};
 const nav={world,moveCitizen:(a,p,dt,speed)=>{a.x+=dt*speed;a.moving=true;return false;}};
 gather({buildings:[b],time:0},b,{cycle:20,rate:1},workDt,nav,1,1);return w;
}
assert.equal(fixture(.2).x,fixture(1).x);
assert.equal(fixture(.2).x,3);
assert.equal(fixture(.2,'work').work,.2);
assert.equal(fixture(1,'work').work,1);
assert.equal(fixture(.2,'work').workRate,.2);
assert.equal(fixture(.2,'return').x,3);
console.log('PASS normal outbound/return walking and slower work without a workplace');
