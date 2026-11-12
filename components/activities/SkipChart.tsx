'use client';
import {useState} from 'react';
import type {Question} from '@/lib/types';
import {sfx} from '@/lib/audio';
import {byEach} from '@/lib/turkish';
/** Ritmik sayma tablosu: 1’den q.value’ya kadar sayılar; çocuk q.step’er sayarken söylediği sayıları boyar. explore: öğren ekranında sayılar hazır boyalı gelir. */
export default function SkipChart({q,onAnswer,disabled,sound=false,reveal,explore=false}:{q:Question;onAnswer:(s:string)=>void;disabled:boolean;sound?:boolean;reveal?:boolean;explore?:boolean}){
 const step=q.step??2,max=q.value??30,solution=new Set(q.answer.split('|').map(Number)),[picked,setPicked]=useState<number[]>([]),shown=explore?[...solution]:picked;
 function toggle(n:number){const next=picked.includes(n)?picked.filter(x=>x!==n):[...picked,n].sort((a,b)=>a-b);sfx(sound,picked.includes(n)?'remove':'place');setPicked(next);onAnswer(next.join('|'))}
 return <div className="skip-chart-tool">{!explore&&<p className="tool-help">{step} sayısından başla, her seferinde {step} kutu ilerle ve durduğun sayıya dokun. Yanlış boyadığın kutuya yeniden dokunursan silinir.</p>}<div className="skip-chart" role="group" aria-label={`1’den ${max} sayısına kadar sayı tablosu`}>{Array.from({length:max},(_,i)=>i+1).map(n=>{const on=shown.includes(n),missed=!!reveal&&solution.has(n)&&!on,extra=!!reveal&&on&&!solution.has(n);return <button key={n} disabled={disabled||explore} aria-pressed={on} className={`${on?'on':''}${missed?' missed':''}${extra?' extra':''}`} onClick={()=>toggle(n)}>{n}</button>})}</div><output className="skip-chart-list">{shown.length?<>{explore?`${byEach(step,true)} sayınca: `:'Boyadıkların: '}<strong>{[...shown].sort((a,b)=>a-b).join(', ')}</strong></>:'Henüz bir sayı boyamadın.'}</output>{!explore&&!disabled&&picked.length>0&&<div className="tool-actions"><button onClick={()=>{setPicked([]);onAnswer('')}}>Tabloyu temizle</button></div>}</div>
}
