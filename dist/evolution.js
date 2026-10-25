(function(root){
'use strict';
// Released engines stay frozen: the explicit upgrade marker keeps old save replay exact.
const browser=typeof module==='undefined'||!module.exports,B=browser?root.DormGame:require('./campus-life.js'),L=browser?root.DormLife:require('./life.js');
const clone=x=>JSON.parse(JSON.stringify(x)),minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5)),clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
function hash(x){let h=2166136261;for(const c of String(x))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
const random=(s,key)=>B.rng(hash(s.seed+':evolution-1:'+s.day+':'+key))();
const delta=(a,b)=>Object.fromEntries(B.keys.filter(k=>a[k]!==b[k]).map(k=>[k,b[k]-a[k]]));
const failure=s=>s.stats.health<=0?'fail-health':s.stats.mood<=0?'fail-mood':s.stats.energy<=0?'fail-energy':s.stats.study<=0?'fail-study':s.term?.missed>=2?'fail-course':s.failed;
const dead={id:'fail-health',icon:'🌙',name:'奶娃长眠',quote:'这一局，奶娃没能等到下一个清晨。下次给身体和心情留一点余地。',failure:true};
const renamed=e=>e?.id==='degree'?{...e,name:'奶学金得主',quote:'坚持生活，也把学业照顾好了。奶娃获得奶学金和 30 元激励奖。'}:e?.id==='honor'?{...e,name:'荣誉奶学金得主'}:e?.id==='fail-health'?{...e,name:'奶娃长眠',quote:dead.quote}:e;
function settle(s){if(!s.evolution)return s;const id=failure(s);return id===s.failed?s:{...s,failed:id,...(s.phase==='ending'?{finalEnding:id}:{})};}
function enableEvolution(s){if(s.version!==6||s.evolution||s.phase==='ending')return s;return arrange(settle({...s,evolution:{rewarded:false,rewardCredit:0,breakDay:0,loveRecent:[],supportDay:0,care:null,psychDay:0,psychBooked:false,bite:null},actions:[...s.actions,'t']}));}
function create(...args){return enableEvolution(B.create(...args));}
function task(s){const t=B.task(s);return !t||!s.evolution?t:{...t,target:Math.min(230,120+(t.week-1)*30)};}
const animal={
 'well-mouse-study':['自习室门口','自习到一半，奶鼠从门口探出头。','它在门边闻了闻，走到你脚边蹲下。尾巴轻轻晃着，好像想讨一点注意。','蹲下来，轻轻摸摸奶鼠','放下笔，陪奶鼠追一会儿纸球'],
 'well-mouse-canteen':['食堂外','吃完饭，奶鼠正蹲在食堂外。','小家伙望着路过的同学，鼻子一动一动。看见你停下来，它也往前挪了两步。','伸手让奶鼠闻闻，再轻轻摸摸','留一会儿，陪奶鼠玩落叶'],
 'well-mouse-sport':['运动场外','运动场外的树荫里，奶鼠在伸懒腰。','它翻了个身，又追着一片叶子跑出去。看到你靠近，小家伙停下来歪了歪头。','坐在旁边，轻轻摸摸奶鼠','用落叶陪奶鼠玩一会儿'],
 'well-mouse-hobby':['活动室门口','活动室门口，多了一只围观的奶鼠。','奶鼠盯着地上转动的纸团，耳朵竖得高高的。纸团停了，它还轻轻碰了一下。','蹲下摸摸奶鼠，再收好地上的东西','用纸团陪奶鼠玩一会儿'],
 'well-mouse-corridor':['教学楼外','下课出门，奶鼠正趴在台阶旁。','它懒洋洋地晒着太阳。你走近时，小家伙抬起头，在你鞋边蹭了一下。','停下来，轻轻摸摸奶鼠','陪奶鼠追一会儿落叶'],
 'well-mouse-dorm':['回寝的小路','回寝路上，奶鼠从草丛里钻了出来。','它在路边停下，抖了抖耳朵，又抬头看你。奶娃今天的脚步也慢了一点。','蹲下来，轻轻摸摸奶鼠','在路边陪奶鼠玩一会儿']
};
const opt=(text,mods,result,extra={})=>({text,mods,result,flags:{},project:0,...extra});
function careScene(s){const c=s.evolution.care,book=c.previous.phase==='dayEnd',v=c.type==='vaccine',free=book?Infinity:B.freeMinutes({...s,...c.previous});const cost=v?18:12,duration=v?25:30;
 const choices=[opt((book?'预约明早：':'')+(v?'去医院处理咬伤并打疫苗':'到校医院心理门诊咨询'),{money:-cost,energy:book?0:-3},v?'奶娃到医院处理了咬伤，并按游戏内安排完成接种。':'奶娃向心理医生说清了最近的状态，认真商量了接下来的调整。',{minutes:book?0:duration,treat:true}),opt((book?'预约明早：':'')+'申请校内医疗补助后就诊',{energy:book?0:-3},v?'医院协助完成了咬伤处理和接种，奶娃没有因为饭钱不足耽误处理。':'校内补助接住了这次咨询，奶娃得到了一段认真表达和梳理情绪的时间。',{minutes:book?0:20,treat:true,aid:true}),opt(book?'暂不预约':'返回原来的安排',{},'',{minutes:0,cancel:true})];
 for(const q of choices){if(q.aid&&s.stats.money>=cost)q.disabledReason='饭钱不足 '+cost+' 元时可申请';if(q.minutes>free)q.disabledReason='这段空闲只剩 '+free+' 分钟';}
 return{id:'evo-'+c.type,kind:'就诊安排',place:'校医院',time:clock(c.at),emoji:'🏥',bubble:'把照顾自己，放进今天的安排。',title:v?'奶娃需要处理奶鼠咬伤。':'给心情留一次认真就诊的机会。',text:book?'现在确认预约，明早完成就诊。':v?'这一局需要去医院完成咬伤处理与接种，普通看病和休息不能替代。':'心情低于 25 时，持续低落会额外消耗健康。咨询后也需要给日常生活留出恢复空间。',choices};
}
function getScene(s){if(!s.evolution)return B.getScene(s);if(['ending','dayEnd'].includes(s.phase))return null;
 if(s.evolution.care)return careScene(s);
 if(s.eventId==='evo-breakup')return{id:s.eventId,time:clock(s.rhythm.clock),place:'聊天窗口',kind:'感情变化',emoji:'💔',bubble:'有些告别，需要慢慢消化。',romanceScene:true,title:'奶粉想结束这段关系。',text:s.evolution.breakReason,choices:[opt('尊重对方的决定，先找朋友陪一会儿',{energy:-3,mood:-25,social:2},'奶娃认真道了别。朋友陪你坐了一会儿，但难过仍然需要时间消化。'),opt('把想说的话说清楚，然后告别',{energy:-4,mood:-30},'你表达了自己的感受，也接受了这段关系到这里结束。'),opt('先收起聊天窗口，给自己一点安静',{energy:3,mood:-28},'你没有急着回复更多，把今天不紧急的安排往后挪了一点。')]};
 if(s.eventId==='evo-reassure')return{id:s.eventId,time:L.eventTime(s),place:'聊天窗口',kind:'恋人日常',emoji:'💗',bubble:'在意，也需要认真回应。',romanceScene:true,title:'你的宝宝今天有点不安。',text:'“最近我们都很忙，我有点不知道你是不是还想和我分享日常。”奶粉发来消息，等着你的回应。',choices:[opt('认真听完，约好一个能做到的相处时间',{energy:-7,mood:2},'你听完了对方在意的事，也给出了具体的安排。宝宝的语气慢慢放松下来。',{affection:7}),opt('说明自己今天的状态，先好好聊十分钟',{energy:-4,mood:1},'你没有答应做不到的事，也没有把对方的感受晾在一边。',{affection:3}),opt('只回“别想太多”，继续忙自己的事',{energy:1,mood:-2},'对话停在了这句话。奶粉觉得自己的不安没有被认真听见。',{affection:-12})]};
 const scene=clone(B.getScene(s));if(!scene)return scene;
 if(animal[scene.id]){const a=animal[scene.id];Object.assign(scene,{place:a[0],title:a[1],text:a[2],bubble:'校园里的小住客。'});scene.choices[0].text=a[3];scene.choices[0].result='奶鼠在你身边待了一会儿。摸到软软的小脑袋，奶娃的心情也松了一点。';scene.choices[1].text=a[4];scene.choices[1].result='奶鼠追着小东西跑了几个来回，又跑回来蹭了蹭。奶娃暂时放下了任务。';scene.choices[2].text='留一点宠物零食，等奶鼠自己过来吃';scene.choices[2].mods={money:-2,mood:5};scene.choices[2].result='你把零食放好，留开距离。奶鼠自己凑过来吃，奶娃也安安静静地看了一会儿。';scene.choices[2].feed=true;scene.choices.push(opt('看一眼就好，继续自己的安排',{mood:1},'奶娃没有靠近，给奶鼠和自己都留了空间。',{minutes:0}));}
 if(scene.id==='term-deadline'){const t=task(s),gap=Math.max(0,t.target-s.term.progress);scene.text='进度 '+s.term.progress+' / '+t.target+'。按自己的余力，决定怎么收尾。';scene.choices[0].disabledReason=gap?'课设还差 '+gap+' 点':'';scene.choices[1].disabledReason=gap>25?'还差 '+gap+' 点，通宵也补不完':s.stats.energy<=24||s.stats.health<=10?'身体撑不住通宵':'';scene.choices[2].disabledReason=gap>40?'还差 '+gap+' 点，来不及救火':s.stats.social<40?'人缘不足，暂时请不到帮手':'';}
 if(s.romance?.dating&&scene.romanceScene){for(const key of ['title','text','bubble'])if(scene[key])scene[key]=scene[key].replaceAll('奶粉','你的宝宝');for(const c of scene.choices)c.text=c.text.replaceAll('奶粉','你的宝宝');}
 return scene;
}
function arrange(s){if(!s.evolution||s.phase!=='choice'||s.evolution.care)return s;
 if(s.eventId==='love-active-ask-walk'&&s.rhythm.pending&&s.rhythm.clock<1140){const p={...s.rhythm.pending,key:'ask-chat'};return{...s,eventId:'love-active-ask-chat',rhythm:{...s.rhythm,pending:p}};}
 const regular=['love-message','love-walk','love-library','love-dessert','love-rain','love-listen'];
 if(!regular.includes(s.eventId))return s;
 const past=s.log.filter(e=>regular.includes(e.eventId)).slice(-3).map(e=>e.eventId),at=minute(L.eventTime(s));let id=s.eventId;
 if(id==='love-walk'&&at<1140||past.includes(id)){let pool=regular.filter(x=>!past.includes(x)&&(x!=='love-walk'||at>=1140));if(!pool.length)pool=['love-message','love-library','love-dessert'];id=pool[Math.floor(random(s,'romance-variety:'+s.step)*pool.length)];}
 if(s.romance?.dating&&s.day-s.evolution.supportDay>=2&&random(s,'support:'+s.step)<.3)return{...s,eventId:'evo-reassure',evolution:{...s.evolution,supportDay:s.day}};
 return id===s.eventId?s:{...s,eventId:id};
}
function replaceEntry(n,entry){return{...n,outcome:entry,log:[...n.log.slice(0,-1),entry]};}
function chooseCustom(s,index){if(s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('当前不能选择');const scene=getScene(s),c=scene.choices[index];if(!c)throw Error('没有这个选择');if(c.disabledReason)throw Error(c.disabledReason);if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
 const ev=clone(s.evolution),isCare=!!ev.care,care=ev.care,book=isCare&&care.previous.phase==='dayEnd';if(c.cancel)return{...s,...care.previous,evolution:{...ev,care:null},actions:[...s.actions,'c'+index]};
 let stats=B.apply(s.stats,c.mods),term={...s.term},romance={...s.romance},result=c.result;
 if(c.submit){if(term.progress+(c.project||0)<task(s).target)throw Error('课设尚未完成');term.passed++;term.clutch+=c.clutch?1:0;term.cleanStreak=c.clutch?0:term.cleanStreak+1;term.bestStreak=Math.max(term.bestStreak,term.cleanStreak);}if(c.miss){term.missed++;term.cleanStreak=0;}
 term.progress+=c.project||0;
 if(isCare){if(book){if(care.type==='vaccine')ev.bite.appointment=true;else ev.psychBooked=true;result='已预约明早就诊。';}else if(care.type==='vaccine')ev.bite=null;else{stats=B.apply(stats,{mood:22,health:3});ev.psychDay=s.day;}ev.care=book?null:{...care,done:true};}
 if(scene.id==='evo-breakup'){romance.dating=false;romance.intimacy=Math.max(1,romance.intimacy-30);}
 if(scene.id==='evo-reassure'){romance.intimacy=Math.max(0,Math.min(100,romance.intimacy+c.affection));romance.lastInteraction=s.day;if(!romance.intimacy){romance.connected=false;romance.dating=false;romance.lastMeet=s.day;result+='\n亲密度归零，联系方式已删除。';}}
 const entry={day:s.day,step:isCare||scene.id==='evo-breakup'?-1:s.step,eventId:scene.id,index,time:scene.time,title:scene.title,choice:c.text,result,changes:delta(s.stats,stats),flags:{...(c.flags||{})},project:c.project||0,...(c.minutes!==undefined?{minutes:c.minutes}:{}),...((scene.id==='evo-reassure'||scene.id==='evo-breakup')?{intimacyChange:romance.intimacy-s.romance.intimacy}:{})};
 let n={...s,stats,term,romance,evolution:ev,phase:'outcome',outcome:entry,log:[...s.log,entry],actions:[...s.actions,'c'+index],rhythm:{...s.rhythm,clock:minute(scene.time)+(c.minutes||10),...(isCare&&!book?{spent:s.rhythm.spent+c.minutes}:{})}};
 if(book)n={...n,...care.previous};return settle(n);
}
function choose(s,index){if(!s.evolution)return B.choose(s,index);
 if(s.eventId.startsWith('evo-')||s.eventId==='term-deadline')return chooseCustom(s,index);
 if(animal[s.eventId]){const scene=getScene(s),c=scene.choices[index];if(!c||s.phase!=='choice'||!Number.isInteger(index)||index<0)throw Error('没有这个选择');if((c.mods.money||0)<-s.stats.money)throw Error('饭钱不足');
  // Reuse the released encounter's scheduling, then apply this version's visible option.
  let n=B.choose(s,Math.min(index,2)),stats=B.apply(s.stats,c.mods),result=c.result,ev=clone(s.evolution);
  if(index<2&&random(s,'mouse-bite:'+s.eventId)<.2){stats=B.apply(stats,{health:-6,mood:-9});ev.bite=ev.bite||{day:s.day,due:s.day+1,appointment:false};result+='\n奶鼠突然咬了奶娃一口！最迟第 '+ev.bite.due+' 天结束前，需要去医院处理并打疫苗；逾期会触发“奶娃长眠”。';}
  const entry={...n.outcome,index,choice:c.text,title:scene.title,result,changes:delta(s.stats,stats),minutes:c.minutes||0};n=replaceEntry({...n,stats,evolution:ev,rhythm:{...n.rhythm,clock:minute(scene.time)+(c.minutes||0),spent:s.rhythm.spent+(c.minutes||0)}},entry);return settle(n);
 }
 return settle(B.choose(s,index));
}
function availableActivities(s){let list=B.availableActivities(s);if(!s.evolution)return list;if(s.evolution.care||s.eventId==='evo-breakup')return [];list=list.filter(a=>a.id!=='ask-walk'||s.rhythm.clock>=1140);if(s.phase!=='outcome'||s.failed)return list;
 const free=B.freeMinutes(s);if(free>=(s.stats.money>=18?25:20)&&s.evolution.bite&&!s.evolution.bite.appointment)list.unshift({id:'vaccine',label:'处理咬伤、打疫苗',partner:false});if(free>=(s.stats.money>=12?30:20)&&s.stats.mood<35&&s.evolution.psychDay!==s.day&&!s.evolution.psychBooked)list.unshift({id:'psych',label:'预约心理门诊',partner:false});return list;
}
function startActivity(s,key){if(s.evolution&&key==='ask-walk'&&s.rhythm.clock<1140)throw Error('散步约在晚饭后');if(s.evolution&&(s.evolution.care||s.eventId==='evo-breakup'))throw Error('请先完成当前安排');if(!s.evolution||!['vaccine','psych'].includes(key))return B.startActivity(s,key);if(s.failed||!['outcome','dayEnd'].includes(s.phase))throw Error('现在不能安排就诊');if(key==='vaccine'&&(!s.evolution.bite||s.evolution.bite.appointment)||key==='psych'&&(s.stats.mood>=35||s.evolution.psychDay===s.day||s.evolution.psychBooked))throw Error('当前不需要重复预约');if(s.phase==='outcome'&&!availableActivities(s).some(a=>a.id===key))throw Error('这段空闲来不及，可在日终预约');
 const care={type:key,at:s.rhythm.clock,done:false,previous:{eventId:s.eventId,phase:s.phase,outcome:s.outcome}};return{...s,eventId:'evo-'+key,phase:'choice',outcome:null,evolution:{...s.evolution,care},actions:[...s.actions,'a:'+key]};
}
function grant(s){if(!s.evolution||s.failed)return s;let ev=s.evolution,amount=ev.rewardCredit,n=s;
 if(s.phase==='dayEnd'&&!ev.rewarded&&B.degreeStatus(s).awarded){ev={...ev,rewarded:true};amount+=30;n={...n,evolution:ev};}
 const paid=Math.min(amount,150-s.stats.money);if(amount===ev.rewardCredit&&!paid)return n;const stats=B.apply(s.stats,{money:paid});ev={...ev,rewardCredit:amount-paid};
 const entry={day:s.day,step:-1,eventId:'evo-scholarship',index:0,time:clock(s.rhythm.clock),title:'奶学金激励奖到账。',choice:'领取激励奖',result:'奶学金激励奖共 30 元。'+(ev.rewardCredit?'余额已满，余下 '+ev.rewardCredit+' 元保留，后续有空位时到账。':''),changes:delta(s.stats,stats),flags:{},project:0};return{...n,stats,evolution:ev,log:[...n.log,entry]};
}
function next(s){if(!s.evolution)return B.next(s);s=settle(s);let ev=s.evolution;
 if(s.phase!=='outcome')throw Error('请先做出选择');
 if(!s.failed&&ev.care?.done){const previous=ev.care.previous;return{...s,...previous,evolution:{...ev,care:null},actions:[...s.actions,'n']};}
 if(!s.failed&&s.eventId==='evo-breakup'){const previous=ev.breakPrevious;return{...s,...previous,evolution:{...ev,breakPrevious:null},actions:[...s.actions,'n']};}
 if(!s.failed&&s.romance?.dating&&s.romance.earnedDay<s.day&&ev.breakDay!==s.day){ev={...ev,breakDay:s.day};s={...s,evolution:ev};const rate=s.romance.intimacy<80?.6:.02;if(random(s,'breakup')<rate){const reasons=['“我认真想过了，我们不太合适。想相处的方式不一样，我想结束这段关系。”','“我觉得我们的性格不太合拍。这不是谁做得不够好，只是我不想继续恋爱了。”'];return{...s,eventId:'evo-breakup',phase:'choice',outcome:null,evolution:{...ev,breakReason:reasons[Math.floor(random(s,'break-reason')*reasons.length)],breakPrevious:{eventId:s.eventId,phase:s.phase,outcome:s.outcome}},actions:[...s.actions,'n']};}}
 let n=B.next(s);if(n.evolution?.bite&&n.phase==='dayEnd'&&s.day>=n.evolution.bite.due&&!n.evolution.bite.appointment){n={...n,stats:{...n.stats,health:0},failed:'fail-health',finalEnding:'fail-health',phase:'ending'};}
 return grant(arrange(settle(n)));
}
function restPreview(s){const rest=B.restPreview(s);if(!s.evolution||rest.failed)return rest;const ev=s.evolution,extra={};
 if(s.illness?.active&&s.illness.kind==='cold'&&!s.illness.appointment){extra.health=-2*s.illness.days;extra.mood=-2*s.illness.days;}
 if(s.stats.mood<25&&!ev.psychBooked)extra.health=(extra.health||0)-Math.ceil((25-s.stats.mood)/5);
 if(ev.psychBooked){extra.mood=(extra.mood||0)+22;extra.health=(extra.health||0)+3;}if(ev.bite?.appointment){extra.health=(extra.health||0)+3;extra.mood=(extra.mood||0)+3;}
 const stats=B.apply(rest.stats,extra);return{...rest,stats,changes:delta(s.stats,stats),failed:failure({...s,stats,failed:rest.failed})};
}
function continueDay(s){if(!s.evolution)return B.continueDay(s);const rest=restPreview(s),base=B.continueDay(s),ev=clone(s.evolution),change=delta(base.stats,rest.stats);let n={...base,stats:rest.stats,rest,failed:rest.failed,finalEnding:rest.failed,phase:rest.failed?'ending':base.phase,eventId:rest.failed?null:base.eventId};
 if(Object.keys(change).length||ev.psychBooked||ev.bite?.appointment){const entry={day:n.day,step:-1,eventId:'evo-morning',index:0,time:'06:55',title:ev.psychBooked||ev.bite?.appointment?'按预约完成医院就诊。':'清晨，奶娃感到了拖延恢复的代价。',choice:'次日恢复',result:ev.psychBooked?'奶娃完成心理门诊咨询，和医生商量了后续恢复安排。':ev.bite?.appointment?'奶娃完成咬伤处理和疫苗接种。':'拖延处理的感冒或持续低落，让今天更难开始。',changes:change,flags:{},project:0};n.log=[...n.log,entry];}
 if(ev.psychBooked){ev.psychDay=n.day;ev.psychBooked=false;}if(ev.bite?.appointment)ev.bite=null;n.evolution=ev;return grant(arrange(settle(n)));
}
function awardSource(s){if(!s.evolution||!s.failed)return s;let n=s;if(s.stats.health<=0||s.stats.mood<=0)n={...n,log:s.log.filter(e=>!(e.day===s.day&&e.step===7))};return s.failed==='fail-mood'?{...n,failed:'fail-health',finalEnding:'fail-health'}:n;}
function ending(s){if(s.failed==='fail-mood')return dead;return renamed(B.ending(awardSource(s)));}
function achievements(s){const list=B.achievements(awardSource(s));return list.map(e=>s.failed==='fail-mood'&&e.id==='fail-health'?dead:renamed(e));}
function restore(raw){if(!raw?.evolution)return B.restore(raw);try{if(raw.version!==6||!Number.isInteger(raw.seed)||!Array.isArray(raw.actions)||raw.actions.length>30000)return null;let s=B.createHistorical(raw.seed,raw.traits,raw.name,raw.recent);const upgrades={h:'enableCare',b:'enableBalance',v:'enableRomance',p:'enableStory',y:'enableRhythm',f:'enableFood',i:'enableIllness',q:'enableMeetings',w:'enableWellness',u:'enableCampus',e:'enableEconomy',l:'enableLife'};
 for(const a of raw.actions){if(/^c[0-4]$/.test(a))s=choose(s,+a[1]);else if(a==='n')s=next(s);else if(a==='d')s=continueDay(s);else if(a==='r')s=B.retire(s);else if(a==='t')s=enableEvolution(s);else if(upgrades[a])s=B[upgrades[a]](s);else if(typeof a==='string'&&a.startsWith('a:'))s=startActivity(s,a.slice(2));else return null;}return JSON.stringify(s)===JSON.stringify(raw)?s:null;}catch{return null;}}
const added=['breakup','reassure','vaccine','psych'].map(x=>({id:'evo-'+x})),events=[...B.events,...added];
const api={...B,create,enableEvolution,task,getScene,choose,next,continueDay,restPreview,availableActivities,startActivity,ending,achievements,degreeStatus:s=>B.degreeStatus(awardSource(s)),restore,valid:s=>restore(s)!==null,endings:B.endings.map(renamed),events,eventCount:events.length};root.DormGame=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
