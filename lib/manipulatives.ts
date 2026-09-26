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
export type ShapeName='square'|'triangle'|'circle'|'rectangle'|'cube'|'sphere'|'cylinder'|'prism';
export interface CompositionPlan {instruction:string;explanation:string;pieces:{shape:ShapeName;x:number;y:number}[]}
/** Yerleştirme modelleri; parça merkezleri 600×340 tahtada, alt kenarlar y≈285 zemin çizgisinde. */
export const compositionPlans:Record<'build'|'compose',CompositionPlan[]>={
 build:[
  {instruction:'Küpleri yerlerine taşı ve küçük bir yapı kur.',explanation:'Küpleri yan yana ve üst üste getirerek bir yapı oluşturdun.',pieces:[{shape:'cube',x:240,y:235},{shape:'cube',x:360,y:235},{shape:'cube',x:300,y:135}]},
  {instruction:'Üç küpü üst üste koyarak bir kule kur.',explanation:'Küplerin düz yüzleri üst üste durmalarını sağladı. Bir kule kurdun.',pieces:[{shape:'cube',x:300,y:236},{shape:'cube',x:300,y:142},{shape:'cube',x:300,y:48}]},
  {instruction:'İki silindiri yan yana koy, üstlerine prizmayı yerleştir: bir kapı kur.',explanation:'Silindirler kapının iki yanı, prizma üst parçası oldu. Cisimleri birleştirerek bir kapı kurdun.',pieces:[{shape:'cylinder',x:240,y:239},{shape:'cylinder',x:360,y:239},{shape:'prism',x:300,y:155}]},
  {instruction:'Üç küple iki basamaklı bir merdiven kur.',explanation:'Alttaki iki küp birinci basamak, üstteki küp ikinci basamak oldu. Küplerin düz yüzleri basamak yapmaya çok uygun.',pieces:[{shape:'cube',x:240,y:236},{shape:'cube',x:360,y:236},{shape:'cube',x:360,y:142}]},
  {instruction:'Altta silindir, ortada küp, en üstte küre olacak şekilde bir heykel kur.',explanation:'Silindir kaide, küp gövde, küre baş oldu. Üç farklı cisimle bir heykel kurdun.',pieces:[{shape:'cylinder',x:300,y:239},{shape:'cube',x:300,y:144},{shape:'sphere',x:300,y:53}]},
  {instruction:'İki silindiri üst üste koy, en üste küreyi yerleştir: bir ağaç!',explanation:'Silindirler ağacın gövdesi, yeşil küre yaprakları oldu. Küre en üstte durduğu için yuvarlanmaz.',pieces:[{shape:'cylinder',x:300,y:239},{shape:'cylinder',x:300,y:147},{shape:'sphere',x:300,y:57}]}
 ],
 compose:[
  {instruction:'Bir kare, bir üçgen ve bir daireyle güneşli bir ev kur.',explanation:'Şekiller bir araya gelince yeni bir model oluşur. Her parçanın biçimi aynı kalır.',pieces:[{shape:'square',x:300,y:245},{shape:'triangle',x:300,y:163},{shape:'circle',x:465,y:80}]},
  {instruction:'Parçaları birleştirerek bir araç oluştur.',explanation:'Dikdörtgen gövde, iki daire tekerlek oldu. Her parçanın biçimi aynı kaldı.',pieces:[{shape:'rectangle',x:300,y:170},{shape:'circle',x:255,y:240},{shape:'circle',x:345,y:240}]},
  {instruction:'İki kareyi üst üste koy, en üste üçgen bir çatı ekle: bir kule kur.',explanation:'İki kare kulenin gövdesi, üçgen çatısı oldu. Şekiller yeni bir model oluşturdu.',pieces:[{shape:'square',x:300,y:245},{shape:'square',x:300,y:165},{shape:'triangle',x:300,y:83}]},
  {instruction:'İki daireyi yan yana koy, öndekinin üstüne üçgen bir şapka tak: şapkalı bir tırtıl!',explanation:'İki daire tırtılın gövdesi, üçgen şapkası oldu. Her parçanın biçimi aynı kaldı.',pieces:[{shape:'circle',x:250,y:242},{shape:'circle',x:336,y:242},{shape:'triangle',x:336,y:157}]}
 ]
};
