(function(root){
'use strict';
const browser=typeof module==='undefined'||!module.exports,G=browser?root.DormGame:require('./mini-games.js');
// A presentation model over the released engine: browsing never changes a save.
const places=[
 {id:'dorm',name:'宿舍',description:'回寝歇一会儿，也给朋友回条消息。'},
 {id:'classroom',name:'教学楼',description:'钟楼边的课间，先看看这周还要交什么。'},
 {id:'canteen',name:'食堂',description:'热饭、汤面，偶尔也认真犒劳自己。'},
 {id:'library',name:'图书馆',description:'找个座位，把想做的事往前推一点。'},
 {id:'sports',name:'运动场',description:'去动一动，按自己的节奏练习。'},
 {id:'clinic',name:'校医院',description:'身体不舒服时，及时来这里就诊。'},
 {id:'club',name:'活动室',description:'做点喜欢的事，也可以约人一起。'},
 {id:'gate',name:'东吴老校门',description:'从老校门出发，看看校园小岗位。'},
 {id:'lab',name:'实验室',description:'先申请进组，再从文献、复现和组会开始。'},
 {id:'wenxing',name:'文星阁',description:'文星路旁的安静角落，适合带本书坐一会儿。'},
 {id:'redbuilding',name:'红楼',description:'听一场开放讲座，接触一个新的方向。'},
 {id:'tower',name:'钟楼草坪',description:'给钟楼和草坪拍张照，留下校园记忆。'},
 {id:'museum',name:'博物馆',description:'读读展签，看看校园旧物背后的故事。'},
 {id:'riverside',name:'外城河畔',description:'沿着校园东侧的河道，走一小段。'},
 {id:'garden',name:'校园小花园',description:'歇一会儿，也可以和奶粉聊聊彼此的喜好。'},
 {id:'basketball',name:'篮球场',description:'练投篮，或者和同学打一场半场。'},
 {id:'badminton',name:'羽毛球馆',description:'练练步伐和高远球，也可以约人来一局。'}
];
function activityPlace(s,key){if(G.campusDefinitions?.[key])return G.campusDefinitions[key][0];if(key==='bond-keep'){const plan=s.relationships?.promise?.key;return plan==='dessert'?'canteen':plan==='quiet'?'library':plan==='sport'?'sports':plan==='art'?'club':'dorm';}if(['clinic','vaccine','psych'].includes(key))return'clinic';if(['gym','ask-gym'].includes(key))return'sports';if(['study','ask-study'].includes(key))return'library';if(['hobby','ask-hobby'].includes(key))return'club';if(key==='job')return'gate';if(key==='ask-walk')return'sports';return'dorm';}
function currentPlace(s,scene=G.getScene(s)){if(!scene)return'dorm';if(s.phase==='outcome'&&s.outcome?.miniGame)return activityPlace(s,s.outcome.miniGame);if(s.campusLife?.pending)return activityPlace(s,s.campusLife.pending.key);const text=scene.place||'';if(scene.kind==='三餐'||/食堂|甜品|取餐|餐厅/.test(text))return'canteen';if(scene.kind==='就诊安排'||/医院|医务|门诊|接种/.test(text))return'clinic';if(/图书馆|书架|自习室|阅览/.test(text))return'library';if(/操场|健身|体育|球场|运动/.test(text))return'sports';if(/社团|活动室|兴趣|展览|画室/.test(text))return'club';if(/校门|兼职|小岗位|资料室|小卖部/.test(text))return'gate';if(/宿舍|床|寝室|聊天窗口/.test(text))return'dorm';if(s.relationships?.pending)return activityPlace(s,s.relationships.pending.key);const activity=s.rhythm?.pending||s.rhythm?.lastActivity;if(activity)return activityPlace(s,activity.key);return'classroom';}
function model(s){
 const scene=G.getScene(s),canAct=s.phase==='outcome'&&!s.failed&&!s.lottery?.won,list=canAct?G.availableActivities(s):[],currentId=currentPlace(s,scene),minutes=Number.isFinite(s.rhythm?.clock)?s.rhythm.clock:Number(scene?.time?.slice(0,2)||7)*60+Number(scene?.time?.slice(3)||0),time=String(Math.floor(minutes/60)%24).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'),period=minutes<660?'上午':minutes<840?'午间':minutes<1080?'下午':minutes<1200?'傍晚':'夜晚',task=G.task?.(s);
 const result=places.map(p=>{const actions=list.filter(a=>activityPlace(s,a.id)===p.id).map(a=>({...a}));let note=actions.length?'可以安排：'+actions.map(a=>a.label).join('、'):canAct?'这一站暂时没有待办。':'先处理眼前这件事，再安排下一站。';if(p.id==='classroom'&&task)note='本周课设 '+task.progress+' / '+task.target+' · 剩 '+task.daysLeft+' 天';if(p.id==='canteen')note=scene?.kind==='三餐'?(s.phase==='choice'?'窗口开餐了，看看今天吃什么。':'这一餐已经吃好了，下一餐再来。'):actions.length?note:'三餐时间到了，窗口会准备好当天菜单。';if(p.id==='clinic'&&!actions.length)note=s.illness?.active||s.evolution?.bite?'可以在空闲时就诊，或在今日结算预约。':'今天没有待处理的就诊安排。';const locked=(p.id==='club'&&!G.clubUnlocked(s))||(p.id==='lab'&&!s.campusLife?.joined);if(locked)note=p.id==='lab'?'学业达到 75 后可以申请加入课题组。':'先在图书馆完成一次自习，认识带你去活动室的同学。';if(p.id==='lab'&&s.campusLife?.joined)note='已进组 · 实验室记录 '+s.campusLife.visits+' 次';return{...p,note,locked,actions,available:actions.length>0||(p.id===currentId&&s.phase==='choice')};});
 return{goals:G.campusGoals?.(s)||G.exploration?.(s)||[],goalTitle:G.journalStatus?.(s)?.title,goalNote:G.journalStatus?.(s)?.note,time,period,currentId,freeMinutes:canAct?Math.max(0,G.freeMinutes(s)):0,places:result,canAct};
}
function startActivity(s,placeId,key){const place=model(s).places.find(p=>p.id===placeId);if(!place?.actions.some(a=>a.id===key))throw Error('这一站暂时不能安排这件事');return G.startActivity(s,key);}
const api={places,activityPlace,currentPlace,model,startActivity};root.DormWorld=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
