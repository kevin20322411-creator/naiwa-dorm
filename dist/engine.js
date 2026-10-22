(function(root){
'use strict';
const keys=['energy','money','social','study'];
const labels={energy:'电量',money:'饭钱',social:'人缘',study:'学业'};
const traits=[
 {id:'bed',icon:'🛏️',name:'床板封印术',desc:'只要我不下床，早八就抓不到我。',mods:{energy:20,study:-10}},
 {id:'brain',icon:'📓',name:'前排常驻嘉宾',desc:'知识不一定进脑子，但老师眼熟我。',mods:{study:20,energy:-8}},
 {id:'friend',icon:'🤝',name:'宿舍气氛组',desc:'没我这个寝室，连沉默都不够热闹。',mods:{social:20,study:-5}},
 {id:'budget',icon:'🪙',name:'极限省钱王',desc:'别人拼绩点，我拼第二份半价。',mods:{money:20,energy:-5}},
 {id:'food',icon:'🍚',name:'天选干饭人',desc:'不是饿了，是到了该尊重食物的时间。',mods:{energy:18,money:-8}},
 {id:'ddl',icon:'⚡',name:'DDL觉醒体',desc:'离截止还有十分钟？那不才刚开始。',mods:{study:10,energy:5}},
 {id:'chaos',icon:'🌀',name:'抽象浓度超标',desc:'有些人出生就是为了让群聊不冷场。',mods:{social:10,study:-5}},
 {id:'luck',icon:'🍀',name:'校园锦鲤',desc:'课可以不预习，运气必须先加载。',mods:{money:5,social:5}},
 {id:'battery',icon:'🔋',name:'人形充电宝',desc:'只睡五分钟，醒来又是一只好奶娃。',mods:{energy:25,money:-5}},
 {id:'reliable',icon:'🧰',name:'全寝唯一靠谱',desc:'群里一句“谁会”，你就知道该上线了。',mods:{study:12,social:10,energy:-8}}
];
const endings=[
 {id:'chaos',icon:'🌀',name:'宿舍抽象之神',quote:'你的绩点尚未公开，你的表情包已经传遍全校。',hint:'比起解决问题，你更擅长成为新的问题。'},
 {id:'poor',icon:'🍜',name:'月末泡面仙人',quote:'银行卡很安静，泡面调料包却在你手里奏响了交响乐。',hint:'今天的每一笔消费，都在为这桶泡面铺路。'},
 {id:'tired',icon:'🛌',name:'被窝封印者',quote:'你终于回到床上。床说：这一天，辛苦你假装成人了。',hint:'电量见底的时候，被窝会接管你的人生。'},
 {id:'skip',icon:'⏰',name:'早八失踪人口',quote:'老师记住了你的名字，却始终没记住你的脸。',hint:'连续向早八和作业请假，也是一种稳定发挥。'},
 {id:'hero',icon:'🦸',name:'小组作业救世主',quote:'你救了作业，救了室友。你的文件名叫“最终版真的不改了”。',hint:'替队友接住两次烂摊子，传说便诞生了。'},
 {id:'popular',icon:'💚',name:'宿舍团宠',quote:'你还没开口，室友已经问你：带饭吗？要充电器吗？',hint:'人缘攒够了，大学生活会主动给你开小灶。'},
 {id:'scholar',icon:'🎓',name:'绩点卷王',quote:'你嘴上说没复习，奶娃小抄却已经整理到第三版。',hint:'把今天交给知识，知识会给你一个响亮的称号。'},
 {id:'rich',icon:'💰',name:'校园省钱大师',quote:'室友在等生活费，你已经把外卖满减研究成了一门学科。',hint:'守住钱包，有时比守住早八还需要意志力。'},
 {id:'lucky',icon:'🍀',name:'校园锦鲤',quote:'签到抽中你免答，外卖多送一份。连熄灯都晚了两分钟。',hint:'带着锦鲤天赋，再给好运留一点发挥空间。'},
 {id:'battery',icon:'🔋',name:'满电摸鱼王',quote:'所有人都累了，只有你说：要不再开一局？',hint:'保住电量和心态，学业随缘，也有自己的快乐。'},
 {id:'balanced',icon:'✳️',name:'六边形奶娃',quote:'饭吃到了，课听懂了，室友哄好了。今天的你，稳得离谱。',hint:'电量、人缘、学业都不错，饭钱也还有余粮。'},
 {id:'ordinary',icon:'🌙',name:'普通但快乐',quote:'没有拯救世界，也没被早八打败。平安回到宿舍，已经很了不起。',hint:'不必冲向某个极端，好好过完这一天就够了。'}
];
const c=(text,hint,mods,result,flags={})=>({text,hint,mods,result,flags});
const stages=[
 {time:'07:50',place:'宿舍 · 早八前十分钟',title:'醒了，但没完全醒。',bubble:'我再睡五分钟。',emoji:'⏰',text:'闹钟响了第六次。室友已经把门推开，而你发现：\n今天不是人类，是一只软得根本站不起来的奶娃。',choices:[
  c('弹射起床，冲向早八','这堂课，奶娃也得上。',{energy:-15,study:12},'你用三分钟完成洗漱，带着一种“人来就行”的美冲出了宿舍。老师还没来，奶娃先到了。',{early:1}),
  c('拜托室友带个包子，再眯五分钟','启动人情互助系统。',{energy:12,money:-4,social:5},'室友发来语音：“包子买了，你醒了吗？”\n你睁眼发现，五分钟是一个非常有弹性的时间单位。',{late:1}),
  c('给闹钟盖上被子，让它也休息','万物皆可关怀，除了早八。',{energy:20,study:-12},'你温柔地安顿好闹钟，重新躺下。\n这一刻，你和知识达成了互不打扰的协议。',{skip:1,chaos:1})]},
 {time:'08:10',place:'教室 · 随机点名现场',title:'老师说：“找位同学回答。”',bubble:'别看我，别看我。',emoji:'📖',text:'课件上一串公式像在跳舞。老师的目光缓缓扫过教室。\n群聊弹出一句：“开始随机点名了。”',choices:[
  c('坐直，认真把这一段听懂','现在补救，永远不晚。',{energy:-12,study:20},'你没有突然开窍，只是终于抓住了一个知识点。\n“居然能听懂一点。”奶娃感到非常震撼。',{learn:1}),
  c('小声问室友：现在讲到第几页','学术互助也是互助。',{social:10,study:6,energy:-3},'室友把笔记推过来，还顺手圈了重点。\n你决定下次取外卖时，也替他圈一下取餐码。',{help:1}),
  c('在群里发：奶娃正在进行远程学习','参与了，但以一种抽象方式。',{study:-10,social:6,energy:7},'你发了一张奶娃认真听课的表情包。\n老师叫到你的名字，群里顿时安静。',{skip:1,chaos:1})]},
 {time:'11:40',place:'食堂 · 人类大迁徙',title:'食堂排队，饭菜比课更难抢。',bubble:'好饿，想吃两份。',emoji:'🍚',text:'第一食堂人山人海。室友问你要不要拼外卖。\n远处的阿姨喊了一声：“最后一份糖醋里脊！”',choices:[
  c('食堂两荤一素，奶娃吃饭第一名','先把自己照顾好。',{money:-12,energy:22},'盘子装得很满，奶娃的内心也装得很满。\n下午的事下午再说，现在每一粒米都值得被认真对待。',{meal:1}),
  c('和室友拼单，研究最优满减','人多，就是奶娃的力量。',{money:-9,energy:15,social:8},'你们算了七分钟满减，省了三块钱。\n算账很累，但战胜配送费的感觉很爽。',{meal:1}),
  c('买个馒头，去操场晒会太阳','把预算留给未来的自己。',{money:-2,energy:8},'你拿着馒头坐在操场边。阳光暖得恰到好处。\n奶娃悟了：有些快乐没有配送费。',{simple:1})]},
 {time:'14:00',place:'小组群 · 距离提交还有两小时',title:'“大家都做完了吗？”',bubble:'收到，正在做。（刚打开）',emoji:'💻',text:'组长发来消息：“四点之前汇总。”\n你点开文件夹：新建文件夹、新建文本文档，以及一个叫“以后再说”的文件。',choices:[
  c('先交出自己的部分，再帮室友补两页','靠谱奶娃，申请出战。',{energy:-22,study:18,social:12},'你终于明白，所谓团队合作，是互相接住快要掉地上的文件。\nPPT交了，室友说以后带饭都算他的。',{rescue:1}),
  c('开二十五分钟专注，把自己的做完','先完成，再完美。',{energy:-12,study:20},'你关掉群聊，终于写下第一行。\n二十五分钟之后，你第一次觉得：早开始，其实也挺爽。',{work:1}),
  c('先发一张奶娃图：给大家加个油','精神支持，已到账。',{social:5,study:-12,energy:8},'群里收获了四个“哈哈哈”。\n两分钟后组长回复：“图挺好，文件呢？”',{chaos:1,skip:1})]},
 {time:'17:30',place:'宿舍 · 人类充电站',title:'终于回寝，但室友有个小请求。',bubble:'我的床，我回来辣。',emoji:'🛏️',text:'你刚碰到床沿，室友探出脑袋：\n“能帮我取个快递吗？就一个。真的就一个。”',choices:[
  c('帮他取，顺便把外卖也带回来','嘴上嫌弃，身体诚实。',{energy:-12,social:20},'快递不是一个，是一袋。\n你正准备发作，室友把第一口奶茶递给了你。行吧，今天先不计较。',{rescue:1,helped:1}),
  c('躺下补觉，充满再说','奶娃也有低电量模式。',{energy:25,study:-3},'你睡了一个不用担心迟到的觉。\n醒来的时候，夕阳在被子上铺了一小块金色。',{nap:1}),
  c('在寝室走廊举行个人街舞巡演','给晚饭前的世界一点震撼。',{energy:-10,social:13,study:-3},'隔壁寝室探出三颗脑袋。\n你点头致意，完成了一场只有观众没有门票的演出。',{chaos:1})]},
 {time:'20:00',place:'校园 · 属于自己的两个小时',title:'今晚，决定怎么对待自己。',bubble:'今天也可以有点盼头。',emoji:'🌃',text:'天色暗下来，图书馆亮着灯，操场有人跑步。\n手机里有游戏邀请，也有一条没划掉的待办。',choices:[
  c('去图书馆，把今天的知识补起来','给未来的奶娃留点底气。',{energy:-15,study:22},'你把白天不会的题又看了一遍。\n原来知识不会追着奶娃跑，但奶娃可以慢慢走过去。',{learn:1}),
  c('和室友去散步，顺便买点夜宵','无用的闲聊，有用的快乐。',{money:-10,energy:12,social:15},'你们从考试聊到宇宙，最后一致认为明天要早睡。\n路过操场的时候，谁也没提回去。',{meal:1}),
  c('接一份校园小任务，挣点饭钱','把空闲变成明天的鸡腿。',{money:25,energy:-15,study:3},'你帮同学整理了一份资料，收到了二十五块。\n钱不多，但明天那份糖醋里脊突然有了着落。',{earn:1})]},
 {time:'22:30',place:'宿舍门口 · 突击查寝',title:'“同学，检查一下寝室卫生。”',bubble:'现在撤回生活还来得及吗？',emoji:'🧹',text:'门外传来敲门声。你看了一眼桌面：\n外卖盒、半杯奶茶，以及一只试图伪装成装饰品的奶娃。',choices:[
  c('快速收拾，安排室友分工','奶娃指挥部，马上上线。',{energy:-12,social:12,study:3},'你拎垃圾，室友擦桌子，另一位负责把拖鞋摆得看起来很有秩序。\n门开了。阿姨说：“还不错嘛。”',{tidy:1}),
  c('礼貌开门，承认并立刻整改','主打一个真诚。',{energy:-5,social:3},'你说：“阿姨，给我们五分钟。”\n阿姨叹了口气：“别光笑，赶紧动。”你突然觉得她可能已经习惯了。',{honest:1}),
  c('抱臂站好，申请成为宿舍吉祥物','我不占床位，我负责招财。',{social:-8,study:-3},'你用最坚定的表情表达自己只是一件摆设。\n阿姨沉默了两秒：“吉祥物也得倒垃圾。”',{chaos:1})]},
 {time:'23:59',place:'宿舍 · 熄灯前最后一分钟',title:'灯快灭了，今天还剩一个选择。',bubble:'明天一定，明天一定。',emoji:'🌙',text:'电灯开始最后的闪烁。室友问你：“明天早八，起得来吗？”\n你望着天花板，感觉今天过了很久，也像才刚开始。',choices:[
  c('放下手机，认真给明天定个闹钟','这一次，稍微对自己好一点。',{energy:18,study:8},'你把手机放到够不到的地方。\n“明天不一定完美，但可以先从按时起床开始。”奶娃闭上了眼。',{sleep:1}),
  c('和室友再聊五分钟','有些夜晚，后来会很想念。',{energy:-10,social:20},'从“最后一句”聊到“真最后一句”。\n话题没什么用，但你突然觉得，大学好像就藏在这些声音里。',{nighttalk:1}),
  c('戴上耳机，进行一次奶娃精神演出','熄灯，不能熄灭艺术。',{energy:-18,study:-8,social:5},'你在黑暗里无声起舞。\n下铺传来一句：“奶娃，别让床也跟着演。”\n今天，完美谢幕。',{chaos:1})]}
];
function rng(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function newDraft(seed){const random=rng(seed);return [...traits].sort((a,b)=>a.id.localeCompare(b.id)).map(t=>({t,k:random()})).sort((a,b)=>a.k-b.k).slice(0,6).map(x=>x.t.id);}
function apply(stats,mods){const next={...stats};for(const k of keys)next[k]=Math.max(0,Math.min(k==='money'?150:100,next[k]+(mods[k]||0)));return next;}
function create(seed,selected,name){if(!Array.isArray(selected)||selected.length!==2||new Set(selected).size!==2||selected.some(x=>!traits.some(t=>t.id===x)))throw Error('请选择两张不同天赋');let stats={energy:65,money:40,social:45,study:40};for(const id of selected)stats=apply(stats,traits.find(t=>t.id===id).mods);return{version:1,seed:seed>>>0,name:String(name||'奶娃同学').trim().slice(0,12)||'奶娃同学',traits:[...selected],stats,flags:{},step:0,phase:'choice',log:[],outcome:null,bonus:false};}
function getScene(state){const scene={...stages[state.step]};if(!scene.choices)return null;scene.choices=scene.choices.map(x=>({...x,mods:{...x.mods},flags:{...x.flags}}));scene.callback='';
 if(state.step===1){if(state.flags.skip){scene.text='你还躺在床上，室友发来一条语音：“点到你了。”\n奶娃缓缓坐起：原来缺席也能如此有存在感。';scene.callback='上一幕你选择了继续睡，远程早八模式已启动。';scene.choices[0].text='立刻赶去教室，争取后半节课';}else if(state.flags.late){scene.callback='包子已经到位，但你刚刚错过了开场的重点。';}}
 if(state.step===3&&state.traits.includes('ddl')){scene.callback='天赋触发 · DDL觉醒体：今天完成作业的选项额外学业 +8。';scene.choices.slice(0,2).forEach(x=>x.mods.study+=8);}
 if(state.step===4&&state.stats.energy<=30){scene.callback='奶娃电量告急。午后这一觉，也许真的很有必要。';}
 if(state.step===5&&state.stats.money<10){scene.callback='钱包提示：余额不多了。晚饭、夜宵和明天，得做个取舍。';scene.choices[1].text='买点便宜夜宵，和室友散步';scene.choices[1].mods.money=-Math.min(10,state.stats.money);}
 if(state.step===6&&state.flags.helped){scene.callback='白天你帮室友取过快递。现在室友主动接过垃圾袋，所有选项额外电量 +5。';scene.choices.forEach(x=>x.mods.energy+=5);}
 if(state.step===7&&state.flags.skip>=2){scene.callback='今天你向早八和作业借了时间。明天，可能得还一点。';}
 return scene;}
function choose(state,index){if(state.phase!=='choice'||state.step>=stages.length||!Number.isInteger(index)||index<0||index>2)throw Error('当前不能选择');const scene=getScene(state),option=scene.choices[index];let mods={...option.mods},result=option.result;let bonus=state.bonus;
 if(state.traits.includes('luck')&&!bonus&&state.step===2){mods.money=(mods.money||0)+8;result+='\n🍀 锦鲤天赋触发：饭卡活动返还了8元！';bonus=true;}
 const stats=apply(state.stats,mods),actual={};for(const k of keys){const d=stats[k]-state.stats[k];if(d)actual[k]=d;}
 const flags={...state.flags};for(const [k,v]of Object.entries(option.flags))flags[k]=(flags[k]||0)+v;
 const entry={step:state.step,index,time:scene.time,title:scene.title,choice:option.text,result,changes:actual};return{...state,stats,flags,bonus,phase:'outcome',outcome:entry,log:[...state.log,entry]};}
function next(state){if(state.phase!=='outcome')throw Error('请先做出选择');return{...state,step:state.step+1,phase:state.step+1>=stages.length?'ending':'choice',outcome:null};}
function ending(state){const s=state.stats,f=state.flags;let id='ordinary';
 if(f.chaos>=4)id='chaos';else if(s.money<=3)id='poor';else if(s.energy<=10)id='tired';else if(f.skip>=2)id='skip';else if(f.rescue>=2)id='hero';else if(s.social>=90)id='popular';else if(s.study>=92)id='scholar';else if(s.money>=70)id='rich';else if(state.traits.includes('luck')&&state.bonus&&s.energy>=35&&s.study>=45)id='lucky';else if(s.energy>=85&&s.study<60)id='battery';else if(s.energy>=55&&s.social>=65&&s.study>=65&&s.money>=15)id='balanced';return endings.find(x=>x.id===id);}
function valid(raw){try{if(!raw||raw.version!==1||!Number.isInteger(raw.seed)||!Array.isArray(raw.log)||raw.log.length>8)return false;let s=create(raw.seed,raw.traits,raw.name);for(const item of raw.log){s=choose(s,item.index);if(item.step<raw.step)s=next(s);}return JSON.stringify(s)===JSON.stringify(raw);}catch{return false;}}
const api={keys,labels,traits,endings,stages,rng,newDraft,apply,create,getScene,choose,next,ending,valid};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.DormGame=api;
})(typeof globalThis!=='undefined'?globalThis:this);
