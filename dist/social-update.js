(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./dining.js');
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const roll=(s,key)=>B.rng(hash(s.seed+':social-update-1:'+s.day+':'+s.step+':'+s.eventId+':'+(s.rhythm?.serial||0)+':'+key))();
const delta=(a,b)=>Object.fromEntries(B.keys.filter(k=>Number.isFinite(a[k])&&a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
function enableSocialUpdate(s){return s.version!==6||s.socialUpdate||s.phase==='ending'?s:{...s,socialUpdate:{ignoredDay:0},actions:[...s.actions,'z']};}
const create=(...args)=>enableSocialUpdate(B.create(...args));
function peerInteraction(scene,c){return !!scene&&!!c&&!scene.romanceScene&&!scene.mouseScene&&!['三餐','就诊安排','感冒插曲'].includes(scene.kind)&&!c.flags?.job&&!c.flags?.care&&!c.cure&&(c.mods.social||0)>0&&/交流|聊天|讨论|分享|同学|朋友|室友|社团|搭话|招呼|组队|合作|求助|借|打听/.test(c.text);}
function choose(s,index){if(!s.socialUpdate)return B.choose(s,index);const scene=B.getScene(s);let n=B.choose(s,index);if(s.stats.social>=30||s.socialUpdate.ignoredDay===s.day||n.failed||n.phase==='ending'||!n.outcome||n.log.length<=s.log.length||n.log.at(-1)!==n.outcome||!peerInteraction(scene,scene.choices[index]))return n;
 const chance=.15+(30-s.stats.social)/100;if(roll(s,'ignored:'+index)>=chance)return n;
 const loss=s.stats.social<10?6:s.stats.social<20?5:4,stats={...n.stats,social:Math.min(s.stats.social,n.stats.social),mood:Math.max(0,Math.min(s.stats.mood,n.stats.mood)-loss)},reasons=['对方正在赶自己的安排，只简单点点头，没能继续聊下去。','大家还不太熟悉，你发起的话题暂时没有被接上。','周围的人还在聊原来的话题，你几次想开口，都没找到合适的空隙。'],result=reasons[Math.floor(roll(s,'reason:'+index)*reasons.length)]+'奶蛙有些失落，先回去做自己手头的事。',entry={...n.outcome,result,changes:delta(s.stats,stats),ignored:true};
 return{...n,stats,outcome:entry,log:[...n.log.slice(0,-1),entry],socialUpdate:{...s.socialUpdate,ignoredDay:s.day},failed:stats.mood<=0?'fail-mood':n.failed};
}
function restore(raw){if(!raw?.socialUpdate)return B.restore(raw);try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);const upgrades={h:'enableCare',b:'enableBalance',v:'enableRomance',p:'enableStory',y:'enableRhythm',f:'enableFood',i:'enableIllness',q:'enableMeetings',w:'enableWellness',u:'enableCampus',t:'enableEvolution',j:'enableLottery',k:'enableCampusRevision',g:'enableDining',e:'enableEconomy',l:'enableLife'};
 for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=B.next(s);else if(a==='d')s=B.continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='m')s=B.enableCharacter(s,raw.character.selected,raw.character.fresh);else if(a==='z')s=enableSocialUpdate(s);else if(upgrades[a])s=B[upgrades[a]](s);else if(typeof a==='string'&&a.startsWith('a:'))s=B.startActivity(s,a.slice(2));else return null;}return JSON.stringify(s)===JSON.stringify(raw)?s:null;}catch{return null;}}
const api={...B,create,enableSocialUpdate,choose,restore,valid:s=>restore(s)!==null};root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
