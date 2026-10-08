# PT Analytics & Observability — Relatório (Fase 1)

Data: 2026-10-08. Âmbito: evoluir o sistema de Analytics & Observability do Portugal na Mão,
reutilizando o que já existe nos três componentes (API `.pt`, Frontend `.pt`, PT Operations).
Regras seguidas: nenhum commit/push/deploy, produção não tocada, nenhum runner executado, nenhum
dado existente alterado, funcionalidades atuais preservadas. Tudo implementado e testado só em
ambiente local.

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

## 7. Ficheiros alterados

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

## 8. Git status final (sem commit)

Ver secção correspondente na resposta desta sessão — os quatro repositórios têm só os ficheiros
listados acima como `modified`/`untracked`; nada staged, nada commitado, nada enviado.
