(function(root){
'use strict';

const preferenceKey='naiwa-dorm-music';
const normalVolume=.14;
const quietReasons=new Set();
let audio=null,button=null,enabled=false,unlocked=false,request=0,onError=()=>{};

function readPreference(){
 try{return JSON.parse(localStorage.getItem(preferenceKey))===true;}catch{return false;}
}
function remember(){
 try{localStorage.setItem(preferenceKey,JSON.stringify(enabled));}catch{}
}
function updateButton(){
 if(!button)return;
 button.textContent=enabled?'音乐开':'音乐关';
 button.setAttribute('aria-pressed',String(enabled));
 button.setAttribute('aria-label',enabled?'关闭背景音乐':'开启背景音乐');
}
function canPlay(){return enabled&&unlocked&&!document.hidden;}
function pause(){
 request++;
 audio?.pause();
}
async function play(reportFailure=false){
 if(!audio||!canPlay())return;
 if(audio.paused===false)return;
 const current=++request;
 try{
  await audio.play();
  if(!canPlay())audio.pause();
 }catch{
  if(current!==request||!canPlay())return;
  if(reportFailure){
   enabled=false;
   remember();
   updateButton();
   onError();
  }
 }
}
function unlock(event){
 if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
 if(event.isTrusted===false)return;
 unlocked=true;
 // Clicking the music switch should only apply the requested new state.
 if(event.target?.closest?.('#music-btn'))return;
 play();
}
function toggle(){
 unlocked=true;
 enabled=!enabled;
 remember();
 updateButton();
 if(enabled)play(true);else pause();
}
function duck(reason,quiet){
 if(quiet)quietReasons.add(reason);else quietReasons.delete(reason);
 if(audio)audio.volume=normalVolume*(quietReasons.size>0 ? .3 : 1);
}
function bind(control,reportError){
 if(!control||audio)return;
 button=control;
 onError=reportError||onError;
 enabled=readPreference();
 audio=new Audio(root.DormAssets?.['simplicity.mp3']||'./assets/simplicity.mp3');
 audio.loop=true;
 audio.preload='none';
 audio.volume=normalVolume;
 button.onclick=toggle;
 updateButton();
 document.addEventListener?.('pointerdown',unlock,{passive:true});
 document.addEventListener?.('keydown',unlock);
 document.addEventListener?.('visibilitychange',()=>{if(document.hidden)pause();else play();});
 root.addEventListener('pagehide',pause);
 root.addEventListener('pageshow',()=>play());
}

root.DormMusic={bind,duck};
})(typeof window!=='undefined'?window:globalThis);
