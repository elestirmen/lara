/** [soru, doğru cevap, yanlış, yanlış] */
export type Ask=[string,string,string,string];
export interface PoolStory {theme:string;title:string;icon:string;text:string;where:string;why:string;word:string;meaning:string;events:string[];detail:Ask;detail2:Ask;detail3:Ask;feeling:Ask;place:string;cause:string;inference:string;alternatives:string[];ask:string;exclaim:string;sentences:{words:string[];swap:boolean}[]}
