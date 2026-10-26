(function(root){
'use strict';
const expressions={
 original:{file:'frog.png',alt:'今日份奶蛙',caption:'日子继续。',original:true},
 'original-wave':{file:'frog-wave.png',alt:'原来的挥手奶蛙',caption:'奶蛙还在。',original:true},
 blue:{file:'meme-blue.png',alt:'切换忧郁模式的奶蛙',caption:'先缓一缓。'},
 laugh:{file:'meme-laugh.png',alt:'仰头大笑的奶蛙',caption:'这下舒服了。'},
 shy:{file:'meme-shy.png',alt:'有点害羞又开心的奶蛙',caption:'有点不好意思。'},
 think:{file:'meme-think.png',alt:'托腮思考的奶蛙',caption:'让我想想。'},
 speechless:{file:'meme-speechless.png',alt:'一时无语的奶蛙',caption:'一时无言。'},
 angry:{file:'meme-angry.png',alt:'抱着手生闷气的奶蛙',caption:'奶蛙有点火大。'},
 serious:{file:'meme-serious.png',alt:'一脸严肃的奶蛙',caption:'认真模式。'},
 surprised:{file:'meme-surprised.png',alt:'惊讶回头的奶蛙',caption:'啊？'},
 wave:{file:'meme-wave.png',alt:'抬手打招呼的奶蛙',caption:'收到，安排。'}
};
const get=id=>({id,...expressions[id]});
function scene(s,event){
 const o=s.phase==='outcome'?s.outcome:null;
 if(o){
  const c=o.changes||{},romantic=event.id.startsWith('love-');
  if(o.contactDeleted||(event.id==='love-encounter'&&o.index===0&&!o.contactAdded)||(romantic&&o.intimacyChange<=-12))return get('blue');
  if(s.failed)return get(s.failed==='fail-health'?'blue':'speechless');
  if(s.illness?.active&&(c.health||0)<0)return get('blue');
  if(event.id==='evo-breakup')return get('blue');
  if(o.contactAdded||(romantic&&s.romance?.dating&&o.intimacyChange>0))return get('shy');
  if((c.mood||0)<=-5)return get('angry');
  if((c.study||0)<=-8||((c.health||0)<0&&(c.mood||0)<0))return get('speechless');
  if((c.money||0)>=12||o.flags?.chaos||o.flags?.rest||o.flags?.sleep||o.flags?.nap)return get('laugh');
  if((c.study||0)>=10||(o.project||0)>=8)return get('serious');
  if(romantic&&(o.intimacyChange||0)>0)return get('shy');
  if((c.social||0)>=4||o.flags?.kindness||o.flags?.helped)return get('wave');
  if((c.energy||0)>=8||(c.mood||0)>=4)return get('laugh');
  return get('original-wave');
 }
 if(event.id==='love-encounter'||event.id==='love-confession')return get('shy');
 if(event.id==='term-deadline')return get('serious');
 if(event.id==='clinic-visit')return get('think');
 if(event.id.startsWith('term-')||/突然|蓝屏|坏了|没电|停电/.test(event.title))return get('surprised');
 if(event.kind==='三餐')return get(s.day%2?'original':'original-wave');
 const flags=event.choices?.map(c=>c.flags||{})||[];
 if(flags.some(f=>f.chaos))return get('laugh');
 if(flags.some(f=>f.library||f.maker))return get('think');
 if(flags.some(f=>f.kindness||f.helped||f.mealFriend))return get('wave');
 let h=0;for(const ch of event.id)h=(h*31+ch.charCodeAt(0))>>>0;
 return get(['original','think','original-wave','original','serious','original-wave'][h%6]);
}
const endingMap={
 'lottery-winner':'laugh',chaos:'laugh',poor:'blue',tired:'speechless',skip:'surprised',hero:'serious',popular:'original-wave',scholar:'serious',rich:'laugh',lucky:'surprised',battery:'laugh',balanced:'original',ordinary:'original',cat:'shy',viral:'laugh',artist:'shy',week:'original-wave',
 'fail-energy':'speechless','fail-study':'speechless','fail-health':'blue','fail-mood':'blue','fail-course':'serious','fail-mouse-family':'surprised',
 athlete:'shy',trader:'think',worker:'serious',informant:'think',gardener:'shy',inventor:'think','meal-pal':'original-wave',helper:'wave',library:'think',freshman:'original-wave',degree:'serious',honor:'laugh',
 'hidden-cat-advisor':'shy','hidden-broke-chaos':'laugh','hidden-early-miracle':'surprised','hard-balanced-fortnight':'laugh','hard-library-maker':'think','hard-perfect-month':'laugh',
 'course-pass':'laugh','course-clutch':'speechless','course-streak':'serious','love-ending':'shy','steady-life':'laugh','quiet-break':'speechless',recovery:'shy'
};
function ending(e){return get(endingMap[e.id]||'wave');}
const api={all:expressions,scene,ending};root.DormExpressions=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
