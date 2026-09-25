/** Clock geometry uses twelve at the top and clockwise positive angles. */
export function clockAngle(x:number,y:number){return (Math.atan2(x,-y)*180/Math.PI+360)%360}
export function angleDelta(from:number,to:number){return ((to-from+540)%360)-180}
export function wrapMinutes(total:number){return ((Math.round(total)%720)+720)%720}
export function clockAnswer(total:number){const n=wrapMinutes(total);return String((Math.floor(n/60)||12)*60+n%60)}
export function snapQuarter(total:number){return wrapMinutes(Math.round(total/15)*15)}
export function blockValue(tens:number,ones:number){return tens*10+ones}
/** Insert at a gap in the original sequence, adjusting for the moved card. */
export function insertOrderedItem(order:string[],word:string,gap:number){
 const previous=order.indexOf(word),next=order.filter(item=>item!==word);
 const position=Math.max(0,Math.min(next.length,gap-(previous>=0&&previous<gap?1:0)));
 next.splice(position,0,word);return next;
}
export function exchangeBlocks(tens:number,ones:number,direction:'group'|'split'){
 if(direction==='group'&&ones>=10)return {tens:tens+1,ones:ones-10};
 if(direction==='split'&&tens>=1)return {tens:tens-1,ones:ones+10};
 return {tens,ones};
}
/** "route:x,y:R2,U1" → the start cell followed by every cell the route passes, [column, row]. */
export function routeCells(visual:string){
 const [,start,path]=visual.split(':'),moves:Record<string,[number,number]>={R:[1,0],L:[-1,0],U:[0,-1],D:[0,1]};let [x,y]=start.split(',').map(Number);const cells:[number,number][]=[[x,y]];
 for(const segment of path.split(',')){const [dx,dy]=moves[segment[0]];for(let i=0;i<Number(segment.slice(1));i++){x+=dx;y+=dy;cells.push([x,y])}}
 return cells;
}
