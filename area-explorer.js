import {weatherMany,terrainMany,predict} from './weather-client.js?v=12';
import {getMeta,setMeta} from './storage.js?v=12';
import {mapLimit} from './search-grid.js?v=12';
export async function fetchCells(cells,date,{signal,onProgress=()=>{},offline=false}={}){
 const keys=cells.map(c=>`area:${c.lat.toFixed(6)}:${c.lon.toFixed(6)}:${date}`),result=[],pending=[];
 for(let i=0;i<cells.length;i++){signal?.throwIfAborted();const cached=await getMeta(keys[i]);if(cached?.models?.rovellons?.model==='heuristic-v3'&&(offline||(cached.environment.weather?.observation_version===1&&Number.isFinite(cached.environment.weather?.temperature)&&Number.isFinite(cached.environment.weather?.rain?.['14'])&&Date.now()-Date.parse(cached.environment.updated_at)<21600000))){result[i]={...cached,cell:cells[i]};}else pending.push(i);}
 signal?.throwIfAborted();if(offline){if(pending.length)throw new Error('Aquesta zona no està guardada. Connecta’t per carregar-la.');return result;}
 if(!pending.length){onProgress(cells.length,cells.length);return result;}
 const points=pending.map(i=>cells[i]);
 const [weather,terrain]=await Promise.allSettled([weatherMany(null,points,date,{signal}),terrainMany(null,points,{signal})]);signal?.throwIfAborted();
 if(weather.status==='rejected')throw weather.reason;
 let done=result.filter(Boolean).length;
 await mapLimit(pending,2,async(i,j)=>{
  const options={signal,cell:cells[i],weather:weather.value[j],terrain:terrain.status==='fulfilled'?terrain.value[j]:{elevation:null,slope:null,aspect:null,error:'Font de relleu no disponible'}};
  const p=await predict(null,cells[i].lat,cells[i].lon,date,options);signal?.throwIfAborted();result[i]=p;await setMeta(keys[i],p);onProgress(++done,cells.length);
 },signal);
 return result;
}
