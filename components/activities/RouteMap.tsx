import {routeCells} from '@/lib/manipulatives';
import {Piko} from '../Illustration';
const columns=5,rows=4,size=64;
export default function RouteMap({visual}:{visual:string}){
 const cells=routeCells(visual),[sx,sy]=cells[0],[gx,gy]=cells.at(-1)!,center=(n:number)=>n*size+size/2;
 return <svg className="route-map" viewBox={`0 0 ${columns*size} ${rows*size}`} role="img" aria-label={`Harita: Piko ${sx+1}. sütun ${sy+1}. satırda, evi ${gx+1}. sütun ${gy+1}. satırda. Noktalı çizgi Piko’nun yolunu gösteriyor.`}>
  {Array.from({length:columns*rows},(_,i)=><rect key={i} x={(i%columns)*size+2} y={Math.floor(i/columns)*size+2} width={size-4} height={size-4} rx="9" fill="#eef4e6" stroke="#d3e0c8" strokeWidth="2"/>)}
  <polyline points={cells.map(([x,y])=>`${center(x)},${center(y)}`).join(' ')} fill="none" stroke="#c9774f" strokeWidth="7" strokeDasharray="1 13" strokeLinecap="round" strokeLinejoin="round"/>
  <text x={center(gx)} y={center(gy)} fontSize="40" textAnchor="middle" dominantBaseline="central">🏡</text>
  <g transform={`translate(${sx*size+5} ${sy*size+5})`}><Piko size={54}/></g>
 </svg>;
}
