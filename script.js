const STORAGE_KEY='sv151-collectie',WISH_KEY='sv151-wishlist',QTY_KEY='sv151-qty',HISTORY_KEY='sv151-history',MASTER_KEY='sv151-master-v1',PAID_KEY='sv151-paid';
let LEGACY_OWNED=(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}').owned)||{};
let MASTER=JSON.parse(localStorage.getItem(MASTER_KEY)||'{}');
let WISH=JSON.parse(localStorage.getItem(WISH_KEY)||'{}');
let QTY=JSON.parse(localStorage.getItem(QTY_KEY)||'{}');
let PAID=JSON.parse(localStorage.getItem(PAID_KEY)||'{}');
let HISTORY=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}');

let CARDS=[],FILTERED=[],IDX=-1,ACTIVE_TAB='all';
let PRICE_SOURCE=localStorage.getItem('sv151-price-source')||'cardmarket';
let SHOW_PROMOS=localStorage.getItem('sv151-show-promos')==='1';
let BINDER_MODE=false, BINDER_PAGE=0;

// Reguliere ex-kaarten in SV 151 (#001-#165) die GEEN Reverse Holo hebben
const NO_RH_NUMBERS = new Set([3,6,9,24,38,40,65,76,115,124,145,151]);

// Bijbehorende SVP Black Star Promo's & Speciale 151 Varianten
const EXTRA_151_PROMOS = [
  { id:'svp-046', number:'SVP 046', sortNum:1001, name:'Bulbasaur (151 Promo)', rarity:'Promo', types:['Grass'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/46.png',large:'https://images.pokemontcg.io/svp/46_hires.png'} },
  { id:'svp-047', number:'SVP 047', sortNum:1002, name:'Charmander (151 Promo)', rarity:'Promo', types:['Fire'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/47.png',large:'https://images.pokemontcg.io/svp/47_hires.png'} },
  { id:'svp-048', number:'SVP 048', sortNum:1003, name:'Squirtle (151 Promo)', rarity:'Promo', types:['Water'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/48.png',large:'https://images.pokemontcg.io/svp/48_hires.png'} },
  { id:'svp-049', number:'SVP 049', sortNum:1004, name:'Zapdos ex (151 Promo)', rarity:'Promo', types:['Lightning'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/49.png',large:'https://images.pokemontcg.io/svp/49_hires.png'} },
  { id:'svp-050', number:'SVP 050', sortNum:1005, name:'Alakazam ex (151 Promo)', rarity:'Promo', types:['Psychic'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/50.png',large:'https://images.pokemontcg.io/svp/50_hires.png'} },
  { id:'svp-051', number:'SVP 051', sortNum:1006, name:'Snorlax (ETB Promo)', rarity:'Promo', types:['Colorless'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/51.png',large:'https://images.pokemontcg.io/svp/51_hires.png'} },
  { id:'svp-051-pc', number:'SVP 051 PC', sortNum:1007, name:'Snorlax (Pokémon Center Stamp)', rarity:'Promo', types:['Colorless'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/51.png',large:'https://images.pokemontcg.io/svp/51_hires.png'} },
  { id:'svp-052', number:'SVP 052', sortNum:1008, name:'Mewtwo (UPC Promo)', rarity:'Promo', types:['Psychic'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/52.png',large:'https://images.pokemontcg.io/svp/52_hires.png'} },
  { id:'svp-053', number:'SVP 053', sortNum:1009, name:'Mew ex (UPC Promo)', rarity:'Promo', types:['Psychic'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/53.png',large:'https://images.pokemontcg.io/svp/53_hires.png'} },
  { id:'sv3pt5-205-metal', number:'205 Metal', sortNum:1010, name:'Mew ex (Hyper Rare Metal Card)', rarity:'Hyper Rare', types:['Psychic'], isPromo:true, images:{small:'https://images.pokemontcg.io/sv3pt5/205.png',large:'https://images.pokemontcg.io/sv3pt5/205_hires.png'} },
  { id:'svp-056', number:'SVP 056', sortNum:1011, name:'Bulbasaur (Poster Collection)', rarity:'Promo', types:['Grass'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/56.png',large:'https://images.pokemontcg.io/svp/56_hires.png'} },
  { id:'svp-057', number:'SVP 057', sortNum:1012, name:'Charmander (Poster Collection)', rarity:'Promo', types:['Fire'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/57.png',large:'https://images.pokemontcg.io/svp/57_hires.png'} },
  { id:'svp-058', number:'SVP 058', sortNum:1013, name:'Squirtle (Poster Collection)', rarity:'Promo', types:['Water'], isPromo:true, images:{small:'https://images.pokemontcg.io/svp/58.png',large:'https://images.pokemontcg.io/svp/58_hires.png'} },
  { id:'sve-001-cos', number:'SVE 001', sortNum:1021, name:'Basic Grass Energy (Cosmos Holo)', rarity:'Promo', types:['Grass'], isPromo:true, images:{small:'https://images.pokemontcg.io/sve/1.png',large:'https://images.pokemontcg.io/sve/1_hires.png'} },
  { id:'sve-002-cos', number:'SVE 002', sortNum:1022, name:'Basic Fire Energy (Cosmos Holo)', rarity:'Promo', types:['Fire'], isPromo:true, images:{small:'https://images.pokemontcg.io/sve/2.png',large:'https://images.pokemontcg.io/sve/2_hires.png'} },
  { id:'sve-003-cos', number:'SVE 003', sortNum:1023, name:'Basic Water Energy (Cosmos Holo)', rarity:'Promo', types:['Water'], isPromo:true, images:{small:'https://images.pokemontcg.io/sve/3.png',large:'https://images.pokemontcg.io/sve/3_hires.png'} },
  { id:'sve-004-cos', number:'SVE 004', sortNum:1024, name:'Basic Lightning Energy (Cosmos Holo)', rarity:'Promo', types:['Lightning'], isPromo:true, images:{small:'https://images.pokemontcg.io/sve/4.png',large:'https://images.pokemontcg.io/sve/4_hires.png'} },
  { id:'sve-005-cos', number:'SVE 005', sortNum:1025, name:'Basic Psychic Energy (Cosmos Holo)', rarity:'Promo', types:['Psychic'], isPromo:true, images:{small:'https://images.pokemontcg.io/sve/5.png',large:'https://images.pokemontcg.io/sve/5_hires.png'} },
  { id:'sve-006-cos', number:'SVE 006', sortNum:1026, name:'Basic Fighting Energy (Cosmos Holo)', rarity:'Promo', types:['Fighting'], isPromo:true, images:{small:'https://images.pokemontcg.io/sve/6.png',large:'https://images.pokemontcg.io/sve/6_hires.png'} },
  { id:'sve-007-cos', number:'SVE 007', sortNum:1027, name:'Basic Darkness Energy (Cosmos Holo)', rarity:'Promo', types:['Darkness'], isPromo:true, images:{small:'https://images.pokemontcg.io/sve/7.png',large:'https://images.pokemontcg.io/sve/7_hires.png'} },
  { id:'sve-008-cos', number:'SVE 008', sortNum:1028, name:'Basic Metal Energy (Cosmos Holo)', rarity:'Promo', types:['Metal'], isPromo:true, images:{small:'https://images.pokemontcg.io/sve/8.png',large:'https://images.pokemontcg.io/sve/8_hires.png'} }
];

const grid=document.getElementById('grid'), q=document.getElementById('q'), typeSel=document.getElementById('typeSel'),
rarSel=document.getElementById('rarSel'), ownedSel=document.getElementById('ownedSel'), sortSel=document.getElementById('sortSel'),
statusEl=document.getElementById('status'), ownCount=document.getElementById('ownCount'), totCount=document.getElementById('totCount'),
pct=document.getElementById('pct'), bar=document.getElementById('bar'), ownedValue=document.getElementById('ownedValue'),
wishValue=document.getElementById('wishValue'), priceSourceSel=document.getElementById('priceSource'), investInfo=document.getElementById('investInfo');

const viewer=document.getElementById('viewer'), big=document.getElementById('big'), vName=document.getElementById('vName'),
vNum=document.getElementById('vNum'), vRarity=document.getElementById('vRarity'), vTypes=document.getElementById('vTypes'),
vVariants=document.getElementById('vVariants'), vPaid=document.getElementById('vPaid'), vCmLink=document.getElementById('vCmLink');

document.getElementById('closeBtn').onclick=()=>viewer.close();
document.getElementById('prevBtn').onclick=()=>openViewer(IDX-1);
document.getElementById('nextBtn').onclick=()=>openViewer(IDX+1);
document.getElementById('tab-all').onclick=()=>{ACTIVE_TAB='all';BINDER_PAGE=0;setTabs();applyFilters();};
document.getElementById('tab-wish').onclick=()=>{ACTIVE_TAB='wish';BINDER_PAGE=0;setTabs();applyFilters();};

function setTabs(){
  document.getElementById('tab-all').classList.toggle('active',ACTIVE_TAB==='all');
  document.getElementById('tab-wish').classList.toggle('active',ACTIVE_TAB==='wish');
}

function hasReverseHolo(c){
  if(c.isPromo) return false;
  const n = parseInt(c.number,10);
  return n >= 1 && n <= 165 && !NO_RH_NUMBERS.has(n);
}

function getCardState(id){
  if(!MASTER[id]){
    MASTER[id] = { n: !!LEGACY_OWNED[id], rh: false };
  }
  return MASTER[id];
}

function isCardComplete(c){
  const st = getCardState(c.id);
  return hasReverseHolo(c) ? (st.n && st.rh) : st.n;
}

function isCardAnyOwned(c){
  const st = getCardState(c.id);
  return st.n || st.rh;
}

const USD_TO_EUR=0.92, toEUR=x=>x.toLocaleString('nl-BE',{style:'currency',currency:'EUR'});
function rarityColor(r){
  if(!r) return 'var(--soft)';
  r=r.toLowerCase();
  if(r.includes('illustration'))return'var(--r-illustration)';
  if(r.includes('double'))return'var(--r-double)';
  if(r.includes('ultra')||r.includes('ex')||r.includes('hyper'))return'var(--r-ultra)';
  if(r.includes('rare'))return'var(--r-rare)';
  if(r.includes('uncommon'))return'var(--r-uncommon)';
  return'var(--r-common)';
}

function pickPrice(c,src,variant='normal'){
  if(src==='tcgplayer'){
    const tp=c.tcgplayer?.prices;
    if(tp){
      const usd = variant==='rh'
        ? [tp.reverseHolofoil?.market].filter(v=>typeof v==='number'&&v>0)
        : [tp.holofoil?.market,tp.normal?.market,tp.ultraRare?.market,tp.rainbowRare?.market,tp.gold?.market].filter(v=>typeof v==='number'&&v>0);
      if(usd.length) return +(Math.max(...usd)*USD_TO_EUR).toFixed(2);
    }
  } else {
    const cm=c.cardmarket?.prices;
    if(cm){
      const arr = variant==='rh'
        ? [cm.reverseHoloTrend,cm.reverseHoloSell].filter(v=>typeof v==='number'&&v>0)
        : [cm.trendPrice,cm.avg7,cm.avg30,cm.averageSellPrice,cm.lowPrice,cm.suggestedPrice].filter(v=>typeof v==='number'&&v>0);
      if(arr.length) return +Math.max(...arr).toFixed(2);
    }
  }
  return null;
}

function getDisplayPrice(c){
  const pN = pickPrice(c, PRICE_SOURCE, 'normal');
  const pRH = hasReverseHolo(c) ? pickPrice(c, PRICE_SOURCE, 'rh') : null;
  if(pN && pRH) return Math.max(pN, pRH);
  return pN || pRH || null;
}

async function fetchAll(){
  try{
    statusEl.textContent='Kaarten & prijzen laden…';
    const mirrorRes = await fetch('https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/sv3pt5.json');
    if (!mirrorRes.ok) throw new Error('Kan kaartdata niet ophalen');
    const list = await mirrorRes.json();

    try {
      const priceRes = await fetch('https://api.tcgdex.net/v2/en/sets/sv03.5');
      if (priceRes.ok) {
        const setData = await priceRes.json();
        const priceMap = {};
        if (Array.isArray(setData.cards)) {
          await Promise.all(setData.cards.map(async (item) => {
            try {
              const r = await fetch(`https://api.tcgdex.net/v2/en/cards/${item.id}`);
              if (r.ok) {
                const detail = await r.json();
                const num = String(parseInt(detail.localId, 10));
                priceMap[num] = detail.pricing || null;
              }
            } catch (_) {}
          }));
        }
        for (const c of list) {
          c.sortNum = parseInt(c.number, 10);
          const num = String(c.sortNum);
          const p = priceMap[num];
          if (p?.cardmarket) {
            c.cardmarket = {
              prices: {
                trendPrice: p.cardmarket.trend,
                avg7: p.cardmarket.avg7,
                avg30: p.cardmarket.avg30,
                averageSellPrice: p.cardmarket.avg,
                lowPrice: p.cardmarket.low,
                reverseHoloTrend: p.cardmarket['trend-holo']
              }
            };
          }
          if (p?.tcgplayer) {
            c.tcgplayer = {
              prices: {
                normal: { market: p.tcgplayer.normal?.marketPrice },
                holofoil: { market: p.tcgplayer.holofoil?.marketPrice },
                reverseHolofoil: { market: p.tcgplayer['reverse-holofoil']?.marketPrice }
              }
            };
          }
        }
      }
    } catch (_) {}

    CARDS = list;
    CARDS.sort((a,b)=>(a.sortNum||parseInt(a.number,10))-(b.sortNum||parseInt(b.number,10)));
    localStorage.setItem('sv151-cards-cache',JSON.stringify(CARDS));
    const hasPrices = CARDS.some(c => c.cardmarket?.prices);
    statusEl.textContent = hasPrices ? `Geladen: ${CARDS.length} basis- en secret rares (incl. Cardmarket prijzen)` : `Geladen: ${CARDS.length} kaarten`;
    populateFilters();
    applyFilters();
    logHistorySample();
  }catch(e){
    statusEl.textContent='Fout bij laden (offline cache actief)';
    console.error(e);
    if(!CARDS.length) alert('Kon kaarten niet laden.');
  }
}

function getAllActiveCards(){
  return SHOW_PROMOS ? [...CARDS, ...EXTRA_151_PROMOS] : [...CARDS];
}

function populateFilters(){
  const all = getAllActiveCards();
  const types=[...new Set(all.flatMap(c=>c.types||[]))].sort();
  typeSel.innerHTML='<option value="">Alle types</option>'+types.map(t=>`<option value="${t}">${t}</option>`).join('');
  const rars=[...new Set(all.map(c=>c.rarity).filter(Boolean))].sort();
  rarSel.innerHTML='<option value="">Alle rarities</option>'+rars.map(r=>`<option value="${r}">${r}</option>`).join('');
}

function applyFilters(){
  const term=q.value.trim().toLowerCase();
  const all = getAllActiveCards();
  FILTERED=all.filter(c=>{
    if(!SHOW_PROMOS && c.isPromo) return false;
    if(ACTIVE_TAB==='wish'&&!WISH[c.id]) return false;
    if(term){
      const txt=(c.name+' '+c.number).toLowerCase();
      if(!txt.includes(term)) return false;
    }
    if(typeSel.value&&!(c.types||[]).includes(typeSel.value)) return false;
    if(rarSel.value&&(c.rarity||'')!==rarSel.value) return false;

    const st = getCardState(c.id);
    const hasRH = hasReverseHolo(c);
    const comp = isCardComplete(c);
    const any = isCardAnyOwned(c);

    if(ownedSel.value==='owned' && !comp) return false;
    if(ownedSel.value==='partial' && (!any || comp)) return false;
    if(ownedSel.value==='missing' && any) return false;
    if(ownedSel.value==='missing-rh' && (!hasRH || st.rh)) return false;
    if(ownedSel.value==='dupes' && !(QTY[c.id] && QTY[c.id]>1)) return false;
    return true;
  });

  const key=sortSel.value;
  if(key==='price'){
    FILTERED.sort((a,b)=>(getDisplayPrice(b)||0)-(getDisplayPrice(a)||0));
  } else if(key==='name'){
    FILTERED.sort((a,b)=>a.name.localeCompare(b.name));
  } else {
    FILTERED.sort((a,b)=>(a.sortNum||parseInt(a.number,10))-(b.sortNum||parseInt(b.number,10)));
  }

  renderGrid();
  updateStats();
}

function renderGrid(){
  grid.innerHTML='';
  grid.classList.toggle('binder-mode', BINDER_MODE);
  const binderBar = document.getElementById('binderBar');

  let listToRender = FILTERED;
  if(BINDER_MODE){
    binderBar.style.display = 'flex';
    const perPage = 9;
    const maxPages = Math.max(1, Math.ceil(FILTERED.length / perPage));
    if(BINDER_PAGE >= maxPages) BINDER_PAGE = maxPages - 1;
    if(BINDER_PAGE < 0) BINDER_PAGE = 0;
    const start = BINDER_PAGE * perPage;
    listToRender = FILTERED.slice(start, start + perPage);
    const firstNum = listToRender[0]?.number || '—';
    const lastNum = listToRender[listToRender.length-1]?.number || '—';
    document.getElementById('binderTitle').textContent = `Pagina ${BINDER_PAGE+1} / ${maxPages} (#${firstNum} – #${lastNum})`;
  } else {
    binderBar.style.display = 'none';
  }

  listToRender.forEach((c)=>{
    const globalIdx = FILTERED.indexOf(c);
    const st = getCardState(c.id);
    const hasRH = hasReverseHolo(c);
    const comp = isCardComplete(c);
    const any = isCardAnyOwned(c);

    const card=document.createElement('div');
    card.className='card ' + (comp ? 'is-complete' : (!any ? 'is-missing' : ''));
    card.dataset.cardId=c.id;
    card.style.borderColor=rarityColor(c.rarity);

    const small=c.images?.small||'';
    const p=getDisplayPrice(c);

    card.innerHTML=`
      <div class="img-wrap">
        <img loading="lazy" src="${small}" alt="${c.name}">
        ${comp ? '<div class="own">✓</div>' : ''}
        ${(QTY[c.id]&&QTY[c.id]>1) ? `<div class="qty">x${QTY[c.id]}</div>` : ''}
        ${p ? `<div class="price">€ ${p.toFixed(2)}</div>` : ''}
        ${!comp ? `<div class="wish-dot ${WISH[c.id]?'active':''}">${WISH[c.id]?'★':'☆'}</div>` : ''}
      </div>
      <div class="meta">
        <span class="chip">#${c.number}</span>
        <span class="chip">${c.rarity||''}</span>
      </div>
      <div class="var-row">
        <div class="v-btn ${st.n?'on':''}" data-v="n">${st.n?'✓ ':''}Normal</div>
        ${hasRH ? `<div class="v-btn rh ${st.rh?'on':''}" data-v="rh">${st.rh?'✓ ':''}Reverse</div>` : ''}
      </div>
    `;

    // Variant knoppen
    card.querySelectorAll('.v-btn').forEach(btn=>{
      btn.onclick=(e)=>{
        e.stopPropagation();
        const v = btn.dataset.v;
        st[v] = !st[v];
        if(isCardAnyOwned(c) && !QTY[c.id]) QTY[c.id]=1;
        if(!isCardAnyOwned(c)) delete QTY[c.id];
        if(isCardComplete(c)) delete WISH[c.id];
        saveAll();
        applyFilters();
      };
    });

    // Wishlist sterretje
    const wBtn = card.querySelector('.wish-dot');
    if(wBtn){
      wBtn.onclick=(e)=>{
        e.stopPropagation();
        if(WISH[c.id]) delete WISH[c.id]; else WISH[c.id]=true;
        saveAll();
        applyFilters();
      };
    }

    // Lang tikken = dubbele verhogen
    let pressTimer=null;
    const imgWrap = card.querySelector('.img-wrap');
    imgWrap.addEventListener('touchstart',()=>{
      pressTimer=setTimeout(()=>{
        QTY[c.id]=(QTY[c.id]||(any?1:0))+1;
        if(!any) st.n = true;
        saveAll();
        applyFilters();
      },500);
    },{passive:true});
    imgWrap.addEventListener('touchend',()=>clearTimeout(pressTimer));
    imgWrap.addEventListener('dblclick',(ev)=>{ev.stopPropagation(); openViewer(globalIdx);});

    grid.appendChild(card);
  });
}

function updateStats(){
  const all = getAllActiveCards();
  let totalSlots = 0, ownedSlots = 0, ownVal = 0, wishVal = 0, totalPaid = 0;
  const rarMap = {};

  for(const c of all){
    const st = getCardState(c.id);
    const hasRH = hasReverseHolo(c);
    const slots = hasRH ? 2 : 1;
    const got = (st.n ? 1 : 0) + (hasRH && st.rh ? 1 : 0);

    totalSlots += slots;
    ownedSlots += got;

    const rName = c.rarity || 'Overig';
    if(!rarMap[rName]) rarMap[rName] = { total:0, got:0 };
    rarMap[rName].total += slots;
    rarMap[rName].got += got;

    const pN = pickPrice(c, PRICE_SOURCE, 'normal') || 0;
    const pRH = hasRH ? (pickPrice(c, PRICE_SOURCE, 'rh') || pN) : 0;

    if(st.n) ownVal += pN;
    if(hasRH && st.rh) ownVal += pRH;
    if(WISH[c.id] && !isCardComplete(c)){
      wishVal += (!st.n ? pN : 0) + (hasRH && !st.rh ? pRH : 0);
    }
    if(typeof PAID[c.id] === 'number' && PAID[c.id] > 0){
      totalPaid += PAID[c.id];
    }
  }

  ownCount.textContent = ownedSlots;
  totCount.textContent = totalSlots;
  const perc = totalSlots ? Math.round(ownedSlots/totalSlots*1000)/10 : 0;
  pct.textContent = perc;
  bar.style.width = Math.min(100, Math.round(perc)) + '%';

  ownedValue.textContent = toEUR(+ownVal.toFixed(2));
  wishValue.textContent = toEUR(+wishVal.toFixed(2));

  const diff = ownVal - totalPaid;
  const diffStr = totalPaid > 0 ? ` (${diff>=0?'+':''}${toEUR(+diff.toFixed(2))})` : '';
  investInfo.textContent = `Betaald: ${toEUR(+totalPaid.toFixed(2))}${diffStr}`;

  // Zeldzaamheid overzicht
  const rContainer = document.getElementById('rarityStats');
  rContainer.innerHTML = Object.entries(rarMap).map(([name, obj])=>{
    const p = Math.round((obj.got/obj.total)*100);
    return `<div class="r-stat"><div class="r-top"><span>${name}</span><b>${obj.got}/${obj.total} (${p}%)</b></div><div class="r-bar"><i style="width:${p}%"></i></div></div>`;
  }).join('');
}

function saveAll(){
  const legacySync = {};
  for(const [k,v] of Object.entries(MASTER)){
    if(v.n || v.rh) legacySync[k] = true;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({owned:legacySync}));
  localStorage.setItem(MASTER_KEY, 
