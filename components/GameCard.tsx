import {ArrowRight} from 'lucide-react';
import type {GameInfo} from '@/content/games';
import type {GameRecord} from '@/lib/types';
import {Art} from './Illustration';
export default function GameCard({game,record}:{game:GameInfo;record?:GameRecord}){return <a href={`#game/${game.id}`} className={`game-card ${game.color}`}><span className="game-icon"><Art name={`game-${game.id}`} size={112}/></span><div><small>{game.skill}</small><h3>{game.title}</h3><p>{game.description}</p><span className="game-record">{record?game.result(record.best):<>Seni bekliyor <span aria-hidden="true">✦</span></>}</span></div><ArrowRight size={20} className="game-arrow"/></a>}
