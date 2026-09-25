/** Soru görseli: "count:🍒:25" beşli gruplar, "groups:🍓:3x4" dolu tabaklar, "share:🍓:12:3" paylaştırılacak çilekler ve boş tabaklar; diğerleri düz metin. */
export default function Picture({visual}:{visual:string}){
 const [kind,item,a,b]=visual.split(':');
 if(kind==='count'){const n=Number(a);return <div className="visual-object picture-set" role="img" aria-label={`${n/5} grup, her grupta 5 ${item}`}>{Array.from({length:n/5},(_,i)=><span className="picture-group" key={i}>{item.repeat(5)}</span>)}</div>}
 if(kind==='groups'){const [plates,each]=a.split('x').map(Number);return <div className="visual-object picture-set" role="img" aria-label={`${plates} tabak, her tabakta ${each} ${item}`}>{Array.from({length:plates},(_,i)=><span className="plate" key={i}>{item.repeat(each)}</span>)}</div>}
 if(kind==='share'){const total=Number(a),plates=Number(b);return <div className="visual-object picture-set" role="img" aria-label={`${total} ${item} ve ${plates} boş tabak`}><span className="picture-pile">{item.repeat(total)}</span><span className="share-arrow" aria-hidden="true">→</span>{Array.from({length:plates},(_,i)=><span className="plate is-empty" key={i}>?</span>)}</div>}
 return <div className={`visual-object ${visual.length>20?'objects':''}`} aria-label="Sorunun görseli">{visual}</div>;
}
