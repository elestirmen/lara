'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Delete,Lightbulb,Play,RotateCcw} from 'lucide-react';
import {codeLevels,codeMaxSteps,codeSize,runProgram,type Cell,type Step} from '@/lib/games';
import {sfx} from '@/lib/audio';
import {Piko} from '../Illustration';
import GameFinish from './GameFinish';
const arrows:Record<Step,[string,string]>={up:['↑','Yukarı'],down:['↓','Aşağı'],left:['←','Sola'],right:['→','Sağa']};
const results={goal:'Piko evine ulaştı! Harika bir yol tarifi.',edge:'Piko bahçenin dışına çıkamaz. Adımlarını kontrol et.',rock:'Önünde bir taş var. Başka bir yol dene.',short:'Piko henüz evde değil. Birkaç adım daha ekle.'};
const place=([x,y]:Cell)=>`${x+1}. sütun ${y+1}. satır`;
export default function CodeGame({sound,onFinish,solved}:{sound:boolean;onFinish:(level:number)=>void;solved:number}){
 const first=Math.min(solved,codeLevels.length-1),[level,setLevel]=useState(first),[best,setBest]=useState(solved),[program,setProgram]=useState<Step[]>([]),[pos,setPos]=useState<Cell>(codeLevels[first].start),[running,setRunning]=useState(false),[result,setResult]=useState<keyof typeof results|''>(''),[hint,setHint]=useState(false);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]),L=codeLevels[level],last=level===codeLevels.length-1;
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 function stop(next=level){timers.current.forEach(clearTimeout);timers.current=[];setRunning(false);setResult('');setPos(codeLevels[next].start)}
 function choose(next:number){setLevel(next);setProgram([]);setHint(false);stop(next)}
 function edit(next:Step[]){sfx(sound,next.length<program.length?'remove':'place');setProgram(next);stop()}
 function run(){
  const {path,result:r}=runProgram(L,program),delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:380;
  if(r==='goal'){setBest(b=>Math.max(b,level+1));onFinish(level+1)}
  stop();setRunning(true);
  path.forEach((cell,i)=>timers.current.push(setTimeout(()=>{setPos(cell);if(delay&&i)sfx(sound,'hop')},i*delay)));
  timers.current.push(setTimeout(()=>{setRunning(false);setResult(r);sfx(sound,r!=='goal'?'wrong':last?'finish':'correct')},path.length*delay));
 }
 if(result==='goal'&&last)return <GameFinish title="Bütün bölümleri bitirdin!" text="Piko altı bahçede de evinin yolunu buldu. Yol tarifi yazmak, kodlamanın ilk adımıdır." onAgain={()=>choose(0)}/>;
 return <div className="code-game">
  <div className="game-options code-levels" role="group" aria-label="Bölümler">{codeLevels.map((_,i)=><button key={i} disabled={i>best||running} className={i===level?'selected':''} aria-pressed={i===level} onClick={()=>choose(i)}>{i<best?'✓ ':''}{i+1}. bölüm</button>)}</div>
  <div className="code-layout">
   <div className="code-garden" role="img" aria-label={`Bahçe haritası, ${codeSize} sütun ve ${codeSize} satır. Piko ${place(pos)}, ev ${place(L.goal)}.${L.rocks.length?` Taşlar: ${L.rocks.map(place).join(', ')}.`:''}`}>
    {Array.from({length:codeSize*codeSize},(_,i)=>{const x=i%codeSize,y=Math.floor(i/codeSize),rock=L.rocks.some(([rx,ry])=>rx===x&&ry===y),home=L.goal[0]===x&&L.goal[1]===y;return <span key={i} className={`code-cell ${rock?'is-rock':''} ${home?'is-home':''}`}>{rock?'🪨':home?'🏡':''}</span>})}
    <span className="code-piko" style={{transform:`translate(${pos[0]*100}%,${pos[1]*100}%)`}}><Piko size={44}/></span>
   </div>
   <div className="code-panel">
    <p className="tool-help">Piko’ya adım adım yol tarifi yaz. Her ok bir kare ilerletir.</p>
    <div className="code-arrows" role="group" aria-label="Ok kartları">{(['up','left','right','down'] as Step[]).map(s=><button key={s} disabled={running||program.length>=codeMaxSteps} onClick={()=>edit([...program,s])}><b aria-hidden="true">{arrows[s][0]}</b> {arrows[s][1]}</button>)}</div>
    <ol className="code-program" aria-label="Yol tarifi">{program.length?program.map((s,i)=><li key={i}><button disabled={running} aria-label={`${i+1}. adım: ${arrows[s][1]}. Silmek için dokun.`} onClick={()=>edit(program.filter((_,j)=>j!==i))}><small aria-hidden="true">{i+1}</small><span aria-hidden="true">{arrows[s][0]}</span></button></li>):<li className="code-empty">Ok kartlarına dokunarak yol tarifi yaz.</li>}</ol>
    <p className="code-steps">{program.length} / {codeMaxSteps} adım · Silmek istediğin adıma dokun.</p>
    <div className="tool-actions"><button disabled={running||!program.length} onClick={()=>edit(program.slice(0,-1))}><Delete size={18}/> Son adımı sil</button><button disabled={running||!program.length} onClick={()=>edit([])}><RotateCcw size={18}/> Temizle</button><button disabled={hint} onClick={()=>setHint(true)}><Lightbulb size={18}/> İpucu</button><button className="primary" disabled={running||!program.length} onClick={run}><Play size={18}/> Başlat</button></div>
   </div>
  </div>
  <div className={`feedback ${result==='goal'?'correct':''}`} aria-live="polite">{result?<><span>{result==='goal'?'🏡':'🪨'}</span><div><strong>{results[result]}</strong>{hint&&result!=='goal'&&<p>{L.hint}</p>}</div></>:hint?<><span>💡</span><div><strong>İpucu</strong><p>{L.hint}</p></div></>:null}</div>
  {result==='goal'&&<div className="stage-actions"><button className="primary" onClick={()=>choose(level+1)}>Sonraki bölüm <ArrowRight size={18}/></button></div>}
 </div>;
}
