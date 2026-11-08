const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../dist/background-music.js'),'utf8');

function boot(preferred=false){
 const events=new Map(),storage=new Map([['naiwa-dorm-music',JSON.stringify(preferred)]]);
 const button={textContent:'',attributes:{},setAttribute(key,value){this.attributes[key]=value;}};
 let track,errors=0;
 const document={hidden:false,addEventListener(type,handler){events.set(type,handler);}};
 const context={document,Set,localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},addEventListener(type,handler){events.set(type,handler);},Audio:function(src){
  track={src,paused:true,plays:0,pauses:0,play(){this.plays++;this.paused=false;return Promise.resolve();},pause(){this.pauses++;this.paused=true;}};
  return track;
 }};
 context.window=context;
 vm.runInNewContext(source,context);
 context.DormMusic.bind(button,()=>errors++);
 return{track,button,storage,events,document,music:context.DormMusic,errors:()=>errors};
}

(async()=>{
 const first=boot();
 assert.equal(first.track.plays,0,'Music starts only after opt in');
 assert.equal(first.track.loop,true);
 first.events.get('pointerdown')({type:'pointerdown',isTrusted:true});
 assert.equal(first.track.plays,0);
 first.button.onclick();
 assert.equal(first.track.plays,1);
 assert.equal(first.storage.get('naiwa-dorm-music'),'true');
 assert.equal(first.button.attributes['aria-pressed'],'true');
 const volume=first.track.volume;
 first.music.duck('voice',true);
 first.music.duck('melody',true);
 assert(first.track.volume<volume);
 first.music.duck('voice',false);
 assert(first.track.volume<volume,'A second sound still keeps the music quiet');
 first.music.duck('melody',false);
 assert.equal(first.track.volume,volume);
 first.document.hidden=true;
 first.events.get('visibilitychange')();
 assert(first.track.paused);
 first.document.hidden=false;
 first.events.get('visibilitychange')();
 assert.equal(first.track.plays,2);
 first.button.onclick();
 assert(first.track.paused);
 assert.equal(first.storage.get('naiwa-dorm-music'),'false');

 const remembered=boot(true);
 assert.equal(remembered.track.plays,0,'A saved preference does not bypass autoplay restrictions');
 remembered.events.get('pointerdown')({type:'pointerdown',isTrusted:true});
 assert.equal(remembered.track.plays,1);
 remembered.events.get('pagehide')();
 assert(remembered.track.paused);

 const failure=boot();
 failure.track.play=()=>Promise.reject(new Error('Browser playback unavailable'));
 failure.button.onclick();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(failure.errors(),1);
 assert.equal(failure.button.attributes['aria-pressed'],'false');

 const cancelled=boot();
 let rejectPlay;
 cancelled.track.play=()=>new Promise((_,reject)=>{rejectPlay=reject;});
 cancelled.button.onclick();
 cancelled.button.onclick();
 rejectPlay(new Error('Old request'));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(cancelled.errors(),0,'An old playback failure cannot change a later preference');
 console.log('Background music passed: opt in, preference, hidden pause, voice ducking, and playback races.');
})().catch(error=>{console.error(error);process.exitCode=1;});
