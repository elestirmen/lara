'use client';
import {useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {Art} from './Illustration';
import {stopSpeech} from '@/lib/audio';
const PikoChat=dynamic(()=>import('./PikoChat'),{ssr:false,loading:()=>null});
/**
 * Köşedeki Piko her sayfada durur; dokununca sohbet açılır ve Piko ekrandaki sayfayı tanıtır.
 * compact: derste ve oyunda Piko etkinliği daha az kapatsın diye küçülür. off: sayfa yüklenirken.
 */
export default function PikoBuddy({sound,mode}:{sound:boolean;mode:'page'|'compact'|'off'}){
 const [open,setOpen]=useState(false),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(mode==='off')setOpen(false)},[mode]);
 function tap(){stopSpeech();setOpen(true)}
 /** Kapanınca odak köşedeki Piko'ya döner (kapanışta yeniden çizildiği için ona ref üzerinden ulaşılır). */
 function close(){setOpen(false);stopSpeech();requestAnimationFrame(()=>button.current?.focus())}
 if(mode==='off')return null;
 return <>
  {!open&&<div className={`piko-buddy${mode==='compact'?' compact':''}`}>
   <button ref={button} type="button" className="piko-buddy-button" aria-label="Piko ile konuş" onClick={tap}>
    <Art name="piko-wave" size={92} className="pose-wave" eager/>
   </button>
  </div>}
  {open&&<PikoChat sound={sound} onClose={close}/>}
 </>;
}
