const BASE=new URL('./',self.location.href);
const CACHE='boletradar-shell-local-v7';
const ASSETS=['','index.html','styles.css','app.js','map-variables.js','weather-provenance.js','search-grid.js','area-explorer.js','weather-client.js','storage.js','migration.js','manifest.json','privacy.html','comarques.geojson','vendor/leaflet.js','vendor/leaflet.css','vendor/images/marker-icon.png','vendor/images/marker-icon-2x.png','vendor/images/marker-shadow.png','vendor/images/layers.png','vendor/images/layers-2x.png','icons/icon.svg','icons/icon-192.png','icons/icon-512.png'].map(p=>new URL(p,BASE).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('boletradar-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);url.hash='';if(e.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||!ASSETS.includes(url.href))return;
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(async r=>{if(r.ok){const c=await caches.open(CACHE);await c.put(e.request,r.clone());}return r;}).catch(async()=>{const c=await caches.open(CACHE);return await c.match(e.request)||(e.request.mode==='navigate'?await c.match(BASE.href):Response.error());}));});
