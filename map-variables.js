const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(v,unit='',digits=1)=>Number.isFinite(v)?v.toLocaleString('ca-ES',{maximumFractionDigits:digits})+unit:'Sense dades';
const factor=(p,s,name)=>p.models?.[s]?.factors?.find(f=>f.name===name)?.value??null;
const weather=p=>p.environment?.weather||{};
const forest=p=>p.environment?.forest||{};
const colors=['#b4cdd9','#6eacb5','#d8b963','#b66945'];
const bins=(value,breaks)=>!Number.isFinite(value)?'#87918a':colors[breaks.filter(x=>value>=x).length];
const treeNames=p=>(forest(p).host_trees||[]).map(t=>t.name!==t.scientific_name?`${t.name} (${t.scientific_name})`:t.name).join(' · ');
const weatherSource=p=>`${weather(p).source?.name||'Font meteorològica desconeguda'} · ${weather(p).source?.resolution||'Resolució no disponible'}`;
const treeSource=p=>`${forest(p).species_source?.name||'Font d’espècies desconeguda'} · ${forest(p).species_source?.reference_period||'Període no disponible'}`;
export const VARIABLES=[
 {id:'index',name:'Índex ambiental',value:(p,s)=>p.models?.[s]?.index??null,format:v=>number(v,' /100',0),color:v=>v==null?'#87918a':v>=70?'#36785a':v>=40?'#bea352':'#bd704b',legend:[['#bd704b','0–39'],['#bea352','40–69'],['#36785a','70–100']],source:()=> 'Model heurístic · índex d’adequació, no probabilitat de trobar bolets.'},
 {id:'temperature',name:'Temperatura',value:p=>weather(p).temperature,format:v=>number(v,' °C'),color:v=>bins(v,[5,15,25]),legend:colors.map((c,i)=>[c,['<5 °C','5–15 °C','15–25 °C','≥25 °C'][i]]),source:weatherSource},
 {id:'rain',name:'Pluja anterior · 14 dies',value:p=>weather(p).rain?.['14'],format:v=>number(v,' mm'),color:v=>bins(v,[20,55,100]),legend:colors.map((c,i)=>[c,['<20 mm','20–55 mm','55–100 mm','≥100 mm'][i]]),source:weatherSource},
 {id:'soil',name:'Humitat del sòl',value:p=>weather(p).soil_moisture,format:v=>number(v,' m³/m³',3),color:v=>bins(v,[.1,.2,.35]),legend:colors.map((c,i)=>[c,['<0,10','0,10–0,20','0,20–0,35','≥0,35'][i]]),source:p=>weatherSource(p)+' · Humitat modelitzada, no mesurada al punt.'},
 {id:'humidity',name:'Humitat de l’aire',value:p=>weather(p).humidity,format:v=>number(v,' %'),color:v=>bins(v,[40,60,80]),legend:colors.map((c,i)=>[c,['<40 %','40–60 %','60–80 %','≥80 %'][i]]),source:weatherSource},
 {id:'elevation',name:'Altitud del model',value:p=>weather(p).elevation,format:v=>number(v,' m',0),color:v=>bins(v,[500,1000,1500]),legend:colors.map((c,i)=>[c,['<500 m','500–1.000 m','1.000–1.500 m','≥1.500 m'][i]]),source:p=>weatherSource(p)+' · Altitud de la malla meteorològica, no un model de terreny detallat.'},
 {id:'cover',name:'Cobertura arbòria · cel·les',value:p=>forest(p).tree_cover,format:v=>number(v,' %'),color:v=>bins(v,[20,50,70]),legend:colors.map((c,i)=>[c,['<20 %','20–50 %','50–70 %','≥70 %'][i]]),source:p=>`${forest(p).source?.name||'Font desconeguda'} · ${forest(p).source?.reference_period||'Període desconegut'}`},
 {id:'trees',name:'Espècies d’arbres',value:p=>treeNames(p)?forest(p).forest_type:forest(p).forest_type==='none'?'none':null,format:(v,p)=>treeNames(p)||(v==='none'?'Zona sense arbrat':'Sense dades d’espècies'),color:v=>({pine:'#39775b',beech:'#b77a41',oak:'#809242',chestnut:'#8a5873',mixed:'#4d8198',none:'#d3c8b2'}[v]||'#87918a'),legend:[['#39775b','Pins'],['#b77a41','Faigs'],['#809242','Roures / alzines'],['#8a5873','Castanyers'],['#4d8198','Mixt'],['#d3c8b2','Sense arbrat']],source:p=>treeSource(p)+' · Espècies registrades al polígon, no identificació actual de cada arbre.'},
 {id:'host',name:'Compatibilitat dels arbres',value:(p,s)=>factor(p,s,'Compatibilitat d’arbres hostes'),format:v=>number(v,' /1',2),color:v=>!Number.isFinite(v)?'#87918a':v>=.6?'#36785a':v>.3?'#bea352':'#bd704b',legend:[['#bd704b','0–0,30'],['#bea352','>0,30–<0,60'],['#36785a','0,60–1']],source:p=>treeSource(p)+' · Factor del model; no probabilitat de trobar bolets.'},
 {id:'season',name:'Època de l’any',value:(p,s)=>factor(p,s,'Estacionalitat'),format:(v,p)=>!Number.isFinite(v)?'Sense dades':`${new Date(p.environment.date+'T12:00:00Z').toLocaleDateString('ca-ES',{month:'long',timeZone:'Europe/Madrid'})} · ${v===1?'dins dels mesos configurats':'fora dels mesos configurats'} · factor ${number(v,'',2)}`,color:v=>!Number.isFinite(v)?'#87918a':v===1?'#36785a':'#bea352',legend:[['#36785a','Dins: factor 1'],['#bea352','Fora: factor 0,25']],source:()=> 'Mes de la data consultada i calendari heurístic de l’espècie. És un factor temporal; no varia entre punts de la mateixa data.'}
];
export function variableInfo(id,p,species){const d=VARIABLES.find(x=>x.id===id);if(!d)throw new Error('Variable desconeguda');const value=d.value(p,species);return {value,text:d.format(value,p),color:d.color(value),source:d.source(p),definition:d};}
export function createVariableLayers({L,map,species,onSelect,destination,onChange}){
 const groups=Object.fromEntries(VARIABLES.map(d=>[d.id,L.layerGroup()])),points=new Map(),rectangles=new Map();let active='index';
 const control=L.control({position:'bottomleft'});
 control.onAdd=()=>{const el=L.DomUtil.create('div','map-variable-legend');el.setAttribute('role','status');L.DomEvent.disableClickPropagation(el);L.DomEvent.disableScrollPropagation(el);return el;};control.addTo(map);
 function legend(){const d=VARIABLES.find(x=>x.id===active),dates=[...new Set([...points.values()].map(r=>r.p.environment.date))];const el=control.getContainer();el.hidden=!map.hasLayer(groups[active]);el.innerHTML=`<strong>${esc(d.name)}</strong><div class="variable-scale">${d.legend.map(([color,label])=>`<span><i style="background:${color}"></i>${esc(label)}</span>`).join('')}<span><i style="background:#87918a"></i>Sense dades / sense categoria</span></div><small>${points.size?'Cel·les consultades · toca-les per veure el valor':'Fes una cerca per veure els valors al mapa'}</small><small>${dates.length===1?esc(dates[0]):dates.length?'Dates diverses: consulta cada cel·la':''}${['index','host','season'].includes(active)?' · '+(species()==='ceps'?'Ceps':'Rovellons'):''}</small>`;}
 function popup(p){const info=variableInfo(active,p,species());return `<div class="variable-popup"><span class="eyebrow">${esc(p.comarca)} · ${esc(p.environment.date)}</span><h3>${esc(info.definition.name)}</h3><strong>${esc(info.text)}</strong><p>${esc(info.source)}</p>${p.models?.[species()]?.quality==='provisional'&&['index','host'].includes(active)?'<p>Informació incompleta d’arbres hostes: factor provisional.</p>':''}${destination(p)}</div>`;}
 function upsert(p,{recommendable=true}={}){
  const id=p.cell.id;for(const [key,r] of rectangles.get(id)||[])groups[key].removeLayer(r);points.set(id,{p,recommendable});const next=[];
  for(const d of VARIABLES){if(d.id==='index'&&!recommendable)continue;const info=variableInfo(d.id,p,species());const r=L.rectangle(p.cell.bounds,{color:info.color,fillColor:info.color,fillOpacity:.5,weight:2,bubblingMouseEvents:false});r.bindTooltip(`<strong>${esc(d.name)}: ${esc(info.text)}</strong><br>${esc(p.environment.date)}`,{sticky:true});r.bindPopup(()=>popup(p),{maxWidth:Math.max(160,Math.min(300,map.getSize().x-80)),maxHeight:map.getSize().y<450?180:260,keepInView:true,autoPanPaddingTopLeft:[16,65],autoPanPaddingBottomRight:[16,135]});r.on('click',()=>onSelect(p));groups[d.id].addLayer(r);next.push([d.id,r]);}rectangles.set(id,next);legend();
 }
 function refresh(){for(const {p,recommendable} of [...points.values()])upsert(p,{recommendable});legend();onChange?.();}
 function clear(){for(const g of Object.values(groups))g.clearLayers();points.clear();rectangles.clear();legend();}
 function select(id){if(!groups[id])throw new Error('Variable desconeguda');active=id;for(const [key,g] of Object.entries(groups))if(key!==id&&map.hasLayer(g))map.removeLayer(g);groups[id].addTo(map);legend();onChange?.();}
 groups.index.addTo(map);legend();
 return {select,upsert,refresh,clear,popup};
}

export function createVariableControl({L,map,variables,coverage}){
 const control=L.control({position:'topright'});let root,panel,toggle;
 function collapse(){panel.hidden=true;toggle.hidden=false;root.classList.remove('leaflet-control-layers-expanded');toggle.setAttribute('aria-expanded','false');}
 control.onAdd=()=>{
  root=L.DomUtil.create('div','leaflet-control-layers variable-layer-control');L.DomEvent.disableClickPropagation(root);L.DomEvent.disableScrollPropagation(root);
  toggle=document.createElement('button');toggle.type='button';toggle.className='leaflet-control-layers-toggle';toggle.id='open-map-layers';toggle.title='Capes del mapa';toggle.setAttribute('aria-label','Capes del mapa');toggle.setAttribute('aria-expanded','false');root.append(toggle);
  panel=document.createElement('div');panel.className='variable-layers-panel';panel.hidden=true;root.append(panel);
  const label=document.createElement('label');label.htmlFor='map-variable';label.textContent='Variable del model';panel.append(label);
  const select=document.createElement('select');select.id='map-variable';for(const d of VARIABLES){const o=document.createElement('option');o.value=d.id;o.textContent=d.name;select.append(o);}select.addEventListener('change',()=>variables.select(select.value));panel.append(select);
  const coverLabel=document.createElement('label');coverLabel.className='variable-cover-check';const check=document.createElement('input');check.type='checkbox';check.id='map-cover-layer';check.addEventListener('change',()=>check.checked?coverage.addTo(map):map.removeLayer(coverage));coverLabel.append(check,document.createTextNode('Cobertura arbòria · ICGC 2016–2017'));panel.append(coverLabel);
  const close=document.createElement('button');close.type='button';close.textContent='Tancar capes';close.id='close-map-layers';close.addEventListener('click',collapse);panel.append(close);
  toggle.addEventListener('click',()=>{panel.hidden=false;toggle.hidden=true;root.classList.add('leaflet-control-layers-expanded');toggle.setAttribute('aria-expanded','true');});
  return root;
 };
 control.collapse=collapse;control.addTo(map);return control;
}
