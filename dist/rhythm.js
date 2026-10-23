(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./story.js'),L=browser?root.DormLife:require('./life.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const rand=(s,key)=>B.rng(hash(s.seed+':'+s.day+':'+s.step+':'+key))();
const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const c=(text,duration,mods,result,extra={})=>({text,minutes:duration,mods,result,flags:{},affection:0,project:0,...extra});
const activities={
 gym:{label:'去健身',family:'gym',title:'这段空闲，奶娃想去动一动。',place:'校园健身区',emoji:'🏋️',text:'可以去健身房，也可以不花钱，在校园里完成一轮适合自己的活动。',choices:[
  c('去健身房，完成一轮基础训练',45,{money:-5,energy:-18,health:7,mood:4},'你没有和别人比重量，认真完成了自己的安排。',{flags:{sport:1}}),
  c('不花钱，在校园做一轮自重练习',30,{energy:-12,health:5,mood:4},'找一块空地，动作慢一点，练完也有踏实的感觉。',{flags:{sport:1}}),
  c('今天轻一点，活动和拉伸就好',20,{energy:-5,health:3,mood:3},'你把身体从椅子上叫醒，没有把休息日练成比赛。',{flags:{sport:1}})]},
 study:{label:'去自习',family:'study',title:'空出来的时间，可以留给自己的进度。',place:'图书馆',emoji:'📚',text:'奶娃翻开课本和课设清单，决定先处理一件能做完的小事。',choices:[
  c('专注完成一段课设',45,{energy:-16,study:14},'任务清单上少了一块空白。',{project:12,flags:{library:1}}),
  c('补懂今天的一小节',25,{energy:-9,study:8},'没有一下子全懂，但卡住的地方终于往前松了一点。',{project:6,flags:{library:1}}),
  c('整理笔记，列好下一步',20,{energy:-5,study:5,mood:2},'你把下一次开始的地方留得很清楚。',{project:4})]},
 hobby:{label:'兴趣活动',family:'hobby',title:'今天也可以做一点只因为喜欢的事。',place:'校园兴趣角',emoji:'🎨',text:'画纸、乐器和桌游摆在一边。没有考核，选一件自己想试的事。',choices:[
  c('画一张不打算交作业的小画',35,{energy:-8,mood:9,study:3},'画得未必多好，落笔的这段时间确实属于自己。',{flags:{art:1}}),
  c('练一段喜欢的旋律',30,{energy:-7,mood:8},'不急着表演给谁听，先把这一小段练顺。',{flags:{art:1}}),
  c('和桌游社的同学玩一小局',40,{energy:-10,mood:8,social:5},'输赢之外，你还记住了几位新同学的名字。')]},
 job:{label:'赚点饭钱',family:'job',title:'奶娃主动翻了翻校园小任务。',place:'校园兼职栏',emoji:'🧾',text:'不是每个空档都要拿去赚钱，但今天可以挑一项能按时做完的工作。',choices:[
  c('帮忙搬活动物料',35,{energy:-15,money:18},'物料送到，报酬也按约到账。',{flags:{job:1}}),
  c('接一次基础答疑',45,{energy:-18,money:22,study:5},'你把一道题讲清楚，也重新梳理了一遍自己的思路。',{flags:{job:1}}),
  c('完成一个短时整理任务',15,{energy:-7,money:8},'小任务很具体，小报酬也很具体。',{flags:{job:1}})]},
 rest:{label:'休息一下',family:'rest',title:'这段空闲，也可以不再塞任务。',place:'宿舍与校园长椅',emoji:'🍃',text:'奶娃不必把每一分钟都填满。先看看自己现在更需要什么。',choices:[
  c('放下手机，小睡一会儿',30,{energy:12,health:4,mood:4},'醒来时还没满电，但脑子没那么打结了。',{flags:{rest:1,nap:1}}),
  c('安静坐坐，活动肩颈',15,{energy:4,health:2,mood:4},'你给自己留了一小段没有催促的时间。',{flags:{rest:1}}),
  c('看点轻松的东西，记得按时停下',20,{energy:2,mood:5},'看完这一小段，你没有继续往下刷。',{flags:{rest:1}})]},
 'ask-chat':{label:'找奶粉聊聊',family:'chat',partner:true,title:'这次，是奶娃先发来的消息。',place:'聊天窗口',emoji:'💬',text:'不用等奶粉来找你。可以分享一件小事，也可以认真问问对方今天怎么样。',choices:[
  c('分享今天的一件小事，也听听对方',20,{energy:-5,mood:4},'你们来回聊了几句，日常因为有人认真听见而变得不同。',{affection:6}),
  c('留出时间，认真聊一聊彼此最近的想法',30,{energy:-8,mood:5},'你没有急着给建议，奶粉也慢慢说得更多了一点。',{affection:8}),
  c('只发一句“在吗”，收到回复又不接话',10,{energy:-1},'奶粉等了一会儿，最后把聊天窗口收了起来。',{affection:-5})]},
 'ask-study':{label:'约奶粉自习',family:'study',partner:true,title:'奶娃想约奶粉一起自习。',place:'图书馆',emoji:'📖',text:'一起坐着，也给彼此留出完成自己任务的空间。',choices:[
  c('各自专注，休息时交换进度',45,{energy:-16,study:12,mood:3},'两份任务都向前走了一点，相处也没有挤掉各自的安排。',{project:10,affection:7,flags:{library:1}}),
  c('互相讲清一个卡住的小问题',30,{energy:-12,study:9,mood:3},'你们没有替对方写答案，而是一起把问题拆小了。',{project:7,affection:6,flags:{library:1}}),
  c('一直逗奶粉聊天，不让对方做事',25,{energy:-4,study:-5},'奶粉指了指没写完的任务，慢慢安静下来。',{affection:-10})]},
 'ask-gym':{label:'约奶粉运动',family:'gym',partner:true,title:'奶娃想约奶粉一起去运动。',place:'校园健身区',emoji:'🏋️',text:'可以一起动一动，也可以各自按自己的节奏来。',choices:[
  c('先商量强度，一起完成轻量训练',35,{energy:-14,health:6,mood:6},'你们练得不一样快，但都没有被催着赶进度。',{affection:8,flags:{sport:1}}),
  c('一起热身，再各练各的',30,{energy:-12,health:5,mood:4},'彼此照应，也留着各自的节奏。练完再一起走回去。',{affection:6,flags:{sport:1}}),
  c('一直比较成绩，催奶粉加量',30,{energy:-18,health:-3,mood:-3},'奶粉停下来，说不想把每次见面都变成比赛。',{affection:-10,flags:{sport:1}})]},
 'ask-walk':{label:'约奶粉散步',family:'walk',partner:true,title:'奶娃想和奶粉走一小段路。',place:'校园步道',emoji:'🌷',text:'不一定要买东西，也不一定非得聊出一个结论。',choices:[
  c('把手机收起来，边走边认真聊',35,{energy:-8,health:3,mood:7},'熟悉的校园，因为这段认真留下的时间变得有些不同。',{affection:8}),
  c('按彼此的安排，只走一小圈',20,{energy:-4,mood:4},'时间不长，你们也没有让对方为难。',{affection:5}),
  c('一路只看自己的手机',20,{energy:-3},'奶粉的话停在了半句，你过了一会儿才发现。',{affection:-8})]},
 'ask-hobby':{label:'约奶粉玩一会儿',family:'hobby',partner:true,title:'奶娃想约奶粉试试共同的兴趣。',place:'校园活动室',emoji:'🎲',text:'先问问对方喜欢什么，再决定这一段空闲怎么过。',choices:[
  c('挑一个双方都想试的小游戏',40,{energy:-10,mood:8},'你们一边摸索规则，一边笑得比游戏里的角色还忙。',{affection:8}),
  c('一起拍几张校园里的有趣小事',30,{energy:-8,mood:6},'照片不一定惊艳，每张旁边却都多了一小段共同记忆。',{affection:6,flags:{art:1}}),
  c('只按自己的兴趣安排，不听奶粉的想法',25,{energy:-7,mood:2},'你玩得很投入，奶粉却没有找到参与的位置。',{affection:-8})]}
};
const extras={
 'open-gym':{family:'gym',title:'体育馆今天开放体验。',place:'体育馆',emoji:'🏋️',text:'时间正好有一点空。要不要进去了解一下，也可以先按原计划走。',choices:[activities.gym.choices[1],c('问清开放时间，留待下次',10,{energy:-2,study:2},'你记下了开放时段，以后想去时不用临时找消息。'),c('今天先不去',5,{},'奶娃继续按自己的安排往前走。')]},
 badminton:{family:'gym',title:'羽毛球场刚好差一位同学。',place:'羽毛球场',emoji:'🏸',text:'同学挥挥球拍，问你要不要加入一小会儿。',choices:[c('打一小轮，累了就休息',30,{energy:-14,health:5,mood:6,social:5},'球没接住几次，笑声倒是接得很稳。',{flags:{sport:1}}),c('帮忙计分，认识几位同学',15,{energy:-4,social:4,mood:3},'你没下场，也自然地加入了这段热闹。'),c('说明还有安排，下次再来',5,{},'对方点点头，给你留了一个下次见的招呼。')]},
 music:{family:'hobby',title:'草坪上有人试着排一小段歌。',place:'草坪',emoji:'🎵',text:'演出还没成形，路过的人也可以提一点想法。',choices:[c('加入一小段，试试自己的声音',30,{energy:-8,mood:8,social:3},'没有人急着打分，你也慢慢敢把声音放出来。',{flags:{art:1}}),c('坐下听一会儿',20,{energy:-3,mood:5},'你给今天留了一段不需要回答问题的时间。'),c('挥挥手，继续自己的安排',5,{},'旋律跟着你走出一小段路。')]},
 makers:{family:'study',title:'创客教室在试一个小点子。',place:'创客教室',emoji:'🛠️',text:'桌上有没装完的零件，也有愿意解释思路的同学。',choices:[c('动手试一个简单结构',30,{energy:-12,study:9,mood:3},'小结构终于站稳，你也摸清了一点原理。',{project:7,flags:{maker:1}}),c('帮忙找材料，听听大家怎么分工',15,{energy:-6,social:4,study:3},'你没有包下整个任务，但帮忙把下一步接了起来。',{flags:{kindness:1}}),c('今天先不参加',5,{},'你记住了教室的位置，留待有空时再来。')]},
 volunteer:{family:'job',title:'校园回收点需要一点帮忙。',place:'志愿服务点',emoji:'🤝',text:'剩下的工作不大，工作人员说能帮多久都可以。',choices:[c('留一小段时间整理物品',30,{energy:-13,social:6,mood:4},'几袋物品被归了类，工作人员认真向你道了谢。',{flags:{kindness:2}}),c('帮忙贴完这一轮标签',15,{energy:-6,social:3,mood:2},'小小一轮收尾，也让现场轻松了一点。',{flags:{kindness:1}}),c('说明现在赶时间',5,{},'你没有勉强接下做不完的工作。')]},
 games:{family:'hobby',title:'桌游社问：要不要来一小局？',place:'学生活动室',emoji:'🎲',text:'这一局刚要开始，旁边还有一个空位置。',choices:[c('玩一局，结束就按时离开',40,{energy:-10,mood:8,social:5},'你记住了几个新名字，也守住了自己的时间。'),c('先看一会儿，了解规则',15,{energy:-4,mood:3,social:2},'下次再来，就不用从第一条规则开始听了。'),c('今天先不加入',5,{},'奶娃给热闹点点头，继续往前走。')]}
};
function plan(s){
 const r=B.rng(hash(s.seed+':rhythm:'+s.day)),optional=[1,3,4,6].map(step=>({step,n:r()})).sort((a,b)=>a.n-b.n).slice(0,2+Math.floor(r()*3)).map(x=>x.step);
 const week=Math.ceil(s.day/7),crisis=B.rng(hash(s.seed+':term-crisis:'+week)),crisisDay=(week-1)*7+3+Math.floor(crisis()*3),crisisStep=[3,4,6][Math.floor(crisis()*3)];
 if(s.day===crisisDay)optional.push(crisisStep);if(s.stats.money<10)optional.push(1);
 const slots=[...new Set([0,2,5,7,...optional,s.step])].sort((a,b)=>a-b);
 return{day:s.day,slots,minutes:150+Math.floor(r()*4)*30,spent:0,clock:minutes(s.outcome?.time||L.eventTime(s)),serial:0,pending:null,lastActivity:null,autoSeen:[],counts:{},meetingSource:null};
}
function enableRhythm(s){if(s.version!==6||s.rhythm||s.phase==='ending')return s;s=B.enableStory(B.enableRomance(s));const rhythm=plan(s);if(s.phase==='outcome')rhythm.clock+=10;return{...s,rhythm,actions:[...s.actions,'y']};}
function create(...args){return enableRhythm(B.create(...args));}
function nextSlot(s){return s.rhythm.slots.find(x=>x>s.step);}
function freeMinutes(s){if(!s.rhythm||s.failed||s.phase!=='outcome'||s.step===7||s.rhythm.pending)return 0;const step=nextSlot(s);if(step===undefined)return 0;return Math.max(0,Math.min(s.rhythm.minutes-s.rhythm.spent,minutes(L.eventTime({...s,step}))-s.rhythm.clock-5));}
function availableActivities(s){const free=freeMinutes(s);return Object.entries(activities).filter(([,a])=>(!a.partner||s.romance?.connected)&&a.choices.some(c=>c.minutes<=free)).map(([id,a])=>({id,label:a.label,partner:!!a.partner}));}
function customId(key){return (activities[key]?.partner?'love-active-':'active-')+key;}
function open(s,key,source,action){
 const def=activities[key]||extras[key];if(!def)throw Error('没有这项活动');
 const period=Math.floor(s.rhythm.clock/180),busy=!!def.partner&&source==='self'&&B.rng(hash(s.seed+':availability:'+s.day+':'+period))()<.27;
 const pending={key,source,busy,period,at:s.rhythm.clock,serial:s.rhythm.serial+1,extra:!!extras[key]};
 return{...s,eventId:pending.extra?'extra-'+key:customId(key),phase:'choice',outcome:null,rhythm:{...s.rhythm,serial:pending.serial,pending,lastActivity:null},actions:[...s.actions,action]};
}
function startActivity(s,key){if(!availableActivities(s).some(a=>a.id===key))throw Error('现在没有足够的空闲安排这项活动');return open(s,key,'self','a:'+key);}
const chanceText={
 'love-message':['你们在课间碰见了。','奶粉拿出一张刚拍的云朵照片。你也正好有一点今天的小事想分享。'],
 'love-walk':['在操场边，你碰见了奶粉。','你们都正好慢下了脚步。要不要一起走一小圈，也看看自己手里还剩多少时间？'],
 'love-library':['你在图书馆碰见了奶粉。','奶粉旁边的座位刚好空出来，你也带着没完成的任务。'],
 'love-dessert':['甜品窗口前，奶粉也在看菜单。','你们顺路聊起喜欢的口味。预算和时间，都可以先说清楚。'],
 'love-rain':['雨檐下，你又碰见了奶粉。','奶粉正整理手里的折伞。你们看了一眼雨，也看了一眼各自接下来的路。'],
 'love-listen':['长椅上，奶粉今天有点安静。','你打了个招呼。奶粉说起一件烦心事，又问会不会打扰到你。']
};
function arrive(s){
 if(!s.rhythm||s.phase!=='choice'||[0,2,5,7].includes(s.step)||s.eventId.startsWith('term-')||(s.step===1&&s.stats.money<10))return s;
 let id=s.eventId,source=null;
 if(s.romance?.connected&&rand(s,'rhythm-love')<.28){id=s.romance.intimacy>=80&&!s.romance.dating?'love-confession':Object.keys(chanceText)[Math.floor(rand(s,'rhythm-love-scene')*6)];source=rand(s,'rhythm-love-origin')<.5?'chance':'naifen';}
 else if(!s.romance?.connected&&(!s.romance.lastMeet||s.day-s.romance.lastMeet>=3)&&rand(s,'rhythm-first-meet')<.18)id='love-encounter';
 return{...s,eventId:id,rhythm:{...s.rhythm,meetingSource:source}};
}
function getScene(s){
 if(!s.rhythm)return B.getScene(s);if(['ending','dayEnd'].includes(s.phase))return null;
 const p=s.rhythm.pending||s.rhythm.lastActivity;
 if(p&&(s.eventId.startsWith('active-')||s.eventId.startsWith('love-active-')||s.eventId.startsWith('extra-'))){
  const def=clone(p.extra?extras[p.key]:activities[p.key]),free=Math.min(s.rhythm.minutes-s.rhythm.spent,minutes(L.eventTime({...s,step:nextSlot(s)}))-p.at-5);
  let scene={...def,id:s.eventId,time:clock(p.at),kind:p.source==='self'?'自主安排':p.source==='naifen'?'奶粉的邀请':'校园偶遇',bubble:p.source==='self'?'这次，我来安排。':'计划外的小插曲。',romanceScene:!!def.partner};
  if(def.partner&&p.source!=='self'){scene.title=p.source==='naifen'?'奶粉想约你一起活动。':'你在校园里又碰见了奶粉。';scene.text='你们正好聊到要不要'+def.label.replace('约奶粉','')+'，也可以按各自的节奏来。';}
  if(p.busy){
   const reasons=['奶粉正在赶小组作业，这会儿腾不出时间。','奶粉已经和同学约好了别的安排。','奶粉今天有点累，想先留点时间给自己。'];
   scene.title='奶粉这会儿有自己的安排。';scene.text=reasons[Math.floor(B.rng(hash(s.seed+':busy-reason:'+s.day+':'+p.period))()*reasons.length)];
   const solo=activities[def.family]||activities.rest;
   scene.choices=[{...clone(solo.choices[1]),text:'那就先自己安排：'+solo.label,affection:0},c('说明没关系，下次有空再约',10,{energy:-2,mood:1},'你们说清了各自的安排，没有把没空误会成不在乎。',{affection:1}),c('连着发消息催对方',10,{energy:-3,mood:-2},'奶粉又解释了一遍，语气比刚才安静了一些。',{affection:-8})];
  }
  if(!p.extra)scene.choices.push(c('今天先不安排这项活动',5,{},'你没有勉强塞进一项活动，先把接下来的时间留出来。',{cancel:true}));
  const count=s.rhythm.counts[def.family]||0;
  if(count>=2)scene.callback='今天已经安排过几轮同类活动，继续加量的收益会变小。';
  for(const choice of scene.choices){
   if(count>=2){for(const k of ['energy','health','mood'])if(choice.mods[k]>0)choice.mods[k]=Math.floor(choice.mods[k]*.4);if(choice.affection>0)choice.affection=Math.max(1,Math.floor(choice.affection*.5));}
   if(def.family==='gym'&&count>=2&&choice.flags?.sport&&!choice.cancel){choice.mods.health=Math.min(-2,choice.mods.health||0);scene.callback='今天已经练过几轮，再加练会增加疲劳，先恢复也很重要。';}
   if((choice.mods.social||0)>0)choice.mods.social=Math.min(s.stats.social>=80?2:8,Math.ceil(choice.mods.social*.5));
   if(s.stats.mood<35&&choice.mods.study>0){choice.mods.study=Math.ceil(choice.mods.study*.7);choice.project=Math.min(choice.project||0,Math.ceil(choice.mods.study*.75));}
   if(choice.minutes>free)choice.disabledReason='这段空闲只剩 '+Math.max(0,free)+' 分钟';
  }
  return scene;
 }
 const scene=B.getScene(s);if(s.rhythm.meetingSource==='chance'&&chanceText[scene.id]){scene.title=chanceText[scene.id][0];scene.text=chanceText[scene.id][1];scene.kind='偶遇奶粉';}return scene;
}
function choose(s,index){
 if(!s.rhythm)return B.choose(s,index);
 if(!s.rhythm.pending){const scene=getScene(s),n=B.choose(s,index),entry={...n.outcome,title:scene.title};return{...n,outcome:entry,log:[...n.log.slice(0,-1),entry],rhythm:{...s.rhythm,clock:minutes(entry.time)+10,lastActivity:null}};}
 if(s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('现在不能选择');
 const scene=getScene(s),choice=scene.choices[index];if(!choice)throw Error('没有这个选择');if(choice.disabledReason)throw Error(choice.disabledReason);if((choice.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
 const stats=B.apply(s.stats,choice.mods),changes={};for(const key of B.keys)if(stats[key]!==s.stats[key])changes[key]=stats[key]-s.stats[key];
 const flags={...s.flags};for(const[key,value]of Object.entries(choice.flags||{}))flags[key]=(flags[key]||0)+value;
 const p=s.rhythm.pending,def=p.extra?extras[p.key]:activities[p.key],romance={...s.romance},before=romance.intimacy;let result=choice.result;
 if(def.partner){if(!romance.connected)throw Error('还没有奶粉的联系方式');romance.intimacy=Math.max(0,Math.min(100,before+(choice.affection||0)));romance.lastInteraction=s.day;if(romance.intimacy===0){romance.connected=false;romance.dating=false;romance.lastMeet=s.day;result+='\n亲密度归零，联系方式已删除。';}}
 const entry={day:s.day,step:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:choice.text,result,changes,flags:{...choice.flags},project:choice.project||0,intimacyChange:romance.intimacy-before,contactDeleted:!!def.partner&&!romance.connected,origin:p.source,minutes:choice.minutes};
 const failed=stats.energy<=0?'fail-energy':stats.study<=0?'fail-study':stats.health<=0?'fail-health':null;
 return{...s,stats,flags,romance,term:{...s.term,progress:s.term.progress+entry.project},failed,phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],rhythm:{...s.rhythm,spent:s.rhythm.spent+choice.minutes,clock:p.at+choice.minutes,pending:null,lastActivity:p,counts:{...s.rhythm.counts,[def.family]:(s.rhythm.counts[def.family]||0)+(choice.cancel||(def.family==='gym'&&!choice.flags?.sport)?0:1)}}};
}
function next(s){
 if(!s.rhythm)return B.next(s);if(s.phase!=='outcome')throw Error('请先做出选择');
 if(!s.failed&&s.step!==7&&!s.rhythm.autoSeen.includes(s.step)&&freeMinutes(s)>=20&&rand(s,'rhythm-extra')<.25){
  const withPartner=s.romance?.connected&&rand(s,'rhythm-extra-partner')<.4;
  const partners=['ask-gym','ask-walk','ask-study'].filter(key=>activities[key].choices.some(c=>c.minutes<=freeMinutes(s)));
  const key=withPartner&&partners.length?partners[Math.floor(rand(s,'rhythm-extra-kind')*partners.length)]:Object.keys(extras)[Math.floor(rand(s,'rhythm-extra-kind')*6)];
  const source=withPartner&&rand(s,'rhythm-extra-origin')<.5?'naifen':'chance';
  const n=open(s,key,source,'n');return{...n,rhythm:{...n.rhythm,autoSeen:[...s.rhythm.autoSeen,s.step]}};
 }
 if(s.failed||s.step===7)return B.next(s);
 const step=nextSlot(s),romance=s.romance;let n=B.next({...s,step:step-1,romance:null});n={...n,romance,rhythm:{...s.rhythm,pending:null,lastActivity:null,clock:minutes(L.eventTime(n)),meetingSource:null}};return arrive(n);
}
function continueDay(s){if(!s.rhythm)return B.continueDay(s);const romance=s.romance;let n=B.continueDay({...s,romance:null});n={...n,romance};if(n.failed)return n;return{...n,rhythm:plan(n)};}
function restore(raw){
 if(!raw?.rhythm)return B.restore(raw);
 try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;
  let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);
  for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='h')s=B.enableCare(s);else if(a==='b')s=B.enableBalance(s);else if(a==='v')s=B.enableRomance(s);else if(a==='p')s=B.enableStory(s);else if(a==='y')s=enableRhythm(s);else if(a==='e')s=B.enableEconomy(s);else if(a==='l')s=B.enableLife(s);else if(typeof a==='string'&&a.startsWith('a:'))s=startActivity(s,a.slice(2));else return null;}
  return JSON.stringify(s)===JSON.stringify(raw)?s:null;
 }catch{return null;}
}
const events=[...B.events,...Object.keys(activities).map(key=>({id:customId(key)})),...Object.keys(extras).map(key=>({id:'extra-'+key}))];
const api={...B,create,choose,getScene,next,continueDay,enableRhythm,availableActivities,freeMinutes,startActivity,restore,valid:s=>restore(s)!==null,events,eventCount:events.length};
root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
