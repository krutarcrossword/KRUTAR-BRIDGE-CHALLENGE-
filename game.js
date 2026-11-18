'use strict';
const $=id=>document.getElementById(id);
const SUITS=['S','H','D','C'], ICON={S:'♠',H:'♥',D:'♦',C:'♣'}, ORDER=['W','N','E','S'];
const label=c=>(c.r===14?'A':c.r===13?'K':c.r===12?'Q':c.r===11?'J':c.r)+ICON[c.s];
const key=c=>c.s+c.r;
const deck=()=>SUITS.flatMap(s=>Array.from({length:13},(_,i)=>({s,r:i+2})));
// Fixed, fully validated 52-card deal: N/S have nine spades and numerous high cards.
const ns={S:['AS','KS','TS','9S','6S','AH','KH','8H','AD','7D','KC','6C','3C'],N:['QS','JS','8S','7S','QH','6H','3H','KD','QD','4D','AC','9C','5C']};
function parseCard(x){let s=x.slice(-1),v=x.slice(0,-1);return {s,r:({A:14,K:13,Q:12,J:11,T:10}[v]||Number(v))}}
function initialHands(){let S=ns.S.map(parseCard),N=ns.N.map(parseCard),used=new Set([...S,...N].map(key)),remaining=deck().filter(c=>!used.has(key(c))); // distribute deterministic defender cards
 let W=[],E=[];remaining.forEach((c,i)=>(i%2===0?W:E).push(c));return {N,E,S,W};}
function sortHand(a){return a.sort((x,y)=>SUITS.indexOf(x.s)-SUITS.indexOf(y.s)||y.r-x.r)}
function legal(hand,lead){return lead&&hand.some(c=>c.s===lead)?hand.filter(c=>c.s===lead):hand.slice()}
function winner(plays){let lead=plays[0].card.s;return plays.reduce((best,p)=>{let score=c=>(c.s==='S'?200:c.s===lead?100:0)+c.r;return score(p.card)>score(best.card)?p:best},plays[0]).seat}
function team(seat){return ['N','S'].includes(seat)?'NS':'EW'}
let state=null,selected=null,paused=false;
function newGame(){let hands=initialHands();Object.values(hands).forEach(sortHand);let all=Object.values(hands).flat();if(all.length!==52||new Set(all.map(key)).size!==52)throw Error('Invalid 52-card deal');state={hands,turn:'W',leader:'W',plays:[],history:[],wins:{NS:0,EW:0},dummy:false,phase:'ready',hints:0};selected=null;paused=false;render();}
function message(t){$('message').textContent=t}
function start(){if(state.phase!=='ready')return;state.phase='playing';message('West นำไพ่ใบแรก (Opening Lead)\nจากนั้น North จะเปิดไพ่ Dummy');render();setTimeout(()=>aiTurn(),300)}
function play(seat,card){if(state.phase!=='playing'||state.turn!==seat)return false;let hand=state.hands[seat],lead=state.plays[0]?.card.s;if(!legal(hand,lead).some(c=>key(c)===key(card))){message('ต้องตามดอก '+ICON[lead]+' เพราะยังมีไพ่ดอกนี้อยู่');return false}let index=hand.findIndex(c=>key(c)===key(card));if(index<0)return false;hand.splice(index,1);state.plays.push({seat,card});selected=null;
 if(seat==='W'&&state.history.length===0&&state.plays.length===1){state.dummy=true;message('West นำ '+label(card)+' · เปิดไพ่ North เป็น Dummy แล้ว!\nSouth เป็นผู้เลือกไพ่ทั้ง North และ South')}
 if(state.plays.length===4){let win=winner(state.plays);state.wins[team(win)]++;state.history.push({plays:state.plays.map(p=>({...p})),winner:win});state.turn=win;state.leader=win;state.phase='review';message('Trick '+state.history.length+': '+win+' ชนะด้วย '+label(state.plays.find(p=>p.seat===win).card)+'\n'+(team(win)==='NS'?'ทีมเราชนะ Trick นี้!':'ฝ่ายป้องกันชนะ Trick นี้')+'\nกด Continue เพื่อเล่นต่อ');}
 else{state.turn=ORDER[(ORDER.indexOf(seat)+1)%4];if(!['N','S'].includes(state.turn))setTimeout(aiTurn,450)}render();return true}
function aiTurn(){if(!state||state.phase!=='playing'||!['W','E'].includes(state.turn))return;let seat=state.turn,hand=state.hands[seat],lead=state.plays[0]?.card.s,options=legal(hand,lead),chosen;
 // Opening lead: lead a high honor from longest suit if available, otherwise highest of longest suit.
 if(!lead){let lengths=SUITS.map(s=>({s,n:hand.filter(c=>c.s===s).length})).sort((a,b)=>b.n-a.n);let suit=lengths[0].s;chosen=hand.filter(c=>c.s===suit).sort((a,b)=>b.r-a.r)[0]}
 else{let current=winner(state.plays),partner=seat==='W'?'E':'W';let winners=options.filter(c=>winner([...state.plays,{seat,card:c}])===seat).sort((a,b)=>a.r-b.r);if(current===partner){chosen=options.slice().sort((a,b)=>a.r-b.r)[0]}else if(winners.length){chosen=winners[0]}else{chosen=options.slice().sort((a,b)=>a.r-b.r)[0]}}
 play(seat,chosen)}
function next(){if(state.phase!=='review')return;state.plays=[];if(state.history.length===13){state.phase='result';message(state.wins.NS>=8?'🎉 CONTRACT MADE!\nทำสัญญา 2♠ สำเร็จ! ชนะ '+state.wins.NS+' Tricks':'CONTRACT DOWN\nทีมเราชนะ '+state.wins.NS+' Tricks ต้องการ 8 Tricks\nกด Restart เพื่อลองใหม่');}else{state.phase='playing';message('Trick '+(state.history.length+1)+' · '+state.turn+' เป็นผู้นำไพ่\nเลือกไพ่ที่มีขอบสีเขียวเพื่อเล่น');if(['W','E'].includes(state.turn))setTimeout(aiTurn,400)}render()}
function hint(){if(!state||state.phase!=='playing')return message('เริ่มเกมก่อนจึงใช้คำใบ้ได้');if(!['N','S'].includes(state.turn))return message('รอ AI ลงไพ่ก่อน');state.hints++;let lead=state.plays[0]?.card.s,opts=legal(state.hands[state.turn],lead),high=opts.slice().sort((a,b)=>b.r-a.r)[0];message('💡 HINT · '+state.turn+'\n'+(lead?'ต้องตามดอก '+ICON[lead]+' ถ้ามี\n':'คุณเป็นผู้นำ Trick นี้\n')+'ไพ่ที่ลงได้: '+opts.map(label).join(' ')+'\nลองพิจารณา '+label(high)+' และดูว่าควรเก็บไพ่สูงไว้หรือไม่');}
function cardElement(card,enabled,selectedNow){let b=document.createElement('button');b.className='card'+(['H','D'].includes(card.s)?' red':'')+(enabled?' legal':'')+(selectedNow?' selected':'');b.textContent=label(card);b.disabled=!enabled;b.title=label(card);if(enabled)b.onclick=()=>{selected={seat:state.turn,card};render()};return b}
function render(){if(!state)return;let isPlaying=state.phase==='playing';$('historyCount').textContent=state.history.length;$('ns').textContent=state.wins.NS;$('ew').textContent=state.wins.EW;$('trickNo').textContent=Math.min(state.history.length+1,13);$('need').textContent='NEED '+Math.max(0,8-state.wins.NS);$('northCount').textContent='('+state.hands.N.length+')';$('southCount').textContent='('+state.hands.S.length+')';$('westCount').textContent=state.hands.W.length+' cards';$('eastCount').textContent=state.hands.E.length+' cards';
 for(let seat of ['N','S']){let el=$(seat==='N'?'northHand':'southHand');el.replaceChildren();if(seat==='N'&&!state.dummy){let back=document.createElement('div');back.className='back';back.textContent='✦';el.append(back);continue}let lead=state.plays[0]?.card.s,can=isPlaying&&state.turn===seat,allowed=can?new Set(legal(state.hands[seat],lead).map(key)):new Set();state.hands[seat].forEach(c=>el.append(cardElement(c,can&&allowed.has(key(c)),selected&&selected.seat===seat&&key(selected.card)===key(c))))}
 let tr=$('trick');tr.replaceChildren();state.plays.forEach(p=>{let wrap=document.createElement('div');wrap.className='played';let name=document.createElement('div');name.textContent=p.seat;let card=cardElement(p.card,false,false);if(state.phase==='review'&&winner(state.plays)===p.seat)card.classList.add('winner');wrap.append(name,card);tr.append(wrap)});
 $('start').hidden=state.phase!=='ready';$('confirm').hidden=!(isPlaying&&['N','S'].includes(state.turn));$('confirm').disabled=!selected;$('confirm').textContent=selected?'PLAY '+label(selected.card):'SELECT A CARD';$('next').hidden=state.phase!=='review';if(state.phase==='result'){$('next').hidden=true;}
}
$('start').onclick=start;$('restart').onclick=()=>{if(confirm('เริ่มภารกิจใหม่ด้วยไพ่ชุดเดิม?'))newGame()};$('hint').onclick=hint;$('next').onclick=next;$('confirm').onclick=()=>{if(selected)play(selected.seat,selected.card)};newGame();message('MISSION 01 · 2♠\nเป้าหมาย: ทีม North–South ชนะอย่างน้อย 8 จาก 13 Tricks\nSouth เป็น Declarer · West นำไพ่ก่อน\nกด Start Mission เพื่อเริ่ม');

// History is read-only: opening it never advances turns or exposes hidden hands.
function renderHistory(){
 const list=$('historyList');list.replaceChildren();
 $('historySummary').textContent=`เล่นแล้ว ${state.history.length}/13 Tricks · N–S ${state.wins.NS} : ${state.wins.EW} E–W · เป้าหมาย 8 Tricks`;
 if(!state.history.length){const empty=document.createElement('div');empty.className='history-empty';empty.textContent='ยังไม่มี Trick ที่เล่นครบ 4 ใบ เริ่มเล่นเพื่อบันทึกประวัติ';list.append(empty);return;}
 let nsWins=0,ewWins=0;
 state.history.forEach((entry,i)=>{
  const side=team(entry.winner);if(side==='NS')nsWins++;else ewWins++;
  const section=document.createElement('section');section.className='history-item';
  const heading=document.createElement('h3');heading.textContent=`Trick ${i+1} · ${entry.winner} ชนะ (${side})`;section.append(heading);
  const cards=document.createElement('div');cards.className='history-cards';
  entry.plays.forEach((play,position)=>{
   const cell=document.createElement('div');cell.className='history-play'+(play.seat===entry.winner?' win':'');
   const name=document.createElement('span');name.textContent=play.seat+(position===0?' · Lead':'');
   const card=document.createElement('b');card.className=['H','D'].includes(play.card.s)?'red':'';card.textContent=label(play.card);
   cell.append(name,card);cards.append(cell);
  });section.append(cards);
  const note=document.createElement('div');note.className='history-note';
  note.textContent=`ผู้ชนะ: ${entry.winner} · ไพ่ชนะ ${label(entry.plays.find(p=>p.seat===entry.winner).card)} · คะแนนสะสม N–S ${nsWins} : ${ewWins} E–W`;
  section.append(note);list.append(section);
 });
}
function openHistory(){renderHistory();$('historyModal').hidden=false;$('closeHistory').focus()}
function closeHistory(){$('historyModal').hidden=true;$('historyBtn').focus()}
$('historyBtn').onclick=openHistory;
$('closeHistory').onclick=closeHistory;
$('closeHistoryBottom').onclick=closeHistory;
$('historyModal').addEventListener('click',e=>{if(e.target===$('historyModal'))closeHistory()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('historyModal').hidden)closeHistory()});
