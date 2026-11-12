'use client';
import {useRef,useState} from 'react';
import type {Question} from '@/lib/types';
import {sfx} from '@/lib/audio';
/** Sıra numarası verme (çalışma kâğıdındaki gibi): çocuk kelimelere alfabetik sırayla dokunur, her dokunuş sıradaki numarayı yazar. Numaralı bir kelimeye yeniden dokunmak numarasını siler. Hepsi numaralanınca yanıt hazırdır. */
export default function RankList({q,onAnswer,disabled,sound=false,reveal}:{q:Question;onAnswer:(s:string)=>void;disabled:boolean;sound?:boolean;reveal?:boolean}){
 /** q.start: bakılacak harfin yeri (ilk harfler aynıysa 1). */
 const at=q.start??0,items=q.items??[],solution=q.answer.split('|'),[order,setOrder]=useState<string[]>([]),latest=useRef<string[]>([]);
 /** Art arda hızlı dokunuşlarda sıra kaybolmasın diye son durum ref’te de tutulur. */
 function tap(word:string){const now=latest.current,next=now.includes(word)?now.filter(w=>w!==word):[...now,word];sfx(sound,now.includes(word)?'remove':'place');latest.current=next;setOrder(next);onAnswer(next.length===items.length?next.join('|'):'')}
 return <div className="rank-tool"><p className="tool-help">Alfabetik sırada en önce gelen kelimeye dokun: yanına 1 yazılır. Sonra sıradakine dokun. Yanlış numara verdiysen kelimeye yeniden dokun, silinir.</p><div className="rank-list">{items.map(word=>{const n=order.indexOf(word)+1,right=solution.indexOf(word)+1,wrong=!!reveal&&n!==right;return <button key={word} disabled={disabled} aria-label={n?`${word}, ${n}. sırada`:`${word}, sıra verilmedi`} className={`${n?'ranked':''}${disabled&&!wrong&&n?' is-correct':''}${wrong?' is-wrong':''}`} onClick={()=>tap(word)}><b>{[...word].slice(0,at).join('')}<mark>{[...word][at]}</mark>{[...word].slice(at+1).join('')}</b><span>{reveal?right:n||''}</span></button>})}</div>{!disabled&&order.length>0&&<div className="tool-actions"><button onClick={()=>{latest.current=[];setOrder([]);onAnswer('')}}>Numaraları sil</button></div>}</div>
}
