'use client';
import {useEffect,useRef,useState} from 'react';
import {tone} from '@/lib/audio';
import type {Question} from '@/lib/types';
import Choices from './Choices';
type Props={q:Question;onAnswer:(s:string,check?:boolean)=>void;disabled:boolean;sound:boolean;wrong?:string[]};
export default function Pitch({q,onAnswer,disabled,sound,wrong}:Props){const [heard,setHeard]=useState<number[]>([]),[selected,setSelected]=useState('');return <div className="pitch-tool"><div className="tool-actions">{[q.value??220,q.start??660].map((hz,i)=><button key={i} disabled={!sound} onClick={()=>{tone(sound,hz,.6);setHeard([...new Set([...heard,i])])}}>🔊 {i+1}. sesi dinle {heard.includes(i)?'✓':''}</button>)}</div>{!sound&&<p className="notice">Bu keşif için üstteki ses düğmesine dokunarak sesi aç.</p>}<Choices q={q} picked={selected} wrong={wrong} disabled={disabled} locked={heard.length<2} onPick={o=>{setSelected(o);onAnswer(o,true)}}/><p className="muted">İki sesi de dinledikten sonra daha ince olanı seçebilirsin.</p></div>}
/** İki örnekte de dört vuruş vardır; yalnız vuruşların arası (q.value, q.start ms) değişir. Ses kapalıyken ışıklar aynı hızda yanar. */
export function Tempo({q,onAnswer,disabled,sound,wrong}:Props){
 const [heard,setHeard]=useState<number[]>([]),[selected,setSelected]=useState(''),[beat,setBeat]=useState<[number,number]|null>(null),timers=useRef<ReturnType<typeof setTimeout>[]>([]),intervals=[q.value??380,q.start??820];
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 function play(sample:number){timers.current.forEach(clearTimeout);timers.current=[];const ms=intervals[sample];for(let i=0;i<4;i++)timers.current.push(setTimeout(()=>{setBeat([sample,i]);tone(sound,523,.12)},i*ms));timers.current.push(setTimeout(()=>{setBeat(null);setHeard(h=>[...new Set([...h,sample])])},4*ms))}
 return <div className="tempo-tool"><div className="tempo-samples">{intervals.map((_,s)=><div className="tempo-sample" key={s}><button disabled={disabled||beat!==null} onClick={()=>play(s)}>{sound?'🔊':'👀'} {s+1}. örneği {sound?'dinle':'izle'} {heard.includes(s)?'✓':''}</button><div className="tempo-lights" aria-hidden="true">{[0,1,2,3].map(i=><span key={i} className={beat?.[0]===s&&beat[1]===i?'on':''}/>)}</div></div>)}</div>{!sound&&<p className="muted">Ses kapalı. Işıkların ne kadar sık yandığını izleyerek karşılaştırabilirsin.</p>}<Choices q={q} picked={selected} wrong={wrong} disabled={disabled} locked={heard.length<2} onPick={o=>{setSelected(o);onAnswer(o,true)}}/><p className="muted">İki örneği de {sound?'dinledikten':'izledikten'} sonra seçebilirsin.</p></div>;
}
