/** [durum ya da soru, doğru cevap, yanlış seçenekler, açıklama] */
export type PoolScenario=[string,string,string[],string];
export interface PoolLesson {id:string;title:string;theme:string;icon:string;code:string;hint:string;learn:string[];scenarios:PoolScenario[]}
