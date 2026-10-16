import {getMeta,setMeta,getOuting,putOuting} from './storage.js?v=18';
// Read-only legacy recovery. No record upload and no remote deletion.
export async function migrateLegacy(){
 await setMeta('syncEnabled',false);
 const token=await getMeta('token');
 if(!token||await getMeta('legacy-copied')||location.hostname!=='boletradar-catalunya.indigo-comet-4444.chatgpt.site')return '';
 if(!/^[a-f0-9]{64}$/.test(token))return 'Exporta una còpia dels registres abans de canviar d’adreça.';
 if(!navigator.onLine)throw new Error('Cal connexió per recuperar la còpia antiga. Els nous registres són locals.');
 let cursor='',pages=0;
 do{
  if(++pages>10000)throw new Error('La migració té massa pàgines.');
  const response=await fetch('/api/outings'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{cache:'no-store',headers:{Authorization:'Bearer '+token}});
  if(!response.ok)throw new Error('No s’ha pogut recuperar la còpia antiga (HTTP '+response.status+').');
  const page=await response.json();
  if(!Array.isArray(page.records))throw new Error('Resposta de migració no vàlida.');
  for(const row of page.records){
   if(row.deleted)continue;
   const remote=row.outing,local=await getOuting(remote.id);
   if(!local)await putOuting({id:remote.id,outing:remote,revision:row.revision,dirty:false,deleted:false,localVersion:0,environment:row.environment});
   else if(!local.deleted&&JSON.stringify({...local.outing,revision:0})!==JSON.stringify({...remote,revision:0})){
    const key='legacy-copy:'+remote.id,id=await getMeta(key)||crypto.randomUUID();await setMeta(key,id);
    if(!await getOuting(id))await putOuting({id,outing:{...remote,id},revision:row.revision,dirty:false,deleted:false,localVersion:0,environment:row.environment});
   }
  }
  cursor=page.next;
 }while(cursor);
 await setMeta('legacy-copied',true);
 return 'Registres antics copiats al dispositiu. Exporta una còpia abans d’obrir la nova adreça. La còpia antiga del servidor es conserva.';
}
