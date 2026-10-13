export function distanceKm(a,b){const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad,v=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;return 6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));}
function offset(p,r,angle){const rad=angle*Math.PI/180;return {lat:p.lat+r*Math.cos(rad)/111.32,lon:p.lon+r*Math.sin(rad)/(111.32*Math.cos(p.lat*Math.PI/180))};}
export function radiiWithin(radius){if(![5,10,20,40].includes(radius))throw new Error('Radi de cerca no vàlid');return [5,10,20,40].filter(r=>r<=radius);}
export function coarsePoints(center,radius){return [center,...radiiWithin(radius).flatMap(r=>[.4,.85].flatMap(f=>Array.from({length:6},(_,i)=>offset(center,r*f,i*60+(f>.5?30:0)))))];}
export function refinePoints(center,radius,best,seen=[]){const step=Math.max(1,radius*.12);return best.slice(0,2).flatMap(p=>Array.from({length:6},(_,i)=>offset(p,step,i*60))).filter(p=>distanceKm(center,p)<=radius-.6&&!seen.some(q=>distanceKm(p,q)<.8));}
// Up to two interior samples per comarca; independent of the user's position.
export function nationalPoints(boundaries,inside){const points=[];
 for(const feature of boundaries.features){const name=feature.properties.NOMCOMAR,polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates,candidates=[];
  for(const polygon of polygons){const ring=polygon[0],xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),west=Math.min(...xs),east=Math.max(...xs),south=Math.min(...ys),north=Math.max(...ys),center={lat:(south+north)/2,lon:(west+east)/2};
   const samples=[center,...[.2,.35,.5,.65,.8].flatMap(y=>[.2,.35,.5,.65,.8].map(x=>({lat:south+(north-south)*y,lon:west+(east-west)*x}))),...ring.map(([lon,lat])=>({lat:lat*.98+center.lat*.02,lon:lon*.98+center.lon*.02}))];
   for(const p of samples)if(inside(p.lat,p.lon)===name)candidates.push({...p,county:name,centrality:distanceKm(center,p)});
  }
  candidates.sort((a,b)=>a.centrality-b.centrality);if(!candidates.length)continue;const first=candidates[0];points.push(first);const second=candidates.find(p=>distanceKm(first,p)>=5);if(second)points.push(second);
 }
 return points;
}
// A fixed geographic grid, aligned between reloads. At most 24 samples per view.
export function viewportCells(bounds,inside){
 const south=Math.max(40.45,bounds.south),north=Math.min(42.9,bounds.north),west=Math.max(.1,bounds.west),east=Math.min(3.4,bounds.east);if(south>=north||west>=east)return [];
 let step=.09;while((Math.ceil((north-south)/step)+1)*(Math.ceil((east-west)/(step/Math.cos(42*Math.PI/180)))+1)>24)step*=2;
 const dx=step/Math.cos(42*Math.PI/180),cells=[];
 for(let y=Math.floor(south/step);y<=Math.floor(north/step);y++)for(let x=Math.floor(west/dx);x<=Math.floor(east/dx);x++){
  const lat=(y+.5)*step,lon=(x+.5)*dx;if(!inside(lat,lon))continue;
  cells.push({id:`view:${step}:${y}:${x}`,lat,lon,bounds:[[y*step,x*dx],[(y+1)*step,(x+1)*dx]],resolution_m:Math.round(step*111320)});
 }
 return cells;
}
export async function mapLimit(items,limit,fn,signal){let next=0;const results=[];await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){signal?.throwIfAborted();const i=next++;results[i]=await fn(items[i],i);}}));signal?.throwIfAborted();return results;}
