# Plataformas de rateio de custos — Dtel Telecom

## Contexto de negócio (importante — reforçado pela Débora)
Estes custos de rateio existem para cobrar de forma justa as **empresas licenciadas Dtel**, que usam a estrutura administrativa da própria Dtel. A Dtel mantém a base administrativa (os 25 setores de apoio: Financeiro, RH, DP, NOC, atendimento etc.) e presta esse suporte também para as licenciadas — por isso o custo de cada setor é rateado entre a Dtel (uso próprio) e as licenciadas, chegando ao valor final de cobrança de cada uma. Esse valor final está na aba RESUMO REEMBOLSO da planilha (e agora também na tela "Reembolso por Empresa" da plataforma).

## ONDE FICAM OS ARQUIVOS DE VERDADE (muito importante — descoberto em 18/08/2026)
A pasta de trabalho real da Débora para este projeto é **`C:\Users\user\OneDrive\Base de rateio`** — NÃO a pasta Downloads. É lá que ficam a `Base_Rateio_Custos_DTEL.xlsx` mais atual, os backups automáticos que já fizemos, a `Base_Despesa_Trabalhista_MMAAAA.xlsx` (custo trabalhista por colaborador, usada para o recurso de clique-para-detalhar), os arquivos auxiliares por categoria de custo (fardamento, combustível, seg. do trabalho, materiais, rescisões etc.) e até os `.skill` do projeto. A pasta Downloads dela é de uso geral (milhares de arquivos de todo tipo) e raramente tem a versão mais atual da base de rateio.
- Essa pasta só fica acessível se a Débora conectar via `device_request_folder_access` ou o dela mesma conectar do lado do app — quando pedir arquivo de rateio e não achar em Downloads, pergunte se está no OneDrive "Base de rateio" antes de vasculhar Downloads.
- Arquivos vistos lá em 18/08/2026: `Base_Rateio_Custos_DTEL.xlsx` (atual), `Base_Rateio_Custos_DTEL_backup_*.xlsx` (backups antes de cada mudança grande — pré-fixo/variável, pré-SST-fixo, pré-ajuste-categoria), `Base_Despesa_Trabalhista_072026.xlsx` (custo trabalhista por colaborador, Julho/2026, 1091 colaboradores em 14 empresas do grupo), `Demonstrativo_Rateio_DTEL_v2.html` (parece ser OUTRA plataforma/demonstrativo em paralelo a esta — não investigado ainda, não confundir com `plataforma-rateio-custos-dtel`), `Documentacao_Projeto_Rateio_DTEL.docx`, planilhas auxiliares por categoria (combustível, seg. do trabalho, materiais, rescisões, comercial, energia do prédio), e os arquivos `.skill` do projeto.

## A plataforma agora é um ARTEFATO PERSISTENTE (importante!)
A pedido da Débora — ela precisa enviar a plataforma para os diretores sem ter que reenviar um arquivo novo a cada ajuste — a plataforma foi migrada de "arquivo solto enviado por chat" para um **artefato persistente no Cowork** (`mcp__remote-devices__create_artifact` / `update_artifact`), id **`plataforma-rateio-custos-dtel`**.
- A Débora compartilha o link do artefato UMA VEZ com os diretores (pela opção de compartilhar do painel de artefatos do app dela).
- Daí em diante, toda atualização de dados deve ser feita com `update_artifact` no MESMO id, nunca criando um artefato novo — assim o link que os diretores já têm continua válido e passa a refletir os dados novos automaticamente.
- Ainda assim, sempre reenviar o arquivo por `SendUserFile` também (gera o `file_uuid` que o `update_artifact` exige, e serve de cópia de backup/baixável para a própria Débora).
- **Antes desta mudança** existiam 3 outros artefatos antigos/de exemplo no painel dela (`simulador-cc-financeiro-dtel`, `rateio-cc-financeiro-dtel`, e um `rateio-custos-dtel` de outro contexto/Base Geral 2026 — não confundir) — esses continuam existindo separadamente, não foram tocados.
- **Link tipo `claude://cowork/shared-artifact?uuid=...`**: esse é um link de protocolo customizado do app Claude — só abre se o WhatsApp/e-mail/etc. reconhecer o esquema `claude://`, o que normalmente não acontece quando colado fora do app. Por isso ele chega "sem clicar" para quem recebe. Alternativa: compartilhar o artefato pela opção nativa de compartilhamento do painel do app (gera um link https normal), ou enviar o arquivo HTML bruto (via `SendUserFile`/salvo na pasta Downloads) como anexo de WhatsApp — funciona em qualquer navegador, sem precisar do app Claude instalado.

## Como atualizar a plataforma quando a planilha mudar (processo)
A plataforma não lê o Excel em tempo real — os dados ficam "gravados" dentro do artefato no momento em que é gerado. Fluxo:
1. A Débora envia o arquivo Excel atualizado (chat, ou peça pra puxar da pasta OneDrive "Base de rateio" — ver seção acima).
2. Pede para atualizar a plataforma.
3. O Claude relê as abas, **compara explicitamente contra a versão anterior já publicada** (não só valida contra os totais oficiais da própria planilha) — isso é o que permite avisar a Débora quando algo mudou de um jeito inesperado (ver casos reais abaixo) antes de publicar.
4. Só depois de validar (soma dos itens = total oficial, 0,00 de diferença) e, se houver dúvida sobre uma mudança grande/estranha, CONFIRMAR com a Débora, o Claude substitui o bloco de dados (isolado entre os comentários `<!-- ===DADOS_EMBED_START=== -->` e `<!-- ===DADOS_EMBED_END=== -->` dentro do HTML) e faz `update_artifact` no artefato existente.
5. **Se os arquivos de Acesso Individual por Setor (ver seção abaixo) já tiverem sido gerados e entregues antes**, e os dados de algum setor mudarem, os arquivos individuais desse(s) setor(es) também precisam ser regenerados e reenviados — eles são uma cópia estática dos dados no momento da geração, não se atualizam sozinhas.
6. **Atenção — arquivo Excel sem fórmulas recalculadas**: se a Débora reenviar um Excel que tem as fórmulas mas os valores aparecem "vazios"/None ao ler com openpyxl (`data_only=True`), é sinal de que o Excel não recalculou antes de salvar (comum quando o arquivo foi salvo por outro programa, ou está em modo de cálculo manual). Solução: rodar `libreoffice --headless --calc --convert-to xlsx:"Calc MS Excel 2007 XML" --outdir <pasta> <arquivo>` para forçar o recálculo antes de comparar/ler os dados — NÃO pedir à Débora pra reenviar de novo, o LibreOffice resolve isso no ambiente do Claude.
Não existe hoje conexão automática planilha → plataforma (exigiria hospedagem com acesso à planilha, fora do escopo atual de arquivo local/demonstrativo).

## Caso real: atualização de Julho/2026 do Comercial Varejo (17/08/2026)
A Débora enviou uma nova versão da planilha dizendo "atualizei algumas informações de julho". Comparando com a versão anterior, a única mudança real estava na aba COMERCIAL VAREJO:
- Ela **adicionou o detalhamento por coordenador de Julho para a equipe DTEL (uso próprio)** — 50 linhas reais (ELTHON MENEZES, TARCIZIO MEIRELES, MICHELANGELO, LUCAS BONIFÁCIO, GABRIEL LIMA), substituindo o lançamento agregado "(agregado)" que existia antes.
- Só que, junto disso, os lançamentos de Julho das empresas licenciadas (DX2, SOARES E SILVA, SOUZA E SILVA, VOICENET) que existiam antes (agregados, somando R$ 135.483,56) desapareceram do mês — o total de Julho caiu de R$ 395.303,56 para R$ 259.820,00.
- Perguntei à Débora se isso era intencional. Ela confirmou: **sim, essas empresas também vão ganhar detalhamento por coordenador** (as equipes/coordenadores atendem várias empresas ao mesmo tempo) — ainda não foi lançado, é um trabalho em andamento, não um erro.
- **Decisão de produto**: a plataforma foi atualizada com os novos números de Julho (R$ 259.820, só DTEL detalhado), mas ganhou um **aviso de "Dado parcial"** na tela Comercial Varejo, dinâmico: sempre que alguma empresa aparecer em outros meses do Comercial Varejo mas não no mês selecionado, a plataforma avisa que o detalhamento daquela empresa ainda não foi lançado para aquele mês e que o total mostrado está subestimado. Esse aviso é genérico (funciona para qualquer mês/empresa futura na mesma situação, não é hardcoded para Julho).
- O aviso antigo (Comercial Direto zerado no RESUMO REEMBOLSO para Julho) continua e agora aparece junto do aviso de dado parcial na mesma caixa, quando os dois se aplicam ao mesmo mês.

## Caso real: reclassificação de Categoria de Custo — Fixo/Variável (17-18/08/2026)
A Débora enviou uma nova versão da planilha, mas não conseguiu subir pelo fluxo normal ("não consigo fazer upload") — pedi acesso à pasta Downloads dela (já conectada) e não encontrei o arquivo lá com nenhuma variação do nome; ela então enviou o arquivo direto pelo chat.
- **Problema técnico**: o arquivo enviado tinha todas as fórmulas intactas, mas os valores calculados vinham vazios (`None`) ao ler com openpyxl `data_only=True` — sinal de que o Excel não recalculou antes de salvar. Resolvido convertendo o arquivo com `libreoffice --headless --calc --convert-to xlsx ...`, que recalcula todas as fórmulas de verdade (validado: os valores recalculados bateram exatamente com a versão anterior já publicada, nas linhas que não mudaram).
- **O que realmente mudou**: comparando célula a célula com a versão anterior, nenhum valor monetário mudou (quantidade, valor unitário, total, setor, mês — tudo idêntico). A única mudança foi a coluna "Categoria" da aba CUSTOS MENSAIS: de 1.198 itens, 1.194 tiveram a categoria alterada. Antes eram 13 categorias detalhadas (Pessoal, TI, Frota, Benefícios, Estrutura/Infra, Fardamento, Segurança do Trabalho, Marketing, Operação, Investimento, Frota/Combustível, Frente-Orbix, Frente-Televendas); agora só 2: "Custo Fixo" e "Custo Variável". Não é uma regra simples de categoria-antiga → categoria-nova (ex.: "Pessoal" virou às vezes Fixo, às vezes Variável, item a item) — por isso a comparação foi feita linha a linha, não por categoria.
- Confirmei com a Débora que a reclassificação foi intencional antes de aplicar (ela confirmou: sim). Como isso afeta diretamente todo gráfico "Composição/Distribuição por Categoria" da plataforma (Panorama Geral, Detalhe por Setor, e os 25 arquivos de Acesso Individual por Setor), apliquei a mudança em TODOS os lugares onde a categoria aparece:
  - `STATE_REAL` (itens de cada setor + agregados `categorias` por mês, usados no Detalhe por Setor).
  - `CATEGORIAS_EMPRESA_POR_MES` (agregado somando os 25 setores, usado no gráfico do Panorama Geral) — essa é uma estrutura pré-computada SEPARADA de `STATE_REAL`, fácil de esquecer de atualizar; documentando aqui para não esquecer da próxima vez.
  - Os 25 arquivos de Acesso Individual por Setor foram regenerados a partir do `STATE_REAL` atualizado.
  - A aba COMERCIAL VAREJO **não mudou** nessa atualização (0 diffs) — por isso o bloco `VAREJO` da plataforma manteve as categorias antigas (Pessoal, Fardamento etc.), que é o correto porque essa aba não foi tocada pela Débora.
- Validado depois de aplicar: soma dos itens por setor/mês continua batendo exatamente com o total oficial da planilha (SETORES) em todos os 25 setores — só a categoria mudou, nenhum valor.
- **Ajuste fino em seguida (18/08/2026, mesmo dia)**: a Débora reenviou a planilha de novo, dessa vez com 49 itens de "Despesas com SST" (um por setor, nos 3 meses) corrigidos de "Custo Variável" para "Custo Fixo". Mudança pequena, consistente e sem ambiguidade (o mesmo item, na mesma direção, em todos os setores) — apliquei direto, sem precisar confirmar de novo, e revalidei os totais.

## Caso real: agrupamento único de categoria na tabela de detalhamento (18/08/2026)
A tabela "Detalhamento dos Custos do Setor" (tanto na plataforma principal quanto nos 25 arquivos de Acesso Individual) originalmente fechava um "Subtotal" toda vez que a categoria do item mudava EM RELAÇÃO AO ITEM ANTERIOR, na ordem em que os itens aparecem na planilha. Como a planilha intercala itens de categorias diferentes, isso gerava vários blocos "Subtotal — Custo Fixo" repetidos ao longo da tabela, em vez de um total único por categoria — a Débora pediu para corrigir isso.
- **Correção aplicada**: a lógica de renderização (tanto em `plataforma_todos_setores.html` quanto no template gerado por `gerar_acesso_setor.py`) passou a agrupar TODOS os itens de cada categoria num único bloco contíguo, com um único subtotal por categoria — não importa a ordem original na planilha.
- Validado com Playwright: a tabela agora mostra exatamente 2 linhas de subtotal por setor/mês ("Subtotal — Custo Fixo" e "Subtotal — Custo Variável"), cada uma somando todos os itens daquela categoria, e o valor bate com o gráfico de composição por categoria da mesma tela.
- Isso é só uma mudança de **exibição** — a exportação para Excel (botão "Exportar Excel") já listava os itens em ordem simples sem esse problema de subtotal duplicado, então não precisou de ajuste.

## Caso real: clique-para-detalhar por colaborador na Folha de Pagamento (18/08/2026)
A Débora pediu um recurso de clicar num item de custo e abrir o detalhamento por colaborador (a partir de um exemplo de referência que ela mandou). Não dava para inventar nomes de colaborador — então pedi a fonte real antes de implementar.
- **Fonte usada**: `Base_Despesa_Trabalhista_072026.xlsx`, na pasta OneDrive "Base de rateio" (ver seção acima) — planilha "Custo Trabalhista" com 1 linha por colaborador, colunas MATRÍCULA, COLABORADOR, EMPRESA, EQUIPE, SITUAÇÃO, INCLUI CT?, CARGO, CT TOTAL, encargos e CUSTO TOTAL. 1091 colaboradores em 14 empresas do grupo Dtel, competência Julho/2026.
- **Mapeamento Equipe → Setor**: a coluna "EQUIPE" da folha usa nomes de time que, na maioria dos casos, batem com o nome do setor da Base_Rateio_Custos_DTEL (ex.: "NOC", "FINANCEIRO", "RH"), com duas exceções de nome: "DEPARTAMENTO PESSOAL" = DP, e "SEG. TRABALHO" = Segurança do Trabalho. Times de campo (INSTALAÇÃO ‹coordenador›, VENDAS PAP ‹coordenador›, ITINERANTE, LANÇAMENTO, CONFIGURAÇÃO) pertencem ao Comercial Varejo, não aos 25 setores de apoio — não entram aqui. Vários outros nomes de equipe (COE, QUALIDADE, MARKETING, TIC, ESTRUTURA, FUSÃO, SERVIÇOS GERAIS, VIGILÂNCIA, JURÍDICO, SÓCIO, COZINHA, DEV, TRADE CONNECT, AFASTADOS) não correspondem a nenhum dos 25 setores e ficaram de fora.
- **Escopo por empresa**: alguns colaboradores que trabalham para um setor de apoio da Dtel aparecem formalmente contratados por OUTRA empresa do grupo (ex.: uma pessoa da Contabilidade estava sob "GOONET TELECOMUNICACOES LTDA", não "DTEL TELECOM LTDA") — por isso o critério final foi casar por EQUIPE em todas as 14 empresas, EXCETO em Segurança do Trabalho e Estoque, onde incluir todas as empresas trazia 1 pessoa a mais que pertence à operação interna de uma licenciada (não deveria contar no rateio da Dtel) — nesses dois setores o filtro ficou restrito a "DTEL TELECOM LTDA".
- **Validação obrigatória feita antes de mostrar qualquer nome de colaborador**: somei o Custo Total de cada colaborador por setor e comparei com o valor já lançado no item "Folha de pagamento (salários)" da Base_Rateio_Custos_DTEL para Julho/2026. 12 de 14 setores bateram exato (diferença de no máximo R$ 0,01 de arredondamento): NOC, RH, DP, Financeiro, Segurança do Trabalho, CAC, Contabilidade, Compras, Logística, Manutenção Predial, Estoque, Obras.
- **2 setores ficaram com diferença pequena e conhecida, mostrados mesmo assim (a Débora decidiu não bloquear por isso)**:
  - **Gestão de Atendimento**: falta 1 colaborador (HUGO ESTEVES MARTINS DE SOUZA, R$ 2.843,92) que está com a equipe grafada como "atendimento" (minúsculo) em vez de "GESTÃO DE ATENDIMENTO" na folha — a Débora, ao ser perguntada, decidiu deixá-lo de fora por enquanto. Resultado: soma dos colaboradores mostrados = R$ 25.274,45 vs. R$ 28.118,37 lançado no rateio.
  - **Engenharia**: sobra R$ 1.324,94 (CELIO MARCIO DA SILVA, porteiro) porque a Débora reclassificou esse colaborador de "GESTÃO DE ATENDIMENTO" para "ENGENHARIA" na folha DURANTE esta mesma sessão (ela mencionou "separei gestão de atendimento e cac" no meio do processo) — a planilha de rateio ainda não foi atualizada com esse novo total de Engenharia. Isso resolveu sozinho o CAC (que passou a bater exato, R$ 7.364,25) e melhorou Gestão de Atendimento, mas deixou uma sobra pequena em Engenharia.
- **Implementação**: linhas da tabela "Detalhamento dos Custos do Setor" que têm colaboradores conhecidos (`it.detalhes`) ficam com um indicador ▼ e cursor de clique; ao clicar, abre uma sub-linha com "Composição analítica do lançamento" listando nome (cargo) e valor de cada colaborador, ordenados do maior para o menor. Implementado tanto em `plataforma_todos_setores.html` quanto no template do `gerar_acesso_setor.py` (25 arquivos individuais), reaproveitando o CSS do tema escuro já existente (`--blue-accent`, `--slate-500` etc.).
- **Limitação inicial (posteriormente reduzida — ver seção "Central de Relacionamento" abaixo)**: só tínhamos esse detalhamento para **Julho/2026** (não achamos ainda o equivalente de Maio/Junho/2026 na pasta OneDrive — se existir, teria nome parecido a `Base_Despesa_Trabalhista_052026.xlsx` / `062026.xlsx`). Para os setores NRC, Cobrança, Retenção, Televendas, Suporte Orbix e Suporte da Central, o nome de equipe na folha era só "RELACIONAMENTO" (sem separar por sub-time) — resolvido em 19/08/2026, ver seção dedicada abaixo. Controladoria, Diretoria Operacional, Oficina, Comercial Corporativo e Administrativo continuam sem equipe correspondente identificada na folha.

## Decisões de produto
- A plataforma HTML é **só demonstrativa/leitura** — edição continua na planilha.
- Tem **seletor de Período de Competência** (dropdown, um por tela) válido em todas as telas, populado só com os meses realmente disponíveis (Mai/Jun/Jul 2026), sincronizado com o clique nas barras do gráfico de histórico.
- Tem uma tela dedicada de **Reembolso por Empresa**.
- O card de **Alerta de Desvio de Custo é clicável** e abre um modal com o detalhe de cada setor em desvio.
- Tem uma tela dedicada de **Comercial Varejo (custo direto)**.
- Avisos dinâmicos de qualidade/completude de dado (não hardcoded) aparecem em vermelho quando: (a) Comercial Varejo tem valor no mês mas RESUMO REEMBOLSO não reflete via "Comercial Direto"; (b) alguma empresa do Comercial Varejo está com detalhamento pendente no mês selecionado.
- Tela geral foi renomeada de "Visão Geral (Consolidado)" para **"Panorama Geral"**, e a tag "Somente leitura — demonstrativo" foi removida (pedido da Débora — visual mais apresentável para os diretores).
- Botão **"⬇ Exportar Excel"** disponível em todas as telas — gera um .xlsx com os dados da tela atualmente aberta (Panorama Geral, Reembolso, Comercial Varejo ou Detalhe por Setor), usando SheetJS embutido no arquivo (sem depender de internet).
- Categoria de custo em todo o sistema (exceto Comercial Varejo) segue hoje o padrão **Custo Fixo / Custo Variável** (mudou em 18/08/2026 — ver caso real acima).
- Tabela de detalhamento de custos por setor agrupa cada categoria (Fixo/Variável) num **bloco único com um só subtotal**, mesmo quando os itens aparecem intercalados na planilha original (corrigido em 18/08/2026 — ver caso real acima).
- Itens de custo com detalhamento por colaborador (Folha de pagamento, Exames médicos, Combustível de frota e EPIs, conforme os casos reais abaixo) ficam **clicáveis** e abrem a composição por pessoa.

## Visual: tema escuro "ERP" (reskin de 17/08/2026)
A pedido da Débora (a partir de um exemplo de referência que ela enviou, estilo "CostLedger ERP"), a plataforma inteira foi reestilizada para um tema escuro, mantendo 100% dos dados/telas/funcionalidades:
- Paleta escura controlada por variáveis CSS (`--bg-app`, `--bg-panel`, `--bg-sidebar`, `--border`, `--good/--warn/--crit`, fonte monoespaçada `--mono`) — trocar o visual de novo no futuro é questão de ajustar essas variáveis, não recriar a plataforma.
- **Menu lateral agrupado**: os 25 setores + as telas fixas (Panorama Geral, Reembolso, Comercial Varejo) estão organizados em grupos nomeados, cada setor com um ícone (emoji) e badges tipo "pill" mostrando %/status.
- **Busca de setor** na barra lateral, com filtro em tempo real.
- **Gráficos "Composição por Categoria"** (Panorama Geral, Detalhe por Setor, Comercial Varejo) agora são gráficos de barra horizontal reais via **Chart.js** (embutido no arquivo, sem CDN), no lugar das barras feitas com `<div>`.

## Acesso Individual por Setor — arquivos isolados (18/08/2026)
A Débora pediu segurança de verdade para restringir o que cada gestor de setor pode ver (ao invés de um controle "de mentirinha" baseado em URL/JS, que não protege nada porque o dado inteiro já chega no navegador dentro do HTML). Expliquei que, sem um servidor com login real, a única forma de isolamento genuíno é **nunca embutir o dado sensível no arquivo entregue** — e ela escolheu essa opção.

**O que foi gerado:** 25 arquivos HTML autocontidos, um por setor (`acesso_setor_<Nome>.html`), cada um contendo **exclusivamente** os dados daquele setor — nenhum outro setor aparece no HTML/JS entregue (nem no código-fonte, nem em variável escondida, nem em nada que dê para inspecionar). Cada arquivo tem: cabeçalho "Acesso Individual — Setor X", critério de rateio e justificativa do setor, seletor de Período de Competência, 3 KPIs (referência, custo executado, variação), barra/badge de consumo vs. referência, histórico mensal, gráfico de composição por categoria (Chart.js) e tabela detalhada de itens de custo agrupada por categoria com subtotal único, incluindo o clique-para-detalhar por colaborador onde disponível — visualmente no mesmo tema escuro da plataforma principal.

**Validação de segurança feita antes de entregar** (não foi só assumido — foi verificado programaticamente, e refeito a cada atualização de dados):
1. Cada arquivo tem exatamente UM bloco de dados (`const SETOR = {...}`) e ele corresponde ao setor do próprio nome do arquivo.
2. Confirmado que nenhum arquivo contém o bloco de itens/histórico/categoria de nenhum outro setor.
3. (Falsos positivos descartados) Uma busca simples por nomes de outros setores (ex.: "RH", "DP", "Segurança do Trabalho") aparece dentro de cada arquivo — mas são linhas de custo do PRÓPRIO setor, como "Despesas com RH" ou categoria "Segurança do Trabalho" (custos administrativos centralizados rateados para dentro daquele setor), não dados de outro setor. Confirmado item a item que não é vazamento.
4. Validado com Playwright (sem erros de console, tabela renderiza, seletor de mês funciona, clique-para-detalhar abre/fecha certo) em uma amostra de setores a cada atualização.

**Entrega:** os 25 arquivos são compactados em `acesso_por_setor_dtel.zip` e enviados por `SendUserFile`.

**Importante — como manter atualizado:** estes são arquivos ESTÁTICOS, gerados a partir de uma extração pontual dos dados no momento em que a plataforma principal foi atualizada pela última vez. Eles NÃO se atualizam sozinhos. Sempre que a planilha mudar (ou a lógica de exibição mudar) e a plataforma principal for atualizada, os arquivos individuais precisam ser regenerados e reenviados — não bastam ficar só com a plataforma consolidada atualizada. O script gerador (`gerar_acesso_setor.py`, roda no ambiente de trabalho do Claude) lê os dados já validados/embutidos na plataforma principal (`extracted_state_real.json`) e produz os 25 arquivos automaticamente; quando a LÓGICA de exibição muda (não só os dados), o template dentro do próprio `gerar_acesso_setor.py` também precisa ser editado.

## Plataforma multi-setor (artefato "plataforma-rateio-custos-dtel") — versão atual, 4 telas

**1. Panorama Geral:** KPIs, evolução da empresa, categorias (gráfico Chart.js, hoje Custo Fixo/Variável), lista de setores por desvio. Nota explicativa no topo menciona o propósito de cobrança das licenciadas, confirma que o **Comercial Corporativo já está incluído** entre os 25 setores de apoio (rateado por % de Clientes) e aponta para a tela "Comercial Varejo" para a equipe de vendas externas/PAP, cujo custo é direto (não rateado por %).

**2. Reembolso por Empresa:**
- Dados da aba PARÂMETROS (% Clientes, % Funcionários Dtel alocados por empresa) e RESUMO REEMBOLSO (Custo Rateado, Comercial Direto, Royalty, Total Geral a Cobrar) por mês.
- KPIs: Total Rateado + Comercial de todas as empresas, Total a Cobrar só das licenciadas (excluindo DTEL uso próprio) e qual empresa teve a maior cobrança no mês.
- Gráfico de barras "Total Geral a Cobrar por Empresa" e tabela detalhada, com a linha "DTEL (uso próprio)" destacada visualmente.
- Julho/2026 → Total Geral R$ 1.714.289 (confirmado igual em todas as atualizações — RESUMO REEMBOLSO em si não mudou), maior cobrança SOLON ARAUJO (R$ 118.123), licenciadas somam R$ 442.144 (25,8% do total).
- Exibe aviso de dado pendente quando o mês selecionado é Julho/2026 (Comercial Direto ainda zerado).

**3. Detalhe por Setor:** histórico, composição por categoria (gráfico Chart.js, hoje Custo Fixo/Variável), itens agrupados por categoria com um único subtotal por categoria, dependente do mês selecionado, e clique-para-detalhar por colaborador em Folha de pagamento/Exames médicos/Combustível/EPIs onde disponível. Cobre os 33 setores de apoio (incluindo Comercial Corporativo).

**4. Comercial Varejo — custo direto:**
- Fonte: aba COMERCIAL VAREJO da planilha — estrutura diferente dos outros setores: custo real e direto por vendedor/coordenador de equipe (folha, combustível, VT, RH/DP/SST, fardamento, linhas móveis), não rateio por %. Cada coordenador pode atender mais de uma empresa ao mesmo tempo. Mantém a categorização antiga (Pessoal, Fardamento etc.) porque essa aba não foi afetada pela reclassificação de 18/08.
- KPIs: Custo Total do Mês (alimenta a coluna "Custos Comerciais Diretos" do Reembolso), Equipes/Coordenadores ativos no mês, Total de Vendedores Ativos (PAP) — este último é fixo (118), vem da composição atual da equipe, não muda por mês.
- Evolução mensal, composição por categoria (gráfico Chart.js), custo por empresa e tabela de custo por coordenador/equipe × empresa.
- Julho/2026 (após atualização de 17/08): R$ 259.820, só detalhamento de DTEL (uso próprio) lançado; demais empresas pendentes (ver caso real acima).

**Modal de detalhe do desvio:** clicar no card "Alerta de Desvio de Custo" abre um modal listando todos os setores em desvio no mês selecionado, cada um com executado vs. referência, categoria que mais contribuiu (hoje Fixo/Variável) e os itens específicos com maior variação. Clique no nome do setor leva direto ao detalhe daquele setor.

## Achados de qualidade de dados (para a Débora revisar na planilha)
1. A coluna "Custos Comerciais Diretos" da aba RESUMO REEMBOLSO está zerada para Julho/2026, para todas as empresas — mesmo depois da atualização de 17/08. Isso porque o Comercial Varejo de Julho ainda não está completo (ver item 2) e a coluna do RESUMO REEMBOLSO não foi preenchida manualmente ainda. A plataforma sinaliza isso automaticamente.
2. Em progresso (não é erro): o detalhamento por coordenador de Julho no Comercial Varejo só cobre DTEL (uso próprio) até agora; as 6 empresas licenciadas (VOICENET, SOARES E SILVA, DX2, SOUZA E SILVA, SOLON ARAUJO, SOARES E LINS) ainda vão ser lançadas — a Débora confirmou que vai completar.
3. Diferença pequena e não totalmente explicada: SOARES E LINS em Maio/2026 (oficial R$ 3.682,16 vs. soma dos itens R$ 3.712,16, diff de R$ 30,00) — provavelmente um ajuste manual pontual na planilha, sem impacto relevante.
4. **18/08/2026**: o item "Folha de pagamento (salários)" de **Gestão de Atendimento** na Base_Rateio_Custos_DTEL (R$ 28.118,37, Julho/2026) está R$ 2.843,92 abaixo do que a folha de pagamento real mostra pra esse time (falta HUGO ESTEVES MARTINS DE SOUZA, cuja equipe está grafada "atendimento" minúsculo na folha) — a Débora decidiu não incluir esse colaborador por enquanto, mas o valor no rateio pode estar levemente subestimado.
5. **18/08/2026**: o item "Folha de pagamento (salários)" de **Engenharia** na Base_Rateio_Custos_DTEL (R$ 70.861,78, Julho/2026) ficou R$ 1.324,94 abaixo do valor real da folha, porque a Débora reclassificou CELIO MARCIO DA SILVA (porteiro) de "Gestão de Atendimento" para "Engenharia" na folha de pagamento durante este mesmo atendimento — a planilha de rateio ainda não foi atualizada com esse novo total.
6. **Novo (19/08/2026) — divergência grande em 4 dos 6 setores da Central de Relacionamento**: ver seção dedicada "Clique-para-detalhar da Central de Relacionamento" abaixo. Resumo: Cobrança e Suporte Orbix batem quase exato com o oficial (diferença de 1 centavo). Mas NRC, Retenção, Suporte da Central e principalmente Televendas têm diferenças relevantes entre a soma dos colaboradores cruzados via `Agentes Central.xlsx` e o total de Folha de pagamento já lançado na Base_Rateio_Custos_DTEL para esses setores — indicando que o total oficial desses 4 foi calculado por outra base/método, não só pelo cruzamento de nomes da planilha trabalhista. A Débora pediu para aplicar os valores cruzados mesmo assim e vai investigar essa divergência por conta própria.

## Ferramentas anteriores (dados de exemplo/conceituais — ainda editáveis, mantidas para referência)
1. `Modelo_Rateio_CC_Financeiro_Dtel.xlsx`, 2. Dashboard de rateio de saída (artefato "rateio-cc-financeiro-dtel"), 3. Simulador de custo interno (artefato "simulador-cc-financeiro-dtel"), 4. Documento de estruturação conceitual.

## Plataforma via servidor local/intranet — solução final para "link único, sem conta Claude, atualiza sozinho" (18/08/2026)

Depois de testar (e descartar) três caminhos — artefato Cowork (exige conta Claude), leitor.html + arquivo manual numa pasta (a Débora não gostou de ter que colocar arquivo manualmente) e hospedagem paga/limitada em nuvem (Railway não é sustentavelmente gratuito) — a Débora apontou um sistema que ela já tinha em andamento na pasta **`C:\sistemas-custos`**: um servidor Node.js local, rodando na intranet da Dtel, que resolve tudo ao mesmo tempo sem custo de nuvem.

**Como funciona:**
- `server.js` (Node + Express) fica rodando em segundo plano no computador dela (ou de um PC dedicado na rede), lendo a `Base_Rateio_Custos_DTEL.xlsx` de dentro da pasta `dados-mensais` a cada requisição (com cache de 60 segundos, para não reabrir o arquivo toda hora).
- Os gestores acessam pelo navegador, na rede da empresa, em `http://<IP-do-computador>:3000` (ex.: `http://10.16.0.205:3000`) — sem internet, sem conta Claude, sem instalar nada.
- Cada setor tem sua própria rota (`/setor/<slug>`, ex.: `/setor/financeiro`) que busca os dados só daquele setor via `/api/custos/<slug>` — isolamento real, a resposta da API nunca inclui outro setor.
- O link é enviado UMA VEZ a cada gestor (ex.: `http://10.16.0.205:3000/setor/financeiro`); o navegador dele rebusca os dados sozinho a cada 60 segundos, então quando a Débora atualiza a planilha em `dados-mensais`, o painel do gestor atualiza sozinho, sem precisar reabrir nada.
- **Fluxo mensal para a Débora**: só sobrescrever a `Base_Rateio_Custos_DTEL.xlsx` dentro de `dados-mensais` — nada de rodar `.bat`, nada de reenviar link, nada de arquivo manual por gestor.

**O que eu encontrei quebrado e corrigi (18/08/2026):**
- O `index.html` original estava corrompido (dois blocos de `<script>` duplicados colados, um com uma URL de fetch incompleta `fetch('http://10.16.0')`) — provavelmente uma edição anterior cortada no meio. Reescrevi limpo, agora dividido em duas páginas: `public/index.html` (menu com os setores) e `public/setor.html` (o painel de detalhamento de um setor).
- O `server.js` original usava um parser genérico "adivinha a coluna por sinônimo", pensado para qualquer planilha solta, sem entender a estrutura real da base (não tinha mês, nem categoria Fixo/Variável, nem histórico). Reescrevi com um parser (`extrair_dados.js`) que lê as abas reais `SETORES` e `CUSTOS MENSAIS` da `Base_Rateio_Custos_DTEL.xlsx`, replicando exatamente a mesma lógica já validada nas outras entregas deste projeto (agrupamento por categoria com subtotal único, histórico de 3 meses, e o detalhamento por colaborador).
- O `2_Ligar_Plataforma.bat` abria o `index.html` como arquivo local (`start index.html`), o que quebra o `fetch()` para a API (arquivo local não consegue chamar `localhost:3000`). Corrigido para abrir `http://localhost:3000` (servido pelo próprio Express), que é o que realmente funciona.
- Validado com Playwright depois do conserto: os setores aparecem no menu, o painel de um setor carrega os KPIs/histórico/gráfico/tabela corretamente, o clique-para-detalhar por colaborador abre/fecha, o isolamento por setor foi confirmado (a resposta de `/api/custos/financeiro` não contém nenhum dado de outro setor) — sem erros de console.
- O `index.html` antigo, solto na raiz de `C:\sistemas-custos` (fora da pasta `public/`), ficou sem uso — o servidor agora serve tudo de dentro de `public/`. Pode ser ignorado/apagado quando a Débora quiser arrumar a pasta.

**Limitação a ter em mente**: como é um servidor local (não é nuvem), o computador que roda `2_Ligar_Plataforma.bat` precisa ficar ligado e com o processo ativo para os gestores conseguirem acessar — se o computador desligar ou reiniciar, o link para de responder até alguém ligar de novo (dando novo duplo-clique no `.bat`). Isso é o preço de não depender de hospedagem paga: zero custo, mas depende de uma máquina sempre ligada na rede da empresa.

**Isolamento real**: como o servidor entrega só os dados do setor pedido na URL (nunca o pacote inteiro), o nível de proteção é o mesmo já usado nas outras entregas deste projeto — qualquer pessoa com o link exato de um setor consegue abri-lo (não há login), mas ninguém recebe, nem escondido no código, o dado de outro setor que não pediu.

## Próximos passos em aberto
- Quando a Débora completar o detalhamento de Julho das empresas licenciadas no Comercial Varejo, atualizar a plataforma de novo (o aviso de "dado parcial" deve sumir sozinho quando isso acontecer, pela lógica dinâmica já implementada) — e lembrar de regenerar os 25 arquivos de Acesso Individual por Setor também.
- Corrigir na planilha (aba RESUMO REEMBOLSO) a coluna "Comercial Direto" de Julho/2026, hoje zerada.
- Corrigir na Base_Rateio_Custos_DTEL os totais de "Folha de pagamento" de Gestão de Atendimento e Engenharia (ver achados de qualidade 4 e 5 acima), depois de a Débora confirmar o time final de cada um.
- Buscar (se existirem) os arquivos `Base_Despesa_Trabalhista_052026.xlsx` e `062026.xlsx` na pasta OneDrive "Base de rateio", para estender o clique-para-detalhar por colaborador também a Maio e Junho/2026 (hoje só tem Julho).
- Investigar o arquivo `Demonstrativo_Rateio_DTEL_v2.html` na pasta OneDrive — parece ser outro demonstrativo/plataforma em paralelo a este projeto, não confundir nem sobrescrever sem entender o que é.
- A Débora pode querer, no futuro, trazer também a segunda tabela da aba COMERCIAL VAREJO ("Custo, Vendas e Receita — por Equipe e Empresa", a partir da linha 310) como visão adicional de receita/custo por venda.
- Existe uma skill instalada (`rateio-custos-dtel`) com um modelo de planilha de 5 abas mais simples (13 setores, aba "RATEIO POR EMPRESA") que NÃO corresponde exatamente à estrutura real da Base_Rateio_Custos_DTEL.xlsx usada aqui (25 setores, sem aba "RATEIO POR EMPRESA" separada, com COMERCIAL VAREJO e COMERCIAL CORPORATIVO). Usar o script `verificar_duplicatas.py` dessa skill é seguro e útil (mas as "duplicatas exatas" que ele lista aqui são falsos positivos — são os mesmos itens repetidos em cada bloco de mês; NÃO rodar com `--remover-exatas` nesta planilha específica).
- Os arquivos de Acesso Individual por Setor ainda não foram distribuídos individualmente para cada gestor — hoje estão todos num único .zip entregue para a Débora; ela decide como/quando repassar o arquivo certo para cada setor.
- Se a Débora pedir para voltar à categorização detalhada antiga (Pessoal/TI/Frota/etc.) em algum momento, ou quiser as duas visões (detalhada + Fixo/Variável), isso exigiria voltar a pedir a coluna "Categoria" antiga na planilha (ela foi substituída, hoje não coexistem) ou pedir para a Débora adicionar uma coluna nova em vez de substituir a existente.
- Estender o clique-para-detalhar por colaborador aos setores que ainda não têm equipe correspondente identificada na folha: Controladoria, Diretoria Operacional, Oficina, Comercial Corporativo, Administrativo.
- Confirmar com a Débora se o computador que vai rodar `2_Ligar_Plataforma.bat` (servidor local em `C:\sistemas-custos`) vai ficar ligado continuamente (ex.: um PC dedicado, não o notebook pessoal dela) — se desligar, o link para de responder para os gestores até alguém ligar de novo.
- Avaliar com a Débora se vale configurar esse Node.js para iniciar sozinho quando o computador ligar (tarefa agendada do Windows / iniciar com o Windows), para não depender de alguém lembrar de dar duplo-clique no `.bat` depois de um desligamento ou reinício.
- Quando existir detalhamento por colaborador de outros meses (hoje só Julho/2026 para Folha de pagamento), ajustar `extrair_dados.js` para usar o mês certo em vez do Julho/2026 fixo no código.
- **Investigar a origem da divergência nos totais de Folha de pagamento de NRC, Retenção, Suporte da Central e Televendas** (ver seção "Clique-para-detalhar da Central de Relacionamento" abaixo) — a Débora vai analisar de onde veio o total oficial lançado hoje na Base_Rateio_Custos_DTEL para esses 4 setores, já que não bate com a soma dos colaboradores cruzados via `Agentes Central.xlsx`.

## Ajuste no sistema local: abrir os arquivos direto (duplo-clique) também funciona (18/08/2026)
A Débora testou o sistema local (`C:\sistemas-custos`) e, por hábito, tentou abrir `index.html` e `setor.html` clicando direto no arquivo pela pasta (em vez de sempre passar pelo `2_Ligar_Plataforma.bat`/`http://localhost:3000`) — isso dava "Failed to fetch" porque um arquivo aberto direto do disco (`file://`) não conseguia chamar a API do servidor com um endereço relativo.
- **Correção**: as duas páginas agora sempre chamam a API usando o endereço completo do servidor (`http://localhost:3000/api/...`), não mais um caminho relativo — então funcionam tanto quando abertas pela rota do servidor quanto abertas direto da pasta, desde que o servidor (`2_Ligar_Plataforma.bat`) esteja rodando.
- `setor.html` agora aceita o setor tanto pelo caminho da URL (`/setor/financeiro`, o jeito normal ao clicar no menu) quanto por um parâmetro `?setor=financeiro` (útil se alguém quiser criar um atalho direto pro arquivo). Sem nenhum dos dois, mostra uma mensagem amigável pedindo para abrir pelo menu, em vez de travar em "Carregando...".
- Revalidado com Playwright nos dois modos de abertura (servidor e arquivo direto, com e sem parâmetro de setor) — sem erros.

## Adição de 6 novos setores: Qualidade, Jurídico, Marketing, TIC, COE e Fique Móvel (19/08/2026)

A Débora pediu para adicionar 6 setores novos à `Base_Rateio_Custos_DTEL.xlsx` e criar os HTML correspondentes, dizendo que os dados de custo já existiam nas planilhas. Como o sistema local (`C:\sistemas-custos`) gera as páginas de setor **dinamicamente** a partir da própria planilha (rota `/setor/<slug>`, ver seção "Plataforma via servidor local/intranet" acima), não foi preciso criar HTML manual por setor — bastou adicionar as linhas certas na planilha e os 6 setores passaram a aparecer automaticamente no menu e em `/setor/<slug>` (slugs: `qualidade`, `juridico`, `marketing`, `tic`, `coe`, `fique_movel`), com a mesma UI/isolamento/recursos dos outros 25 setores. Se a Débora também quiser esses 6 nos arquivos estáticos de "Acesso Individual por Setor" (`gerar_acesso_setor.py`, hoje só com os 25 antigos), precisa pedir explicitamente — não foi feito ainda.

**Critério de rateio confirmado pela Débora**: todos os 6 (incluindo Jurídico) usam **Clientes** — só DP, RH e Segurança do Trabalho usam Funcionários. Isso corrige uma suposição inicial minha (tinha proposto Jurídico = Funcionários, por analogia com RH/DP); a Débora corrigiu explicitamente.

**Fique Móvel é uma equipe/departamento real** (não um item de custo de linha telefônica, como uma fonte ambígua sugeria) — a Débora confirmou os nomes Isla Rafaelle e Rafael da Silva Gabriel. Cruzando pela coluna EQUIPE = "FIQUE MÓVEL" na `Base_Despesa_Trabalhista_072026.xlsx`, apareceu uma terceira pessoa que a Débora não mencionou (MARIA CLARA DA COSTA ALVES, sem cargo listado) — incluída também, pelo mesmo critério de correspondência por EQUIPE já usado nos outros 14 setores com clique-para-detalhar (não filtrar pelos nomes que a Débora citou de memória, e sim pela equipe real na folha).

**Fontes usadas (dados reais, nada inventado):**
- Folha de pagamento Julho/2026: `Base_Despesa_Trabalhista_072026.xlsx`, filtrando `INCLUI CT?`= SIM, por EQUIPE = QUALIDADE / JURIDICO / MARKETING / TIC / COE / FIQUE MÓVEL. Totais: Qualidade R$ 29.551,64 (8 pessoas), Jurídico R$ 5.004,50 (2 pessoas), Marketing R$ 46.152,22 (12 pessoas), TIC R$ 26.679,57 (7 pessoas), COE R$ 61.332,27 (14 pessoas), Fique Móvel R$ 11.232,40 (3 pessoas).
- Custos avulsos batidos por nome do setor (busca com normalização de acento e limite de palavra, para não confundir com substrings tipo "TIC" dentro de "Logística"): `Materiais dos setores.xlsx` (copa/limpeza — Qualidade, Jurídico, Marketing, TIC), `Combsutivel do rateio.xlsx` (combustível — Jurídico, Marketing), `Custo seg. do trabalho rateio.xlsx` aba "exames medicos" (Qualidade, Marketing), `Rescisões do rateio.xlsx` (TIC, Junho/2026, 2 rescisões somando R$ 6.208,99).
- **COE e Fique Móvel não têm nenhum custo avulso encontrado nas planilhas auxiliares** — hoje só aparecem com Folha de pagamento (Julho/2026). Isso é esperado e não é erro, mas fica registrado como limitação: se a Débora souber de algum custo de material/combustível/exame desses dois setores que devesse entrar, precisa apontar a planilha/linha.

**O que foi decidido NÃO incluir (para não fabricar dado)**: os itens padrão de benefício por colaborador que aparecem em todos os outros 25 setores (Gympass, Stargrid, Despesas com RH/DP/SST, Licença de e-mail corporativo, Energia elétrica, Água e esgoto, Telefonia móvel, Material de escritório) **não foram adicionados** aos 6 setores novos, porque exigiriam ou inventar a alocação (qual andar/prédio, quantos são elegíveis a cada benefício) ou assumir headcount igual ao da folha — o que nos outros setores nem sempre bate (ex.: Compras tem 5 na Folha mas só 4 no Gympass). Ficou registrado como próximo passo: se a Débora quiser esses itens nos 6 setores novos, ela precisa informar os valores/alocação, ou confirmar que pode usar o headcount da folha como aproximação.

**Dado parcial em Maio/Junho/2026 (confirmado pela Débora — "mostrar os 3 meses, com aviso de dado parcial")**: como só temos a folha de pagamento de Julho/2026 (não achamos ainda o equivalente de Maio/Junho para esses 6 setores), os 3 meses aparecem no histórico, mas Maio/Junho mostram só os custos avulsos encontrados (ou R$ 0,00 quando nada foi encontrado) — a Folha de pagamento desses 2 meses fica ausente/zerada. A justificativa desses 2 meses, na aba SETORES, tem um aviso explícito de "DADO PARCIAL" anexado ao texto, para não passar a impressão de que o setor não teve custo de pessoal nesses meses (só não temos o dado ainda).

**Implementação técnica:**
- Novas linhas gravadas direto na `Base_Rateio_Custos_DTEL.xlsx` real (aba SETORES: 18 linhas novas = 6 setores × 3 meses, com as mesmas fórmulas `SUMIFS`/`IFERROR` já usadas nas linhas existentes; aba CUSTOS MENSAIS: 35 linhas novas com os itens encontrados) — usando `openpyxl` para escrever as fórmulas, e depois `libreoffice --headless --calc --convert-to xlsx` para forçar o recálculo (openpyxl não calcula fórmula, só escreve a string — sem esse passo os totais apareceriam vazios ao abrir no sistema).
- `extrair_dados.js`: adicionados os 6 ícones novos em `SECTOR_ICONS` (qualidade ✅, juridico ⚖️, marketing 📣, tic 🖧, coe 🧩, fique_movel 📱) — o parser em si não precisou de nenhuma outra mudança, porque já lê a planilha genericamente por linha.
- `detalhes_folha_julho.json` (posteriormente substituído por `detalhes_colaborador.json`, ver seção seguinte): adicionadas as 6 novas chaves de setor (mesmas slugs), cada uma com a lista de colaboradores/valores de Julho/2026, no mesmo formato já usado pelos outros 14 setores — assim o clique-para-detalhar funciona também nesses 6 novos.
- Validado com Playwright: os 6 novos setores aparecem no menu (`/api/setores`, agora 31 setores), cada `/setor/<slug>` carrega KPIs/histórico/gráfico/tabela corretos, o aviso de dado parcial aparece no texto de justificativa de Maio/Junho, o clique-para-detalhar mostra os colaboradores reais (confirmado em COE — 14 pessoas — e Fique Móvel — 3 pessoas, incluindo a terceira pessoa não citada pela Débora), e a isolação por setor continua real (`/api/custos/coe` não contém nenhum dado de outro setor).
- Os 3 arquivos atualizados (`Base_Rateio_Custos_DTEL.xlsx`, `extrair_dados.js`, `detalhes_folha_julho.json`) foram entregues por chat e gravados direto em `C:\sistemas-custos\` (e `C:\sistemas-custos\dados-mensais\`) via a ponte com o computador da Débora — sem precisar reiniciar o `2_Ligar_Plataforma.bat` manualmente, já que o servidor relê o arquivo sozinho (cache de 60s).

## Clique-para-detalhar estendido a Exames médicos e Combustível de frota (19/08/2026)

A Débora pediu para o mesmo formato de composição analítica por pessoa (nome + valor), hoje só em "Folha de pagamento (salários)", valer também para os itens "Exames médicos" e "Combustível de frota" — mostrando de onde vem cada lançamento.

**Fontes usadas (reais, sem inventar vínculo):**
- Exames médicos: `Custo seg. do trabalho rateio.xlsx`, aba "exames medicos" (colunas COLABORADOR/SETOR/GESTOR/Data faturamento/VALOR).
- Combustível de frota: `Combsutivel do rateio.xlsx` (colunas CONDUTOR/SETOR/VALOR/COMPETENCIA).

**Critério para incluir um setor**: só entrou o cruzamento quando o nome do setor na planilha auxiliar batia de forma inequívoca com um dos setores reais (ex.: "MARKETING", "QUALIDADE", "OFICINA", "SESMT" = Segurança do Trabalho, "SEG. TRABALHO" = Segurança do Trabalho — sinônimos já validados no projeto). Nomes ambíguos na planilha auxiliar de exames médicos (ATENDIMENTO, RELACIONAMENTO, FROTA, COMERCIAL, TECNICO, COZINHA, SERVIÇOS GERAIS, variações de "SUPORTE TECNICO/...") ficaram **de fora, sem clique-para-detalhar** — não é erro nem esquecimento, é decisão de não adivinhar o vínculo. Se a Débora souber a que setor cada um desses corresponde, dá para completar depois.

**Setores que ganharam o clique-para-detalhar (Exames médicos)**: Estoque, Manutenção Predial, Compras, Contabilidade, Oficina, Qualidade, Marketing e Segurança do Trabalho — nos meses em que a planilha auxiliar tem lançamento (Maio/Junho/Julho, cada um variando conforme os dados existentes).

**Setores que ganharam o clique-para-detalhar (Combustível de frota)**: Compras, Controladoria, Engenharia, Jurídico, Logística, Manutenção Predial, Marketing, NOC, Obras, Oficina e Segurança do Trabalho — também com granularidade mensal (diferente da Folha de pagamento, que só tem Julho/2026, esses dois itens têm dado real nos 3 meses, então o clique funciona em Maio/Junho/Julho onde houver lançamento).

**Validação feita antes de entregar**: a soma dos nomes/valores de cada (setor, mês, item) bate exatamente com o total já lançado na `Base_Rateio_Custos_DTEL.xlsx` para aquele item — confirmado programaticamente para todos os casos (ex.: Logística Julho combustível = R$ 37.632,61 batendo com a soma dos 8 condutores).

**Implementação técnica:**
- O arquivo `detalhes_folha_julho.json` foi substituído por um arquivo mais amplo, **`detalhes_colaborador.json`**, com blocos: `folha_de_pagamento` (slug → lista, só Julho/2026, formato igual ao antigo), `exames_medicos` (slug → mês → lista), `combustivel` (slug → mês → lista) e, mais tarde, `epi` (ver seção seguinte). O `extrair_dados.js` ainda aceita o arquivo antigo como fallback (se algum dia só ele existir na pasta), mas passa a procurar primeiro o novo.
- `extrair_dados.js`: a lógica de match de item de custo → detalhe por pessoa reconhece os padrões de texto (`/folha de pagamento/i`, `/exames? m[eé]dicos?/i`, `/combust[ií]vel/i`, `/\bEPIs?\b/i`) e busca no bloco certo do JSON, respeitando o mês selecionado (exceto Folha, que continua fixa em Julho/2026, único mês com dado de payroll disponível).
- `public/setor.html`: o rótulo da caixa de composição analítica agora é dinâmico — "colaborador(es)" para Folha/Exames médicos/EPIs, "condutor(es)" para Combustível de frota (em vez do texto fixo "colaborador").
- Validado com Playwright: Qualidade (Exames médicos, 1 colaborador), Jurídico e Marketing (Combustível, 1 condutor cada), Manutenção Predial (Combustível, 6 condutores) — todos abrindo/fechando corretamente, sem erro de console.
- Arquivos entregues e gravados direto em `C:\sistemas-custos\`: `extrair_dados.js`, `public\setor.html` e `detalhes_colaborador.json` (o `detalhes_folha_julho.json` antigo pode ser apagado quando a Débora quiser, mas não precisa — não é mais usado enquanto o arquivo novo existir).

## Clique-para-detalhar estendido a EPIs — Equipamento de Proteção Individual (19/08/2026)

Além de Exames médicos e Combustível de frota (seção acima), a Débora pediu para eu revisar se havia mais algum item de custo com nome de colaborador disponível, dando "Fardamento" e "Material de escritório" como exemplos. Revisei todas as planilhas auxiliares em `dados-mensais` e não encontrei fonte com nome de pessoa para Fardamento nem Material de escritório (só total por setor/mês) — mas encontrei para **EPIs - Equipamento de Proteção Individual**.

**Fonte**: `Custo seg. do trabalho rateio.xlsx`, aba "Materiais epi" (colunas NOME/ITENS/CIDADE/GESTOR/SETOR/EMPRESA/CUSTO TOTAL/DATA DA ENTREGA) — apesar dos nomes dos itens parecerem fardamento (calça, bota, capacete), na planilha real esse custo é lançado sob a categoria "EPIs", não "Fardamento" — usei a classificação real da planilha, não a aparência do nome do item.

**Setores com correspondência inequívoca**: Logística, Manutenção Predial e Obras — validado batendo exatamente com o valor já lançado (ex.: Obras Maio/2026 R$ 4.422,39 = soma de 43 itens/colaboradores). Cada linha do detalhamento mostra nome do colaborador + item específico entregue (ex.: "CLEITON LIMA DA SILVA (Bota De Obra 41)").

**O que ficou de fora**: Fardamento novo/substituição e Material de escritório continuam sem clique-para-detalhar — não achei nenhuma planilha com nome de colaborador vinculado a esses itens. Se a Débora encontrar/criar uma fonte assim, dá para estender do mesmo jeito.

## Adição de mais 2 setores: Lançamento e Fusão (19/08/2026)

A Débora pediu para incluir "Lançamento, Fusão e Manutenção Predial" como setores. Como Manutenção Predial já existe entre os 25 setores originais, perguntei antes de agir — ela confirmou que foi engano de digitação, era só Lançamento e Fusão mesmo. Também perguntei o critério de rateio, já que essas duas são equipes de campo (instalação/fusão de fibra óptica), diferentes dos setores administrativos — ela confirmou **Clientes** para as duas.

**Fontes usadas (reais):**
- Folha de pagamento Julho/2026 (`Base_Despesa_Trabalhista_072026.xlsx`, EQUIPE = LANÇAMENTO / FUSÃO, `INCLUI CT?`=SIM): Lançamento R$ 130.373,43 (22 colaboradores), Fusão R$ 46.838,36 (8 colaboradores).
- Combustível de frota (`Combsutivel do rateio.xlsx`): valores reais nos 3 meses para os dois setores.
- EPIs (`Custo seg. do trabalho rateio.xlsx`, aba "Materiais epi"): valores reais nos 3 meses para os dois setores.
- Rescisões trabalhistas (`Rescisões do rateio.xlsx`): só Lançamento, Maio/2026 (R$ 1.746,63).
- Nenhum material de escritório/copa encontrado para esses dois na `Materiais dos setores.xlsx` — não incluído (sem dado real).

**Totais por mês**: Lançamento — Maio R$ 22.665,35, Junho R$ 15.832,76, Julho R$ 145.574,11 (com folha). Fusão — Maio R$ 15.825,61, Junho R$ 13.554,16, Julho R$ 63.377,23 (com folha). Maio/Junho seguem o mesmo padrão de "DADO PARCIAL" já usado nos outros 6 setores novos (sem folha de pagamento disponível para esses meses).

**Implementação**: mesmo processo dos 6 setores anteriores — linhas novas em SETORES (6 linhas = 2 setores × 3 meses) e CUSTOS MENSAIS (19 linhas) na `Base_Rateio_Custos_DTEL.xlsx` real, com as mesmas fórmulas `SUMIFS`/`IFERROR`, recalculadas com LibreOffice antes de entregar. Ícones novos em `SECTOR_ICONS`: lancamento 📡, fusao 🔗. `detalhes_colaborador.json` ganhou as entradas de Folha (22 e 8 colaboradores reais), Combustível e EPI para os dois novos slugs — então o clique-para-detalhar já funciona nesses 3 itens desde o primeiro momento. Total de setores no sistema: **33**.

**Nota**: conferi a aba COMERCIAL VAREJO da planilha e não há nenhuma menção a "Lançamento" ou "Fusão" lá — são equipes que só existiam nas planilhas auxiliares (folha, combustível, EPI) e na folha de pagamento trabalhista, mas não tinham representação nenhuma na Base_Rateio_Custos_DTEL antes desta atualização. Não há sobreposição/duplicidade de custo com o Comercial Varejo.

## Clique-para-detalhar da Central de Relacionamento: NRC, Cobrança, Retenção, Televendas, Suporte da Central e Suporte Orbix (19/08/2026)

Na folha de pagamento trabalhista, esses 6 setores não aparecem como equipes separadas — todos os colaboradores estão agrupados sob uma única equipe, "RELACIONAMENTO" (121 pessoas com `INCLUI CT?`=SIM em Julho/2026). A Débora pediu para cruzar os nomes dessas 121 pessoas com a planilha `Agentes Central.xlsx` (que tem a coluna Setor real de cada agente: NRC, SUPORTE, COBRANCA, RETENÇÃO, TELEVENDAS, ORBIX) para separar corretamente por sub-time.

**Mapeamento de Setor (Agentes Central.xlsx) → slug da plataforma**: NRC → `nrc`, SUPORTE → `suporte_da_central`, COBRANCA → `cobranca`, RETENÇÃO → `retencao`, TELEVENDAS → `televendas`, ORBIX → `suporte_orbix`. Roster também tinha os valores BKO (1 pessoa), MADRUGADA (1 pessoa) e 77 linhas sem Setor preenchido — nenhum desses vira sub-time da plataforma, então não entram.

**Correspondência de nomes com erros/typos na folha**: 19 das 121 pessoas não batiam por nome exato contra o roster, por causa de erros de digitação na planilha trabalhista (ex.: "SANATANA" em vez de "SANTANA"), sobrenome faltando/sobrando, ou um caso de corrupção de dado (uma célula continha o nome da pessoa colado com a palavra "SITUAÇÃO:" no final, aparentemente um erro de exportação da planilha de origem). Usei correspondência aproximada (`difflib`, similaridade ≥0,836) para encontrar o par certo no roster, conferi manualmente cada um dos 18 casos para garantir que era a mesma pessoa (não uma coincidência com outra pessoa parecida), e apliquei essas 18 correções manualmente antes de gerar o resultado final. 1 pessoa (DEYGENA ROSA DE LIMA) ficou de fora — no roster ela está classificada como "BKO", que não é nenhum dos 6 sub-times, então corretamente não entra em nenhum deles (não é falha de correspondência).

**Resultado do cruzamento (Julho/2026, valor = Custo Total incluindo encargos)**: NRC 44 pessoas (R$ 124.449,63), Suporte da Central 33 pessoas (R$ 84.046,00), Cobrança 13 pessoas (R$ 32.162,47), Retenção 12 pessoas (R$ 31.648,83), Televendas 10 pessoas (R$ 85.581,91), Suporte Orbix 8 pessoas (R$ 21.693,49).

**Validação contra o total oficial já lançado na Base_Rateio_Custos_DTEL (item "Folha de pagamento (salários)", Julho/2026) — divergência encontrada e reportada à Débora antes de aplicar**:
- Cobrança: R$ 32.162,47 cruzado vs. R$ 32.162,46 oficial — bate (diferença de 1 centavo, arredondamento).
- Suporte Orbix: R$ 21.693,49 cruzado vs. R$ 21.693,48 oficial — bate (diferença de 1 centavo, arredondamento).
- NRC: R$ 124.449,63 cruzado vs. R$ 137.405,10 oficial — **não bate** (diferença de R$ 12.955,47).
- Retenção: R$ 31.648,83 cruzado vs. R$ 29.118,58 oficial — **não bate** (diferença de R$ 2.530,25).
- Suporte da Central: R$ 84.046,00 cruzado vs. R$ 87.015,31 oficial — **não bate** (diferença de R$ 2.969,31).
- Televendas: R$ 85.581,91 cruzado vs. R$ 107.737,48 oficial — **não bate** (diferença de R$ 22.155,57, cerca de 20%).

Como Cobrança e Suporte Orbix bateram quase exato e os outros 4 tiveram diferenças relevantes (uma delas de ~20%), isso indica que o total oficial de Folha de pagamento desses 4 setores na Base_Rateio_Custos_DTEL foi calculado por outra base/método — não só por este cruzamento "RELACIONAMENTO → Agentes Central". Perguntei à Débora como prosseguir (aplicar só onde bateu, aplicar em todos com aviso, ou investigar antes) — ela decidiu **aplicar os 6 valores cruzados mesmo assim**, e vai investigar por conta própria de onde vem a diferença nos 4 setores que não bateram.

**Implementação técnica**: os 6 slugs (`nrc`, `cobranca`, `retencao`, `televendas`, `suporte_da_central`, `suporte_orbix`) foram adicionados ao bloco `folha_de_pagamento` do `detalhes_colaborador.json` (antes não existiam ali — eram os "setores sem equipe correspondente na folha"). Nenhuma mudança de código foi necessária em `extrair_dados.js`, porque o match de "Folha de pagamento (salários)" já procura genericamente `detalhesColaborador.folha_de_pagamento[slug]` para qualquer slug. Validado programaticamente: os 6 setores agora retornam a lista de colaboradores certa (contagem e soma batendo com o `folha_relacionamento_resolvido.json` gerado no cruzamento) antes de entregar o arquivo. `detalhes_colaborador.json` entregue por `SendUserFile` e gravado direto em `C:\sistemas-custos\detalhes_colaborador.json` via a ponte com o computador da Débora.

**Pendência em aberto (a pedido da própria Débora)**: ela vai investigar por conta própria a origem da diferença nos totais de NRC, Retenção, Suporte da Central e Televendas — não é uma tarefa em aberto do lado do Claude, mas fica registrado aqui para consulta futura caso ela peça ajuda nessa investigação depois.


## Substituição da folha trabalhista por uma versão mais completa + detalhamento de encargos por colaborador (19/08/2026)

A Débora substituiu o `Base_Despesa_Trabalhista_072026.xlsx` por uma versão mais completa (de 814 KB para 971 KB) — a nova versão adicionou 2 colunas de encargos que não existiam antes (RAT/GILRAT 2% e Terceiros 5,80%) e corrigiu o cálculo de INSS Patronal (antes aparecia 0 para muita gente, agora 20% correto). Ela pediu para (1) ajustar os valores na Base_Rateio_Custos_DTEL com os novos totais, e (2) nos HTMLs, não mostrar só o valor final de cada colaborador na composição analítica, e sim o detalhamento completo dos encargos que compõem aquele valor (1/12 férias, 1/12 13º, FGTS, INSS, etc.).

**Estrutura da nova planilha** (mesma aba "Custo Trabalhista", agora com mais colunas): MATRÍCULA, COLABORADOR, EMPRESA, EQUIPE, SITUAÇÃO, INCLUI CT?, CARGO, **CT TOTAL** (salário/proventos base), **1/12 FÉRIAS**, **1/12 13º SALÁRIO**, **FGTS (8%/2% aprendiz)**, **INSS PATRONAL (20%)**, **RAT/GILRAT (2%)**, **TERCEIROS (5,80%)**, **PROVISÃO MULTA RESCISÓRIA (40%÷12)**, **TOTAL ENCARGOS** (= FGTS+INSS+RAT+Terceiros+Multa — não inclui férias/13º), **CUSTO TOTAL** (= CT Total + Férias + 13º + Total Encargos — esse é o valor final que já usávamos antes como "valor" de cada colaborador).

**Reprocessamento**: reaplicei toda a lógica já validada neste projeto — mapeamento EQUIPE → setor para os 27 setores com detalhamento (os 12 originais + Gestão de Atendimento/Engenharia + os 8 setores novos de 19/08 + os 6 sub-times da Central de Relacionamento cruzados via `Agentes Central.xlsx`, incluindo as mesmas 18 correções de nome por aproximação já documentadas) e o escopo por empresa (Segurança do Trabalho e Estoque restritos a DTEL TELECOM LTDA). A nova planilha também trouxe uma equipe nova, "CENTRAL DE RELACIONAMENTO" (4 jovens aprendizes), tratada como sinônimo de "RELACIONAMENTO" para efeito do cruzamento. Um efeito colateral bom: a nova folha já corrigiu por conta própria o caso do HUGO ESTEVES (equipe "atendimento" minúsculo) — Gestão de Atendimento passou de 8 para 19 pessoas automaticamente, sem precisar de ajuste manual.

**Totais oficiais de "Folha de pagamento (salários)" ajustados na Base_Rateio_Custos_DTEL (Julho/2026)** — em todos os 27 setores o valor subiu (com excessão de Televendas, que caiu), porque a base de encargos ficou mais completa/correta:

| Setor | Antes | Depois |
|---|---|---|
| NOC | R$ 47.979,76 | R$ 58.179,03 |
| RH | R$ 25.029,47 | R$ 30.249,56 |
| DP | R$ 36.100,97 | R$ 43.775,11 |
| Financeiro | R$ 24.895,28 | R$ 30.137,10 |
| Segurança do Trabalho | R$ 38.332,16 | R$ 46.380,08 |
| Contabilidade | R$ 12.181,65 | R$ 14.720,90 |
| Compras | R$ 21.173,86 | R$ 25.624,63 |
| Logística | R$ 85.604,31 | R$ 103.801,58 |
| Manutenção Predial | R$ 87.012,07 | R$ 105.508,61 |
| Estoque | R$ 66.136,79 | R$ 80.081,35 |
| Obras | R$ 121.446,01 | R$ 147.262,32 |
| Gestão de Atendimento | R$ 28.118,37 | R$ 65.500,37 (11 pessoas a mais, ver acima) |
| Engenharia | R$ 70.861,78 | R$ 85.925,17 |
| Qualidade | R$ 29.551,64 | R$ 35.833,55 |
| Jurídico | R$ 5.004,50 | R$ 6.068,32 |
| Marketing | R$ 46.152,22 | R$ 55.912,74 |
| TIC | R$ 26.679,57 | R$ 32.250,43 |
| COE | R$ 61.332,27 | R$ 74.369,92 |
| Fique Móvel | R$ 11.232,40 | R$ 13.569,86 |
| Lançamento | R$ 130.373,43 | R$ 158.087,50 |
| Fusão | R$ 46.838,36 | R$ 56.795,02 |
| NRC | R$ 137.405,10 | R$ 150.904,43 |
| Cobrança | R$ 32.162,46 | R$ 38.898,86 |
| Retenção | R$ 29.118,58 | R$ 38.376,56 |
| Suporte da Central | R$ 87.015,31 | R$ 101.811,52 |
| Suporte Orbix | R$ 21.693,48 | R$ 26.304,95 |
| Televendas | R$ 107.737,48 | R$ 103.724,16 (única queda — a nova base de encargos ficou mais próxima do cruzamento por nome do que a antiga) |

Soma das diferenças: cerca de **+R$ 132.000** no total mensal de Folha de pagamento entre os 27 setores. **Setores que continuam sem detalhamento por colaborador (não têm equipe correspondente identificada na folha), portanto NÃO foram alterados**: CAC, Controladoria, Diretoria Operacional, Oficina, Comercial Corporativo, Administrativo.

**Nota sobre a divergência da Central de Relacionamento (reportada em 19/08, antes desta atualização)**: com a base de encargos mais completa, Cobrança e Suporte Orbix — que antes batiam quase exato com o oficial — agora também ficaram com diferença (a base antiga do oficial usava encargos incompletos). Televendas, que antes tinha a maior divergência (~20%), agora ficou a mais próxima entre as 6. Isso é esperado: os totais oficiais de todos os 27 setores foram recalculados diretamente a partir desta nova base, então a "divergência antiga" (que a Débora ia investigar por conta própria) deixa de existir — os valores agora vêm 100% do cruzamento de nomes com a base trabalhista mais completa.

**Novo recurso: detalhamento de encargos por colaborador na Folha de pagamento**. Ao abrir a composição analítica de "Folha de pagamento (salários)" em qualquer um dos 27 setores, cada colaborador agora é clicável — ao clicar no nome, expande uma caixa mostrando: Salário base (CT Total), 1/12 Férias, 1/12 13º Salário, FGTS, INSS Patronal, RAT/GILRAT, Terceiros, Provisão multa rescisória, Total de encargos, e Custo Total (o valor final, igual ao que já aparecia na linha resumida). Os itens de Exames médicos, Combustível de frota e EPIs continuam mostrando só nome + valor (não são folha de pagamento, não têm essa composição de encargos na fonte).

**Implementação técnica**:
- `Base_Despesa_Trabalhista_072026.xlsx`: arquivo novo, mais completo, substituído em `C:\sistemas-custos\dados-mensais\` pela própria Débora (direto no computador, sem passar pelo chat).
- `Base_Rateio_Custos_DTEL.xlsx`: as 27 linhas de "Folha de pagamento (salários)" em CUSTOS MENSAIS (Julho/2026) tiveram quantidade (headcount), valor unitário e total atualizados para os novos valores, recalculado com LibreOffice, e revalidado item a item — soma dos itens de cada setor/mês bate exatamente com o total da aba SETORES em toda a planilha (diferença máxima de 0,00003, arredondamento de ponto flutuante).
- `detalhes_colaborador.json`: cada pessoa em `folha_de_pagamento` agora tem, além de `nome` e `valor` (compatibilidade com o formato antigo), um objeto `encargos` com os 10 campos (salarioBase, umDozeAvosFerias, umDozeAvosDecimoTerceiro, fgts, inssPatronal, ratGilrat, terceiros, provisaoMultaRescisoria, totalEncargos, custoTotal).
- `public/setor.html`: cada linha de colaborador na composição analítica virou clicável quando tem `encargos` (seta ▼ + destaque no hover), abrindo uma caixa com o detalhamento em grid label/valor. Itens sem `encargos` (Exames médicos, Combustível, EPIs) continuam exatamente como antes.
- `extrair_dados.js` não precisou de nenhuma mudança de código — ele já repassa o objeto `detalhes` inteiro (incluindo o novo campo `encargos`) para o front-end sem processar o conteúdo.
- Validado com Node direto (sem precisar de Playwright): NOC, NRC, Qualidade, Televendas e Cobrança conferidos — total do item bate com a Base_Rateio_Custos_DTEL atualizada, e o primeiro colaborador de cada lista tem o objeto `encargos` completo e coerente (CT Total + Férias + 13º + Total Encargos = Custo Total, em todos os casos testados).
- 3 arquivos entregues por chat e gravados direto em `C:\sistemas-custos\`: `dados-mensais\Base_Rateio_Custos_DTEL.xlsx`, `detalhes_colaborador.json` e `public\setor.html`.


## Preenchimento de Maio e Junho de Folha de pagamento, para todos os setores com detalhamento (19/08/2026)

A Débora adicionou os arquivos `Base_Despesa_Trabalhista_052026.xlsx` (Maio) e `Base_Despesa_Trabalhista_062026.xlsx` (Junho) na pasta `dados-mensais`, no mesmo formato/estrutura do arquivo de Julho (mesmas 17 colunas, incluindo os encargos completos). Isso permitiu preencher a Folha de pagamento de Maio e Junho para os mesmos 26 setores que já tinham detalhamento em Julho (todos, exceto CAC — ver limitação abaixo), e também eliminou o aviso de "DADO PARCIAL" que aparecia nos 8 setores novos (Qualidade, Jurídico, Marketing, TIC, COE, Fique Móvel, Lançamento, Fusão), já que agora eles têm folha real nos 3 meses.

**Reprocessamento**: reaplicada a mesma lógica já validada (mapeamento EQUIPE → setor, escopo por empresa para Segurança do Trabalho/Estoque, cruzamento da Central de Relacionamento via `Agentes Central.xlsx`) para os 2 novos arquivos. Um ajuste necessário: nos arquivos de Maio/Junho a coluna EMPRESA vem abreviada ("DTEL" em vez de "DTEL TELECOM LTDA", "DMAIS" em vez do nome completo etc.) — o filtro de escopo por empresa (Segurança do Trabalho/Estoque só DTEL) foi ajustado para reconhecer "DTEL" como equivalente a "DTEL TELECOM LTDA".

**Central de Relacionamento em Maio/Junho — atenção a uma limitação**: o cruzamento usa a mesma planilha `Agentes Central.xlsx` (uma foto do roster em 27/07/2026) para os 3 meses, porque não temos um roster histórico de Maio/Junho — ou seja, assume-se que a composição de sub-times (quem está em NRC, Cobrança, etc.) não mudou muito entre Maio e Julho. É uma aproximação razoável mas vale a Débora saber que, se alguém trocou de sub-time nesse período, o mês antigo pode estar usando o sub-time errado para essa pessoa. Precisou de 3 correções de nome adicionais por aproximação (mesma técnica já usada em Julho): "ELAYNE FERREIRA DA SILVA." (ponto final sobrando), "JOSE VICTOR PEREIRA DA SILVA" (Victor/Vitor) e "LISANGELA ROSA DE SANTANA SILVA" (Santana/Santane) — todas com alta confiança (similaridade ≥0,96) e sem ambiguidade com outra pessoa.

**CAC continua sem detalhamento em nenhum mês**: nos 3 arquivos (Maio, Junho, Julho), não existe nenhuma linha com EQUIPE = "CAC" — o time parece ter sido reorganizado/renomeado nesse período (histórico do projeto já registrou que CELIO MARCIO migrou entre Gestão de Atendimento/Engenharia/CAC durante este mesmo atendimento). O valor de Folha de pagamento de CAC nos 3 meses continua com o número que já estava na planilha (não foi alterado, porque não há fonte por colaborador para conferir ou substituir).

**Totais atualizados**: os 26 setores tiveram o total de "Folha de pagamento (salários)" de Maio e Junho substituído pelo valor real cruzado por colaborador (antes, para Qualidade/Jurídico/Marketing/TIC/COE/Fique Móvel/Lançamento/Fusão, o valor era R$ 0,00 nesses 2 meses; para os outros 18, havia um valor anterior — provavelmente uma estimativa ou rateio simplificado — substituído agora pelo valor real). Alguns setores tiveram queda (ex.: Estoque, Segurança do Trabalho, Televendas em alguns meses) porque o valor anterior estava sobrestimado em relação ao dado real por colaborador — mesmo padrão do ajuste feito em Julho.

**Implementação técnica**:
- `Base_Rateio_Custos_DTEL.xlsx`: 54 linhas atualizadas em CUSTOS MENSAIS (26 setores × 2 meses) com quantidade/valor unitário/total novos, recalculado com LibreOffice e revalidado (soma dos itens por setor/mês bate exatamente com a aba SETORES em toda a planilha). Removido o texto "— DADO PARCIAL: sem fechamento de folha..." da justificativa de Maio/Junho dos 8 setores que agora têm folha real nesses meses (16 células de justificativa ajustadas).
- `detalhes_colaborador.json`: a estrutura de `folha_de_pagamento` deixou de ser `slug → lista` (só Julho) e passou a ser `slug → mês → lista`, no mesmo padrão já usado por `exames_medicos`/`combustivel`/`epi`. Os 27 slugs agora têm Maio/2026, Junho/2026 e Julho/2026.
- `extrair_dados.js`: a lógica de match do item "Folha de pagamento" deixou de ser restrita a `mes === 'Julho/2026'` e passou a buscar `detalhesColaborador.folha_de_pagamento[slug][mes]` — igual ao padrão dos outros 3 tipos de detalhe.
- Validado com Node + Playwright: NRC/Qualidade/COE conferidos nos 3 meses (contagem de pessoas e total batendo com a planilha), e a tela de Qualidade em Maio/2026 confirmada sem o aviso de dado parcial, com a tabela de encargos abrindo com os 8 colaboradores.
- 3 arquivos entregues por chat e gravados direto em `C:\sistemas-custos\`: `dados-mensais\Base_Rateio_Custos_DTEL.xlsx`, `detalhes_colaborador.json` e `extrair_dados.js`.


## Recuperação do detalhamento do CAC (19/08/2026)

A Débora notou que a seta de detalhamento do setor CAC tinha desaparecido. Investigando: no arquivo de folha antigo (antes da substituição por um mais completo), existia uma equipe chamada "CAC" na coluna EQUIPE. No arquivo novo (Maio, Junho e Julho de 2026), não existe mais nenhuma linha com EQUIPE = "CAC" — a equipe dessas pessoas passou a aparecer como "GESTÃO DE ATENDIMENTO" (ou, em 1 caso, "ENGENHARIA"), então o cruzamento por EQUIPE deixou de encontrar o setor.

A Débora confirmou que essas pessoas continuam sendo do CAC de fato — o CARGO delas ainda diz isso. Localizei o time real buscando `\bCAC\b` (com limite de palavra, para não confundir com a coincidência de letras dentro de "EDIFICAÇÕES", por exemplo) no CARGO de cada colaborador, em vez de na EQUIPE:

- **Julho/2026** (5 pessoas, R$ 15.525,96): CONCEIÇÃO JACIARA CASADO DE SOUZA, DJANETE SOARES DA SILVA, GABRIELA DA SILVA ALVES, NAILZA MOREIRA DA SILVA (todas cargo "Assistente Administrativo CAC...", equipe Gestão de Atendimento) e CLAUDIA SOARES DOS SANTOS SILVA (mesmo cargo, mas equipe Engenharia).
- **Maio/2026** (5 pessoas, R$ 15.175,74) e **Junho/2026** (5 pessoas, R$ 17.805,42): mesmo grupo, com JADSON WASHINGTON DE SENA MOREIRA SANTOS no lugar de DJANETE SOARES DA SILVA (troca de pessoa entre os meses, natural).

O valor subiu bastante em relação ao que estava lançado antes (R$ 7.364,25/Julho, R$ 8.287,63/Junho, R$ 7.823,56/Maio) — o motivo é o mesmo já documentado nas outras atualizações: a base de encargos completa (FGTS, INSS, RAT/GILRAT, Terceiros, Multa) é maior que a base antiga, e também porque a lista real tem 5 pessoas, mais do que a estimativa anterior cobria.

**Implementação**: os 3 valores de "Folha de pagamento (salários)" do CAC na `Base_Rateio_Custos_DTEL.xlsx` foram atualizados e recalculados (revalidado — soma dos itens por setor/mês continua batendo com a aba SETORES em toda a planilha). `detalhes_colaborador.json` ganhou a chave `cac` em `folha_de_pagamento`, com os 3 meses no mesmo formato (nome + encargos completos) dos outros 27 setores. Confirmado com Playwright: a seta volta a aparecer em `/setor/cac`, abrindo a tabela horizontal de encargos com as 5 pessoas.

**Nota para o futuro**: se mais setores parecerem ter perdido a equipe de origem na folha (equipe genérica, mas cargo específico), o mesmo método — buscar pelo nome do setor dentro do CARGO, não só da EQUIPE — pode reencontrar o time certo.


## Auditoria de "Exames médicos" e "Fardamento" em todos os setores (19/08/2026)

A Débora pediu para verificar por que Exames médicos e Fardamento não tinham seta em outros setores além dos já mapeados. Rodei uma varredura em todos os 33 setores × 3 meses comparando o valor lançado com o que existe (ou não) na planilha auxiliar `Custo seg. do trabalho rateio.xlsx` (aba "exames medicos").

**Fardamento novo/Fardamento substituição**: continuam sem nenhuma fonte com nome de colaborador em nenhuma planilha auxiliar (confirmado de novo nesta varredura) — não é possível adicionar a seta sem uma fonte nova. Sem mudança aqui.

**Exames médicos — 2 casos resolvidos com segurança** (a soma da planilha auxiliar bate exatamente com o valor oficial já lançado, nos 3 meses):
- **Gestão de Atendimento**: a planilha auxiliar rotula essas pessoas como "ATENDIMENTO" (rótulo genérico) — mas a soma desse grupo bate exatamente com o valor oficial de Gestão de Atendimento em Maio (R$ 447), Junho (R$ 455) e Julho (R$ 329), confirmando que é o mesmo time, apesar do rótulo diferente. Seta adicionada nos 3 meses (7, 6 e 7 pessoas).
- **NRC e Cobrança em Julho/2026**: a planilha auxiliar tem uma coluna extra (sem cabeçalho) que rotula 5 lançamentos de Julho da equipe "RELACIONAMENTO" com o sub-time exato: 1 pessoa "nrc" (R$ 35, ELIAS JOSE DA SILVA JUNIOR) e 1 pessoa "cobrança" (R$ 65, MARIA VICTORYA SILVA NEPOMUCENO) — cada um bate exatamente com o valor oficial de NRC e Cobrança em Julho. Seta adicionada só em Julho para esses 2 setores (Maio/Junho desses 2 setores não têm esse rótulo extra, então continuam sem seta).

**Achado importante — NÃO aplicado, precisa da sua decisão**: o valor oficial de Exames médicos de **Suporte da Central**, nos 3 meses (R$ 9.622,90 em Maio, R$ 6.245,80 em Junho, R$ 10.752,60 em Julho), bate exatamente com a SOMA DE TODAS as variações de "SUPORTE TECNICO / ..." (Instalação, Fusão, Lançamento, Administrativo) da planilha auxiliar — que são os **técnicos de campo/instalação**, um time completamente diferente do "Suporte da Central" (que é a equipe de atendimento da Central de Relacionamento). Isso indica que o valor lançado para Suporte da Central pode estar, na verdade, somando o custo de exames médicos dos técnicos de instalação por engano (confusão de nome "Suporte Técnico" vs. "Suporte da Central"). Não toquei nesse valor nem adicionei detalhamento — só sinalizando, porque criar a lista de nomes ali significaria atribuir o custo de instaladores de campo à equipe de atendimento por engano. Também achei um caso parecido em menor escala: o valor de Exames médicos do **CAC em Maio (R$ 950)** bate exatamente com o total do grupo "RELACIONAMENTO" inteiro daquele mês (não com o grupo "ATENDIMENTO", que é a fonte real do CAC/Gestão de Atendimento) — outro possível erro de origem.

**Outros 3 casos sem fonte identificável**: DP (R$ 65, Julho), Logística (R$ 65, Julho) e Comercial Corporativo (R$ 60, Julho) têm valor lançado mas nenhum grupo da planilha auxiliar bate com esse número exato — não dá para saber a origem sem a Débora indicar a fonte.

**Retenção e Suporte da Central em Maio/Junho — valores suspeitos de divisão artificial**: os valores de Exames médicos de NRC, Cobrança e Retenção em Maio (R$ 316,67 cada, os 3 iguais) e em Junho (valores também repetidos) parecem ser o total do grupo "RELACIONAMENTO" daquele mês dividido em 3 partes iguais, e não um valor real cruzado por nome — diferente do padrão real que a planilha auxiliar tem para Julho (rótulo explícito por pessoa). Não apliquei detalhamento aqui, porque os 10 nomes de RELACIONAMENTO de Maio/Junho na planilha auxiliar não têm rótulo de sub-time e teriam que ser cruzados com o `Agentes Central.xlsx`, exatamente como fizemos pra Folha de pagamento — ainda não fiz esse cruzamento para Exames médicos.
