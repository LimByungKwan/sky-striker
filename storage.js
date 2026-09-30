export const KEY='sky-striker-v1';
export const defaults=()=>({version:1,best:0,sound:false,effects:true,records:[],trialIndex:0});
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function validate(v){
 if(!v||v.version!==1||!finite(v.best,0,1e8)||typeof v.sound!=='boolean'||typeof v.effects!=='boolean'||!Array.isArray(v.records)||!Number.isInteger(v.trialIndex)||v.trialIndex<0||v.trialIndex>1e6)throw Error('invalid save');
 const records=v.records.slice(-200).filter(r=>r&&['campaign','trial'].includes(r.mode)&&[1,1.25].includes(r.speed)&&finite(r.score,0,1e8)&&finite(r.time,0,1e5)&&Number.isInteger(r.stage)&&r.stage>=1&&r.stage<=5&&['lost','won','trial-complete'].includes(r.status)&&Number.isInteger(r.seed)&&finite(r.kills,0,1e6)&&finite(r.specials,0,1e6)&&typeof r.date==='string'&&r.date.length<50);
 return {version:1,best:v.best,sound:v.sound,effects:v.effects,records,trialIndex:v.trialIndex};
}
export function load(storage){try{const raw=storage.getItem(KEY);return {data:raw===null?defaults():validate(JSON.parse(raw)),recovered:false};}catch{const data=defaults();try{storage.setItem(KEY,JSON.stringify(data));}catch{}return {data,recovered:true};}}
export function save(storage,data){try{storage.setItem(KEY,JSON.stringify(validate(data)));return true;}catch{return false;}}
