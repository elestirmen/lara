'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,Lightbulb,RotateCcw,Volume2} from 'lucide-react';
import {spellHint,spellRounds} from '@/lib/games';
import {newSeed} from '@/lib/random';
import {sfx,speak,stopSpeech} from '@/lib/audio';
import GameFinish from './GameFinish';
export default function SpellGame({sound,onFinish}:{sound:boolean;onFinish:(firstTry:number)=>void}){
 const [seed,setSeed]=useState(newSeed),[index,setIndex]=useState(0),[built,setBuilt]=useState<number[]>([]),[helped,setHelped]=useState(false),[score,setScore]=useState(0),[done,setDone]=useState(false),[voice,setVoice]=useState('');
 const rounds=useMemo(()=>spellRounds(seed),[seed]),round=rounds[index],heading=useRef<HTMLHeadingElement>(null);
 const letter=(id:number)=>round.letters.find(l=>l.id===id)!.ch,chars=built.map(letter),full=built.length===round.letters.length,correct=full&&chars.join('')===round.word;
 useEffect(()=>()=>stopSpeech(),[]);
 useEffect(()=>{if(index>0)heading.current?.focus()},[index]);
 function change(next:number[]){setBuilt(next);if(next.length<round.letters.length){sfx(sound,next.length<built.length?'remove':'place');return}if(next.map(letter).join('')===round.word)sfx(sound,'correct');else{setHelped(true);sfx(sound,'wrong')}}
 function hint(){setHelped(true);change(spellHint(round,built))}
 function next(){const total=score+(helped?0:1);setScore(total);if(index+1<rounds.length){setIndex(index+1);setBuilt([]);setHelped(false);setVoice('')}else{setDone(true);onFinish(total);sfx(sound,'finish')}}
 function listen(){if(!speak(round.word))setVoice('Bu cihazda çevrim dışı Türkçe ses yok. Resme bakarak devam edebilirsin.')}
 function restart(){setSeed(newSeed());setIndex(0);setBuilt([]);setHelped(false);setScore(0);setDone(false);setVoice('')}
 if(done)return <GameFinish title="Tren istasyona vardı! 🚉" text={`${rounds.length} kelimenin ${score} tanesini ilk denemede kurdun.`} onAgain={restart}/>;
 return <div className="spell-game" data-word={round.word}>
  <p className="game-progress">{index+1}. kelime / {rounds.length} · ⭐ {score} ilk denemede</p>
  <div className="spell-picture"><span className="spell-emoji">{round.picture}</span><button className="icon-button" aria-label="Kelimeyi sesli dinle" onClick={listen}><Volume2 size={22}/></button></div>
  <h2 className="spell-title" tabIndex={-1} ref={heading}>Resimdeki kelimeyi kur <small>{round.letters.length} harf</small></h2>
  <div className="spell-train" role="group" aria-label="Harf treni"><span className="train-engine" aria-hidden="true">🚂</span>{round.letters.map((_,i)=>built[i]===undefined?<span key={`empty-${i}`} className="wagon empty" aria-hidden="true">{i+1}</span>:<button key={built[i]} className={`wagon ${full?(correct?'is-correct':'is-wrong'):''}`} disabled={correct} aria-label={`${i+1}. vagon: ${chars[i]}. Geri almak için dokun.`} onClick={()=>change(built.filter((_,j)=>j!==i))}>{chars[i]}</button>)}</div>
  <div className="spell-letters" role="group" aria-label="Harf kutusu">{round.letters.map(l=>built.includes(l.id)?<span key={l.id} className="letter-used" aria-hidden="true"/>:<button key={l.id} className="letter-tile" disabled={correct} onClick={()=>change([...built,l.id])}>{l.ch}</button>)}</div>
  <div className={`feedback ${correct?'correct':''}`} aria-live="polite">{correct?<><span>🎉</span><div><strong>Çok güzel: “{round.word}”</strong><p>Harfleri doğru sıraya dizdin.</p></div></>:full?<><span>💡</span><div><strong>Bazı harfler yer değiştirmeli.</strong><p>Yanlış vagona dokunup harfi geri alabilir veya ipucu isteyebilirsin.</p></div></>:voice?<><span>🔈</span><div><p>{voice}</p></div></>:null}</div>
  <div className="stage-actions">{correct?<button className="primary" onClick={next}>{index+1<rounds.length?'Sonraki kelime':'Oyunu bitir'} <ArrowRight size={18}/></button>:<><button disabled={!built.length} onClick={()=>change([])}><RotateCcw size={18}/> Vagonları boşalt</button><button onClick={hint}><Lightbulb size={18}/> İpucu</button></>}</div>
 </div>;
}
