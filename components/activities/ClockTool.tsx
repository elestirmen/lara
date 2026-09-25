'use client';
import {useEffect,useRef,useState} from 'react';
import type {Question} from '@/lib/types';
import {angleDelta,clockAngle,clockAnswer,snapQuarter,wrapMinutes} from '@/lib/manipulatives';
import {sfx} from '@/lib/audio';
type Hand='hour'|'minute';
export default function ClockTool({q,onAnswer,disabled,sound=false,reveal=false,explore=false}:{q:Question;onAnswer:(s:string)=>void;disabled:boolean;sound?:boolean;reveal?:boolean;explore?:boolean}){
 const [total,setTotal]=useState(180),[active,setActive]=useState<Hand|null>(null);
 useEffect(()=>{if(!explore)onAnswer(clockAnswer(180))},[]);
 const svg=useRef<SVGSVGElement>(null),drag=useRef<{hand:Hand;angle:number;total:number}|null>(null);
 const minute=total%60,hour=Math.floor(total/60)||12;
 const change=(n:number)=>{const next=wrapMinutes(n);setTotal(next);onAnswer(clockAnswer(next))},set=(n:number)=>{change(n);sfx(sound,'tick')};
 const angle=(e:React.PointerEvent)=>{const r=svg.current!.getBoundingClientRect();return clockAngle(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2)};
 const start=(e:React.PointerEvent<SVGGElement>,hand:Hand)=>{if(disabled||e.button>0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag.current={hand,angle:angle(e),total};setActive(hand)};
 const move=(e:React.PointerEvent<SVGGElement>)=>{const d=drag.current;if(!d||disabled)return;const a=angle(e);if(d.hand==='minute')d.total+=angleDelta(d.angle,a)/6;else d.total+=angleDelta(d.angle,a)*2;d.angle=a;change(d.total)};
 const end=()=>{if(drag.current)set(snapQuarter(drag.current.total));drag.current=null;setActive(null)};
 const hand=(name:Hand,length:number,width:number,rotation:number,color:string)=>{
  const label=name==='hour'?'Akrep':'Yelkovan';
  return <g role="slider" tabIndex={disabled?-1:0} aria-disabled={disabled} aria-label={label} aria-valuemin={name==='hour'?1:0} aria-valuemax={name==='hour'?12:59} aria-valuenow={name==='hour'?hour:minute} aria-valuetext={`${label}: ${name==='hour'?hour:minute} ${name==='hour'?'saat':'dakika'}. Ok tuşlarıyla veya sürükleyerek değiştir.`} className={`clock-hand ${active===name?'is-dragging':''}`} transform={`rotate(${rotation} 160 160)`} onPointerDown={e=>start(e,name)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onKeyDown={e=>{if(disabled)return;if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown'].includes(e.key)){e.preventDefault();set(total+(['ArrowRight','ArrowUp'].includes(e.key)?1:-1)*(name==='hour'?60:15))}}}>
   <line x1="160" y1="154" x2="160" y2={160-length} stroke="transparent" strokeWidth="44"/>
   <line x1="160" y1="168" x2="160" y2={160-length} stroke={color} strokeWidth={width} strokeLinecap="round"/>
   <circle cx="160" cy={160-length} r="13" fill="white" stroke={color} strokeWidth="4"/>
   <circle cx="160" cy={160-length} r="29" fill="transparent"/>
  </g>;
 };
 return <div className="clock-lab">
  <p className="tool-help">Kolların ucundaki halkaları tut ve çevir. Yelkovanı bıraktığında en yakın çeyrek saate yerleşir.</p>
  <div className="clock-workspace"><svg ref={svg} className="interactive-clock" viewBox="0 0 320 320" aria-label="Dokunarak ayarlanabilen saat">
   <circle cx="160" cy="160" r="150" fill="#eef4e9" stroke="#bacbb3" strokeWidth="2"/><circle cx="160" cy="160" r="139" fill="#fffef9" stroke="#d7e1cf" strokeWidth="2"/>
   {Array.from({length:60},(_,i)=><line key={i} x1="160" y1={i%5===0?26:31} x2="160" y2={i%5===0?39:36} stroke={i%5===0?'#45684f':'#bdc9b7'} strokeWidth={i%5===0?3:1.5} transform={`rotate(${i*6} 160 160)`}/>)}
   {Array.from({length:12},(_,i)=>{const a=(i+1)*Math.PI/6;return <text key={i} x={160+108*Math.sin(a)} y={160-108*Math.cos(a)} dominantBaseline="central" textAnchor="middle" fontSize="23" fontWeight="800" fill="#344b3d">{i+1}</text>})}
   {[['00',160,7],['15',309,161],['30',160,314],['45',11,161]].map(([s,x,y])=><text key={s} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="800" fill="#774629">{s}</text>)}
   {hand('minute',88,6,minute*6,'#a64e2d')}{hand('hour',56,11,total/2,'#315e4a')}
   <circle cx="160" cy="160" r="8" fill="#315e4a" pointerEvents="none"/>
  </svg><div className="clock-readout"><output aria-live="polite" aria-label="Kurduğun saat">{String(hour).padStart(2,'0')}.{String(minute).padStart(2,'0')}</output><p><b>Kısa kol: akrep</b><br/>Saati gösterir.</p><p><b>Uzun kol: yelkovan</b><br/>Dakikayı gösterir.</p><small>Yelkovan dönerken akrep de ilerler.</small></div></div>
  <div className="clock-adjust"><label>Saat<select aria-label="Saat" value={hour} disabled={disabled} onChange={e=>set(Number(e.target.value)*60+minute)}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label><label>Dakika<select aria-label="Dakika" value={minute} disabled={disabled} onChange={e=>set(hour*60+Number(e.target.value))}>{[...new Set([0,15,30,45,minute])].sort((a,b)=>a-b).map(i=><option key={i} value={i}>{String(i).padStart(2,'0')}</option>)}</select></label></div>
  {reveal&&<button className="solution-button" onClick={()=>change(Number(q.answer))}>Çözümü saatte göster</button>}
 </div>;
}
