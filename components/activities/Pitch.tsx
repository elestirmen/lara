'use client';
import {useState} from 'react';
import {tone} from '@/lib/audio';
import type {Question} from '@/lib/types';
export default function Pitch({q,onAnswer,disabled,sound}:{q:Question;onAnswer:(s:string)=>void;disabled:boolean;sound:boolean}){const [heard,setHeard]=useState<number[]>([]),[selected,setSelected]=useState('');return <div className="pitch-tool"><div className="tool-actions">{[q.value??220,q.start??660].map((hz,i)=><button key={i} disabled={!sound} onClick={()=>{tone(sound,hz,.6);setHeard([...new Set([...heard,i])])}}>🔊 {i+1}. sesi dinle {heard.includes(i)?'✓':''}</button>)}</div>{!sound&&<p className="notice">Bu keşif için üstteki ses düğmesine dokunarak sesi aç.</p>}<div className="options">{q.options?.map(o=><button disabled={disabled||heard.length<2} className={selected===o?'selected':''} key={o} onClick={()=>{setSelected(o);onAnswer(o)}}>{o}</button>)}</div><p className="muted">İki sesi de dinledikten sonra daha ince olanı seçebilirsin.</p></div>}
