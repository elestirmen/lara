'use client';
import {useState} from 'react';
import type {Question} from '@/lib/types';
import {Money,Graph,Measure,Rhythm,Traffic,WordMatch} from './Manipulatives';
import NumberLine from './NumberLine';
import Fractions from './Fractions';
import BaseTenBlocks from './BaseTenBlocks';
import ClockTool from './ClockTool';
import GeometryLab from './GeometryLab';
import {SentenceBuilder,Punctuation} from './LanguageTools';
import Drawing from './Drawing';
import Pitch,{Tempo} from './Pitch';
import Picture from './Picture';
import RouteMap from './RouteMap';
import Choices from './Choices';
import {Art} from '../Illustration';
/** Son dokunuşun kararın kendisi olduğu etkinlikler (seçenek, noktalama, dört vuruşluk ritim, tamamlanan model, “Yaptım”) onAnswer(değer, true) ile hemen kontrol edilir; düzeltilebilen yapımlarda (sayı, sıra, saat, para, ayna) “Kontrol et” kalır. */
export const instant=(q:Question)=>['choice','matching','traffic','pitch','tempo','punctuation','rhythm','physicalTask','speaking'].includes(q.type)||q.type==='geometry'&&q.visual!=='symmetry';
export default function Activity({q,onAnswer,disabled,sound,reveal=false,wrong=[]}:{q:Question;onAnswer:(s:string,check?:boolean)=>void;disabled:boolean;sound:boolean;reveal?:boolean;wrong?:string[]}){
 const [selected,setSelected]=useState(''),[text,setText]=useState('');const answer=(s:string,check=false)=>{setSelected(s);onAnswer(s,check)};const props={q,onAnswer:answer,disabled,sound,reveal,wrong};
 const registry={baseTenBlocks:BaseTenBlocks,numberLine:NumberLine,ordering:SentenceBuilder,punctuation:Punctuation,clock:ClockTool,geometry:GeometryLab,money:Money,fractions:Fractions,graph:Graph,measure:Measure,rhythm:Rhythm,traffic:Traffic,matching:WordMatch,pitch:Pitch,tempo:Tempo};
 if(q.type in registry){const Component=registry[q.type as keyof typeof registry];return <>{q.visual?.startsWith('route:')&&<RouteMap visual={q.visual}/>}<Component {...props}/></>}
 if(q.type==='drawing')return <Drawing onAnswer={answer} disabled={disabled} sound={sound} task={q.instruction}/>;
 if(['physicalTask','speaking','writing'].includes(q.type))return <div className="self-task">{q.type!=='writing'?q.visual?.startsWith('art:')?<Art name={q.visual.slice(4)} size={150} className="movement-art"/>:<div className="movement-figure">{q.type==='physicalTask'?'🤸':'💬'}</div>:<label>Benim cümlelerim<textarea value={text} maxLength={600} disabled={disabled} onChange={e=>{setText(e.target.value);answer(e.target.value.trim().length>=5?'done':'')}} placeholder="Bir zamanlar…"/></label>}<p>{q.type==='physicalTask'?'Kendi hızında yap. İhtiyacın olursa dinlen.':q.type==='speaking'?'Mikrofon açılmaz, sesin kaydedilmez. Kendi kendine veya bir yetişkine anlat.':'Bu yazı yalnızca bu etkinlik açıkken tutulur.'}</p>{q.type!=='writing'&&<button className={selected?disabled?'is-correct':'selected':''} disabled={disabled} onClick={()=>answer('done',true)}>✓ {q.type==='physicalTask'?'Yaptım':'Anlattım'}</button>}</div>;
 return <div>{q.visual&&<Picture visual={q.visual}/>}<Choices q={q} picked={selected} wrong={wrong} disabled={disabled} letters onPick={o=>answer(o,true)}/></div>
}
