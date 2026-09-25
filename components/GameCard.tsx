import {ArrowRight} from 'lucide-react';
import type {GameInfo} from '@/content/games';
import type {GameRecord} from '@/lib/types';
export default function GameCard({game,record}:{game:GameInfo;record?:GameRecord}){return <a href={`#game/${game.id}`} className={`game-card ${game.color}`}><span className="game-icon" aria-hidden="true">{game.icon}</span><div><small>{game.skill}</small><h3>{game.title}</h3><p>{game.description}</p><span className="game-record">{record?game.result(record.best):<>Seni bekliyor <span aria-hidden="true">✦</span></>}</span></div><ArrowRight size={20} className="game-arrow"/></a>}
