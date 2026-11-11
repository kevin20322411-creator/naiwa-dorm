(function(root){
'use strict';
// Keep v1 replay immutable; curriculum starts at a new validated boundary.
const browser=typeof module==='undefined'||!module.exports,V=browser?root.DormSchoolV1:require('./school-v1.js'),B=browser?root.DormSchoolBase:require('./mini-games.js');
const legacy=s=>s.school?.revision===1;
const clone=x=>JSON.parse(JSON.stringify(x)),minute=t=>Number(t?.slice(0,2)||0)*60+Number(t?.slice(3)||0),clock=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const weekLabels=['周一','周二','周三','周四','周五','周六','周日'];
const groupLabels={foundation:'专业基础',core:'专业核心',practice:'专业实践',common:'公共课'};
const categories={major:'专业课',common:'公共课',elective:'选修课',pe:'体育课'};
// A compact fictional game curriculum; not a claim about any university's actual program.
const majorData=[
 ['cs','计算机科学与技术','💻','从代码、数学到系统，逐步完成自己的小项目。','code',[
 ['programming','程序设计','机房 A203','循环与条件的小练习','foundation'],['algorithms','数据结构','教学楼 B302','把数据排成清楚的队列','core'],['systems','计算机系统','实验楼 C201','画出程序与硬件的联系','core'],['discrete','离散数学','教学楼 B301','集合与逻辑推理页','foundation'],['networks','计算机网络','实验楼 C202','校园网络连接示意图','core'],['database','数据库基础','机房 A204','校园社团数据表','core'],['software','软件工程','教学楼 B303','小项目需求与测试清单','practice'],['project','程序设计实践','机房 A203','能运行的校园工具原型','practice']]],
 ['bio','生物科学','🧬','从化学、生命结构到实验，让观察能够重复。','experiment',[
 ['cell','细胞生物学','生命楼 201','细胞结构观察记录','core'],['biolab','生物学实验','生命楼实验室','样本观察与误差说明','practice'],['ecology','生态学','教学楼 B204','校园样方观察报告','core'],['chemistry','普通化学','理科楼 201','反应与浓度练习页','foundation'],['biochemistry','生物化学','生命楼 202','代谢路径联系图','core'],['genetics','遗传学','生命楼 203','遗传概率推演卡','core'],['statistics','生物统计实践','生命楼机房','样本均值与误差图','practice'],['fieldwork','野外观察实践','校园生态园','可复核的物种观察记录','practice']]],
 ['business','工商管理','📊','从经济、会计到管理实践，理解资源与选择。','chart',[
 ['economics','微观经济学','商学院 203','供需变化分析图','foundation'],['accounting','基础会计','商学院实训室','一张收支核对表','foundation'],['marketing','市场调研','教学楼 B206','校园小店调研卡','practice'],['management','管理学原理','商学院 201','分工与协调案例图','foundation'],['finance','财务管理','商学院 202','现金流预算表','core'],['operations','运营管理','商学院 205','校园快递流程图','core'],['organization','组织行为学','商学院 206','团队沟通观察卡','core'],['simulation','企业经营实践','商学院实训室','模拟小店经营复盘','practice']]],
 ['literature','汉语言文学','📖','从语言、文学史到写作，以文本证据支持理解。','writing',[
 ['reading','文学作品选读','文学院 302','一段文本的细读札记','core'],['language','现代汉语','文学院 201','句法与表达分析页','foundation'],['writing','写作实践','文学院研讨室','一篇校园随笔草稿','practice'],['ancient','古代汉语','文学院 202','字词训释与翻译札记','foundation'],['history','中国文学史','文学院 303','作品与时代联系卡','core'],['theory','文学理论','文学院 301','叙事视角比较页','core'],['world','外国文学选读','文学院 304','两篇作品的主题比较','core'],['editing','编辑与校对实践','文学院研讨室','校园刊物校样','practice']]],
 ['design','视觉传达设计','🎨','从造型、色彩到传达实践，把想法做成作品。','design',[
 ['composition','平面构成','设计楼 203','点线面的构成练习','foundation'],['color','色彩基础','设计楼画室','校园配色观察板','foundation'],['studio','设计工作坊','设计楼工作室','一张校园海报草图','practice'],['drawing','造型基础','设计楼画室','物体结构速写页','foundation'],['typography','字体与版式','设计楼 204','文字层级与版式练习','core'],['visual','图形创意','设计楼 205','校园主题图形方案','core'],['media','数字媒体设计','设计楼机房','屏幕界面视觉稿','core'],['branding','品牌设计实践','设计楼工作室','校园社团视觉识别板','practice']]]
];
const requiredSlots=[[1,480],[1,600],[2,480],[2,600],[3,480],[3,600],[4,480],[4,840],[5,480],[5,600]];
const atSlot=(c,dayOfWeek,start)=>({...c,dayOfWeek,start,end:start+70,time:clock(start)+'–'+clock(start+70)});
const course=(id,name,place,work,kind,category,group)=>({id,name,place,work,kind,category,categoryLabel:categories[category],...(group?{group}:{}),groupLabel:groupLabels[group]||categories[category],attendanceRate:category==='pe'?.85:.65,attendanceHint:category==='pe'?'课前签到与热身；到场练习才记到课。':'不定期签到或随堂提问；迟到可能错过签到。',desc:work+'。'});
const commonCourses=[course('common-english','大学英语','公共教学楼 201','一段英语表达与写作练习','writing','common','common'),course('common-statistics','统计与数据素养','公共教学楼 202','一张数据解读图','chart','common','common')];
const majors=majorData.map(([id,name,icon,desc,workKind,data])=>({id,name,icon,desc,workKind,courses:data.map(([key,name,place,work,group],i)=>atSlot(course(id+'-'+key,name,place,work,workKind,'major',group),...requiredSlots[i]))}));
const optional=(id,name,kind,place,day,start,work,desc,miniKey)=>({...atSlot(course(id,name,place,work,kind,id.startsWith('pe-')?'pe':'elective'),day,start),desc,...(miniKey?{miniKey}:{})});
const courseCatalog={electives:[
 optional('elective-photo','校园摄影','photo','钟楼摄影教室',1,840,'一张校园光影观察照片','观察构图与光线，把校园留在相册里。'),
 optional('elective-film','电影赏析','film','公共教学楼放映室',4,600,'一页镜头与叙事分析札记','从镜头、声音和叙事理解一段影片。'),
 optional('elective-food','饮食文化','food','生活课堂',2,840,'一页饮食文化观察卡','认识各地风味，试着搭配一份菜单。'),
 optional('elective-music','音乐欣赏','music','艺术楼音乐教室',5,840,'一段节奏与旋律聆听笔记','听辨节奏与旋律，写下自己的感受。'),
 optional('elective-psych','心理学入门','psych','公共教学楼 301',3,840,'一张心理现象观察卡','区分观察、解释与证据，认识日常心理现象。'),
 optional('elective-calligraphy','书法基础','calligraphy','艺术楼书法教室',4,600,'一页笔画与结构临摹','练习笔画和结构，留下一页临摹。')
],pe:[
 optional('pe-basketball','篮球','exercise','篮球场',2,840,'一份投篮与热身训练记录','练习运球和投篮，找找今天的手感。','mini-basket'),
 optional('pe-badminton','羽毛球','exercise','羽毛球馆',3,840,'一份步伐与接球训练记录','练习步伐和接球，打一场轻松的对练。','mini-badminton'),
 optional('pe-running','跑步与体能','exercise','田径场',5,840,'一份配速与放松训练记录','按自己的节奏慢跑，完成热身与放松。'),
 optional('pe-yoga','瑜伽与伸展','exercise','体育馆形体室',1,840,'一份呼吸与伸展训练记录','练习基础呼吸和柔和伸展。'),
 optional('pe-tabletennis','乒乓球','exercise','乒乓球馆',4,600,'一份发球与步伐训练记录','完成发球和步伐基础练习。'),
 optional('pe-fitness','基础健身','exercise','体育馆健身区',2,840,'一份自重力量与恢复记录','学习自重动作，注意强度和恢复。')
]};
const defaults={electives:['elective-photo'],pe:'pe-badminton'};
const selectedCourses=selection=>[...selection.electives.map(id=>courseCatalog.electives.find(c=>c.id===id)),courseCatalog.pe.find(c=>c.id===selection.pe)].filter(Boolean);
const requiredFor=id=>{const m=majors.find(m=>m.id===id);return m?[...m.courses,...commonCourses.map((c,i)=>atSlot(c,...requiredSlots[8+i]))]:[];};
const canonical=selection=>({electives:[...selection.electives].sort(),pe:selection.pe});
function validateCourseSelection(majorId,selection){
 const errors=[];if(!majors.some(m=>m.id===majorId))errors.push('请选择一个有效专业');
 if(!selection||!Array.isArray(selection.electives)||selection.electives.length<1||selection.electives.length>2)errors.push('请选择 1–2 门不同的选修课');
 else{if(new Set(selection.electives).size!==selection.electives.length)errors.push('同一门选修课不能重复选择');for(const id of selection.electives)if(!courseCatalog.electives.some(c=>c.id===id))errors.push('无效选修课：'+String(id));}
 if(!courseCatalog.pe.some(c=>c.id===selection?.pe))errors.push('请选择 1 门有效体育课');
 const conflicts=[];if(!errors.length){const all=[...requiredFor(majorId),...selectedCourses(selection)];for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j];if(a.dayOfWeek===b.dayOfWeek&&a.start<b.end&&b.start<a.end)conflicts.push(weekLabels[a.dayOfWeek-1]+' '+a.time+'：'+a.name+'与'+b.name+'时间冲突');}}
 return{valid:!errors.length&&!conflicts.length,errors,conflicts};
}
const majorOf=s=>majors.find(m=>m.id===s.school?.majorId),now=s=>s.rhythm?.clock??minute(s.outcome?.time),moment=s=>s.day*1440+now(s);
const allCourse=id=>[...requiredFor(id),...courseCatalog.electives,...courseCatalog.pe];
const courseOf=(s,id)=>allCourse(s.school.majorId).find(c=>c.id===id);
const enrollmentFor=(s,day)=>s.school.queuedSelection&&day>=s.school.queuedSelection.effectiveDay?s.school.queuedSelection:[...s.school.enrollments].reverse().find(e=>e.effectiveDay<=day)?.selection||s.school.selection;
const newRecord=c=>({id:c.id,name:c.name,attended:0,late:0,missed:0,excused:0,makeup:0,repaired:0,risk:0,score:80});
const withRecords=(records,courses)=>{const r={...records};for(const c of courses)if(!r[c.id])r[c.id]=newRecord(c);return r;};
const statuses={upcoming:'待上课',attended:'已到课',late:'迟到',missed:'旷课 · 点名未到',unrecorded:'未到 · 本节未点名',excused:'已请假',passed:'启用前课程'};
const failure=s=>s.stats.health<=0?'fail-health':s.stats.mood<=0?'fail-mood':s.stats.energy<=0?'fail-energy':s.stats.study<=0?'fail-study':s.term?.missed>=2?'fail-course':s.failed;
function lessons(s,day=s.day){
 if(!majorOf(s))return[];const dow=(day-1)%7+1,history=(s.school.historyLessons||[]).filter(l=>l.day===day),pastIds=new Set(history.map(l=>l.id));
 const current=[...requiredFor(s.school.majorId),...selectedCourses(enrollmentFor(s,day))].filter(c=>c.dayOfWeek===dow).map(c=>({...c,id:'school-'+day+'-'+c.id,courseId:c.id,day})).filter(l=>!pastIds.has(l.id)&&!(s.school.base.school&&(day<s.school.started.day||day===s.school.started.day&&l.start<s.school.started.minute)));
 return [...history,...current].sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id));
}
function eligible(s,l){const start=s.school.started;return !l.historical&&(l.day>start.day||(l.day===start.day&&l.start>=start.minute));}
function unresolved(s){return lessons(s).find(l=>eligible(s,l)&&!s.school.attendance[l.id])||null;}
function curriculumOptions(s=null,majorId='cs'){
 const id=s?.school?.majorId||majorId,selection=s?.school?.revision===2?s.school.selection:defaults,queuedSelection=s?.school?.queuedSelection||null;
 const canEdit=!s||s.phase!=='ending'&&!s.failed&&!s.miniGames?.pending&&!s.school?.pending&&!s.school?.returnTo;
 const note=!canEdit?'请先完成眼前的课程或互动，再调整选课。':legacy(s||{})?'旧版课表保持原样；确认选课后从现在启用新课程，过去记录保留。':s?.school?.revision===2?'选课调整从下周一生效；本周课程与出勤记录保留。':'游戏示例课程：8 门专业课、2 门公共课，另选 1–2 门选修课和 1 门体育课。';
 return{catalog:clone(courseCatalog),selection:clone(selection),queuedSelection:queuedSelection?clone(queuedSelection):null,required:clone(requiredFor(id)),conflicts:[],canEdit,note};
}
function initialize(s,majorId,selection){
 const test=validateCourseSelection(majorId,selection);if(!test.valid)throw Error([...test.errors,...test.conflicts].join('；'));
 const selected=canonical(selection),started={day:s.day,minute:now(s)},historyLessons=[];
 if(s.school)for(let d=1;d<=s.day;d++)for(const l of V.schoolView({...s,day:d}).today)if(l.day<s.day||l.start<now(s)||s.school.attendance[l.id]){const c=courseOf({school:{majorId}},l.courseId);historyLessons.push({...l,...(c?{category:c.category,categoryLabel:c.categoryLabel,kind:c.kind}:{}),historical:true});}
 const school={revision:2,majorId,base:clone(s),started,attendance:clone(s.school?.attendance||{}),records:withRecords(clone(s.school?.records||{}),[...requiredFor(majorId),...selectedCourses(selected)]),pending:null,returnTo:null,lastWork:s.school?.lastWork||null,selection:selected,queuedSelection:null,enrollments:[{effectiveDay:1,selection:selected}],historyLessons};
 return{...s,school,actions:[...s.actions,'curriculum-v2:'+encodeURIComponent(JSON.stringify([majorId,selected]))]};
}
function enableSchool(s,majorId='cs',selection=defaults){
 if(s.school)return s;if(s.version!==6||!s.rhythm||s.phase==='ending')return s;return initialize(s,majorId,selection);
}
function create(seed,traits,name,recent,background,majorId='cs',selection=defaults){return enableSchool(B.create(seed,traits,name,recent,background),majorId,selection);}
function selectCourses(s,selection){
 if(!s.school)throw Error('请先选择专业并启用课表');const options=curriculumOptions(s),test=validateCourseSelection(s.school.majorId,selection);if(!test.valid)throw Error([...test.errors,...test.conflicts].join('；'));if(!options.canEdit)throw Error(options.note);
 if(legacy(s))return initialize(s,s.school.majorId,selection);const selected=canonical(selection),same=JSON.stringify(selected)===JSON.stringify(s.school.selection);if(same&&!s.school.queuedSelection)return s;
 const queuedSelection=same?null:{...selected,effectiveDay:s.day+(7-(s.day-1)%7)};return withAction(s,{...s,school:{...s.school,queuedSelection}},'select',[selected]);
}
function schoolView(s){
 if(legacy(s))return V.schoolView(s);if(!s.school)return null;const major=majorOf(s),monday=s.day-((s.day-1)%7),decorate=l=>{const a=s.school.attendance[l.id],status=a?.status||(eligible(s,l)?'upcoming':'passed');return{...l,status,statusLabel:statuses[status],...(a?{checked:a.checked}:{})};};
 const today=lessons(s).map(decorate),days=weekLabels.map((label,i)=>({label,day:monday+i,lessons:lessons(s,monday+i).map(decorate)})),enrolled=new Set([...requiredFor(major.id),...selectedCourses(s.school.selection)].map(c=>c.id));
 const records=Object.values(s.school.records).map(r=>{const c=courseOf(s,r.id);return{...r,category:c?.category||'major',categoryLabel:c?.categoryLabel||'专业课',kind:c?.kind||major.workKind,enrolled:enrolled.has(r.id),warning:r.risk>=4?'缺勤提醒：请尽快补学并和老师沟通。':r.risk>=2?'有待补上的课堂内容，安排一次补学。':r.makeup?'有课堂内容待补学。':'到课记录平稳。',attendanceHint:(c?.attendanceHint||'签到情况以课堂为准。')+' 未到课不获得课堂收益，只有点名未到才记缺勤。'};});
 let next=today.find(l=>l.status==='upcoming')||null;for(let day=s.day+1;!next&&day<=s.day+7;day++)next=lessons(s,day).filter(l=>eligible(s,l)).map(decorate)[0]||null;
 const options=curriculumOptions(s);return{major,week:Math.ceil(s.day/7),weekday:weekLabels[(s.day-1)%7],days,today,next,records,lastWork:s.school.lastWork,selection:options.selection,queuedSelection:options.queuedSelection,catalog:options.catalog,enrollment:{note:options.note,canEdit:options.canEdit}};
}
const previous=s=>({phase:s.phase,eventId:s.eventId,outcome:s.outcome});
function openCourse(s,l,runner=false){return{...s,eventId:l.id,phase:'choice',outcome:null,school:{...s.school,pending:{lesson:l,previous:previous(s),runner},returnTo:null},rhythm:{...s.rhythm,clock:Math.max(now(s),l.start-(runner?10:0))}};}
const canLeave=s=>!!(s.illness?.active||s.stats.health<55||s.medical&&!s.medical.done||s.evolution?.bite);
const canRush=(s,l)=>!!s.miniGames&&l.start<600&&!(s.miniGames.daily?.day===s.day&&s.miniGames.daily.base?.runner)&&!s.miniGames.pending&&now(s)<=l.start+10;
function courseScene(s){const p=s.school.pending,l=p.lesson,c=courseOf(s,l.courseId),choices=[
 {text:now(s)>=l.end?'本节已经结束，之后可安排补学':now(s)>l.start+10?'现在到场，完成剩下的练习':c.category==='pe'?'按时到场，热身后认真练习':'按时到教室，认真完成课堂练习',mods:c.category==='pe'?{health:3,mood:2,energy:-6}:{study:c.category==='major'?4:c.category==='common'?3:2},flags:{},schoolChoice:'attend',hint:'课堂结束后留下自己的'+c.work+'。',...(now(s)>=l.end?{disabledReason:'本节已结束，请记录未到或说明请假事由后补学'}:{})},
 {text:'这节不去了',mods:{},flags:{},schoolChoice:'skip',hint:'未到课没有学习或课设收益；只有老师点名才记缺勤。'},
 {text:'身体不舒服，先请个假',mods:{},flags:{},schoolChoice:'leave',hint:'请假不记缺勤，之后可在空闲时补学。',...(canLeave(s)?{}:{disabledReason:'当前没有请假事由'})}
 ];if(c.miniKey&&s.miniGames&&now(s)<l.end)choices.push({text:c.name+'课堂互动 · '+(c.miniKey==='mini-basket'?'投篮挑战':'羽毛球接杀'),mods:{},flags:{},schoolChoice:'pe-mini',hint:'互动属于本节课，只记一次到课和运动；也可选普通练习。'});if(canRush(s,l))choices.push({text:'冲向教室 · 早八赶路',mods:{},flags:{},schoolChoice:'runner',hint:'赶路成功按时到课，失败记迟到；课堂收益只结算一次。'});
 return{id:l.id,courseId:l.courseId,schoolScene:true,category:c.category,categoryLabel:c.categoryLabel,courseKind:c.kind,kind:c.categoryLabel,time:clock(Math.max(now(s),l.start)),place:l.place,title:l.name+' · '+(now(s)>l.start+10?'现在赶去还来得及听一段':'上课时间到了'),text:'第 '+Math.ceil(s.day/7)+' 周 '+weekLabels[(s.day-1)%7]+' · '+l.time+'。今天的小目标：'+c.work+'。',bubble:'带着自己的课表去上课。',emoji:majorOf(s).icon,choices};
}
const safeAcademic=new Set(['base-1','wrong-class','attendance-link']);
function protectedScene(scene,s){return scene?.kind==='三餐'||scene?.romanceScene||!!(s.medical||s.evolution?.care||s.wellness?.mouse||s.campusRevision?.proposal||s.journeys?.pending)||/课设截止|就诊|感冒/.test(scene?.kind||'')||/^term-|^well-|^ill-/.test(scene?.id||'');}
// A pending activity was approved in its original free-time window. A class can delay it,
// but may not invalidate that approval merely because a legacy event slot is now in the past.
function activityInput(s){const p=s.campusLife?.pending||s.relationships?.pending||s.rhythm?.pending||s.medical;if(s.phase==='choice'&&p&&!p.done&&Number.isFinite(p.at)&&now(s)>p.at)return{...s,rhythm:{...s.rhythm,clock:p.at}};return s;}
function getScene(s){
 if(!s.school)return B.getScene(s);if(s.school.pending)return courseScene(s);if(s.phase==='outcome'&&s.outcome?.schoolCourse){const l=s.outcome,c=courseOf(s,l.courseId);return{id:l.eventId,courseId:l.courseId,schoolScene:true,category:c?.category,categoryLabel:c?.categoryLabel,courseKind:c?.kind,kind:l.schoolMakeup?'课程补学':c?.categoryLabel||'专业课',time:l.time,place:l.place||'教学楼',title:l.title,text:'',bubble:l.schoolWork?'这节课的小成果，收好了。':l.schoolMakeup?'漏下的内容，补上了。':l.schoolStatus==='excused'?'先休息，恢复后再补上。':l.schoolStatus==='unrecorded'?'这次没点名，内容还得补。':'这节没到，记进课表。',emoji:majorOf(s).icon,choices:[]};}
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
// Both ordinary PE and its optional arcade input settle one physical lesson.
// Event IDs include gym so the existing seven-day fitness and inactivity system sees it.
function physical(s,c,late,mini){
 const d=s.miniGames?.daily?.day===s.day?clone(s.miniGames.daily):{day:s.day,base:{},best:{},bonus:{},mood:0,social:0},first=!d.base.sport,flags={sport:1},mods={energy:late?-4:-6},awards=[...(s.miniGames?.awards||[])];
 const gain=(key,value)=>{if(key==='health'||key==='mood')value=s.stats[key]>=80?Math.floor(value*.25):s.stats[key]>=65?Math.max(1,Math.floor(value*.5)):value;if(key==='mood'){value=Math.min(value,Math.max(0,6-d.mood));d.mood+=value;}mods[key]=(mods[key]||0)+value;};
 if(first){gain('health',late?1:3);gain('mood',late?1:2);mods.charm=1;}
 let result='完成热身、'+c.name+'基础练习与课后放松。';
 if(mini){const key=mini.key,value=mini.value,max=key==='mini-basket'?3:6,tier=value===max?2:value>=(key==='mini-basket'?1:3)?1:0;d.best=d.best||{};d.bonus=d.bonus||{};const old=d.best[key]||0;if(tier>old){const target=s.stats.mood>=80?Math.floor(tier*.25):s.stats.mood>=65?(tier?Math.max(1,Math.floor(tier*.5)):0):tier,bonus=Math.min(Math.max(0,target-(d.bonus[key]||0)),Math.max(0,6-d.mood));mods.mood=(mods.mood||0)+bonus;d.mood+=bonus;d.bonus[key]=(d.bonus[key]||0)+bonus;if(tier===2&&old<2){mods.social=Math.min(1,Math.max(0,2-d.social));d.social+=mods.social;}}d.best[key]=Math.max(old,tier);const award=key==='mini-basket'?'mini-basket-perfect':'mini-badminton-perfect';if(value===max&&!awards.includes(award))awards.push(award);result+=value===-1?' 按普通练习完成本节。':key==='mini-basket'?' 三次出手命中 '+value+' 球。':' 六次来球接住 '+value+' 球。';}
 const count=s.log.filter(e=>e.day===s.day&&e.flags?.sport).length,roll=B.rng(hash(s.seed+':school-injury:'+s.day+':'+s.log.length))();
 if(roll<(count===0?0:count===1?.3:.5)){mods.health=(mods.health||0)-12;mods.energy-=6;mods.mood=(mods.mood||0)-4;mods.charm=0;flags.injury=1;result+=' 练习中不慎拉伤，今天先休息。';}
 d.base.sport=true;return{stats:B.apply(s.stats,mods),flags,result,miniGames:s.miniGames?{...s.miniGames,pending:null,daily:d,awards}:s.miniGames};
}
function finishCourse(s,mode,runnerScore=null,mini=null){
 const p=s.school.pending,l=p.lesson,c=courseOf(s,l.courseId),checked=B.rng(hash(s.seed+':school-rollcall:'+l.day+':'+l.courseId))()<c.attendanceRate,late=mode==='attend'&&(runnerScore===0||runnerScore!==1&&now(s)>l.start+10),missed=mode==='skip'&&checked;
 if(mode==='attend'&&now(s)>=l.end)throw Error('本节已经结束，请先记录未到课再安排补学');if(mode==='leave'&&!canLeave(s))throw Error('当前没有请假事由');const r={...s.school.records[c.id]},status=mode==='leave'?'excused':mode==='skip'?(checked?'missed':'unrecorded'):late?'late':'attended';
 const attending=mode==='attend',sport=attending&&c.category==='pe',signed=attending&&(!late||!checked),study=attending&&!sport?(late?1:c.category==='major'?4:c.category==='common'?3:2):0,project=attending&&!sport?(late?1:c.category==='major'?4:c.category==='common'?2:1):0,exercise=sport?physical(s,c,late,mini):null,flags=attending?{schoolAttend:1,...(exercise?.flags||{}),...(c.category==='elective'&&['photo','film','music','calligraphy'].includes(c.kind)?{art:1}:{})}:{},stats=exercise?.stats||B.apply(s.stats,attending?{study,energy:-2,...(c.category==='elective'&&s.stats.mood<80?{mood:1}:{})}:{});
 if(attending){if(late){r.late++;if(checked){r.missed++;r.risk++;r.score=Math.max(0,r.score-3);}}else{r.attended++;r.score=Math.min(100,r.score+1);}}else if(mode==='leave'){r.excused++;r.makeup++;}else{r.makeup++;if(missed){r.missed++;r.risk+=2;r.score=Math.max(0,r.score-8);}}
 const work=attending?{title:c.work,course:c.name,courseId:c.id,kind:c.kind,category:c.category,categoryLabel:c.categoryLabel,caption:late?'补听或补练后留下的一份简短记录。':sport?'热身、练习、放松，把自己的训练记下来。':'奶蛙在课堂上动手完成，留下今天的一小步。',day:s.day,seed:hash(s.seed+':work:'+l.id),late}:null;
 let result=attending?(exercise?.result||(late?'迟到后听完了剩余内容，完成了一份简短练习。':'奶蛙按时到课，认真完成了'+c.work+'。'))+(late?(checked?' 本节有签到，迟到错过了签到；可以之后补学并向老师说明。':' 本节未抽查签到，迟到仍如实记下。'):''):mode==='leave'?'已经向老师说明身体情况，本节记为请假，待恢复后补学。':checked?'本节老师抽查了出勤，点名未到，记一次缺勤。没有获得课堂收益。':'奶蛙没有到课；本节未抽查出勤，不记缺勤，也没有获得课堂收益。';
 const entry={day:s.day,step:-1,eventId:sport?'active-gym-'+l.id:l.id,schoolLessonId:l.id,index:attending?0:mode==='skip'?1:2,time:clock(Math.max(now(s),l.start+(runnerScore===0?15:0))),title:l.name+' · '+statuses[status],place:l.place,choice:attending?'到课并完成练习':mode==='skip'?'未到课':'身体不适请假',result,changes:Object.fromEntries(B.keys.filter(k=>stats[k]!==s.stats[k]).map(k=>[k,stats[k]-s.stats[k]])),flags,project,minutes:Math.max(0,l.end-Math.max(now(s),l.start+(runnerScore===0?15:0))),schoolCourse:c.id,courseId:c.id,category:c.category,courseKind:c.kind,schoolStatus:status,schoolChecked:checked,...(work?{schoolWork:work}:{}),...(runnerScore!==null?{miniGame:'mini-runner',miniScore:runnerScore}:mini?{miniGame:mini.key,miniScore:mini.value}:{})};
 const totals={...s.flags};for(const [key,value]of Object.entries(flags))totals[key]=(totals[key]||0)+value;
 const n={...s,stats,phase:'outcome',outcome:entry,eventId:l.id,log:[...s.log,entry],flags:totals,term:{...s.term,progress:s.term.progress+project},rhythm:{...s.rhythm,clock:Math.max(now(s),l.end)},...(exercise?.miniGames?{miniGames:exercise.miniGames}:{}),school:{...s.school,pending:null,returnTo:p.previous,attendance:{...s.school.attendance,[l.id]:{status,checked,signed,day:s.day,courseId:c.id}},records:{...s.school.records,[c.id]:r},lastWork:work||s.school.lastWork}};
 return B.settleNutrition(s,{...n,failed:failure(n)},0,false);
}
function withAction(s,n,name,args=[]){return{...n,actions:[...s.actions,'school-'+name+':'+encodeURIComponent(JSON.stringify(args))]};}
function chooseUnderlying(s,index){const input=activityInput(s);if(input===s)return monotonic(s,B.choose(s,index),true);const raw=B.choose(input,index),added=raw.log.length>s.log.length,duration=added?(raw.outcome.minutes??10):0,outcome=added?{...raw.outcome,time:clock(now(s))}:raw.outcome,log=added?[...raw.log.slice(0,-1),outcome]:raw.log,baseline={...raw,outcome,log,rhythm:{...raw.rhythm,clock:now(s)},...(s.nutrition?{nutrition:{...s.nutrition,lastIncident:raw.nutrition.lastIncident}}:{})};return B.settleNutrition(baseline,{...baseline,rhythm:{...baseline.rhythm,clock:now(s)+duration}},0,false);}
function startRunner(s){const p=s.school.pending,l=p.lesson;if(!canRush(s,l))throw Error('这节课不能再安排早八赶路');return{...s,school:{...s.school,pending:{...p,runner:true}},miniGames:{...s.miniGames,pending:{key:'mini-runner',day:s.day,token:hash(s.seed+':school-runner:'+l.id+':'+s.actions.length).toString(36)}}};}
function startPE(s){const p=s.school.pending,c=courseOf(s,p.lesson.courseId);if(!c.miniKey||!s.miniGames||now(s)>=p.lesson.end)throw Error('本节没有可用互动');return{...s,school:{...s.school,pending:{...p,peMini:c.miniKey}},miniGames:{...s.miniGames,pending:{key:c.miniKey,day:s.day,token:hash(s.seed+':school-pe:'+p.lesson.id+':'+s.actions.length).toString(36)}}};}
function choose(s,index){
 if(!s.school)return B.choose(s,index);if(s.miniGames?.pending)throw Error('先完成眼前的互动');const scene=getScene(s),c=scene?.choices[index];if(s.phase!=='choice'||!Number.isInteger(index)||!c||c.disabledReason)throw Error(c?.disabledReason||'现在不能选择');
 let n;if(s.school.pending)n=c.schoolChoice==='runner'?startRunner(s):c.schoolChoice==='pe-mini'?startPE(s):finishCourse(s,c.schoolChoice);else if(c.schoolGo)n=openCourse(s,unresolved(s));else n=chooseUnderlying(s,index);return withAction(s,n,'choose',[index]);
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
function makeup(s,id){const r=s.school.records[id];if(!r||!r.makeup&&!r.risk||freeMinutes(s)<20)throw Error('现在无法安排这门课的补学');const record={...r,makeup:Math.max(0,r.makeup-1),risk:Math.max(0,r.risk-2),repaired:r.repaired+1,score:Math.min(100,r.score+3)},c=courseOf(s,id),project=c?.category==='pe'?0:2,stats=B.apply(s.stats,{study:c?.category==='pe'?0:2,energy:-1}),entry={day:s.day,step:-1,eventId:'school-makeup-'+id,time:clock(now(s)),title:r.name+' · 补学完成',choice:'对照课堂资料，补齐练习并向老师说明',result:'补齐了漏下的课堂内容，出勤风险缓和；原来的到课记录如实保留。',changes:Object.fromEntries(B.keys.filter(k=>stats[k]!==s.stats[k]).map(k=>[k,stats[k]-s.stats[k]])),flags:{},project,minutes:20,schoolCourse:id,courseId:id,category:c?.category,courseKind:c?.kind,schoolMakeup:true};return B.settleNutrition(s,{...s,stats,failed:failure({...s,stats}),phase:'outcome',outcome:entry,log:[...s.log,entry],rhythm:{...s.rhythm,clock:now(s)+20,spent:s.rhythm.spent+20},term:{...s.term,progress:s.term.progress+project},school:{...s.school,records:{...s.school.records,[id]:record},returnTo:previous(s)}},0,false);}
function startActivity(s,key){if(!s.school)return B.startActivity(s,key);if(!availableActivities(s).some(a=>a.id===B.campusActivityKey(key)&&!a.disabledReason))throw Error('这段空闲不足，先看看下一节课');let n;if(key.startsWith('school-makeup:'))n=makeup(s,key.slice(14));else if(key==='mini-runner')n=startRunner(openCourse(s,unresolved(s),true));else n=B.startActivity(s,key);return withAction(s,n,'start',[key]);}
function completeMini(s,value){
 if(!s.school)return B.completeMini(s,value);if(s.school.pending?.peMini){const key=s.school.pending.peMini,max=key==='mini-basket'?3:6;if(s.miniGames?.pending?.key!==key||s.miniGames.pending.day!==s.day||!Number.isInteger(value)||value< -1||value>max)throw Error('无效体育互动成绩');return withAction(s,finishCourse(s,'attend',null,{key,value}),'mini',[value]);}if(s.school.pending?.runner){if(!s.miniGames?.pending||s.miniGames.pending.key!=='mini-runner'||![-1,0,1].includes(value))throw Error('无效赶路成绩');const d=s.miniGames.daily?.day===s.day?clone(s.miniGames.daily):{day:s.day,base:{},best:{},bonus:{},mood:0,social:0};d.base.runner=true;const awards=[...s.miniGames.awards];if(value===1&&!awards.includes('mini-early'))awards.push('mini-early');const n=finishCourse({...s,miniGames:{...s.miniGames,pending:null,daily:d,awards}},'attend',value);return withAction(s,n,'mini',[value]);}
 return withAction(s,monotonic(s,B.completeMini(s,value),true),'mini',[value]);
}
function cancelMini(s){if(!s.school)return B.cancelMini(s);if(s.school.pending?.peMini){if(!s.miniGames?.pending)throw Error('没有待完成的互动');return withAction(s,{...s,miniGames:{...s.miniGames,pending:null},school:{...s.school,pending:{...s.school.pending,peMini:null}}},'cancel');}if(s.school.pending?.runner){if(!s.miniGames?.pending)throw Error('没有待完成的互动');return withAction(s,{...s,miniGames:{...s.miniGames,pending:null},school:{...s.school,pending:{...s.school.pending,runner:false}}},'cancel');}return withAction(s,B.cancelMini(s),'cancel');}
function continueDay(s){if(!s.school)return B.continueDay(s);let n=B.continueDay(s);const q=s.school.queuedSelection;if(q&&n.day>=q.effectiveDay){const selection=canonical(q);n={...n,school:{...n.school,selection,queuedSelection:null,enrollments:[...n.school.enrollments,{effectiveDay:q.effectiveDay,selection}],records:withRecords(n.school.records,selectedCourses(selection))}};}return withAction(s,n,'day');}
function retire(s){return s.school?withAction(s,B.retire(s),'retire'):B.retire(s);}
const upgrades=Object.keys(B).filter(k=>k.startsWith('enable')&&typeof B[k]==='function'),wrapped={};for(const key of upgrades)wrapped[key]=(s,...args)=>{const n=B[key](s,...args);return s.school&&n!==s?withAction(s,n,'upgrade',[key,...args]):n;};
function restore(raw){
 if(!raw?.school)return B.restore(raw);if(raw.school.revision===1)return V.restore(raw);
 try{if(raw.version!==6||raw.school.revision!==2||!Array.isArray(raw.actions)||raw.actions.length>30000||raw.school.base?.school?.revision===2)return null;
 const base=raw.school.base?.school?V.restore(raw.school.base):B.restore(raw.school.base);if(!base)return null;const boundary=base.actions.length,marker=raw.actions[boundary];if(typeof marker!=='string'||!marker.startsWith('curriculum-v2:')||JSON.stringify(raw.actions.slice(0,boundary))!==JSON.stringify(base.actions))return null;
 const [majorId,selection]=JSON.parse(decodeURIComponent(marker.slice(14)));if(base.school&&base.school.majorId!==majorId)return null;let s=base.school?selectCourses(base,selection):enableSchool(base,majorId,selection);
 for(const a of raw.actions.slice(boundary+1)){const match=/^school-(choose|next|start|mini|cancel|day|retire|upgrade|select):(.+)$/.exec(a);if(!match)return null;const args=JSON.parse(decodeURIComponent(match[2]));if(!Array.isArray(args))return null;if(match[1]==='choose')s=choose(s,...args);else if(match[1]==='next')s=next(s);else if(match[1]==='start')s=startActivity(s,...args);else if(match[1]==='mini')s=completeMini(s,...args);else if(match[1]==='cancel')s=cancelMini(s);else if(match[1]==='day')s=continueDay(s);else if(match[1]==='retire')s=retire(s);else if(match[1]==='select')s=selectCourses(s,...args);else if(match[1]==='upgrade'){if(!upgrades.includes(args[0]))return null;s=wrapped[args[0]](s,...args.slice(1));}}
 return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const methods={getScene,choose,next,freeMinutes,availableActivities,startActivity,completeMini,cancelMini,continueDay,retire},dispatch={};for(const [key,fn]of Object.entries(methods))dispatch[key]=(s,...args)=>legacy(s)?V[key](s,...args):fn(s,...args);
for(const key of upgrades){const fn=wrapped[key];wrapped[key]=(s,...args)=>legacy(s)?V[key](s,...args):fn(s,...args);}
root.DormGame={...B,...wrapped,...dispatch,majors,courseCatalog,create,enableSchool,schoolView,curriculumOptions,validateCourseSelection,selectCourses,restore,valid:s=>restore(s)!==null};root.DormSchoolV2=root.DormGame;if(!browser)module.exports=root.DormGame;
})(typeof globalThis!=='undefined'?globalThis:this);
