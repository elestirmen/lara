'use client';
import {useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {Art} from './Illustration';
import {stopSpeech} from '@/lib/audio';
const PikoChat=dynamic(()=>import('./PikoChat'),{ssr:false,loading:()=>null});
/**
 * Sayfanın köşesindeki Piko. Dokununca sohbet penceresi açılır; ayar ya da kod gerekmez.
 * Ders ve oyun ekranlarında etkinliğin üstüne binmesin diye gizlenir.
 */
export default function PikoBuddy({sound,hidden}:{sound:boolean;hidden:boolean}){
 const [open,setOpen]=useState(false),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(hidden)setOpen(false)},[hidden]);
 function tap(){stopSpeech();setOpen(true)}
 function close(){setOpen(false);stopSpeech();requestAnimationFrame(()=>button.current?.focus())}
 if(hidden)return null;
 return <>
  {!open&&<div className="piko-buddy">
   <button ref={button} type="button" className="piko-buddy-button" aria-label="Piko ile konuş" onClick={tap}>
    <Art name="piko-wave" size={92} className="pose-wave" eager/>
   </button>
  </div>}
  {open&&<PikoChat sound={sound} onClose={close}/>}
 </>;
}
