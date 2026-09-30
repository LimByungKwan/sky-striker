import {Game,W,H,STAGES} from './engine.js';
import {load,save,defaults} from './storage.js';
import {drawBackground} from './backgrounds.js';
const $=id=>document.getElementById(id),ctx=$('game').getContext('2d');
let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
const loaded=load(storage);let data=loaded.data,game=null,paused=false,last=0,clock=0,noticeTime=0,pointer=null,audio=null,pressed=new Set();
if(matchMedia('(prefers-reduced-motion: reduce)').matches)data.effects=false;
$('sound').checked=data.sound;$('effects').checked=data.effects;
if(loaded.recovered)$('saveStatus').textContent='손상되었거나 사용할 수 없는 저장값을 기본값으로 복구했습니다.';
const sprites={
 player:['000010000','000121000','000121000','001121100','011121110','112121211','111121111','000101000','000303000'],
 enemy:['003000300','001101100','011111110','112121211','011111110','001111100','000101000'],
 elite:['000111000','001222100','011222110','111212111','112222211','011111110','001000100'],
 boss:['0011000001100','0111100011110','1112211122111','1122221222211','1111222221111','0011122211100','0001111111000','0001100011000']
};
function sprite(name,x,y,scale,palette,flip=false){const a=sprites[name];ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.rotate(Math.PI);for(let j=0;j<a.length;j++)for(let i=0;i<a[j].length;i++){const v=+a[j][i];if(v){ctx.fillStyle=palette[v];ctx.fillRect(Math.round((i-a[j].length/2)*scale),Math.round((j-a.length/2)*scale),scale,scale);}}ctx.restore();}
function persist(){if(!save(storage,data))$('saveStatus').textContent='브라우저가 저장을 막았습니다. 기록을 CSV로 내려받아 보관하세요.';}
function sound(type){if(!data.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.setValueAtTime(type==='special'?180:type==='hurt'?90:type==='warning'?380:620,audio.currentTime);o.frequency.exponentialRampToValueAtTime(type==='special'?780:120,audio.currentTime+.12);g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.16);}catch{}}
function notify(t,seconds=2){$('notice').textContent=t;noticeTime=seconds;}
function event(e){if(['kill','hurt','special','warning','elite'].includes(e.type))sound(e.type);if(e.type==='boss')notify(e.name+' 접근',2.3);if(e.type==='phase2')notify('NEMESIS · PHASE 02',2.5);if(e.type==='stage-clear')notify('SECTOR CLEAR · HP +1');if(e.type==='stage')updateRoute();if(e.type==='end')finish(e.result);}
function updateRoute(){const stage=game?.stage||1;$('route').innerHTML=STAGES.map((s,i)=>`<li class="${i+1===stage?'active':i+1<stage?'done':''}"><span class="number">${String(i+1).padStart(2,'0')}</span><div><b>${s.name}</b><small>${s.boss}</small></div><span class="route-state">${i+1<stage?'✓':i+1===stage?'●':''}</span></li>`).join('');}
function updateRecords(){
 $('best').textContent=String(data.best).padStart(6,'0');const tr=data.records.filter(r=>r.mode==='trial');$('trialCount').textContent=Math.min(tr.length,20)+' / 20회';$('trialNext').textContent=data.trialIndex%2?'다음 B · ×1.25':'다음 A · ×1.00';
 const rows=tr.slice(-20),groups=[1,1.25].map(speed=>{const r=rows.filter(x=>x.speed===speed),avg=k=>r.length?(r.reduce((s,x)=>s+x[k],0)/r.length):0;return {speed,n:r.length,score:Math.round(avg('score')),time:avg('time').toFixed(1),survive:r.filter(x=>x.status==='trial-complete').length};});
 $('comparison').innerHTML='<p>최근 시험 비행 20회 · A 10회 + B 10회</p><div class="compare">'+groups.map((g,i)=>`<div><b>${i?'B':'A'} · 탄환 ×${g.speed.toFixed(2)}</b><p>${g.n}회 기록 · 평균 ${g.score}점</p><p>평균 생존 ${g.time}초</p><p>30초 생존 ${g.survive}회</p></div>`).join('')+'</div><p class="muted">'+(groups.every(g=>g.n===10)?'20회 수집 완료. 실제 결과를 보고 더 적절한 속도를 직접 선택하세요.':'A/B 각 10회가 모이면 평균 점수와 생존시간을 비교하세요.')+'</p>';
 const labels={won:'클리어',lost:'격추','trial-complete':'30초 생존'};
 $('recordsBody').innerHTML=data.records.length?data.records.slice().reverse().map((r,i)=>`<tr><td>${data.records.length-i}</td><td>${r.mode==='trial'?'시험':'작전'}</td><td>×${r.speed.toFixed(2)}</td><td>${r.score}</td><td>${r.time.toFixed(1)}초</td><td>${labels[r.status]}</td></tr>`).join(''):'<tr><td colspan="6">아직 기록이 없습니다. 첫 비행을 시작하세요.</td></tr>';
}
function start(mode='campaign'){
 const index=data.trialIndex;game=new Game({mode,speed:mode==='trial'&&index%2?1.25:1,seed:mode==='trial'?800+Math.floor(index/2):Math.floor(Math.random()*1e6),onEvent:event});paused=false;pressed.clear();pointer=null;$('overlay').hidden=true;$('bossHud').hidden=true;$('pauseButton').disabled=false;$('pauseButton').innerHTML='일시정지 <kbd>P</kbd>';$('modeLabel').textContent=mode==='trial'?`TRIAL ${game.speed===1?'A':'B'}`:'CAMPAIGN';notify(mode==='trial'?'30 SECOND FLIGHT':'SECTOR 01 · '+STAGES[0].name);updateRoute();$('game').focus({preventScroll:true});
}
function showOverlay(kicker,title,text,button,hint){$('overlay').hidden=false;$('overlayKicker').textContent=kicker;$('overlayTitle').textContent=title;$('overlayText').textContent=text;$('startButton').innerHTML=button+' <span>ENTER</span>';$('overlayHint').textContent=hint;}
function finish(r){data.best=Math.max(data.best,r.score);data.records.push({...r,date:new Date().toISOString()});data.records=data.records.slice(-200);if(r.mode==='trial')data.trialIndex++;persist();updateRecords();$('pauseButton').disabled=true;
 showOverlay(r.status==='won'?'ALL SECTORS CLEARED':r.status==='trial-complete'?'TRIAL COMPLETE':'MISSION ENDED',r.status==='won'?'MISSION\nCOMPLETE':r.status==='trial-complete'?'30초 생존':'GAME\nOVER',`점수 ${r.score.toLocaleString()} · 생존 ${r.time.toFixed(1)}초\n${r.mode==='trial'?`시험 ${r.speed===1?'A':'B'} · 적 탄환 ×${r.speed.toFixed(2)}`:`스테이지 ${r.stage} / 5`}`,r.mode==='trial'?'다음 시험 비행':'다시 출격','R 재시작 · 기록에서 결과 확인');
}
function togglePause(force){if(!game||game.status!=='playing')return;paused=force??!paused;pressed.clear();pointer=null;if(paused){showOverlay('FLIGHT PAUSED','일시정지','잠시 숨을 고르세요.','계속하기','P / Enter로 계속');$('pauseButton').innerHTML='계속하기 <kbd>P</kbd>';}else{$('overlay').hidden=true;$('pauseButton').innerHTML='일시정지 <kbd>P</kbd>';$('game').focus({preventScroll:true});}}
$('startButton').onclick=()=>paused?togglePause(false):start(game?.mode||'campaign');$('trialButton').onclick=()=>start('trial');$('restartButton').onclick=()=>start(game?.mode||'campaign');$('specialButton').onclick=()=>{if(!paused&&!document.querySelector('dialog[open]'))game?.special();};$('pauseButton').onclick=()=>togglePause();
for(const id of ['sound','effects'])$(id).onchange=()=>{data[id]=$(id).checked;persist();if(id==='sound'&&data.sound)sound('kill');};
function openDialog(id){if(game?.status==='playing'&&!paused)togglePause(true);pressed.clear();pointer=null;$(id).showModal();}
$('helpButton').onclick=()=>openDialog('helpDialog');$('recordsButton').onclick=()=>{updateRecords();openDialog('recordsDialog');};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('resetButton').onclick=()=>{$('resetConfirm').hidden=false;};$('cancelReset').onclick=()=>{$('resetConfirm').hidden=true;};$('confirmReset').onclick=()=>{const prefs={sound:data.sound,effects:data.effects};data={...defaults(),...prefs};persist();updateRecords();$('resetConfirm').hidden=true;$('saveStatus').textContent='최고점수와 플레이 기록을 초기화했습니다.';};
$('exportButton').onclick=()=>{const rows=[['mode','bullet_speed','seed','score','survival_seconds','stage','result','kills','specials','date'],...data.records.map(r=>[r.mode,r.speed,r.seed,r.score,r.time,r.stage,r.status,r.kills,r.specials,r.date])];const blob=new Blob(['\uFEFF'+rows.map(r=>r.join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='sky-striker-records.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);};
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||['INPUT','BUTTON','A'].includes(document.activeElement?.tagName))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','p','r','enter'].includes(k))e.preventDefault();if(e.repeat&&['r','p','enter',' '].includes(k))return;if(k==='p')togglePause();else if(k==='r')start(game?.mode||'campaign');else if(k==='enter'){if(paused)togglePause(false);else if(!game||game.status!=='playing')start(game?.mode||'campaign');}else pressed.add(k);});
window.addEventListener('keyup',e=>pressed.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>togglePause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)togglePause(true);});
function target(e){const r=$('game').getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
$('game').addEventListener('pointerdown',e=>{if(!game||game.status!=='playing'||paused)return;$('game').focus({preventScroll:true});$('game').setPointerCapture(e.pointerId);pointer=target(e);});$('game').addEventListener('pointermove',e=>{if(pointer)pointer=target(e);});for(const t of ['pointerup','pointercancel','lostpointercapture'])$('game').addEventListener(t,()=>pointer=null);
function draw(){
 const g=game,p=g?.player||{x:W/2,y:H-95,inv:0},color=STAGES[(g?.stage||1)-1].color;
 drawBackground(ctx,g?.stage||1,g?.t??clock,{effects:data.effects,phase2:!!g?.boss?.phase2});
 if(g){for(const l of g.lasers){const firing=l.age>=l.warn;ctx.fillStyle=firing?'#ff527acc':'#ff527a16';ctx.fillRect(l.x-l.width/2,0,l.width,H);if(!firing){ctx.strokeStyle='#ff7489';ctx.setLineDash([10,8]);ctx.strokeRect(l.x-l.width/2,0,l.width,H);ctx.setLineDash([]);ctx.fillStyle='#ff9aab';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText('!',l.x,H-38);}else{ctx.fillStyle='#ffe5ec';ctx.fillRect(l.x-3,0,6,H);}}
 for(const e of g.enemies)sprite(e.elite?'elite':'enemy',e.x,e.y,e.elite?4:3,{1:e.elite?'#da813f':'#567992',2:e.elite?'#ffcf7f':'#a3c8d9',3:'#ff8269'});
 if(g.boss){sprite('boss',g.boss.x,g.boss.y,g.stage===5?7:6,{1:color,2:'#e0ebf1'});ctx.fillStyle='#ff7489';ctx.fillRect(g.boss.x-6,g.boss.y+10,12,12);}
 ctx.fillStyle='#76ebff';for(const s of g.shots){ctx.fillRect(s.x-2,s.y-9,4,14);ctx.fillStyle='#defaff';ctx.fillRect(s.x-1,s.y-10,2,6);ctx.fillStyle='#76ebff';}
 for(const q of g.bullets){ctx.fillStyle='#ff866e';ctx.beginPath();ctx.arc(q.x,q.y,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd2a9';ctx.fillRect(q.x-1,q.y-2,2,3);}
 if(data.effects){for(const a of g.particles){ctx.globalAlpha=Math.min(1,a.life*2);ctx.fillStyle=a.color;ctx.fillRect(a.x,a.y,3,3);}ctx.globalAlpha=1;}
 }
 if(!g||p.inv<=0||Math.floor((g.t||0)*10)%2===0)sprite('player',p.x,p.y,4,{1:'#4093b4',2:'#c5f5ff',3:'#ffad57'});
 if(data.effects&&g?.specialFx>0){ctx.fillStyle='#70e6ff25';ctx.fillRect(0,0,W,H);ctx.fillStyle='#b6faffb0';ctx.fillRect(p.x-30,0,60,p.y);ctx.fillStyle='#eefcff';ctx.fillRect(p.x-5,0,10,p.y);}
 if(g){$('score').textContent=String(g.score).padStart(6,'0');$('stage').textContent=String(g.stage).padStart(2,'0')+' / 05';$('hp').textContent=Array.from({length:3},(_,i)=>i<p.hp?'◆':'◇').join(' ');$('hp').setAttribute('aria-label','체력 '+p.hp);$('gauge').value=g.gauge;$('gaugeText').textContent=g.gauge>=100?'READY':Math.floor(g.gauge)+'%';$('specialButton').disabled=g.gauge<100||g.status!=='playing'||paused;$('timer').textContent=String(Math.floor(g.t/60)).padStart(2,'0')+':'+String(Math.floor(g.t%60)).padStart(2,'0');$('bossHud').hidden=!g.boss;if(g.boss){const n=Math.max(0,Math.ceil(g.boss.hp/g.boss.maxHp*100));$('bossName').textContent=STAGES[g.stage-1].boss;$('bossPct').textContent=n+'%';$('bossHealth').value=n;}}
}
function frame(now){const dt=Math.min((now-last)/1000||0,0.05);last=now;if(!paused)clock+=dt;if(noticeTime>0&&!paused){noticeTime-=dt;if(noticeTime<=0)$('notice').textContent='';}if(game&&!paused&&!document.querySelector('dialog[open]'))game.step(dt,{left:pressed.has('a')||pressed.has('arrowleft'),right:pressed.has('d')||pressed.has('arrowright'),up:pressed.has('w')||pressed.has('arrowup'),down:pressed.has('s')||pressed.has('arrowdown'),special:pressed.has(' '),target:pointer});draw();requestAnimationFrame(frame);}
updateRoute();updateRecords();requestAnimationFrame(frame);
