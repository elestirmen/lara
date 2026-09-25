'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {balloonRounds} from '@/lib/games';
import {newSeed} from '@/lib/random';
import {tone} from '@/lib/audio';
import GameFinish from './GameFinish';
export default function BalloonGame({sound,onFinish}:{sound:boolean;onFinish:(firstTry:number)=>void}){
 const [seed,setSeed]=useState(newSeed),[index,setIndex]=useState(0),[wrong,setWrong]=useState<number[]>([]),[popped,setPopped]=useState(false),[score,setScore]=useState(0),[done,setDone]=useState(false);
 const rounds=useMemo(()=>balloonRounds(seed),[seed]),round=rounds[index],heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(index>0)heading.current?.focus()},[index]);
 function pick(value:number){if(popped||wrong.includes(value))return;if(value===round.answer){setPopped(true);if(!wrong.length)setScore(s=>s+1);tone(sound,880,.12)}else{setWrong([...wrong,value]);tone(sound,196,.12)}}
 function next(){if(index+1<rounds.length){setIndex(index+1);setWrong([]);setPopped(false)}else{setDone(true);onFinish(score)}}
 function restart(){setSeed(newSeed());setIndex(0);setWrong([]);setPopped(false);setScore(0);setDone(false)}
 if(done)return <GameFinish title="Bütün balonlar patladı!" text={`${rounds.length} turun ${score} tanesini ilk denemede buldun. ${score>=6?'Sayılarla aran çok iyi!':'Her yeni oyunda biraz daha kolaylaşacak.'}`} onAgain={restart}/>;
 return <div className="balloon-game">
  <p className="game-progress">{index+1}. tur / {rounds.length} · ⭐ {score} ilk denemede</p>
  <h2 className="balloon-prompt" tabIndex={-1} ref={heading}>{round.prompt}</h2>
  <div className="balloon-sky" role="group" aria-label="Balonlar">{round.options.map((v,i)=>{const hit=popped&&v===round.answer;return <button key={`${index}-${v}`} data-correct={v===round.answer||undefined} className={`balloon balloon-${i} ${hit?'is-popped':''} ${wrong.includes(v)?'is-wrong':''}`} disabled={popped||wrong.includes(v)} aria-label={`${v} yazan balon`} onClick={()=>pick(v)}><span aria-hidden="true">{hit?'💥':v}</span></button>})}</div>
  <div className={`feedback ${popped?'correct':''}`} aria-live="polite">{popped?<><span>🎉</span><div><strong>Pat! Doğru balon.</strong><p>Cevap: {round.answer}</p></div></>:wrong.length?<><span>💡</span><div><strong>Bir daha dene.</strong><p>{round.hint}</p></div></>:null}</div>
  {popped&&<div className="stage-actions"><button className="primary" onClick={next}>{index+1<rounds.length?'Sonraki balonlar':'Oyunu bitir'} <ArrowRight size={18}/></button></div>}
 </div>;
}
