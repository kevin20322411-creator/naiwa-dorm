const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let listener,dialog,results=[],done=[],cancelled=0;
class Element{constructor(tag){this.tag=tag;this.children=[];this.contentWindow={};this.hidden=false;}append(...items){this.children.push(...items);}remove(){this.removed=true;}showModal(){this.open=true;}}
const context={window:{addEventListener:(type,fn)=>listener=fn,DormMiniDocument:'<head></head>',DormAssets:{'frog.png':'data:image/png;base64,testfrog','simplicity.mp3':'data:audio/mpeg;base64,music'}},location:{origin:'https://example.test'},URLSearchParams,document:{createElement:tag=>new Element(tag),body:{append:el=>dialog=el}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/mini-ui.js'),'utf8'),context);
const UI=context.window.DormMiniUI,options={key:'mini-runner',token:'one',title:'Test',onResult:n=>results.push(n),onDone:n=>done.push(n),onCancel:()=>cancelled++};
UI.open(options);const frame=dialog.children[1];assert(frame.srcdoc.includes(';</script>'));assert(frame.srcdoc.includes('data:image/png;base64,testfrog'));assert(!frame.srcdoc.includes('data:audio'),'The child receives sprites, never the soundtrack');
const message=(type,score,extra={})=>listener({source:frame.contentWindow,origin:'https://example.test',data:{type,key:options.key,token:options.token,score},...extra});
message('naiwa-mini-ready',0,{source:{}});message('naiwa-mini-ready',0,{origin:'https://wrong.test'});assert.equal(results.length,0);
message('naiwa-mini-ready',0);message('naiwa-mini-ready',1);assert.deepEqual(results,[0]);assert(dialog.children[2].children[1].hidden);assert.equal(dialog.children[0].children[1].textContent,'返回校园');dialog.children[0].children[1].onclick();assert.deepEqual(done,[0]);assert.equal(cancelled,0);
UI.open({...options,token:'two'});dialog.children[0].children[1].onclick();assert.equal(cancelled,1);
UI.open({...options,token:'three'});dialog.children[2].children[1].onclick();assert.deepEqual(done,[0,-1]);
UI.open(options);
message('naiwa-mini-ready',1,{source:dialog.children[1].contentWindow,origin:'null'});
assert.deepEqual(results,[0],'Hosted pages reject opaque origins');
UI.close();

context.location={origin:'file://',protocol:'file:'};
const local={...options,key:'mini-squish',token:'local'};
UI.open(local);
const frameLocal=dialog.children[1];
const config=JSON.parse(frameLocal.srcdoc.match(/EmbeddedMiniConfig=(.+?);<\/script>/)[1]);
assert.equal(config.targetOrigin,'*');
const payload={type:'naiwa-mini-result',key:local.key,token:local.token,score:0};
listener({source:{},origin:'null',data:payload});
listener({source:frameLocal.contentWindow,origin:'null',data:{...payload,token:'old'}});
listener({source:frameLocal.contentWindow,origin:'https://wrong.test',data:payload});
assert.deepEqual(done,[0,-1],'The offline receiver still checks frame, origin and token');
const sent=[],arcade=new Element('div');
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/mini/bridge.js'),'utf8'),{
 location:{search:'',origin:'file://',protocol:'file:'},URLSearchParams,
 window:{EmbeddedMiniConfig:config,PreviewNavigate(){},PreviewSelectMini(){},addEventListener(){}},
 parent:{postMessage(data,target){sent.push(target);listener({source:frameLocal.contentWindow,origin:'null',data});}},
 document:{createElement:tag=>new Element(tag),head:new Element('head'),querySelector(selector){return selector.startsWith('#arcade-view')?arcade:null;}}
});
arcade.children.find(element=>element.className==='mini-finish').onclick();
assert.deepEqual(sent,['*']);
assert.deepEqual(done,[0,-1,0],'The exported mini can settle and close from a file URL');
console.log('Mini UI passed: result locking, hosted origin/source checks, offline result settlement, free early cancel, valid srcdoc.');
