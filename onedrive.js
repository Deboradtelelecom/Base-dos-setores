// Baixa a planilha Base_Rateio_Custos_DTEL.xlsx de um link de compartilhamento
// do OneDrive ("qualquer pessoa com o link pode ver"), do mesmo jeito que já é
// feito no projeto de Dashboards de Vendas Externas (app_railway.py) — converte
// o link de compartilhamento num link de download direto usando a API pública
// de "shares" da Microsoft, sem precisar de login/token.
const fs = require('fs');
const os = require('os');
const path = require('path');

function shareUrlToDirectDownload(shareUrl) {
  const raw = Buffer.from(shareUrl, 'utf-8');
  const b64 = raw.toString('base64url').replace(/=+$/, '');
  return `https://api.onedrive.com/v1.0/shares/u!${b64}/root/content`;
}

async function tentarBaixar(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    redirect: 'follow',
  });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ao baixar de ${url.slice(0, 60)}...`);
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  return buf;
}

// Baixa a planilha do OneDrive para um arquivo temporário e devolve o caminho
// local da PASTA que o contém (para reaproveitar extrairEstado(pastaDados),
// que já sabe achar o arquivo Base_Rateio_Custos_DTEL*.xlsx mais recente
// dentro de uma pasta).
async function baixarPlanilhaOneDrive(shareUrl) {
  const candidatos = [
    shareUrlToDirectDownload(shareUrl),
    shareUrl + (shareUrl.includes('?') ? '&' : '?') + 'download=1',
  ];
  const erros = [];
  let conteudo = null;
  for (const url of candidatos) {
    try {
      const buf = await tentarBaixar(url);
      // validação básica: um .xlsx é um ZIP, começa com "PK"
      if (buf.length > 2 && buf[0] === 0x50 && buf[1] === 0x4b) {
        conteudo = buf;
        break;
      }
    } catch (e) {
      erros.push(e.message);
    }
  }
  if (!conteudo) {
    throw new Error(
      'Não foi possível baixar a planilha do OneDrive. Detalhes: ' + erros.join(' | ')
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rateio-dtel-'));
  const tmpPath = path.join(tmpDir, 'Base_Rateio_Custos_DTEL.xlsx');
  fs.writeFileSync(tmpPath, conteudo);
  return tmpDir;
}

module.exports = { baixarPlanilhaOneDrive, shareUrlToDirectDownload };
