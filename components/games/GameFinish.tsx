import {ArrowRight,RotateCcw} from 'lucide-react';
import {Piko} from '../Illustration';
export default function GameFinish({title,text,onAgain}:{title:string;text:string;onAgain:()=>void}){return <div className="result game-finish" role="status"><div className="result-sun"><Piko size={130} wave/></div><p className="eyebrow">OYUN TAMAMLANDI</p><h2>{title}</h2><p>{text}</p><div className="stage-actions"><button className="primary" onClick={onAgain}><RotateCcw size={18}/> Yeniden oyna</button><a className="button" href="#games">Başka bir oyun seç <ArrowRight size={18}/></a></div></div>}
