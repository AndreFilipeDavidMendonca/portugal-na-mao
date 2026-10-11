# PT Operations — Synthetic Monitoring & Load Testing: Phase 1B — Revisão de Arquitetura e Plano Revisto

Data: 2026-10-10. Âmbito: **continuação exclusivamente de análise e planeamento**, sobre
`PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_PLAN.md` ("Report 1", lido integralmente antes
de escrever este documento). Nenhum código alterado, nenhuma dependência instalada, nenhum
runner/teste de carga executado, nenhuma conta criada, nenhuma migration corrida, nada tocado em
produção, nenhum commit/push/deploy. Git status capturado antes (Secção 15) e no fim.

Este documento **não repete** a auditoria de arquitetura já feita — pressupõe o Report 1 como
lido. Foca-se nas cinco decisões de âmbito agora fechadas (PT Operations fica local; execução
manual; alertas adiados; simplicidade; liberdade técnica) e no que elas mudam.

---

## 1. Executive Summary

As cinco decisões do responsável pelo projeto removem, de um só golpe, a maior parte da
complexidade que o Report 1 tinha de carregar: sem deployment do PT Operations, sem agendamento,
sem alertas, a dependência mais pesada do roadmap anterior (passo 4 — "deployment mínimo do
PT Operations antecipado") **deixa de existir**. O que resta é um problema genuinamente pequeno:
um script corrido manualmente no portátil do André, a escrever para um PT Operations que já está
a correr localmente (como já corre hoje, confirmado na validação da ronda de Analytics de
2026-10-09).

Esta revisão chega a três conclusões que divergem do Report 1, cada uma justificada em detalhe
nas secções correspondentes:

1. **Um único runner, não dois.** Dado que não existe nenhuma infraestrutura Playwright/Cypress
   em nenhum repositório (confirmado por grep — zero resultados), e dado que os passos 3-9 do
   percurso são puramente chamadas HTTP, a recomendação da Secção 5 é usar **k6 sozinho** para o
   Synthetic Runner inicial — o mesmo binário que serve o Load Testing — em vez de introduzir
   Playwright já na primeira versão. Verificação de browser real fica proposta como capacidade
   adiada (Secção 11), não removida.
2. **A alteração a `app_user` deixa de ser necessária.** Um ficheiro de configuração local com os
   IDs/e-mails das contas técnicas conhecidas resolve a separação de tráfego sem tocar no schema
   da aplicação pública — mais simples, reversível, e adequado ao volume pequeno de contas que
   esta fase precisa (Secção 7).
3. **O risco do pool HikariCP não está errado no Report 1, mas estava sub-instrumentado.** Hoje
   **não existe nenhuma forma de observar** a saturação real do pool — nem `/actuator/metrics`
   configurado, nem log de pool, nem `pg_stat_activity` consultado. A conclusão "8-10 ligações =
   gargalo" era uma inferência a partir de um valor de configuração, não uma medição. A Secção 6
   propõe como corrigir isto com esforço mínimo, e explica por que "10 ligações" não significa
   "10 utilizadores simultâneos" — a distinção que o pedido corretamente exige.

---

## 2. Decisions Confirmed

Registadas aqui só para orientar o resto do documento (não repetidas em cada secção):

| # | Decisão | Implicação direta |
|---|---|---|
| 1 | PT Operations fica local, sem deployment nesta fase | Elimina o passo 4 do roadmap anterior (deployment antecipado); simplifica drasticamente a arquitetura (Secção 4) |
| 2 | Execução manual, sem agendamento automático | Elimina Render Cron Job/GitHub Actions do caminho crítico; scripts correm quando o André decidir |
| 3 | Alertas por e-mail adiados, sem preparação antecipada | `AlertService`/`spring-boot-starter-mail` em `pt-operations-api` saem do roadmap; arquitetura não deve impedir isto, mas não o antecipa |
| 4 | Simplicidade, reutilizar maduro em vez de construir | Guia todas as escolhas de ferramenta abaixo — inclusive a de usar só k6 |
| 5 | Liberdade técnica sobre Playwright/k6 | Usada na Secção 5 para recomendar k6-only no MVP |

---

## 3. Critical Review of Report 1

### 3.1 Recomendações que continuam válidas
- Mapeamento do percurso funcional a endpoints reais confirmados (`/auth/login`, `/api/pois`,
  `/api/search`, `/api/districts/{id}`, `/api/trips/{tripId}`, etc.) — nenhum endpoint novo
  necessário na API pública.
- Rejeição de embutir o runner na própria app monitorizada ("monitorizar o monitor") — mantém-se
  válida mesmo sem agendamento: mesmo correndo manualmente, o runner deve ser um processo externo.
- k6 como ferramenta de carga — confirmado e reforçado (Secção 5/6).
- Precedente de `details JSONB` em `user_activity_log` como forma já validada, no próprio
  codebase, de guardar resultados semi-estruturados sem desenhar uma coluna por métrica —
  diretamente reutilizável para o resumo de k6 (Secção 8).
- Padrão de cooldown/dedup via Caffeine (usado pelos rate limiters e pelo Production Write Gate)
  — continua a ser o blueprint certo *quando* os alertas avançarem, mesmo que adiados agora.
- Reaproveitamento do padrão "Relationship" (`rows`/`summary`/`filters`) e dos componentes de
  gráfico existentes (`TimeSeriesChart.jsx`, `CategoryBarChart.jsx`, `PeriodFilter.jsx`) para
  qualquer vista nova — mantém-se como a forma certa de não duplicar Analytics/App Health.

### 3.2 Recomendações que deixam de fazer sentido (ou ficam adiadas)
- **Deployment do PT Operations como pré-requisito** — removido pela decisão 1. O passo 4 do
  roadmap anterior ("é aqui que a dependência real aparece") simplesmente desaparece.
- **Render Cron Job vs. GitHub Actions** — irrelevante enquanto a execução for manual (decisão 2).
  A pesquisa de preços feita na ronda anterior fica como referência para quando a automação for
  retomada, não como decisão a tomar agora.
- **`spring-boot-starter-mail` em `pt-operations-api` + `AlertService`** — adiado pela decisão 3.
- **Playwright como parte obrigatória da recomendação inicial** — o Report 1 propunha um híbrido
  por omissão; esta revisão argumenta por um MVP k6-only (Secção 5), com Playwright como extensão
  adiada, não removida.
- **`is_technical` em `app_user`** — demovido de "a fazer" para "opcional, só se o número de
  contas técnicas crescer" (Secção 7).

### 3.3 Dependências que podem ser eliminadas
- Deployment do `pt-operations-api`/`pt-operations-fe` (decisão 1).
- Qualquer novo serviço Render (Cron Job, Background Worker) nesta fase.
- `spring-boot-starter-mail` + configuração SMTP própria em `pt-operations-api`.
- Qualquer gestor de jobs/filas (nunca foi proposto, mas vale a pena dizer explicitamente que
  **não é preciso** — um botão que invoca um processo local, se vier a existir, não precisa de
  fila nem de worker assíncrono separado, só de `ProcessBuilder` síncrono ou com polling simples).

### 3.4 Complexidade que podemos evitar
- Duas ferramentas de teste (Playwright + k6) quando uma (k6) cobre o essencial do MVP.
- Uma migration em `portugal-na-mao-api` (`is_technical`) quando um ficheiro de configuração em
  `pt-operations-api` resolve o mesmo problema sem tocar na app pública.
- Um "sistema de gestão de jobs" para o botão de execução manual — a preocupação do Report 1 com
  um "executor remoto autorizado" pressupunha PT Operations deployed e acedido por terceiros;
  localmente, com um único operador, essa fronteira de confiança não existe (ver 3.6).

### 3.5 Riscos eventualmente sobrestimados
- **"Executor remoto autorizado" para o botão de carga** — o Report 1 tratou isto como
  infraestrutura nova e arriscada. Num cenário 100% local, com um único utilizador (o André, com
  as suas próprias credenciais de SO), um botão no PT Operations que invoca `k6`/o script
  sintético no mesmo computador não introduz nenhuma fronteira de confiança nova — é
  equivalente a correr o comando no terminal. O risco real só reaparece *se e quando* o
  PT Operations for deployed (fora de âmbito aqui).
- **Segurança do PT Operations online** — toda a discussão do Report 1 sobre isto (Secção 11
  desse documento) deixa de ser relevante para esta fase, por construção (decisão 1).

### 3.6 Riscos eventualmente subestimados
- **Observabilidade do próprio pool HikariCP.** O Report 1 apresentou "8-10 ligações" como *a*
  conclusão de risco, mas nunca propôs como *confirmar* essa conclusão com dados reais — e,
  confirmado agora por grep, **não existe hoje nenhum mecanismo no código para observar o pool em
  execução** (sem `management.*` configurado, sem `HikariPoolMXBean` usado em lado nenhum). Ou
  seja: o Report 1 tratou uma inferência de configuração como se fosse um limite medido. Corrigido
  na Secção 6.
- **Confusão entre VUs, pedidos simultâneos e ligações ocupadas** — o Report 1 escreveu "50+ VUs
  autenticados já excede o pool em quase 5x", uma simplificação que o próprio pedido do André
  identificou corretamente como problemática. Corrigido em detalhe na Secção 6.

### 3.7 Alternativas não suficientemente consideradas no Report 1
- k6 como ferramenta única para Synthetic Monitoring **e** Load Testing (Secção 5).
- Lista de configuração em vez de coluna de schema para identificar contas técnicas (Secção 7).
- "Colar o JSON do resumo do k6 numa caixa de texto no PT Operations" como o primeiro incremento
  realista, antes de qualquer glue code de upload automático (Secção 8.7).

---

## 4. Simplified Local Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Portátil do André                                                     │
│                                                                        │
│  k6 (binário local, sem instalação de infraestrutura)                  │
│   ├─ synthetic.js   — 1 VU, 1 iteração, percurso dos 10 passos          │
│   └─ load/*.js      — perfis de carga (anónimo/autenticado/escrita)     │
│         │                                                              │
│         │ TARGET_ENV=local (único valor exercitado nesta fase)          │
│         ▼                                                              │
│  portugal-na-mao-api (local, :8085)  ──X-Test-Run-Id──▶ api_request_log │
│  (nenhuma alteração de comportamento — só mais tráfego real)            │
│         │                                                              │
│         │ --summary-export=summary.json (k6) / resultado por passo      │
│         ▼                                                              │
│  pt-operations-api (local, :8090-ish) — novo pt.ptops.testing/          │
│   POST /api/local/testing/synthetic-runs                               │
│   POST /api/local/testing/load-test-runs                               │
│         │                                                              │
│         ▼                                                              │
│  pt_operations (local) — synthetic_run, synthetic_run_step,            │
│  load_test_execution (novas, pequenas, JSONB para o resumo bruto)       │
│         │                                                              │
│         ▼                                                              │
│  pt-operations-fe (local) — novo separador "Testing", reaproveitando    │
│  TimeSeriesChart/CategoryBarChart/PeriodFilter já existentes            │
└────────────────────────────────────────────────────────────────────┘
```

**Onde ficam os scripts**: pasta nova fora dos quatro repositórios (ex.
`portugal-workspace/testing/`) — não acopla o runner ao ciclo de release de nenhum repositório
existente, consistente com a recomendação já feita no Report 1.

**Quem executa**: o André, manualmente, por linha de comando (`k6 run testing/synthetic.js`).

**Como os resultados são recolhidos**: `k6` já produz tudo o que é preciso nativamente —
`--summary-export` (resumo agregado) para carga, e, para o percurso sintético, um script que usa
`group()` por passo e lê o próprio relatório de `checks`/timings do k6.

**Como são guardados**: POST para o `pt-operations-api` local — dois endpoints novos, pequenos,
seguindo o padrão `Controller`/`Service`/DTO já usado em todo o `pt.ptops.*`.

**Como são consultados**: novo separador "Testing" no `pt-operations-fe`, reaproveitando
componentes existentes.

**Como são correlacionados com os logs**: via `X-Test-Run-Id` (novo header, análogo ao
`X-Request-Id` já existente) + uma coluna nullable nova em `api_request_log` (único ponto de
alteração na API pública proposto nesta fase — ver Secção 9).

**Componentes que precisam de alteração**: `pt-operations-api` (pacote novo `pt.ptops.testing`,
2 migrations novas em `pt_operations`), `pt-operations-fe` (separador novo), `portugal-na-mao-api`
(só a coluna/captura do header, aditivo).

**Componentes que permanecem intactos**: tudo o resto — `Analytics`/`App Health` existentes,
`EnvironmentService`, Production Write Gate, autenticação, rate limiters, e-mail, enrichment.

**Preparação para automação futura, sem a implementar**: o script em si já aceita `TARGET_ENV`
como variável explícita (hoje só `local` é suportado/testado); o endpoint de ingestão no
PT Operations não assume uma origem HTTP vs. CLI — aceita um JSON vindo de onde quer que seja,
o que o torna indiferente a "quem" o chama no futuro (um Cron Job, uma mão humana, ou um botão).
Nenhum scheduler, serviço residente ou deployment é introduzido para viabilizar isto.

---

## 5. Synthetic Testing Recommendation

### 5.1 Comparação das três opções

| Critério | A — Browser real (Playwright) | B — HTTP (k6) | C — Híbrido |
|---|---|---|---|
| Simplicidade/esforço inicial | Alto (zero infra existente — confirmado por grep, nenhum `package.json` em nenhum dos 4 repos menciona Playwright/Cypress) | Baixo (1 binário, 1 script, mesma ferramenta do Load Testing) | Mais alto que A ou B isolados |
| Cobertura | Única opção que deteta regressões de build/render do frontend (JS partido, mapa em branco) | Cobre 100% do backend (passos 3-9); não deteta nada do frontend em si | Soma as duas coberturas |
| Manutenção | Seletores DOM quebram com mudanças de UI; mais um runtime (Node+browser) a manter atualizado | Scripts só dependem de contratos de API, mais estáveis | Soma os dois custos de manutenção |
| Reutilização de ferramenta | Nova (Playwright) | **A mesma do Load Testing** — zero ferramenta extra | Duas ferramentas |

### 5.2 Recomendação: começar só com B (k6), para o percurso completo 3-9

Com a decisão de simplicidade e sem pressão de automação, a opção com melhor relação
esforço/valor para a **primeira versão utilizável** é k6 sozinho, cobrindo os passos 3-9 do
percurso (login, mapa/POIs, pesquisa, detalhe de POI, distrito/município, viagem de teste) como
uma sequência de chamadas HTTP com `group()` nomeado por passo — o que já produz exatamente a
estrutura "Login: 320ms / Pesquisa: 180ms / Mapa: 650ms" do exemplo ilustrativo do pedido, sem
nenhum código de automação de browser.

Os passos 1-2 ("abrir a aplicação", "verificar carregamento") ficam cobertos de forma parcial por
um simples `GET` HTTP ao HTML da SPA (confirma que o Vercel responde 200), mas **não** confirmam
que o bundle JS corre sem erros nem que o mapa renderiza — essa parte fica deliberadamente fora do
MVP (ver Secção 11), não escondida: o relatório de cada execução deve indicar claramente "passos
1-2: só verificação HTTP, sem validação de renderização" para não dar falsa confiança.

### 5.3 Porque não Playwright já agora
Zero infraestrutura existente para arrancar (confirmado), esforço de manutenção de seletores
DOM, e o valor marginal de detetar "o JS está partido" é menor do que o valor de ter *algo* a
correr já esta semana. Fica proposto como extensão natural (Secção 11), não descartado.

### 5.4 Produção — proposta de segurança e configuração (não autorizado para execução nesta fase)

- Variável explícita `TARGET_ENV` (`local` | `prod`), por omissão `local` — nunca assumido.
- Se um dia `TARGET_ENV=prod` for autorizado: (1) conta técnica **separada** da conta local
  (nunca partilhar credenciais entre ambientes); (2) o próprio script recusa-se a correr contra
  produção sem uma flag explícita adicional (`--confirm-prod`), para que seja impossível disparar
  isto por engano a partir de um `TARGET_ENV` mal configurado; (3) em modo `prod`, o script
  **salta qualquer passo de escrita** (criação de viagem, favoritos) — só leitura (`GET`), login
  incluído, mas nada que persista dados novos em produção; (4) a viagem de teste consultada
  (passo 9) tem de já existir, nunca ser criada pelo próprio runner em produção.
- Nenhuma destas três proteções está implementada — são a proposta de desenho a validar antes de
  alguma vez se autorizar `TARGET_ENV=prod`.

---

## 6. Load Testing Recommendation

### 6.1 Ferramenta
Mantém-se k6 (Secção 6 do Report 1) — sem achado novo que o desaconselhe, e agora com o bónus de
ser a mesma ferramenta do Synthetic Runner (Secção 5).

### 6.2 Correção da conclusão sobre o pool HikariCP

O pedido está certo a pedir esta reavaliação. "10 ligações no pool" **não** significa "10
utilizadores simultâneos" — são conceitos diferentes, e confundi-los foi a simplificação do
Report 1:

| Conceito | O que mede | Relação com o pool |
|---|---|---|
| **Utilizadores virtuais (VUs)** | Quantos "utilizadores" o k6 simula em paralelo, cada um a correr o seu próprio ciclo (pedido → espera → próximo pedido) | Um VU só ocupa recursos reais **enquanto está à espera de uma resposta** — o resto do tempo (think-time, processamento local) não consome nada do servidor |
| **Pedidos simultâneos** | Quantos pedidos HTTP estão, num instante exato, em voo (enviados, resposta ainda não recebida) | Sempre ≤ nº de VUs; normalmente muito menor, se houver qualquer intervalo entre pedidos |
| **Requests por segundo (RPS)** | Throughput — pedidos completados por segundo | Depende de VUs ÷ tempo médio de ciclo por VU |
| **Ligações efetivamente ocupadas** | Quantas ligações Hikari estão "fora do pool" num instante | Só é ocupada **durante a execução da query/transação**, não durante o pedido HTTP completo — e `spring.jpa.open-in-view: false` (confirmado em `application.yml`) já garante que a ligação **não** fica presa durante a serialização da resposta, só durante o acesso real à base de dados |
| **Tempo de execução das queries** | Quanto tempo cada pedido mantém uma ligação ocupada | Se for, por exemplo, 20ms num pedido que demora 200ms de ponta a ponta (rede + JSON + etc.), a mesma ligação pode servir ~10 pedidos "lógicos" diferentes nesse intervalo — um pool de 8 pode sustentar muito mais do que 8 "utilizadores" com este padrão |
| **Saturação do pool** | O momento em que o ritmo de pedidos que precisam de BD excede o que o pool consegue ciclar (`pool_size ÷ tempo_médio_de_posse`) | Não é um penhasco — `connection-timeout: 30000` (confirmado) significa que pedidos **esperam até 30s** por uma ligação antes de falhar; o sintoma observável primeiro é **latência a subir**, só depois (se persistir) é erro |

Conclusão corrigida: **não sabemos qual é o limite real** porque nunca foi medido, e a própria
arquitetura (`open-in-view: false`, queries presumivelmente rápidas) sugere que o limite pode ser
bem mais alto do que "8-10 utilizadores" em pedidos de leitura simples. Mas também não sabemos que
é mais alto — é uma hipótese razoável, não uma garantia. **A única forma de saber é medir.**

### 6.3 Métricas a observar para encontrar o limite real

Nenhuma destas exige alterar o comportamento da aplicação — são todas aditivas/observacionais:

1. **`pg_stat_activity` durante o teste** (zero alteração de código): `SELECT count(*) FROM
   pg_stat_activity WHERE datname = 'pt_dot' AND state = 'active';` corrido em loop (`watch`)
   durante uma execução k6 — a forma mais barata e imediata de ver ligações realmente ativas vs.
   o tamanho do pool, sem tocar em nada.
2. **Ativar `/actuator/metrics` localmente** (`management.endpoints.web.exposure.include:
   health,metrics` em `application.yml` — `spring-boot-starter-actuator` **já é dependência**,
   confirmado no `pom.xml`; isto é configuração pura, zero instalação nova) — expõe
   `hikaricp.connections.active`, `hikaricp.connections.pending` (threads à espera de uma
   ligação — o sinal mais direto de saturação), `hikaricp.connections.acquire` (tempo a obter
   uma ligação). Só recomendado para a sessão de teste local, não para produção nesta fase.
3. **`api_request_log.duration_ms` já existente**, filtrado por `X-Test-Run-Id` — se a latência
   sobe com o número de VUs de forma suave, é sinal de fila (não de falha); se sobe e depois
   dispara em erros, é saturação real.
4. **k6 `http_req_duration` + `http_req_failed`**, com `group()` separando endpoints que tocam a
   BD dos que não tocam (ex. nenhum endpoint usa OSRM/R2 só por si — mas vale a pena isolar
   endpoints puramente de leitura de cache/estáticos, se existirem, dos que fazem query real).

### 6.4 Perfis de carga — sem assumir volumes seguros

Mantém-se a lista de perfis do Report 1 (anónimo, autenticado, território, escrita), mas a
recomendação agora é **começar pelo perfil de leitura anónima**, com rampa lenta (ex. 1→5→10→20
VUs, cada degrau sustentado alguns minutos, nunca um salto direto para 50+), observando as
métricas da Secção 6.3 a cada degrau — só subir ao degrau seguinte depois de confirmar que o
anterior não mostrou sinais de fila (`hikaricp.connections.pending` > 0 sustentado).

### 6.5 Sessões e autenticação em carga
k6 `setup()` — correr os logins das 2-4 contas técnicas **uma vez**, no arranque do teste, não
por VU/iteração — os tokens resultantes são partilhados entre VUs via `SharedArray`/dados de
`setup()`. Isto evita colidir com o `LoginRateLimiter` (10/15min) e reflete um padrão de uso real
(sessões de 14 dias, não logins constantes).

---

## 7. Technical Accounts & Analytics Isolation

### 7.1 É necessária uma alteração a `app_user`? Não, nesta fase.

Proposta revista: um ficheiro de configuração **só em `pt-operations-api`** (ex.
`ptops.testing.technical-user-ids` — lista de UUIDs, ou e-mails, vinda de uma env var/ficheiro
local, seguindo o padrão já usado para credenciais sensíveis nesta mesma app). As queries
existentes de Product Analytics (`UserActivityLogRelationshipService`) ganham um `WHERE user_id
NOT IN (...)` opcional, ativo por omissão, com toggle para incluir — **sem nenhuma migration em
`portugal-na-mao-api`**, sem tocar na tabela `app_user`.

**Porque é suficiente**: o volume previsto é pequeno (1 conta sintética + 2-4 de carga, Secção 6
do pedido) e estável — não contas criadas/destruídas dinamicamente. Uma lista de configuração
atualizada manualmente é proporcional a este volume. **Quando reconsiderar**: se o número de
contas técnicas crescer para além de ~10, ou se a automação futura passar a criar contas
dinamicamente — nesse momento um campo `is_technical` (ou melhor ainda, um `UserRole` novo tipo
`TECHNICAL`, mais alinhado ao enum já existente do que um boolean solto) volta a ser a escolha
certa. Não implementado agora, porque não é necessário agora.

### 7.2 Tráfego anónimo (sem login)
Não tem `user_id` para filtrar — só é identificável pelo próprio `X-Test-Run-Id` (Secção 9).
Sem esse header, tráfego sintético/carga anónimo seria indistinguível de tráfego real anónimo no
`api_request_log` — por isso o header/coluna é a única alteração classificada como essencial.

### 7.3 Gestão de autenticação/sessões
Igual à Secção 6.5 — login real, token reutilizado, TTL de 14 dias cobre confortavelmente sessões
de teste manuais e repetidas ao longo de dias/semanas sem precisar de novo login constante.

### 7.4 Evitar dados desnecessários
Uma única viagem de teste pré-criada e reutilizada (passo 9 do percurso) — nunca recriada por
execução. Perfis de carga de escrita (criação de viagens/favoritos) ficam fora do MVP (Secção 9) —
quando entrarem, usar `teardown()` do k6 para limpar via os endpoints `DELETE` já existentes.

### 7.5 Eventos históricos não-orgânicos (Achado #4 do relatório de Analytics)
**Não tocados, não apagados, não alterados** — confirmado como fora de âmbito aqui também. A
única ação proposta (opcional, Secção 9) é cosmética: uma nota/aviso na própria UI do PT
Operations ("dados antes de [data] podem incluir tráfego não identificado") em vez de qualquer
alteração aos dados.

---

## 8. PT Operations Integration

### 8.1 Persistência — estrutura mínima
Duas tabelas novas em `pt_operations` (Flyway, seguindo a numeração `V10`+):

- `synthetic_run` — `id`, `test_run_id` (UUID), `started_at`, `target_env`, `status`
  (`SUCCESS`/`PARTIAL`/`FAILURE`), `total_duration_ms`.
- `synthetic_run_step` — `run_id` (FK), `step_name` (ex. `LOGIN`, `SEARCH`, `MAP`), `duration_ms`,
  `http_status`, `passed` (bool).
- `load_test_execution` — `id`, `test_run_id`, `profile_name`, `vus`, `duration_s`,
  `total_requests`, `error_rate`, `avg_duration_ms`, `p50_ms`, `p95_ms`, `p99_ms`,
  `raw_summary_json` (JSONB — o resumo completo do k6, precedente direto em
  `user_activity_log.details`, sem modelar cada métrica k6 como coluna).

### 8.2 Correlação com `api_request_log`
Via `X-Test-Run-Id` — ver Secção 9 (única alteração proposta na API pública).

### 8.3 Reutilização de gráficos existentes
`TimeSeriesChart.jsx` já agrupa por série temporal genérica — "duração do Synthetic Run ao longo
do tempo" ou "P95 do Load Test ao longo do tempo" são só outra série, zero código de gráfico novo.
`CategoryBarChart.jsx` serve para "duração por passo" (Login/Pesquisa/Mapa/...) na vista de
detalhe de uma execução — exatamente o formato do exemplo ilustrativo do pedido.

### 8.4 Identificação de cada execução
`test_run_id` (UUID), gerado pelo próprio script no arranque, mostrado como identificador
principal no histórico — mesmo papel do `correlation_id` já existente, mas ao nível da execução
completa, não do pedido individual.

### 8.5 Importação dos resultados de k6
`--summary-export=summary.json` (nativo do k6) → o script (um pequeno `curl`/fetch, ou mesmo um
passo manual) envia esse JSON para o novo endpoint. **Primeiro incremento realista, mais simples
do que qualquer automação**: um campo de texto no PT Operations onde se cola o JSON exportado,
sem nenhum glue code — válido como v0, antes mesmo de automatizar o envio.

### 8.6 Execução a partir da interface local — A, B ou C?

**Recomendação: C — A agora, B como evolução natural, não um projeto separado.**
Dado que tudo corre na mesma máquina e com o mesmo operador (decisão 1+2), a diferença entre "A"
(correr no terminal, colar/enviar o resultado) e "B" (botão no PT Operations que invoca
`ProcessBuilder` para correr o mesmo script) é só de conveniência de UI, não de superfície de
segurança nova — ao contrário do que o Report 1 implicava ao falar de "executor remoto
autorizado" (essa preocupação só é real se o PT Operations for acedido por alguém que não seja
quem já tem acesso ao próprio portátil). B pode vir depois de A estar validado, sem precisar de
fila de jobs nem de worker assíncrono — um botão que bloqueia a UI por alguns segundos/minutos
enquanto o processo local corre é aceitável para uma ferramenta interna de uso manual.

---

## 9. Essential Improvements

| Melhoria | Classificação | Justificação |
|---|---|---|
| `X-Test-Run-Id` (header + coluna nullable em `api_request_log`) | **Essencial antes dos testes** | Sem isto, tráfego anónimo sintético/de carga é indistinguível de tráfego real anónimo — contradiz diretamente o requisito de não contaminar Analytics |
| Lista de configuração de contas técnicas (Secção 7.1) | **Essencial antes dos testes** | Mesma razão, para tráfego autenticado |
| `pg_stat_activity` observado durante o primeiro load test (zero código) | **Essencial antes do primeiro load test** | Sem isto, a pergunta central do pedido ("qual é o limite real") continua sem resposta |
| Ativar `/actuator/metrics` localmente (config, zero dependência nova) | **Recomendada, não bloqueante** | Dá sinal mais fino (`hikaricp.connections.pending`) do que `pg_stat_activity`, mas este último já chega para uma primeira resposta |
| Normalização de rota em `api_request_log.path` | **Recomendada, não bloqueante** | Útil para agrupar resultados por endpoint-padrão; pode ser feito por regex na própria query do PT Operations sem alterar a app |
| Credenciais das contas técnicas num ficheiro fora do git (padrão `*-private.env` já existente) | **Recomendada, não bloqueante** | Baixo esforço, evita um erro fácil |
| Nota/aviso sobre dados históricos não-orgânicos na UI | **Opcional** | Cosmético, não bloqueia nada técnico |
| Retenção automática de execuções antigas | **Opcional** | Volume de execuções manuais vai ser baixo neste arranque |
| Qualidade das métricas existentes, estrutura de logs | **Fora de âmbito** | Já validadas na ronda de Analytics anterior; nada a fazer |

---

## 10. (ver Secção 3 — Avaliação Crítica já integrada acima, conforme pedido de não repetir estrutura)

---

## 11. Deferred Capabilities

- **Playwright/browser real** para os passos 1-2 do percurso (Secção 5.3) — proposto como
  extensão natural quando/se regressões de frontend se tornarem um problema recorrente, não como
  parte do MVP.
- **Agendamento automático** (Render Cron Job / GitHub Actions) — decisão 2, explicitamente fora
  de âmbito agora; a pesquisa de preços já feita na ronda anterior fica disponível para quando for
  retomada.
- **Alertas por e-mail** (`AlertService` + `spring-boot-starter-mail` em `pt-operations-api`) —
  decisão 3.
- **Deployment do PT Operations** — decisão 1; sem isso, execução contra produção também fica
  necessariamente adiada (a proposta de segurança da Secção 5.4 é só conceptual).
- **`is_technical` em `app_user`** (ou um `UserRole.TECHNICAL`) — só se o volume de contas
  técnicas justificar, Secção 7.1.
- **Botão "Executar" no PT Operations (Opção B)** — depois de A estar validado (Secção 8.6).
- **Perfis de carga de escrita** (criação de viagens/favoritos) — só depois de perfis de leitura
  estarem calibrados e de existir uma rotina de limpeza (`teardown()`), Secção 7.4.

---

## 12. Alternative Proposals

Além das três conclusões já destacadas na Secção 1 (k6-only, config-list em vez de schema,
"colar JSON" como v0), duas propostas adicionais não pedidas explicitamente mas que decorrem
diretamente da auditoria:

1. **Usar `UserRole.TECHNICAL`** em vez de um boolean `is_technical`, **se e quando** essa
   alteração for mesmo necessária (Secção 7.1) — mais consistente com o enum de papéis já
   existente (`ADMIN`/`USER`/`BUSINESS`/`GUIDE`) do que um segundo flag independente, evitando que
   os dois sinais (papel + "é técnico") fiquem dessincronizados.
2. **Rampa de carga obrigatoriamente gradual nos primeiros testes** (Secção 6.4) — não pedido
   explicitamente, mas decorre diretamente da falta de instrumentação do pool: sem rampa gradual
   e observação a cada degrau, o primeiro teste de carga arrisca ser inconclusivo (não se sabe em
   que degrau algo degradou).

---

## 13. Open Questions

1. Confirmar: a lista de configuração de contas técnicas em `pt-operations-api` (Secção 7.1) é
   aceitável como solução inicial, ou o André prefere já avançar para `UserRole.TECHNICAL`?
2. Confirmar: aceitar k6-only para o Synthetic Runner inicial (Secção 5.2), com Playwright
   adiado, ou preferir incluir já uma verificação mínima de browser real nos passos 1-2?
3. Onde deve viver a pasta de scripts (`portugal-workspace/testing/` proposto na Secção 4) — ou
   o André prefere outro local?
4. Confirmar o nome/forma exata do novo pacote `pt.ptops.testing` e das duas tabelas novas
   (Secção 8.1), antes de desenhar as migrations em detalhe numa fase de implementação.
5. A rampa de carga da Secção 6.4 (1→5→10→20 VUs) é o ponto de partida aceitável, ou o André
   quer definir outros degraus?

---

## 14. Final Recommendation

Avançar para uma Fase 2 revista, nesta ordem:

**2A — Fundação** (pequeno esforço): lista de configuração de contas técnicas em
`pt-operations-api`; coluna `test_run_id`/captura do header `X-Test-Run-Id` em `RequestLoggingFilter`
(`portugal-na-mao-api`, migration aditiva nova); confirmação de `pg_stat_activity` como técnica de
observação do pool (zero código). *Ficheiros afetados*: `RequestLoggingFilter.java`, uma migration
nova (`V104` ou seguinte), `application.yml` de `pt-operations-api` (lista de IDs). *Dependências*:
nenhuma. *Riscos*: nenhum (tudo aditivo). *Critério de aceitação*: um pedido com o header novo
aparece com o campo preenchido em `api_request_log`; a lista de IDs filtra corretamente nas
queries existentes. *Esforço*: pequeno. *Alterações à BD*: sim, uma coluna nullable.

**2B — Synthetic Runner (k6)**: criar `testing/synthetic.js`, correr manualmente contra local,
validar os passos 3-9 (login real, mapa, pesquisa, POI, distrito/município, viagem de teste).
*Dependências*: 2A (para já vir com `X-Test-Run-Id`). *Riscos*: nenhum novo. *Critério de
aceitação*: execução completa, timings por passo visíveis no output do k6. *Esforço*: médio.
*Alterações à BD*: não.

**2C — Persistência mínima + "colar JSON"**: `pt.ptops.testing` (endpoint de ingestão), migrations
`synthetic_run`/`synthetic_run_step`/`load_test_execution`, uma vista mínima (ainda sem gráficos)
no PT Operations onde colar o JSON exportado. *Dependências*: 2B. *Riscos*: nenhum novo.
*Critério de aceitação*: um resultado real do passo 2B aparece na vista. *Esforço*: médio.
*Alterações à BD*: sim, `pt_operations` (3 tabelas novas).

**2D — Load Testing (k6) + rampa gradual local**: `testing/load/*.js`, perfil de leitura anónima
primeiro, rampa 1→5→10→20 VUs, observação de `pg_stat_activity`/`api_request_log.duration_ms` a
cada degrau. *Dependências*: 2A (IDs/header). *Riscos*: o único real é esgotar o pool **local**
(sem impacto em produção, por desenho). *Critério de aceitação*: resumo k6 exportado com
P50/P95/P99/taxa de erro para pelo menos 2 degraus. *Esforço*: médio. *Alterações à BD*: não.

**2E — Interface e histórico**: separador "Testing" em `pt-operations-fe`, reaproveitando
`TimeSeriesChart`/`CategoryBarChart`/`PeriodFilter`; automatizar o envio do resumo k6 (substitui
"colar JSON" por um `curl`/script simples). *Dependências*: 2C+2D. *Riscos*: nenhum novo.
*Critério de aceitação*: validação visual ao vivo no browser local. *Esforço*: médio. *Alterações
à BD*: não.

Tudo o listado na Secção 11 (Playwright, agendamento, alertas, deployment, perfis de escrita,
botão de execução) fica deliberadamente fora desta sequência — não removido da visão de longo
prazo, só adiado até haver pedido explícito, exatamente como pedido.

---

## 15. Git Status

Capturado **antes** desta análise (idêntico ao fim — nenhuma alteração de código foi feita):

```
portugal-na-mao-api (main): limpo no início desta análise. No final, apareceu uma alteração não
feita por esta sessão — ver nota abaixo:
 M src/main/java/pt/dot/application/service/search/FuzzyNameMatcher.java

pt-operations-api (main): limpo.
pt-operations-fe (main): limpo.

PT-portugal-na-mao-fe (main): alterações pré-existentes de sessão concorrente, não tocadas:
 M src/App.js
 M src/components/map/ExploreAroundMe.jsx
 M src/components/map/MapExplorer.jsx
 M src/components/poi/FavoritesDrawer.jsx
 M src/components/poi/PoiModal.jsx
 M src/components/shared/GlobalInlineSearch.jsx
 M src/components/social/AdventurerFavoritesModal.jsx
 M src/components/social/AdventurerProfileModal.jsx
 M src/components/social/ProfilePanel.jsx
 M src/context/AppContext.jsx
?? src/context/MapPoisContext.jsx
?? src/lib/favorites.js

portugal-workspace (raiz, main): alteração pré-existente de sessão concorrente, não tocada:
 M LAUNCH_1_0_REPORT.md
?? PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_PLAN.md   (Report 1, já existente)
?? PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_REPORT_2.md   (este documento)
```

Nada staged, nada commitado, nada enviado, nenhuma base de dados ou produção tocada por esta
sessão. Os dois únicos ficheiros novos em todo o workspace, nesta ronda, são este relatório e o
Report 1 já existente de uma ronda anterior.

**Nota sobre `FuzzyNameMatcher.java`**: esta alteração não foi feita por esta sessão de análise
(que nunca escreveu, executou ou tocou em ficheiros Java) — surgiu entre a captura de git status
inicial e final, consistente com uma sessão concorrente a editar o mesmo repositório em paralelo
(padrão já registado em memória de sessões anteriores). Não foi staged nem tocada por aqui;
fica registada para que o André a identifique como sua/de outra sessão, não desta análise.
