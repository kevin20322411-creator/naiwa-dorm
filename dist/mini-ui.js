(function(){'use strict';let active=null;
function close(){if(!active)return;active.dialog.remove();active=null;}
function open(options){if(active?.token===options.token)return;close();const dialog=document.createElement('dialog');dialog.className='mini-game-dialog';const bar=document.createElement('div');bar.className='mini-game-bar';const title=document.createElement('strong');title.textContent=options.title;const exit=document.createElement('button');exit.textContent='先不玩';exit.className='text-btn';bar.append(title,exit);const frame=document.createElement('iframe');frame.title=options.title;const bottom=document.createElement('div');bottom.className='mini-game-bottom';const ordinary=document.createElement('button');ordinary.className='text-btn';ordinary.textContent='普通完成活动';const note=document.createElement('span');note.textContent=options.cost;bottom.append(note,ordinary);dialog.append(bar,frame,bottom);document.body.append(dialog);active={dialog,frame,ordinary,exit,token:options.token,options,result:null};
const embedded=!!window.DormMiniDocument;
active.offline=embedded&&location.protocol==='file:';
const config={key:options.key,token:options.token,pink:options.pink,readonly:!!options.readonly,targetOrigin:active.offline?'*':location.origin};
ordinary.hidden=!!options.readonly;if(embedded){const encode=value=>JSON.stringify(value).replaceAll('<','\\u003c'),sprites={};for(const name of ['frog.png','frog-wave.png','naishu-cutout.png','meme-surprised.png'])if(window.DormAssets?.[name])sprites[name]=window.DormAssets[name];frame.srcdoc=window.DormMiniDocument.replace('<head>','<head><script>window.PreviewAssets='+encode(sprites)+';window.EmbeddedMiniConfig='+encode(config)+';<'+'/script>');}else frame.src='./mini/index.html?'+new URLSearchParams({game:config.key,token:config.token,pink:config.pink?'1':'0',album:config.readonly?'1':'0'});
const cancel=()=>{const value=active?.result;close();if(value!==null&&value!==undefined)options.onDone(value);else options.onCancel();};exit.onclick=cancel;ordinary.onclick=()=>{close();options.onDone(-1);};dialog.oncancel=e=>{e.preventDefault();cancel();};dialog.showModal();}
window.addEventListener('message',e=>{
 const a=active;
 if(!a||e.source!==a.frame.contentWindow)return;
 // Browsers can serialize a local document's message origin as "null".
 if(e.origin!==location.origin&&!(a.offline&&e.origin==='null'))return;
 if(!['naiwa-mini-result','naiwa-mini-ready'].includes(e.data?.type)||e.data.token!==a.token||e.data.key!==a.options.key||!Number.isInteger(e.data.score)||a.options.readonly)return;
 if(e.data.type==='naiwa-mini-ready'){
  if(a.result!==null)return;
  try{a.options.onResult?.(e.data.score);a.result=e.data.score;a.ordinary.hidden=true;a.exit.textContent='返回校园';}catch{}
  return;
 }
 const done=a.options.onDone,value=a.result??e.data.score;
 close();
 done(value);
});
window.DormMiniUI={open,close};})();
