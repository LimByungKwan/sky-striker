// Original canvas scenery. Fixed layouts keep visual animation out of game RNG.
import {W,H,random} from './engine.js';
const rng=random(913),dots=Array.from({length:95},()=>({x:rng()*W,y:rng()*H,size:rng()>0.85?2:1,depth:.4+rng()*.8}));
const clouds=Array.from({length:8},(_,i)=>({x:(i%2)*270-60+rng()*90,y:i*125,size:45+rng()*30}));
const wrap=(n,span)=>((n%span)+span)%span;
function blockCloud(ctx,x,y,size,color){ctx.fillStyle=color;ctx.fillRect(x+size*.25,y-size*.3,size*.8,size*.55);ctx.fillRect(x,y,size*1.6,size*.45);ctx.fillRect(x+size*.35,y+size*.35,size,size*.2);}
export function drawBackground(ctx,stage,time,{effects=true,phase2=false}={}){
 const palettes=[['#0c2638','#153c50'],['#291f35','#103744'],['#13162f','#292147'],['#131a22','#202c36'],['#130e2b','#201339']];
 const [top,bottom]=palettes[stage-1]||palettes[0];ctx.save();const base=ctx.createLinearGradient(0,0,0,H);base.addColorStop(0,top);base.addColorStop(1,bottom);ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
 if(stage===1){
  // Broken cloud banks, separated by an open flight lane.
  for(const c of clouds){const y=wrap(c.y+time*22,H+170)-85;blockCloud(ctx,c.x,y,c.size,'#214b62');blockCloud(ctx,c.x+18,y+14,c.size*.6,'#29556b');}
  ctx.fillStyle='#426277';for(let i=0;i<9;i++)ctx.fillRect(220+(i%3)*18,wrap(i*83+time*30,H),1,5);
 }else if(stage===2){
  // Twilight sea: long horizontal wave marks and coastal islands.
  for(let i=0;i<32;i++){const y=wrap(i*26+time*36,H+30);ctx.fillStyle=i%4===0?'#36505a':'#244452';ctx.fillRect((i*73)%W,y,44+(i%5)*18,2);}
  ctx.fillStyle='#644f50';ctx.fillRect(0,wrap(110+time*15,H+180)-90,72,110);ctx.fillStyle='#37434a';ctx.fillRect(0,wrap(110+time*15,H+180)-78,58,90);
  ctx.fillStyle='#665556';ctx.fillRect(W-64,wrap(540+time*15,H+180)-90,64,130);ctx.fillStyle='#38454b';ctx.fillRect(W-50,wrap(540+time*15,H+180)-78,50,110);
  ctx.fillStyle='#886947';for(let i=0;i<8;i++)ctx.fillRect(205+i*10,wrap(i*70+time*36,H),5,2);
 }else if(stage===3){
  // Dense violet storm bands and steady rain; no bright lightning flashes.
  for(const c of clouds){const y=wrap(c.y+time*30,H+190)-95;blockCloud(ctx,c.x-20,y,c.size*1.8,'#262443');blockCloud(ctx,c.x+25,y+24,c.size,'#30294e');}
  ctx.strokeStyle='#4b4969';ctx.lineWidth=1;ctx.beginPath();for(const d of dots.slice(0,50)){const y=wrap(d.y+time*100,H);ctx.moveTo(d.x,y);ctx.lineTo(d.x-3,y+9);}ctx.stroke();
 }else if(stage===4){
  // Scrolling industrial roofs, service lanes and dim perimeter lights.
  const shift=wrap(time*30,170);ctx.fillStyle='#35404a';ctx.fillRect(75,0,2,H);ctx.fillRect(402,0,2,H);
  for(let row=-1;row<5;row++){const y=row*170+shift;for(const x of [7,93,294,410]){const width=x===93||x===294?85:63;ctx.fillStyle='#293641';ctx.fillRect(x,y,width,120);ctx.fillStyle='#1c2630';ctx.fillRect(x+6,y+7,width-12,106);ctx.strokeStyle='#42505a';ctx.strokeRect(x+11,y+12,width-22,96);ctx.fillStyle='#33434f';for(let i=0;i<3;i++)ctx.fillRect(x+17,y+24+i*25,width-34,10);ctx.fillStyle='#78534f';ctx.fillRect(x+8,y+4,4,4);ctx.fillRect(x+width-12,y+4,4,4);}}
  ctx.fillStyle='#526270';for(let i=0;i<14;i++)ctx.fillRect(239,wrap(i*58+time*30,H),2,16);
 }else{
  // Orbital space with a muted planet limb and layered stars.
  const nebula=ctx.createRadialGradient(385,170,20,330,230,400);nebula.addColorStop(0,phase2?'#42203c':'#34244f');nebula.addColorStop(1,'#16102c00');ctx.fillStyle=nebula;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#302740';ctx.beginPath();ctx.arc(-45,470,190,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6a5275';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-45,470,191,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#49384f';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(-45,450+i*22,175,24,0,0,Math.PI*2);ctx.stroke();}
  for(const d of dots){ctx.fillStyle=d.size===2?'#9b86ae':'#645774';ctx.fillRect(d.x,wrap(d.y+time*15*d.depth,H),d.size,d.size);}
  if(effects){ctx.strokeStyle='#5b4568';ctx.beginPath();for(let i=0;i<3;i++){const y=wrap(i*250+time*26,H+80)-40;ctx.moveTo(300+i*50,y);ctx.lineTo(290+i*50,y+28);}ctx.stroke();}
 }
 // Quiet edge guides leave bullets and laser warnings in the foreground.
 ctx.strokeStyle=['#36586c','#4b5861','#4d405f','#4b5660','#584462'][stage-1];ctx.lineWidth=1;ctx.setLineDash([5,18]);for(const x of [24,W-24]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}ctx.setLineDash([]);ctx.restore();
}
