const opened=new Promise((resolve,reject)=>{const r=indexedDB.open('boletradar-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('outings',{keyPath:'id'});r.result.createObjectStore('meta');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function transaction(store,mode,fn){const db=await opened;return new Promise((resolve,reject)=>{const t=db.transaction(store,mode);let result;const r=fn(t.objectStore(store));if(r)r.onsuccess=()=>{result=r.result};t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error('No s’han pogut desar les dades.'));});}
export const allOutings=()=>transaction('outings','readonly',s=>s.getAll());
export const getOuting=id=>transaction('outings','readonly',s=>s.get(id));
export const putOuting=o=>transaction('outings','readwrite',s=>s.put(o));
export const removeOuting=id=>transaction('outings','readwrite',s=>s.delete(id));
export const getMeta=k=>transaction('meta','readonly',s=>s.get(k));
export const setMeta=(k,v)=>transaction('meta','readwrite',s=>s.put(v,k));
export const setMetaMany=entries=>transaction('meta','readwrite',s=>{for(const [key,value] of entries)s.put(value,key);});
export const clear=async()=>{await transaction('outings','readwrite',s=>s.clear());await transaction('meta','readwrite',s=>s.clear());};

export const clearSearch=()=>transaction('meta','readwrite',s=>{const c=s.openCursor();c.onsuccess=()=>{const row=c.result;if(!row)return;if(/^(weather:|area:|prediction:|ranking:|saved-predictions$|saved-map-points$|saved-view$|search-results$)/.test(String(row.key)))row.delete();row.continue();};});

export const removeMeta=k=>transaction('meta','readwrite',s=>s.delete(k));
