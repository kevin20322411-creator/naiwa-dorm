const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let listener,dialog,results=[],done=[],cancelled=0;
class Element{constructor(tag){this.tag=tag;this.children=[];this.contentWindow={};this.hidden=false;}append(...items){this.children.push(...items);}remove(){this.removed=true;}showModal(){this.open=true;}}
const context={window:{addEventListener:(type,fn)=>listener=fn,DormMiniDocument:'<head></head>'},location:{origin:'https://example.test'},URLSearchParams,document:{createElement:tag=>new Element(tag),body:{append:el=>dialog=el}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/mini-ui.js'),'utf8'),context);
const UI=context.window.DormMiniUI,options={key:'mini-runner',token:'one',title:'Test',onResult:n=>results.push(n),onDone:n=>done.push(n),onCancel:()=>cancelled++};
UI.open(options);const frame=dialog.children[1];assert(frame.srcdoc.includes(';</script>'));
const message=(type,score,extra={})=>listener({source:frame.contentWindow,origin:'https://example.test',data:{type,key:options.key,token:options.token,score},...extra});
message('naiwa-mini-ready',0,{source:{}});message('naiwa-mini-ready',0,{origin:'https://wrong.test'});assert.equal(results.length,0);
message('naiwa-mini-ready',0);message('naiwa-mini-ready',1);assert.deepEqual(results,[0]);assert(dialog.children[2].children[1].hidden);assert.equal(dialog.children[0].children[1].textContent,'返回校园');dialog.children[0].children[1].onclick();assert.deepEqual(done,[0]);assert.equal(cancelled,0);
UI.open({...options,token:'two'});dialog.children[0].children[1].onclick();assert.equal(cancelled,1);
UI.open({...options,token:'three'});dialog.children[2].children[1].onclick();assert.deepEqual(done,[0,-1]);
console.log('Mini UI passed: result locking, origin/source checks, completed exit settlement, free early cancel, valid srcdoc.');
