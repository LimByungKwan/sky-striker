// Pure simulation: rendering and browser storage stay outside this module.
export const W=480,H=680;
export const STAGES=[
 {name:'구름 전선',boss:'KESTREL',color:'#58ddff',hp:150},
 {name:'황혼 해협',boss:'TWIN FANG',color:'#ffbf69',hp:190},
 {name:'전파 폭풍',boss:'PRISM',color:'#ad8dff',hp:230},
 {name:'철의 요새',boss:'IRON WING',color:'#ff7489',hp:270},
 {name:'최후의 궤도',boss:'NEMESIS',color:'#f7de79',hp:380}
];
export function random(seed=1){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const hit=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
export class Game {
 constructor({mode='campaign',speed=1,seed=42,onEvent=()=>{}}={}){
  this.mode=mode;this.speed=speed;this.seed=seed;this.rng=random(seed);this.onEvent=onEvent;
  this.status='playing';this.stage=1;this.t=0;this.stageTime=0;this.phase='wave';this.score=0;this.kills=0;this.specials=0;
  this.player={x:W/2,y:H-95,hp:3,inv:1.5};this.gauge=100;
  this.enemies=[];this.bullets=[];this.shots=[];this.particles=[];this.lasers=[];this.boss=null;
  this.spawnClock=0.5;this.fireClock=0;this.transition=0;this.specialFx=0;this.specialHeld=false;this.maxObjects=0;
 }
 emit(type,data={}){this.onEvent({type,...data});}
 enemyShot(x,y,angle,speed=130){this.bullets.push({x,y,vx:Math.cos(angle)*speed*this.speed,vy:Math.sin(angle)*speed*this.speed,r:4,life:9});}
 fan(x,y,n,spread,speed=130,angle=Math.PI/2){for(let i=0;i<n;i++)this.enemyShot(x,y,angle+(n===1?0:(i/(n-1)-.5)*spread),speed);}
 ring(x,y,n,speed,offset=0){for(let i=0;i<n;i++)this.enemyShot(x,y,i/n*Math.PI*2+offset,speed);}
 aim(x,y){return Math.atan2(this.player.y-y,this.player.x-x);}
 burst(x,y,color,n=12){for(let i=0;i<n;i++){const a=this.rng()*Math.PI*2,s=25+this.rng()*110;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+this.rng()*.4,color});}}
 damage(){if(this.player.inv>0)return;this.player.hp--;this.player.inv=1.4;this.emit('hurt');this.burst(this.player.x,this.player.y,'#ff7489');if(this.player.hp<=0)this.finish('lost');}
 finish(status){if(this.status!=='playing')return;this.status=status;this.emit('end',{result:this.result()});}
 result(){return {mode:this.mode,speed:this.speed,seed:this.seed,score:this.score,time:+this.t.toFixed(2),stage:this.stage,status:this.status,kills:this.kills,specials:this.specials};}
 special(){if(this.gauge<100||this.status!=='playing')return false;this.gauge=0;this.specials++;this.specialFx=.65;this.player.inv=Math.max(this.player.inv,1);this.bullets=[];this.lasers=[];
  for(const e of this.enemies){e.hp-=70;if(e.hp<=0)this.kill(e);}this.enemies=this.enemies.filter(e=>e.hp>0);
  if(this.boss){this.boss.hp-=65;if(this.boss.hp<=0)this.killBoss();}this.emit('special');return true;
 }
 kill(e){this.kills++;this.score+=e.elite?350:100;this.gauge=Math.min(100,this.gauge+(e.elite?22:10));this.burst(e.x,e.y,e.elite?'#ffbf69':'#58ddff');this.emit('kill');}
 spawn(){const elite=this.stageTime>5&&this.rng()<.14+this.stage*.04;this.enemies.push({x:35+this.rng()*(W-70),y:-30,baseX:0,hp:elite?22:7,elite,r:elite?21:15,age:0,shot:elite?2.4:2.8,vy:elite?42:62+this.stage*8,wave:this.rng()*6.28});}
 spawnBoss(){const def=STAGES[this.stage-1];this.boss={x:W/2,y:-75,age:0,hp:def.hp,maxHp:def.hp,shot:1.5,special:4.5,phase2:false,r:this.stage===5?49:40};this.phase='boss';this.enemies=[];this.emit('boss',{name:def.boss});}
 killBoss(){this.score+=this.stage===5?5000:1500;this.gauge=Math.min(100,this.gauge+50);this.burst(this.boss.x,this.boss.y,STAGES[this.stage-1].color,40);this.boss=null;this.bullets=[];this.lasers=[];
  if(this.stage===5)this.finish('won');else{this.phase='transition';this.transition=2.2;this.player.inv=2.5;this.player.hp=Math.min(3,this.player.hp+1);this.emit('stage-clear');}
 }
 bossAttack(b){const fast=b.phase2;switch(this.stage){
  case 1:this.fan(b.x,b.y+30,5,.95,120);break;
  case 2:this.fan(b.x-30,b.y+20,3,.55,135);this.fan(b.x+30,b.y+20,3,.55,135);break;
  case 3:this.ring(b.x,b.y,12,105,b.age*.3);break;
  case 4:this.fan(b.x,b.y+30,7,1.45,135,this.aim(b.x,b.y));break;
  case 5:this.fan(b.x,b.y+35,fast?9:7,1.5,fast?175:145);if(fast)this.ring(b.x,b.y,10,120,b.age);break;
 }b.shot=this.stage===5?(fast ? .92 : 1.3):(fast?1.05:1.45);}
 bossSpecial(b){const positions=this.stage===1?[this.player.x]:this.stage===2?[b.x-70,b.x+70]:this.stage===3?[70,240,410]:this.stage===4?[this.player.x,b.x]:[90,240,390];
  for(const x of positions)this.lasers.push({x:Math.max(28,Math.min(W-28,x)),age:0,width:this.stage===5?35:28,warn:1.25,duration:.7});b.special=b.phase2?4:5;this.emit('warning');}
 step(dt,input={}){
  if(this.status!=='playing')return;dt=Math.max(0,Math.min(dt,.05));this.t+=dt;this.stageTime+=dt;
  const p=this.player;p.inv=Math.max(0,p.inv-dt);this.specialFx=Math.max(0,this.specialFx-dt);
  let dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0);const norm=Math.hypot(dx,dy)||1;
  if(input.target){const tx=input.target.x-p.x,ty=input.target.y-p.y,d=Math.hypot(tx,ty);p.x+=tx/(d||1)*Math.min(d,300*dt);p.y+=ty/(d||1)*Math.min(d,300*dt);}else{p.x+=dx/norm*290*dt;p.y+=dy/norm*290*dt;}
  p.x=Math.max(19,Math.min(W-19,p.x));p.y=Math.max(60,Math.min(H-24,p.y));
  if(input.special&&!this.specialHeld)this.special();this.specialHeld=!!input.special;
  this.fireClock-=dt;if(this.fireClock<=0){this.fireClock=.16;for(const x of [-9,9])this.shots.push({x:p.x+x,y:p.y-21,vy:-530});}
  if(this.phase==='wave'){this.spawnClock-=dt;if(this.spawnClock<=0){this.spawn();this.spawnClock=.85-this.stage*.06;}if(this.mode==='campaign'&&this.stageTime>=20)this.spawnBoss();}
  if(this.phase==='transition'){this.transition-=dt;if(this.transition<=0){this.stage++;this.stageTime=0;this.phase='wave';this.spawnClock=.6;this.emit('stage');}}
  for(const e of this.enemies){e.age+=dt;e.y+=e.vy*dt;e.x+=Math.sin(e.age*1.8+e.wave)*24*dt;e.x=Math.max(e.r,Math.min(W-e.r,e.x));e.shot-=dt;
   if(e.shot<=0){if(e.elite){this.fan(e.x,e.y+15,5,1.3,125,this.aim(e.x,e.y));e.shot=2.8;this.emit('elite');}else{this.enemyShot(e.x,e.y+12,this.aim(e.x,e.y),100+this.stage*5);e.shot=3.1;}}
   if(hit(e,p,e.r+10)){this.damage();e.hp=0;this.burst(e.x,e.y,'#ff7489');}
  }
  const b=this.boss;if(b){b.age+=dt;b.y=Math.min(110,b.y+75*dt);b.x=W/2+Math.sin(b.age*.65)*125;
   if(this.stage===5&&b.hp<=b.maxHp/2&&!b.phase2){b.phase2=true;this.emit('phase2');}
   if(b.y>=100){b.shot-=dt;b.special-=dt;if(b.shot<=0)this.bossAttack(b);if(b.special<=0)this.bossSpecial(b);}if(hit(b,p,b.r+10))this.damage();}
  for(const s of this.shots){s.y+=s.vy*dt;for(const e of this.enemies){if(e.hp>0&&hit(s,e,e.r+4)){e.hp-=4;s.y=-100;if(e.hp<=0)this.kill(e);break;}}
   if(this.boss&&s.y>0&&hit(s,this.boss,this.boss.r+4)){this.boss.hp-=4;s.y=-100;if(this.boss.hp<=0)this.killBoss();}}
  for(const q of this.bullets){q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;if(hit(q,p,12)){this.damage();q.life=0;}}
  for(const l of this.lasers){l.age+=dt;if(l.age>=l.warn&&Math.abs(p.x-l.x)<l.width/2+10)this.damage();}
  for(const a of this.particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;}
  this.enemies=this.enemies.filter(e=>e.hp>0&&e.y<H+35);this.shots=this.shots.filter(s=>s.y>-20);
  this.bullets=this.bullets.filter(q=>q.life>0&&q.x>-30&&q.x<W+30&&q.y>-40&&q.y<H+30);
  this.lasers=this.lasers.filter(l=>l.age<l.warn+l.duration);this.particles=this.particles.filter(a=>a.life>0);
  this.maxObjects=Math.max(this.maxObjects,this.enemies.length+this.shots.length+this.bullets.length+this.particles.length);
  if(this.mode==='trial'&&this.t>=30)this.finish('trial-complete');
 }
}
