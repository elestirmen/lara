import {englishLessons} from '@/content/english/lessons';
import {rng,shuffle} from './random';
import {withSuffix} from './turkish';

/* Eşini bul: her destede 6 eş, 12 kart. */
export type MemoryDeck='english'|'place'|'add';
export const memoryDecks:{id:MemoryDeck;title:string;icon:string;help:string}[]=[{id:'english',title:'İngilizce kelimeler',icon:'🔤',help:'Resmi ve İngilizce kelimesini eşleştir.'},{id:'place',title:'Onluk ve birlik',icon:'🧱',help:'Onluk-birlik yazısını sayısıyla eşleştir.'},{id:'add',title:'Toplama',icon:'➕',help:'Toplama işlemini sonucuyla eşleştir.'}];
export interface MemoryCard {id:number;pair:string;face:string;lang?:string;picture?:boolean}
// Resmi başka bir kelimeyle karışabilecek kartlar (🧒 öğrenci, 🙋 hoşça kal) desteye girmez.
const unclear=new Set(['student','goodbye']);
export function memoryDeck(deck:MemoryDeck,seed:number,pairs=6):MemoryCard[]{
 const random=rng(seed),int=(a:number,b:number)=>a+Math.floor(random()*(b-a+1)),sides:Omit<MemoryCard,'id'>[][]=[];
 if(deck==='english')for(const v of shuffle(englishLessons.flatMap(l=>l.vocabulary??[]).filter(v=>!unclear.has(v.word)),random).slice(0,pairs))sides.push([{pair:v.word,face:v.picture,picture:true},{pair:v.word,face:v.word,lang:'en'}]);
 else{const used=new Set<number>();while(sides.length<pairs){const a=int(deck==='place'?1:2,9),b=int(deck==='place'?1:2,9),n=deck==='place'?a*10+b:a+b;if(used.has(n))continue;used.add(n);sides.push([{pair:String(n),face:deck==='place'?`${a} onluk ${b} birlik`:`${a} + ${b}`},{pair:String(n),face:String(n)}])}}
 return shuffle(sides.flat(),random).map((card,id)=>({...card,id}));
}

/* Balon patlat: 8 tur, her turda 4 balon. */
export type BalloonKind='add'|'place'|'skip'|'subtract'|'compare';
export interface BalloonRound {kind:BalloonKind;prompt:string;answer:number;options:number[];hint:string}
export function balloonRounds(seed:number,count=8):BalloonRound[]{
 const random=rng(seed),int=(a:number,b:number)=>a+Math.floor(random()*(b-a+1)),kinds:BalloonKind[]=['add','place','skip','subtract','compare'];
 const withOptions=(answer:number,near:number[])=>shuffle([answer,...shuffle([...new Set(near.filter(n=>n>=0&&n<=100&&n!==answer))],random).slice(0,3)],random);
 return Array.from({length:count},(_,i):BalloonRound=>{const kind=kinds[i%kinds.length];
  if(kind==='add'){const a=int(3,9),b=int(2,9),s=a+b;return {kind,prompt:`${a} + ${b} = ?`,answer:s,options:withOptions(s,[s+1,s-1,s+2,s-2,s+10]),hint:s>10?`${withSuffix(a,'e')} önce ${10-a} ekle ve 10 yap. Sonra kalan ${withSuffix(b-(10-a),'i')} ekle.`:`${withSuffix(a,'den')} başla, ${b} adım ileri say.`}}
  if(kind==='subtract'){const a=int(11,18),b=int(2,9),d=a-b;return {kind,prompt:`${a} − ${b} = ?`,answer:d,options:withOptions(d,[d+1,d-1,d+2,d-2,a+b]),hint:`${withSuffix(a,'den')} ${b} adım geri say.`}}
  if(kind==='place'){const t=int(1,9),o=int(1,9),n=t*10+o;return {kind,prompt:`${t} onluk ${o} birlik kaç eder?`,answer:n,options:withOptions(n,[o*10+t,n+10,n-10,n+1,n-1]),hint:`${t} onluk ${t*10} eder. ${t*10} ile ${o} birliği birleştir.`}}
  if(kind==='skip'){const step=[2,5,10][int(0,2)],k=int(1,4),seq=[k,k+1,k+2].map(x=>x*step),n=(k+3)*step;return {kind,prompt:`${seq.join(', ')}, … Sıradaki sayı hangisi?`,answer:n,options:withOptions(n,[n+step,n-1,n+1,n+2,n-step*2]),hint:`Her seferinde ${step} ekleniyor: ${seq[2]} + ${step} = ?`}}
  const numbers=new Set<number>();while(numbers.size<4)numbers.add(int(11,99));const options=shuffle([...numbers],random);
  return {kind,prompt:'En büyük sayıyı taşıyan balonu patlat.',answer:Math.max(...options),options,hint:'Önce onluklara bak. Onluğu büyük olan sayı daha büyüktür.'};
 });
}

/* Piko’yu eve götür: 5×5 bahçe, [sütun, satır]. */
export type Step='up'|'down'|'left'|'right';
export type Cell=[number,number];
export interface CodeLevel {start:Cell;goal:Cell;rocks:Cell[];solution:Step[];hint:string}
export const codeSize=5,codeMaxSteps=16;
export const codeLevels:CodeLevel[]=[
 {start:[0,2],goal:[3,2],rocks:[],solution:['right','right','right'],hint:'Ev aynı sırada, sağ tarafta. Kaç kare sağa gitmeli?'},
 {start:[0,4],goal:[2,2],rocks:[],solution:['up','up','right','right'],hint:'Önce yukarı çık, sonra sağa git.'},
 {start:[0,0],goal:[4,0],rocks:[[2,0]],solution:['down','right','right','right','right','up'],hint:'Taşın altından dolaş: bir aşağı, sağa, sonra bir yukarı.'},
 {start:[0,4],goal:[4,0],rocks:[[1,3],[2,2],[3,1]],solution:['right','right','right','right','up','up','up','up'],hint:'Taşlar çapraz dizilmiş. Bahçenin kenarından gitmeyi dene.'},
 {start:[2,4],goal:[2,0],rocks:[[1,2],[2,2],[3,2]],solution:['left','left','up','up','up','up','right','right'],hint:'Ortadaki taş duvarın bir ucundan dolaş.'},
 {start:[0,0],goal:[4,4],rocks:[[1,0],[1,1],[1,2],[3,2],[3,3],[3,4]],solution:['down','down','down','right','right','up','up','right','right','down','down','down'],hint:'Yol önce aşağı iner, sonra yukarı kıvrılır, en sonda yine aşağı iner.'}
];
const moves:Record<Step,Cell>={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
export function runProgram(level:CodeLevel,program:Step[]):{path:Cell[];result:'goal'|'edge'|'rock'|'short'}{
 let [x,y]=level.start;const path:Cell[]=[[x,y]];
 for(const step of program){const nx=x+moves[step][0],ny=y+moves[step][1];
  if(nx<0||ny<0||nx>=codeSize||ny>=codeSize)return {path,result:'edge'};
  if(level.rocks.some(([rx,ry])=>rx===nx&&ry===ny))return {path,result:'rock'};
  x=nx;y=ny;path.push([x,y]);if(x===level.goal[0]&&y===level.goal[1])return {path,result:'goal'};
 }
 return {path,result:'short'};
}

/* Harf treni: 6 kelime, kısadan uzuna. */
export const spellWords:[string,string][]=[['top','⚽'],['kuş','🐦'],['süt','🥛'],['kedi','🐈'],['elma','🍎'],['balık','🐟'],['güneş','☀️'],['çiçek','🌸'],['ağaç','🌳'],['kalem','✏️'],['kitap','📚'],['bulut','☁️'],['yıldız','⭐'],['köpek','🐕'],['ekmek','🍞'],['peynir','🧀'],['şemsiye','☂️'],['uçurtma','🪁']];
export interface SpellRound {word:string;picture:string;letters:{id:number;ch:string}[]}
export function spellRounds(seed:number,count=6):SpellRound[]{
 const random=rng(seed);
 return shuffle(spellWords,random).slice(0,count).sort((a,b)=>[...a[0]].length-[...b[0]].length).map(([word,picture])=>{let letters=shuffle([...word].map((ch,id)=>({id,ch})),random);if(letters.map(l=>l.ch).join('')===word)letters=[...letters.slice(1),letters[0]];return {word,picture,letters}});
}
/** Doğru başlangıcı korur ve sıradaki doğru harfi ekler. */
export function spellHint(round:SpellRound,built:number[]){
 const target=[...round.word],chars=built.map(id=>round.letters.find(l=>l.id===id)!.ch);let keep=0;while(keep<chars.length&&chars[keep]===target[keep])keep++;
 const prefix=built.slice(0,keep),next=round.letters.find(l=>l.ch===target[keep]&&!prefix.includes(l.id));return next?[...prefix,next.id]:prefix;
}
