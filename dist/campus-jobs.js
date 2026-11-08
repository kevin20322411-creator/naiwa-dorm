(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports;
const B=browser?root.DormGame:require('./talent-effects.js');
const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);

function wageBonus(scene,choice){
 const pay=choice?.mods?.money||0;
 if(pay<=0||scene?.id?.startsWith('campus83-job-'))return 0;
 if(!choice.flags?.job&&scene?.id!=='term-shift')return 0;
 return pay>=20?4:pay>=14?3:2;
}

function startCampusJobs(s){
 if(!s?.campusLife||s.campusJobs||s.phase==='ending'||s.failed||s.lottery?.won)return s;
 if(s.school&&s.school.revision!==3)return s;
 // A job offered before the upgrade keeps its original rate until it resolves.
 if(s.rhythm?.pending?.key==='job')return s;
 if(s.phase==='choice'){
  const scene=B.getScene(s);
  if(scene?.choices?.some(choice=>wageBonus(scene,choice)))return s;
 }
 return{
  ...s,actions:[...s.actions,'jobs-v1'],
  campusJobs:{revision:1,base:JSON.parse(JSON.stringify(s))}
 };
}

function enableCampusJobs(s){
 const active=startCampusJobs(s);
 if(!active?.campusJobs||active.campusJobs.rules===2||active.failed||active.phase==='ending'||active.lottery?.won)return active;
 return{
  ...active,actions:[...active.actions,'jobs-rules-v2'],
  campusJobs:{...active.campusJobs,rules:2}
 };
}

function getScene(s){
 const scene=B.getScene(s);
 if(!s.campusJobs||s.phase!=='choice'||!scene)return scene;
 return{...scene,choices:scene.choices.map(choice=>{
  const bonus=wageBonus(scene,choice);
  if(!bonus)return choice;
  const pay=choice.mods.money+bonus;
  return{...choice,text:choice.text+' · ¥'+pay,mods:{...choice.mods,money:pay}};
 })};
}

function choose(s,index){
 const scene=s.phase==='choice'?B.getScene(s):null;
 const bonus=wageBonus(scene,scene?.choices?.[index]);
 const n=B.choose(s,index);
 if(!bonus||n.log.length!==s.log.length+1||n.outcome!==n.log.at(-1))return n;
 const money=B.apply(n.stats,{money:bonus}).money;
 if(money===n.stats.money)return n;
 const outcome={...n.outcome,changes:{...n.outcome.changes,money:money-s.stats.money}};
 return{...n,stats:{...n.stats,money},outcome,log:[...n.log.slice(0,-1),outcome]};
}

const mutators=new Set([
 'choose','next','startActivity','completeMini','cancelMini','continueDay','retire',
 'selectCourses','upgradeTimetable','startMajor','majorAct','cancelMajor','skipMajor',
 ...Object.keys(B).filter(key=>key.startsWith('enable')&&typeof B[key]==='function')
]);
const wrapped={};
for(const key of mutators){
 wrapped[key]=(s,...args)=>{
  if(!s.campusJobs)return B[key](s,...args);
  const n=key==='choose'?choose(s,...args):B[key](s,...args);
  if(n===s)return s;
  const action='jobs-action:'+encodeURIComponent(JSON.stringify([key,args]));
  return{...n,actions:[...s.actions,action]};
 };
}

function restore(raw){
 if(!raw?.campusJobs)return B.restore(raw);
 try{
  const layer=raw.campusJobs;
  if(layer.revision!==1||layer.base?.campusJobs||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;
  const base=B.restore(layer.base);
  if(!base)return null;
  const boundary=base.actions.length;
  if(raw.actions[boundary]!=='jobs-v1'||!same(raw.actions.slice(0,boundary),base.actions))return null;
  // Recreate the original rules first. Existing receipts keep their amounts.
  let s=startCampusJobs(base);
  if(!s.campusJobs)return null;
  for(const action of raw.actions.slice(boundary+1)){
   if(action==='jobs-rules-v2'){
    const upgraded=enableCampusJobs(s);
    if(upgraded===s)return null;
    s=upgraded;
    continue;
   }
   const match=/^jobs-action:(.+)$/.exec(action);
   if(!match)return null;
   const decoded=JSON.parse(decodeURIComponent(match[1]));
   if(!Array.isArray(decoded)||decoded.length!==2)return null;
   const [key,args]=decoded;
   if(!mutators.has(key)||!Array.isArray(args))return null;
   s=wrapped[key](s,...args);
  }
  return same(s,raw)?s:null;
 }catch{return null;}
}

root.DormGame={...B,...wrapped,create:(...args)=>enableCampusJobs(B.create(...args)),
 enableCampusJobs,getScene,restore,valid:s=>restore(s)!==null};
if(!browser)module.exports=root.DormGame;
})(typeof globalThis!=='undefined'?globalThis:this);
