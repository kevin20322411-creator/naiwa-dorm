(function(root){
'use strict';
function makeEvents(c){return[
 {id:'income-breakfast-help',slot:0,title:'早餐摊少了一位打包同学。',place:'食堂门口 · 早班招募',emoji:'🥯',bubble:'先挣到今天的饭钱。',text:'老板正忙着装包子，招呼你：“帮一小会，报酬现结，赶课前就能走。”你看了看余额，又看了看时间。',choices:[
  c('帮忙打包一小会，领份报酬','花一点力气，先把预算补上。',{money:15,energy:-8,study:-3},'最后一袋包子装好，老板结清了报酬。奶娃的饭卡，重新有了底气。',{job:1,earn:1}),
  c('和室友轮流帮忙，早课前收工','少赚一点，留些余力。',{money:8,energy:-5,social:6},'你递袋子，室友报单号。两只奶娃总算把“搭把手”干成了一次短暂就业。',{job:1,helped:1}),
  c('先去上课，问清下午还有没有空缺','今天先按课表走。',{energy:-4,study:10},'老板记下你的空闲时段。你赶到教室时，老师还在调投影仪。',{learn:1})]},
 {id:'income-library-sort',slot:1,title:'图书馆招临时理书员。',place:'图书馆 · 当日勤工岗',emoji:'📚',bubble:'知识还能先养活奶娃。',text:'值班老师推来一小车归还的书：“帮忙核对书号，今天就结报酬。”奶娃第一次觉得，书架之间也能找到饭钱。',choices:[
  c('核对书号，做完这一小时','多走几趟，多挣一点。',{money:18,energy:-12,study:5},'最后一本归位，你拿到了报酬，也终于认清了三个区的编号。',{job:1,library:1,earn:1}),
  c('只接半小时，给自己的课留点时间','工作和课程各留一半。',{money:10,energy:-6,study:5},'老师确认了你整理好的半车书。奶娃收工去上课，零钱和笔记都有了新的一页。',{job:1,library:1}),
  c('先记下招募信息，按计划自习','这次先补知识。',{energy:-8,study:16},'你找了个座位，把卡住的章节看懂了。勤工信息留在手机里，没有过期。',{library:1,learn:1})]}
];}
if(typeof module!=='undefined'&&module.exports)module.exports=makeEvents;
root.DormEconomy=makeEvents;
})(typeof globalThis!=='undefined'?globalThis:this);
