(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./rhythm.js');
// A health failure on the final event does not complete that day. Keep all
// previously completed days and earned milestones, without changing save replay.
function awardSource(s){
 const last=s.log?.[s.log.length-1];
 return s.failed==='fail-health'&&s.stats.health<=0&&last?.day===s.day&&last.step===7?{...s,log:s.log.slice(0,-1)}:s;
}
const api={...B,achievements:s=>B.achievements(awardSource(s)),degreeStatus:s=>B.degreeStatus(awardSource(s))};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
