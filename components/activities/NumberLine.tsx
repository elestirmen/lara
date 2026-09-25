'use client';
import {useEffect,useRef,useState} from 'react';
import type {Question} from '@/lib/types';
import {Art} from '../Illustration';
import {sfx} from '@/lib/audio';
export default function NumberLine({q,onAnswer,disabled,sound=false,reveal}:{q:Question;onAnswer:(s:string)=>void;disabled:boolean;sound?:boolean;reveal?:boolean}){
 const start=q.start??0,step=q.step??1,[n,setN]=useState(start),[hops,setHops]=useState(0),viewport=useRef<HTMLDivElement>(null);
 const min=step<0?Math.max(0,start-10):start,max=step<0?start:start+Math.max(10,(q.value??5)*step),nums=Array.from({length:max-min+1},(_,i)=>min+i),left=30+(n-min)*48;
 useEffect(()=>{viewport.current?.scrollTo({left:Math.max(0,left-(viewport.current?.clientWidth??0)/2),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})},[left]);
 function go(value:number){setN(value);setHops(h=>h+1);onAnswer(String(value));sfx(sound,'hop')}
 return <div className="number-path-tool"><p className="tool-help">Piko’yu zıplat veya bir sayıya dokun. Uzun yolu parmağınla sağa sola kaydırabilirsin.</p><div className="number-path-window" ref={viewport}><div className="number-path" style={{width:60+(nums.length-1)*48}}><div className="number-path-line"/><div className="number-path-piko" style={{left}}><span key={hops}><Art name="piko-wave" size={64}/></span></div>{nums.map((x,i)=><button key={x} disabled={disabled} aria-label={`${x} sayısına git`} aria-pressed={x===n} className={x===n?'selected':''} style={{left:30+i*48}} onClick={()=>go(x)}>{x}</button>)}</div></div><div className="tool-actions"><button disabled={disabled||n+step<min||n+step>max} onClick={()=>go(n+step)}>{step<0?'←':'→'} {Math.abs(step)} adım zıpla</button><button disabled={disabled} onClick={()=>go(start)}>Başa dön</button></div><output className="path-equation">{start} {n>=start?'+':'−'} {Math.abs(n-start)} = <strong>{n}</strong></output>{reveal&&<button className="solution-button" onClick={()=>go(Number(q.answer))}>Çözümdeki {q.answer} sayısına git</button>}</div>
}
