'use client';
import {useEffect,useRef,useState} from 'react';
import type {Question} from '@/lib/types';
import {sfx} from '@/lib/audio';
type Props={q:Question;onAnswer:(s:string,check?:boolean)=>void;disabled:boolean;sound?:boolean;reveal?:boolean;wrong?:string[]};
const chars=(s:string)=>[...s];
/** Makasla ayırma: harfler yan yana durur; iki harfin arasına dokununca oradan kesilir, yeniden dokununca birleşir. Hecelere ayırmada ve birbirine yapışmış kelimeleri ayırmada kullanılır. Yanıt parçaların “|” ile birleşimidir. */
export function CutTool({q,onAnswer,disabled,sound=false,reveal}:Props){
 const letters=chars(q.items?.[0]??''),solution=q.answer.split('|'),right=new Set<number>();let at=0;for(const part of solution.slice(0,-1)){at+=chars(part).length;right.add(at)}
 const [cuts,setCuts]=useState<number[]>([]),shown=reveal?[...right]:cuts;
 function toggle(i:number){const next=cuts.includes(i)?cuts.filter(x=>x!==i):[...cuts,i].sort((a,b)=>a-b);sfx(sound,cuts.includes(i)?'remove':'tick');setCuts(next);const parts:string[]=[];let from=0;for(const cut of [...next,letters.length]){parts.push(letters.slice(from,cut).join(''));from=cut}onAnswer(next.length?parts.join('|'):'')}
 let piece=0;
 return <div className="cut-tool"><p className="tool-help">Harflerin arasındaki makasa dokun: oradan kesilir. Yanlış kestiysen aynı yere yeniden dokun, parçalar birleşir.</p><div className="cut-strip">{letters.map((c,i)=>{const cut=i>0&&shown.includes(i);if(cut)piece++;return <span key={i} className="cut-unit">{i>0&&<button type="button" disabled={disabled} aria-pressed={cut} aria-label={`${letters[i-1]} ile ${c} arasını ${cut?'birleştir':'kes'}`} className={`cut-gap${cut?' on':''}`} onClick={()=>toggle(i)}><span aria-hidden="true">✂</span></button>}<b className={`cut-letter p${piece%4}`}>{c}</b></span>})}</div><output className="cut-result">{shown.length?<>Parça sayısı: <strong>{shown.length+1}</strong></>:'Henüz kesmedin.'}</output></div>
}
/** Alkışla say: çocuk kelimeyi söylerken her hece için bir kez alkış düğmesine basar; yanıt alkış sayısıdır. */
export function ClapCount({q,onAnswer,disabled,sound=false,reveal}:Props){
 const [count,setCount]=useState(0),shown=reveal?Number(q.answer):count;
 return <div className="clap-tool"><div className="clap-word">{q.items?.[0]}</div><p className="tool-help">Kelimeyi sesli söyle. Ağzın her açılışında bir kez alkış düğmesine bas.</p><div className="clap-row" aria-live="polite">{shown?Array.from({length:shown},(_,i)=><span key={i} style={{animationDelay:`${reveal?i*.12:0}s`}}>👏</span>):<small>Henüz alkışlamadın.</small>}</div><div className="tool-actions"><button type="button" className="clap-button" disabled={disabled||count>=8} onClick={()=>{sfx(sound,'clap');setCount(count+1);onAnswer(String(count+1))}}>👏 Alkışla</button><button type="button" disabled={disabled||!count} onClick={()=>{setCount(0);onAnswer('')}}>Baştan başla</button></div><output className="cut-result">Alkış sayısı: <strong>{shown}</strong></output></div>
}
/** Dokunarak seç: harf kutularından (ya da kelimelerden) istenenlere dokunulur. q.step===1 ise tek seçim yapılır. Yanıt seçilen kutuların sıra numaralarıdır. */
export function PickTiles({q,onAnswer,disabled,sound=false,reveal}:Props){
 const tiles=q.items??[],single=q.step===1,right=q.answer.split('|').map(Number),[picked,setPicked]=useState<number[]>([]),shown=reveal?right:picked,words=tiles.some(t=>chars(t).length>1);
 function tap(i:number){const next=single?(picked.includes(i)?[]:[i]):picked.includes(i)?picked.filter(x=>x!==i):[...picked,i].sort((a,b)=>a-b);sfx(sound,picked.includes(i)?'remove':'place');setPicked(next);onAnswer(next.join('|'))}
 return <div className="pick-tool"><p className="tool-help">{single?'Doğru kutuya dokun.':'İstenen bütün kutulara dokun. Yanlış seçtiğine yeniden dokunursan bırakılır.'}</p><div className={`pick-row${words?' words':''}`}>{tiles.map((t,i)=><button type="button" key={i} disabled={disabled} aria-pressed={shown.includes(i)} className={`${shown.includes(i)?'on':''}${reveal&&right.includes(i)?' is-correct':''}`} onClick={()=>tap(i)}>{t}</button>)}</div>{!single&&<output className="cut-result">Seçtiklerin: <strong>{shown.length?shown.map(i=>tiles[i]).join(', '):'yok'}</strong></output>}</div>
}
/** Sayma yardımcısı (yanıt değildir): kutulara dokundukça sırayla numara alır; çocuk harfleri ya da kelimeleri tek tek dokunarak sayar. */
export function CountTiles({items,words=false,sound=false}:{items:string[];words?:boolean;sound?:boolean}){
 const [order,setOrder]=useState<number[]>([]);
 return <div className={`visual-object count-tiles${words?' words':''}`}><div>{items.map((t,i)=>{const n=order.indexOf(i)+1;return <button type="button" key={i} className={n?'on':''} aria-label={n?`${t}: ${n}`:`${t}: saymak için dokun`} onClick={()=>{sfx(sound,n?'remove':'tick');setOrder(n?order.filter(x=>x!==i):[...order,i])}}>{t}{n>0&&<em>{n}</em>}</button>})}</div><small>{order.length?`Saydıkların: ${order.length}`:`Saymak için ${words?'kelimelere':'harflere'} tek tek dokun.`}</small></div>
}
/** Yuvarlama tepesi: top, sayının birler basamağına göre tepenin bir yamacında durur; 5 tepenin hemen ötesindedir. Doğru onluk seçilince top o yana yuvarlanır, yanlışta yamaçta sallanıp yerinde kalır. Seçim hemen kontrol edilir. */
export function RoundHill({q,onAnswer,disabled,sound=false,wrong=[]}:Props){
 const n=q.value??0,lo=Math.floor(n/10)*10,hi=lo+10,unit=n-lo,point=(t:number)=>({x:40+t*560,y:196-150*Math.sin(Math.PI*t)}),rest=unit===5?.535:unit/10;
 const [t,setT]=useState(rest),[nudge,setNudge]=useState(''),frame=useRef(0);
 useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);
 function roll(to:number,then?:()=>void){const from=t,start=performance.now(),still=matchMedia('(prefers-reduced-motion: reduce)').matches;if(still){setT(to);then?.();return}const step=(now:number)=>{const p=Math.min(1,(now-start)/900),e=p*p;setT(from+(to-from)*e);if(p<1)frame.current=requestAnimationFrame(step);else then?.()};frame.current=requestAnimationFrame(step)}
 function pick(value:number){if(disabled)return;if(String(value)===q.answer){sfx(sound,'hop');roll(value===hi?1:0);onAnswer(String(value),true)}else{setNudge(value===hi?'right':'left');setTimeout(()=>setNudge(''),500);onAnswer(String(value),true)}}
 const ball=point(t),path=Array.from({length:41},(_,i)=>point(i/40)).map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
 return <div className="hill-tool"><svg viewBox="0 0 640 270" role="img" aria-label={`${lo} ile ${hi} arasındaki yuvarlama tepesi. Top ${n} sayısında duruyor.`}><path d={`${path} L600 232 L40 232 Z`} className="hill-ground"/><path d={path} className="hill-line"/>{Array.from({length:11},(_,i)=>{const p=point(i/10),big=i===0||i===10,here=i===unit;return <g key={i}><line x1={p.x} y1={p.y} x2={p.x} y2={p.y+(big?16:9)} className="hill-tick"/><text x={p.x} y={p.y+(big?40:28)} className={`hill-num${big?' ten':''}${here?' here':''}${i===5?' top':''}`}>{lo+i}</text></g>})}<text x={point(.5).x} y={22} className="hill-flag">⛳</text><g className="hill-ball" style={{transform:`translate(${ball.x}px,${ball.y-17}px)`}}><g className={nudge}><circle r="16"/><text y="5">{n}</text></g></g></svg><div className="hill-choices">{[lo,hi].map(v=><button type="button" key={v} disabled={disabled} aria-disabled={wrong.includes(String(v))||undefined} className={disabled&&String(v)===q.answer?'is-correct':wrong.includes(String(v))?'is-wrong':''} onClick={()=>{if(!wrong.includes(String(v)))pick(v)}}>{v===lo?'← ':''}{v}{v===hi?' →':''}</button>)}</div></div>
}
