import {routeCells} from '@/lib/manipulatives';
const columns=5,rows=4,size=64;
export default function RouteMap({visual}:{visual:string}){
 const cells=routeCells(visual),[sx,sy]=cells[0],[gx,gy]=cells.at(-1)!,center=(n:number)=>n*size+size/2;
 return <svg className="route-map" viewBox={`0 0 ${columns*size} ${rows*size}`} role="img" aria-label={`Harita: Piko ${sx+1}. sütun ${sy+1}. satırda, evi ${gx+1}. sütun ${gy+1}. satırda. Noktalı çizgi Piko’nun yolunu gösteriyor.`}>
  {Array.from({length:columns*rows},(_,i)=><image key={i} href="/art/tool/route-tile.webp" x={(i%columns)*size+1} y={Math.floor(i/columns)*size+1} width={size-2} height={size-2}/>)}
  <polyline points={cells.map(([x,y])=>`${center(x)},${center(y)}`).join(' ')} fill="none" stroke="#9b4f2c" strokeWidth="8" strokeDasharray="1 13" strokeLinecap="round" strokeLinejoin="round"/>
  <image href="/art/tool/house.webp" x={gx*size+4} y={gy*size+3} width={size-8} height={size-8}/>
  <image href="/art/piko-wave-sm.webp" x={sx*size+5} y={sy*size+4} width={size-10} height={size-10}/>
 </svg>;
}
