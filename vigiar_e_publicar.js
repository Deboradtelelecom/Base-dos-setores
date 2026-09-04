// Vigia automático da Plataforma de Rateio de Custos — Dtel Telecom.
//
// Fica de olho nos arquivos de dados (planilha + detalhes por colaborador +
// código do parser) e nas páginas do site (pasta public/) e, sempre que
// detecta uma alteração salva, espera um tempo curto (pra dar tempo do
// Excel terminar de salvar todos os arquivos temporários dele) e então faz
// automaticamente:
//   git add  -> git commit -> git push origin master
// Isso substitui o clique manual no "ATUALIZAR E PUBLICAR.bat": a partir do
// momento em que este vigia está rodando, basta salvar a planilha no Excel
// (ou qualquer página em public/) que, em ~20 segundos, a atualização já é
// enviada pro GitHub — e o Render publica sozinho no site (~2 minutos
// depois disso).
//
// Este script NÃO precisa ficar sendo reiniciado: ele continua rodando e
// publicando quantas vezes forem necessárias, até a janela ser fechada.
//
// NOTA (27/08/2026): antes desta versão, a pasta public/ (as páginas .html
// do site) não estava na lista de arquivos vigiados — só entrava no
// "git add" quando outro arquivo vigiado (ex.: server.js) disparava uma
// publicação. Isso fez com que atualizações de interface (gráficos, telas
// de setor etc.) ficassem paradas no computador sem ir pro ar, às vezes por
// horas, até que por coincidência algum outro arquivo mudasse. Corrigido
// vigiando também a pasta public/ inteira (qualquer arquivo dentro dela).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PASTA = __dirname;
const PASTA_PUBLIC = path.join(PASTA, 'public');

// Arquivos individuais que, ao mudar, disparam uma publicação automática.
const ARQUIVOS_VIGIADOS = [
  path.join(PASTA, 'dados-mensais', 'Base_Rateio_Custos_DTEL.xlsx'),
  path.join(PASTA, 'detalhes_colaborador.json'),
  path.join(PASTA, 'extrair_dados.js'),
  path.join(PASTA, 'server.js'),
  path.join(PASTA, 'Base_de_Conhecimento_Setores_DTEL.xlsx'),
];

// Caminhos passados pro "git add" (cobre a pasta inteira de dados-mensais,
// não só o xlsx, pra não deixar nada de fora por engano).
const CAMINHOS_GIT_ADD = [
  'dados-mensais',
  'detalhes_colaborador.json',
  'extrair_dados.js',
  'server.js',
  'public',
  'Base_de_Conhecimento_Setores_DTEL.xlsx',
];

const DEBOUNCE_MS = 20 * 1000; // espera 20s de silêncio antes de publicar
const LOG_FILE = path.join(PASTA, 'vigia_log.txt');

let timer = null;

function log(msg) {
  const linha = `[${new Date().toLocaleString('pt-BR')}] ${msg}`;
  console.log(linha);
  try {
    fs.appendFileSync(LOG_FILE, linha + '\n');
  } catch (e) {
    // se não conseguir gravar o log, segue sem travar o vigia
  }
}

function publicar() {
  try {
    execSync(`git add ${CAMINHOS_GIT_ADD.map((p) => `"${p}"`).join(' ')}`, { cwd: PASTA });

    const status = execSync('git status --porcelain', { cwd: PASTA }).toString().trim();
    if (!status) {
      log('Alteração detectada, mas nada novo para publicar (git já estava atualizado).');
      return;
    }

    const dataHora = new Date().toLocaleString('pt-BR');
    execSync(`git commit -m "Publicação automática — ${dataHora}"`, { cwd: PASTA });
    execSync('git push origin master', { cwd: PASTA });
    log('Publicado com sucesso! O site atualiza em ~2 minutos: https://base-dos-setores.onrender.com');
  } catch (e) {
    log('ERRO ao publicar automaticamente: ' + (e.stderr ? e.stderr.toString() : e.message));
    log('Se for erro de lock (index.lock) ou de rede, tente rodar o "ATUALIZAR E PUBLICAR.bat" manualmente uma vez.');
  }
}

function agendarPublicacao(origem) {
  log(`Alteração detectada em: ${origem} — publicando em ${DEBOUNCE_MS / 1000}s se não houver mais mudanças...`);
  if (timer) clearTimeout(timer);
  timer = setTimeout(publicar, DEBOUNCE_MS);
}

log(
  'Vigia iniciado. Observando: ' +
    ARQUIVOS_VIGIADOS.map((f) => path.basename(f)).join(', ') +
    ', e toda a pasta public/ (páginas do site)'
);

ARQUIVOS_VIGIADOS.forEach((arquivo) => {
  if (!fs.existsSync(arquivo)) {
    log('AVISO: arquivo não encontrado (ainda), ignorando por enquanto: ' + arquivo);
    return;
  }
  try {
    fs.watch(arquivo, { persistent: true }, () => agendarPublicacao(path.basename(arquivo)));
  } catch (e) {
    log('Não foi possível vigiar ' + arquivo + ': ' + e.message);
  }
});

// Vigia a pasta public/ inteira (qualquer .html/.js/.css dentro dela) —
// pega tanto arquivo editado quanto arquivo novo criado ali dentro.
if (fs.existsSync(PASTA_PUBLIC)) {
  try {
    fs.watch(PASTA_PUBLIC, { persistent: true }, (eventType, filename) => {
      agendarPublicacao('public/' + (filename || '(arquivo)'));
    });
  } catch (e) {
    log('Não foi possível vigiar a pasta public/: ' + e.message);
  }
} else {
  log('AVISO: pasta public/ não encontrada, ignorando por enquanto.');
}

// Vigia extra por polling (rede/drives às vezes perdem eventos do fs.watch) —
// confere a cada 60s se algum arquivo mudou de tamanho/data desde a última
// checagem, como uma rede de segurança. Inclui também os arquivos dentro de
// public/, não só os 5 arquivos individuais de dados/código.
let ultimoEstado = {};

function listarArquivosPublic() {
  try {
    return fs
      .readdirSync(PASTA_PUBLIC)
      .filter((f) => fs.statSync(path.join(PASTA_PUBLIC, f)).isFile())
      .map((f) => path.join(PASTA_PUBLIC, f));
  } catch (e) {
    return [];
  }
}

function arquivosVigiadosPorPolling() {
  return ARQUIVOS_VIGIADOS.concat(listarArquivosPublic());
}

arquivosVigiadosPorPolling().forEach((arquivo) => {
  try {
    const st = fs.statSync(arquivo);
    ultimoEstado[arquivo] = st.mtimeMs + ':' + st.size;
  } catch (e) {
    ultimoEstado[arquivo] = null;
  }
});

setInterval(() => {
  arquivosVigiadosPorPolling().forEach((arquivo) => {
    try {
      const st = fs.statSync(arquivo);
      const chave = st.mtimeMs + ':' + st.size;
      if (ultimoEstado[arquivo] && chave !== ultimoEstado[arquivo]) {
        ultimoEstado[arquivo] = chave;
        agendarPublicacao(path.basename(arquivo) + ' (checagem periódica)');
      } else {
        ultimoEstado[arquivo] = chave;
      }
    } catch (e) {
      // arquivo pode ter sido apagado temporariamente durante o salvamento do Excel
    }
  });
}, 60 * 1000);

log('Pronto — pode deixar essa janela aberta e trabalhar na planilha normalmente.');
