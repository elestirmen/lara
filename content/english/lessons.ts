import type {Lesson} from '@/lib/types';
const groups=[
 ['School Life','Hello, Piko!','👋',[['hello','👋','merhaba'],['teacher','🧑‍🏫','öğretmen'],['school','🏫','okul'],['student','🧒','öğrenci'],['goodbye','🙋','hoşça kal'],['friend','🧑‍🤝‍🧑','arkadaş'],['bag','🎒','çanta'],['bus','🚌','otobüs']]],
 ['Classroom Life','Renkli sınıfım','🎒',[['book','📖','kitap'],['pencil','✏️','kalem'],['chair','🪑','sandalye'],['red','🔴','kırmızı'],['blue','🔵','mavi'],['ruler','📏','cetvel'],['green','🟢','yeşil'],['yellow','🟡','sarı']]],
 ['Personal Life','Kendimi tanıtıyorum','😊',[['head','🙂','baş'],['shirt','👕','gömlek'],['eye','👁️','göz'],['hand','✋','el'],['ear','👂','kulak'],['nose','👃','burun'],['foot','🦶','ayak'],['shoes','👟','ayakkabı']]],
 ['Family Life','Benim ailem','🏡',[['mother','👩','anne'],['father','👨','baba'],['sister','👧','kız kardeş'],['brother','👦','erkek kardeş'],['grandmother','👵','büyükanne'],['grandfather','👴','büyükbaba'],['baby','👶','bebek'],['family','👪','aile']]],
 ['Homes & Houses & Neighbourhoods','Evde keşif','🛋️',[['bed','🛏️','yatak'],['door','🚪','kapı'],['house','🏠','ev'],['window','🪟','pencere'],['cat','🐈','kedi'],['dog','🐕','köpek'],['sofa','🛋️','kanepe'],['bath','🛁','küvet']]],
 ['Life in the City & the World','Piknik sepetim','🧺',[['apple','🍎','elma'],['bread','🍞','ekmek'],['milk','🥛','süt'],['egg','🥚','yumurta'],['cheese','🧀','peynir'],['banana','🍌','muz'],['water','💧','su'],['cake','🍰','pasta']]]
] as const;
export const englishLessons:Lesson[]=groups.map(([theme,title,icon,vocab],i)=>({id:`english-${i}`,subject:'english',theme,title,subtitle:'Dinle, eşleştir, sesli söyle.',icon,minutes:6,outcomes:[`ENG.2.${i+1}.V1`,`ENG.2.${i+1}.R3`],kind:'matching',generator:'vocab',learn:['Önce resme bak. Kelimeyi dinlemek için ses düğmesine dokun.','Kelimeyi sesli tekrar et. Sonra resimle eşleştir.'],vocabulary:vocab.map(([word,picture,meaning])=>({word,picture,meaning}))}));
