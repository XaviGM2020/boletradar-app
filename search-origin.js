const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createSearchOrigin({L,map}){
 const pane=map.createPane('searchOrigin');pane.style.zIndex='650';const radiusPane=map.createPane('searchRadius');radiusPane.style.zIndex='450';radiusPane.style.pointerEvents='none';let marker=null,ring=null;
 function clear(){marker?.remove();ring?.remove();marker=ring=null;}
 function set(origin,radius){
  clear();if(!Number.isFinite(origin?.lat)||!Number.isFinite(origin?.lon))return;
  const label=origin.kind==='device'?'Ubicació del telèfon':origin.kind==='county'?`Centre orientatiu de la comarca · ${origin.county}`:origin.kind==='map-point'?'Punt triat al mapa':'Centre del mapa';
  marker=L.circleMarker([origin.lat,origin.lon],{pane:'searchOrigin',className:'search-origin-marker',radius:10,color:'#fffefa',weight:3,fillColor:'#c65326',fillOpacity:1,bubblingMouseEvents:false}).addTo(map);
  const element=marker.getElement();element.setAttribute('role','button');element.setAttribute('tabindex','0');element.setAttribute('aria-label','Centre de cerca · '+label);element.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();marker.openPopup();}});
  marker.bindTooltip('Centre de cerca',{permanent:true,direction:'top',offset:[0,-12],className:'search-origin-label'});
  marker.bindPopup(`<div class="search-origin-popup"><span class="eyebrow">ORIGEN DE LA CERCA</span><h3>${esc(label)}</h3><p>${origin.lat.toFixed(5)}, ${origin.lon.toFixed(5)}</p><p>${radius==='all'?'Àmbit de cerca: tot Catalunya.':'Radi de cerca: '+radius+' km.'}</p>${origin.kind==='device'&&Number.isFinite(origin.accuracy)?`<p>Precisió indicada pel telèfon: ±${Math.round(origin.accuracy)} m.</p>`:''}<p>És el centre des d’on es comparen les zones; no és una proposta de troballa.</p></div>`,{maxWidth:260,maxHeight:180,keepInView:true,autoPanPaddingTopLeft:[16,65],autoPanPaddingBottomRight:[16,135]});
  if(radius!=='all')ring=L.circle([origin.lat,origin.lon],{pane:'searchRadius',radius:radius*1000,className:'search-radius-ring',color:'#c65326',weight:1.5,opacity:.65,dashArray:'5 7',fill:false,interactive:false}).addTo(map);
 }
 return {set,clear};
}
