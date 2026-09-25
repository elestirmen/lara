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
import Pitch from './Pitch';
export default function Activity({q,onAnswer,disabled,sound,reveal=false}:{q:Question;onAnswer:(s:string)=>void;disabled:boolean;sound:boolean;reveal?:boolean}){
 const [selected,setSelected]=useState(''),[text,setText]=useState('');const answer=(s:string)=>{setSelected(s);onAnswer(s)};const props={q,onAnswer:answer,disabled,sound,reveal};
 const registry={baseTenBlocks:BaseTenBlocks,numberLine:NumberLine,ordering:SentenceBuilder,punctuation:Punctuation,clock:ClockTool,geometry:GeometryLab,money:Money,fractions:Fractions,graph:Graph,measure:Measure,rhythm:Rhythm,traffic:Traffic,matching:WordMatch,pitch:Pitch};
 if(q.type in registry){const Component=registry[q.type as keyof typeof registry];return <><Component {...props}/>{selected&&['traffic','matching'].includes(q.type)&&<p className="selected-answer">Seçimin: {selected}</p>}</>}
 if(q.type==='drawing')return <Drawing onAnswer={answer} disabled={disabled} task={q.instruction}/>;
 if(['physicalTask','speaking','writing'].includes(q.type))return <div className="self-task">{q.type==='physicalTask'?<div className="movement-figure">🤸</div>:q.type==='speaking'?<div className="movement-figure">💬</div>:<label>Benim cümlelerim<textarea value={text} maxLength={600} disabled={disabled} onChange={e=>{setText(e.target.value);answer(e.target.value.trim().length>=5?'done':'')}} placeholder="Bir zamanlar…"/></label>}<p>{q.type==='physicalTask'?'Kendi hızında yap. İhtiyacın olursa dinlen.':q.type==='speaking'?'Mikrofon açılmaz, sesin kaydedilmez. Kendi kendine veya bir yetişkine anlat.':'Bu yazı yalnızca bu etkinlik açıkken tutulur.'}</p>{q.type!=='writing'&&<button className={selected?'selected':''} disabled={disabled} onClick={()=>answer('done')}>✓ {q.type==='physicalTask'?'Yaptım':'Anlattım'}</button>}</div>;
 return <div>{q.visual&&<div className={`visual-object ${q.visual.length>20?'objects':''}`} aria-label="Sorunun görseli">{q.visual}</div>}<div className="options">{q.options?.map((option,i)=><button className={selected===option?'selected':''} key={option} disabled={disabled} aria-pressed={selected===option} onClick={()=>answer(option)}><span className="option-letter">{String.fromCharCode(65+i)}</span>{option}</button>)}</div></div>
}
