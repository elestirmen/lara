'use client';
import {useRef,useState} from 'react';
import type {Question} from '@/lib/types';
import {sfx} from '@/lib/audio';
type Props={q:Question;onAnswer:(s:string)=>void;disabled:boolean;sound?:boolean;reveal?:boolean;wrong?:string[]};
/** Sürükle-bırak yuvalar: kartlar (q.items) tepsiden boş yuvalara (q.slots içindeki '' öğeler) taşınır.
 * Parmakla ya da fareyle sürüklenir; dokunarak da olur: önce karta, sonra yuvaya dokun. Yuvadaki karta dokununca tepsiye döner; dolu yuvaya bırakılan kart oradakiyle yer değiştirir.
 * q.layout: 'list' (numaralı alt alta yuvalar: alfabetik sıralama), 'train' (vagonlar: alfabe ve ritmik sayma treni), 'word' (bitişik yuvalar: hece ve harf kartlarıyla kelime), 'sentence' (cümlede eksik kelime), 'match' (her yuvanın üstünde q.labels yazısı: durum ile davranışı eşleştirme).
 * Yanıt, boş yuvalara konan kartların sırayla birleşimidir; bütün yuvalar dolunca bildirilir. Yanlış kontrol edilen dizilişte hatalı yuvalar işaretlenir. */
export default function DragSlots({q,onAnswer,disabled,sound=false,reveal,wrong=[]}:Props){
 const cards=q.items??[],pattern=q.slots??[],layout=q.layout??'list',gaps=pattern.map((s,i)=>s===''?i:-1).filter(i=>i>=0),solution=q.answer.split('|');
 /** placed[k]: k. boş yuvadaki kartın tepsi numarası. */
 const [placed,setPlaced]=useState<(number|null)[]>(()=>gaps.map(()=>null)),[picked,setPicked]=useState<number|null>(null),[ghost,setGhost]=useState<{card:number;x:number;y:number}|null>(null),[hover,setHover]=useState<number|'tray'|null>(null);
 const latest=useRef(placed),drag=useRef<{card:number;x:number;y:number;moved:boolean}|null>(null),handled=useRef(false);
 const value=(state:(number|null)[])=>state.every(c=>c!==null)?state.map(c=>cards[c!]).join('|'):'',current=value(placed),checkedWrong=!!current&&wrong.includes(current);
 function commit(next:(number|null)[],sound_:'place'|'remove'){latest.current=next;setPlaced(next);setPicked(null);sfx(sound,sound_);onAnswer(value(next))}
 /** Kartı k. boş yuvaya koyar; yuva doluysa oradaki kart, gelen kartın eski yerine (yuva ya da tepsi) geçer. */
 function put(card:number,k:number){const now=[...latest.current],from=now.indexOf(card),other=now[k];if(from===k)return;now[k]=card;if(from>=0)now[from]=other;commit(now,'place')}
 function back(card:number){const now=[...latest.current],from=now.indexOf(card);if(from<0)return;now[from]=null;commit(now,'remove')}
 function target(x:number,y:number):number|'tray'|null{const el=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-gap],[data-tray]');return !el?null:el.dataset.gap!==undefined?Number(el.dataset.gap):'tray'}
 function tapCard(card:number){const k=latest.current.indexOf(card);if(k>=0){if(picked!==null&&picked!==card)put(picked,k);else back(card)}else setPicked(p=>p===card?null:card)}
 const handlers=(card:number)=>disabled?{}:{
  onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{if(e.button)return;drag.current={card,x:e.clientX,y:e.clientY,moved:false};try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}},
  onPointerMove:(e:React.PointerEvent<HTMLButtonElement>)=>{const d=drag.current;if(!d)return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;d.moved=true;setGhost({card,x:e.clientX,y:e.clientY});setHover(target(e.clientX,e.clientY))},
  onPointerUp:(e:React.PointerEvent<HTMLButtonElement>)=>{const d=drag.current;drag.current=null;if(!d)return;handled.current=true;setTimeout(()=>{handled.current=false},60);if(d.moved){const t=target(e.clientX,e.clientY);setGhost(null);setHover(null);if(typeof t==='number')put(card,t);else if(t==='tray')back(card)}else tapCard(card)},
  onPointerCancel:()=>{drag.current=null;setGhost(null);setHover(null)},
  /** Klavye (Enter, boşluk) dokunuş gibi çalışır; işaretçiden hemen sonra gelen tıklama yok sayılır. */
  onClick:()=>{if(!handled.current)tapCard(card)},
 };
 const mark=(text:string)=>layout==='list'&&q.start!==undefined?<>{[...text].slice(0,q.start).join('')}<mark>{[...text][q.start]}</mark>{[...text].slice(q.start+1).join('')}</>:text;
 const card=(c:number,inSlot:boolean)=><button key={c} type="button" {...handlers(c)} disabled={disabled} aria-pressed={picked===c} aria-label={inSlot?`${cards[c]}: yuvadan çıkarmak için dokun`:`${cards[c]}: seç ya da sürükle`} className={`slot-card${picked===c?' selected':''}${ghost?.card===c?' dragging':''}`}><span>{mark(cards[c])}</span></button>;
 const tray=cards.map((_,c)=>c).filter(c=>!placed.includes(c));
 return <div className={`slots-tool slots-${layout}`}>
  <p className="tool-help">{layout==='list'?'Kelime kartını sürükleyip numaralı yuvaya bırak. İstersen önce karta, sonra yuvaya dokun.':layout==='match'?'Davranış kartını sürükleyip uygun durumun altındaki yuvaya bırak. İstersen önce karta, sonra yuvaya dokun.':'Kartı sürükleyip boş yuvaya bırak. İstersen önce karta, sonra yuvaya dokun.'} Yuvadaki karta dokunursan geri gelir.</p>
  <div className="slots-row" role="group" aria-label="Yuvalar">{layout==='train'&&<span className="train-engine" aria-hidden="true">🚂</span>}{pattern.map((fixed,i)=>{const k=gaps.indexOf(i);if(k<0)return <span key={i} className="slot fixed">{fixed}</span>;const c=placed[k],bad=(checkedWrong||!!reveal)&&(c===null||cards[c]!==solution[k]);
   return <span key={i} data-gap={k} className={`slot gap${c!==null?' filled':''}${hover===k?' over':''}${bad&&!reveal?' is-wrong':''}${disabled&&!reveal&&c!==null?' is-correct':''}${picked!==null&&c===null?' ready':''}`} onClick={()=>{if(!disabled&&picked!==null&&c===null)put(picked,k)}}>{layout==='list'&&<em>{k+1}</em>}{layout==='match'&&<p className="slot-label">{q.labels?.[k]}</p>}{reveal?<b className="slot-solution">{solution[k]}</b>:c!==null?card(c,true):<i aria-hidden="true">{layout==='list'||layout==='match'?'buraya':'?'}</i>}</span>})}</div>
  {!reveal&&<div className={`slots-tray${hover==='tray'?' over':''}`} data-tray="" aria-label="Kartlar">{tray.length?tray.map(c=>card(c,false)):<small>{disabled?'':'Bütün kartlar yerleşti. Hazırsan kontrol et!'}</small>}</div>}
  {ghost&&<span className="word-drag-preview" style={{left:ghost.x,top:ghost.y}}>{cards[ghost.card]}</span>}
 </div>
}
