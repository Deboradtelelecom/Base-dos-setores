/* Análise de custo — componente único usado pelas páginas dos setores e dos Custos Regionais.
 *
 *   AnaliseCusto.tendencia(el, opts)  -> card "Tendência de Custo" (variação, média, causa principal,
 *                                        efeito quantidade x custo médio quando há nº de colaboradores)
 *   AnaliseCusto.grafico(el, opts)    -> gráfico "Consumo mensal x média" (barras + linha da média)
 *   AnaliseCusto.ponte(el, opts)      -> "Por que variou": ponte do mês anterior para o mês escolhido,
 *                                        item a item (o que subiu, o que caiu)
 *
 * opts = {
 *   meses:   ['Maio/2026', ...]           rótulos completos, em ordem
 *   curtos:  ['Mai', ...]                 rótulos curtos (opcional)
 *   totais:  [n, ...]                     custo total por mês
 *   sel:     índice do mês escolhido
 *   drivers: { 'Folha': [n,...], ... }    custo por item/categoria por mês (explica a variação)
 *   pessoas: [n, ...]                     nº de colaboradores por mês (opcional)
 *   onPick:  i => {}                      clique numa barra (opcional)
 *   extra:   [{nome, sub, vals:[...]}]    linhas finas p/ "onde mudou" (opcional)
 * }
 */
(function () {
  const C = {
    ink: '#e2e8f0', ink2: '#c3ccdc', muted: '#8291ab', grid: '#1b2333',
    bar: '#2c3a55', barSel: '#3987e5', media: '#c3ccdc',
    alta: '#e66767', queda: '#3987e5',
  };
  const brl = (n, d = 2) => 'R$ ' + (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const brlK = n => {
    const a = Math.abs(n || 0);
    if (a >= 1e6) return 'R$ ' + (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
    if (a >= 1e3) return 'R$ ' + (n / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    return brl(n, 0);
  };
  const sinal = n => (n > 0 ? '+' : n < 0 ? '−' : '');
  const pct = (a, b) => (b ? ((a - b) / Math.abs(b)) * 100 : null);
  const fp = n => (n == null ? '—' : Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%');
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const curto = (o, i) => (o.curtos && o.curtos[i]) || String(o.meses[i]).slice(0, 3);
  const media = o => { const v = o.totais.filter(x => x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };

  function css() {
    if (document.getElementById('ac-css')) return;
    const s = document.createElement('style'); s.id = 'ac-css';
    s.textContent = `
    .ac-card{display:flex;flex-direction:column;gap:10px}
    .ac-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
    .ac-big{font-size:26px;font-weight:800;font-family:var(--mono,monospace)}
    .ac-up{color:${C.alta}} .ac-down{color:#5aa9ff} .ac-eq{color:${C.ink2}}
    .ac-vs{font-size:12px;color:${C.muted}}
    .ac-lin{font-size:12.5px;color:${C.ink2};line-height:1.5}
    .ac-lin b{color:${C.ink};font-weight:700}
    .ac-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
    .ac-kv>div{background:rgba(255,255,255,.025);border:1px solid ${C.grid};border-radius:10px;padding:8px 10px}
    .ac-kv .k{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:${C.muted};font-weight:700}
    .ac-kv .v{font-size:14px;font-weight:700;color:${C.ink};font-family:var(--mono,monospace);margin-top:3px}
    .ac-kv .s{font-size:11px;color:${C.muted};margin-top:2px}
    .ac-svg{width:100%;display:block}
    .ac-svg .b{cursor:pointer} .ac-svg .b:hover rect.m{filter:brightness(1.25)}
    .ac-tip{position:fixed;pointer-events:none;background:#0e1324;border:1px solid ${C.grid};border-radius:8px;padding:7px 10px;font-size:12px;color:${C.ink};z-index:50;display:none;box-shadow:0 6px 20px rgba(0,0,0,.4)}
    .ac-leg{display:flex;gap:14px;font-size:11px;color:${C.muted};margin-top:4px;flex-wrap:wrap}
    .ac-leg i{display:inline-block;width:14px;height:0;border-top:2px dashed ${C.media};vertical-align:middle;margin-right:5px}
    .ac-leg u{display:inline-block;width:10px;height:10px;border-radius:2px;background:${C.barSel};vertical-align:middle;margin-right:5px;text-decoration:none}
    .ac-ponte{display:flex;flex-direction:column;gap:2px}
    .ac-pr{display:grid;grid-template-columns:minmax(120px,1.3fr) 2fr 110px;align-items:center;gap:10px;font-size:12.5px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)}
    .ac-pr .n{color:${C.ink2};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ac-pr .n small{display:block;color:${C.muted};font-size:10.5px}
    .ac-pr .t{position:relative;height:14px}
    .ac-pr .t:before{content:"";position:absolute;left:50%;top:-4px;bottom:-4px;border-left:1px solid ${C.grid}}
    .ac-pr .t span{position:absolute;top:2px;height:10px;border-radius:3px}
    .ac-pr .d{text-align:right;font-family:var(--mono,monospace);font-weight:700}
    .ac-pr.tot{border-bottom:none;border-top:1px solid ${C.grid};margin-top:4px;padding-top:8px}
    .ac-pr.tot .n{color:${C.ink};font-weight:700}
    .ac-sub{font-size:11px;color:${C.muted};margin:10px 0 2px;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
    .ac-res ul{margin:4px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:${C.ink2}}
    @media (max-width:640px){.ac-pr{grid-template-columns:1fr 1fr 90px}}`;
    document.head.appendChild(s);
  }
  let tipEl;
  function tip(html, ev) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'ac-tip'; document.body.appendChild(tipEl); }
    if (!html) { tipEl.style.display = 'none'; return; }
    tipEl.innerHTML = html; tipEl.style.display = 'block';
    const x = Math.min(ev.clientX + 14, window.innerWidth - tipEl.offsetWidth - 8);
    tipEl.style.left = x + 'px'; tipEl.style.top = (ev.clientY + 14) + 'px';
  }

  function variacoes(o, i, j) {
    const out = Object.entries(o.drivers || {}).map(([nome, v]) => ({ nome, a: v[j] || 0, b: v[i] || 0, d: (v[i] || 0) - (v[j] || 0) }));
    return out.filter(x => Math.abs(x.d) >= 0.005).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
  }

  // ---------------------------------------------------------------- card de tendência
  function tendencia(el, o) {
    css();
    const i = o.sel, j = i - 1, atual = o.totais[i] || 0, m = media(o);
    const vm = pct(atual, m);
    if (j < 0 || !o.totais[j]) {
      el.innerHTML = `<div class="ac-card"><div class="ac-lin">Sem mês anterior para comparar.</div>
        <div class="ac-lin">Média do período: <b>${brl(m)}</b>${vm != null ? ` · ${esc(o.meses[i])} está <b>${fp(vm)} ${vm >= 0 ? 'acima' : 'abaixo'}</b> da média` : ''}.</div></div>`;
      return;
    }
    const ant = o.totais[j], d = atual - ant, p = pct(atual, ant);
    const cls = Math.abs(p) < 0.5 ? 'ac-eq' : d > 0 ? 'ac-up' : 'ac-down';
    const seta = Math.abs(p) < 0.5 ? '→' : d > 0 ? '↑' : '↓';
    const vs = variacoes(o, i, j);
    const altas = vs.filter(x => x.d > 0), quedas = vs.filter(x => x.d < 0);
    const it = x => `<b>${esc(x.nome)}</b> ${sinal(x.d)}${brlK(Math.abs(x.d))}`;
    let causaTxt = '';
    const princ = (d > 0 ? altas : quedas)[0];
    if (princ && Math.abs(princ.d) <= Math.abs(d) * 1.0001) {
      causaTxt = `<div class="ac-lin">Principal causa: ${it(princ)} (${(Math.abs(princ.d / d) * 100).toFixed(0)}% da ${d > 0 ? 'alta' : 'queda'}).</div>`;
    } else if (altas.length || quedas.length) {
      causaTxt = `<div class="ac-lin">${altas.length ? 'Maior alta: ' + it(altas[0]) : ''}${altas.length && quedas.length ? ' · ' : ''}${quedas.length ? 'maior queda: ' + it(quedas[0]) : ''}` +
        `${altas.length && quedas.length ? ' — uma compensou a outra.' : '.'}</div>`;
    }
    let kv = `<div><div class="k">Média do período</div><div class="v">${brlK(m)}</div><div class="s">${esc(o.meses[i])}: ${fp(vm)} ${vm >= 0 ? 'acima' : 'abaixo'}</div></div>`;
    const P = o.pessoas;
    if (P && P[i] && P[j]) {
      const ci = atual / P[i], cj = ant / P[j];
      const efQtd = (P[i] - P[j]) * cj, efCusto = P[i] * (ci - cj);
      kv += `<div><div class="k">Custo por colaborador</div><div class="v">${brl(ci, 0)}</div><div class="s">${curto(o, j)}: ${brl(cj, 0)} (${sinal(ci - cj)}${fp(pct(ci, cj))})</div></div>`;
      kv += `<div><div class="k">Efeito quantidade</div><div class="v ${efQtd > 0 ? 'ac-up' : efQtd < 0 ? 'ac-down' : ''}">${sinal(efQtd)}${brlK(Math.abs(efQtd))}</div><div class="s">${P[j]} → ${P[i]} colaboradores</div></div>`;
      kv += `<div><div class="k">Efeito custo médio</div><div class="v ${efCusto > 0 ? 'ac-up' : efCusto < 0 ? 'ac-down' : ''}">${sinal(efCusto)}${brlK(Math.abs(efCusto))}</div><div class="s">mesmo quadro, custo diferente</div></div>`;
    }
    if (o.compacto) {
      // versão enxuta: variação + 1 linha curta com o que mais pesou
      const x = princ && Math.abs(princ.d) <= Math.abs(d) * 1.0001 ? princ : (d > 0 ? altas : quedas)[0] || vs[0];
      const linha = x ? `<div class="ac-lin" style="margin-top:6px">${d > 0 ? 'Mais pesou' : 'Mais caiu'}: <b>${esc(x.nome)}</b> <span class="${x.d > 0 ? 'ac-up' : 'ac-down'}">${sinal(x.d)}${brlK(Math.abs(x.d))}</span></div>` : '';
      el.innerHTML = `<div class="ac-card"><div class="ac-head"><span class="ac-big ${cls}">${seta} ${fp(p)}</span><span class="ac-vs">vs. ${esc(curto(o, j))} · ${sinal(d)}${brlK(Math.abs(d))}</span></div>${linha}</div>`;
      return;
    }
    el.innerHTML = `<div class="ac-card">
      <div class="ac-head"><span class="ac-big ${cls}">${seta} ${fp(p)}</span><span class="ac-vs">vs. ${esc(o.meses[j])} · ${sinal(d)}${brl(Math.abs(d))}</span></div>
      ${causaTxt}
      <div class="ac-kv">${kv}</div></div>`;
  }

  // ---------------------------------------------------------------- consumo mensal x média
  function grafico(el, o) {
    css();
    const n = o.meses.length, W = Math.max(320, el.clientWidth || 600), H = 250, pl = 8, pr = 8, pt = 26, pb = 26;
    const max = Math.max(1, ...o.totais) * 1.12, m = media(o);
    const bw = (W - pl - pr) / n, y = v => pt + (H - pt - pb) * (1 - v / max);
    const larg = Math.min(56, bw * 0.56);
    let s = `<svg class="ac-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Consumo mensal e média do período">`;
    s += `<line x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}" stroke="${C.grid}"/>`;
    o.totais.forEach((v, i) => {
      const x = pl + bw * i + (bw - larg) / 2, yy = y(v), h = Math.max(0, H - pb - yy), sel = i === o.sel;
      const r = Math.min(4, h);
      s += `<g class="b" data-i="${i}"><rect x="${pl + bw * i}" y="${pt - 20}" width="${bw}" height="${H - pt + 20}" fill="transparent"/>`;
      s += h > 0 ? `<path class="m" d="M${x},${H - pb} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + larg - r} Q${x + larg},${yy} ${x + larg},${yy + r} V${H - pb} Z" fill="${sel ? C.barSel : C.bar}"/>` : '';
      if (sel || n <= 6) s += `<text x="${x + larg / 2}" y="${yy - 6}" text-anchor="middle" font-size="${sel ? 11.5 : 10.5}" font-weight="${sel ? 700 : 400}" fill="${sel ? C.ink : C.muted}" font-family="system-ui">${brlK(v)}</text>`;
      s += `<text x="${pl + bw * i + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${sel ? C.ink : C.muted}" font-weight="${sel ? 700 : 400}" font-family="system-ui">${esc(curto(o, i))}</text></g>`;
    });
    if (m) {
      const ym = y(m);
      s += `<line x1="${pl}" x2="${W - pr}" y1="${ym}" y2="${ym}" stroke="${C.media}" stroke-width="2" stroke-dasharray="6 5"/>`;
    }
    s += `</svg><div class="ac-leg"><span><u></u>mês escolhido</span><span><i></i>média do período: ${brlK(m)}</span><span>clique numa barra para mudar o mês</span></div>`;
    el.innerHTML = s;
    el.querySelectorAll('.b').forEach(g => {
      const i = +g.dataset.i, v = o.totais[i], a = o.totais[i - 1];
      g.addEventListener('mousemove', ev => tip(`<b>${esc(o.meses[i])}</b><br>${brl(v)}<br><span style="color:${C.muted}">vs média: ${sinal(v - m)}${fp(pct(v, m))}${a ? ` · vs mês ant.: ${sinal(v - a)}${fp(pct(v, a))}` : ''}${o.pessoas && o.pessoas[i] ? `<br>${o.pessoas[i]} colaboradores · ${brl(v / o.pessoas[i], 0)}/colab.` : ''}</span>`, ev));
      g.addEventListener('mouseleave', () => tip(null));
      if (o.onPick) g.addEventListener('click', () => { tip(null); o.onPick(i); });
    });
  }

  // ---------------------------------------------------------------- ponte: por que variou
  function ponte(el, o, lim = 7) {
    css();
    const i = o.sel, j = i - 1;
    if (j < 0) { el.innerHTML = '<div class="ac-lin">Sem mês anterior para comparar.</div>'; return; }
    const vs = variacoes(o, i, j);
    const top = vs.slice(0, lim), resto = vs.slice(lim).reduce((s, x) => s + x.d, 0);
    if (Math.abs(resto) >= 0.005) top.push({ nome: `Outros (${vs.length - lim} itens)`, d: resto });
    const mx = Math.max(1, ...top.map(x => Math.abs(x.d)));
    const linha = (nome, d, sub) => {
      const w = Math.abs(d) / mx * 50;
      const bar = d >= 0 ? `left:50%;width:${w}%;background:${C.alta}` : `left:${50 - w}%;width:${w}%;background:${C.queda}`;
      return `<div class="ac-pr"><div class="n" title="${esc(nome)}">${esc(nome)}${sub ? `<small>${esc(sub)}</small>` : ''}</div><div class="t"><span style="${bar}"></span></div><div class="d ${d > 0 ? 'ac-up' : d < 0 ? 'ac-down' : ''}">${sinal(d)}${brlK(Math.abs(d))}</div></div>`;
    };
    let h = `<div class="ac-ponte"><div class="ac-pr"><div class="n">${esc(o.meses[j])}</div><div class="t"></div><div class="d" style="color:${C.ink2}">${brlK(o.totais[j])}</div></div>`;
    h += top.length ? top.map(x => linha(x.nome, x.d, x.a != null ? `${brlK(x.a)} → ${brlK(x.b)}` : '')).join('') : '<div class="ac-lin">Nenhum item mudou de valor.</div>';
    const d = o.totais[i] - o.totais[j];
    h += `<div class="ac-pr tot"><div class="n">${esc(o.meses[i])}</div><div class="t"></div><div class="d">${brlK(o.totais[i])} <span class="${d > 0 ? 'ac-up' : 'ac-down'}" style="font-size:11px">(${sinal(d)}${brlK(Math.abs(d))})</span></div></div></div>`;
    if (o.extra && o.extra.length) {
      const ex = o.extra.map(x => ({ ...x, d: (x.vals[i] || 0) - (x.vals[j] || 0) })).filter(x => Math.abs(x.d) >= 0.005)
        .sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 8);
      if (ex.length) {
        const mx2 = Math.max(1, ...ex.map(x => Math.abs(x.d)));
        h += `<div class="ac-sub">Onde mudou mais</div><div class="ac-ponte">` + ex.map(x => {
          const w = Math.abs(x.d) / mx2 * 50;
          const bar = x.d >= 0 ? `left:50%;width:${w}%;background:${C.alta}` : `left:${50 - w}%;width:${w}%;background:${C.queda}`;
          return `<div class="ac-pr"><div class="n" title="${esc(x.nome)}">${esc(x.nome)}<small>${esc(x.sub || '')} · ${brlK(x.vals[j] || 0)} → ${brlK(x.vals[i] || 0)}</small></div><div class="t"><span style="${bar}"></span></div><div class="d ${x.d > 0 ? 'ac-up' : 'ac-down'}">${sinal(x.d)}${brlK(Math.abs(x.d))}</div></div>`;
        }).join('') + '</div>';
      }
    }
    h += `<div class="ac-leg" style="margin-top:8px"><span style="color:${C.alta}">■ subiu</span><span style="color:#5aa9ff">■ caiu</span><span>comparação com o mês anterior</span></div>`;
    el.innerHTML = h;
  }

  // ---------------------------------------------------------------- resumo curto: o que mudou no mês
  function resumo(el, o) {
    css();
    const i = o.sel, j = i - 1;
    if (j < 0) { el.innerHTML = ''; return; }
    const vs = variacoes(o, i, j), d = (o.totais[i] || 0) - (o.totais[j] || 0);
    const la = o.limAltas || 3, lq = o.limQuedas || 2;
    const altas = vs.filter(x => x.d > 0).slice(0, la), quedas = vs.filter(x => x.d < 0).slice(0, lq);
    const onde = (nome, dd) => {
      if (!o.extra) return '';
      const e = o.extra.filter(x => x.nome === nome).map(x => ({ ...x, d: (x.vals[i] || 0) - (x.vals[j] || 0) }))
        .filter(x => Math.sign(x.d) === Math.sign(dd)).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
      return e && e.sub ? ` <span style="color:${C.muted}">— principalmente ${esc(e.sub)}</span>` : '';
    };
    const li = x => `<li><span class="${x.d > 0 ? 'ac-up' : 'ac-down'}" style="font-family:var(--mono,monospace);font-weight:700">${sinal(x.d)}${brlK(Math.abs(x.d))}</span> ${esc(x.nome)}${onde(x.nome, x.d)}</li>`;
    if (o.compacto) {
      // só os 3 itens que mais mexeram (altas e quedas juntas), sem repetir o total
      const top = vs.slice(0, o.limTop || 3);
      el.innerHTML = top.length ? `<div class="ac-res"><div class="ac-sub">${esc(o.tituloResumo || 'O que mais mudou')} vs. ${esc(curto(o, j))}</div><ul>${top.map(li).join('')}</ul></div>` : '';
      return;
    }
    el.innerHTML = `<div class="ac-res"><div class="ac-sub">${esc(o.tituloResumo || 'O que mudou')} em ${esc(o.meses[i])} (vs. ${esc(o.meses[j])}: ${sinal(d)}${brlK(Math.abs(d))})</div>
      <ul>${altas.map(li).join('')}${quedas.map(li).join('')}</ul></div>`;
  }

  // ---------------------------------------------------------------- custo fixo x variável por mês (duas linhas)
  function composicao(el, o) {
    css();
    const F = o.fixo || [], V = o.variavel || [], n = o.meses.length;
    const W = Math.max(280, el.clientWidth || 420), H = 250, pl = 10, pr = 70, pt = 22, pb = 26;
    const max = Math.max(1, ...F, ...V) * 1.12;
    const bw = (W - pl - pr) / n, xc = i => pl + bw * i + bw / 2, y = v => pt + (H - pt - pb) * (1 - (v || 0) / max);
    const CF = '#3987e5', CV = '#d95926';
    let s = `<svg class="ac-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Custo fixo e variável por mês">`;
    s += `<line x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}" stroke="${C.grid}"/>`;
    if (o.sel >= 0) s += `<rect x="${pl + bw * o.sel}" y="${pt - 12}" width="${bw}" height="${H - pt - pb + 12}" fill="rgba(255,255,255,.035)" rx="6"/>`;
    const linha = (arr, cor) => {
      const pts = o.meses.map((_, i) => `${xc(i)},${y(arr[i])}`).join(' ');
      let t = `<polyline points="${pts}" fill="none" stroke="${cor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      o.meses.forEach((_, i) => { const sel = i === o.sel; t += `<circle cx="${xc(i)}" cy="${y(arr[i])}" r="${sel ? 5.5 : 3.5}" fill="${sel ? cor : '#0c0f1d'}" stroke="${cor}" stroke-width="2"/>`; });
      return t;
    };
    s += linha(F, CF) + linha(V, CV);
    // rótulo direto no fim de cada linha (sem números por cima dos pontos)
    let yF = y(F[n - 1]), yV = y(V[n - 1]);
    if (Math.abs(yF - yV) < 14) { if (yF <= yV) yV = yF + 14; else yF = yV + 14; }
    s += `<text x="${xc(n - 1) + 10}" y="${yF + 4}" font-size="11.5" font-weight="700" fill="${CF}" font-family="system-ui">Fixo</text>`;
    s += `<text x="${xc(n - 1) + 10}" y="${yV + 4}" font-size="11.5" font-weight="700" fill="${CV}" font-family="system-ui">Variável</text>`;
    o.meses.forEach((_, i) => {
      const sel = i === o.sel;
      s += `<g class="b" data-i="${i}"><rect x="${pl + bw * i}" y="0" width="${bw}" height="${H}" fill="transparent"/>`;
      s += `<text x="${xc(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${sel ? C.ink : C.muted}" font-weight="${sel ? 700 : 400}" font-family="system-ui">${esc(curto(o, i))}</text></g>`;
    });
    s += '</svg>';
    const i = o.sel, f = F[i] || 0, v = V[i] || 0, t = f + v || 1;
    const pa = j => (j > 0 ? j - 1 : -1);
    const dif = (arr) => { const j = pa(i); return j >= 0 ? ` <span style="color:${C.muted}">(${sinal(arr[i] - arr[j])}${brlK(Math.abs((arr[i] || 0) - (arr[j] || 0)))} vs. ${esc(curto(o, j))})</span>` : ''; };
    s += `<div class="ac-res" style="margin-top:6px"><ul>
      <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${CF};margin-right:6px;vertical-align:middle"></span>Custo fixo: <b style="color:${C.ink}">${brl(f)}</b> · ${((f / t) * 100).toFixed(0)}%${dif(F)}</li>
      <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${CV};margin-right:6px;vertical-align:middle"></span>Custo variável: <b style="color:${C.ink}">${brl(v)}</b> · ${((v / t) * 100).toFixed(0)}%${dif(V)}</li></ul></div>`;
    el.innerHTML = s;
    el.querySelectorAll('.b').forEach(g => {
      const k = +g.dataset.i, ff = F[k] || 0, vv = V[k] || 0, tt = ff + vv || 1;
      g.addEventListener('mousemove', ev => tip(`<b>${esc(o.meses[k])}</b><br>Fixo: ${brl(ff)} (${((ff / tt) * 100).toFixed(0)}%)<br>Variável: ${brl(vv)} (${((vv / tt) * 100).toFixed(0)}%)`, ev));
      g.addEventListener('mouseleave', () => tip(null));
      if (o.onPick) g.addEventListener('click', () => { tip(null); o.onPick(k); });
    });
  }

  window.AnaliseCusto = { tendencia, grafico, ponte, resumo, composicao, brl, brlK };
})();
