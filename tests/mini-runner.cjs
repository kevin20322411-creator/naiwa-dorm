const assert=require('node:assert/strict'),R=require('../dist/mini/runner-challenge');
function simulate(seed,policy){const s=R.create(seed);for(let i=0;i<2500&&s.phase==='active';i++){policy?.(s);R.step(s,1/120);}return s;}
function planned(s,jumping=true){const w=s.waves.find(w=>!w.checked);if(!w)return;const destination=w.kind==='single'?0:w.open;R.move(s,Math.sign(destination-s.lane));const eta=(w.at-s.track)/R.speed(s.t);if(jumping&&w.jump&&eta<.29&&eta>0&&Math.abs(s.drawLane-destination)<.25)R.jump(s);}
let wins=0,idleWins=0,noJumpWins=0;const failures=[];
for(let seed=1;seed<=300;seed++){
  const waves=R.course(seed);assert.deepEqual(waves,R.course(seed));
  assert.ok(waves.some(w=>w.jump));assert.ok(waves.every(w=>w.objects.some(o=>o.kind!=='barrier')||w.objects.length<3));
  for(let i=1;i<waves.length;i++)assert.ok((waves[i].at-waves[i-1].at)/R.speed(20)>.8,'Reaction gap too small');
  const idle=simulate(seed);idleWins+=Number(idle.won);
  const noJump=simulate(seed,s=>planned(s,false));noJumpWins+=Number(noJump.won);
  const skill=simulate(seed,planned);wins+=Number(skill.won);if(!skill.won)failures.push({seed,reason:skill.reason,progress:skill.distance,hp:skill.hp});
  assert.ok(skill.t<=20.001&&idle.t<=20.001);assert.ok(Number.isFinite(skill.track));
}
assert.equal(idleWins,0,'Standing still should not win');assert.equal(noJumpWins,0,'Lane changes alone should not bypass jump gates');assert.equal(wins,300,'All generated routes must be playable: '+JSON.stringify(failures.slice(0,5)));
const slow=R.create(1);slow.waves=[];slow.t=19;slow.track=R.GOAL-80;slow.slow=2;for(let i=0;i<200&&slow.phase==='active';i++)R.step(slow,.01);assert.equal(slow.reason,'timeout');assert.ok(slow.hp>0&&!slow.won,'Remaining hearts do not imply arrival');
const clean=R.create(1);clean.waves=[];for(let i=0;i<2500&&clean.phase==='active';i++)R.step(clean,1/120);assert.ok(clean.won&&clean.t<20);
const early=R.create(2);assert.ok(R.jump(early));assert.equal(R.jump(early),false);assert.equal(R.move(early,1),true);assert.equal(R.move(early,-1),false);
console.log('Runner: 300 routes; idle wins '+idleWins+', dodging-only wins '+noJumpWins+', planned wins '+wins+'. Timeout, input cooldowns and route spacing passed.');
