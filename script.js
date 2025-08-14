
// ===== State =====
const STORAGE_KEY='sv151-collectie', WISH_KEY='sv151-wishlist', QTY_KEY='sv151-qty', HISTORY_KEY='sv151-history';
let OWNED=(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}').owned)||{};
let WISH=JSON.parse(localStorage.getItem(WISH_KEY)||'{}');
let QTY=JSON.parse(localStorage.getItem(QTY_KEY)||'{}');
let HISTORY=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}');
let CARDS=[], FILTERED=[], IDX=-1;
let PRICE_SOURCE=localStorage.getItem('sv151-price-source')||'tcgplayer';
let ACTIVE_TAB='all';

// ===== Elements =====
const grid=document.getElementById('grid'), q=document.getElementById('q'), typeSel=document.getElementById('typeSel'),
rarSel=document.getElementById('rarSel'), ownedSel=document.getElementById('ownedSel'), sortSel=document.getElementById('sortSel'),
statusEl=document.getElementById('status'), ownCount=document.getElementById('ownCount'), totCount=document.getElementById('totCount'),
pct=document.getElementById('pct'), bar=document.getElementById('bar'), ownedValue=document.getElementById('ownedValue'),
wishValue=document.getElementById('wishValue'), priceSourceSel=document.getElementById('priceSource');

const tabAll=document.getElementById('tab-all'), tabWish=document.getElementById('tab-wish');
function setTabs(){ if(!tabAll||!tabWish) return; tabAll.classList.toggle('active',ACTIVE_TAB==='all'); tabWish.classList.toggle('active',ACTIVE_TAB==='wish'); }
tabAll?.addEventListener('click',()=>{ACTIVE_TAB='all'; setTabs(); applyFilters();});
tabWish?.addEventListener('click',()=>{ACTIVE_TAB='wish'; setTabs(); applyFilters();});

const viewer=document.getElementById('viewer'), big=document.getElementById('big'), vName=document.getElementById('vName'),
vNum=document.getElementById('vNum'), vRarity=document.getElementById('vRarity'), vTypes=document.getElementById('vTypes');
document.getElementById('closeBtn').onclick=()=>viewer.close();
document.getElementById('prevBtn').onclick=()=>openViewer(IDX-1);
document.getElementById('nextBtn').onclick=()=>openViewer(IDX+1);

// ===== Live prices via pokemontcg.io =====
const PRICE_CACHE_KEY='sv151-live-cards', PRICE_CACHE_TS_KEY='sv151-live-ts', ONE_DAY=24*3600*1000;
// const API_KEY=''; // optioneel (maar zichtbaar in frontend)
async function fetchCardsLive(){
  const url=new URL('https://api.pokemontcg.io/v2/cards');
  url.searchParams.set('q','set.id:"sv3pt5"');
  url.searchParams.set('pageSize','250');
  const headers={};
  // if(API_KEY) headers['X-Api-Key']=API_KEY;
  const res=await fetch(url,{headers});
  if(!res.ok) throw new Error('API '+res.status);
  const data=await res.json();
  return data.data||[];
}
async function ensureFreshPrices(force=false){
  try{
    const ts=+localStorage.getItem(PRICE_CACHE_TS_KEY)||0;
    const stale=Date.now()-ts>ONE_DAY;
    const cached=JSON.parse(localStorage.getItem(PRICE_CACHE_KEY)||'[]');
    if(!force && !stale && cached.length){
      CARDS=cached; localStorage.setItem('sv151-cards-cache',JSON.stringify(CARDS));
      populateFilters(); applyFilters();
      statusEl.textContent=`Live prijzen (cache <24u) • ${CARDS.length} kaarten`; return;
    }
    statusEl.textContent='Live prijzen ophalen…';
    const fresh=await fetchCardsLive();
    fresh.sort((a,b)=>Number(a.number.replace(/\D/g,''))-Number(b.number.replace(/\D/g,'')));
    localStorage.setItem(PRICE_CACHE_KEY,JSON.stringify(fresh));
    localStorage.setItem(PRICE_CACHE_TS_KEY,String(Date.now()));
    localStorage.setItem('sv151-cards-cache',JSON.stringify(fresh));
    CARDS=fresh; populateFilters(); applyFilters();
    statusEl.textContent=`Live prijzen geüpdatet • ${CARDS.length} kaarten`;
    logHistorySample();
  }catch(e){ console.error(e); statusEl.textContent='Live prijsupdate mislukt (gebruik cache).'; }
}
document.getElementById('btn-live-refresh')?.addEventListener('click',()=> ensureFreshPrices(true));

// ===== Helpers =====
const USD_TO_EUR=0.92, toEUR=x=>x.toLocaleString('nl-BE',{style:'currency',currency:'EUR'});
function rarityColor(r){if(!r) return 'var(--soft)'; r=r.toLowerCase();
  if(r.includes('illustration'))return'var(--r-illustration)';
  if(r.includes('double'))return'var(--r-double)';
  if(r.includes('ultra')||r.includes('ex'))return'var(--r-ultra)';
  if(r.includes('rare'))return'var(--r-rare)';
  if(r.includes('uncommon'))return'var(--r-uncommon)';
  return'var(--r-common)';
}
function pickPrice(c,src){
  if(src==='tcgplayer'){
    const tp=c.tcgplayer?.prices; if(tp){
      const usd=[tp.holofoil?.market,tp.normal?.market,tp.reverseHolofoil?.market,tp.ultraRare?.market,tp.rainbowRare?.market,tp.gold?.market]
        .filter(v=>typeof v==='number'&&v>0);
      if(usd.length) return +(Math.max(...usd)*USD_TO_EUR).toFixed(2);
    } return null;
  } else {
    const cm=c.cardmarket?.prices; if(cm){
      const arr=[cm.trendPrice,cm.avg7,cm.avg30,cm.averageSellPrice,cm.lowPrice,cm.suggestedPrice,cm.reverseHoloTrend,cm.reverseHoloSell]
        .filter(v=>typeof v==='number'&&v>0);
      if(arr.length) return +Math.max(...arr).toFixed(2);
    } return null;
  }
}

// ===== Filters & render =====
function populateFilters(){
  const types=[...new Set(CARDS.flatMap(c=>c.types||[]))].sort();
  typeSel.innerHTML='<option value=\"\">Alle types</option>'+types.map(t=>`<option value="${t}">${t}</option>`).join('');
  const rars=[...new Set(CARDS.map(c=>c.rarity).filter(Boolean))].sort();
  rarSel.innerHTML='<option value=\"\">Alle rarities</option>'+rars.map(r=>`<option value="${r}">${r}</option>`).join('');
}
function applyFilters(){
  const term=q.value.trim().toLowerCase();
  FILTERED=CARDS.filter(c=>{
    if(ACTIVE_TAB==='wish' && !WISH[c.id]) return false;
    if(term){const txt=(c.name+' '+c.number).toLowerCase(); if(!txt.includes(term)) return false;}
    if(typeSel.value&&!(c.types||[]).includes(typeSel.value)) return false;
    if(rarSel.value&&(c.rarity||'')!==rarSel.value) return false;
    const has=!!OWNED[c.id];
    if(ownedSel.value==='owned'&&!has) return false;
    if(ownedSel.value==='missing'&&has) return false;
    return true;
  });
  const key=sortSel.value;
  if(key==='price'){FILTERED.sort((a,b)=>(pickPrice(b,PRICE_SOURCE)||0)-(pickPrice(a,PRICE_SOURCE)||0));}
  else if(key==='name'){FILTERED.sort((a,b)=>a.name.localeCompare(b.name));}
  else {FILTERED.sort((a,b)=>Number(a.number.replace(/\D/g,''))-Number(b.number.replace(/\D/g,'')));}
  renderGrid(); updateStats();
}
function renderGrid(){
  grid.innerHTML='';
  FILTERED.forEach((c,idx)=>{
    const card=document.createElement('div'); card.className='card'; card.dataset.cardId=c.id; card.style.borderColor=rarityColor(c.rarity);
    const small=c.images?.small||'';
    card.innerHTML=`<img loading="lazy" src="${small}" alt="${c.name}" data-idx="${idx}"><div class="meta"><span class="chip">#${c.number}</span><span class="chip">${c.rarity||''}</span></div>`;
    const p=pickPrice(c,PRICE_SOURCE); if(p){const x=document.createElement('div'); x.className='price'; x.textContent='€ '+p.toFixed(2); card.appendChild(x);}
    if(OWNED[c.id]){const o=document.createElement('div'); o.className='own'; o.textContent='✓'; card.appendChild(o);}
    if(QTY[c.id]&&QTY[c.id]>1){const qx=document.createElement('div'); qx.className='qty'; qx.textContent='x'+QTY[c.id]; card.appendChild(qx);}

    if(!OWNED[c.id]){ // wishlist toggle
      const wishBtn=document.createElement('div');
      wishBtn.className='chip'; wishBtn.style.position='absolute'; wishBtn.style.left='8px'; wishBtn.style.bottom='8px'; wishBtn.style.cursor='pointer';
      wishBtn.textContent=WISH[c.id]?'★ Op wishlist':'☆ Wishlist';
      wishBtn.onclick=(e)=>{e.stopPropagation(); if(WISH[c.id]) delete WISH[c.id]; else WISH[c.id]=true; localStorage.setItem(WISH_KEY,JSON.stringify(WISH)); applyFilters();};
      card.appendChild(wishBtn);
    }

    // gestures
    let timer=null;
    card.addEventListener('touchstart',()=>{timer=setTimeout(()=>{QTY[c.id]=(QTY[c.id]||(OWNED[c.id]?1:0))+1; OWNED[c.id]=True;},500)});
    card.addEventListener('touchend',()=>{if(timer){clearTimeout(timer); saveAll(); applyFilters();}});
    card.addEventListener('click',()=>{OWNED[c.id]=!OWNED[c.id]; if(OWNED[c.id]&&!QTY[c.id])QTY[c.id]=1; if(!OWNED[c.id]){delete QTY[c.id]; delete WISH[c.id]; localStorage.setItem(WISH_KEY,JSON.stringify(WISH));} saveAll(); applyFilters();});
    card.querySelector('img').addEventListener('dblclick',ev=>{ev.stopPropagation(); openViewer(idx);});
    grid.appendChild(card);
  });
}
function updateStats(){
  const total=CARDS.length||207; const n=Object.keys(OWNED).filter(k=>OWNED[k]).length;
  ownCount.textContent=n; totCount.textContent=total; pct.textContent=Math.round(n/total*1000)/10; bar.style.width=Math.round(n/total*100)+'%';
  let ownVal=0, wishVal=0;
  for(const c of CARDS){const p=pickPrice(c,PRICE_SOURCE); if(!p) continue; if(OWNED[c.id]) ownVal+=p;}
  for(const id in WISH){if(!OWNED[id]){const c=CARDS.find(x=>x.id===id); if(c){const p=pickPrice(c,PRICE_SOURCE); if(p) wishVal+=p;}}}
  ownedValue.textContent=toEUR(+ownVal.toFixed(2)); wishValue.textContent=toEUR(+wishVal.toFixed(2));
}
function saveAll(){localStorage.setItem(STORAGE_KEY,JSON.stringify({owned:OWNED})); localStorage.setItem(WISH_KEY,JSON.stringify(WISH)); localStorage.setItem(QTY_KEY,JSON.stringify(QTY));}

// ===== Viewer + price history (client-side) =====
function openViewer(i){
  if(i<0||i>=FILTERED.length) return; IDX=i;
  const c=FILTERED[i]; big.src=c.images?.large||c.images?.small||''; vName.textContent=c.name; vNum.textContent='#'+c.number;
  vRarity.textContent=c.rarity||''; vTypes.innerHTML=(c.types||[]).map(t=>'<span class="chip">'+t+'</span>').join(' ');
  drawHistory(c.id); viewer.showModal();
}
function drawHistory(cardId){
  const cvs=document.getElementById('priceChart'), ctx=cvs.getContext('2d');
  cvs.width=600; cvs.height=160; ctx.clearRect(0,0,cvs.width,cvs.height);
  const samples=(HISTORY[cardId]||[]).slice(-40);
  const key=(PRICE_SOURCE==='tcgplayer'?'tp':'cm');
  const data=samples.map(s=>s[key]).filter(v=>typeof v==='number');
  if(!data.length){ctx.fillStyle='#9ab0c7'; ctx.fillText('Nog geen data — prijzen bouwen lokaal op.',16,24); return;}
  const min=Math.min(...data), max=Math.max(...data);
  const pad=10, W=cvs.width-2*pad, H=cvs.height-2*pad;
  ctx.strokeStyle='#eacb6b'; ctx.lineWidth=2; ctx.beginPath();
  data.forEach((v,i)=>{
    const x=pad+(i*(W/(data.length-1||1)));
    const y=pad+H-((v-min)/(max-min||1))*H;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  ctx.fillStyle='#9ab0c7'; ctx.fillText('Min: €'+min.toFixed(2)+'  Max: €'+max.toFixed(2), pad, cvs.height-8);
}
function logHistorySample(){
  const t=Date.now();
  for(const c of CARDS){
    const cm=pickPrice(c,'cardmarket'); const tp=pickPrice(c,'tcgplayer');
    if(!HISTORY[c.id]) HISTORY[c.id]=[];
    HISTORY[c.id].push({t,cm,tp});
    if(HISTORY[c.id].length>120) HISTORY[c.id].shift();
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(HISTORY));
}

// ===== Events =====
q.oninput=applyFilters; typeSel.onchange=applyFilters; rarSel.onchange=applyFilters; ownedSel.onchange=applyFilters; sortSel.onchange=applyFilters;
priceSourceSel.value=PRICE_SOURCE; priceSourceSel.onchange=()=>{PRICE_SOURCE=priceSourceSel.value; localStorage.setItem('sv151-price-source',PRICE_SOURCE); applyFilters();};
document.getElementById('btn-export').onclick=()=>{const blob=new Blob([JSON.stringify({owned:OWNED,wishlist:WISH,qty:QTY},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sv151-collectie.json'; a.click();};
document.getElementById('btn-import').onclick=()=>{const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json'; inp.onchange=async()=>{const txt=await inp.files[0].text(); const obj=JSON.parse(txt); OWNED=obj.owned||{}; WISH=obj.wishlist||{}; QTY=obj.qty||{}; saveAll(); applyFilters(); }; inp.click();};
document.getElementById('btn-cache').onclick=async()=>{try{const reg=await navigator.serviceWorker.ready; const ch=new MessageChannel(); ch.port1.onmessage=(e)=>{if(e.data?.done) alert('Alle kaartafbeeldingen zijn gecachet!');}; reg.active.postMessage({type:'PREFETCH_ALL',cards:CARDS},[ch.port2]);}catch(e){alert('Service worker nog niet actief. Herlaad en probeer opnieuw.');}};

// ===== Service Worker =====
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));}

// ===== Init =====
(function init(){
  try{
    const cache=JSON.parse(localStorage.getItem('sv151-cards-cache')||'[]');
    if(cache.length){CARDS=cache; populateFilters(); applyFilters(); statusEl.textContent=`Cache: ${CARDS.length} kaarten`;}
  }catch{}
  setTabs();
  ensureFreshPrices();
})();
