'use client';
import '@/app/games.css';
import {ArrowLeft} from 'lucide-react';
import {games,type GameId} from '@/content/games';
import type {Progress} from '@/lib/types';
import {recordGame} from '@/lib/progress';
import MemoryGame from './games/MemoryGame';
import BalloonGame from './games/BalloonGame';
import CodeGame from './games/CodeGame';
import SpellGame from './games/SpellGame';
import {Art} from './Illustration';
export default function GamePlayer({id,progress,update}:{id:GameId;progress:Progress;update:(p:Progress)=>void}){
 const game=games.find(g=>g.id===id)!,record=progress.games?.[id],props={sound:progress.sound,onFinish:(score:number)=>update(recordGame(progress,id,score,game.better))};
 return <section className="game-page"><a className="back" href="#games"><ArrowLeft size={18}/> Oyunlara dön</a>
  <div className={`game-banner ${game.color}`}><span className="game-banner-art"><Art name={`game-${game.id}`} size={128} eager/></span><div><p className="eyebrow">{game.skill}</p><h1>{game.title}</h1><p>{game.how}</p></div></div>
  <div className="lesson-card game-board">{id==='memory'&&<MemoryGame {...props}/>}{id==='balloons'&&<BalloonGame {...props}/>}{id==='code'&&<CodeGame {...props} solved={record?.best??0}/>}{id==='spell'&&<SpellGame {...props}/>}</div>
  <p className="lesson-foot">{record?`${game.result(record.best)} · ${record.plays} kez oynandı. `:''}Burada acele yok; oyun sonuçları yalnız bu cihazda saklanır. 🌿</p>
 </section>;
}
