(function(root){
'use strict';
// Read-only presentation derived from an actual terminal state.
const browser=typeof module==='undefined'||!module.exports;
const G=browser?root.DormGame:require('./positive-endings.js');
const rules={
 'fail-energy':'电量归零，本局结束。',
 'fail-study':'学业归零，收到劝退通知。',
 'fail-health':'健康或心情归零，奶蛙长眠。',
 'fail-course':'课设累计缺交两次，本学期转入重修。',
 'fail-mouse-family':'与奶鼠互动时触发隐藏终局。',
 'lottery-winner':'亲手刮出100万元大奖，本局结束。',
 ...Object.fromEntries(G.positiveEndings.map(item=>[item.id,item.rule]))
};
const source=new Map(G.endings.map(item=>[item.id,item]));
const items=Object.freeze(Object.keys(rules).map(id=>{
 const base=source.get(id)||{id};
 return Object.freeze({...base,title:base.name,rule:rules[id]});
}));
const byId=new Map(items.map(item=>[item.id,item]));
const stat=(s,key)=>(G.labels?.[key]||key)+' '+(Number.isFinite(s.stats?.[key])?s.stats[key]:'未记录');
function capture(s){
 if(!s||s.phase!=='ending')return null;
 if(s.positiveEnding)return G.positiveEndingReport(s);
 let id=s.failed==='fail-mood'?'fail-health':s.failed;
 const jackpot=s.lottery?.won===true&&Array.isArray(s.log)&&s.log.some(row=>
  row&&row.lotteryPrize===1000000&&Number.isInteger(row.day)&&row.day>0&&row.day<=s.day);
 if(!Object.hasOwn(rules,id)||G.positiveEndings.some(item=>item.id===id))id=jackpot?'lottery-winner':null;
 // A title, a high balance, or choosing to retire is not an automatic ending.
 if(!id||id==='lottery-winner'&&!jackpot)return null;
 const item=byId.get(id),facts=[];
 if(id==='fail-energy')facts.push(stat(s,'energy'));
 else if(id==='fail-study')facts.push(stat(s,'study'));
 else if(id==='fail-course')facts.push('课设累计缺交 '+(Number.isFinite(s.term?.missed)?s.term.missed:'未记录')+' 次');
 else if(id==='fail-health'){
  const bite=s.evolution?.bite;
  const overdue=s.failed==='fail-health'&&s.stats?.health<=0&&bite&&Number.isInteger(bite.due)&&s.day>=bite.due&&!bite.appointment;
  facts.push(s.failed==='fail-mood'?'触发原因：心情归零':'触发原因：健康归零');
  if(overdue)facts.push('仍有未处理的咬伤');
  facts.push(stat(s,'health'),stat(s,'mood'));
 }else if(id==='fail-mouse-family')facts.push('与奶鼠互动时，奶鼠呼叫了奶家人');
 else facts.push('彩票奖金 ¥1,000,000');
 return{id,name:item.name,day:s.day,player:typeof s.name==='string'?s.name:'奶蛙',rule:item.rule,facts};
}
const api=Object.freeze({items,capture});
root.DormEndingBook=api;
if(!browser)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
