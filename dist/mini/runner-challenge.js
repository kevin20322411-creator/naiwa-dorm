(function(root){'use strict';
const LIMIT=20,GOAL=2070,LOOKAHEAD=340,JUMP=.62;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function course(seed){
  let rng=seed>>>0;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
  const waves=[];let at=170,previous=1;
  for(let i=0;at<GOAL-65;i++){
    let open=Math.floor(random()*3);if(i>0&&open===previous)open=(open+1+Math.floor(random()*2))%3;
    const kind=i===0?'single':i<3?'gap':i%4===3?'jump':random()<.5?'mixed':'gap';
    const objects=[];
    for(let lane=0;lane<3;lane++){
      if(kind==='single'){if(lane===1)objects.push({lane,kind:'barrier'});}
      else if(kind==='gap'){if(lane!==open)objects.push({lane,kind:'barrier'});else if(i%3===1)objects.push({lane,kind:'breakfast'});}
      else if(kind==='jump'){objects.push({lane,kind:lane===open?'cone':'barrier'});}
      else {if(lane!==open)objects.push({lane,kind:lane===(open+1)%3?'cone':'barrier'});else if(i%2===0)objects.push({lane,kind:'breakfast'});}
    }
    waves.push({id:i,at,open,jump:kind==='jump',kind,objects,checked:false});
    previous=open;at+=142-Math.min(i*3.7,38);
  }
  return waves;
}
function create(seed=1){return{phase:'active',t:0,seed:seed>>>0,track:0,distance:0,lane:1,drawLane:1,moveCooldown:0,jump:0,jumpCooldown:0,hp:3,slow:0,invincible:0,points:0,food:0,cleared:0,objects:[],waves:course(seed),won:false,reason:'',events:[],worldClock:0};}
function move(s,dir){if(s.phase!=='active'||s.moveCooldown>0)return false;const lane=clamp(s.lane+Math.sign(dir),0,2);if(lane===s.lane)return false;s.lane=lane;s.moveCooldown=.11;return true;}
function jump(s){if(s.phase!=='active'||s.jump>0||s.jumpCooldown>0)return false;s.jump=JUMP;s.jumpCooldown=.78;return true;}
function height(s){return s.jump>0?Math.sin(s.jump/JUMP*Math.PI)*125:0;}
function speed(t){return 90+Math.min(t,15)*2;}
function resultScore(s){return s.won?1000+Math.floor((LIMIT-s.t)*100)+s.points+s.hp*50:Math.floor(s.distance*5)+s.points;}
function step(s,dt){
  s.events=[];if(s.phase!=='active')return s;
  dt=Math.min(Math.max(0,dt),.05,LIMIT-s.t);
  s.t+=dt;s.moveCooldown=Math.max(0,s.moveCooldown-dt);s.jump=Math.max(0,s.jump-dt);s.jumpCooldown=Math.max(0,s.jumpCooldown-dt);
  s.drawLane+=clamp(s.lane-s.drawLane,-6.8*dt,6.8*dt);
  s.slow=Math.max(0,s.slow-dt);s.invincible=Math.max(0,s.invincible-dt);
  const velocity=speed(s.t)*(s.slow>0?.45:1);
  s.track+=velocity*dt;s.worldClock+=velocity*dt/110;
  s.distance=Math.min(100,Math.floor(s.track/GOAL*100));
  for(const w of s.waves){
    if(w.checked||w.at>s.track)continue;
    w.checked=true;
    const near=w.objects.filter(o=>Math.abs(o.lane-s.drawLane)<.57);
    const hit=near.find(o=>o.kind==='barrier'||o.kind==='cone'&&height(s)<65);
    if(hit){s.hp--;s.slow=1.35;s.invincible=.4;s.events.push({type:'collision',lane:hit.lane});}
    else {s.cleared++;if(near.some(o=>o.kind==='cone')){s.points+=15;s.events.push({type:'jump'});}if(near.some(o=>o.kind==='breakfast')){s.points+=20;s.food++;s.events.push({type:'food'});}}
    if(s.hp<=0){s.phase='done';s.reason='collision';break;}
  }
  s.objects=[];
  for(const w of s.waves){const z=w.at-s.track;if(z>LOOKAHEAD||z< -75)continue;for(const o of w.objects)s.objects.push({...o,p:1-z/LOOKAHEAD,checked:w.checked,wave:w.id});}
  if(s.phase==='active'){
    if(s.track>=GOAL){s.phase='done';s.won=true;s.distance=100;s.reason='arrived';}
    else if(s.t>=LIMIT){s.phase='done';s.reason='timeout';}
  }
  return s;
}
const api={create,step,move,jump,height,speed,course,resultScore,LIMIT,GOAL,LOOKAHEAD,JUMP};root.RunnerChallenge=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
