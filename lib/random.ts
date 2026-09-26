export function rng(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
export function shuffle<T>(items:readonly T[],random= Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export const newSeed=()=>Math.floor(Math.random()*1e6);
/** Tohuma bağlı deste: aynı tohumda 0…n-1 sıraları her öğeyi bir kez verir, sonraki tur yeniden karılır. step, aynı karılışta sıradaki öğeye geçer; n adımda her öğe denenir. */
export function pick<T>(items:readonly T[],position:number,seed:number,step=0):T{const n=items.length,order=shuffle([...Array(n).keys()],rng(seed*7919+Math.floor(position/n)*104729));return items[order[(position+step)%n]]}
