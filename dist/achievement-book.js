(function(root){
'use strict';
// A derived collection layer. It never changes the released engine or a save.
const browser=typeof module==='undefined'||!module.exports;
const G=browser?root.DormGame:require('./wallet.js');
const byId=new Map(G.endings.map(item=>[item.id,item]));
const num=value=>Number.isFinite(value)?value:0;
const days=rows=>new Set(rows.map(row=>row.day)).size;
const flag=(rows,key)=>rows.filter(row=>num(row.flags?.[key])>0);
const dayEnd=s=>s.phase==='dayEnd'||s.phase==='ending'&&!s.failed&&!s.lottery?.won;
const ready=s=>!!s&&!s.failed&&['outcome','dayEnd','ending'].includes(s.phase)&&!!s.stats&&Array.isArray(s.log);

function metrics(s){
 const log=(s.log||[]).filter(row=>row&&Number.isInteger(row.day)&&row.day>0&&row.day<=s.day);
 const today=log.filter(row=>row.day===s.day),v=s.stats||{};
 const sport=flag(log,'sport'),library=flag(log,'library'),maker=flag(log,'maker'),kindness=flag(log,'kindness'),art=flag(log,'art');
 // A journal reward can share the wage entry. Only earned wages count here.
 const wage=row=>Math.max(0,num(row.changes?.money)-num(row.journalRewardReceived));
 const jobs=flag(log,'job').filter(row=>wage(row)>0);
 const lab=log.filter(row=>row.campusActivity==='lab-work');
 const visits=log.filter(row=>row.campusActivity&&G.campusDefinitions?.[row.campusActivity]);
 const places=[...new Set(visits.map(row=>G.campusDefinitions[row.campusActivity][0]))];
 const mini=(key,score)=>log.filter(row=>row.miniGame===key&&row.miniScore===score);
 const works=(s.majorLife?.works||[]).filter(work=>work&&!work.skipped&&Number.isInteger(work.chapter)&&work.chapter>=0&&work.chapter<3&&work.majorId===s.school?.majorId);
 const uniqueWorks=[...new Map(works.map(work=>[work.chapter,work])).values()];
 const healthStart=num(v.health)-today.reduce((total,row)=>total+num(row.changes?.health),0);
 return{s,log,today,v,sport,library,maker,kindness,art,jobs,lab,visits,places,mini,works:uniqueWorks,
  wages:jobs.reduce((total,row)=>total+wage(row),0),healthStart,
  recoveryGain:today.reduce((total,row)=>total+num(row.changes?.health),0),
  completed:dayEnd(s)?s.day:Math.max(0,s.day-1)};
}
const stat=(m,keys)=>keys.map(key=>(G.labels?.[key]||({health:'健康',mood:'心情'}[key])||key)+' '+num(m.v[key])).join(' · ');
const history=(rows,label)=>label+' '+rows.length+' 次，分布在 '+days(rows)+' 天';
const entry=rows=>rows.at(-1);
const definitions=[];
function add(id,category,rule,test,facts,relevant,extra={}){
 const base=byId.get(id)||{id};
 definitions.push({id,category,rule,test,facts,relevant,item:Object.freeze({...base,category,difficulty:'hard',...extra,hint:rule,rule})});
}

add('degree','学业','完整度过14天，日终学业达到85。',m=>dayEnd(m.s)&&m.completed>=14&&m.v.study>=85,
 m=>['已完整度过 '+m.completed+' 天',stat(m,['study'])],m=>m.today);
add('honor','学业','完整度过30天，日终学业达到90。',m=>dayEnd(m.s)&&m.completed>=30&&m.v.study>=90,
 m=>['已完整度过 '+m.completed+' 天',stat(m,['study'])],m=>m.today);
add('course-streak','学业','连续3周按时交课设，且本局没有缺交。',m=>num(m.s.term?.bestStreak)>=3&&num(m.s.term?.missed)===0,
 m=>['最长连续按时提交 '+num(m.s.term?.bestStreak)+' 周','本局缺交 '+num(m.s.term?.missed)+' 次'],m=>m.log.filter(row=>row.eventId==='term-deadline'));
add('hard-balanced-fortnight','挑战','完整度过14天；日终电量90、学业95、饭钱40，人缘、健康、心情均达到70。',
 m=>dayEnd(m.s)&&m.completed>=14&&m.v.energy>=90&&m.v.study>=95&&m.v.money>=40&&m.v.social>=70&&m.v.health>=70&&m.v.mood>=70,
 m=>['已完整度过 '+m.completed+' 天',stat(m,['energy','study','money']),stat(m,['social','health','mood'])],m=>m.today);
add('hard-library-maker','挑战','完整度过21天；自习与创作实践各6次，且各分布在至少3天，日终学业达到90。',
 m=>dayEnd(m.s)&&m.completed>=21&&m.library.length>=6&&days(m.library)>=3&&m.maker.length>=6&&days(m.maker)>=3&&m.v.study>=90,
 m=>['已完整度过 '+m.completed+' 天',history(m.library,'自习记录'),history(m.maker,'创作实践'),stat(m,['study'])],m=>m.log.filter(row=>row.flags?.library||row.flags?.maker));
add('hard-perfect-month','挑战','完整度过30天；日终电量、学业达到95，饭钱80，人缘、健康、心情均达到80。',
 m=>dayEnd(m.s)&&m.completed>=30&&m.v.energy>=95&&m.v.study>=95&&m.v.money>=80&&m.v.social>=80&&m.v.health>=80&&m.v.mood>=80,
 m=>['已完整度过 '+m.completed+' 天',stat(m,['energy','study','money']),stat(m,['social','health','mood'])],m=>m.today);

add('worker','校园','完成8次有报酬的兼职，分布在至少4天，实际工钱累计达到120元。',
 m=>m.jobs.length>=8&&days(m.jobs)>=4&&m.wages>=120,
 m=>[history(m.jobs,'有报酬兼职'),'实际工钱累计 ¥'+m.wages],m=>m.jobs);
add('library','校园','完成8次自习或阅读，分布在至少4天，学业达到85。',
 m=>m.library.length>=8&&days(m.library)>=4&&m.v.study>=85,
 m=>[history(m.library,'自习与阅读'),stat(m,['study'])],m=>m.library);
add('athlete','校园','完成8次运动，分布在至少5天，健康达到75。',
 m=>m.sport.length>=8&&days(m.sport)>=5&&m.v.health>=75,
 m=>[history(m.sport,'运动'),stat(m,['health'])],m=>m.sport);
add('inventor','校园','完成6次创作实践，分布在至少3天，学业达到80。',
 m=>m.maker.length>=6&&days(m.maker)>=3&&m.v.study>=80,
 m=>[history(m.maker,'创作实践'),stat(m,['study'])],m=>m.maker);
add('helper','校园','完成8次帮助他人的行动，分布在至少4天，人缘达到75。',
 m=>m.kindness.length>=8&&days(m.kindness)>=4&&m.v.social>=75,
 m=>[history(m.kindness,'帮助他人'),stat(m,['social'])],m=>m.kindness);
add('artist','校园','完成8次文艺或创作活动，分布在至少4天，心情达到65。',
 m=>m.art.length>=8&&days(m.art)>=4&&m.v.mood>=65,
 m=>[history(m.art,'文艺与创作活动'),stat(m,['mood'])],m=>m.art);

add('love-ending','故事','与奶粉确认恋爱关系，亲密度达到90，并认真兑现3次约定。',
 m=>!!m.s.romance?.dating&&num(m.s.romance.intimacy)>=90&&num(m.s.relationships?.kept)>=3,
 m=>[m.s.romance?.dating?'已与奶粉确认恋爱关系':'尚未确认恋爱关系','亲密度 '+num(m.s.romance?.intimacy),'认真兑现约定 '+num(m.s.relationships?.kept)+' 次'],
 m=>m.log.filter(row=>row.eventId==='love-bond-keep'||row.eventId==='love-confession'||row.eventId==='love-naifen-confession'));
add('recovery','故事','从当日健康35及以下，恢复到健康70、心情55，并平安完成这一天。',
 m=>dayEnd(m.s)&&m.today.length>0&&m.healthStart>=0&&m.healthStart<=35&&m.v.health>=70&&m.v.mood>=55,
 m=>['当日开始时健康 '+m.healthStart,'当日健康净恢复 '+m.recoveryGain,stat(m,['health','mood'])],m=>m.today.filter(row=>num(row.changes?.health)>0));
add('lab-newcomer','探索','进组后完成12次实验室活动，分布在至少6天。',
 m=>!!m.s.campusLife?.joined&&m.lab.length>=12&&days(m.lab)>=6,
 m=>[m.s.campusLife?.joined?'已加入课题组':'尚未加入课题组',history(m.lab,'实验室活动')],m=>m.lab);
add('campus-wanderer','探索','主动探索10个校园地点，探索记录分布在至少5天。',
 m=>m.places.length>=10&&days(m.visits)>=5,
 m=>['主动到访 '+m.places.length+' 个不同地点','探索记录分布在 '+days(m.visits)+' 天'],m=>m.visits);
for(const [id,name] of [['creative','创作社'],['sport','运动社']]){
 add('journey-'+id,'故事','完成'+name+'的3章故事，每章都实际参与，选择旁观不计入。',
  m=>m.s.journeys?.backgroundId===id&&!!m.s.journeys.earned&&m.s.journeys.stage===3&&m.s.journeys.decisions.length===3&&m.s.journeys.decisions.every(value=>value<2)&&m.log.filter(row=>row.origin==='journey'&&row.eventId.startsWith('journey-'+id+'-')).length===3,
  m=>m.s.journeys?.backgroundId===id?['已完成'+name+' '+num(m.s.journeys.stage)+' / 3 章','选择实际参与 '+(m.s.journeys.decisions||[]).filter(value=>value<2).length+' 章']:['本局未选择'+name+'故事'],m=>m.log.filter(row=>row.origin==='journey'&&row.eventId.startsWith('journey-'+id+'-')));
}

for(const [id,key,score,label] of [['mini-basket-perfect','mini-basket',3,'三投全中'],['mini-badminton-perfect','mini-badminton',6,'六球全接'],['mini-early','mini-runner',1,'早八准时到达']]){
 add(id,'手感','在3个不同的游戏日完成'+label+'。',
  m=>days(m.mini(key,score))>=3,
  m=>[label+' '+m.mini(key,score).length+' 次','完成日：'+[...new Set(m.mini(key,score).map(row=>row.day))].map(day=>'第'+day+'天').join('、')],m=>m.mini(key,score));
}
add('mini-friends','收藏','抓娃娃收集齐奶蛙、奶粉、奶鼠，每种至少2只。',
 m=>['frog','pink','mouse'].every(key=>num(m.s.miniGames?.prizes?.[key])>=2),
 m=>['奶蛙 '+num(m.s.miniGames?.prizes?.frog)+' 只 · 奶粉 '+num(m.s.miniGames?.prizes?.pink)+' 只 · 奶鼠 '+num(m.s.miniGames?.prizes?.mouse)+' 只'],
 m=>m.log.filter(row=>row.miniGame==='mini-claw'),{hidden:true});
add('lottery-winner','奇遇','亲手刮出100万元大奖。',
 m=>!!m.s.lottery?.won&&m.log.some(row=>row.lotteryPrize===1000000),
 m=>m.log.some(row=>row.lotteryPrize===1000000)?['本局彩票记录：奖金 ¥1,000,000']:['本局尚未刮出100万元大奖'],m=>m.log.filter(row=>row.lotteryPrize===1000000),{hidden:true});
add('major-master','学业','完成本专业3章实践，每章均亲自交付，累计获得至少8分（满分9分）。',
 m=>m.works.length===3&&m.works.reduce((total,work)=>total+num(work.score),0)>=8,
 m=>['亲自交付 '+m.works.length+' / 3 章','实践评分 '+m.works.reduce((total,work)=>total+num(work.score),0)+' / 9',...m.works.map(work=>'第'+(work.chapter+1)+'章：'+work.title+' · '+num(work.score)+' / 3')],
 m=>m.log.filter(row=>row.majorWork&&!row.majorWork.skipped),{name:'专业拿手好戏',icon:'🎓',quote:'三份作品，拿得出手。'});

const legacy={
 chaos:'当日整活至少4次，结算时心情达到55。',
 poor:'结算时饭钱不超过3元。',
 tired:'结算时电量不超过10。',
 skip:'当日逃课至少2次，结算时学业不超过65。',
 hero:'当日救场至少2次，结算时学业达到65、人缘达到35。',
 popular:'结算时人缘达到90。',
 scholar:'结算时学业达到92。',
 rich:'结算时饭钱达到70元。',
 lucky:'触发好运事件，或携带好运天赋并在开局获得增益；结算时电量达到35、学业达到45。',
 battery:'结算时电量达到85，且学业低于60。',
 balanced:'结算时电量55、饭钱15、人缘65、学业65、健康65、心情60。',
 ordinary:'平安结束一天，且没有匹配到其他当日称号。',
 cat:'累计与校猫互动至少2次，当日也有互动；结算时心情达到45、健康达到35。',
 viral:'累计传播事件至少2次，当日也有传播；结算时人缘、心情均达到55。',
 artist:'累计文艺或创作活动至少3次，当日也有参与；结算时心情达到60。',
 week:'完整度过7天。',
 'fail-energy':'电量归零，本局结束。',
 'fail-study':'学业归零，本局结束。',
 athlete:'累计运动至少3次，当日也有运动；结算时电量达到50、健康达到65。',
 trader:'累计闲置交易至少3次，当日也有参与；结算时饭钱达到30元。',
 worker:'累计兼职标记至少3次，当日也有参与；结算时饭钱达到20元、电量达到30。',
 informant:'累计核验信息至少3次，当日也有参与；结算时学业达到65。',
 gardener:'累计植物照顾至少3次，当日也有参与；结算时健康达到60、心情达到55。',
 inventor:'累计创作实践至少3次，当日也有参与；结算时学业达到70、电量达到35。',
 'meal-pal':'累计饭搭子互动至少3次，当日也有参与；结算时人缘、心情均达到55。',
 helper:'累计帮助标记至少5个，当日也有帮助行动；结算时人缘达到65、健康达到40。',
 library:'累计自习或阅读至少3次，当日也有参与；结算时学业达到75、心情达到35。',
 freshman:'完整度过3天。',
 degree:'完整度过至少14天，某日结算时学业达到80。',
 honor:'完整度过至少30天，某日结算时学业达到80。',
 'hidden-cat-advisor':'完整度过至少7天，累计与校猫互动至少6次。',
 'hidden-broke-chaos':'平安完成当日；饭钱为0、电量和学业均达到50，当日整活至少2次。',
 'hidden-early-miracle':'当日参加早八、没有逃课，平安结算时学业达到90。',
 'hard-balanced-fortnight':'完整度过至少14天，日终电量90、学业95、饭钱40。',
 'hard-library-maker':'完整度过至少21天；累计自习与创作实践各3次，日终学业90。',
 'hard-perfect-month':'完整度过至少30天，日终电量95、学业95、饭钱80。',
 'fail-health':'健康或心情归零，或未及时处理严重疾病、奶鼠咬伤，本局结束。',
 'course-pass':'成功提交至少1次课设，包括补交。',
 'course-clutch':'课设差进度时，选择通宵补交或请室友救火并提交成功。',
 'course-streak':'连续3周按时提交课设。',
 'fail-course':'课设累计缺交2次，本局结束。',
 'love-ending':'与奶粉表白成功，确认恋爱关系。',
 'steady-life':'平安完成当日；健康85、心情75、电量50、学业55。',
 'quiet-break':'平安完成当日；心情不超过25，健康和电量仍大于0。',
 recovery:'当日开始时健康不超过35，日终恢复到健康65、心情45。',
 'lottery-winner':'购买彩票刮出100万元大奖。',
 'fail-mouse-family':'在奶鼠已经躲开后仍追着逗它，触发了隐藏结局。',
 'journey-freshman':'完成普通新生的3章故事，其中至少2章选择参与。',
 'journey-creative':'完成创作社的3章故事，其中至少2章选择参与。',
 'journey-sport':'完成运动社的3章故事，其中至少2章选择参与。',
 'campus-explorer':'在一局中各完成至少1次自习、运动和兴趣活动。',
 'lab-newcomer':'进组后累计完成6次实验室活动。',
 'campus-wanderer':'主动到访7个校园地点。',
 'mini-basket-perfect':'一轮投篮3球全中。',
 'mini-badminton-perfect':'一轮羽毛球6球全接。',
 'mini-early':'早八赶路成功1次。',
 'mini-friends':'抓娃娃收集到奶蛙、奶粉、奶鼠各至少1只。'
};
const rules=new Map(definitions.map(definition=>[definition.id,definition]));
const items=Object.freeze(definitions.map(definition=>definition.item));
function unlocked(s){if(!ready(s))return[];const m=metrics(s);return definitions.filter(definition=>definition.test(m)).map(definition=>definition.item);}
function legacyRule(id){return legacy[id]||rules.get(id)?.rule||'该条目未保存旧版触发条件。';}
function describe(id,s){
 const definition=rules.get(id),rule=definition?.rule||legacyRule(id);
 if(!s||!definition||!s.stats||!Array.isArray(s.log))return{rule,facts:[],eligible:false};
 const m=metrics(s),last=entry(definition.relevant(m)||[]);
 return{rule,facts:definition.facts(m),eligible:ready(s)&&definition.test(m),day:s.day,
  ...(last?{entry:{day:last.day,time:last.time||'',title:last.title||'',choice:last.choice||''}}:{})};
}
const api=Object.freeze({items,unlocked,describe,legacyRule});
root.DormAchievementBook=api;if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
