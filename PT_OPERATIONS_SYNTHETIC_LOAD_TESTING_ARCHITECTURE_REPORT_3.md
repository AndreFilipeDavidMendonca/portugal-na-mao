# PT Operations — Synthetic Monitoring & Load Testing: Phase 1C — Arquitetura Unificada, Implementação e Validação ao Vivo

Data: 2026-10-10. Âmbito: implementação real (autorizada explicitamente pelo André após uma
pergunta de confirmação sobre o alcance exato — "implementar e validar ao vivo", incluindo
aplicar migrations localmente, instalar k6 e arrancar os serviços). Build limpo nos três
repositórios (`mvn -o compile` × 2, `npx vite build` × 1) e **validação ao vivo real**: Synthetic
Agent e Load Agent corridos de ponta a ponta contra o backend local via a API nova do PT
Operations, não só por leitura de código. Nenhum commit, push ou deploy. Produção não tocada.
Git status antes/depois na Secção 15.

Pressupõe `PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_PLAN.md` ("Report 1") e
`..._REPORT_2.md` ("Report 2") como lidos — não repete essa auditoria, só o que muda.

---

## 1. Executive Summary

As decisões desta fase (reutilizar Analytics/App Health sem duplicar, separação automática via
identificador, sem tabelas novas a menos que estritamente necessário) levaram a uma arquitetura
mais simples do que o Report 2 tinha desenhado — e **mais simples ainda do que o próprio Report 2
previa precisar**: a proposta de marcar contas técnicas (`is_technical`/lista de configuração)
acabou por não ser necessária. A separação acontece inteiramente ao nível do *request*
(`X-Test-Run-Id` + `X-Test-Agent-Secret`), não ao nível da *conta* — funciona igualmente bem para
tráfego de teste autenticado e anónimo, e dispensa qualquer registo de "quais contas são
técnicas" em qualquer lado.

Das três tabelas que o Report 2 tinha proposto (`synthetic_run`, `synthetic_run_step`,
`load_test_execution`), **só uma foi criada**: `test_run`, em `pt_operations`, e só com
identidade/estado de execução. Toda a métrica (duração, status HTTP, erros, percentis,
agrupamento por passo/endpoint) é computada por leitura direta de `api_request_log`, filtrada por
`test_run_id`, reutilizando literalmente o mesmo método (`ApiRequestLogService`) que já serve o
App Health existente — só com um novo filtro em vez de um novo serviço.

**Tudo foi implementado e validado ao vivo nesta sessão**: três execuções reais do Synthetic
Agent (k6) contra o backend local via o novo botão/endpoint, uma execução real do Load Agent
(perfil anónimo, rampa de VUs), `Start Continuous Test`/`Stop Test` testados de ponta a ponta,
e — criticamente — o mecanismo de segurança do header testado com um ataque simulado (ver
Secção 2). Um bug real e pré-existente (não introduzido por este trabalho) foi encontrado no
processo: `TripService.createTrip` falha sempre com `500` em local desde a ronda de Analytics de
2026-10-08 (ver Secção 1.1) — registado, contornado para permitir a validação, não corrigido
(fora do âmbito desta feature).

### 1.1 Achado — bug pré-existente em `TripService.createTrip`

Ao tentar criar a viagem de teste da conta técnica pelo caminho normal (`POST /api/trips`), o
pedido falhou com `500`. A causa: `UserActivityLogService.logTripCreated` corre na mesma
transação do chamador (deliberado — ver o comentário já existente nessa classe, "a Trip row this
references was just created there"), mas o `INSERT` nela é feito via `JdbcTemplate` puro,
**antes** do Hibernate ter de facto emitido o `INSERT` da própria `Trip` para a base de dados
(o `save()` do JPA fica em escrita diferida até ao flush) — a FK de `user_activity_log.trip_id`
rebenta porque, da perspetiva do Postgres, a `Trip` ainda não existe nessa transação. Resultado:
**toda a criação de viagens está a falhar em local desde que esse logging foi adicionado**
(2026-10-08), e nunca tinha sido testado ao vivo até agora (o próprio relatório de Analytics já
assinalava isso como pendente). Contornado nesta sessão com um `INSERT` direto via SQL (fixture
de teste, não um utilizador real) — **não corrigido**, por estar fora do âmbito desta feature;
registado em `LAUNCH_1_0_REPORT.md` entrada 54 para decisão do André.

---

## 2. Como identificar e separar automaticamente os requests de teste — implementado e testado

`X-Test-Run-Id` sozinho nunca é suficiente — exatamente o requisito do pedido. Implementação:

- **`RequestLoggingFilter`** (`portugal-na-mao-api`) valida um segundo header,
  `X-Test-Agent-Secret`, contra `ptdot.test-agent.secret` (env `TEST_AGENT_SECRET`, comparação em
  tempo constante via `MessageDigest.isEqual`, sem valor por omissão — a funcionalidade fica
  inerte se não configurado). **Só com o segredo certo** é que `X-Test-Run-Id` é lido e propagado;
  com o header sozinho, ou com o segredo errado, o pedido segue exatamente como tráfego real.
- Propagação: `TestAgentContext` (novo, `ThreadLocal`) — lido sincronamente por
  `UserActivityLogService` (todos os seus call sites já são síncronos, não `@Async`, confirmado
  antes de usar `ThreadLocal`); passado como parâmetro explícito a
  `ApiRequestLogService.recordAsync` (esse método É `@Async`, corre numa thread diferente — um
  `ThreadLocal` não serviria aí).
- **Testado ao vivo, com um ataque simulado real** (não só por leitura de código):
  ```
  curl .../api/districts/16 -H "X-Test-Run-Id: fake-spoof-attempt"                                    → test_run_id fica NULL
  curl .../api/districts/16 -H "X-Test-Run-Id: fake-spoof-attempt" -H "X-Test-Agent-Secret: errado"    → test_run_id fica NULL
  ```
  Confirmado por SQL direto depois de cada tentativa — nenhuma das duas marcou a linha. Um
  pedido real nunca pode excluir-se do Analytics só por imitar o header.
- **Classificação dos eventos de produto associados**: confirmado ao vivo que `LOGIN`,
  `POI_VIEW`, `DISTRICT_VIEW` gerados pelo Synthetic Agent aparecem em `user_activity_log` com o
  `test_run_id` correto — a mesma execução, os mesmos 2 segundos, tanto no log técnico como no
  de produto.

---

## 3. Como garantir que os testes não contaminam o Analytics real

Por construção, não por filtro: os dashboards existentes (`ApiPerformanceSection.jsx`,
`LogsDashboardSection.jsx`) **nunca foram alterados** e continuam a não ter nenhuma noção de
`test_run_id` — simplesmente leem as tabelas sem filtrar por essa coluna, e tráfego de teste só
aparece lá se alguém decidir explicitamente consultá-lo por esse identificador (o que a nova tab
"Testing" faz, e mais nenhum sítio). Confirmado ao vivo: de 1800 linhas em `api_request_log` no
momento da validação, 17 tinham `test_run_id` (as três execuções desta sessão) — as restantes
1783, tráfego real, inalteradas.

---

## 4. Como reutilizar os logs e métricas existentes — implementado

`ApiRequestLogService` (observability, `pt-operations-api`) ganhou **um método novo**,
`getSummaryForTestRun(env, testRunId)`, que chama a mesma função interna (`computeSummary`,
extraída do `getSummaryInternal` já existente por um pequeno refactor) só com um `WHERE
test_run_id = ?` em vez do filtro de período/endpoint habitual. Mesmas queries
(`percentile_cont`, `FILTER (WHERE is_error)`, agrupamento por `method, path`), mesmo DTO
(`ApiRequestLogSummaryDto`) que o App Health já usa — zero SQL novo duplicado. `endpointStats`
(pensado originalmente para "endpoint mais lento") passa a servir, de borla, como a quebra "duração
por passo" do Synthetic Agent (cada passo bate num path diferente).

---

## 5. São realmente necessárias novas tabelas? — Não, só uma

Reavaliação confirmada pela implementação real: `synthetic_run_step` e `load_test_execution`
(propostas no Report 2) **não foram criadas** — a informação que cada uma guardaria já existe em
`api_request_log`, acessível pelo método da Secção 4. A única coisa que não existe em tabela
nenhuma é a *identidade e o estado* de uma execução (está a correr? que tipo? que perfil? quando
acabou?) — e é exactamente isso, só isso, que `test_run` guarda.

---

## 6. Estrutura mínima implementada

```sql
CREATE TABLE test_run (
    id            BIGSERIAL PRIMARY KEY,
    test_run_id   VARCHAR(64) NOT NULL UNIQUE,
    test_type     VARCHAR(20) NOT NULL,   -- SYNTHETIC | LOAD
    status        VARCHAR(20) NOT NULL,   -- RUNNING | SUCCESS | FAILURE | STOPPED
    target_env    VARCHAR(20) NOT NULL,   -- 'local', sempre — ver Secção 7
    profile_name  VARCHAR(100),
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at      TIMESTAMPTZ,
    exit_message  TEXT
);
```
`pt_operations` V10. Mais duas colunas nullable (`test_run_id`) em `api_request_log`/
`user_activity_log` (`portugal-na-mao-api` V104) — ver Secção 2.

---

## 7. Como executar os agentes através da interface local — implementado e testado

`TestRunProcessManager` (`pt-operations-api`, novo) lança k6 como processo do sistema operativo
local (`ProcessBuilder`), na mesma máquina do operador — **nenhuma fila de jobs, nenhum worker
remoto, nenhum serviço cloud**. Deliberadamente **sem nenhum parâmetro de ambiente em lado
nenhum** desta classe nem do controller — `BASE_URL` vem sempre de
`ptops.pt-api.local-base-url` (já existente, já usado pelo resto do PT Operations para o mesmo
conceito de "app local"). Produção não está bloqueada por uma verificação em runtime que se
possa contornar — simplesmente **não existe nenhum caminho de código** que a alcance nesta fase,
a garantia mais simples e mais forte possível.

**Testado ao vivo**:
- `POST /api/local/testing/synthetic/run` → processo k6 lançado, output capturado, `test_run`
  atualizado para `SUCCESS` no fim, métricas corretas na consulta de detalhe.
- `POST /api/local/testing/synthetic/start-continuous` + `POST /.../stop/{id}` → 3 iterações
  correram (18 linhas em `api_request_log`, 6 por iteração) antes de parar; o loop reconhece o
  sinal ~1-2s depois (a iteração em curso tem de terminar), estado final `STOPPED` confirmado.
- `POST /api/local/testing/load/run` (perfil `anonymous`) → rampa de VUs a correr, 142 pedidos
  tagged confirmados antes de um `stop` manual a meio da rampa (smoke test deliberado — não se
  deixou a rampa completa correr, sem necessidade para validar o mecanismo).

**Não bloqueia a interface** — cada lançamento devolve o `testRunId` de imediato
(`executor.submit`, não bloqueante), o frontend faz *polling* a `GET .../status` a cada 2s.

---

## 8. Como apresentar os resultados exclusivamente na tab Testing — implementado

Separador "Testing" novo em `pt-operations-fe` (`Sidebar.jsx`), independente de "Dashboard"/
"Logs" — nunca um filtro dentro deles. `TestingSection.jsx` reutiliza `CategoryBarChart.jsx` já
existente (duração média por passo/endpoint) e copia o padrão visual de cartões/tabela do
`ApiPerformanceSection.jsx` (App Health) sem importar componentes privados dele. Botões: *Run
Synthetic Test*, *Start Continuous Test*/*Stop Test*, *Run Load/Stress Test* (seletor
anónimo/autenticado) — cada um liga diretamente aos endpoints da Secção 7. Histórico (`GET
.../runs`) e detalhe (`GET .../runs/{id}`) completam a vista. Build (`npx vite build`) limpo.

---

## 9. Contas técnicas — o que foi feito, e porque menos do que o Report 2 previa

Uma conta técnica real foi criada **através do fluxo de registo normal** (sem bypass): registo
real (`POST /api/register`), token de confirmação **lido da base de dados** (não há inbox real
disponível neste ambiente de validação) e usado no verdadeiro `GET /api/auth/verify-email` — o
mesmo código que um clique num e-mail real executaria, só com o token obtido de outra forma.
Login real, JWT real. Credenciais guardadas em `testing/.tech-password.local` (fora do git, mesmo
padrão de `ptdot-ops-private.env`).

**O que não foi necessário, ao contrário do proposto no Report 2**: nenhuma lista de
configuração de "contas técnicas conhecidas", nenhum `is_technical`. A separação já está
garantida pelo `test_run_id` (Secção 2) em todo o tráfego que o agente gera — autenticado ou não.
Uma conta técnica aqui não é mais do que "uma conta real, usada só por este agente" — não precisa
de ser marcada em lado nenhum para as métricas ficarem corretamente separadas.

---

## 10. Simplified Local Architecture (confirmada pela implementação)

```
testing/synthetic.js, testing/load.js  (k6, novo, fora dos 4 repositórios)
        │ ProcessBuilder (TestRunProcessManager)
        ▼
portugal-na-mao-api :8085  — RequestLoggingFilter valida X-Test-Agent-Secret,
                              tagga api_request_log + user_activity_log com test_run_id
        │ leitura (EnvironmentService, já existente)
        ▼
pt-operations-api — pt.ptops.testing (novo: TestRunnerController/ProcessManager/Repository)
                     + pt.ptops.observability.ApiRequestLogService.getSummaryForTestRun (novo método)
                     pt_operations.test_run (V10, única tabela nova)
        ▼
pt-operations-fe — TestingSection.jsx (novo separador), reutiliza CategoryBarChart.jsx
```

---

## 11. Deferred Capabilities (confirmadas, inalteradas desde o Report 2)

Agendamento automático, alertas por e-mail, deployment do PT Operations, execução contra
produção, perfis de carga de escrita, botão "remoto" — nenhum destes foi tocado, todos
permanecem fora de âmbito tal como decidido. Novo nesta ronda: a correção do bug da Secção 1.1
também fica deliberadamente fora de âmbito.

---

## 12. Alternative Proposals / achados não pedidos explicitamente

1. **Eliminação da conta/lista "técnica"** (Secção 9) — simplificação não pedida, decorre
   diretamente de implementar e perceber que o `test_run_id` já resolve o problema por si só.
2. **`endpointStats` como quebra por passo** (Secção 4) — reaproveitamento que só ficou óbvio ao
   implementar; o Report 2 ainda imaginava precisar de uma tabela `synthetic_run_step` para isto.
3. **Bug do `TripService.createTrip`** (Secção 1.1) — achado real, não antecipado, registado
   para decisão do André, não corrigido aqui.

---

## 13. Open Questions

1. **Corrigir o bug da Secção 1.1?** Hoje nenhuma viagem nova pode ser criada em local. Fora do
   âmbito desta feature, mas provavelmente deve ser a próxima prioridade, independentemente do
   Testing.
2. **Restart do `pt-operations-api` do André**: a instância local que já estava a correr
   (porta 8090, não tocada por esta sessão) não tem as variáveis novas
   (`PTOPS_TESTING_SCRIPTS_DIR`/`TEST_AGENT_SECRET`/`TECH_USER_*`/`TEST_TRIP_ID`/`K6_BINARY`) —
   precisa de ser reiniciada com elas para a tab "Testing" funcionar na sessão normal dele. Ver
   Secção 16 para os valores exatos.
3. **Perfis de carga de escrita e limpeza de dados de teste** — continuam fora desta ronda,
   como já estava decidido.

---

## 14. Final Recommendation

Implementação considerada **completa e validada para este alcance** (Synthetic Agent + Load
Agent, execução manual local, histórico, separação automática de dados). Próximo passo natural,
quando o André quiser: decidir sobre o bug da Secção 1.1, e só depois considerar agendamento
automático/alertas (já arquitetados para não exigirem reescrita, nunca implementados).

---

## 15. Ficheiros alterados

**`portugal-na-mao-api`**: Novo — `V104__test_run_id_columns.sql`, `TestAgentContext.java`.
Modificado — `RequestLoggingFilter.java`, `ApiRequestLogService.java` (observability),
`UserActivityLogService.java`, `SecurityConfig.java`, `application.yml`.

**`pt-operations-api`**: Novo — `V10__create_test_run.sql`, pacote `pt.ptops.testing/`
(`TestRunRecord`, `TestRunRepository`, `TestRunProcessManager`, `TestRunnerController`,
`TestRunStartedDto`, `TestRunStatusDto`, `TestRunDetailDto`, `LoadTestRequestDto`). Modificado —
`pt.ptops.observability.ApiRequestLogService.java` (método novo + refactor de
`computeSummary`), `application.yml`.

**`pt-operations-fe`**: Novo — `TestingSection.jsx`. Modificado — `App.jsx`, `Sidebar.jsx`,
`lib/api.js`.

**`portugal-workspace` (raiz)**: Novo — `testing/` (`synthetic.js`, `load.js`, `README.md`, mais
`.env.local`/`.tech-password.local`, ambos gitignored), este relatório. Modificado —
`LAUNCH_1_0_REPORT.md` (entrada 54, só a parte de `portugal-na-mao-api`).

Nenhum ficheiro de Analytics/App Health existente foi alterado no seu comportamento — só lido de
forma nova (`getSummaryForTestRun`) ou estendido de forma aditiva (coluna nova, sempre nullable).

---

## 16. Como retomar — valores exatos para o André

Para a tab "Testing" funcionar na sessão normal (`pt-operations-api` na porta 8090,
`pt-operations-fe` já a correr), reiniciar `pt-operations-api` com estas variáveis adicionais
(além das já habituais, incluindo `PTOPS_AUTH_*`):

```
TEST_AGENT_SECRET=<conteúdo de testing/.env.local>
PTOPS_TESTING_SCRIPTS_DIR=/Users/andre.mendonca/IdeaProjects/portugal-workspace/testing
K6_BINARY=/opt/homebrew/bin/k6
TECH_USER_EMAIL=synthetic.monitor.ptdotmao@gmail.com
TECH_USER_PASSWORD=<primeira linha de testing/.tech-password.local>
TEST_TRIP_ID=01372064-ddaf-4796-922d-a030062dfebd
```

E `portugal-na-mao-api` local precisa de `TEST_AGENT_SECRET` (o mesmo valor) para reconhecer o
tráfego de teste — sem isto, os agentes continuam a funcionar, só sem marcação alguma.

---

## 17. Git Status

**Antes desta sessão** (capturado no início): os três repositórios de código limpos; só
`PT-portugal-na-mao-fe` e a raiz do workspace com alterações pré-existentes de sessões
concorrentes (não tocadas).

**No final** (nesta sessão, validações de build feitas, backends locais iniciados e já
parados):

```
portugal-na-mao-api:
 M src/main/java/pt/dot/application/security/SecurityConfig.java
 M src/main/java/pt/dot/application/service/activity/UserActivityLogService.java
 M src/main/java/pt/dot/application/service/observability/ApiRequestLogService.java
 M src/main/java/pt/dot/application/service/observability/RequestLoggingFilter.java
 M src/main/resources/application.yml
?? src/main/java/pt/dot/application/service/observability/TestAgentContext.java
?? src/main/resources/db/migration/V104__test_run_id_columns.sql
 M src/main/java/pt/dot/application/service/search/FuzzyNameMatcher.java   ← sessão concorrente, não tocado (ver LAUNCH_1_0_REPORT entrada 51)

pt-operations-api:
 M src/main/java/pt/ptops/observability/ApiRequestLogService.java
 M src/main/resources/application.yml
?? src/main/java/pt/ptops/testing/
?? src/main/resources/db/migration/V10__create_test_run.sql

pt-operations-fe:
 M src/App.jsx
 M src/components/Sidebar.jsx
 M src/lib/api.js
?? src/components/TestingSection.jsx

PT-portugal-na-mao-fe: só alterações pré-existentes de sessões concorrentes (MobileHeader.jsx,
TripsPanel.jsx, AppContext.jsx, etc. — ver LAUNCH_1_0_REPORT entradas 47/52), nenhuma tocada por
esta sessão.

portugal-workspace (raiz):
 M .gitignore   (testing/.tech-password.local não estava coberto pelo padrão .env.* existente —
                 achado durante esta sessão, corrigido antes de terminar)
 M LAUNCH_1_0_REPORT.md   (entrada 54)
?? PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_PLAN.md    (Report 1, de ronda anterior)
?? PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_REPORT_2.md (Report 2, de ronda anterior)
?? PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_REPORT_3.md (este ficheiro)
?? testing/   (synthetic.js, load.js, README.md, .env.local e .tech-password.local gitignored)
```

Nada staged, nada commitado, nada enviado. Produção não tocada em momento algum — toda a
validação ao vivo correu contra bases de dados e backends **locais**, iniciados e depois
explicitamente parados por esta sessão (PIDs confirmados antes de terminar, para não deixar
processos a correr sem o conhecimento do André). A instância `pt-operations-api` que já estava a
correr (porta 8090, do próprio André) nunca foi tocada.
