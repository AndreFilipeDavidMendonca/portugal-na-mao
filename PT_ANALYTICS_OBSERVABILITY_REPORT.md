# PT Analytics & Observability — Relatório (Fase 1 + Fase 2)

Data: 2026-10-08/09. Âmbito original (2026-10-08): evoluir o sistema de Analytics & Observability
do Portugal na Mão, reutilizando o que já existe nos três componentes (API `.pt`, Frontend `.pt`,
PT Operations). **Atualizado em 2026-10-09**: validação completa da Fase 1 (desta vez com o PT
Operations a correr mesmo ao vivo, local+produção) e implementação da Fase 2 — dashboards de App
Health e Product Analytics integrados no PT Operations. Ver §9 em diante para o trabalho desta
ronda; §1-8 ficam como registo histórico da ronda de 2026-10-08.
Regras seguidas (as duas rondas): nenhum commit/push/deploy, produção não tocada (só lida,
nunca escrita), nenhum runner executado, nenhum dado existente alterado ou eliminado,
funcionalidades atuais preservadas. Tudo implementado e testado só em ambiente local.

---

## 1. Estado atual — o que já existia (antes desta sessão)

A investigação encontrou uma base **muito mais avançada do que o pedido assumia** — grande parte
da "Fase 2" (dashboards) já estava construída para um dos dois tipos de log previstos.

### 1.1 API `.pt` (`portugal-na-mao-api`)

- **`user_activity_log`** (tabela `V67`, serviço `UserActivityLogService`) — já registava
  `LOGIN`, `REGISTER`, `POI_VIEW`, `DISTRICT_VIEW`, `MUNICIPALITY_VIEW`, `BUSINESS_CREATED`,
  cada um com FK opcional para `poi`/`district`/`municipality`/`trip`. Padrão "best-effort":
  insert via `JdbcTemplate` puro (nunca a entity manager do Hibernate), nunca propaga falha ao
  request que o disparou.
- **Nada** de logs técnicos/performance (request, endpoint, método, tempo de execução, status
  HTTP, correlação) — confirmado por grep exaustivo (`Interceptor`, `Filter`, `Aspect`,
  `request_log`, `MDC`, `correlationId`): zero resultados. `spring-boot-starter-actuator` está
  nas dependências mas sem qualquer configuração própria.

### 1.2 Frontend `.pt` (`PT-portugal-na-mao-fe`)

- **Nada** de tracking de eventos de utilizador — zero resultados para `analytics`,
  `trackEvent`, `gtag`, `posthog`, etc. em todo o `src/`. Todos os eventos de `user_activity_log`
  acima são disparados **server-side**, como efeito colateral de um GET já existente (ex.
  `POI_VIEW` dispara quando `GET /api/pois/{id}` é chamado) — nunca por um pedido explícito do
  frontend.

### 1.3 PT Operations (`pt-operations-api` + `pt-operations-fe`)

Achado mais significativo da investigação: **já existe uma secção de dashboard completa para
`user_activity_log`**, não apenas uma tabela de consulta:

- Backend: `UserActivityLogRelationshipController`/`Service` — `GET
  /api/{env}/relationships/user-logs` (linhas paginadas), `.../summary` (agregações: total,
  distribuição geográfica em cascata distrito→município→categoria→POI, distribuição por
  categoria, por tipo de utilizador, por tipo de evento), `.../filters` (opções). Lê via
  `EnvironmentService.resolve(env)` — o mesmo `JdbcTemplate` local/produção (read-only) que todas
  as outras vistas de "Relacionamentos" já usam.
- Frontend: `LogsDashboardSection.jsx` (gráficos — `PieChart`/`CategoryBarChart` — montada na tab
  "Dashboard"), `UserLogsRelationshipView.jsx` + `UserLogFilters.jsx` (tabela linha-a-linha, tab
  "Relacionamentos").

Ou seja: para o lado "eventos de utilização", a Fase 2 completa (dashboards, filtros, consulta)
**já estava feita**. Para o lado "logs técnicos/performance", **nada existia** em nenhum dos três
componentes.

---

## 2. O que foi reutilizado

- **`UserActivityLogService`** (API) — estendido, não substituído: mesmo padrão best-effort,
  mesma tabela, novos tipos de evento e um novo método auxiliar de serialização JSON.
- **`EnvironmentService.resolve(env)`** (PT Operations) — o novo serviço de logs técnicos lê
  exatamente da mesma forma que `UserActivityLogRelationshipService`, sem nenhum mecanismo novo
  de ligação à BD.
- **Padrão de DTOs/Controller "Relationship"** (PT Operations) — `ApiRequestLogController`/
  `Service`/DTOs seguem byte a byte a forma de `UserActivityLogRelationshipController` (rows
  paginadas + summary + filters), só num package novo (`pt.ptops.observability`, ver §4.3).
  `getRows`/`getSummary` reaproveitam o mesmo padrão de `WHERE` dinâmico com `List<Object>
  params`.
- **`LogsDashboardSection.jsx`** (PT Operations FE) — **não foi alterada**, e já mostra
  automaticamente os 5 novos tipos de evento (`SEARCH`, `FILTER_APPLIED`, `FAVORITE_ADDED`,
  `TRIP_CREATED`, `TOUR_STARTED`) nos seus gráficos existentes, porque esses gráficos já agrupam
  por `event_type`/`SELECT DISTINCT event_type` sem lista fixa nenhuma — zero trabalho extra para
  os novos eventos aparecerem ali.
- **`UserLogFilters.jsx`/estilo visual** (PT Operations FE) — `ApiPerformanceSection.jsx` copia a
  mesma paleta de classes Tailwind (`LABEL_CLASS`/`SELECT_CLASS`) e o mesmo seletor de Ambiente,
  para a secção nova não destoar visualmente da existente.
- **`apiFetch`/`jsonFetch`** (Frontend `.pt`, `lib/api.js`) — `trackEvent()` novo reaproveita-os
  tal e qual (mesma gestão de token/erros), só com `.catch(() => {})` adicional para nunca
  propagar falha de analytics ao chamador.

---

## 3. Arquitetura integrada

```
┌─────────────────────┐     POST /api/events (SEARCH, FILTER_APPLIED)
│  Frontend .pt        │ ─────────────────────────────────────────┐
│  (trackEvent)         │                                          │
└─────────┬────────────┘                                          ▼
          │ toda chamada a /api/**                      ┌───────────────────────┐
          ▼                                              │  EventsController      │
┌─────────────────────┐   RequestLoggingFilter     ┌────▶│  (valida, best-effort) │
│  API .pt              │ ──(@Async, não bloqueia)──┘     └───────────┬───────────┘
│  Spring Security       │                                           │
│  filter chain          │                                           ▼
└─────────┬──────────────┘                         ┌──────────────────────────────┐
          │ side effects de endpoints existentes    │  UserActivityLogService       │
          │ (favoritar, criar viagem, iniciar tour) │  (best-effort, JdbcTemplate)  │
          └─────────────────────────────────────────▶ user_activity_log            │
                                                      │  (eventos de utilização)      │
          ApiRequestLogService (@Async) ─────────────▶ api_request_log              │
                                                      │  (logs técnicos)              │
                                                      └───────────────┬───────────────┘
                                                                      │ leitura read-only
                                                                      ▼
                                              ┌──────────────────────────────────┐
                                              │  PT Operations API                 │
                                              │  EnvironmentService.resolve(env)   │
                                              │  ApiRequestLogService (novo)       │
                                              │  UserActivityLogRelationshipService│
                                              └───────────────┬────────────────────┘
                                                               ▼
                                              ┌──────────────────────────────────┐
                                              │  PT Operations FE                  │
                                              │  LogsDashboardSection (existente)  │
                                              │  ApiPerformanceSection (novo)       │
                                              └──────────────────────────────────┘
```

**Decisão central: duas tabelas, nunca uma.** `api_request_log` (técnico — um row por pedido
HTTP) e `user_activity_log` (produto — um row por ação de utilizador com significado) respondem
a perguntas diferentes ("o servidor respondeu depressa?" vs. "o utilizador viu/fez isto?") e têm
políticas de retenção/sensibilidade diferentes. Misturá-las obrigaria a filtrar sempre um tipo
para responder ao outro — exatamente o que a regra "separar logicamente logs técnicos e eventos
de utilização" do pedido original pede para evitar.

**Dois caminhos de recolha no lado do produto**, não um só:
1. **Server-side (preferido sempre que possível)** — `POI_VIEW`, `FAVORITE_ADDED`,
   `TRIP_CREATED`, `TOUR_STARTED` são registados pelo próprio serviço que já trata o pedido real
   (`FavoriteService.add`, `TripService.createTrip`, `TripTourService.startSession`). Mais
   fiável (não depende do frontend chamar nada extra nem de bloqueadores de terceiros) e mais
   simples de auditar (o mesmo código que persiste a ação regista o evento).
2. **Client-reported, via `POST /api/events`** — só para `SEARCH` e `FILTER_APPLIED`, as duas
   interações que **não têm nenhum pedido backend próprio** a que se possa agarrar (pesquisar é
   só `GET /api/search`, que já existe independentemente de ser ou não "um evento que interessa
   registar"; aplicar filtros é puramente client-side). Endpoint único, genérico mas com
   allow-list de tipos (nunca um sink livre), nunca exige sessão.

---

## 4. O que foi implementado (Fase 1)

### 4.1 API `.pt` — Logs e Performance

- **`V103__api_request_log_and_activity_details.sql`** — nova tabela `api_request_log`
  (method, path, status, duration_ms, user_id nullable, correlation_id, is_error, created_at) +
  4 índices (created_at, path, status, user_id); e uma coluna nova `details JSONB` nullable em
  `user_activity_log` (para `SEARCH`/`FILTER_APPLIED`, que não têm FK única a que se agarrem).
- **`RequestLoggingFilter`** (`service/observability/`) — um `OncePerRequestFilter` registado no
  chain principal de Spring Security via `addFilterAfter(requestLoggingFilter,
  JwtAuthFilter.class)` (`SecurityConfig`), para correr depois da autenticação já resolvida
  (`SecurityContextHolder` populado) mas ainda dentro do chain (contexto ainda não limpo). Mede
  duração, gera/propaga `X-Request-Id` (correlação — também colocado em MDC, para cruzar com os
  logs de consola), nunca lê corpo/query string/headers (só path, nunca `?token=...`). Escreve
  via `ApiRequestLogService.recordAsync` (`@Async`, a app já tinha `@EnableAsync`) — a thread do
  pedido nunca espera pelo insert.
- **`ActivityEventType`** — 5 valores novos: `SEARCH`, `FILTER_APPLIED`, `FAVORITE_ADDED`,
  `TRIP_CREATED`, `TOUR_STARTED`. **Deliberadamente sem `MAP_INTERACTION`** — ver §6.
- **`UserActivityLogService`** — 5 métodos novos (`logSearch`/`logFilterApplied` com `details`
  JSON; `logFavoriteAdded`/`logTripCreated`/`logTourStarted`), mesma escolha cuidadosa de
  `@Transactional(REQUIRES_NEW)` vs. transação do chamador já documentada no ficheiro original
  (uma entidade nova criada na mesma transação não pode ser referenciada por uma segunda
  transação independente antes de committar).
- **`EventsController`** (`POST /api/events`, `permitAll`) — único ponto de entrada para eventos
  reportados pelo cliente; `type` validado contra allow-list (`SEARCH`/`FILTER_APPLIED`), nunca
  um sink genérico. `query` truncado a 200 caracteres, `categories` a 20 itens.
- **`FavoriteService.add`**, **`TripService.createTrip`**, **`TripTourService.startSession`** —
  cada um ganhou uma chamada de log no fim do caminho de sucesso (nunca no "já existia"/early
  return, para não duplicar).

### 4.2 Frontend `.pt` — User Experience

- **`trackEvent(payload)`** (`lib/api.js`) — fire-and-forget, nunca `await`ado pelos chamadores,
  `.catch(() => {})` próprio: uma falha de analytics nunca é visível ao utilizador.
- **`GlobalInlineSearch.jsx`** — `trackEvent({type:"SEARCH", query, resultCount})` disparado
  **uma vez por pesquisa resolvida** (dentro do `.then()` da resposta já com debounce de 200ms
  aplicado), nunca por keystroke.
- **`FilterSheet.jsx`** — `trackEvent({type:"FILTER_APPLIED", categories})` disparado no botão
  "Resultados" (ponto de aplicação), nunca por toggle individual de categoria.
- Favoritos, viagens, Tour Guiado: **nenhuma alteração ao frontend** — já chamam os endpoints
  reais (`POST /api/favorites`, `POST /api/trips`, início de sessão de tour) que agora os
  registam no backend sozinhos.

### 4.3 PT Operations — consulta

- **`pt.ptops.observability`** (novo package, `pt-operations-api`) — `ApiRequestLogController`
  (`GET /api/{env}/observability/requests[,/summary,/filters]`), `ApiRequestLogService` (mesmo
  padrão `EnvironmentService` + `WHERE` dinâmico), 6 DTOs. Filtros: período (`from`/`to`),
  endpoint (contains), só-erros, pesquisa por utilizador/correlação.
- **`ApiPerformanceSection.jsx`** (novo, `pt-operations-fe`) — montado em `DashboardSection.jsx`,
  logo a seguir à secção de Logs já existente. Cartões de sumário (total, média, P95, P99, taxa
  de erro), tabela "endpoints mais lentos" e tabela de requests recentes com highlight visual
  para erros. Deliberadamente **tabelas + números, não gráficos** nesta fase — o pedido pede para
  "privilegiar tabelas e consultas simples" na Fase 1; `LogsDashboardSection.jsx` ao lado já
  prova que adicionar gráficos depois é trivial.
- **Sem rota/nav nova** — ambas as secções vivem na tab "Dashboard" já existente, sem alterar a
  navegação lateral.

### 4.4 Validação feita (tudo local)

- `mvn -o compile` limpo em `portugal-na-mao-api` e `pt-operations-api`.
- `CI=true npx craco build` limpo em `PT-portugal-na-mao-fe`; `npx vite build` limpo em
  `pt-operations-fe`.
- Backend `.pt` reiniciado localmente para aplicar a `V103` (`Successfully applied 1 migration
  ... now at version v103`) — confirmado ao vivo:
  - `GET /api/districts` devolve `X-Request-Id` e grava uma linha em `api_request_log`
    (`status=200`, `duration_ms` real, `is_error=false`).
  - `POST /api/events` (`SEARCH` e `FILTER_APPLIED`, sem sessão) devolve `204` e grava em
    `user_activity_log` com `details` corretamente serializado (`{"query": "castelo de vide",
    "resultCount": 5}` / `{"categories": ["castle","viewpoint"]}`).
  - `GET /api/pois/{id}` continua a gravar `POI_VIEW` corretamente (`details` fica `NULL`, sem
    regressão nos 6 tipos de evento já existentes).
  - As queries de sumário (`percentile_cont`, `FILTER (WHERE is_error)`, `GROUP BY method, path`)
    foram corridas diretamente via `psql` contra os dados reais recolhidos — resultados
    coerentes (P50/P95/P99, contagem por endpoint).
- **Não validado ao vivo**: `pt-operations-api`/`pt-operations-fe` em execução real — faltam
  `PTOPS_AUTH_USERNAME`/`PASSWORD`/`PTDOT_INTERNAL_API_SECRET` neste ambiente (não encontrados em
  nenhum `.env` nem no `~/.zshrc`). Mitigado por: (1) o novo código segue exatamente o padrão de
  `UserActivityLogRelationshipService`, já em produção; (2) as queries SQL que esse serviço
  executaria foram validadas diretamente via `psql`, como acima. Recomenda-se correr
  `pt-operations-api`/`fe` localmente com as credenciais certas antes de considerar esta parte
  "testada ao vivo". Favoritos/viagens/Tour Guiado também não testados ao vivo via browser
  (exigem sessão autenticada; mitigado pelo facto de `POI_VIEW`, que usa o mesmo mecanismo
  exato, estar confirmado a funcionar).

---

## 5. Preparação para a Fase 2 (sem construir dashboards)

- **`ApiRequestLogSummaryDto`** já devolve `avgDurationMs`, `p50/p95/p99DurationMs`,
  `errorRate`, `slowestEndpoints` (top 10) e `byStatus` — exatamente os números que a secção
  "Performance" da Fase 2 pede, só sem gráficos à volta.
- **`UserLogSummaryDto`** (já existente) já devolve distribuição geográfica, por categoria, por
  tipo de utilizador e por tipo de evento — cobre "funcionalidades mais usadas" (via
  `event_type`), "POIs/categorias mais explorados" (já existia) **e agora também "pesquisas mais
  frequentes"** (`SEARCH.details->>'query'`, não agregado ainda, mas a coluna já existe e é
  consultável).
- **Índices** pensados para os padrões de query da Fase 2 desde já (`created_at DESC` para
  séries temporais, `path`/`status` para "endpoint com maior latência"/"taxa de erro").
- **O que falta mesmo para a Fase 2** (não implementado agora, de propósito): gráficos de série
  temporal (evolução por período) para `api_request_log`; normalização de `path` para padrão de
  rota (`/api/pois/{id}` em vez de `/api/pois/69020` — ver §6); retenção automática (ver §6).

---

## 6. Recomendações futuras

1. **Retenção** — nenhuma purga automática foi implementada (evitar correr qualquer runner nesta
   sessão, por instrução explícita). `api_request_log` cresce ~1 linha por pedido `/api/**`;
   recomenda-se um job simples (SQL `DELETE ... WHERE created_at < now() - interval '90 days'`,
   corrido manualmente ou agendado fora desta sessão) antes de ir para produção. `user_activity_log`
   é mais valioso a longo prazo (histórico de produto) — reter mais tempo ou nunca purgar.
2. **Normalização de `path`** — hoje `api_request_log.path` é o URI literal
   (`/api/pois/69020`), não o padrão de rota (`/api/pois/{id}`). Para "endpoint mais lento"
   agregar de forma útil (em vez de uma linha por POI individual), vale a pena capturar o
   `HandlerMapping` pattern no filtro (Spring expõe isto via
   `HttpServletRequest.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE)`,
   disponível só depois do `DispatcherServlet` resolver a rota — exige mover a leitura para
   depois do `chain.doFilter()`, o que já é o caso aqui, por isso é uma alteração pequena).
3. **`MAP_INTERACTION`** — deliberadamente não implementado. Pan/zoom do mapa é altíssimo volume
   e baixo sinal por evento individual; se vier a fazer sentido, recomenda-se um evento
   agregado/throttled (ex. "sessão de exploração do mapa: N interações, bbox final, duração"),
   não um row por `moveend`.
4. **Retenção/anonimização RGPD** — `user_id` em ambas as tabelas é `ON DELETE SET NULL`
   (já herdado de `V67`), por isso apagar uma conta já limpa a referência automaticamente.
   Recomenda-se documentar isto explicitamente na política de privacidade da app, já que agora
   há mais dados comportamentais recolhidos (pesquisas, filtros).
5. **Separar sessões do PT Operations das métricas públicas** — o próprio uso do PT Operations
   (consultar `/api/{env}/observability/requests`) passa pela API real quando `env=prod`? **Não**
   — `EnvironmentService` liga-se diretamente à BD de produção via `JdbcTemplate` (leitura
   direta, nunca via HTTP à API pública), por isso consultar logs de produção a partir do PT
   Operations nunca gera tráfego novo em `api_request_log`/`user_activity_log`. Este risco (pedido
   explicitamente a evitar: "não contaminar métricas públicas") já está estruturalmente
   impossível pela própria arquitetura existente, não por nada feito nesta sessão.
6. **Métricas adicionais sugeridas** (não pedidas explicitamente, candidatas a Fase 2):
   - **Funil de pesquisa → visita**: `SEARCH` seguido de `POI_VIEW` dentro de N segundos, para
     medir se a pesquisa está a encontrar o que as pessoas procuram.
   - **Taxa de conversão de viagem**: `TRIP_CREATED` → `TOUR_STARTED` — quantas viagens criadas
     chegam a ser efetivamente usadas no terreno.
   - **Latência por `userId` vs. anónimo** — útil para perceber se o JWT/autenticação em si
     adiciona latência perceptível.
   - **Alertas simples** (fora do âmbito desta fase): um threshold (ex. taxa de erro > 5% numa
     janela de 15 min) consultável a pedido via o mesmo endpoint de summary, sem precisar de
     infraestrutura de alerting nova.

---

## 7. Ficheiros alterados (ronda 2026-10-08, Fase 1)

**API `.pt`** (`portugal-na-mao-api`):
- Novo: `src/main/resources/db/migration/V103__api_request_log_and_activity_details.sql`
- Novo: `src/main/java/pt/dot/application/service/observability/{ApiRequestLogService,RequestLoggingFilter}.java`
- Novo: `src/main/java/pt/dot/application/api/event/EventsController.java`
- Novo: `src/main/java/pt/dot/application/api/dto/event/ClientEventRequestDto.java`
- Modificado: `ActivityEventType.java`, `UserActivityLogService.java`, `SecurityConfig.java`,
  `FavoriteService.java`, `TripService.java`, `TripTourService.java`

**PT Operations API** (`pt-operations-api`):
- Novo: `src/main/java/pt/ptops/observability/` (`ApiRequestLogController`, `ApiRequestLogService`,
  `ApiRequestLogRowDto`, `ApiRequestLogRowsDto`, `ApiRequestLogSummaryDto`,
  `ApiRequestLogFilterOptionsDto`, `EndpointStatDto`, `StatusCountDto`)

**PT Operations Frontend** (`pt-operations-fe`):
- Novo: `src/components/ApiPerformanceSection.jsx`
- Modificado: `src/components/DashboardSection.jsx`, `src/lib/api.js`

**Frontend `.pt`** (`PT-portugal-na-mao-fe`):
- Modificado: `src/lib/api.js` (`trackEvent`), `src/components/shared/GlobalInlineSearch.jsx`,
  `src/components/map/FilterSheet.jsx`

Nenhum ficheiro fora destes quatro repositórios foi tocado. Nenhum dado existente foi alterado —
só inserções novas nas duas tabelas, e uma coluna nova (`details`, nullable) em
`user_activity_log`.

---

## 8. Git status final (ronda 2026-10-08, sem commit)

Ver secção correspondente na resposta desta sessão — os quatro repositórios têm só os ficheiros
listados acima como `modified`/`untracked`; nada staged, nada commitado, nada enviado. **Nota**:
esta ronda acabou por ser commitada e enviada para `origin/main` nos 4 repositórios, a pedido
explícito do André já na conversa (fora desta ronda de validação/Fase 2) — ver `git log` de cada
repo para os hashes; nada disso foi feito como parte desta ronda de trabalho.

---

## 9. Validação da Fase 1 (ronda 2026-10-09)

Pedido explícito do André: validar antes de construir. Revisão de código + **PT Operations a
correr mesmo ao vivo** (não só via `psql`, como na ronda anterior) — credenciais encontradas em
`portugal-na-mao-api/ptdot-ops-private.env` (`PTOPS_AUTH_USERNAME`/`PASSWORD`,
`PTDOT_INTERNAL_API_SECRET`), não nos `.env` do próprio `pt-operations-api`.

**Achado #1 — ruído de infraestrutura dominava as métricas.** `/api/internal/memory-video-jobs/claim`
(polling server-to-server, ~1x/5s) respondia por **98,7% de todos os pedidos logados** (459 de
465 numa sessão local tranquila) — exatamente o "diferenças no volume de requests produzem
interpretações enganadoras" que a Fase 2 pede para evitar. Confirmado via `psql` direto antes de
qualquer dashboard existir. Corrigido em `RequestLoggingFilter.shouldNotFilter` — `/api/internal/**`
deixou de ser logado (ver §11).

**Achado #2 — consultar "Produção" antes da migration lá chegar rebentava com 500 cru.** `api_request_log`
(V103) só existe localmente — a migration nunca foi deployada (por desenho: "não alterar
produção"). A tentativa do PT Operations de ler essa tabela em produção devolvia
`BadSqlGrammarException`/`relation "api_request_log" does not exist`, propagado como `500
Internal Server Error` sem mensagem — e o frontend, sem `.catch()`, ficava preso em "A carregar…"
para sempre. Corrigido em dois sítios (ver §11): `ApiRequestLogService.safe()` converte o erro
específico num `404` com mensagem clara; `ApiPerformanceSection`/`LogsDashboardSection` passaram
a ter tratamento de erro visível.

**Achado #3 — mensagens de `ResponseStatusException` eram sempre descartadas.** Mesmo depois do
Achado #2, o corpo da resposta só tinha `{"status":404,"error":"Not Found"}` — sem a mensagem
customizada. Causa: Spring Boot, por omissão, remove `message` do corpo de erro a menos que
`server.error.include-message: always` esteja configurado — nunca estava. Afeta **todos** os
`ResponseStatusException` já existentes no `pt-operations-api` (ex.
`EnvironmentService.resolve`'s "Ambiente de produção não está configurado"), não só o código
novo desta sessão — mas só se tornou visível ao validar o `404` novo do Achado #2. Corrigido
globalmente (ver §11) — mensagens são escritas pelos próprios programadores (nunca stack traces
crus), e esta é uma ferramenta interna/loopback-only, por isso é seguro ativar.

**Achado #4 — o universo de dados local já tem volume não-orgânico.** `user_activity_log` tem
505.538 eventos, maioritariamente `POI_VIEW`, com uma concentração implausível para uso real:
distrito "Guarda" com 368.849 visualizações, POI "Miradouro da Penha d'Águia" com 132.654. Isto
**não é tráfego de utilizadores reais** — parece resultado de um script/teste de carga de uma
sessão anterior (não desta ronda, não investigado a fundo — fora do âmbito "só corrigir
problemas desta implementação"). Registado aqui para que ninguém leia "POIs mais consultados"
ou "atividade por distrito" como comportamento real de utilizadores sem este aviso — ver
recomendação em §14.

**Confirmado sem problemas** (não exigiu correção): nenhuma duplicação de linhas em
`api_request_log` (verificado por `correlation_id` único por pedido); nenhuma duplicação de
eventos em `user_activity_log` (ex. `FAVORITE_ADDED` só dispara no ramo "favorito novo", nunca
no "já era favorito"); permissões do PT Operations confirmadas (`401` sem Basic Auth, `200` com
as credenciais corretas, em ambos os ambientes).

---

## 10. Fase 2 — App Health (Performance & Observability)

Secção `ApiPerformanceSection.jsx`, reescrita (mantendo o nome do ficheiro e o ponto de
montagem da Fase 1 — `DashboardSection.jsx`, logo após a secção de atividade de utilizadores).

**Indicadores**: total de requests, média, mínimo, máximo, P50/P95/P99, taxa de erro — todos num
único pedido `/summary` (uma query de `avg`/`min`/`max`/`percentile_cont` por filtro, não 7
pedidos separados).

**Gráficos**: evolução temporal de requests + duração média (`TimeSeriesChart.jsx`, novo — SVG
inline, sem biblioteca, mesmo princípio dos gráficos já existentes); evolução de erros HTTP
(só aparece se houver algum erro no universo, para não ocupar espaço com um gráfico vazio);
distribuição de tempos de resposta (histograma de 6 buckets fixos); distribuição por status
HTTP — os dois últimos reaproveitam `CategoryBarChart.jsx` já existente.

**Rankings**: mais utilizados, mais lentos, mais rápidos — as 3 tabelas vêm da **mesma** query
(`endpointStats`, top-20 por volume), ordenada 3 formas diferentes no frontend, em vez de 3
pedidos HTTP separados. "Mais lentos"/"mais rápidos" só consideram endpoints com ≥3 pedidos no
universo filtrado — descartar amostras de 1 pedido é precisamente o que o Achado #1/a regra
"evitar interpretações enganadoras" pede.

**Filtros**: ambiente, período (`PeriodFilter.jsx`, novo, partilhado com a Fase 2 de Product
Analytics — presets fixos 24h/7 dias/30 dias/Tudo, nunca um calendário livre, consistente com
"tabelas e consultas simples"), método HTTP, status code, endpoint (texto livre + `<datalist>`
das rotas já vistas), só-erros, pesquisa por utilizador/correlação.

**Tabela de registos individuais** mantida da Fase 1 (25 mais recentes) — "possibilidade de
consultar os registos que originam os indicadores", pedido explícito da Fase 2.

---

## 11. Correções aplicadas (Achados #1-#3 do §9)

- **`RequestLoggingFilter.shouldNotFilter`** (`portugal-na-mao-api`) — `/api/internal/**`
  excluído do logging na fonte. Validado: janela de 10s pós-reinício sem nenhuma linha desse
  path (antes: ~1 a cada 5s). Um row residual isolado foi observado mesmo após o fix, exatamente
  no instante do restart — não investigado a fundo (impacto desprezível, 1 linha vs. centenas),
  registado como limitação conhecida.
- **`ApiRequestLogService.safe()`** (`pt-operations-api`) — novo wrapper: `DataAccessException`
  cuja causa raiz contém `"api_request_log"` + `"does not exist"` vira
  `ResponseStatusException(404, "Logs técnicos (api_request_log) ainda não existem neste
  ambiente — migration V103 pendente de deploy.")`; qualquer outra `DataAccessException`
  continua a propagar como erro real (não esconde bugs genuínos).
- **`server.error.include-message: always`** (`pt-operations-api/application.yml`) — global,
  afeta todos os `ResponseStatusException` da app, não só os novos.
- **`ApiPerformanceSection.jsx` / `LogsDashboardSection.jsx`** (`pt-operations-fe`) — `.catch()`
  adicionado ao `Promise.all` de carregamento (antes: ausente, ficava preso em "A carregar…" sem
  fim em caso de erro); erro mostrado num banner vermelho; estado anterior (`summary`/
  `timeSeries`/listas) limpo no erro, para não deixar números de um ambiente a aparecer sob o
  rótulo de outro (ex. trocar para "Produção" e continuar a ver os números de "Local" por baixo
  da mensagem de erro).

Validado ao vivo (browser, login real no PT Operations): mensagem de erro correta e específica
a aparecer ao trocar para "Produção"; números antigos desaparecem corretamente.

---

## 12. Fase 2 — Product Analytics (User Experience)

`LogsDashboardSection.jsx` **estendido, não reescrito** — os 4 gráficos da Fase 1 (onde/
categorias/utilizadores/tipo de evento) ficaram exatamente como estavam, por pedido explícito
("aproveitar os gráficos existentes... reorganizando apenas quando necessário").

**Acrescentado**:
- 4 cartões de sumário: eventos no universo, utilizadores ativos (`count(DISTINCT user_id)`),
  de contas autenticadas, anónimos — "distinguir utilizadores autenticados de anónimos quando os
  dados o permitirem", só agora com sinal real desde que `SEARCH`/`FILTER_APPLIED` (Fase 1)
  passaram a poder vir de visitantes sem sessão.
- Gráfico de evolução da atividade (eventos + utilizadores ativos por bucket de tempo).
- "Pesquisas mais frequentes" — `SEARCH.details->>'query'` agregado (novo endpoint
  `/top-searches`).
- "POIs mais consultados" — ranking direto por `POI_VIEW`, sem precisar de pré-filtrar por
  município como o chart1 existente exige (novo endpoint `/top-pois`).
- Filtro de período (`PeriodFilter.jsx`, partilhado com App Health) — os endpoints `/summary` e
  `/rows` existentes da Fase 1 ganharam `from`/`to` opcionais, aditivo, sem quebrar nenhum
  chamador existente.

**Backend** (`UserActivityLogRelationshipService`): `buildWhere` ganhou `from`/`to`; `getSummary`
ganhou `activeUsers`/`authenticatedCount`/`anonymousCount` (aditivo ao DTO); 3 métodos novos —
`getTimeSeries`, `getTopSearches`, `getTopPois`.

---

## 13. Eventos adicionais cobertos ("eventos restantes principais")

Pedido explícito do André, depois da Fase 2. 3 tipos de evento novos, mesmo padrão dos 5 da
ronda anterior (logados no próprio serviço que já trata o pedido real, nunca um pedido novo do
frontend):

| Evento | Onde é registado | Reaproveita |
|---|---|---|
| `MEMORY_ADDED` | `TripTourService.addMemory` (memória durante tour ativo) + `createStopMemory` (memória pré-tour, editor da viagem) | coluna `trip_id` já existente |
| `COMMENT_ADDED` | `PoiCommentService.add` | coluna `poi_id` já existente |
| `FEED_POST_CREATED` | `FeedService.createPost`, os dois ramos (partilha de viagem + post normal) | `details` JSONB (post não tem FK única — pode ser de POI, viagem, ou nenhum) |

**Não implementado** (deliberadamente, por tempo/escopo — ver §14): `BUSINESS_ADDED` a favoritos
de negócio, convites a participantes de viagem, likes no Feed. Candidatos óbvios para uma
próxima ronda, mesmo padrão.

**Validação**: compilação limpa (`mvn compile`); **não testado ao vivo via browser** (exigiria
criar uma viagem com tour ativo + memória, um comentário, e uma publicação no Feed — fora do
tempo desta ronda). Confiança alta por reaproveitar o mecanismo exato já validado ao vivo nesta
mesma sessão para `POI_VIEW`/`FAVORITE_ADDED` (mesma classe `UserActivityLogService`, mesmo
padrão `insertQuietly` best-effort).

---

## 14. Limitações conhecidas e recomendações (atualizado 2026-10-09)

Mantém-se tudo o que já estava no §6 (retenção, normalização de `path`, `MAP_INTERACTION`,
RGPD, métricas adicionais sugeridas). Acrescenta-se, desta ronda:

1. **Dados históricos de `user_activity_log` incluem volume não-orgânico** (Achado #4, §9) —
   antes de mostrar "POIs mais consultados"/"atividade por distrito" a alguém fora da equipa
   técnica, vale a pena perceber a origem desses ~500K eventos (script de teste? seed de dados?)
   e decidir se devem ser expurgados ou marcados, para não confundir com uso real.
2. **1 linha residual de `/api/internal/**`** ainda passou pelo filtro principal mesmo depois da
   exclusão (§11) — mecanismo exato não identificado (suspeita: janela de arranque do Spring
   Security). Impacto desprezível, não bloqueante, mas fica por explicar.
3. **`server.error.include-message: always`** é uma mudança global — vale a pena, numa próxima
   revisão de segurança do PT Operations, confirmar que nenhum `ResponseStatusException` futuro
   acabe por incluir algo sensível na mensagem (hoje nenhum inclui, mas não há nenhuma
   verificação automática disso).
4. **Eventos novos (§13) não testados ao vivo** — recomenda-se uma passagem manual (criar
   memória/comentário/post) antes de dar como fechado.
5. **`PeriodFilter` é só presets fixos** (24h/7d/30d/Tudo) — um range livre (calendário) é o
   próximo passo óbvio se os presets se mostrarem insuficientes, mas não pedido nesta fase.

---

## 15. Ficheiros alterados (ronda 2026-10-09)

**API `.pt`** (`portugal-na-mao-api`):
- Modificado: `RequestLoggingFilter.java` (exclusão `/api/internal/**`), `ActivityEventType.java`
  (3 tipos novos), `UserActivityLogService.java` (3 métodos novos), `FeedService.java`,
  `PoiCommentService.java`, `TripTourService.java` (pontos de chamada dos eventos novos).

**PT Operations API** (`pt-operations-api`):
- Modificado: `ApiRequestLogController.java`/`Service.java` (filtros método/status, `/timeseries`,
  `endpointStats`/`durationDistribution`/min/max no summary), `ApiRequestLogFilterOptionsDto.java`
  (`methods`), `ApiRequestLogSummaryDto.java` (campos novos), `UserActivityLogRelationshipController.java`/
  `Service.java` (período, `activeUsers`/autenticados/anónimos, `/timeseries`, `/top-searches`,
  `/top-pois`), `UserLogSummaryDto.java` (campos novos), `application.yml`
  (`server.error.include-message: always`).
- Novo: `DurationBucketDto.java`, `TimeBucketDto.java`, `ActivityTimeBucketDto.java`.

**PT Operations Frontend** (`pt-operations-fe`):
- Modificado: `ApiPerformanceSection.jsx` (reescrito — App Health completo), `LogsDashboardSection.jsx`
  (estendido — Product Analytics), `lib/api.js` (endpoints novos).
- Novo: `PeriodFilter.jsx`, `TimeSeriesChart.jsx`.

**Frontend `.pt`** (`PT-portugal-na-mao-fe`): nenhuma alteração nesta ronda.

Nenhum ficheiro fora destes três repositórios foi tocado por este trabalho. Nenhum dado existente
foi alterado ou eliminado.

---

## 16. Testes e builds (ronda 2026-10-09)

- `mvn -o compile` limpo em `portugal-na-mao-api` e `pt-operations-api` (3 rondas de alterações).
- `npx vite build` limpo em `pt-operations-fe` (2 rondas).
- Backend `.pt` e `pt-operations-api` reiniciados localmente várias vezes para aplicar cada
  alteração; arranque sempre limpo, zero erros nos logs.
- **Validação ao vivo completa no browser real** (login no PT Operations com as credenciais de
  `ptdot-ops-private.env`, `pt-operations-fe` servido em `localhost:5180` — a porta 5173 por
  omissão estava ocupada por outra aplicação não relacionada neste ambiente):
  - App Health: 8 cartões de sumário, gráfico de evolução (2 séries), distribuição de tempos de
    resposta, status HTTP, 3 tabelas de ranking de endpoints, tabela de registos individuais —
    todos com dados reais, filtros (período, método, endpoint, só-erros) a funcionar.
  - Product Analytics: 4 cartões novos, gráfico de evolução, "Pesquisas mais frequentes" (1
    resultado real: "castelo de vide"), "POIs mais consultados" (10 POIs reais), os 4 gráficos
    originais da Fase 1 intactos.
  - Troca para ambiente "Produção": antes da correção do Achado #2/#3 (§9/§11), ficava preso em
    "A carregar…"; depois, mostra a mensagem de erro específica e limpa os números do ambiente
    anterior — confirmado ao vivo, ambos os antes/depois.
- **Não testado ao vivo**: os 3 eventos novos do §13 (exigem fluxos completos de tour/comentário/
  publicação); `pt-operations-api`/`fe` não tinham sido corridos ao vivo nas rondas anteriores —
  nesta ficaram, resolvendo essa lacuna.

---

## 17. Git status final (ronda 2026-10-09, sem commit)

```
portugal-na-mao-api:
 M src/main/java/pt/dot/application/db/enums/ActivityEventType.java
 M src/main/java/pt/dot/application/service/activity/UserActivityLogService.java
 M src/main/java/pt/dot/application/service/feed/FeedService.java
 M src/main/java/pt/dot/application/service/observability/RequestLoggingFilter.java
 M src/main/java/pt/dot/application/service/poi/PoiCommentService.java
 M src/main/java/pt/dot/application/service/trip/TripTourService.java

pt-operations-api:
 M src/main/java/pt/ptops/observability/ApiRequestLogController.java
 M src/main/java/pt/ptops/observability/ApiRequestLogFilterOptionsDto.java
 M src/main/java/pt/ptops/observability/ApiRequestLogService.java
 M src/main/java/pt/ptops/observability/ApiRequestLogSummaryDto.java
 M src/main/java/pt/ptops/relationships/UserActivityLogRelationshipController.java
 M src/main/java/pt/ptops/relationships/UserActivityLogRelationshipService.java
 M src/main/java/pt/ptops/relationships/UserLogSummaryDto.java
 M src/main/resources/application.yml
?? src/main/java/pt/ptops/observability/DurationBucketDto.java
?? src/main/java/pt/ptops/observability/TimeBucketDto.java
?? src/main/java/pt/ptops/relationships/ActivityTimeBucketDto.java

pt-operations-fe:
 M src/components/ApiPerformanceSection.jsx
 M src/components/LogsDashboardSection.jsx
 M src/lib/api.js
?? src/components/PeriodFilter.jsx
?? src/components/TimeSeriesChart.jsx

PT-portugal-na-mao-fe: sem alterações nesta ronda — nota: o working tree deste repositório tem
 M src/components/poi/PoiQuickAdd.jsx por conta de uma sessão concorrente, não desta ronda de
 trabalho (não tocado, não incluído neste relatório).

portugal-workspace (raiz): PT_ANALYTICS_OBSERVABILITY_REPORT.md (este ficheiro).
```

Nada staged, nada commitado, nada enviado por esta ronda. Produção não tocada (só lida, via
`pt-operations-api`, para validação — nenhuma escrita).
