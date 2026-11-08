(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./wallet.js');
const clone=value=>JSON.parse(JSON.stringify(value)),countDays=rows=>new Set(rows.map(row=>row.day)).size;
// Eligibility is saved as revision 1. Preserve these rules when introducing a
// later revision, so a completed ending remains replayable after balance changes.
const items=Object.freeze([
 {id:'ending-graduation',icon:'🎓',name:'顺利毕业',quote:'课表上的课程一门门走完，课设也一份份交齐。奶蛙穿上学士服，在老校门前留下了一张毕业照。',rule:'完整度过21天，学业达到80；课设成功提交3次且没有缺交，实际到课20节，分布在至少10天。'},
 {id:'ending-research',icon:'🔬',name:'科研成功',quote:'读过的文献、反复检查的实验和组会上的讨论，终于连成了一个完整的结果。奶蛙的本科研究项目顺利结题。',rule:'完整度过14天，学业达到90、健康达到50；已加入课题组，完成12次实验室活动，分布在至少6天，并实际参与文献阅读、实验复现与组会。'},
 {id:'ending-together',icon:'💗',name:'和奶粉修成正果',quote:'从心动到认真相处，你们记住了彼此的喜好，也兑现了约定。聊起离开校园以后的生活，两个人的计划里都有对方。',rule:'正式恋爱满7天，亲密度达到90、魅力达到60、心情达到65；本次交往后认真兑现约定5次，分布在至少5天，了解活动与口味偏好，且没有未解决的误会。'}
].map(item=>Object.freeze({...item,hint:item.rule,positive:true})));
const byId=new Map(items.map(item=>[item.id,item]));
function metrics(s){
 const log=(s.log||[]).filter(row=>row&&Number.isInteger(row.day)&&row.day>0&&row.day<=s.day);
 // Score starts at 80, so only actual attendance can demonstrate coursework.
 const attendance=[...new Map(log.filter(row=>row.schoolCourse&&['attended','late'].includes(row.schoolStatus)).map(row=>[(row.schoolLessonId||row.eventId)+':'+row.day,row])).values()];
 const lab=log.filter(row=>row.campusActivity==='lab-work'&&[0,1,2].includes(row.index));
 const earned=s.romance?.earnedDay;
 let confession=-1;
 for(let i=0;i<log.length;i++){
  const row=log[i];
  if(row.day===earned&&['love-confession','love-naifen-confession'].includes(row.eventId)&&row.index===0&&row.intimacyChange>=0&&!row.contactDeleted)confession=i;
 }
 // Old saves may not contain a marked confession. Do not count earlier dates.
 const together=log.filter((row,i)=>confession>=0?i>confession:row.day>earned);
 // A successful promise can have zero visible gain at the intimacy cap.
 const promises=together.filter(row=>row.eventId==='love-bond-keep'&&Number.isFinite(row.intimacyChange)&&row.intimacyChange>=0&&!row.contactDeleted);
 return{attendance,lab,labKinds:new Set(lab.map(row=>row.index)),promises,datingDays:Number.isInteger(earned)&&earned>0&&earned<=s.day?s.day-earned:0};
}
function availablePositiveEndings(s){
 if(!s||s.phase!=='dayEnd'||s.positiveEnding||s.failed||s.lottery?.won||!s.stats||!Array.isArray(s.log)||['energy','study','health','mood'].some(key=>!Number.isFinite(s.stats[key])||s.stats[key]<=0))return [];
 const m=metrics(s),v=s.stats,r=s.relationships;
 return items.filter(item=>item.id==='ending-graduation'
  ?s.day>=21&&v.study>=80&&s.term?.passed>=3&&s.term?.missed===0&&m.attendance.length>=20&&countDays(m.attendance)>=10
  :item.id==='ending-research'
   ?s.day>=14&&v.study>=90&&v.health>=50&&s.campusLife?.joined===true&&m.lab.length>=12&&countDays(m.lab)>=6&&m.labKinds.size===3
   :s.romance?.connected===true&&s.romance?.dating===true&&m.datingDays>=7&&s.romance.intimacy>=90&&v.charm>=60&&v.mood>=65&&m.promises.length>=5&&countDays(m.promises)>=5&&r?.known?.includes('activity')&&r.known.includes('taste')&&r.strain===0);
}
function facts(s,id){
 const m=metrics(s),v=s.stats;
 if(id==='ending-graduation')return['完整度过 '+s.day+' 天 · 学业 '+v.study,'课设成功提交 '+s.term.passed+' 次 · 缺交 '+s.term.missed+' 次','实际到课 '+m.attendance.length+' 节，分布在 '+countDays(m.attendance)+' 天'];
 if(id==='ending-research')return['完整度过 '+s.day+' 天 · 学业 '+v.study+' · 健康 '+v.health,'已加入课题组','实验室活动 '+m.lab.length+' 次，分布在 '+countDays(m.lab)+' 天','文献阅读 '+m.lab.filter(row=>row.index===0).length+' 次 · 实验复现 '+m.lab.filter(row=>row.index===1).length+' 次 · 组会 '+m.lab.filter(row=>row.index===2).length+' 次'];
 return['正式恋爱 '+m.datingDays+' 天 · 亲密度 '+s.romance.intimacy,'魅力 '+v.charm+' · 心情 '+v.mood,'本次交往后认真兑现约定 '+m.promises.length+' 次，分布在 '+countDays(m.promises)+' 天','已了解活动与口味偏好 · 未解决的误会 '+s.relationships.strain];
}
function finishPositive(s,id){
 const item=availablePositiveEndings(s).find(row=>row.id===id);if(!item)throw Error('这条结局还没有达成。');
 const base=clone(s);
 return{...base,phase:'ending',failed:null,finalEnding:id,positiveEnding:{revision:1,id,base}};
}
function positiveEndingReport(s){
 const mark=s?.positiveEnding;
 if(!mark||mark.revision!==1||s.phase!=='ending'||s.failed||s.finalEnding!==mark.id||mark.base?.positiveEnding||!byId.has(mark.id))return null;
 try{
  const expected=finishPositive(mark.base,mark.id);if(JSON.stringify(expected)!==JSON.stringify(s))return null;
  const item=byId.get(mark.id);return{id:item.id,name:item.name,day:mark.base.day,player:mark.base.name,rule:item.rule,facts:facts(mark.base,item.id)};
 }catch{return null;}
}
function resumePositive(s){if(!positiveEndingReport(s))throw Error('当前没有可继续的正向结局。');return clone(s.positiveEnding.base);}
function restore(raw){
 if(!raw?.positiveEnding)return B.restore(raw);
 try{
  const mark=raw.positiveEnding;
  if(mark.revision!==1||mark.base?.positiveEnding||!byId.has(mark.id))return null;
  const base=B.restore(mark.base);if(!base)return null;
  const result=finishPositive(base,mark.id);
  return JSON.stringify(result)===JSON.stringify(raw)?result:null;
 }catch{return null;}
}
// Keep the original replay timeline inside the snapshot. Finishing a chapter
// must not become an unknown action in the wallet or historical school engine.
const mutations=new Set(['choose','next','startActivity','completeMini','cancelMini','continueDay','retire','selectCourses','upgradeTimetable','startMajor','majorAct','cancelMajor','skipMajor',...Object.keys(B).filter(key=>key.startsWith('enable')&&typeof B[key]==='function')]);
const guarded={};
for(const key of mutations)if(typeof B[key]==='function')guarded[key]=(s,...args)=>{
 if(!s?.positiveEnding)return B[key](s,...args);
 if(key.startsWith('enable')||key==='upgradeTimetable')return s;
 throw Error('先选择继续校园生活，再安排新的事情。');
};
const api={...B,...guarded,positiveEndings:items,availablePositiveEndings,finishPositive,resumePositive,positiveEndingReport,restore,valid:s=>restore(s)!==null,
 ending:s=>s?.positiveEnding&&positiveEndingReport(s)?byId.get(s.positiveEnding.id):B.ending(s),
 achievements:s=>B.achievements(s?.positiveEnding?resumePositive(s):s),
 availableActivities:s=>s?.positiveEnding?[]:B.availableActivities(s),endings:[...B.endings,...items]};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
