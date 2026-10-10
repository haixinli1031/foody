// Foody Label Check: static PWA. No build step.
// Design rules (see docs/design/household-scanner-design.md):
//  - report facts with attribution, never characterise a product
//  - the only verdict is the user's own preference match
//  - controlled vocabulary: no "toxic", "safe", "harmful", "clean"

const REPO_ISSUES = 'https://github.com/haixinli1031/foody/issues/new';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

const state = {
  data: null,
  allergens: null,
  nameIndex: new Map(),      // normalised name -> substance id
  patterns: [],              // {re, id}
  allergenIndex: new Map(),  // normalised name -> {inci, set}
  profile: loadProfile(),
  history: loadJSON('lc_history', []),
  scanner: null,
  current: null,
};

const PRODUCT_TYPES = {
  unknown: { label: 'Not set', route: 'Choose the product type to see exposure notes.' },
  leave_on: { label: 'Leave-on skin product (lotion, deodorant, sunscreen, makeup)', route: 'Stays on skin; daily, direct skin contact.' },
  rinse_off: { label: 'Rinse-off (shampoo, body wash, hand soap, dish soap)', route: 'Short skin contact, then rinsed away.' },
  oral: { label: 'Oral care (toothpaste, mouthwash)', route: 'Mouth contact; small amounts may be swallowed.' },
  fabric: { label: 'Laundry detergent, softener, dryer sheets', route: 'Indirect skin contact through residue on clothing and bedding.' },
  surface: { label: 'Surface cleaner, wipes, dish detergent', route: 'Hand contact during use; residue on surfaces; inhalation of spray mist.' },
  aerosol: { label: 'Spray or aerosol (air freshener, dry shampoo)', route: 'Inhalation of fine droplets; skin contact.' },
  combustion: { label: 'Candle or incense', route: 'Inhalation of combustion products and evaporated fragrance.' },
  baby: { label: 'Baby or child product', route: 'Thinner skin and higher surface-to-weight ratio than adults.' },
};

// ---------- utils ----------
function loadJSON(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
function loadProfile() {
  return Object.assign({
    life: 'none',
    prefs: { regulatory: true, carcinogen: true, endocrine: true, undisclosed: true, formaldehyde: false, pfas: false, microplastic: false, allergens_all: false, advocacy: false },
    allergens: [],
    strict: 'balanced',
  }, loadJSON('lc_profile', {}));
}
function norm(s) {
  return (s || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[*†‡•·]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–:;,.]+|[\s\-–:;,.]+$/g, '')
    .trim();
}
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

// ---------- data ----------
async function loadData() {
  const [subs, allg] = await Promise.all([
    fetch('./data/substances.json').then(r => r.json()),
    fetch('./data/allergens.json').then(r => r.json()),
  ]);
  state.data = subs; state.allergens = allg;
  for (const s of subs.substances) {
    for (const n of s.names || []) state.nameIndex.set(norm(n), s.id);
    for (const p of s.patterns || []) state.patterns.push({ re: new RegExp(p, 'i'), id: s.id });
  }
  state.patterns.push({ re: /^(parfum|fragrance|perfume|aroma)\b/i, id: 'fragrance' });
  state.patterns.push({ re: /paraben$/i, id: '__paraben_generic' });
  for (const set of ['current', 'from_2026']) {
    for (const a of allg[set]) for (const n of a.names) state.allergenIndex.set(norm(n), { inci: a.inci, set, status: a.status });
  }
  $('#data-version').textContent = `Reference data version ${subs.version}, updated ${subs.updated}. ${subs.review_status}`;
  const ul = $('#sources-list');
  for (const [k, v] of Object.entries(subs.sources)) ul.appendChild(el(`<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.name)}</a></li>`));
  $('#claim-link').href = `${REPO_ISSUES}?title=${encodeURIComponent('Listing correction request')}&body=${encodeURIComponent('Product and barcode:\n\nWhat is wrong:\n\nEvidence (current label, INCI list, certificate):\n')}`;
}
function substance(id) { return state.data.substances.find(s => s.id === id); }
function sourceName(id) { return state.data.sources[id]?.name || id; }
function sourceUrl(id) { return state.data.sources[id]?.url || '#'; }

// ---------- ingredient parsing ----------
function parseIngredients(text) {
  if (!text) return [];
  let t = text.replace(/\r/g, '\n');
  t = t.replace(/^\s*(ingredients?|inci|composition|contains|ingrédients|zutaten|成分|配料)\s*[:：]\s*/im, '');
  // detergent style "5-15%: ..." or "<5% ..." prefixes
  t = t.replace(/(<|>|≤|≥)?\s*\d+(\.\d+)?\s*(-|–|to)?\s*(\d+(\.\d+)?)?\s*%\s*[:：]?/g, ' ');
  // protect commas inside chemical numbering e.g. 1,2-benzisothiazolin-3-one
  t = t.replace(/(\d),(\d)/g, '$1§$2');
  // "may contain" marker becomes a separator
  t = t.replace(/\(?\+\/-\)?|may contain[:：]?|peut contenir[:：]?/gi, ',');
  const raw = t.split(/[,;\n]|\s•\s|\s\|\s/).map(x => x.replace(/§/g, ',').trim()).filter(Boolean);
  const out = [];
  for (const r of raw) {
    if (/^\s*(and|et|und)\s*$/i.test(r)) continue;
    const m = r.match(/^(.*?)\s*[\(\[]([^\)\]]+)[\)\]]\s*(.*)$/);
    const cands = [];
    if (m) {
      const outer = norm(m[1] + (m[3] ? ' ' + m[3] : ''));
      const inner = norm(m[2]);
      if (outer) cands.push(outer);
      for (const part of inner.split(/\s*\/\s*|\s+and\s+/)) if (part) cands.push(norm(part));
    }
    const whole = norm(r.replace(/[\(\[].*?[\)\]]/g, ' '));
    if (whole && !cands.includes(whole)) cands.unshift(whole);
    for (const slashPart of whole.split(/\s*\/\s*/)) if (slashPart && !cands.includes(slashPart)) cands.push(slashPart);
    if (!cands.length) continue;
    out.push({ raw: r.trim(), cands });
  }
  return out;
}

function matchToken(tok) {
  const hits = [];
  for (const c of tok.cands) {
    const id = state.nameIndex.get(c);
    if (id) hits.push({ id, via: c });
  }
  if (!hits.length) {
    for (const c of tok.cands) for (const p of state.patterns) if (p.re.test(c)) { hits.push({ id: p.id, via: c }); break; }
  }
  // allergens
  let allergen = null;
  for (const c of tok.cands) { const a = state.allergenIndex.get(c); if (a) { allergen = a; break; } }
  // personal allergens
  const personal = [];
  for (const a of state.profile.allergens) {
    const an = norm(a); if (!an) continue;
    if (tok.cands.some(c => c === an || c.includes(an))) personal.push(a);
  }
  // dedupe hits by id
  const seen = new Set(); const uniq = [];
  for (const h of hits) if (!seen.has(h.id)) { seen.add(h.id); uniq.push(h); }
  return { ...tok, hits: uniq, allergen, personal };
}

// ---------- analysis ----------
function analyse(tokens, productType) {
  const p = state.profile;
  const showC = p.prefs.advocacy || p.strict === 'precautionary';
  const flagged = [];        // {token, substance, flags[], allergen, personal}
  let undisclosed = 0;

  for (const t of tokens) {
    const entries = [];
    for (const h of t.hits) {
      if (h.id === '__paraben_generic') {
        entries.push({ sid: null, display: t.raw, flags: [{ tier: 'D', category: 'info', source: 'eu_cpr_annex5', quote: 'A paraben not in our reference list. Methyl- and ethylparaben are permitted up to 0.4%; propyl- and butylparaben up to 0.14% combined; five others are prohibited in the EU.', endpoints: [] }] });
        continue;
      }
      const s = substance(h.id); if (!s) continue;
      const flags = s.flags.filter(f => f.tier !== 'C' || showC);
      entries.push({ sid: s.id, display: s.display, s, flags });
      if (s.flags.some(f => f.category === 'undisclosed')) undisclosed++;
    }
    // skip the allergen card when the substance list already covers this ingredient (e.g. Lilial, HICC)
    const coveredBySubstance = t.allergen && t.hits.some(h => { const s = substance(h.id); return s && s.names.some(n => norm(n) === norm(t.allergen.inci)); });
    if (t.allergen && !coveredBySubstance) {
      const isNew = t.allergen.set === 'from_2026';
      entries.push({ sid: null, display: t.allergen.inci, flags: [{
        tier: 'D', category: 'allergen', source: isNew ? 'eu_2023_1545' : 'eu_cpr_annex3',
        quote: isNew
          ? 'Added to the EU list of fragrance allergens by Regulation (EU) 2023/1545. Must be named on the label of new products from 31 July 2026 when above 0.001% (leave-on) or 0.01% (rinse-off).'
          : 'One of the 26 fragrance allergens that EU law requires to be named on the label when above 0.001% (leave-on) or 0.01% (rinse-off), so that people with a known allergy can avoid it.',
        endpoints: ['sensitisation'] }], allergenSet: t.allergen.set });
    }
    if (entries.length || t.personal.length) flagged.push({ token: t, entries, personal: t.personal });
  }

  // mismatches
  const mism = [];
  const add = (txt) => { if (!mism.includes(txt)) mism.push(txt); };
  for (const f of flagged) {
    for (const pr of f.personal) add(`Contains ${f.token.raw} (on your allergy list)`);
    for (const e of f.entries) {
      for (const fl of e.flags) {
        const c = fl.category;
        if (p.prefs.regulatory && (c === 'prohibited' || c === 'not_permitted_cosmetics')) add(`${e.display}: ${c === 'prohibited' ? 'prohibited in cosmetic products' : 'not a permitted cosmetic preservative in the EU'}`);
        if (c === 'restricted' && fl.restriction?.product_types && productType !== 'unknown') {
          const allowed = fl.restriction.product_types;
          const typeIsRinse = ['rinse_off', 'fabric', 'surface', 'oral'].includes(productType);
          if (allowed.includes('rinse_off') && !typeIsRinse && p.prefs.regulatory) add(`${e.display}: permitted only in rinse-off products, and this product type is not rinse-off`);
        }
        if (c === 'restricted' && p.strict === 'precautionary') add(`${e.display}: restricted substance (precautionary setting)`);
        const routeApplies = !fl.routes || productType === 'unknown' || (fl.routes.includes('inhalation') && ['aerosol', 'combustion'].includes(productType));
        if (p.prefs.carcinogen && routeApplies && (c === 'carcinogen' || c === 'reprotox')) add(`${e.display}: listed for ${c === 'carcinogen' ? 'cancer' : 'reproductive toxicity'} by ${sourceShort(fl.source)}`);
        if (p.prefs.endocrine && c === 'endocrine' && fl.tier !== 'C') add(`${e.display}: on an endocrine-disruptor list (${sourceShort(fl.source)})`);
        if (c === 'advocacy' && (p.prefs.advocacy || p.strict === 'precautionary')) add(`${e.display}: appears on an advocacy list (${sourceShort(fl.source)})`);
        if (p.prefs.undisclosed && c === 'undisclosed') add(`${e.display}: components not disclosed on the label`);
        if (p.prefs.formaldehyde && c === 'formaldehyde_releaser') add(`${e.display}: formaldehyde-releasing preservative`);
        if (p.prefs.pfas && c === 'pfas') add(`${e.display}: PFAS`);
        if (p.prefs.microplastic && c === 'microplastic') add(`${e.display}: polymer covered by the EU microplastics restriction`);
        if (p.prefs.allergens_all && c === 'allergen') add(`${e.display}: declared EU fragrance allergen`);
        if ((p.life === 'pregnant' || p.life === 'infant') && (fl.endpoints || []).includes('reproductive')) add(`${e.display}: listed for reproductive or developmental effects (your life-stage setting)`);
        if ((p.life === 'infant' || p.life === 'child') && c === 'restricted' && /under three|children under 3|nappy/i.test(fl.quote)) add(`${e.display}: restriction mentions young children`);
      }
    }
  }
  return { flagged, mism, undisclosed, total: tokens.length };
}
function sourceShort(id) {
  return ({ prop65: 'California Prop 65', iarc: 'IARC', echa_clp: 'ECHA classification', echa_ed: 'ECHA ED list', echa_svhc: 'ECHA Candidate List', eu_cpr_annex2: 'EU Annex II', eu_cpr_annex3: 'EU Annex III', eu_cpr_annex5: 'EU Annex V', eu_cpr_annex6: 'EU Annex VI', reach_xvii: 'REACH', sccs: 'SCCS', tedx: 'TEDX', sin: 'SIN List', ca_ab2771: 'California AB 2771', ny_dioxane: 'New York law', hawaii_sb2571: 'Hawaii law', fda_antiseptic_2016: 'US FDA', fda_hydroquinone: 'US FDA', fda_lead_acetate: 'US FDA' })[id] || sourceName(id);
}

// ---------- product lookup ----------
const FIELDS = 'code,product_name,product_name_en,brands,quantity,ingredients_text,ingredients_text_en,ingredients,categories_tags,image_front_small_url,image_ingredients_url,last_modified_t';
async function lookup(code) {
  const hosts = ['world.openbeautyfacts.org', 'world.openproductsfacts.org', 'world.openfoodfacts.org'];
  for (const h of hosts) {
    try {
      const r = await fetch(`https://${h}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`);
      if (!r.ok) continue;
      const j = await r.json();
      if (j.status === 1 && j.product) return { ...j.product, _source: h };
    } catch { /* try next */ }
  }
  return null;
}
function guessType(prod) {
  const cats = (prod.categories_tags || []).join(' ') + ' ' + (prod.product_name || '');
  const c = cats.toLowerCase();
  if (/laundry|detergent|softener|fabric|lessive|dryer/.test(c)) return 'fabric';
  if (/candle|bougie|incense/.test(c)) return 'combustion';
  if (/air-freshener|air freshener|room spray|dry-shampoo|dry shampoo|aerosol|spray/.test(c)) return 'aerosol';
  if (/cleaner|cleaning|dish|nettoyant|wipes|disinfect/.test(c)) return 'surface';
  if (/toothpaste|dentifrice|mouthwash|oral/.test(c)) return 'oral';
  if (/baby|bebe|bébé|infant|nappy|diaper/.test(c)) return 'baby';
  if (/shampoo|shower|body-wash|soap|savon|gel-douche|cleanser|hand-wash|conditioner/.test(c)) return 'rinse_off';
  if (/cream|lotion|deodorant|sunscreen|sun|makeup|lipstick|foundation|serum|moistur|perfume|parfum|eau-de/.test(c)) return 'leave_on';
  return 'unknown';
}

// ---------- rendering ----------
function tierBadge(t) { return `<span class="tier tier-${t}" title="${esc(state.data.tiers[t])}">${t}</span>`; }

function exposureLine(fl, type) {
  if (fl.routes?.includes('inhalation')) {
    if (type === 'unknown') return 'This classification concerns inhalation. Set the product type to check whether it applies.';
    return ['aerosol', 'combustion'].includes(type) ? 'This classification concerns inhalation, which is relevant to this product type.' : 'This classification concerns inhalation of fine particles; it is not about skin contact with this product type.';
  }
  const r = fl.restriction;
  if (!r) return '';
  if (r.product_types?.includes('rinse_off')) {
    if (['rinse_off', 'fabric', 'surface', 'oral'].includes(type)) return `Permitted in this product type (rinse-off) up to ${r.limit}.`;
    if (type === 'unknown') return `Permitted only in rinse-off products (max ${r.limit}). Set the product type to check.`;
    return `Not permitted in leave-on products; this product type is not rinse-off.`;
  }
  return r.limit ? `Legal maximum ${r.limit}. Concentration is not shown on the label.` : '';
}

function renderResult(cur) {
  state.current = cur;
  const { name, brand, image, code, src, tokens, type, ingredientsDate, confidence } = cur;
  const a = analyse(tokens, type);
  cur.analysis = a;
  const root = $('#result'); root.innerHTML = '';
  const named = a.total - a.undisclosed;

  const card = el(`<div class="card"></div>`);
  card.appendChild(el(`
    <div class="result-head">
      ${image ? `<img src="${esc(image)}" alt="" />` : ''}
      <div>
        <h2>${esc(name || 'Unnamed product')}</h2>
        <div class="meta">${esc(brand || '')}${code ? ` · ${esc(code)}` : ''}</div>
        <div class="meta">${esc(confidence)}${src ? ` · data: ${esc(src)}` : ''}${ingredientsDate ? ` · ingredients updated ${esc(ingredientsDate)}` : ''}</div>
        <div class="meta"><a href="${REPO_ISSUES}?title=${encodeURIComponent('Listing problem: ' + (name || code || ''))}&body=${encodeURIComponent('Barcode: ' + (code || 'n/a') + '\nWhat is wrong:\n')}" target="_blank" rel="noopener">Report a problem with this listing</a></div>
      </div>
    </div>`));

  if (!tokens.length) {
    card.appendChild(el(`<div class="block"><h3>Not enough information</h3><p>No ingredient list is available for this product in the open databases. Photograph the ingredient panel to continue.</p><label class="btn" for="photo-input">Photograph ingredients</label></div>`));
    root.appendChild(card); return;
  }

  // Disclosure
  card.appendChild(el(`<div class="block"><h3>Disclosure</h3>
    <p>${named} of ${a.total} ingredient entries are named individually.${a.undisclosed ? ` ${a.undisclosed} ${a.undisclosed === 1 ? 'entry is' : 'entries are'} a mixture or class name whose components are not shown on the label.` : ''}</p>
    <details><summary class="small muted">Show ingredient list as read</summary><p class="ingr-list">${tokens.map(t => (t.hits.length || t.allergen || t.personal.length) ? `<mark>${esc(t.raw)}</mark>` : esc(t.raw)).join(', ')}</p></details>
  </div>`));

  // Exposure / product type
  const typeBlock = el(`<div class="block"><h3>Exposure context</h3>
    <label class="field">Product type <select id="type-select">${Object.entries(PRODUCT_TYPES).map(([k, v]) => `<option value="${k}" ${k === type ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>
    <p class="small muted">${esc(PRODUCT_TYPES[type].route)}</p>
    <p class="small muted">Concentrations are not printed on labels, so we show legal limits and restrictions rather than a risk figure.</p>
  </div>`);
  card.appendChild(typeBlock);
  $('#type-select', typeBlock).addEventListener('change', e => { cur.type = e.target.value; renderResult(cur); });

  // Listed substances
  const n = a.flagged.length;
  const lb = el(`<div class="block"><h3>Listed substances (${n})</h3></div>`);
  if (!n) lb.appendChild(el(`<p class="ok-text">No ingredient on this label matched our reference list.</p><p class="small muted">Our list covers ${state.data.substances.length} substances and ${state.allergens.current.length + state.allergens.from_2026.length} fragrance allergens. It is a draft and not exhaustive.</p>`));
  for (const f of a.flagged) {
    for (const e of f.entries) {
      const top = e.flags[0];
      const lines = e.flags.slice(0, 2).map(fl => `<div class="line">${tierBadge(fl.tier)} ${esc(fl.quote)}</div>`).join('');
      const ex = exposureLine(top, type);
      const node = el(`<div class="flag" role="button" tabindex="0">
        <div class="name">${esc(e.display)} ${f.token.raw.toLowerCase() !== e.display.toLowerCase() ? `<span class="tag">on label: ${esc(f.token.raw)}</span>` : ''}${f.personal.length ? `<span class="tag">on your allergy list</span>` : ''}</div>
        ${lines}
        ${ex ? `<div class="line small muted">Exposure: ${esc(ex)}</div>` : ''}
        <div class="src">${e.flags.map(fl => esc(sourceShort(fl.source))).filter((v, i, arr) => arr.indexOf(v) === i).join(' · ')} · tap for sources</div>
      </div>`);
      node.addEventListener('click', () => openSheet(e, f, type));
      lb.appendChild(node);
    }
    if (!f.entries.length && f.personal.length) {
      lb.appendChild(el(`<div class="flag"><div class="name">${esc(f.token.raw)} <span class="tag">on your allergy list</span></div><div class="line small muted">Matched against the allergy list you entered. No reference-list entry.</div></div>`));
    }
  }
  card.appendChild(lb);

  // Your match
  const ok = a.mism.length === 0;
  card.appendChild(el(`<div class="block"><h3>Your match</h3>
    <div class="match ${ok ? 'ok' : 'no'}">
      <div class="headline">${ok ? 'Matches your preferences' : `Does not match ${a.mism.length} of your preferences`}</div>
      ${ok ? `<p class="small muted" style="margin:6px 0 0">Based on the preferences you set and the ${state.data.substances.length} substances in our draft reference list.</p>` : `<ul>${a.mism.map(m => `<li>${esc(m)}</li>`).join('')}</ul>`}
    </div>
    <p class="small muted" style="margin-top:8px">Change what counts in <a href="#" data-goto="profile">Preferences</a>.</p>
  </div>`));

  card.appendChild(el(`<div class="foot">
    <span>Reference data ${esc(state.data.version)} (draft, unreviewed)</span>
    <a href="#" data-goto="about">Methodology</a>
    <span>Not medical advice</span>
    <a href="${REPO_ISSUES}?title=${encodeURIComponent('Brand correction: ' + (name || code || ''))}" target="_blank" rel="noopener">Brand? Claim or correct this listing</a>
  </div>`));
  root.appendChild(card);
  $$('[data-goto]', root).forEach(x => x.addEventListener('click', ev => { ev.preventDefault(); showView(x.dataset.goto); }));
}

function openSheet(entry, f, type) {
  const body = $('#sheet-body'); body.innerHTML = '';
  const s = entry.s;
  body.appendChild(el(`<h2>${esc(entry.display)}</h2>`));
  if (s) body.appendChild(el(`<p class="small muted">${s.cas ? `CAS ${esc(s.cas)} · ` : ''}${esc(s.function || '')}${f.token.raw.toLowerCase() !== entry.display.toLowerCase() ? ` · on label as “${esc(f.token.raw)}”` : ''}</p>`));
  body.appendChild(el(`<h3>Who lists it, and what they say</h3>`));
  for (const fl of entry.flags) {
    body.appendChild(el(`<div class="src-item">
      <div class="who">${tierBadge(fl.tier)} ${esc(sourceName(fl.source))}${fl.tier === 'C' ? ' <span class="tag">advocacy list</span>' : ''}</div>
      <div>${esc(fl.quote)}</div>
      ${exposureLine(fl, type) ? `<div class="small muted">Exposure: ${esc(exposureLine(fl, type))}</div>` : ''}
      <a href="${esc(sourceUrl(fl.source))}" target="_blank" rel="noopener">Open source</a>
    </div>`));
  }
  if (s?.note) body.appendChild(el(`<h3>Note</h3><p class="small">${esc(s.note)}</p><p class="small muted">Draft note, not yet reviewed by a toxicologist.</p>`));
  body.appendChild(el(`<p class="small muted" style="margin-top:14px">Evidence tier ${esc(entry.flags[0].tier)}: ${esc(state.data.tiers[entry.flags[0].tier])}. Reference data ${esc(state.data.version)}.</p>`));
  $('#sheet').classList.remove('hidden');
}

// ---------- flows ----------
async function runLookup(code) {
  code = String(code).replace(/\D/g, '');
  if (!code) return;
  setTitle('Looking up…');
  showView('result');
  $('#result').innerHTML = `<div class="card"><p>Looking up ${esc(code)}…</p></div>`;
  const prod = await lookup(code);
  if (!prod) {
    $('#result').innerHTML = `<div class="card"><h2>Not found</h2><p>Barcode ${esc(code)} is not in Open Beauty Facts, Open Products Facts or Open Food Facts.</p><p>Photograph the ingredient panel instead, and we will analyse it from the label.</p><label class="btn primary" for="photo-input">Photograph ingredients</label><p class="small muted" style="margin-top:10px">You can also <a href="https://world.openbeautyfacts.org/cgi/product.pl?code=${esc(code)}" target="_blank" rel="noopener">add this product to Open Beauty Facts</a> so the next person finds it.</p></div>`;
    setTitle('Result'); return;
  }
  const text = prod.ingredients_text_en || prod.ingredients_text || (prod.ingredients || []).map(i => i.text).join(', ');
  const tokens = parseIngredients(text).map(matchToken);
  const cur = {
    name: prod.product_name_en || prod.product_name, brand: prod.brands, image: prod.image_front_small_url, code,
    src: prod._source.replace('world.', ''), tokens, type: guessType(prod),
    ingredientsDate: prod.last_modified_t ? new Date(prod.last_modified_t * 1000).toISOString().slice(0, 10) : '',
    confidence: 'Matched by barcode',
  };
  pushHistory({ code, name: cur.name, brand: cur.brand, ts: Date.now() });
  setTitle('Result');
  renderResult(cur);
}

function runText(text, name, confidence) {
  const tokens = parseIngredients(text).map(matchToken);
  const cur = { name: name || 'Ingredients you entered', brand: '', code: '', src: '', tokens, type: 'unknown', confidence };
  pushHistory({ text, name: cur.name, ts: Date.now() });
  setTitle('Result'); showView('result'); renderResult(cur);
}

function pushHistory(h) {
  state.history = [h, ...state.history.filter(x => (h.code && x.code !== h.code) || (!h.code && x.text !== h.text))].slice(0, 20);
  saveJSON('lc_history', state.history); renderHistory();
}
function renderHistory() {
  const ul = $('#history'); ul.innerHTML = '';
  $('#history-empty').classList.toggle('hidden', state.history.length > 0);
  for (const h of state.history) {
    const li = el(`<li><button>${esc(h.name || h.code)}<div class="sub">${esc(h.brand || '')}${h.code ? ` · ${esc(h.code)}` : ' · typed or photographed'} · ${new Date(h.ts).toLocaleDateString()}</div></button></li>`);
    li.querySelector('button').addEventListener('click', () => h.code ? runLookup(h.code) : runText(h.text, h.name, 'Ingredients from your earlier entry'));
    ul.appendChild(li);
  }
}

// scanner
async function startScanner() {
  if (!window.Html5Qrcode) { alert('Scanner library is still loading. Try again in a second.'); return; }
  $('#scanner-wrap').classList.remove('hidden');
  const F = Html5QrcodeSupportedFormats;
  state.scanner = new Html5Qrcode('reader', { formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128], experimentalFeatures: { useBarCodeDetectorIfSupported: true }, verbose: false });
  try {
    await state.scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: (w, h) => ({ width: Math.min(300, w * 0.85), height: Math.min(160, h * 0.4) }) },
      async (txt) => { await stopScanner(); runLookup(txt); },
      () => {});
  } catch (e) {
    $('#scanner-hint').textContent = 'Camera could not start. Allow camera access in your browser settings, or enter the barcode digits below.';
  }
}
async function stopScanner() {
  try { if (state.scanner) { await state.scanner.stop(); state.scanner.clear(); } } catch { /* ignore */ }
  state.scanner = null; $('#scanner-wrap').classList.add('hidden');
}

// OCR
async function runOCR(file) {
  $('#paste-wrap').classList.add('hidden'); $('#ocr-wrap').classList.remove('hidden');
  $('#ocr-text').value = ''; const bar = $('#ocr-progress div'); bar.style.width = '5%';
  showView('home');
  try {
    if (!window.Tesseract) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    const bmp = await downscale(file, 1600);
    const worker = await Tesseract.createWorker('eng', 1, { logger: m => { if (m.status === 'recognizing text') bar.style.width = `${Math.round(10 + m.progress * 90)}%`; } });
    const { data } = await worker.recognize(bmp);
    await worker.terminate();
    bar.style.width = '100%';
    $('#ocr-text').value = data.text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    $('#ocr-text').focus();
  } catch (e) {
    $('#ocr-text').value = ''; $('#ocr-text').placeholder = 'Text recognition failed. Type the ingredient list here instead.';
  }
}
function downscale(file, max) {
  return new Promise((res) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
      // simple contrast boost helps OCR on glossy labels
      const d = ctx.getImageData(0, 0, c.width, c.height); const px = d.data;
      for (let i = 0; i < px.length; i += 4) { const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; const v = Math.max(0, Math.min(255, (g - 128) * 1.3 + 128)); px[i] = px[i + 1] = px[i + 2] = v; }
      ctx.putImageData(d, 0, 0); URL.revokeObjectURL(url); res(c);
    };
    img.src = url;
  });
}

// profile UI
function renderProfile() {
  const p = state.profile;
  $$('input[name=life]').forEach(r => r.checked = r.value === p.life);
  $$('input[name=strict]').forEach(r => r.checked = r.value === p.strict);
  $$('[data-pref]').forEach(c => c.checked = !!p.prefs[c.dataset.pref]);
  const chips = $('#allergen-chips'); chips.innerHTML = '';
  p.allergens.forEach((a, i) => { const ch = el(`<span class="chip">${esc(a)} <button aria-label="Remove">&times;</button></span>`); ch.querySelector('button').addEventListener('click', () => { p.allergens.splice(i, 1); renderProfile(); }); chips.appendChild(ch); });
}
function saveProfile() {
  const p = state.profile;
  p.life = $('input[name=life]:checked')?.value || 'none';
  p.strict = $('input[name=strict]:checked')?.value || 'balanced';
  $$('[data-pref]').forEach(c => p.prefs[c.dataset.pref] = c.checked);
  saveJSON('lc_profile', p);
  $('#profile-saved').textContent = 'Saved on this device.';
  setTimeout(() => $('#profile-saved').textContent = '', 2000);
  if (state.current) renderResult(state.current);
}

// navigation
function showView(v) {
  $$('.view').forEach(x => x.classList.toggle('hidden', x.id !== `view-${v}`));
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.view === v || (v === 'result' && b.dataset.view === 'home')));
  $('#back-btn').classList.toggle('hidden', v !== 'result');
  if (v !== 'result') setTitle(v === 'profile' ? 'Preferences' : v === 'about' ? 'About' : 'Label Check');
  if (v !== 'home') stopScanner();
  window.scrollTo(0, 0);
}
function setTitle(t) { $('#title').textContent = t; }

// ---------- init ----------
async function init() {
  await loadData();
  renderProfile(); renderHistory();
  $$('.tabbar button').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  $('#back-btn').addEventListener('click', () => showView('home'));
  $('#scan-btn').addEventListener('click', () => { $('#paste-wrap').classList.add('hidden'); $('#ocr-wrap').classList.add('hidden'); startScanner(); });
  $('#scan-stop').addEventListener('click', stopScanner);
  $('#code-form').addEventListener('submit', e => { e.preventDefault(); const v = $('#code-input').value.trim(); if (v) { $('#code-input').value = ''; runLookup(v); } });
  $('#paste-btn').addEventListener('click', () => { stopScanner(); $('#ocr-wrap').classList.add('hidden'); $('#paste-wrap').classList.remove('hidden'); $('#paste-text').focus(); });
  $('#paste-analyze').addEventListener('click', () => { const t = $('#paste-text').value.trim(); if (t) runText(t, $('#paste-name').value.trim(), 'Ingredients typed by you'); });
  $('#photo-input').addEventListener('change', e => { const f = e.target.files?.[0]; if (f) { stopScanner(); runOCR(f); } e.target.value = ''; });
  $('#ocr-analyze').addEventListener('click', () => { const t = $('#ocr-text').value.trim(); if (t) { $('#ocr-wrap').classList.add('hidden'); runText(t, $('#ocr-name').value.trim(), 'Ingredients from your photo, confirmed by you'); } });
  $('#profile-save').addEventListener('click', saveProfile);
  $('#allergen-add').addEventListener('click', () => { const v = $('#allergen-input').value.trim(); if (v && !state.profile.allergens.includes(v)) { state.profile.allergens.push(v); $('#allergen-input').value = ''; renderProfile(); } });
  $('#allergen-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#allergen-add').click(); } });
  $('#sheet-close').addEventListener('click', () => $('#sheet').classList.add('hidden'));
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') $('#sheet').classList.add('hidden'); });
  const params = new URLSearchParams(location.search);
  if (params.get('code')) runLookup(params.get('code'));
}
init().catch(e => { document.body.insertAdjacentHTML('afterbegin', `<div class="card" style="margin:16px">Failed to load: ${esc(e.message)}</div>`); });
