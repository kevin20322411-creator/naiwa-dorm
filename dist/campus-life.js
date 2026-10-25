(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./wellness.js'),L=browser?root.DormLife:require('./life.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const rand=(s,key)=>B.rng(hash(s.seed+':campus-2:'+s.day+':'+s.step+':'+key))();
const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const failure=v=>v.energy<=0?'fail-energy':v.study<=0?'fail-study':v.health<=0?'fail-health':null;
const changes=(a,b)=>Object.fromEntries(B.keys.filter(k=>a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
const c=(text,minutes,mods,result,project=0,flags={})=>({text,minutes,mods,result,project,flags});
const e=(key,slots,place,emoji,title,text,choices)=>({id:'uni-'+key,slots,place,emoji,title,text,choices});
const events=[
 e('lab-booking',[1],'实验楼','🔬','实验预约，还剩一个合适的时段。','奶娃和同学都盯着预约表。先抢位置，还是把准备工作做扎实？',[
  c('先准备好方案，再确认预约',20,{energy:-10,study:9},'方案写清了，预约也排进了日历。',7,{library:1}),
  c('和同学拼一个时段，共享准备工作',15,{energy:-7,social:4,study:5},'分工说清之后，准备工作轻了一点。',4),
  c('先记下空位，保留今天原有的安排',5,{energy:-2,study:2},'你记好开放时间，先把手边的事继续做完。',1)]),
 e('rain-route',[1,4],'校园路口','☔','雨下大了，下一栋楼还隔着一段路。','奶娃看了看雨，也看了看自己的安排。每条路都有一点代价。',[
  c('绕有连廊的路，慢一点走过去',15,{energy:-7,mood:1},'路远了一点，衣服仍然干爽。'),
  c('和同学拼一把伞，顺路聊几句',10,{energy:-5,social:3,mood:2},'你们商量好方向，慢慢走到了教学楼。'),
  c('先在屋檐下整理笔记，等雨小一点',5,{energy:-2,study:3},'笔记多理顺了一小段，雨声也没刚才急了。',2)]),
 e('campus-job',[1,4],'校内服务点','📦','服务点今天缺一双帮忙的手。','工作人员把短任务和下次招募时间都写得很清楚，奶娃可以自己选。',[
  c('帮忙分好这一批资料，领取报酬',20,{energy:-12,money:14},'资料按类分好，短任务的报酬也到账了。',0,{job:1}),
  {...c('登记以后能来的时段，等排班回复',5,{energy:-2},'你留下了自己真正能做到的时段，之后会收到回复。'),applyJob:true},
  c('先记下信息，把今天的课业放在前面',5,{energy:-2,study:3},'你没有接下做不完的事，先把自己的安排理顺。',2)]),
 e('group-split',[3],'小组讨论区','📋','小组里有位同学突然来不了了。','原来的分工需要调整。奶娃可以多做一点，也可以把边界说清楚。',[
  c('重新拆分任务，把缺口分给有余力的人',20,{energy:-11,social:3,study:8},'大家确认了新的分工，任务继续往前走。',9),
  c('先顶上最紧急的一小块',15,{energy:-13,study:10},'你补上了关键的一块，也提醒大家后面要重新分工。',11),
  c('说清自己能做的范围，先交现有部分',5,{energy:-4,study:4},'边界说清楚后，眼下能交的部分先落了地。',5)]),
 e('lab-notes',[3],'实验室','🧪','实验记录里，偏偏少了最后一页。','数据还在，记录却没有整理完整。奶娃得决定这段时间怎么用。',[
  c('对照原始数据，补齐记录和误差说明',20,{energy:-13,study:12},'记录补上了，你也更清楚这组数据的来路。',10,{library:1}),
  c('和同学交叉核对，各自补自己的部分',15,{energy:-9,social:3,study:8},'你们互相指出漏项，没有替对方编数据。',7),
  c('先列缺项，预约下一次核对',5,{energy:-3,study:3},'缺什么被清清楚楚列了出来，下一次不用重新找。',2)]),
 e('application',[3,4],'学院资料室','📄','一份申请材料，今天需要补全。','机会看起来不错，材料也确实有几页。奶娃得在准备和手头课业之间留出位置。',[
  c('核对经历，完成一版可提交的材料',20,{energy:-12,study:8},'经历被写得更清楚，材料也终于可以交出去。',5),
  c('请同学互看，只改最关键的几处',10,{energy:-7,social:3,study:5},'几个含糊的地方被指出来，修改也有了方向。',3),
  c('记下要求，先把本周课设推进一块',5,{energy:-4,study:4},'你把机会留在清单里，先处理眼前的截止。',5)]),
 e('book-market',[1,3,4],'旧书摊','📚','旧书摊上，正好有你想看的那本。','书页有折角，价格也比新书低。奶娃翻了几页，又想了想自己的预算。',[
  c('买下旧书，今晚给它留一点时间',10,{money:-6,energy:-3,mood:3,study:4},'书换了一个主人，扉页上多了你的名字。',2,{library:1}),
  c('和同学交换着看，先聊聊各自的书',10,{energy:-4,social:4,study:3},'你们约好借还时间，也交换了几句推荐。',1),
  c('只记下书名，先去图书馆查馆藏',5,{energy:-2,study:3},'想看的书被留下了，不必立刻花钱。',2)]),
 e('device-queue',[3,4],'设备借用处','💻','要借的设备，前面还排着几个人。','奶娃有一份可以先做的任务，也可以花一点钱解决眼前的等待。',[
  c('边等边把方案写清，轮到再上手',20,{energy:-10,study:8},'等待没有全浪费，上手时也少走了弯路。',7),
  c('租用短时设备，把关键部分先完成',10,{money:-8,energy:-7,study:7},'关键部分处理好了，预算也少了一块。',8),
  c('先做不需要设备的部分',5,{energy:-4,study:4},'任务被拆小了，今天仍然有能推进的地方。',4)]),
 e('photo-call',[3,4,6],'校园摄影角','📷','校园征集，今天开始收作品了。','手机里有几张自己喜欢的照片。奶娃可以试着投一份，也可以只参加眼前的交流。',[
  {...c('整理一组作品，认真投出去',15,{energy:-8,study:3,mood:2},'作品附上了说明，接下来就等回复。',3,{art:1}),submitPhoto:true},
  c('和路过的同学交流拍摄思路',10,{energy:-5,social:4,mood:3},'你听到了几种不同的观察方式。',1,{art:1}),
  c('先把喜欢的照片整理好，留给自己',5,{energy:-2,mood:2},'不投稿也没关系，喜欢的片段被认真保存了。',0,{art:1})]),
 e('sports-club',[4,6],'校园运动场','🏃','运动社今天有一场轻量体验。','活动不比名次，强度也可以自己调。奶娃看了看还剩多少精力。',[
  c('热身后参加一小轮，累了就停',20,{energy:-13,health:5,mood:4},'练得不多，但身体从椅子上醒过来了。',0,{sport:1}),
  c('只做拉伸，和同学聊聊动作',10,{energy:-5,health:2,mood:2,social:2},'活动肩颈的时候，脑子也松了一点。',0,{sport:1}),
  c('今天先围观，记住适合自己的练法',5,{energy:-2,study:2},'你没有勉强加量，也带走了一个能用的小方法。')]),
 e('dorm-clean',[4,6],'寝室','🧹','寝室约好了，今天一起收拾一小块。','桌角、电线和纸箱都需要归位。大家各自挑一件能做完的事。',[
  c('整理公共区，让大家走动方便一点',15,{energy:-10,social:4,health:2,mood:3},'公共区清爽了，回寝时也不用再侧着身走。',0,{kindness:1}),
  c('先收拾自己的桌面和待办',10,{energy:-6,study:4,mood:2},'桌面腾出一小块，接着做事更顺手了。',3),
  c('说明现在很累，认领下次的收尾',5,{energy:3,mood:1},'你把时间说清楚，室友也知道这件事没有被丢下。',0,{rest:1})]),
 e('internship',[6],'就业信息角','🧭','一条实习信息，看起来和你有些关系。','岗位写得很长，真正要准备的事也不少。奶娃可以先向前挪一小步。',[
  c('挑一项要求，做一次针对性的准备',20,{energy:-12,study:10},'你没有把整页要求同时扛走，先准备好了一小块。',7),
  c('和同学互看简历，交换具体建议',15,{energy:-9,social:4,study:6},'经历被讲得更清楚，也知道下一步该补什么。',4),
  c('先核对时间，保留符合自己节奏的信息',5,{energy:-2,study:3},'机会被筛过了一遍，暂时不用为所有岗位焦虑。',1)]),
 e('grass-music',[6],'校园草坪','🎵','草坪上的歌声，刚好唱到你熟悉的那句。','奶娃停了一下脚步。今天还剩一点时间，也还有几件没做完的事。',[
  c('留十分钟，认真听完这一小段',10,{energy:-3,mood:6},'歌声结束后，你才发现肩膀没有刚才那么紧。',0,{art:1}),
  c('和旁边的同学轻轻跟唱两句',10,{energy:-5,social:4,mood:5},'音准没有人计较，气氛倒是被你们接住了。',0,{art:1}),
  c('听完这一句，继续自己的安排',5,{energy:-1,mood:2},'熟悉的旋律陪你走了一小段路。')]),
 e('friend-talk',[4,6],'校园长椅','🫧','朋友发来消息，想找个人说说话。','你有自己的事，也在意朋友现在的心情。能留多少时间，可以认真说清楚。',[
  c('留一段时间听完，再回到自己的任务',20,{energy:-8,social:6,mood:-1},'问题没有立刻消失，但朋友知道自己被认真听见了。',0,{kindness:1}),
  c('说清今天的余力，约一个能做到的时间',5,{energy:-2,social:2,mood:1},'你给出了具体的安排，也没有勉强自己透支。'),
  c('先发一段认真回复，帮忙梳理一件小事',10,{energy:-5,social:4,study:2},'你没有替朋友包下所有事，只帮着把眼前的问题拆小。')]),
 e('movie-ticket',[6],'校园放映点','🎬','今晚的校园短片展，还剩几张尾票。','海报是喜欢的风格，手里的预算和任务却也很具体。',[
  c('买张票，给自己留一段放松时间',20,{money:-10,energy:-5,mood:8},'电影未必能解决任务，但这段时间确实属于自己。',0,{art:1}),
  c('和室友约好以后一起看，先聊两句片单',10,{energy:-3,social:3,mood:4},'想看的片单多了几部，下次的安排也有了着落。'),
  c('先完成一小段课设，把电影留到以后',5,{energy:-5,study:5},'你挑了一块能做完的任务，先把今天往前推。',5)]),
 e('night-laundry',[7],'寝室洗衣区','🧺','快熄灯了，洗衣机还没停。','奶娃看了看剩余时间，想让明早少一点手忙脚乱。',[
  c('定好提醒，先休息，明早再收尾',0,{energy:8,health:2,mood:2},'提醒设好了，奶娃没有继续硬撑。',0,{sleep:1,rest:1}),
  c('只把必须做的收好，再去睡',5,{energy:-3,mood:1},'最紧急的部分收妥，剩下的留给明早。'),
  c('趁等待整理一段作业',10,{energy:-7,study:7},'作业往前走了一点，夜也更深了一点。',5)]),
 e('upload-retry',[7],'课程平台','📤','作业上传，停在了最后那一点进度。','文件在手里，平台却有些慢。奶娃还得留一点力气给明天。',[
  c('检查文件后重传，只处理这一个问题',10,{energy:-7,study:6},'文件重新传上去，你留好了提交记录。',6),
  c('保留报错记录，写好说明，明早处理',5,{energy:-3,study:3},'时间和问题被记了下来，明早不用重新排查。',3),
  c('先保存本地版本，设提醒后休息',0,{energy:7,health:2,mood:2},'文件没有丢，奶娃先把明早的入口留好。',0,{sleep:1,rest:1})]),
 e('night-chat',[7],'寝室门口','🌙','室友聊到兴头上，奶娃已经开始犯困。','大家都想多说两句，你也知道自己明天还有安排。',[
  c('轻声聊五分钟，说好到点就睡',5,{energy:-3,social:3,mood:3},'你们留了一点余兴，也守住了停下来的时间。'),
  c('认真道晚安，把剩下的话留到明天',0,{energy:8,health:2,mood:2},'话题没有被否定，只是换了一个更有余力的时间。',0,{sleep:1,rest:1}),
  c('聊到熄灯后很久',10,{energy:-10,health:-4,mood:4,social:6},'这一晚聊得热闹，身体也记下了少睡的时间。')])
];
const followups=[{id:'uni-photo-result'},{id:'uni-job-reply'}];
function protectFailure(s,settle=false){
 if(!s.campusUpdate)return s;const failed=failure(s.stats)||(s.term?.missed>=2?'fail-course':s.failed);
 return failed!==s.failed||settle&&failed?{...s,failed,...(settle&&failed?{phase:'ending',finalEnding:failed}:{})}:s;
}
function enableCampus(s){return s.version!==6||s.campusUpdate||s.phase==='ending'?s:protectFailure({...s,campusUpdate:{recent:[],photo:null,job:null},actions:[...s.actions,'u']},s.term?.missed>=2);}
function create(...args){return enableCampus(B.create(...args));}
function primary(s){return s.phase==='choice'&&!s.rhythm?.pending&&![0,2,5].includes(s.step)&&!['term-','love-','well-','clinic-','active-','extra-'].some(p=>s.eventId.startsWith(p));}
function arrive(s){
 if(!s.campusUpdate||!primary(s))return s;
 const u=s.campusUpdate;
 if([3,4,6].includes(s.step))for(const[key,id]of [['photo','uni-photo-result'],['job','uni-job-reply']])if(u[key]&&!u[key].resolved&&s.day>=u[key].dueDay)return{...s,eventId:id};
 if((s.step===1&&s.stats.money<10)||s.stats.energy<15||rand(s,'offer')>=(s.step===7?.45:.55))return s;
 let pool=events.filter(e=>e.slots.includes(s.step));const fresh=pool.filter(e=>!u.recent.slice(-8).includes(e.id));if(fresh.length)pool=fresh;else pool=pool.filter(e=>e.id!==u.recent.at(-1));
 if(!pool.length)return s;const e=pool[Math.floor(rand(s,'kind')*pool.length)];return{...s,eventId:e.id,campusUpdate:{...u,recent:[...u.recent,e.id].slice(-10)}};
}
function recovery(value,key,current){if(value<=0)return value;return current>=(key==='health'?85:80)?Math.floor(value*(key==='health'?.3:.2)):Math.max(1,Math.floor(value*(key==='health'?.6:.55)));}
function getScene(s){
 if(!s.campusUpdate||!s.eventId.startsWith('uni-'))return B.getScene(s);if(['ending','dayEnd'].includes(s.phase))return null;
 let source=events.find(e=>e.id===s.eventId);
 if(s.eventId==='uni-photo-result'){const won=s.campusUpdate.photo.accepted,award=won?18:0;source={id:s.eventId,place:'征集活动页面',emoji:'📬',title:'投稿收到回复了。',text:won?'你的作品入选了这次征集，也有一笔小额奖励。奶娃想怎么接住这次回应？':'这次没有入选，评语却写得很具体。奶娃可以按自己的余力消化这份回应。',choices:[c('认真看完评语，记下下一次能改的地方',10,{energy:-5,money:award,study:5,mood:won?4:-1},'回复被认真看完，下一次也有了更具体的方向。',3,{art:1}),c('和投稿的同学交流一次复盘',15,{energy:-7,money:award,social:4,study:3,mood:2},'你听到了别人的做法，也说清了自己的想法。',2,{art:1}),c('先收下结果，把笔记留到以后再看',0,{money:award,mood:won?3:0},'奶娃把回复收好，没有逼自己立刻消化所有感受。')]};}
 if(s.eventId==='uni-job-reply')source={id:s.eventId,place:'校内服务点',emoji:'🗓️',title:'之前登记的短岗，有排班回复了。',text:'工作人员列出了能接的时段。奶娃仍然可以根据现在的课业和体力决定。',choices:[c('接下一段空闲班次，完成后领取报酬',25,{energy:-12,money:20,study:-2,mood:1},'约好的工作做完了，报酬也按约到账。',0,{job:1}),c('只接短班，给课业留出时间',10,{energy:-6,money:10},'你说明了能做的范围，小任务也认真完成了。',0,{job:1}),c('这次先不接，保留自己的安排',0,{},'你及时回复了自己的安排，没有接下做不完的工作。')]};
 const scene={...clone(source),time:L.eventTime(s),kind:'校园日常',bubble:'今天，也有一点新情况。'};
 const next=s.rhythm.slots.find(k=>k>s.step),room=s.step===7?Math.max(0,1439-minute(scene.time)):minute(L.eventTime({...s,step:next}))-minute(scene.time)-5;
 for(const option of scene.choices){for(const key of ['health','mood'])if((option.mods[key]||0)>0)option.mods[key]=recovery(option.mods[key],key,s.stats[key]);
  if(minute(scene.time)>=1350&&!option.flags.sleep&&!option.flags.rest&&((option.mods.study||0)>0||(option.project||0)>0)){option.mods.health=Math.min(option.mods.health||0,minute(scene.time)>=1380?-4:-2);option.mods.mood=Math.min(option.mods.mood||0,-1);}
  if(s.stats.mood<35&&(option.mods.study||0)>0){option.mods.study=Math.ceil(option.mods.study*.7);option.project=Math.min(option.project||0,Math.ceil(option.mods.study*.75));}
  if((option.mods.social||0)>0)option.mods.social=Math.min(s.stats.social>=80?2:8,Math.ceil(option.mods.social*.5));
  if(option.minutes>room)option.disabledReason='距离下一件事只剩 '+Math.max(0,room)+' 分钟';
  if(option.submitPhoto&&s.campusUpdate.photo&&!s.campusUpdate.photo.resolved)option.disabledReason='上次投稿还在等待回复';
  if(option.applyJob&&s.campusUpdate.job&&!s.campusUpdate.job.resolved)option.disabledReason='已经登记过，先等这次排班回复';
 }
 return scene;
}
function choose(s,index){
 if(!s.campusUpdate||!s.eventId.startsWith('uni-'))return protectFailure(B.choose(s,index));
 if(s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');const scene=getScene(s),c=scene.choices[index];if(!c)throw Error('没有这个选择');if(c.disabledReason)throw Error(c.disabledReason);if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
 const stats=B.apply(s.stats,c.mods),flags={...s.flags},u=clone(s.campusUpdate);for(const[k,v]of Object.entries(c.flags))flags[k]=(flags[k]||0)+v;
 if(c.submitPhoto)u.photo={dueDay:s.day+2+Math.floor(rand(s,'photo-wait')*2),accepted:rand(s,'photo-result')<.55,resolved:false};
 if(c.applyJob)u.job={dueDay:s.day+1+Math.floor(rand(s,'job-wait')*2),resolved:false};
 if(s.eventId==='uni-photo-result')u.photo.resolved=true;if(s.eventId==='uni-job-reply')u.job.resolved=true;
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result:c.result,changes:changes(s.stats,stats),flags:{...c.flags},project:c.project||0,minutes:c.minutes};
 return{...s,stats,flags,campusUpdate:u,failed:failure(stats),term:{...s.term,progress:s.term.progress+entry.project},phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],rhythm:{...s.rhythm,clock:minute(scene.time)+c.minutes,lastActivity:null}};
}
function correctMouse(previous,n){
 if(!previous.campusUpdate||!n.eventId?.startsWith('well-mouse-')||n.phase!=='choice')return n;
 const o=previous.outcome,flags=o?.flags||{};if(!o)return n;
 const id=flags.library||/study|library|reading/.test(o.eventId)?'well-mouse-study':o.eventId.startsWith('meal-')?'well-mouse-canteen':flags.sport?'well-mouse-sport':flags.art||flags.maker?'well-mouse-hobby':previous.step>=4?'well-mouse-dorm':'well-mouse-corridor';
 return n.eventId===id?n:{...n,eventId:id,wellness:{...n.wellness,lastMouseId:id,mouse:{...n.wellness.mouse,id}}};
}
function next(s){return arrive(correctMouse(s,B.next(protectFailure(s))));}
function continueDay(s){return arrive(B.continueDay(s));}
function restore(raw){
 if(!raw?.campusUpdate)return B.restore(raw);
 try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='h')s=B.enableCare(s);else if(a==='b')s=B.enableBalance(s);else if(a==='v')s=B.enableRomance(s);else if(a==='p')s=B.enableStory(s);else if(a==='y')s=B.enableRhythm(s);else if(a==='f')s=B.enableFood(s);else if(a==='i')s=B.enableIllness(s);else if(a==='q')s=B.enableMeetings(s);else if(a==='w')s=B.enableWellness(s);else if(a==='u')s=enableCampus(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else if(typeof a==='string'&&a.startsWith('a:'))s=B.startActivity(s,a.slice(2));else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const all=[...B.events,...events,...followups],api={...B,create,enableCampus,getScene,choose,next,continueDay,restore,valid:s=>restore(s)!==null,events:all,eventCount:all.length};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
