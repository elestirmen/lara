import type {Attempt,Progress,SkillState} from './types';
export const STORAGE_KEY='lara-progress-v1';
export const emptyProgress=():Progress=>({version:1,skills:{},completed:{},attempts:[],stars:0,sound:true});
export function difficulty(s?:SkillState):1|2|3{return !s||s.score<40?1:s.score<70?2:3}
export function level(score:number){return score<40?'Başlangıç':score<70?'Gelişiyor':score<90?'İyi':'Çok iyi'}
export function recordAttempt(p:Progress,a:Attempt):Progress{
 if(p.attempts.some(x=>x.id===a.id))return p;
 const old=p.skills[a.skill]??{score:0,attempts:0,correct:0,streak:0,due:a.at,lastSeen:a.at};
 const success=a.correct&&!a.assisted; const score=Math.max(0,Math.min(100,old.score+(a.selfReport?0:success?12:a.correct?3:-8)));
 const days=success?(score>=70?7:3):1;
 const next={score,attempts:old.attempts+(a.selfReport?0:1),correct:old.correct+(success&&!a.selfReport?1:0),streak:success?old.streak+1:0,lastSeen:a.at,due:new Date(new Date(a.at).getTime()+days*86400000).toISOString()};
 return {...p,skills:{...p.skills,[a.skill]:next},attempts:[...p.attempts.slice(-4999),a],stars:p.stars+(success&&!a.selfReport?1:0),lastLesson:a.lessonId};
}
export function completeLesson(p:Progress,id:string,correct:number,total:number,at=new Date().toISOString()):Progress{return {...p,completed:{...p.completed,[id]:{at,correct,total}},lastLesson:id}}
/** Oyun sonucu müfredat puanına karışmaz; yalnız oynama sayısı ve en iyi sonuç tutulur. */
export function recordGame(p:Progress,id:string,score:number,better:'low'|'high',at=new Date().toISOString()):Progress{const old=p.games?.[id],best=!old?score:better==='low'?Math.min(old.best,score):Math.max(old.best,score);return {...p,games:{...p.games,[id]:{plays:(old?.plays??0)+1,best,last:at}}}}
export function dueSkills(p:Progress,now=Date.now()){return Object.entries(p.skills).filter(([,s])=>s.attempts>0&&new Date(s.due).getTime()<=now).sort((a,b)=>a[1].score-b[1].score).map(([code])=>code)}
export function checkAnswer(answer:string,expected:string,alternatives:string[]=[]){const normalized=answer.trim().normalize('NFC');return [expected,...alternatives].some(value=>normalized===value.trim().normalize('NFC'))}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const finite=(n:unknown,min=0,max=1000000)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const date=(s:unknown)=>typeof s==='string'&&s.length<40&&!Number.isNaN(Date.parse(s));
const safeKey=(s:string)=>/^[\p{L}0-9._-]{1,100}$/u.test(s)&&!['__proto__','constructor','prototype'].includes(s);
export function parseBackup(raw:string):Progress{
 if(raw.length>2500000)throw new Error('Yedek dosyası çok büyük.');
 const x:unknown=JSON.parse(raw);if(!record(x)||x.version!==1||!record(x.skills)||!record(x.completed)||!Array.isArray(x.attempts)||x.attempts.length>5000||!finite(x.stars)||typeof x.sound!=='boolean')throw new Error('Bu dosya geçerli bir Lara yedeği değil.');
 for(const [k,s] of Object.entries(x.skills)){if(!safeKey(k)||!record(s)||!finite(s.score,0,100)||!finite(s.attempts)||!finite(s.correct)||Number(s.correct)>Number(s.attempts)||!finite(s.streak)||!date(s.due)||!date(s.lastSeen))throw new Error('Beceri kaydı geçersiz.');}
 for(const [k,c] of Object.entries(x.completed)){if(!safeKey(k)||!record(c)||!date(c.at)||!finite(c.total,1,100)||!finite(c.correct,0,Number(c.total)))throw new Error('Ders kaydı geçersiz.');}
 for(const a of x.attempts){if(!record(a)||typeof a.id!=='string'||a.id.length>150||typeof a.lessonId!=='string'||!safeKey(a.lessonId)||typeof a.skill!=='string'||!safeKey(a.skill)||!date(a.at)||typeof a.correct!=='boolean'||typeof a.assisted!=='boolean'||typeof a.selfReport!=='boolean')throw new Error('Etkinlik kaydı geçersiz.');}
 if(x.lastLesson!==undefined&&(typeof x.lastLesson!=='string'||!safeKey(x.lastLesson)))throw new Error('Son ders geçersiz.');
 if(x.games!==undefined){if(!record(x.games))throw new Error('Oyun kaydı geçersiz.');for(const [k,g] of Object.entries(x.games)){if(!safeKey(k)||!record(g)||!finite(g.plays)||!finite(g.best)||!date(g.last))throw new Error('Oyun kaydı geçersiz.');}}
 return {version:1,skills:x.skills as unknown as Progress['skills'],completed:x.completed as unknown as Progress['completed'],attempts:x.attempts as Attempt[],stars:x.stars as number,sound:x.sound as boolean,lastLesson:x.lastLesson as string|undefined,...(x.games?{games:x.games as unknown as Progress['games']}:{})};
}
export function exportProgress(p:Progress){return JSON.stringify(p,null,2)}
