'use client';
import {useRef,useState} from 'react';
import type {Question} from '@/lib/types';
import {sfx} from '@/lib/audio';
type Props={q:Question;onAnswer:(s:string)=>void;disabled:boolean;sound?:boolean;reveal?:boolean;wrong?:string[]};
/** Kutulara ayırma: kartlar (q.items) sürüklenerek ya da dokunarak (önce kart, sonra kutu) adlı kutulara (q.bins) konur. Kutudaki karta dokununca tepsiye döner.
 * Yanıt, her kartın kutu numarasıdır (kart sırasıyla, “|” ile); bütün kartlar yerleşince bildirilir. Yanlış kontrol edilen dağılımda yeri yanlış kartlar işaretlenir. */
export default function SortBins({q,onAnswer,disabled,sound=false,reveal,wrong=[]}:Props){
 const cards=q.items??[],bins=q.bins??[],solution=q.answer.split('|').map(Number),long=cards.some(c=>c.length>16);
 const [where,setWhere]=useState<(number|null)[]>(()=>cards.map(()=>null)),[picked,setPicked]=useState<number|null>(null),[ghost,setGhost]=useState<{card:number;x:number;y:number}|null>(null),[hover,setHover]=useState<number|'tray'|null>(null);
 const latest=useRef(where),drag=useRef<{x:number;y:number;moved:boolean}|null>(null),handled=useRef(false);
 const value=(state:(number|null)[])=>state.every(b=>b!==null)?state.join('|'):'',shown=reveal?solution:where,checkedWrong=!!value(where)&&wrong.includes(value(where));
 function move(card:number,bin:number|null){if(latest.current[card]===bin)return;const next=[...latest.current];next[card]=bin;latest.current=next;setWhere(next);setPicked(null);sfx(sound,bin===null?'remove':'place');onAnswer(value(next))}
 function target(x:number,y:number):number|'tray'|null{const el=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-bin],[data-tray]');return !el?null:el.dataset.bin!==undefined?Number(el.dataset.bin):'tray'}
 function tap(card:number){if(latest.current[card]!==null)move(card,null);else setPicked(p=>p===card?null:card)}
 const handlers=(card:number)=>disabled?{}:{
  onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{if(e.button)return;drag.current={x:e.clientX,y:e.clientY,moved:false};try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}},
  onPointerMove:(e:React.PointerEvent<HTMLButtonElement>)=>{const d=drag.current;if(!d)return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;d.moved=true;setGhost({card,x:e.clientX,y:e.clientY});setHover(target(e.clientX,e.clientY))},
  onPointerUp:(e:React.PointerEvent<HTMLButtonElement>)=>{const d=drag.current;drag.current=null;if(!d)return;handled.current=true;setTimeout(()=>{handled.current=false},60);if(d.moved){const t=target(e.clientX,e.clientY);setGhost(null);setHover(null);if(typeof t==='number')move(card,t);else if(t==='tray')move(card,null)}else tap(card)},
  onPointerCancel:()=>{drag.current=null;setGhost(null);setHover(null)},
  onClick:(e:React.MouseEvent)=>{e.stopPropagation();if(!handled.current)tap(card)},
 };
 const card=(c:number)=><button key={c} type="button" {...handlers(c)} disabled={disabled} aria-pressed={picked===c} className={`bin-card${picked===c?' selected':''}${ghost?.card===c?' dragging':''}${checkedWrong&&where[c]!==solution[c]?' is-wrong':''}${disabled&&!reveal?' is-correct':''}`}><span>{cards[c]}</span></button>;
 return <div className={`bins-tool${long?' long':''}`}>
  <p className="tool-help">Kartı sürükleyip doğru kutuya bırak. İstersen önce karta, sonra kutuya dokun. Kutudaki karta dokunursan geri gelir.</p>
  {!reveal&&<div className={`bins-tray${hover==='tray'?' over':''}`} data-tray="" aria-label="Kartlar">{shown.some(b=>b===null)?cards.map((_,c)=>c).filter(c=>where[c]===null).map(card):<small>{disabled?'':'Bütün kartlar yerleşti. Hazırsan kontrol et!'}</small>}</div>}
  <div className="bins-grid" style={{gridTemplateColumns:`repeat(${bins.length},minmax(0,1fr))`}}>{bins.map((name,b)=><div key={name} data-bin={b} role="group" aria-label={name} className={`bin${hover===b?' over':''}${picked!==null?' ready':''}`} onClick={()=>{if(!disabled&&picked!==null)move(picked,b)}}><h4>{name}</h4><div>{cards.map((_,c)=>c).filter(c=>shown[c]===b).map(card)}</div></div>)}</div>
  {ghost&&<span className="word-drag-preview" style={{left:ghost.x,top:ghost.y}}>{cards[ghost.card]}</span>}
 </div>
}
