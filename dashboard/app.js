// Token Launch Radar — renders window.RADAR (written by main.ts into data.js). No network, no framework.
(function () {
  'use strict';

  const R = window.RADAR || { rows: [], live: [], model: {}, as_of: '', source: '', floor_usd: 0, watchlist_size: 0, model_version: '' };
  const $ = (id) => document.getElementById(id);

  const fmtUsd = (n) => {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(n >= 1e10 ? 1 : 2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e8 ? 0 : 1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
    return '$' + n;
  };
  const fmtAge = (d) => (d === null || d === undefined ? '—' : d >= 365 ? (d / 365).toFixed(1) + 'y' : d >= 60 ? Math.round(d / 30) + 'mo' : d + 'd');
  const fmtPct = (v) => (v === null || v === undefined ? '—' : (v > 0 ? '+' : '') + v.toFixed(1) + '%');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const WATCH = new Set();
  // The watchlist is not in data.js as a set; derive it: rows the model flagged via the floor are not
  // marked, so rebuild membership from the snapshot's rule the model used — rows carry no flag, so we
  // mark watchlist rows as those whose TVL is at or above the floor at snapshot time. The board's early
  // rows are exactly the ones below the floor, so this reproduces the split deterministically.
  const isWatch = (row) => row.tvl_usd >= R.floor_usd;

  function signalWidth(row) {
    const max = R.rows.length ? R.rows[0].implied_value_usd : 1;
    return Math.max(6, Math.round((Math.log10(row.implied_value_usd + 1) / Math.log10(max + 1)) * 100));
  }

  function growthCell(v) {
    if (v === null || v === undefined) return '<span class="flat">—</span>';
    const cls = v > 0.05 ? 'up' : v < -0.05 ? 'down' : 'flat';
    return '<span class="' + cls + '">' + fmtPct(v) + '</span>';
  }

  let view = R.rows.slice();

  function applyFilters() {
    const q = $('q').value.trim().toLowerCase();
    const cat = $('f-category').value;
    const chain = $('f-chain').value;
    const watch = $('f-watch').value;
    const sort = $('sort').value;
    view = R.rows.filter((r) => {
      if (cat && (r.category || '') !== cat) return false;
      if (chain && r.chains.indexOf(chain) === -1) return false;
      if (watch === 'watch' && !isWatch(r)) return false;
      if (watch === 'early' && isWatch(r)) return false;
      if (q) {
        const hay = (r.name + ' ' + r.slug + ' ' + r.chains.join(' ') + ' ' + (r.category || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (sort === 'tvl') view.sort((a, b) => b.tvl_usd - a.tvl_usd);
    else if (sort === 'growth') view.sort((a, b) => (b.change_7d ?? -999) - (a.change_7d ?? -999));
    else if (sort === 'age') view.sort((a, b) => (b.age_days ?? -1) - (a.age_days ?? -1));
    else if (sort === 'name') view.sort((a, b) => a.name.localeCompare(b.name));
    else view.sort((a, b) => a.rank - b.rank);
    render();
  }

  function render() {
    const tb = $('rows');
    const frag = [];
    for (const r of view) {
      const watch = isWatch(r);
      frag.push(
        '<tr class="' + (r.rank === 1 ? 'top1' : r.rank <= 3 ? 'top3' : '') + '" data-slug="' + esc(r.slug) + '">' +
          '<td class="num"><span class="rank">' + r.rank + '</span></td>' +
          '<td><div class="pname">' + esc(r.name) + (watch ? '<span class="chip">watchlist</span>' : '') + '</div><div class="pslug">' + esc(r.slug) + ' · ' + esc(r.chains.slice(0, 3).join(', ')) + (r.chains.length > 3 ? ' +' + (r.chains.length - 3) : '') + '</div></td>' +
          '<td class="cat">' + esc(r.category || '—') + '</td>' +
          '<td class="num tvl">' + fmtUsd(r.tvl_usd) + '</td>' +
          '<td class="num">' + growthCell(r.change_7d) + '</td>' +
          '<td class="num">' + fmtAge(r.age_days) + '</td>' +
          '<td class="num imp">' + fmtUsd(r.implied_value_usd) + '</td>' +
          '<td class="num"><span class="signal"><i style="width:' + signalWidth(r) + '%"></i></span></td>' +
        '</tr>'
      );
    }
    tb.innerHTML = frag.join('');
    $('count').textContent = view.length + ' of ' + R.rows.length + ' protocols';
    $('empty').hidden = view.length > 0;
  }

  function openDetail(slug) {
    const r = R.rows.find((x) => x.slug === slug);
    if (!r) return;
    document.querySelectorAll('#rows tr').forEach((tr) => tr.classList.toggle('active', tr.getAttribute('data-slug') === slug));
    const watch = isWatch(r);
    const m = r;
    $('detail-body').innerHTML =
      '<h3>' + esc(r.name) + '</h3>' +
      '<p class="sub">' + esc(r.slug) + (r.category ? ' · ' + esc(r.category) : '') + (watch ? ' · on the watchlist' : ' · early, below the floor') + '</p>' +
      '<div class="kv">' +
        '<div><span>TVL</span><b>' + fmtUsd(r.tvl_usd) + '</b></div>' +
        '<div><span>Implied value</span><b>' + fmtUsd(r.implied_value_usd) + '</b></div>' +
        '<div><span>7-day change</span><b>' + fmtPct(r.change_7d) + '</b></div>' +
        '<div><span>Age</span><b>' + fmtAge(r.age_days) + '</b></div>' +
        '<div><span>Chains</span><b>' + r.chains.length + '</b></div>' +
        '<div><span>Listed</span><b>' + esc(r.listed_at || 'unknown') + '</b></div>' +
      '</div>' +
      '<h4>How the value is built</h4>' +
      '<div class="formula">TVL ' + fmtUsd(r.tvl_usd) + ' × base ' + m.base_multiple.toFixed(3) + ' × growth ' + m.growth_multiplier.toFixed(3) + ' × maturity ' + m.maturity_multiplier.toFixed(3) + ' × category ' + m.category_multiplier.toFixed(2) + ' × chains ' + m.chain_multiplier.toFixed(2) + ' = <b>' + fmtUsd(r.implied_value_usd) + '</b></div>' +
      '<h4>How to farm it</h4>' +
      '<ol class="steps">' + r.farm_steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
      '<h4>Read this before you act</h4>' +
      '<p class="muted">The implied value is the model\'s own claim from the snapshot\'s figures, not a prediction that ' + esc(r.name) + ' issues a token, and not financial advice. Its record shows no token today; that is not proof it has none.</p>';
    $('detail').hidden = false;
  }

  function closeDetail() {
    $('detail').hidden = true;
    document.querySelectorAll('#rows tr.active').forEach((tr) => tr.classList.remove('active'));
  }

  function fillFilters() {
    const cats = new Set();
    const chains = new Set();
    for (const r of R.rows) {
      if (r.category) cats.add(r.category);
      for (const c of r.chains) chains.add(c);
    }
    const catSel = $('f-category');
    for (const c of [...cats].sort()) {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      catSel.appendChild(o);
    }
    const chainSel = $('f-chain');
    for (const c of [...chains].sort()) {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      chainSel.appendChild(o);
    }
  }

  function renderLive() {
    const el = $('live');
    if (!R.live || !R.live.length) { el.parentElement.hidden = true; return; }
    el.innerHTML = R.live.map((p) =>
      '<div class="live-card"><b>' + esc(p.name) + '</b><span>' + esc(p.symbol ? p.symbol.toUpperCase() + ' · ' : '') + 'MC ' + (p.mcap_usd ? fmtUsd(p.mcap_usd) : '—') + ' · TVL ' + fmtUsd(p.tvl_usd) + '</span></div>'
    ).join('');
  }

  function init() {
    $('model-version').textContent = R.model_version || 'radar';
    $('as-of').textContent = R.as_of || '';
    $('source').textContent = R.source || 'DefiLlama';
    const totalImp = R.rows.reduce((a, r) => a + r.implied_value_usd, 0);
    const watchCount = R.rows.filter(isWatch).length;
    $('stats').innerHTML =
      '<div class="stat"><b>' + R.rows.length + '</b><span>board rows</span></div>' +
      '<div class="stat"><b>' + watchCount + '</b><span>watchlist</span></div>' +
      '<div class="stat"><b>' + (R.rows.length - watchCount) + '</b><span>early finds</span></div>' +
      '<div class="stat"><b>' + fmtUsd(totalImp) + '</b><span>total implied</span></div>';
    fillFilters();
    renderLive();
    render();
    $('q').addEventListener('input', applyFilters);
    $('f-category').addEventListener('change', applyFilters);
    $('f-chain').addEventListener('change', applyFilters);
    $('f-watch').addEventListener('change', applyFilters);
    $('sort').addEventListener('change', applyFilters);
    $('detail-close').addEventListener('click', closeDetail);
    $('rows').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (tr && tr.getAttribute('data-slug')) openDetail(tr.getAttribute('data-slug'));
    });
    // Deep link: #detail/<slug> opens the detail view directly (used by the detail screenshot).
    const hash = location.hash || '';
    const m = hash.match(/^#detail\/(.+)$/);
    if (m) openDetail(decodeURIComponent(m[1]));
    // Same deep link works on in-place hash changes (back/forward, anchor navigation).
    window.addEventListener('hashchange', () => {
      const mm = (location.hash || '').match(/^#detail\/(.+)$/);
      if (mm) openDetail(decodeURIComponent(mm[1]));
      else closeDetail();
    });
  }

  init();
})();
