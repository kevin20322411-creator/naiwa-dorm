const assert=require('node:assert/strict'),G=require('../dist/meetings.js'),B=require('../dist/illness.js'),{simulate}=require('./romance.cjs');
function fixtures(){
 const variants=new Map();let declined,declinedBefore,accepted;
 for(let seed=0;seed<128&&(variants.size<11||!declined||!accepted);seed++){
  const sample=simulate(seed,9,G),s=sample.encounter;if(!s)continue;const scene=G.getScene(s),n=G.choose(s,0);
  variants.set(scene.encounterId,s);if(n.outcome.contactAdded)accepted??=n;else{declined??=n;declinedBefore??=s;}
 }
 assert.equal(variants.size,11);assert(declined&&accepted);return{group:variants.get('group'),declined,declinedBefore,accepted,variants};
}
function checks(){
 const f=fixtures();assert.equal(G.encounterCount,11);
 for(const [id,s]of f.variants){assert(G.valid(s),id);const scene=G.getScene(s);assert.equal(scene.id,'love-encounter');assert((scene.title+scene.text).includes('奶粉'));assert(scene.choices.some(c=>(c.mods.energy||0)>=0),'保留可先离开的低负担选择');
  for(let i=0;i<3;i++){const n=G.choose(s,i);assert(G.valid(n));assert.equal(G.getScene(n).encounterId,id);assert.equal(n.outcome.choice,scene.choices[i].text);assert(n.outcome.result);}
 }
 assert(f.declined.outcome.changes.energy<0);assert.equal(f.declined.outcome.changes.mood,-6);assert(!f.declined.romance.connected);assert(!f.accepted.outcome.changes.mood);assert(f.accepted.romance.connected);
 assert.deepEqual(G.choose(f.declinedBefore,0),f.declined);assert.deepEqual(G.restore(JSON.parse(JSON.stringify(f.declined))),f.declined);
 const project=G.choose(f.group,1);assert.equal(project.term.progress,f.group.term.progress+6);assert.equal(project.stats.study,Math.min(100,f.group.stats.study+5));assert(!project.romance.connected);assert(project.romance.familiar>f.group.romance.familiar);
 for(const file of ['v6-illness.json','v6-food.json','v6-rhythm.json']){const old=require('./fixtures/'+file);assert.deepEqual(G.restore(old),old);const up=G.enableMeetings(old);assert(G.valid(up));assert.deepEqual(up.stats,old.stats);assert.deepEqual(up.log,old.log);assert.deepEqual(G.getScene(up),B.getScene(old));}
 console.log(JSON.stringify({passed:true,encounters:11,choiceRoutes:33,rejectionMood:-6,projectProgress:true,oldSaves:true}));return f;
}
if(require.main===module)checks();module.exports={fixtures,checks};
