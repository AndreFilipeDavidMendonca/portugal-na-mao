# PT Operations — Synthetic Monitoring & Load Testing: Estado Atual (2026-10-10)

Relatório de estado, complementar ao `..._ARCHITECTURE_REPORT_3.md` (desenho + primeira
validação) — cobre o que aconteceu **depois** desse documento: dois bugs reais encontrados e
corrigidos ao vivo pelo próprio André, clareza da interface, e uma primeira leitura interpretativa
dos dados que a feature já produziu. Não repete a arquitetura (ver Report 3) — foca-se em "o que
temos, o que testámos, onde, e o que mostramos", como pedido.

**Nota (sessão de 2026-10-10, fim do dia)**: trabalho interrompido a meio por falta de tempo —
ver §8 "Sessão interrompida" no fim deste documento para o ponto exato onde ficou e o que falta
para a próxima sessão (combinado para quarta-feira).

---

## 1. O que temos

Duas capacidades novas no PT Operations, dentro de uma tab própria ("Testes e Diagnóstico",
antes "Testing"):

- **Verificação da Aplicação (Synthetic)** — percorre, numa única passagem, login → mapa →
  pesquisa → detalhe de POI → distrito → viagem de teste, usando uma conta técnica real (criada
  pelo fluxo normal de registo, sem bypass). Pode correr uma vez ("Verificar agora") ou em loop
  até se mandar parar ("Iniciar verificações repetidas").
- **Teste de Carga (Load/Stress)** — simula 1→5→10→20 utilizadores virtuais em rampa, dois
  perfis (visitante anónimo / utilizador autenticado), contra mapa/pesquisa/distrito/viagem.

Ambas correm como processos `k6` locais, lançados pelo próprio `pt-operations-api`. Os
resultados ficam automaticamente separados do tráfego real via `test_run_id` (só aceite com um
segredo que o utilizador real nunca envia) nas mesmas tabelas que o Analytics/App Health já usam
— sem tabela de métricas paralela.

Nesta ronda (depois do Report 3), a interface da **Verificação da Aplicação** foi redesenhada por
inteiro: painel de resumo com estado em destaque, gráfico de duração por passo (com nomes
amigáveis — "Autenticação", "Carregamento do mapa", etc.), gráfico de evolução temporal,
histórico com "Verificações X/6", comparação automática com a verificação anterior, e saída
técnica do k6 escondida por trás de "Ver detalhes técnicos". **O painel de Teste de Carga foi
deliberadamente mantido como estava** — pedido explícito do André, "não redesenhar Load Testing
nesta intervenção" — fica para a próxima sessão (ver §8).

---

## 2. O que testámos — cronologia com identificadores reais

| Data/hora (10/10/2026) | `test_run_id` | Tipo | Resultado | Nota |
|---|---|---|---|---|
| 02:00:09 | `2d09722d-221e-455f-bb6f-bf5a4aac39a8` | Synthetic | **FALHOU** | Bug meu nos scripts: caminho de login errado (`/auth/login` em vez de `/api/login`) — corrigido antes de entregar |
| 02:01:13 | `cacf4fef-2a72-4c3e-9564-1f2cb902de0f` | Synthetic | **FALHOU** | Bug meu: escolha errada de POI a partir dos resultados de pesquisa — corrigido antes de entregar |
| 02:02:12 | `60d8c3be-5138-44d4-b9fc-a551e6d7bb09` | Synthetic | Sucesso | Primeira execução limpa, depois dos dois fixes acima |
| 03:03:05 | `cb52097d-4800-4454-9b98-4615eebca773` | Synthetic (contínuo) | Interrompido | Smoke test meu, "Start Continuous" + "Stop" |
| 03:03:38 | `96f27023-1dfd-4656-86e1-748ed356c94d` | Load (anónimo) | Interrompido | Smoke test meu; **inicialmente apareceu como "Falhou"** — bug real de condição de corrida no `stop()`, corrigido, histórico corrigido manualmente |
| 06:23 / 06:29 / 07:22-08:22 | `15c79a70…`, `6c8424f9…`, `3471388f…`, `052bba98…`, `77f6642c…` | Synthetic | Sucesso (5 execuções) | Já depois de todos os fixes — tuas execuções reais pela interface, incluindo depois do fix de CORS (`PTOPS_FE_ORIGIN`) |
| **08:08:27 → 08:11:04** | `9c5eb8f3-e330-4df7-8601-5f5b0f17e66f` | **Load (autenticado)** | "Sucesso" (processo k6 terminou limpo) **mas com problemas reais embutidos** | **Ver §3 — achado principal de hoje** |

**Onde**: sempre local — `portugal-na-mao-api` (`:8085`), `pt-operations-api` (`:8090`),
`pt-operations-fe` (`:5180`). Nunca produção.

---

## 3. Achado principal de hoje — pontos que falharam/foram lentos

A execução de carga das **08:08:27-08:11:04** (perfil autenticado, rampa 1→5→10→20) **não foi
limpa**, apesar do estado geral "Sucesso" (esse estado só reflete que o processo k6 terminou sem
exceção — não que todos os pedidos correram bem):

- **5676 pedidos no total**; P50=74ms, P90=142ms, P95=174ms, P99=305ms — a esmagadora maioria
  rápida e saudável.
- **20 pedidos falharam de verdade com erro 500.**
- **Outros 20 pedidos ficaram presos perto dos 30 segundos** antes de responder.
- **`GET /api/districts/16` concentrou 17 dos 20 erros** e teve a pior média (557ms vs. ~230ms
  dos outros endpoints) e o pior máximo (30508ms).

**Causa confirmada diretamente nos logs do servidor** (`/tmp/pt-api-local.log`,
`portugal-na-mao-api`, por volta de 09:11:04 UTC):

```
HikariPool-1 - Connection is not available, request timed out after 30005ms
(total=8, active=8, idle=0, waiting=26)
```

As 8 ligações do pool local (`HikariCP maximum-pool-size`) ficaram todas ocupadas, com **26
pedidos em fila de espera** no pico. Isto confirma, pela primeira vez com números reais, o risco
que os Reports 1-3 só tinham conseguido sinalizar como teórico.

**Investigação da causa raiz, feita mas ainda não aplicada ao código** (ver §8):
`DistrictService.toDistrictDtoWithFiles` (chamado em cada `GET /api/districts/{id}`) faz, em
sequência, até 6 idas à base de dados — incluindo duas chamadas
`@Transactional(propagation = REQUIRES_NEW)` (`LazyWikimediaMediaService.ensureDistrictImages` e
`UserActivityLogService.logDistrictView`), cada uma das quais pede uma **segunda** ligação do
mesmo pool, mesmo quando o trabalho real a fazer é zero (ex.: `ensureDistrictImages` abre sempre
uma transação nova só para descobrir que o distrito já tem imagens — confirmado: o distrito 16
já tem 23 `media_item`). Nenhum dos outros três endpoints testados (`/api/pois/lite`,
`/api/search`, `/api/trips/{id}`) tem este padrão — por isso só o distrito sofreu
desproporcionalmente. **A hipótese inicial de geometria pesada (GADM) foi afastada** — a entidade
JPA `District` nem sequer mapeia a coluna `geometry`, por isso nunca é lida por este caminho.

---

## 4. O que mostramos

Na tab **Testes e Diagnóstico**, secção "Verificação da Aplicação": painel de resumo com estado
em destaque (nunca mostrando "Interrompido" como falha), cartões (última verificação, tempo do
percurso, tempo médio, resposta mais lenta, pedidos com erro), gráfico de barras por passo com
nomes amigáveis e destaque de falhas, gráfico de evolução temporal clicável, histórico com
"Verificações X/6", comparação automática ("N% mais rápido/lento que a anterior"), e detalhes
técnicos do k6 escondidos por omissão. A secção "Teste de Carga" mantém o aspeto anterior
(não redesenhada nesta ronda).

---

## 5. Bugs reais encontrados e corrigidos

| # | Onde | O quê | Estado |
|---|---|---|---|
| 1 | Scripts k6 (meus) | Caminho de login errado, escolha de POI errada | Corrigido |
| 2 | `pt-operations-api` CORS | `PTOPS_FE_ORIGIN` apontava para `:5173`, dev server real em `:5180` | Corrigido |
| 3 | `TestRunProcessManager.stop()` | Condição de corrida — parar uma execução única podia ficar marcado "Falhou" | Corrigido + histórico antigo corrigido na BD |
| 4 | `TripService.createTrip` (pré-existente) | Viola FK ao gravar `user_activity_log` antes do Hibernate gravar a `Trip` — **criar viagem falha sempre em local** | **Não corrigido**, fora do âmbito, registado em `LAUNCH_1_0_REPORT.md` entrada 54 |

---

## 6. Achado interpretativo sobre a pesquisa (não um bug)

`GET /api/search` mostra um padrão bimodal claro (cache fria Caffeine vs. quente): ou
~150-320ms ou ~1.1-1.4s, nunca a meio. Não é falha — é sinal real sobre o comportamento da app,
trazido à superfície pelo próprio Synthetic Agent.

---

## 7. Git status (ao momento da interrupção)

```
portugal-na-mao-api:
 M SecurityConfig.java, UserActivityLogService.java, ApiRequestLogService.java (observability),
   RequestLoggingFilter.java, application.yml
?? TestAgentContext.java, V104__test_run_id_columns.sql
 (nenhuma alteração feita ainda para o achado do §3 — só investigação/leitura de código)

pt-operations-api:
 M ApiRequestLogService.java (observability), application.yml
?? pt.ptops.testing/ (pacote completo), V10__create_test_run.sql

pt-operations-fe:
 M App.jsx, Sidebar.jsx, lib/api.js
?? TestingSection.jsx, SyntheticStepsChart.jsx, SyntheticHistoryChart.jsx

portugal-workspace (raiz):
 M .gitignore
?? PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_PLAN.md / REPORT_2.md / REPORT_3.md
?? PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_STATUS_REPORT.md (este ficheiro)
?? testing/
```

Nada commitado, nada enviado, nenhuma alteração em produção.

**Backends no momento da interrupção**: `portugal-na-mao-api` (:8085) e `pt-operations-api`
(:8090, com as variáveis de teste já configuradas) estavam ambos a correr localmente, iniciados
nesta sessão. Ficam como estavam — não foram parados ao interromper o trabalho; confirmar o
estado deles na próxima sessão antes de continuar (`lsof -ti :8085` / `:8090`).

---

## 8. Sessão interrompida — ponto exato e o que falta para quarta-feira

Pedido do André nesta ronda (3 partes, nenhuma delas fechada):

1. **Dropdown para escolher o nº de agentes/VUs do Teste de Carga** — **não iniciado**. Precisa
   de: parâmetro novo no pedido do frontend (`runLoadTest(profile, maxVus)`), `TestRunnerController`/
   `TestRunProcessManager` a passar esse valor como env var ao processo k6, e `testing/load.js` a
   construir a rampa de forma dinâmica em vez dos `STAGES` fixos atuais.
2. **Melhorar a vista de detalhe do Teste de Carga** com a análise do §3 (ranking por endpoint,
   distinção entre erros reais e pedidos lentos, aviso automático quando a duração máxima se
   aproxima do limite de 30s do pool) — **não iniciado**. Frontend-only, reaproveita
   `endpointStats` já devolvido pelo endpoint de detalhe existente.
3. **Corrigir a causa raiz do esgotamento do pool** — **investigação concluída, fix identificado,
   ainda não aplicado**:
   - Causa confirmada: `LazyWikimediaMediaService.ensureDistrictImages` (e, pelo mesmo padrão,
     `ensurePoiImages`) abrem sempre uma transação `REQUIRES_NEW` nova — e portanto pedem sempre
     uma segunda ligação do pool — mesmo quando a verificação `hasMedia()` vai dizer que não há
     nada a fazer (caso comum, já confirmado para o distrito 16: 23 imagens já existentes).
   - Fix desenhado (não escrito): mover o `hasMedia()` para fora da transação `REQUIRES_NEW`,
     chamá-lo primeiro na transação já aberta pelo chamador, e só entrar na secção
     `REQUIRES_NEW` quando realmente for preciso ir buscar imagens novas ao Wikimedia/R2. Mesma
     correção nos dois métodos (`ensureDistrictImages`/`ensurePoiImages`) por consistência —
     mesmo padrão de código nos dois.
   - **Importante, para não sobrevender o fix**: isto remove uma causa real e desnecessária de
     pressão no pool, mas não resolve o problema estrutural mais amplo — um pool de 8 ligações
     locais continua pequeno para o volume de trabalho por pedido do endpoint de distrito (6
     idas à BD em série). Decisão sobre aumentar o pool, ou otimizar mais, fica em aberto.

**Próxima sessão**: retomar pelos 3 pontos acima, pela ordem que o André preferir. Nada foi
alterado em `portugal-na-mao-api` para o ponto 3 — só lido e confirmado por código, zero
risco acumulado ao parar aqui.

Até quarta! 🙂
