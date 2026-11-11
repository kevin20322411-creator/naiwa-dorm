(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports;
const B=browser?root.DormGame:require('./campus-jobs.js');

function enableUnlimitedMoney(s){
 if(!s||s.wallet||s.phase==='ending'||s.failed||s.lottery?.won)return s;
 const lotteryCredit=s.lottery?.credit||0;
 const scholarshipCredit=s.evolution?.rewardCredit||0;
 const released=lotteryCredit+scholarshipCredit;
 return{
  ...s,
  ...(released?{stats:{...s.stats,money:s.stats.money+released}}:{}),
  ...(lotteryCredit?{lottery:{...s.lottery,credit:0}}:{}),
  ...(scholarshipCredit?{evolution:{...s.evolution,rewardCredit:0}}:{}),
  wallet:{revision:1,base:JSON.parse(JSON.stringify(s)),moves:[]}
 };
}

const mutations=new Set([
 'choose','next','startActivity','completeMini','cancelMini','continueDay','retire',
 'selectCourses','planCourseAttendance','upgradeTimetable','startMajor','majorAct','cancelMajor','skipMajor',
 ...Object.keys(B).filter(key=>key.startsWith('enable')&&typeof B[key]==='function')
]);
const wrapped={};
for(const key of mutations){
 wrapped[key]=(s,...args)=>{
  if(!s.wallet)return B[key](s,...args);
  // Lower layers may snapshot their input. Keep the wallet outside their
  // snapshots and retain their original action sequence for those layers.
  const {wallet,...game}=s;
  const next=B.withUncappedMoney(()=>B[key](game,...args));
  if(next===game)return s;
  return{...next,wallet:{...wallet,moves:[...wallet.moves,JSON.stringify([key,args])]}};
 };
}
for(const key of ['getScene','availableActivities','restPreview','schoolView','majorView','curriculumOptions','freeMinutes']){
 wrapped[key]=(s,...args)=>s?.wallet
  ? B.withUncappedMoney(()=>B[key](s,...args))
  : B[key](s,...args);
}

function restore(raw){
 if(!raw?.wallet)return B.restore(raw);
 try{
  const wallet=raw.wallet;
  if(wallet.revision!==1||wallet.base?.wallet||!Array.isArray(wallet.moves)||wallet.moves.length>30000)return null;
  // Restore every move preceding the migration with the original ¥150 limit.
  const base=B.restore(wallet.base);
  if(!base)return null;
  let s=enableUnlimitedMoney(base);
  if(!s.wallet)return null;
  for(const move of wallet.moves){
   const decoded=JSON.parse(move);
   if(!Array.isArray(decoded)||decoded.length!==2)return null;
   const [key,args]=decoded;
   if(!mutations.has(key)||!Array.isArray(args))return null;
   s=wrapped[key](s,...args);
  }
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}

root.DormGame={...B,...wrapped,create:(...args)=>enableUnlimitedMoney(B.create(...args)),
 enableUnlimitedMoney,restore,valid:s=>restore(s)!==null};
if(!browser)module.exports=root.DormGame;
})(typeof globalThis!=='undefined'?globalThis:this);
