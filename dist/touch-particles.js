(function(){
'use strict';
if(typeof document==='undefined'||!document.addEventListener||!document.createElement)return;
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const active=[],points=new Map(),limit=8;
const css=document.createElement('style');css.textContent='.touch-burst{position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none!important;user-select:none}.touch-burst i{display:block;position:absolute;left:0;top:0;pointer-events:none!important;border-radius:50%;background:#ffe7a0;box-shadow:0 0 8px #eab440cc;will-change:transform,opacity}.touch-burst .touch-ring{width:24px;height:24px;margin:-12px;border:2px solid #e5aa32e6;background:transparent;box-shadow:0 0 12px #f0bd4680,inset 0 0 6px #ffefb566}.touch-burst .touch-ring-echo{border-color:#fff2bd;box-shadow:0 0 7px #c68d25b3}.touch-burst .touch-core{width:16px;height:16px;margin:-8px;background:#fff5ca;clip-path:polygon(50% 0,61% 36%,100% 50%,61% 64%,50% 100%,39% 64%,0 50%,39% 36%);filter:drop-shadow(0 0 4px #d29420);border-radius:0}.touch-burst .touch-spark{width:4px;height:12px;margin:-6px -2px;background:linear-gradient(#fffce7 15%,#f3cc62 55%,#bd7b19);box-shadow:0 0 7px #e5b238b3;border-radius:3px}@media(prefers-reduced-motion:reduce){.touch-burst{display:none!important}}';document.head.append(css);
function remove(burst){burst.remove();const index=active.indexOf(burst);if(index>=0)active.splice(index,1);}
function burstAt(x,y,target){
 if(reduced()||!Number.isFinite(x)||!Number.isFinite(y))return;
 const burst=document.createElement('span');burst.className='touch-burst';burst.setAttribute('aria-hidden','true');burst.style.left=x+'px';burst.style.top=y+'px';
 const host=target?.closest?.('dialog[open]')||document.body;host.append(burst);active.push(burst);if(active.length>limit)remove(active[0]);
 const animate=(element,frames,options)=>{if(element.animate)element.animate(frames,{fill:'forwards',...options});};
 for(let i=0;i<2;i++){
  const ring=document.createElement('i');ring.className='touch-ring'+(i?' touch-ring-echo':'');burst.append(ring);
  animate(ring,[{transform:'scale(.3)',opacity:0},{transform:'scale(.65)',opacity:i?.85:1,offset:.12},{transform:'scale('+(i?2.8:3.6)+')',opacity:0}],{duration:520,delay:i*55,easing:'ease-out'});
 }
 const core=document.createElement('i');core.className='touch-core';burst.append(core);
 animate(core,[{transform:'scale(.35) rotate(0deg)',opacity:1},{transform:'scale(1.35) rotate(30deg)',opacity:0}],{duration:240,easing:'ease-out'});
 for(let i=0;i<12;i++){
  const spark=document.createElement('i');spark.className='touch-spark';burst.append(spark);const angle=i*Math.PI*2/12+.18,turn=angle+Math.PI/2,distance=38+(i%4)*8,dx=Math.cos(angle)*distance,dy=Math.sin(angle)*distance;
  animate(spark,[{transform:'translate(0,0) rotate('+turn+'rad) scale(.8)',opacity:1},{transform:'translate('+dx*.65+'px,'+dy*.65+'px) rotate('+turn+'rad) scale(1)',opacity:1,offset:.35},{transform:'translate('+dx+'px,'+dy+'px) rotate('+turn+'rad) scale(.15)',opacity:0}],{duration:440+(i%4)*40,easing:'cubic-bezier(.12,.65,.3,1)'});
 }
 setTimeout(()=>remove(burst),650);
}
function ignored(target){return!!target?.closest?.('input,textarea,select,[contenteditable="true"],[disabled],[aria-disabled="true"],[inert],[data-touch-particles="off"]');}
document.addEventListener('pointerdown',e=>{if(e.button>0||ignored(e.target)||reduced())return;points.set(e.pointerId,{x:e.clientX,y:e.clientY,target:e.target,dragged:false});},{passive:true,capture:true});
document.addEventListener('pointermove',e=>{const p=points.get(e.pointerId);if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>10)p.dragged=true;},{passive:true,capture:true});
document.addEventListener('pointercancel',e=>points.delete(e.pointerId),{passive:true,capture:true});
document.addEventListener('pointerup',e=>{const p=points.get(e.pointerId);points.delete(e.pointerId);if(!p||p.dragged||ignored(e.target)||Math.hypot(e.clientX-p.x,e.clientY-p.y)>10)return;const selection=window.getSelection?.();if(selection&&!selection.isCollapsed)return;burstAt(e.clientX,e.clientY,e.target);},{passive:true,capture:true});
window.addEventListener('pagehide',()=>{points.clear();active.slice().forEach(remove);});
})();
