// Servidor da Plataforma de Rateio de Custos — Dtel Telecom.
//
// Dois modos, escolhidos automaticamente conforme as variáveis de ambiente:
//
// 1) LOCAL/INTRANET (padrão, sem nenhuma variável de ambiente): lê a
//    Base_Rateio_Custos_DTEL.xlsx direto da pasta "dados-mensais" deste
//    computador. Fluxo de uso: mantenha este processo rodando
//    (2_Ligar_Plataforma.bat) e, todo mês, apenas sobrescreva o arquivo
//    dentro de "dados-mensais" — o site atualiza sozinho (cache de 60s).
//
// 2) ONLINE/DINÂMICO (quando ONEDRIVE_SHARE_URL está definida, ex: publicado
//    no Railway): baixa a planilha de um link de compartilhamento do OneDrive
//    ("qualquer pessoa com o link pode ver") a cada poucos minutos, do mesmo
//    jeito já usado no projeto de Dashboards de Vendas Externas. Assim, o
//    site sempre no ar (não depende do computador da Débora estar ligado) e
//    atualiza sozinho quando a planilha do OneDrive muda — sem precisar
//    reenviar arquivo nem clicar em nada.
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { extrairEstado, slugify, SECTOR_ICONS } = require('./extrair_dados');
const { baixarPlanilhaOneDrive } = require('./onedrive');

const app = express();
app.use(cors());

const PASTA_DADOS = path.join(__dirname, 'dados-mensais');
const ONEDRIVE_SHARE_URL = process.env.ONEDRIVE_SHARE_URL || null;
const CACHE_MS = parseInt(process.env.CACHE_MS || '', 10) || (ONEDRIVE_SHARE_URL ? 3 * 60 * 1000 : 60 * 1000);

// ── Senha simples de acesso (opcional) ──────────────────────────────────────
// Se SITE_PASSWORD estiver definida (ex: no Railway), pede usuário/senha via
// autenticação básica do navegador antes de mostrar qualquer página ou dado.
const SITE_PASSWORD = process.env.SITE_PASSWORD || null;
if (SITE_PASSWORD) {
  app.use((req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [, senha] = Buffer.from(encoded, 'base64').toString('utf-8').split(':');
      if (senha === SITE_PASSWORD) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Plataforma de Rateio de Custos - Dtel Telecom"');
    res.status(401).send('Acesso restrito. Peça a senha para a Débora.');
  });
}

let _cache = { estado: null, ts: 0, erro: null };
let _tmpDirAtual = null;

async function getEstado() {
  const agora = Date.now();
  if (_cache.estado && agora - _cache.ts < CACHE_MS) {
    return _cache;
  }
  try {
    let pastaParaLer = PASTA_DADOS;
    if (ONEDRIVE_SHARE_URL) {
      pastaParaLer = await baixarPlanilhaOneDrive(ONEDRIVE_SHARE_URL);
    }
    const estado = extrairEstado(pastaParaLer);
    _cache = { estado, ts: agora, erro: null };
    // limpa a pasta temporária anterior (se veio do OneDrive)
    if (ONEDRIVE_SHARE_URL && _tmpDirAtual && _tmpDirAtual !== pastaParaLer) {
      fs.rm(_tmpDirAtual, { recursive: true, force: true }, () => {});
    }
    if (ONEDRIVE_SHARE_URL) _tmpDirAtual = pastaParaLer;
  } catch (e) {
    _cache = { estado: _cache.estado, ts: agora, erro: e.message };
    if (!_cache.estado) throw e;
  }
  return _cache;
}

// Lista de setores disponíveis (só nome/ícone/slug — nenhum valor de custo).
app.get('/api/setores', async (req, res) => {
  try {
    const { estado, erro } = await getEstado();
    const lista = Object.entries(estado.STATE_REAL).map(([slug, s]) => ({
      slug,
      nome: s.nome,
      icone: SECTOR_ICONS[slug] || '•',
    }));
    lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    res.json({ setores: lista, arquivoUsado: estado.arquivoUsado, avisoCache: erro || null });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Dados de UM setor — isolamento real: a resposta NUNCA inclui outro setor.
app.get('/api/custos/:slug', async (req, res) => {
  try {
    const { estado, erro } = await getEstado();
    const slug = slugify(req.params.slug);
    const setor = estado.STATE_REAL[slug];
    if (!setor) {
      return res.status(404).json({ erro: `Setor '${req.params.slug}' não encontrado.` });
    }
    res.json({
      icone: SECTOR_ICONS[slug] || '•',
      nome: setor.nome,
      criterioRateio: setor.criterioRateio,
      justificativa: setor.justificativa,
      historico: setor.historico,
      porMes: setor.porMes,
      mesesDisponiveis: estado.mesesDisponiveis,
      avisoCache: erro || null,
    });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Resumo de todos os setores num único lugar — o mesmo conteúdo da aba
// SETORES da planilha (Setor, Critério de Rateio, Custo Total do Mês,
// Custo Unitário), sem entrar em detalhamento por empresa.
app.get('/api/resumo-setores', async (req, res) => {
  try {
    const { estado, erro } = await getEstado();
    const lista = Object.entries(estado.STATE_REAL).map(([slug, s]) => ({
      slug,
      nome: s.nome,
      icone: SECTOR_ICONS[slug] || '•',
      criterioRateio: s.criterioRateio,
      justificativa: s.justificativa,
      historico: s.historico,
    }));
    lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    res.json({
      setores: lista,
      mesesDisponiveis: estado.mesesDisponiveis,
      arquivoUsado: estado.arquivoUsado,
      avisoCache: erro || null,
    });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Aba "COMERCIAL VAREJO" — estrutura própria (por Coordenador/Equipe de
// vendas PAP, não por Setor): composição das equipes, custos diretos
// detalhados por mês e o resumo de custo x vendas x receita por equipe+empresa.
app.get('/api/comercial-varejo', async (req, res) => {
  try {
    const { estado, erro } = await getEstado();
    if (!estado.comercialVarejo) {
      return res.status(404).json({ erro: "Aba 'COMERCIAL VAREJO' não encontrada na planilha." });
    }
    res.json({
      ...estado.comercialVarejo,
      mesesDisponiveis: estado.mesesDisponiveis,
      arquivoUsado: estado.arquivoUsado,
      avisoCache: erro || null,
    });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/setor/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'setor.html'));
});

app.get('/resumo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resumo.html'));
});

app.get('/comercial-varejo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'comercial-varejo.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, '0.0.0.0', () => {
  console.log('===================================================');
  console.log('  PLATAFORMA DE RATEIO DE CUSTOS — DTEL TELECOM');
  console.log('  Servidor ativo em http://localhost:' + PORTA);
  console.log('  Na rede local: http://<IP-deste-computador>:' + PORTA);
  console.log('===================================================');
  getEstado()
    .then(() => console.log('Planilha carregada com sucesso ao iniciar.'))
    .catch((e) => console.log('AVISO: não consegui ler a planilha ainda —', e.message));
});
