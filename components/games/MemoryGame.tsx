'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {memoryDeck,memoryDecks,type MemoryDeck} from '@/lib/games';
import {newSeed} from '@/lib/random';
import {sfx} from '@/lib/audio';
import GameFinish from './GameFinish';
import {Art} from '../Illustration';
export default function MemoryGame({sound,onFinish}:{sound:boolean;onFinish:(moves:number)=>void}){
 const [deck,setDeck]=useState<MemoryDeck>('english'),[seed,setSeed]=useState(newSeed),[open,setOpen]=useState<number[]>([]),[found,setFound]=useState<string[]>([]),[moves,setMoves]=useState(0),[message,setMessage]=useState(''),[finished,setFinished]=useState(false);
 const cards=useMemo(()=>memoryDeck(deck,seed),[deck,seed]),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),pairs=cards.length/2;
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 function restart(next=deck){clearTimeout(timer.current);setDeck(next);setSeed(newSeed());setOpen([]);setFound([]);setMoves(0);setMessage('');setFinished(false)}
 function flip(i:number){
  if(open.length===2||open.includes(i)||found.includes(cards[i].pair))return;
  const next=[...open,i];setOpen(next);if(next.length<2){sfx(sound,'place');return}
  const count=moves+1,[a,b]=next.map(j=>cards[j]);setMoves(count);
  if(a.pair===b.pair){const all=[...found,a.pair];setFound(all);setOpen([]);setMessage('Eşini buldun! 🎉');sfx(sound,'correct');if(all.length===pairs){onFinish(count);timer.current=setTimeout(()=>{setFinished(true);sfx(sound,'finish')},900)}}
  else{setMessage('Bu iki kart eş değil. Yerlerini aklında tut!');sfx(sound,'wrong');timer.current=setTimeout(()=>setOpen([]),1100)}
 }
 if(finished)return <GameFinish title="Bütün eşleri buldun!" text={`${moves} hamlede ${pairs} eşi buldun. Hafızan harika çalışıyor.`} onAgain={()=>restart()}/>;
 return <div className="memory-game">
  <div className="game-options" role="group" aria-label="Kart destesi">{memoryDecks.map(d=><button key={d.id} className={deck===d.id?'selected':''} aria-pressed={deck===d.id} onClick={()=>restart(d.id)}><span aria-hidden="true">{d.icon}</span> {d.title}</button>)}</div>
  <p className="game-status" aria-live="polite"><span>{message||memoryDecks.find(d=>d.id===deck)!.help}</span><b>{moves} hamle · {found.length} / {pairs} eş</b></p>
  <div className="memory-grid">{cards.map((c,i)=>{const isFound=found.includes(c.pair),shown=isFound||open.includes(i);return <button key={`${seed}-${c.id}`} data-pair={c.pair} lang={shown?c.lang:undefined} className={`memory-card ${shown?'is-open':''} ${isFound?'is-found':''} ${c.picture?'is-picture':''}`} aria-label={shown?`${c.face}${isFound?', eşi bulundu':''}`:`${i+1}. kart, kapalı`} onClick={()=>flip(i)}><span className="memory-back" aria-hidden="true">?</span><span className="memory-face" aria-hidden="true">{c.art?<Art name={c.art} size={72}/>:c.face}</span></button>})}</div>
 </div>;
}
