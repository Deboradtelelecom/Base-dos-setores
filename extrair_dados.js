// Extrai os dados reais da Base_Rateio_Custos_DTEL.xlsx no mesmo formato já
// validado nas outras entregas (STATE_REAL): por setor, com histórico mensal,
// itens agrupados por categoria (Custo Fixo / Custo Variável) e, quando
// disponível, o detalhamento por colaborador — Folha de pagamento, Exames
// médicos, Combustível e EPIs, com granularidade mensal (Maio/Junho/Julho de
// 2026), carregado de detalhes_colaborador.json.
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const SECTOR_ICONS = {
  noc: '🛰️', rh: '👥', dp: '🗂️', gestao_de_atendimento: '💬', cac: '📞',
  financeiro: '💰', nrc: '📋', cobranca: '💳', retencao: '🎯', contabilidade: '🗒️',
  controladoria: '📊', diretoria_operacional: '🧭', compras: '🛒', seguranca_do_trabalho: '🦺',
  engenharia: '🏗️', obras: '🧱', manutencao_predial: '🔧', logistica: '🚚', oficina: '🔩',
  estoque: '📦', televendas: '☎️', suporte_orbix: '🛠️', suporte_da_central: '🖥️',
  comercial_corporativo: '🤝', administrativo: '🗃️',
  qualidade: '✅', juridico: '⚖️', marketing: '📣', tic: '🖧', coe: '🧩', fique_movel: '📱',
  lancamento: '📡', fusao: '🔗', diretoria_adm: '🗂️', cozinha: '🍳',
  backoffice_comercial_varejo: '🧾', servicos_gerais: '🧹',
};

// Ordena "Maio/2026" < "Junho/2026" < "Julho/2026" de forma cronológica real
// (não alfabética) — usado tanto pra lista de meses disponíveis quanto pro
// histórico de cada setor, que precisa aparecer na mesma ordem no gráfico.
const ORDEM_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
function compararMeses(a, b) {
  const [na, aa] = a.split('/');
  const [nb, ab] = b.split('/');
  if (aa !== ab) return Number(aa) - Number(ab);
  return ORDEM_MESES.indexOf(na) - ORDEM_MESES.indexOf(nb);
}

function slugify(nome) {
  return nome
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function encontrarArquivoBase(pastaDados) {
  if (!fs.existsSync(pastaDados)) return null;
  const candidatos = fs.readdirSync(pastaDados).filter(
    (f) => /^Base_Rateio_Custos_DTEL.*\.xlsx$/i.test(f) && !f.toLowerCase().includes('backup')
  );
  if (!candidatos.length) return null;
  // Se houver mais de um, usa o mais recente (mtime).
  candidatos.sort((a, b) => {
    const ma = fs.statSync(path.join(pastaDados, a)).mtimeMs;
    const mb = fs.statSync(path.join(pastaDados, b)).mtimeMs;
    return mb - ma;
  });
  return path.join(pastaDados, candidatos[0]);
}

function carregarDetalhesColaborador(pastaDados) {
  // Detalhamento por colaborador/condutor de 3 tipos de item de custo:
  // Folha de pagamento (Julho/2026, todos os setores com equipe correspondente
  // na folha trabalhista), Exames médicos e Combustível de frota (esses dois
  // com granularidade mensal, cruzando com as planilhas auxiliares reais —
  // só para setores com nome inequívoco na planilha auxiliar; setores
  // ambíguos ficam de fora, sem inventar o vínculo). Ver documentação do
  // projeto "Plataforma de rateio".
  const candidatosPaths = [
    path.join(__dirname, 'detalhes_colaborador.json'),
    path.join(pastaDados, 'detalhes_colaborador.json'),
    // fallback ao nome antigo (só folha de pagamento), para não quebrar
    // instalações que ainda não receberam o arquivo novo.
    path.join(__dirname, 'detalhes_folha_julho.json'),
    path.join(pastaDados, 'detalhes_folha_julho.json'),
  ];
  for (const p of candidatosPaths) {
    if (fs.existsSync(p)) {
      try {
        const dados = JSON.parse(fs.readFileSync(p, 'utf-8'));
        // Formato antigo (arquivo só de folha): { slug: [...] }. Normaliza
        // para o formato novo { folha_de_pagamento: { slug: [...] }, ... }.
        if (path.basename(p) === 'detalhes_folha_julho.json') {
          return { folha_de_pagamento: dados, exames_medicos: {}, combustivel: {} };
        }
        return {
          folha_de_pagamento: dados.folha_de_pagamento || {},
          exames_medicos: dados.exames_medicos || {},
          combustivel: dados.combustivel || {},
          epi: dados.epi || {},
          materiais_escritorio: dados.materiais_escritorio || {},
          materiais_coletivo: dados.materiais_coletivo || {},
          email_corporativo: dados.email_corporativo || {},
          impressoras: dados.impressoras || {},
          chip_movel: dados.chip_movel || {},
          fardamento_novo: dados.fardamento_novo || {},
          fardamento_substituicao: dados.fardamento_substituicao || {},
          fardamento_devolucao: dados.fardamento_devolucao || {},
          equipe_pap_nomes: dados.equipe_pap_nomes || {},
        };
      } catch (e) {
        return { folha_de_pagamento: {}, exames_medicos: {}, combustivel: {}, epi: {}, materiais_escritorio: {}, materiais_coletivo: {}, email_corporativo: {}, impressoras: {}, chip_movel: {}, fardamento_novo: {}, fardamento_substituicao: {}, fardamento_devolucao: {}, equipe_pap_nomes: {} };
      }
    }
  }
  return { folha_de_pagamento: {}, exames_medicos: {}, combustivel: {}, epi: {}, materiais_escritorio: {}, materiais_coletivo: {}, email_corporativo: {}, impressoras: {}, chip_movel: {}, fardamento_novo: {}, fardamento_substituicao: {}, fardamento_devolucao: {}, equipe_pap_nomes: {} };
}

function extrairEstado(pastaDados) {
  const caminho = encontrarArquivoBase(pastaDados);
  if (!caminho) {
    throw new Error(
      `Nenhum arquivo Base_Rateio_Custos_DTEL*.xlsx encontrado em ${pastaDados}`
    );
  }

  const wb = XLSX.readFile(caminho, { cellDates: false });
  const wsSetores = wb.Sheets['SETORES'];
  const wsCustos = wb.Sheets['CUSTOS MENSAIS'];
  const wsParametros = wb.Sheets['PARÂMETROS'];
  const wsComercialVarejo = wb.Sheets['COMERCIAL VAREJO'];
  const wsReembolsoGeral = wb.Sheets['REEMBOLSO GERAL'];
  if (!wsSetores || !wsCustos) {
    throw new Error("Abas 'SETORES' e/ou 'CUSTOS MENSAIS' não encontradas na planilha.");
  }

  const linhasSetores = XLSX.utils.sheet_to_json(wsSetores, { header: 1, range: 4 }); // cabeçalho na linha 4 (índice 3)
  const linhasCustos = XLSX.utils.sheet_to_json(wsCustos, { header: 1, range: 4 });

  // Bloco "RATEIO POR EMPRESA", dentro da aba PARÂMETROS (abaixo da tabela de
  // clientes/funcionários por empresa) — cruza cada setor com cada empresa
  // licenciada e mostra quanto ela deve pagar (rateio a custo, sem markup).
  // Formato: Setor | Critério | Empresa | % Aplicado | Custo Total do Setor |
  // Valor de Custo Rateado | % Royalty | Valor de Royalty | Valor Total a
  // Cobrar | Mês. Localizamos o cabeçalho dinamicamente (em vez de assumir a
  // linha fixa) para não quebrar se alguém inserir/remover linhas acima.
  const rateioPorEmpresaPorSetor = {}; // slug -> mes -> [{empresa, ...}]
  const MESES_VALIDOS = new Set(['Maio/2026', 'Junho/2026', 'Julho/2026']);
  if (wsParametros) {
    const linhasParametros = XLSX.utils.sheet_to_json(wsParametros, { header: 1, defval: '' });
    let headerIdx = -1;
    for (let i = 0; i < linhasParametros.length; i++) {
      const r = linhasParametros[i];
      if (r[0] === 'Setor' && r[2] === 'Empresa') {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx >= 0) {
      for (let i = headerIdx + 1; i < linhasParametros.length; i++) {
        const r = linhasParametros[i];
        const [setorNome, criterio, empresa, percentAplicado, custoTotalSetor, valorRateado, percentRoyalty, valorRoyalty, valorTotalACobrar, mes] = r;
        if (!setorNome || !empresa || !MESES_VALIDOS.has(mes)) continue; // pula notas/legendas no rodapé
        const chave = slugify(String(setorNome));
        if (!rateioPorEmpresaPorSetor[chave]) rateioPorEmpresaPorSetor[chave] = {};
        if (!rateioPorEmpresaPorSetor[chave][mes]) rateioPorEmpresaPorSetor[chave][mes] = [];
        rateioPorEmpresaPorSetor[chave][mes].push({
          empresa: String(empresa),
          criterio: criterio || '',
          percentAplicado: Number(percentAplicado) || 0,
          custoTotalSetor: Number(custoTotalSetor) || 0,
          valorRateado: Number(valorRateado) || 0,
          percentRoyalty: Number(percentRoyalty) || 0,
          valorRoyalty: Number(valorRoyalty) || 0,
          valorTotalACobrar: Number(valorTotalACobrar) || 0,
        });
      }
    }
  }

  const detalhesColaborador = carregarDetalhesColaborador(pastaDados);
  const mesesSet = new Set();
  const STATE_REAL = {};

  // 1ª passada: monta nome/critério/justificativa/histórico a partir de SETORES
  linhasSetores.forEach((row) => {
    const [nome, criterio, justificativa, totalMes, custoUnitario, mes] = row;
    if (!nome || !mes) return;
    const chave = slugify(String(nome));
    mesesSet.add(mes);
    if (!STATE_REAL[chave]) {
      STATE_REAL[chave] = {
        nome: String(nome),
        criterioRateio: criterio || '',
        justificativa: justificativa || '',
        historico: [],
        porMes: {},
      };
    }
    STATE_REAL[chave].historico.push({ mes, total: Number(totalMes) || 0, custoUnitario: Number(custoUnitario) || 0 });
  });

  // 2ª passada: itens de CUSTOS MENSAIS, agrupados por categoria (bloco único
  // por categoria — mesma correção já aplicada nas outras entregas).
  linhasCustos.forEach((row) => {
    const [setorNome, categoria, descricao, quantidade, valorUnitario, totalMesCalc, , mes] = row;
    if (!setorNome || !mes) return;
    const chave = slugify(String(setorNome));
    if (!STATE_REAL[chave]) return; // setor sem entrada em SETORES — ignora
    // "Telefonia móvel corporativa" foi removida do custeio por pedido da
    // Débora (25/08/2026) — mantém a linha na planilha (zerada, D/E vazios)
    // pra não quebrar referências absolutas de outra aba, mas não exibe
    // no site uma linha de R$ 0 sem sentido pro gestor.
    if (/^telefonia m[oó]vel corporativa$/i.test(String(descricao || '').trim()) && !(Number(quantidade) > 0)) {
      return;
    }
    // "Dynamics (f001796)" saiu do Comercial Corporativo e passou para o
    // Administrativo por pedido da Débora (25/08/2026) — mesmo tratamento:
    // linha zerada mantida na planilha (não quebra referências de outra aba),
    // mas escondida do site pra não mostrar R$ 0 sem sentido pro gestor.
    if (/^dynamics \(f001796\)$/i.test(String(descricao || '').trim()) && !(Number(quantidade) > 0)) {
      return;
    }
    mesesSet.add(mes);
    if (!STATE_REAL[chave].porMes[mes]) {
      STATE_REAL[chave].porMes[mes] = { _porCategoria: new Map() };
    }
    const bucket = STATE_REAL[chave].porMes[mes]._porCategoria;
    if (!bucket.has(categoria)) bucket.set(categoria, []);

    let detalhes = null;
    const nomeItemLimpo = String(descricao || '').trim();
    if (
      /folha de pagamento/i.test(nomeItemLimpo) &&
      detalhesColaborador.folha_de_pagamento[chave] &&
      detalhesColaborador.folha_de_pagamento[chave][mes] &&
      detalhesColaborador.folha_de_pagamento[chave][mes].length
    ) {
      detalhes = detalhesColaborador.folha_de_pagamento[chave][mes];
    } else if (
      /exames? m[eé]dicos?/i.test(nomeItemLimpo) &&
      detalhesColaborador.exames_medicos[chave] &&
      detalhesColaborador.exames_medicos[chave][mes] &&
      detalhesColaborador.exames_medicos[chave][mes].length
    ) {
      detalhes = detalhesColaborador.exames_medicos[chave][mes];
    } else if (
      /combust[ií]vel/i.test(nomeItemLimpo) &&
      detalhesColaborador.combustivel[chave] &&
      detalhesColaborador.combustivel[chave][mes] &&
      detalhesColaborador.combustivel[chave][mes].length
    ) {
      detalhes = detalhesColaborador.combustivel[chave][mes];
    } else if (
      /\bEPIs?\b/i.test(nomeItemLimpo) &&
      detalhesColaborador.epi[chave] &&
      detalhesColaborador.epi[chave][mes] &&
      detalhesColaborador.epi[chave][mes].length
    ) {
      detalhes = detalhesColaborador.epi[chave][mes];
    } else if (
      /material de escrit[oó]rio/i.test(nomeItemLimpo) &&
      detalhesColaborador.materiais_escritorio[chave] &&
      detalhesColaborador.materiais_escritorio[chave][mes] &&
      detalhesColaborador.materiais_escritorio[chave][mes].length
    ) {
      detalhes = detalhesColaborador.materiais_escritorio[chave][mes];
    } else if (
      /material de uso coletivo/i.test(nomeItemLimpo) &&
      detalhesColaborador.materiais_coletivo[chave] &&
      detalhesColaborador.materiais_coletivo[chave][mes] &&
      detalhesColaborador.materiais_coletivo[chave][mes].length
    ) {
      detalhes = detalhesColaborador.materiais_coletivo[chave][mes];
    } else if (
      /licen[çc]a de e-?mail|e-?mail do departamento/i.test(nomeItemLimpo) &&
      detalhesColaborador.email_corporativo[chave] &&
      detalhesColaborador.email_corporativo[chave][mes] &&
      detalhesColaborador.email_corporativo[chave][mes].length
    ) {
      detalhes = detalhesColaborador.email_corporativo[chave][mes];
    } else if (
      /^impressora$/i.test(nomeItemLimpo) &&
      detalhesColaborador.impressoras[chave] &&
      detalhesColaborador.impressoras[chave][mes] &&
      detalhesColaborador.impressoras[chave][mes].length
    ) {
      detalhes = detalhesColaborador.impressoras[chave][mes];
    } else if (
      /chip m[oó]vel/i.test(nomeItemLimpo) &&
      detalhesColaborador.chip_movel[chave] &&
      detalhesColaborador.chip_movel[chave][mes] &&
      detalhesColaborador.chip_movel[chave][mes].length
    ) {
      detalhes = detalhesColaborador.chip_movel[chave][mes];
    } else if (
      /(fardamento novo|novo fardamento)/i.test(nomeItemLimpo) &&
      detalhesColaborador.fardamento_novo[chave] &&
      detalhesColaborador.fardamento_novo[chave][mes] &&
      detalhesColaborador.fardamento_novo[chave][mes].length
    ) {
      detalhes = detalhesColaborador.fardamento_novo[chave][mes];
    } else if (
      /fardamento substitui|substitui[çc][ãa]o.*fardamento/i.test(nomeItemLimpo) &&
      detalhesColaborador.fardamento_substituicao[chave] &&
      detalhesColaborador.fardamento_substituicao[chave][mes] &&
      detalhesColaborador.fardamento_substituicao[chave][mes].length
    ) {
      detalhes = detalhesColaborador.fardamento_substituicao[chave][mes];
    } else if (
      /devolu[çc][ãa]o.*fardamento/i.test(nomeItemLimpo) &&
      detalhesColaborador.fardamento_devolucao[chave] &&
      detalhesColaborador.fardamento_devolucao[chave][mes] &&
      detalhesColaborador.fardamento_devolucao[chave][mes].length
    ) {
      detalhes = detalhesColaborador.fardamento_devolucao[chave][mes];
    }

    bucket.get(categoria).push({
      categoria: categoria || '',
      item: nomeItemLimpo,
      quantidade: Number(quantidade) || 0,
      valorUnitario: Number(valorUnitario) || 0,
      total: Number(totalMesCalc) || 0,
      detalhes,
    });
  });

  // Achata o Map em itens (ordem de categoria) + agrega totals por categoria.
  Object.values(STATE_REAL).forEach((setor) => {
    Object.keys(setor.porMes).forEach((mes) => {
      const bucket = setor.porMes[mes]._porCategoria;
      const itens = [];
      const categorias = [];
      bucket.forEach((lista, catName) => {
        let soma = 0;
        lista.forEach((it) => {
          soma += it.total;
          itens.push(it);
        });
        categorias.push({ categoria: catName, total: soma });
      });
      setor.porMes[mes] = { itens, categorias };
    });
  });

  // Anexa o rateio por empresa a cada setor (isolado — só os dados do
  // próprio setor, igual ao resto do STATE_REAL) e monta também um
  // consolidado com todos os setores/meses para a página única de
  // reembolso.
  const rateioConsolidado = []; // [{setor, criterio, empresa, ..., mes}]
  Object.keys(STATE_REAL).forEach((chave) => {
    const setor = STATE_REAL[chave];
    const porMesEmpresa = rateioPorEmpresaPorSetor[chave] || null;
    setor.rateioPorEmpresa = porMesEmpresa;
    if (porMesEmpresa) {
      Object.keys(porMesEmpresa).forEach((mes) => {
        porMesEmpresa[mes].forEach((linha) => {
          rateioConsolidado.push({ setor: setor.nome, mes, ...linha });
        });
      });
    }
  });

  const mesesDisponiveis = Array.from(mesesSet).sort(compararMeses);

  // O histórico de cada setor é montado na ordem em que as linhas aparecem
  // na aba SETORES da planilha, que não é necessariamente cronológica —
  // reordena aqui pra garantir que o gráfico de "Histórico do Setor" sempre
  // mostre Maio → Junho → Julho, independente da ordem das linhas na planilha.
  Object.values(STATE_REAL).forEach((setor) => {
    setor.historico.sort((a, b) => compararMeses(a.mes, b.mes));
  });

  const comercialVarejo = wsComercialVarejo ? extrairComercialVarejo(wsComercialVarejo, detalhesColaborador) : null;
  const reembolsoGeral = wsReembolsoGeral ? extrairReembolsoGeral(wsReembolsoGeral) : null;

  return { STATE_REAL, mesesDisponiveis, rateioConsolidado, comercialVarejo, reembolsoGeral, arquivoUsado: path.basename(caminho) };
}

// Aba "REEMBOLSO GERAL" — extraída da Base Geral 2026.xlsx (aba Reembolso
// Geral, outro sistema da Débora, que consolida reembolsos entre a Dtel e as
// empresas licenciadas com uma linha por Mês/Setor/Empresa/Descrição). Aqui
// só lemos e devolvemos a lista já pronta (Mês, Setor, Descrição, Empresa,
// Quantidade, Valor Unitário, Valor Total, Observação) — cabeçalho fixo na
// linha 4, dados a partir da linha 5 (ver comercial-varejo-vendas-ha-loja-pap
// / plataformas-editaveis-rateio-financeiro no histórico do projeto).
function extrairReembolsoGeral(ws) {
  const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, range: 4, defval: null });
  const registros = [];
  for (const r of linhas) {
    const [mes, setor, descricao, empresa, quantidade, valorUnitario, valorTotal, observacao] = r;
    if (!mes) continue;
    registros.push({
      mes: String(mes),
      setor: setor || '',
      descricao: descricao || '',
      empresa: empresa || '',
      quantidade: Number(quantidade) || 0,
      valorUnitario: Number(valorUnitario) || 0,
      valorTotal: Number(valorTotal) || 0,
      observacao: observacao || '',
    });
  }
  return registros;
}

// Aba "COMERCIAL VAREJO" — estrutura diferente das outras (não é por Setor,
// é por Coordenador/Equipe de vendas PAP, cruzado com Empresa). Três blocos:
// 1) COMPOSIÇÃO DAS EQUIPES (coordenador x empresa: nº de ativos/cargos)
// 2) CUSTOS DIRETOS — RATEADOS/REAIS POR COORDENADOR/EQUIPE (item a item, por mês)
// 3) CUSTO, VENDAS E RECEITA — POR EQUIPE E EMPRESA (resumo mensal por equipe+empresa)
// Localizamos os cabeçalhos de cada bloco dinamicamente pelo texto do título,
// em vez de fixar números de linha, para não quebrar se alguém inserir linhas.
function extrairComercialVarejo(ws, detalhesColaborador) {
  const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  let idxComposicao = -1, idxCustos = -1, idxResumo = -1;
  for (let i = 0; i < linhas.length; i++) {
    const a = linhas[i][0];
    if (typeof a !== 'string') continue;
    if (idxComposicao === -1 && a.includes('COMPOSIÇÃO DAS EQUIPES')) idxComposicao = i;
    else if (idxCustos === -1 && a.includes('CUSTOS DIRETOS')) idxCustos = i;
    else if (idxResumo === -1 && a.includes('CUSTO, VENDAS E RECEITA')) idxResumo = i;
  }

  const composicao = []; // {coordenador, empresa, totalAtivos, vendedoresFixos, executivos, outrosCargos}
  if (idxComposicao >= 0) {
    for (let i = idxComposicao + 2; i < linhas.length; i++) { // +1 = cabeçalho, +2 = 1ª linha de dado
      const r = linhas[i];
      const [coordenador, empresa, totalAtivos, vendedoresFixos, executivos, outrosCargos] = r;
      if (!coordenador && !empresa) break; // linha em branco = fim do bloco
      if (!coordenador) continue;
      composicao.push({
        coordenador: String(coordenador),
        empresa: empresa || '',
        totalAtivos: Number(totalAtivos) || 0,
        vendedoresFixos: Number(vendedoresFixos) || 0,
        executivos: Number(executivos) || 0,
        outrosCargos: outrosCargos && outrosCargos !== '—' ? String(outrosCargos) : '',
      });
      if (i - idxComposicao > 500) break; // guarda de segurança
    }
  }

  const custosDiretos = []; // {mes, empresa, categoria, despesa, coordenador, quantidade, valorUnitario, valor, origem}
  let subtotalCustos = 0;
  if (idxCustos >= 0) {
    for (let i = idxCustos + 2; i < linhas.length; i++) {
      const r = linhas[i];
      const mes = r[0];
      if (typeof mes === 'string' && mes.startsWith('Subtotal')) {
        subtotalCustos = Number(r[7]) || 0;
        break;
      }
      if (!mes) continue;
      const [ , empresa, categoria, despesa, coordenador, quantidade, valorUnitario, valor, origem ] = r;
      custosDiretos.push({
        mes: String(mes),
        empresa: empresa || '',
        categoria: categoria || '',
        despesa: despesa || '',
        coordenador: coordenador || '',
        quantidade: Number(quantidade) || 0,
        valorUnitario: Number(valorUnitario) || 0,
        valor: Number(valor) || 0,
        origem: origem || '',
      });
    }
  }

  const resumoEquipeEmpresa = []; // {mes, coordenador, empresa, custoTotal, vendas, upgrade, receitaVendas, receitaUpgrade, receitaTotal}
  if (idxResumo >= 0) {
    for (let i = idxResumo + 2; i < linhas.length; i++) {
      const r = linhas[i];
      const mes = r[0];
      if (!mes) break;
      const [ , coordenador, empresa, custoTotal, vendas, upgrade, receitaVendas, receitaUpgrade, receitaTotal ] = r;
      resumoEquipeEmpresa.push({
        mes: String(mes),
        coordenador: coordenador || '',
        empresa: empresa || '',
        custoTotal: typeof custoTotal === 'number' ? custoTotal : null, // "sem custo atribuído" vira null
        vendas: Number(vendas) || 0,
        upgrade: Number(upgrade) || 0,
        receitaVendas: Number(receitaVendas) || 0,
        receitaUpgrade: Number(receitaUpgrade) || 0,
        receitaTotal: Number(receitaTotal) || 0,
      });
    }
  }

  // Agrupa composição por coordenador (uma pessoa pode atender mais de uma empresa).
  // Nomes reais da equipe vêm de detalhes_colaborador.equipe_pap_nomes (fonte:
  // "Equipe de vendas pap.xlsx", uma aba por coordenador, nome+chip). Cobre
  // ELTHON MENEZES/TARCIZIO MEIRELES/TIAGO/GABRIEL LIMA/LUCAS BONIFÁCIO/
  // MICHELANGELO — sem lista de nomes ainda para VITOR LINS (Débora confirmou
  // usar as abas por coordenador; a contagem não bate 100% com "Total Ativos"
  // porque a fonte de nomes é outra planilha, não a mesma da composição).
  const nomesPorCoordenador = (detalhesColaborador && detalhesColaborador.equipe_pap_nomes) || {};
  const equipesPorCoordenador = {};
  composicao.forEach((c) => {
    if (!equipesPorCoordenador[c.coordenador]) {
      equipesPorCoordenador[c.coordenador] = {
        coordenador: c.coordenador,
        empresas: [],
        totalAtivos: 0,
        nomes: nomesPorCoordenador[c.coordenador] || null,
      };
    }
    equipesPorCoordenador[c.coordenador].empresas.push(c);
    equipesPorCoordenador[c.coordenador].totalAtivos += c.totalAtivos;
  });

  return {
    equipes: Object.values(equipesPorCoordenador),
    custosDiretos,
    subtotalCustos,
    resumoEquipeEmpresa,
  };
}

module.exports = { extrairEstado, slugify, SECTOR_ICONS };
