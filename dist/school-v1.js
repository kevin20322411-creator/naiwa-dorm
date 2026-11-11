(function(root){
'use strict';
// The published engines remain immutable. School begins at an explicit, validated replay boundary.
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./mini-games.js');
const clone=x=>JSON.parse(JSON.stringify(x)),minute=t=>Number(t?.slice(0,2)||0)*60+Number(t?.slice(3)||0),clock=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const majorData=[
 ['cs','计算机科学与技术','💻','从第一行代码，到能运行的小项目。','code',[['programming','程序设计','机房 A203','循环与条件的小练习'],['algorithms','数据结构','教学楼 B302','把数据排成清楚的队列'],['systems','计算机系统','实验楼 C201','画出程序与硬件的联系']]],
 ['bio','生物科学','🧬','观察、实验与记录，把猜想交给证据。','experiment',[['cell','细胞生物学','生命楼 201','细胞结构观察记录'],['biolab','生物学实验','生命楼实验室','样本观察与误差说明'],['ecology','生态学','教学楼 B204','校园样方观察报告']]],
 ['business','工商管理','📊','从一张账表，读懂选择与资源。','chart',[['economics','微观经济学','商学院 203','供需变化分析图'],['accounting','基础会计','商学院实训室','一张收支核对表'],['marketing','市场调研','教学楼 B206','校园小店调研卡']]],
 ['literature','汉语言文学','📖','读作品、找证据，也写下自己的理解。','writing',[['reading','文学作品选读','文学院 302','一段文本的细读札记'],['language','现代汉语','文学院 201','句法与表达分析页'],['writing','写作实践','文学院研讨室','一篇校园随笔草稿']]],
 ['design','视觉传达设计','🎨','观察形状与颜色，让想法成为作品。','design',[['composition','平面构成','设计楼 203','点线面的构成练习'],['color','色彩基础','设计楼画室','校园配色观察板'],['studio','设计工作坊','设计楼工作室','一张校园海报草图']]]
];
const majors=majorData.map(([id,name,icon,desc,workKind,courses])=>({id,name,icon,desc,workKind,courses:courses.map(([key,name,place,work],i)=>({id:id+'-'+key,name,place,work,kind:workKind,attendanceRate:[.6,.85,.35][i],attendanceHint:['偶尔随机点名；迟到可能错过签到。','经常课前签到；实验或练习要本人到场。','不定期随堂提问；也可能整节不点名。'][i]}))}));
const weekLabels=['周一','周二','周三','周四','周五','周六','周日'];
// Times belong to the timetable, never to the legacy random event slots. Saturday and Sunday stay free.
const timetable=[[[0,480,550],[1,600,670],[2,840,910]],[[1,600,670],[0,840,910]],[[0,480,550],[2,600,670],[1,840,910]],[[1,600,670],[2,840,910]],[[0,480,550],[2,600,670]],[],[]];
const statuses={upcoming:'待上课',attended:'已到课',late:'迟到',missed:'旷课 · 点名未到',unrecorded:'未到 · 本节未点名',excused:'已请假',passed:'启用前课程'};
const majorOf=s=>majors.find(m=>m.id===s.school?.majorId),now=s=>s.rhythm?.clock??minute(s.outcome?.time),moment=s=>s.day*1440+now(s);
const failure=s=>s.stats.health<=0?'fail-health':s.stats.mood<=0?'fail-mood':s.stats.energy<=0?'fail-energy':s.stats.study<=0?'fail-study':s.term?.missed>=2?'fail-course':s.failed;
function lessons(s,day=s.day){const major=majorOf(s);if(!major)return[];return timetable[(day-1)%7].map(([index,start,end])=>{const c=major.courses[index],id='school-'+day+'-'+c.id;return{id,courseId:c.id,name:c.name,place:c.place,day,start,end,time:clock(start)+'–'+clock(end),attendanceHint:c.attendanceHint};});}
function eligible(s,l){const start=s.school.started;return l.day>start.day||(l.day===start.day&&l.start>=start.minute);}
function unresolved(s){return lessons(s).find(l=>eligible(s,l)&&!s.school.attendance[l.id])||null;}
function enableSchool(s,majorId='cs'){
 if(s.school)return s;if(!majors.some(m=>m.id===majorId))throw Error('请选择一个有效专业');if(s.version!==6||!s.rhythm||s.phase==='ending')return s;
 const school={revision:1,majorId,base:clone(s),started:{day:s.day,minute:now(s)},attendance:{},records:{},pending:null,returnTo:null,lastWork:null};
 for(const c of majors.find(m=>m.id===majorId).courses)school.records[c.id]={id:c.id,name:c.name,attended:0,late:0,missed:0,excused:0,makeup:0,repaired:0,risk:0,score:80};
 return{...s,school,actions:[...s.actions,'school-v1:'+majorId]};
}
function create(seed,traits,name,recent,background,majorId='cs'){return enableSchool(B.create(seed,traits,name,recent,background),majorId);}
function schoolView(s){
 if(!s.school)return null;const major=majorOf(s),monday=s.day-((s.day-1)%7),decorate=l=>{const a=s.school.attendance[l.id],status=a?.status||(eligible(s,l)?'upcoming':'passed');return{...l,status,statusLabel:statuses[status],...(a?{checked:a.checked}:{})};};
 const today=lessons(s).map(decorate),days=weekLabels.map((label,i)=>({label,day:monday+i,lessons:lessons(s,monday+i).map(decorate)}));
 const records=major.courses.map(c=>{const r=s.school.records[c.id];return{...r,warning:r.risk>=4?'缺勤提醒：请尽快补学并和老师沟通。':r.risk>=2?'有待补上的课堂内容，安排一次补学。':r.makeup?'有课堂内容待补学。':'到课记录平稳。',attendanceHint:c.attendanceHint+' 未到课不获得学习收益，只有点名未到才记缺勤。'};});
 let next=today.find(l=>l.status==='upcoming')||null;for(let day=s.day+1;!next&&day<=s.day+7;day++)next=lessons(s,day).filter(l=>eligible(s,l)).map(decorate)[0]||null;
 return{major,week:Math.ceil(s.day/7),weekday:weekLabels[(s.day-1)%7],days,today,next,records,lastWork:s.school.lastWork};
}
const previous=s=>({phase:s.phase,eventId:s.eventId,outcome:s.outcome});
function openCourse(s,l,runner=false){return{...s,eventId:l.id,phase:'choice',outcome:null,school:{...s.school,pending:{lesson:l,previous:previous(s),runner},returnTo:null},rhythm:{...s.rhythm,clock:Math.max(now(s),l.start-(runner?10:0))}};}
const canLeave=s=>!!(s.illness?.active||s.stats.health<55||s.medical&&!s.medical.done||s.evolution?.bite);
const canRush=(s,l)=>!!s.miniGames&&l.start<600&&!(s.miniGames.daily?.day===s.day&&s.miniGames.daily.base?.runner)&&!s.miniGames.pending&&now(s)<=l.start+10;
function courseScene(s){const p=s.school.pending,l=p.lesson,c=majorOf(s).courses.find(c=>c.id===l.courseId),choices=[
 {text:now(s)>=l.end?'本节已经结束，之后可安排补学':now(s)>l.start+10?'现在进教室，听完剩下的内容':'按时到教室，认真完成课堂练习',mods:{study:4},flags:{},schoolChoice:'attend',hint:'课堂结束后留下自己的'+c.work+'。',...(now(s)>=l.end?{disabledReason:'本节已结束，请记录未到或说明请假事由后补学'}:{})},
 {text:'这节不去了',mods:{},flags:{},schoolChoice:'skip',hint:'未到课没有学习或课设收益；只有老师点名才记缺勤。'},
 {text:'身体不舒服，先请个假',mods:{},flags:{},schoolChoice:'leave',hint:'请假不记缺勤，之后可在空闲时补学。',...(canLeave(s)?{}:{disabledReason:'当前没有请假事由'})}
 ];if(canRush(s,l))choices.push({text:'冲向教室 · 早八赶路',mods:{},flags:{},schoolChoice:'runner',hint:'赶路成功按时到课，失败记迟到；课堂收益只结算一次。'});
 return{id:l.id,courseId:l.courseId,schoolScene:true,kind:'专业课程',time:clock(Math.max(now(s),l.start)),place:l.place,title:l.name+' · '+(now(s)>l.start+10?'现在赶去还来得及听一段':'上课时间到了'),text:'第 '+Math.ceil(s.day/7)+' 周 '+weekLabels[(s.day-1)%7]+' · '+l.time+'。今天的小目标：'+c.work+'。',bubble:'带着自己的课表去上课。',emoji:majorOf(s).icon,choices};
}
const safeAcademic=new Set(['base-1','wrong-class','attendance-link']);
function protectedScene(scene,s){return scene?.kind==='三餐'||scene?.romanceScene||!!(s.medical||s.evolution?.care||s.wellness?.mouse||s.campusRevision?.proposal||s.journeys?.pending)||/课设截止|就诊|感冒/.test(scene?.kind||'')||/^term-|^well-|^ill-/.test(scene?.id||'');}
// A pending activity was approved in its original free-time window. A class can delay it,
// but may not invalidate that approval merely because a legacy event slot is now in the past.
function activityInput(s){const p=s.campusLife?.pending||s.relationships?.pending||s.rhythm?.pending||s.medical;if(s.phase==='choice'&&p&&!p.done&&Number.isFinite(p.at)&&now(s)>p.at)return{...s,rhythm:{...s.rhythm,clock:p.at}};return s;}
function getScene(s){
 if(!s.school)return B.getScene(s);if(s.school.pending)return courseScene(s);if(s.phase==='outcome'&&s.outcome?.schoolCourse){const l=s.outcome;return{id:l.eventId,courseId:l.courseId,schoolScene:true,kind:l.schoolMakeup?'课程补学':'专业课程',time:l.time,place:l.place||'教学楼',title:l.title,text:'',bubble:l.schoolWork?'这节课的小成果，收好了。':l.schoolMakeup?'漏下的内容，补上了。':l.schoolStatus==='excused'?'先休息，恢复后再补上。':l.schoolStatus==='unrecorded'?'这次没点名，内容还得补。':'这节没到，记进课表。',emoji:majorOf(s).icon,choices:[]};}
 const scene=B.getScene(activityInput(s));if(!scene)return scene;const n={...scene,time:clock(Math.max(now(s),minute(scene.time))),choices:scene.choices.map(c=>({...c}))},l=unresolved(s);if(!l||s.phase!=='choice')return n;const gap=l.start-now(s);
 for(const c of n.choices){const duration=c.minutes??(c.outside?45:10);if(duration>gap){const warning='会跨过 '+clock(l.start)+' 的'+l.name+'；可先去上课再回来。';c.hint=(c.hint?c.hint+' ':'')+warning;if(!protectedScene(scene,s)&&duration>0)c.disabledReason=c.disabledReason||warning;}}
 if(scene.kind!=='三餐'&&n.choices.some(c=>(c.minutes??10)>gap))n.choices.push({text:'先去上 '+l.name+'，之后回来处理',mods:{},flags:{},schoolGo:true});return n;
}
// Some legacy choices use their original slot time. Delay their presentation and nutrition together.
function monotonic(s,n,chosen=false){
 if(!s.school||n.day!==s.day||!n.rhythm)return n;const added=n.log.length>s.log.length&&n.outcome===n.log.at(-1),start=Math.max(now(s),minute(n.outcome?.time)),duration=chosen&&added?(n.outcome.minutes??10):0,target=Math.max(now(s)+duration,n.rhythm.clock);
 if(n.rhythm.clock>=target)return n;let outcome=n.outcome,log=n.log;if(added){outcome={...outcome,time:clock(start)};log=[...log.slice(0,-1),outcome];}
 let baseline={...n,outcome,log,rhythm:{...n.rhythm,clock:Math.max(now(s),n.rhythm.clock)}};if(n.nutrition)baseline.nutrition={...n.nutrition,at:Math.max(s.nutrition?.at||0,moment(baseline))};
 return B.settleNutrition(baseline,{...baseline,rhythm:{...baseline.rhythm,clock:target}});
}
function finishCourse(s,mode,runnerScore=null){
 const p=s.school.pending,l=p.lesson,c=majorOf(s).courses.find(c=>c.id===l.courseId),checked=B.rng(hash(s.seed+':school-rollcall:'+l.day+':'+l.courseId))()<c.attendanceRate,late=mode==='attend'&&(runnerScore===0||runnerScore!==1&&now(s)>l.start+10),missed=mode==='skip'&&checked;
 if(mode==='attend'&&now(s)>=l.end)throw Error('本节已经结束，请先记录未到课再安排补学');if(mode==='leave'&&!canLeave(s))throw Error('当前没有请假事由');const r={...s.school.records[c.id]},status=mode==='leave'?'excused':mode==='skip'?(checked?'missed':'unrecorded'):late?'late':'attended';
 const signed=mode==='attend'&&(!late||!checked),study=mode==='attend'?(late?2:4):0,project=study,mods=mode==='attend'?{study,energy:-2}:{},stats=B.apply(s.stats,mods);
 if(mode==='attend'){if(late){r.late++;if(checked){r.missed++;r.risk++;r.score=Math.max(0,r.score-3);}}else{r.attended++;r.score=Math.min(100,r.score+1);}}else if(mode==='leave'){r.excused++;r.makeup++;}else{r.makeup++;if(missed){r.missed++;r.risk+=2;r.score=Math.max(0,r.score-8);}}
 const work=mode==='attend'?{title:c.work,course:c.name,courseId:c.id,kind:c.kind,caption:late?'补听后完成的一份课堂草稿。':'奶蛙在课堂上动手完成，留下今天的一小步。',day:s.day,seed:hash(s.seed+':work:'+l.id),late}:null;
 let result=mode==='attend'?(late?'迟到后听完了剩余内容，完成了一份简短练习。'+(checked?'本节有签到，迟到错过了签到；可以之后补学并向老师说明。':'本节未抽查签到，迟到仍如实记下。'):'奶蛙按时到课，认真完成了'+c.work+'。'):mode==='leave'?'已经向老师说明身体情况，本节记为请假，待恢复后补学。':checked?'本节老师抽查了出勤，点名未到，记一次缺勤。没有获得学习或课设收益。':'奶蛙没有到课；本节未抽查出勤，不记缺勤，也没有获得学习或课设收益。';
 const entry={day:s.day,step:-1,eventId:l.id,index:mode==='attend'?0:mode==='skip'?1:2,time:clock(Math.max(now(s),l.start+(runnerScore===0?15:0))),title:l.name+' · '+statuses[status],place:l.place,choice:mode==='attend'?'到课并完成练习':mode==='skip'?'未到课':'身体不适请假',result,changes:Object.fromEntries(B.keys.filter(k=>stats[k]!==s.stats[k]).map(k=>[k,stats[k]-s.stats[k]])),flags:mode==='attend'?{schoolAttend:1}:{},project,minutes:Math.max(0,l.end-Math.max(now(s),l.start+(runnerScore===0?15:0))),schoolCourse:c.id,courseId:c.id,schoolStatus:status,schoolChecked:checked,...(work?{schoolWork:work}:{}),...(runnerScore!==null?{miniGame:'mini-runner',miniScore:runnerScore}:{})};
 const n={...s,stats,phase:'outcome',outcome:entry,eventId:l.id,log:[...s.log,entry],flags:{...s.flags,...(mode==='attend'?{schoolAttend:(s.flags.schoolAttend||0)+1}:{})},term:{...s.term,progress:s.term.progress+project},rhythm:{...s.rhythm,clock:Math.max(now(s),l.end)},school:{...s.school,pending:null,returnTo:p.previous,attendance:{...s.school.attendance,[l.id]:{status,checked,signed,day:s.day,courseId:c.id}},records:{...s.school.records,[c.id]:r},lastWork:work||s.school.lastWork}};
 return B.settleNutrition(s,{...n,failed:failure(n)},0,false);
}
function withAction(s,n,name,args=[]){return{...n,actions:[...s.actions,'school-'+name+':'+encodeURIComponent(JSON.stringify(args))]};}
function chooseUnderlying(s,index){const input=activityInput(s);if(input===s)return monotonic(s,B.choose(s,index),true);const raw=B.choose(input,index),added=raw.log.length>s.log.length,duration=added?(raw.outcome.minutes??10):0,outcome=added?{...raw.outcome,time:clock(now(s))}:raw.outcome,log=added?[...raw.log.slice(0,-1),outcome]:raw.log,baseline={...raw,outcome,log,rhythm:{...raw.rhythm,clock:now(s)},...(s.nutrition?{nutrition:{...s.nutrition,lastIncident:raw.nutrition.lastIncident}}:{})};return B.settleNutrition(baseline,{...baseline,rhythm:{...baseline.rhythm,clock:now(s)+duration}},0,false);}
function startRunner(s){const p=s.school.pending,l=p.lesson;if(!canRush(s,l))throw Error('这节课不能再安排早八赶路');return{...s,school:{...s.school,pending:{...p,runner:true}},miniGames:{...s.miniGames,pending:{key:'mini-runner',day:s.day,token:hash(s.seed+':school-runner:'+l.id+':'+s.actions.length).toString(36)}}};}
function choose(s,index){
 if(!s.school)return B.choose(s,index);if(s.miniGames?.pending)throw Error('先完成眼前的互动');const scene=getScene(s),c=scene?.choices[index];if(s.phase!=='choice'||!Number.isInteger(index)||!c||c.disabledReason)throw Error(c?.disabledReason||'现在不能选择');
 let n;if(s.school.pending)n=c.schoolChoice==='runner'?startRunner(s):finishCourse(s,c.schoolChoice);else if(c.schoolGo)n=openCourse(s,unresolved(s));else n=chooseUnderlying(s,index);return withAction(s,n,'choose',[index]);
}
function returning(s){return !!(s.miniGames?.returnOutcome||s.campusLife?.pending?.done||s.relationships?.pending?.done||s.journeys?.pending?.done||s.medical?.done||s.evolution?.care?.done||s.campusRevision?.proposal?.done);}
function underlyingNext(s){let n=B.next(s),guard=0;while(returning(s)&&n.phase==='outcome'&&!n.failed&&n.log.length===s.log.length&&guard++<8){s=n;n=B.next(s);}return n;}
function advance(s){
 if(s.school.pending||s.miniGames?.pending)throw Error('先完成眼前的课程或互动');if(s.failed)return B.next(s);if(s.school.returnTo){const p=s.school.returnTo;s={...s,...p,school:{...s.school,returnTo:null}};if(s.phase==='choice')return s;}
 if(s.phase!=='outcome')return B.next(s);if(s.failed)return B.next(s);const due=unresolved(s);if(due&&due.start<=now(s))return openCourse(s,due);
 let n=underlyingNext(s);if(due&&n.day===s.day&&(n.phase==='dayEnd'||due.start<=Math.max(now(s),now(n))))return openCourse(s,due);
 n=monotonic(s,n);let guard=0;while(n.phase==='choice'&&safeAcademic.has(n.eventId)&&!protectedScene(B.getScene(n),n)&&guard++<4){const scene=B.getScene(n);const stub={day:n.day,step:n.step,eventId:n.eventId,time:clock(now(n)),title:scene.title,choice:'专业课表接管本节课堂',result:'',changes:{},flags:{},project:0};n=monotonic(n,B.next({...n,phase:'outcome',outcome:stub}));if(due&&n.day===s.day&&(n.phase==='dayEnd'||due.start<=now(n)))return openCourse(s,due);}
 return n;
}
function next(s){return s.school?withAction(s,advance(s),'next'):B.next(s);}
function freeMinutes(s){if(!s.school)return B.freeMinutes(s);if(s.school.pending||s.school.returnTo)return 0;const l=unresolved(s);return Math.max(0,Math.min(B.freeMinutes(s),l?l.start-now(s):Infinity));}
function canFree(s){return s.phase==='outcome'&&!s.failed&&!s.lottery?.won&&!s.school.pending&&!s.school.returnTo&&!s.miniGames?.pending;}
function durationOf(s,a){const fixed=B.miniDefinitions?.[a.id]?.[2]??B.campusDefinitions?.[a.id]?.[2];if(Number.isFinite(fixed))return fixed;try{const opened=B.startActivity(s,a.id),scene=B.getScene(opened);return Math.min(...scene.choices.filter(c=>!c.cancel&&!c.disabledReason).map(c=>c.minutes??10));}catch{return Infinity;}}
function availableActivities(s){
 if(!s.school)return B.availableActivities(s);if(!canFree(s))return[];const gap=freeMinutes(s),l=unresolved(s),list=B.availableActivities(s).filter(a=>a.id==='mini-runner'?l&&l.start<600&&canRush(s,l):durationOf(s,a)<=gap);
 if(gap>=20)for(const r of Object.values(s.school.records))if(r.makeup||r.risk)list.push({id:'school-makeup:'+r.id,label:'补学 '+r.name+' · 20 分钟',partner:false});return list;
}
function makeup(s,id){const r=s.school.records[id];if(!r||!r.makeup&&!r.risk||freeMinutes(s)<20)throw Error('现在无法安排这门课的补学');const record={...r,makeup:Math.max(0,r.makeup-1),risk:Math.max(0,r.risk-2),repaired:r.repaired+1,score:Math.min(100,r.score+3)},stats=B.apply(s.stats,{study:3,energy:-1}),entry={day:s.day,step:-1,eventId:'school-makeup-'+id,time:clock(now(s)),title:r.name+' · 补学完成',choice:'对照课堂资料，补齐练习并向老师说明',result:'补齐了漏下的课堂内容，出勤风险缓和；原来的到课记录如实保留。',changes:Object.fromEntries(B.keys.filter(k=>stats[k]!==s.stats[k]).map(k=>[k,stats[k]-s.stats[k]])),flags:{},project:3,minutes:20,schoolCourse:id,courseId:id,schoolMakeup:true};return B.settleNutrition(s,{...s,stats,failed:failure({...s,stats}),phase:'outcome',outcome:entry,log:[...s.log,entry],rhythm:{...s.rhythm,clock:now(s)+20,spent:s.rhythm.spent+20},term:{...s.term,progress:s.term.progress+3},school:{...s.school,records:{...s.school.records,[id]:record},returnTo:previous(s)}},0,false);}
function startActivity(s,key){if(!s.school)return B.startActivity(s,key);if(!availableActivities(s).some(a=>a.id===B.campusActivityKey(key)&&!a.disabledReason))throw Error('这段空闲不足，先看看下一节课');let n;if(key.startsWith('school-makeup:'))n=makeup(s,key.slice(14));else if(key==='mini-runner')n=startRunner(openCourse(s,unresolved(s),true));else n=B.startActivity(s,key);return withAction(s,n,'start',[key]);}
function completeMini(s,value){
 if(!s.school)return B.completeMini(s,value);if(s.school.pending?.runner){if(!s.miniGames?.pending||s.miniGames.pending.key!=='mini-runner'||![-1,0,1].includes(value))throw Error('无效赶路成绩');const d=s.miniGames.daily?.day===s.day?clone(s.miniGames.daily):{day:s.day,base:{},best:{},bonus:{},mood:0,social:0};d.base.runner=true;const awards=[...s.miniGames.awards];if(value===1&&!awards.includes('mini-early'))awards.push('mini-early');const n=finishCourse({...s,miniGames:{...s.miniGames,pending:null,daily:d,awards}},'attend',value);return withAction(s,n,'mini',[value]);}
 return withAction(s,monotonic(s,B.completeMini(s,value),true),'mini',[value]);
}
function cancelMini(s){if(!s.school)return B.cancelMini(s);if(s.school.pending?.runner){if(!s.miniGames?.pending)throw Error('没有待完成的互动');return withAction(s,{...s,miniGames:{...s.miniGames,pending:null},school:{...s.school,pending:{...s.school.pending,runner:false}}},'cancel');}return withAction(s,B.cancelMini(s),'cancel');}
function continueDay(s){if(!s.school)return B.continueDay(s);return withAction(s,B.continueDay(s),'day');}
function retire(s){return s.school?withAction(s,B.retire(s),'retire'):B.retire(s);}
const upgrades=Object.keys(B).filter(k=>k.startsWith('enable')&&typeof B[k]==='function'),wrapped={};for(const key of upgrades)wrapped[key]=(s,...args)=>{const n=B[key](s,...args);return s.school&&n!==s?withAction(s,n,'upgrade',[key,...args]):n;};
function restore(raw){
 if(!raw?.school)return B.restore(raw);try{if(raw.version!==6||!Array.isArray(raw.actions)||raw.actions.length>30000||raw.school.base?.school)return null;const base=B.restore(raw.school.base);if(!base)return null;let s=enableSchool(base,raw.school.majorId),boundary=base.actions.length;if(raw.actions[boundary]!=='school-v1:'+raw.school.majorId||JSON.stringify(raw.actions.slice(0,boundary))!==JSON.stringify(base.actions))return null;
 for(const a of raw.actions.slice(boundary+1)){const match=/^school-(choose|next|start|mini|cancel|day|retire|upgrade):(.+)$/.exec(a);if(!match)return null;const args=JSON.parse(decodeURIComponent(match[2]));if(!Array.isArray(args))return null;if(match[1]==='choose')s=choose(s,...args);else if(match[1]==='next')s=next(s);else if(match[1]==='start')s=startActivity(s,...args);else if(match[1]==='mini')s=completeMini(s,...args);else if(match[1]==='cancel')s=cancelMini(s);else if(match[1]==='day')s=continueDay(s);else if(match[1]==='retire')s=retire(s);else if(match[1]==='upgrade'){if(!upgrades.includes(args[0]))return null;s=wrapped[args[0]](s,...args.slice(1));}}
 return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
root.DormGame={...B,...wrapped,majors,create,enableSchool,schoolView,getScene,choose,next,freeMinutes,availableActivities,startActivity,completeMini,cancelMini,continueDay,retire,restore,valid:s=>restore(s)!==null};root.DormSchoolV1=root.DormGame;root.DormSchoolBase=B;if(!browser)module.exports=root.DormGame;
})(typeof globalThis!=='undefined'?globalThis:this);
