const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function boot(reduced=false){
 const events={},timers=[],animations=[],body={children:[],append(node){this.children.push(node);}},dialog={...body,children:[]};
 function element(){return{children:[],style:{},setAttribute(){},append(node){this.children.push(node);},remove(){this.removed=true;},animate(frames,options){animations.push({frames,options});}};}
 const window={matchMedia:()=>({matches:reduced}),getSelection:()=>({isCollapsed:true}),addEventListener:(name,fn)=>events[name]=fn};
 const context={window,document:{createElement:element,head:{append(){}},body,addEventListener:(name,fn)=>events[name]=fn},setTimeout:fn=>timers.push(fn),Math};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/touch-particles.js'),'utf8'),context);
 function tap(target={},dx=0,id=1){const e={pointerId:id,button:0,clientX:40,clientY:50,target};events.pointerdown(e);events.pointerup({...e,clientX:40+dx});}
 return{events,timers,animations,body,dialog,tap};
}
const ui=boot();ui.tap();assert.equal(ui.body.children.length,1);assert.equal(ui.body.children[0].children.length,15);assert.equal(ui.animations.length,15);ui.timers.forEach(fn=>fn());assert(ui.body.children[0].removed);
const drag=boot();drag.tap({},25);assert.equal(drag.body.children.length,0,'Dragging must not emit particles');
const roundTrip=boot(),point={pointerId:7,button:0,clientX:40,clientY:50,target:{}};roundTrip.events.pointerdown(point);roundTrip.events.pointermove({...point,clientX:70});roundTrip.events.pointerup(point);assert.equal(roundTrip.body.children.length,0,'A drag that returns to its origin is still a drag');
const edit=boot();edit.tap({closest:selector=>selector.includes('input')?{}:null});assert.equal(edit.body.children.length,0,'Input fields stay quiet');
const modal=boot();modal.tap({closest:selector=>selector==='dialog[open]'?modal.dialog:null});assert.equal(modal.dialog.children.length,1,'Effects belong in the active dialog top layer');assert.equal(modal.body.children.length,0);
const limit=boot();for(let i=0;i<30;i++)limit.tap({},0,i);assert.equal(limit.body.children.filter(n=>!n.removed).length,8,'Rapid touches have a bounded particle budget');limit.events.pagehide();assert(limit.body.children.every(n=>n.removed));
assert.equal(boot(true).body.children.length,0);const quiet=boot(true);quiet.tap();assert.equal(quiet.body.children.length,0,'Reduced motion disables particles');
console.log('Touch particles passed: mouse/touch flow, passive drag-safe handling, modal layer, node limit, cleanup, and reduced motion.');
