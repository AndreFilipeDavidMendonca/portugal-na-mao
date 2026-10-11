# PT Operations — Synthetic Monitoring & Load Testing: Auditoria de Arquitetura e Plano de Implementação

Data: 2026-10-09. Âmbito: **Phase 1 — exclusivamente análise, auditoria e planeamento.** Nenhum
código foi alterado, nenhum commit/push/deploy foi feito, nenhum runner ou teste de carga foi
executado, nenhuma conta foi criada, produção e base de dados não foram tocadas (só consulta de
documentação e código-fonte local). Todas as afirmações abaixo distinguem explicitamente
**confirmado no código** de **inferido/a decidir**.

---

## 1. Executive Summary

O workspace tem hoje uma base de observabilidade **muito mais avançada do que seria de esperar**
para um pedido deste tipo — a Fase 1+2 de Analytics/App Health (implementada em 2026-10-08/09,
já commitada e enviada para `origin/main` nos três repositórios envolvidos) já cobre logs
técnicos (`api_request_log`), eventos de produto (`user_activity_log`) e dois dashboards completos
no PT Operations (`ApiPerformanceSection.jsx`, `LogsDashboardSection.jsx`). Isto é o alicerce certo
para Synthetic Monitoring e Load Testing — ambos devem **produzir tráfego real contra esses mesmos
mecanismos**, não construir um sistema de métricas paralelo.

Três factos da auditoria mudam a forma como as duas capacidades devem ser desenhadas:

1. **O PT Operations (`pt-operations-api`/`pt-operations-fe`) não está deployed em lado nenhum.**
   Não existe Dockerfile, `render.yaml` nem workflow de CI em nenhum dos dois repositórios — corre
   só em `localhost`. Isto significa que "agendamento automático" e "resultados no dashboard" têm
   uma dependência de deployment que precisa de ser resolvida antes da Fase 2 do roadmap, não
   depois.
2. **O pool de ligações à base de dados é pequeno por desenho** (`HikariCP maximum-pool-size`:
   8 local, 10 produção, via `DB_POOL_MAX`). Um teste de carga com poucas dezenas de utilizadores
   virtuais autenticados pode esgotar o pool antes de qualquer outro limite (CPU, memória,
   OSRM) se tornar visível — e fazê-lo **contra produção afetaria utilizadores reais**, porque o
   pool é partilhado por toda a aplicação.
3. **Já existe infraestrutura de e-mail real e funcional** (Gmail SMTP, `EmailService`, usada em
   produção para confirmação de registo/reset de password) e **já existe o padrão exato de worker
   Render Background (Docker, headless Chrome, processo Node de longa duração)** usado para os
   vídeos de Trip Memories — ambos são bases diretamente reutilizáveis, só que nenhum dos dois
   existe ainda do lado do `pt-operations-api` (sem config de mail própria, sem scheduler próprio).

Recomendação central (detalhada na Secção 12): um **runner sintético externo e independente**
(não embutido na app monitorizada, não executado pelo frontend do PT Operations), híbrido
HTTP+browser, agendado via **Render Cron Job**, que reporta resultados a um novo endpoint de
ingestão no `pt-operations-api` — e **k6, local-first**, para carga, com exportação de resumo
(nunca requests individuais) para o mesmo PT Operations. Nenhuma das duas capacidades deve correr
contra produção enquanto o pool de ligações e o impacto em utilizadores reais não estiverem
explicitamente avaliados e aprovados.

---

## 2. Current Architecture

### 2.1 API pública (`portugal-na-mao-api`)

Spring Boot (Java 21, Maven), 31 `@RestController` sob `src/main/java/pt/dot/application/api/`:
`auth`, `poi`, `district`, `district` (POIs por distrito), `municipality` (+ gestão de permissões),
`locality`, `search`, `trip` (+ `trip-tour`), `favorite`, `feed` (+ comentários), `friendship`,
`guide` (+ perfil), `chat`, `calendar`, `notification`, `media`, `geocoding`, `admin` (pesquisa de
utilizadores, permissões de município), `internal` (jobs de vídeo de memórias, ações internas),
`uat`, `event` (tracking client-side).

Autenticação: registo cria um `PendingUserRegistration` (não uma conta real) e envia e-mail de
confirmação; login bloqueia com `403 EMAIL_NOT_VERIFIED` até o e-mail estar confirmado
(`AuthController.java:253-255`); token JWT (HS256, `ptdot.jwt.secret` sem valor por omissão — falha
o arranque se ausente), TTL por omissão de 14 dias, **sem mecanismo de refresh token**. Papéis
(`UserRole`): `ADMIN`, `USER`, `BUSINESS`, `GUIDE` — **não existe nenhum flag "técnico/interno"**.
Existe um caminho de autenticação separado para serviço-a-serviço: `InternalApiKeyFilter`, segredo
partilhado via header `X-Internal-Api-Key`, já usado pelo PT Operations para chamadas
server-to-server, mas scoped a `/api/internal/**` — não serve para simular um utilizador real.

Rate limiting: caseiro, baseado em Caffeine (em memória, por instância) —
`LoginRateLimiter` (10 tentativas/15min), `PasswordResetRateLimiter`, `ResendVerificationRateLimiter`,
`MediaUploadRateLimiter`, `ResendCooldownGuard`, `DeleteAccountCooldownGuard`. Sem bucket4j.

E-mail: `EmailService` usa `JavaMailSender`/Gmail SMTP (`smtp.gmail.com:587`, `MAIL_USERNAME`,
`MAIL_PASSWORD` obrigatório via env, sem valor por omissão). **Já em uso real em produção** —
confirmação de registo, reset de password, confirmação de eliminação de conta, mensagens de admin,
anexo PDF de submissões UAT. Nenhum SendGrid.

Jobs agendados: só dois `@Scheduled` em todo o repositório —
`PendingUserRegistrationCleanupJob` (de hora a hora, limpa registos pendentes expirados) e
`CalendarReminderJob` (de hora a hora, envia recordatórios in-app). `@EnableScheduling` +
`@EnableAsync` ativos em `ApplicationJava`. Sem Quartz.

Base de dados: HikariCP — `maximum-pool-size` 8 por omissão localmente, 10 por omissão em
produção (`DB_POOL_MAX` sobrepõe ambos), `minimum-idle` 1, `connection-timeout` 30s. Flyway, 103
migrations aplicadas (`V103` é a mais recente — tabela `api_request_log`, ver 2.3).

Deployment: Render (confirmado via documentação interna — hosts `*.onrender.com` e
`*.frankfurt-postgres.render.com` — não via `render.yaml`, que não existe). `Dockerfile` coloca o
motor de routing OSRM (`osrm-routed`) e a JVM **no mesmo contentor/serviço**, deliberadamente, para
evitar o custo de um segundo serviço Render. `spring-boot-starter-actuator` está nas dependências
mas **sem nenhuma configuração `management.*`** — não há confirmação no código de um endpoint
`/actuator/health` ativo nem de qualquer health-check customizado (`/ping`, etc.). Se o Render tem
um health check configurado, é externo ao repositório e não é verificável a partir do código.

### 2.2 Frontend público (`PT-portugal-na-mao-fe`)

React/CRA (craco). Deployed no Vercel, projeto `portugal-na-mao`, produção em
`portugal-na-mao.com` (+ `portugal-na-palma-da-mao.vercel.app`). Nenhum tracking de eventos
client-side próprio (`gtag`, `posthog`, etc.) — o `trackEvent()` novo (Fase 1 de Analytics) é a
única chamada explícita de analytics do frontend, usada só para `SEARCH`/`FILTER_APPLIED`.

Existe um segundo processo relevante neste repositório: `render-worker/` — um worker Node 20 +
Chrome (via `apt`, não o Chromium empacotado do Puppeteer, por instabilidade de rede de build no
Render) + `ffmpeg`, usando `puppeteer-core`, desenhado explicitamente como "Render Background
Worker (Docker runtime)" para renderizar vídeos de "Trip Memories". **Este é o único precedente
real, no workspace, de um processo headless-browser de longa duração a correr no Render** — padrão
diretamente reutilizável para Synthetic Monitoring com Playwright (Secção 5).

### 2.3 Observabilidade já implementada (API `.pt` + PT Operations)

Implementada e **já commitada/enviada** (ver `PT_ANALYTICS_OBSERVABILITY_REPORT.md` na raiz do
workspace, rondas de 2026-10-08 e 2026-10-09):

- **`api_request_log`** (`V103`) — um row por pedido HTTP: `method`, `path` (URI literal, não
  normalizado por padrão de rota), `status`, `duration_ms`, `user_id` nullable, `correlation_id`,
  `is_error`, `created_at`. Escrito por `RequestLoggingFilter` (depois de `JwtAuthFilter`, via
  `@Async`, nunca bloqueia o pedido real). Exclui `/api/internal/**` (corrigido depois de se
  descobrir que esse polling dominava 98,7% de todas as linhas).
- **`user_activity_log`** (`V67` + extensões) — eventos de produto: `LOGIN`, `REGISTER`,
  `POI_VIEW`, `DISTRICT_VIEW`, `MUNICIPALITY_VIEW`, `BUSINESS_CREATED`, `SEARCH`,
  `FILTER_APPLIED`, `FAVORITE_ADDED`, `TRIP_CREATED`, `TOUR_STARTED`, `MEMORY_ADDED`,
  `COMMENT_ADDED`, `FEED_POST_CREATED`. Padrão best-effort (`JdbcTemplate`, nunca falha o pedido
  que o disparou).
- **`POST /api/events`** (`EventsController`, `permitAll`) — único ponto de entrada client-side,
  allow-list fechada (`SEARCH`/`FILTER_APPLIED`).
- **PT Operations**: `pt.ptops.observability` (logs técnicos) + `pt.ptops.relationships`
  (`UserActivityLogRelationshipController/Service`, eventos de produto) expõem `rows`/`summary`/
  `filters`/`timeseries`/`top-searches`/`top-pois`, lidos via `EnvironmentService.resolve(env)`
  (ligação direta `JdbcTemplate` a local OU produção, nunca via HTTP à API pública — relevante
  para a Secção 8: consultar estes dados nunca gera tráfego novo nas próprias tabelas).
  Dashboards: `ApiPerformanceSection.jsx` (App Health) e `LogsDashboardSection.jsx` (Product
  Analytics), ambos montados em `DashboardSection.jsx`.

**Achado já registado nessa auditoria, relevante aqui**: `user_activity_log` tem ~500 mil eventos
com concentração implausível (ex. um distrito com 368 849 visualizações) — tudo indica tráfego
não-orgânico de um script/teste de carga anterior, não investigado a fundo. **Isto é exatamente o
tipo de contaminação que Synthetic Monitoring e Load Testing têm de evitar reproduzir** — ver
Secção 7.4.

### 2.4 PT Operations (`pt-operations-api` + `pt-operations-fe`)

**Frontend** — sem router dedicado, um `App.jsx` com `switch` de estado e navegação em
`Sidebar.jsx`. Separadores atuais: **Dashboard** (sub-separadores: POIs, Universo Filtrado,
Product Analytics, App Health), **Logs** (tabela de eventos, separada do Dashboard a
2026-10-09), **Base de Dados** (explorador de tabelas), **Relacionamentos**, **Publicação
Editorial**, **Revisão de Conteúdo**, **Backups**, **Utilizadores**, **Mensagens**, **Settings**
(botão de rodapé, fora do `NAV`). Separadores desativados/placeholder: **SQL**, **Relatórios**.

**Backend** — pacotes sob `pt.ptops.`: `tables/` (catálogo de tabelas/schema), `messages/`
(canal de suporte utilizador→operações), `publication/` (histórico de publicações editoriais),
`config/` (CORS, datasource, Flyway), `security/` (Basic Auth + Production Write Gate),
`observability/` (ver 2.3), `conflicts/` (fluxo CSV de revisão de conflitos, em pausa),
`dashboard/` (estatísticas de resumo), `review/` (decisões de revisão de POIs pendentes),
`users/` (gestão global de utilizadores, via proxy à API pública — `PtApiInternalClient`),
`environment/` (`EnvironmentService`, ver 2.3), `sync/` (Editorial Mirror + comparação/aplicação
legado, maioria dos pontos do Production Gate), `backup/`, `relationships/` (ver 2.3).

**Base de dados própria `pt_operations`** (Flyway, independente de local/produção) — 9
migrations: `backup_execution`, `backup_item`, `sync_execution`, `sync_execution_item`,
`operation_log`, `conflict_resolution`, `publication`, `poi_review_decision`, mais um alargamento
de coluna. **Nenhuma migration para Synthetic Monitoring ou Load Testing existe ainda.**

**Scheduling**: zero `@Scheduled`/`@EnableScheduling` em todo o `pt-operations-api` — qualquer
agendamento *dentro* desta app seria código novo, não reutilização.

**Autenticação**: HTTP Basic, uma única conta em memória (`PTOPS_AUTH_USERNAME`/`PASSWORD`, sem
valor por omissão, role `OPERATOR`, default-deny). **Sem modelo multi-utilizador/multi-papel.**

**Production Write Gate (Tier 1)** — real e implementado (não só planeado):
`ProductionGateService` (cache Caffeine, token de uso único, TTL 2 min, chave
`operationKey+fingerprint`) + `ProductionGate.execute()` (devolve `409` + token na primeira
tentativa, exige o mesmo token exato para executar). 11 pontos de chamada: `EditorialMirrorController`
(8), `PoiSyncController` (2), `UserManagementController` (1). Padrão diretamente reutilizável para
proteger um eventual botão "Executar teste de carga" (Secção 9).

**Deployment**: **ausente** em ambos os repositórios — sem Dockerfile, sem `render.yaml`, sem
`.github/workflows`. Corre apenas em `localhost`. A própria documentação de segurança interna do
projeto já assinala que a ausência de deployment é, hoje, parte da razão pela qual o modelo de
autenticação de conta única é aceitável — **isto muda materialmente se o PT Operations for
colocado online** (ver Secção 7 e Secção 11).

### 2.5 Enrichment/opendata — confirmação de isolamento

Pacote `src/main/java/pt/dot/application/opendata/**` existe no branch `main` (não é um branch
separado, ao contrário do que a memória de sessões anteriores indicava — correção registada).
34 `Runner`/`CommandLineRunner`, todos protegidos por `@ConditionalOnProperty(..., havingValue =
"true")`; 33 com `matchIfMissing = false` (seguro por omissão); **uma excepção**,
`OsmBootstrapRunner` (`matchIfMissing = true`), mas `application.yml` define explicitamente essa
propriedade a `false` — desativado hoje, mas um ponto frágil (depende dessa linha nunca ser
removida por engano). **Sem `@Scheduled`, sem `@Controller`/`@RestController` neste pacote** —
confirmado inerte, não exposto por HTTP, não corre automaticamente. Não analisado mais a fundo,
como instruído.

### 2.6 CI/CD

**Ausente nos quatro repositórios** (`portugal-na-mao-api`, `pt-operations-api`,
`pt-operations-fe`, `PT-portugal-na-mao-fe`) — nenhum `.github/workflows`. GitHub Actions **não**
é hoje um ambiente de execução já aprovado/exercitado; teria de ser montado do zero, incluindo
decidir sobre consumo de minutos em repositórios privados (ver Secção 11).

---

## 3. Existing Capabilities (o que já funciona e é reutilizável)

| Capacidade | Estado | Reutilizável para |
|---|---|---|
| Logs técnicos por pedido (`api_request_log`) | Em produção, validado ao vivo | Correlacionar falhas/latência do Synthetic Runner e do Load Test com o que a API já regista |
| Eventos de produto (`user_activity_log`) | Em produção, validado ao vivo | Detetar se o Synthetic Runner está a "contar" como utilizador real nos dashboards — tem de ser excluído (Secção 7.4) |
| Dashboards App Health/Product Analytics no PT Operations | Em produção local, validado ao vivo | Padrão de secção/DTO/filtros a copiar byte-a-byte para as novas secções de Testing |
| `EnvironmentService.resolve(env)` | Em produção | Base de qualquer leitura local/produção nova, sem inventar mecanismo de ligação |
| `EmailService` (Gmail SMTP) | Em produção, uso real confirmado | Alertas por e-mail — mas só existe em `portugal-na-mao-api`, não em `pt-operations-api` (ver Secção 10) |
| Rate limiters Caffeine (login, reset, etc.) | Em produção | Padrão de cooldown/dedup a copiar para alertas (Secção 10) |
| Production Write Gate (Tier 1) | Em produção local | Padrão de confirmação a copiar para um futuro botão "Executar teste de carga" |
| `render-worker` (Puppeteer-core + Chrome + Docker) | Em produção (vídeos) | Template direto para um worker Playwright de Synthetic Monitoring |
| `@Scheduled`/`@EnableAsync` (API `.pt`) | Em produção | Prova que agendamento interno funciona nesta stack — mas seria um job *na app monitorizada*, risco descrito na Secção 5.3 |
| 31 controllers REST já existentes | Em produção | Cobrem toda a jornada funcional pedida (Secção 5) sem endpoints novos na API pública |

---

## 4. Missing Capabilities (o que falta)

- **Nenhum deployment do PT Operations** — pré-requisito para "agendamento automático" e
  "resultados no dashboard" funcionarem fora do portátil do André.
- **Nenhum scheduler no `pt-operations-api`** — `@EnableScheduling` nunca foi usado aqui.
- **Nenhuma conta técnica/flag "interno"** em `AppUser` — nada distingue uma conta sintética de
  uma conta real hoje.
- **Nenhuma infraestrutura de e-mail no `pt-operations-api`** — zero config de `spring.mail`
  nesse repositório (existe só na API pública).
- **Nenhum mecanismo de normalização de rota** em `api_request_log.path` — hoje é o URI literal
  (`/api/pois/69020`), não o padrão (`/api/pois/{id}`); relevante para agrupar resultados de carga
  por endpoint de forma útil.
- **Nenhum endpoint de ingestão** para resultados de Synthetic Runner ou de k6.
- **Nenhuma tabela `pt_operations`** para execuções sintéticas ou de carga.
- **Nenhum CI/CD** em nenhum dos quatro repositórios.
- **Nenhum health-check HTTP confirmado** (`/actuator/health` presente como dependência, não
  configurado) na API pública — um Synthetic Monitor teria de inferir "saúde" a partir de
  endpoints de negócio reais, não de um health-check dedicado.

---

## 5. Synthetic Monitoring Options

### 5.1 Jornada funcional mapeada a endpoints reais (confirmado no código)

| Passo do pedido | Endpoint confirmado |
|---|---|
| 1. Abrir a aplicação | `GET https://portugal-na-mao.com` (SPA Vercel) |
| 2. Verificar carregamento inicial | Mesmo GET — validar status 200 + presença do bundle JS, ou um `GET` leve a um asset conhecido |
| 3. Login com conta técnica | `POST /auth/login` (`AuthController`) |
| 4. Abrir o mapa / carregar POIs | `GET /api/pois` (bbox/zoom) |
| 5. Pesquisa | `GET /api/search` (`SearchController`) |
| 6. Detalhes de um POI | `GET /api/pois/{id}` |
| 7. Distrito/Município | `GET /api/districts/{id}`, `GET /api/municipalities/{id}` (+ `/pois`) |
| 8. Viagem de teste | `GET /api/trips/{tripId}` (`TripController`) |
| 9. Resultados/métricas | Correlacionar com `api_request_log`/`correlation_id` já existente |

Todos os endpoints necessários **já existem** — nenhum endpoint novo é necessário na API pública
só para o percurso funcional de referência.

### 5.2 Browser real vs. HTTP sintético — avaliação

Nem tudo no percurso pedido precisa de um browser real:
- Passos 3-9 são, do ponto de vista do servidor, uma sequência de chamadas HTTP autenticadas —
  um cliente HTTP simples (Node `fetch`, ou mesmo os próprios scripts k6 em modo "smoke") cobre-os
  integralmente, com latência mínima e custo quase nulo.
- Os passos 1-2 ("abrir a app", "verificar carregamento inicial") só são verdadeiramente
  verificados por um **browser real** — um `GET` ao HTML da SPA confirma que o servidor Vercel
  responde, mas não confirma que o bundle JS corre sem erros, que o mapa (Leaflet/canvas) renderiza,
  ou que não há uma regressão de build silenciosa. Isto só um Playwright (ou equivalente)
  headless resolve.
- **Recomendação: híbrido**, não um ou outro — ver Secção 12.

### 5.3 Onde correr o agente — avaliação explícita do risco "monitorizar o monitor"

Um `@Scheduled` dentro do próprio `portugal-na-mao-api` (reaproveitando o padrão já existente dos
dois jobs de hora a hora) foi considerado e **rejeitado** como localização principal: se a JVM
cai, o próprio job de monitorização cai com ela, exatamente no momento em que mais seria preciso
detetar isso. Um runner **externo e independente** é a opção correta — nem na app monitorizada,
nem no frontend do PT Operations (como o pedido já antecipa não assumir).

### 5.4 Infraestrutura — comparação

| Opção | Viabilidade | Observações |
|---|---|---|
| Execução local (portátil) | Só para testes manuais/dev | Não serve "várias vezes por dia" de forma fiável — portátil nem sempre ligado |
| Render Background Worker (Docker) | Viável, padrão já existe (`render-worker/`) | Processo residente teria de se auto-agendar (ex. `node-cron` interno) — paga-se o tempo todo, mesmo parado entre execuções |
| **Render Cron Job** | **Recomendado** | Produto Render distinto de Background Worker — corre um comando, termina, só paga pela execução; ajusta-se naturalmente a "várias vezes por dia em horários distribuídos" |
| GitHub Actions (scheduled workflow) | Viável, zero infraestrutura nova | Repositórios são privados (confirmado por memória de sessão anterior) — minutos não são ilimitados; menos preciso para horários exatos (`cron` do GH Actions tem atraso de fila variável, documentado pela própria GitHub) |
| Worker dedicado fora do Render (ex. VM própria) | Não avaliado a fundo | Sem necessidade aparente — o padrão Render Cron Job já resolve, sem custo/complexidade adicional |

**Recomendação**: Render Cron Job como runner principal, com GitHub Actions scheduled workflow
como alternativa de baixo custo/sem infraestrutura adicional se o custo do Cron Job não for
justificável nesta fase — ambos exigem decisão explícita do André, nenhum dos dois está hoje
configurado ou aprovado.

### 5.5 O que falta decidir antes da Fase 2

- O PT Operations precisa de estar deployed para receber resultados em tempo real — ou o runner
  escreve para um destino intermédio (ficheiro, ou diretamente para `pt_operations` via ligação
  Postgres, como os runners de enrichment já fazem) até esse deployment acontecer.
- Stack do runner: Node + Playwright (cobre 1-9 com um único processo) é a opção mais simples; um
  cliente HTTP puro só para 3-9 e Playwright só para 1-2 é a opção mais barata em tempo de
  execução, mas duplica a lógica de autenticação em dois sítios.

---

## 6. Load Testing Options

### 6.1 Ferramenta

**k6 recomendado**, consistente com o pedido e sem nenhum achado do código que o desaconselhe: não
há infraestrutura Python/Locust nem Node/Artillery já em uso para carga; k6 corre localmente sem
nenhuma dependência nova de infraestrutura (um binário), tem suporte nativo a percentis/thresholds
(relevante para P50/P95/P99 pedidos) e exporta resumo em JSON de forma trivial.

| Ferramenta | Prós | Contras | Infra nova? |
|---|---|---|---|
| **k6** | VU-density por core alta (Go), scripting em JS (familiar à equipa frontend), thresholds/percentis nativos | Ecossistema de export visual mais pobre que Locust (sem UI própria) | Não — binário local |
| Locust | UI web própria em tempo real, Python | Menor densidade de VUs por core, stack Python nova neste workspace (100% Java/JS hoje) | Não, mas introduz uma linguagem nova |
| Artillery | YAML+JS, fácil para smokes rápidos | Percentis/thresholds menos maduros, comunidade menor | Não |

### 6.2 Risco crítico identificado: pool de ligações à base de dados

`HikariCP maximum-pool-size` = 8 (local) / 10 (produção, por omissão — `DB_POOL_MAX` pode
sobrepor). Qualquer perfil de carga autenticado que toque a base de dados (mapa, POIs, pesquisa,
viagens) vai esgotar este pool **muito antes** de CPU, memória ou latência de rede se tornarem o
limite observável. Isto é uma descoberta de auditoria, não uma suposição: o valor está
hard-coded como omissão em `application.yml`. Consequências:

1. Testar com 50+ VUs autenticados *já* excede o pool em quase 5x — o primeiro "gargalo"
   encontrado será sempre o pool, mascarando qualquer outro limite real da infraestrutura.
2. **Testar contra produção com este pool implica risco real para utilizadores reais** — o pool
   é global à aplicação, não por teste. Não há isolamento hoje.
3. Antes de qualquer teste de carga contra produção, o pool teria de ser avaliado/dimensionado
   deliberadamente (ou um ambiente disposable/staging teria de existir — não existe hoje).

### 6.3 Rate limiter de login como limite adicional

`LoginRateLimiter` permite 10 tentativas/15min, em memória, por instância. Um script de carga que
faça login fresco por VU vai colidir com este limite a partir do 11º VU na mesma janela —
**scripts de carga devem reutilizar um pool pequeno de tokens JWT pré-autenticados**, nunca fazer
login por VU, exatamente como o pedido original já antecipa ("gestão de sessões e tokens").

### 6.4 Perfis de carga sugeridos (a validar, não a assumir como seguros)

Visitante anónimo (mapa/POIs/pesquisa, sem token), utilizador autenticado (favoritos/viagens,
token reutilizado), consulta territorial (distrito/município), criação de viagem (escrita —
isolar com conta técnica, nunca uma conta real). Os volumes sugeridos no pedido (10/50/100/250/500
VUs) **não devem ser assumidos seguros** — à luz de 6.2, mesmo 50 VUs autenticados já é um teste
de limite do pool, não um "teste leve".

### 6.5 Exportação de resultados

k6 suporta `--summary-export <ficheiro>.json` nativamente — resumo agregado (médias, percentis,
taxa de erro, throughput), nunca requests individuais. Caminho natural: resumo → novo endpoint de
ingestão no `pt-operations-api` (`pt.ptops.loadtest`, mesmo padrão dos restantes pacotes) → nova
tabela `pt_operations.load_test_execution` (mesma convenção de nomenclatura de
`backup_execution`/`sync_execution` já existentes). Um "botão no dashboard para iniciar execuções"
exige um **executor remoto autorizado** — infraestrutura nova (quem corre o k6 quando o botão é
premido?), não resolvido nesta fase, proposto como trabalho de uma fase posterior à Fase 2 (ver
Secção 14).

---

## 7. Technical Accounts & Authentication

### 7.1 Estado atual do sistema de contas (confirmado)

Registo → `PendingUserRegistration` → e-mail de confirmação obrigatório → `403
EMAIL_NOT_VERIFIED` até confirmar → login emite JWT (14 dias, sem refresh). Papéis `ADMIN`/`USER`/
`BUSINESS`/`GUIDE` — nenhum destes tem significado de "conta interna/técnica". Não existe nenhum
mecanismo de bypass de autenticação hoje, e **nenhum deve ser criado** (instrução explícita do
pedido, já alinhada com o que o código faz).

### 7.2 Proposta (não implementada nesta fase)

- **Uma conta para Synthetic Monitoring**: registada através do fluxo real (recebe e confirma
  e-mail de verdade), papel `USER` normal — porque não há papel "técnico" hoje.
- **Pequeno conjunto controlado de contas para Load Testing autenticado** (2-4 contas), mesma
  via real, reutilizadas entre execuções (nunca criadas/destruídas por execução — evita colidir
  com `ResendVerificationRateLimiter`/`LoginRateLimiter` e evita lixo de contas).
- **Identificação inequívoca**: adicionar um novo campo `is_technical boolean default false` em
  `app_user` (migration nova, aditiva, mesmo estilo das já existentes) — mais simples e mais
  seguro do que sobrecarregar `UserRole` (que tem significado de produto). Decisão a validar com o
  André antes da Fase 2 (Secção 14).
- **Separação das métricas de utilizadores reais**: os dashboards de Product Analytics
  (`LogsDashboardSection.jsx`) devem excluir `user_id`s marcados como `is_technical` por omissão,
  com opção de os incluir explicitamente (toggle) — nunca misturados sem aviso, à luz do Achado #4
  já registado na auditoria de Analytics (500 mil eventos não-orgânicos não identificados).
- **Credenciais**: seguir o padrão já em uso (`ptdot-ops-private.env`, fora do git) — um novo
  ficheiro equivalente para as credenciais técnicas, nunca hard-coded, nunca em `.env` versionado.
- **Privilégios mínimos**: contas técnicas usam exatamente os mesmos endpoints que um utilizador
  normal usaria — nenhum privilégio elevado, nenhum atalho de autenticação.
- **Isolamento/retenção de dados de teste**: viagens/favoritos/comentários criados por contas
  técnicas devem ser identificáveis (via `is_technical` no `user_id` associado) e idealmente
  limitados a um pequeno conjunto fixo reutilizado, não recriados a cada execução — minimiza
  limpeza necessária e volume de dados sintéticos.

---

## 8. PT Operations Integration

### 8.1 Novo separador "Testing"

Seguindo exatamente o padrão já usado por "Dashboard"/"Logs": uma entrada nova em
`Sidebar.jsx` → `NAV`, um componente `TestingSection.jsx` com dois sub-separadores
(**Synthetic Tests**, **Load Tests**), cada um reutilizando os componentes de filtro/gráfico já
existentes (`PeriodFilter.jsx`, `TimeSeriesChart.jsx`, `CategoryBarChart.jsx`) em vez de criar
novos.

### 8.2 Correlação com Analytics/App Health existentes, sem duplicar

- **`test_run_id`**: novo identificador (UUID), gerado pelo runner/script no início de cada
  execução — análogo ao `correlation_id` já existente em `api_request_log`. Propagado como header
  (`X-Test-Run-Id`, análogo a `X-Request-Id`) em todos os pedidos dessa execução.
- Se `RequestLoggingFilter` for estendido (pequena alteração aditiva) para capturar esse header
  quando presente e gravá-lo numa nova coluna nullable em `api_request_log`, os logs técnicos já
  existentes passam a correlacionar automaticamente com execuções sintéticas/de carga, **sem
  tabela nova para isso** — só filtrar por essa coluna no `ApiPerformanceSection.jsx` já existente.
- Resultados *próprios* de cada execução (passo-a-passo do Synthetic Runner; resumo agregado do
  k6) vivem em tabelas novas e pequenas em `pt_operations` (`synthetic_run`,
  `synthetic_run_step`, `load_test_execution`) — nunca misturadas com `api_request_log`/
  `user_activity_log`, que continuam a significar exatamente o que significam hoje.
- Exclusão de tráfego sintético das métricas de utilizadores reais: via `is_technical` (Secção
  7.2), não via uma tabela paralela.

### 8.3 Ingestão de resultados

Recomendado: **envio direto para a API do PT Operations** (novo endpoint `POST
/api/{env}/testing/synthetic-runs` e `POST /api/{env}/testing/load-test-runs`), não ficheiros —
consistente com o padrão já usado por `EventsController`/`ApiRequestLogService` (inserção direta,
nunca import em lote). Ficheiro/CSV só como fallback manual enquanto o PT Operations não estiver
deployed (ver Secção 9).

---

## 9. Scheduling & Deployment Options

| Pergunta | Resposta (confirmada ou a decidir) |
|---|---|
| O PT Operations está deployed? | **Não, confirmado.** Sem Dockerfile/render.yaml/CI em nenhum dos dois repositórios. |
| O que falta para o colocar online? | Dockerfile (seguir o padrão simples da API pública, sem a complexidade do OSRM), decisão sobre `render.yaml` ou configuração manual no Render, e sobretudo **reavaliar o modelo de autenticação** — Basic Auth de conta única é aceitável só enquanto é `localhost`-only; online, precisa de HTTPS obrigatório (Render já dá por omissão) e de considerar se uma conta partilhada chega. |
| Onde corre o Synthetic Runner? | Render Cron Job (recomendado, Secção 5.4), separado do deployment do próprio PT Operations. |
| Onde corre o Load Testing? | Local-first (k6, sem infraestrutura), exportação de resumo para o PT Operations já deployed. Execução remota "a um clique" é trabalho de fase posterior (Secção 6.5). |
| Precisa de deployment nesta fase (Phase 1)? | Não — esta fase é só auditoria. |

---

## 10. Email Alerts

**Infraestrutura de e-mail já existe e funciona — mas só em `portugal-na-mao-api`.**
`pt-operations-api` **não tem nenhuma configuração `spring.mail`** — isto não é reutilização
direta, é trabalho novo (adicionar `spring-boot-starter-mail` + `MAIL_*` env vars a este segundo
repositório). Seria possível, em alternativa, chamar um endpoint interno da API pública para
disparar o envio — mas isso criaria uma dependência de runtime entre os dois sistemas só para
alertas operacionais, que parece pior do que simplesmente configurar mail no próprio
`pt-operations-api` (mesmo provedor Gmail, credenciais próprias).

Padrão de cooldown/deduplicação a reutilizar: Caffeine cache (já dependência existente,
`ProductionGateService`/rate limiters já o usam) — um `AlertService` simples com TTL por tipo de
alerta + chave (ex. `endpoint+tipo_de_erro`) replica exatamente o mecanismo já validado em
produção para os rate limiters.

Alertas propostos (não implementados nesta fase, por instrução explícita): falha de login da
conta sintética, endpoint indisponível (erro 5xx no percurso sintético), latência acima de um
threshold configurável, degradação persistente (N falhas consecutivas), recuperação de incidente
(primeiro sucesso depois de falhas).

---

## 11. Costs & Operational Risks

- **Custo de infraestrutura Render — verificado nesta ronda (2026-10-09), com níveis de confiança
  distintos por item:**

  - **Mecânica de cobrança de Cron Jobs — confirmado na documentação oficial** (`render.com/docs/cronjobs`):
    cobrado ao segundo, só enquanto o job está a correr (nunca por estar "à espera" do próximo
    horário), com um **mínimo de $1/mês por serviço de cron**, independentemente de quanto correu.
    Pode usar qualquer compute plan; execução máxima de 12h por corrida (irrelevante aqui — o
    Synthetic Runner corre segundos/minutos, não horas). Para um runner que corra, por exemplo,
    10×/dia × ~2 min cada (~600 min/mês), o custo real fica muito provavelmente **no mínimo de
    $1/mês**, não no preço "always-on" de um plano — o modelo de Cron Job é especificamente mais
    barato do que um Background Worker residente para esta cadência.
  - **Preços em $ dos compute plans (Starter $7, Standard $25, Pro $85, Pro Plus $175, Pro Max
    $225, Pro Ultra $450/mês) — NÃO confirmado diretamente na página oficial do Render.**
    `render.com/pricing` é uma página renderizada em JavaScript; a ferramenta de leitura usada
    nesta auditoria só consegue aceder à casca estática (menus, não a tabela de preços). Estes
    valores vêm de múltiplos agregadores terceiros, consistentes entre si — mas a mesma pesquisa
    encontrou **issues públicas documentando tabelas de preços/specs do Render erradas
    exatamente deste tipo de fonte** (CPU sobrestimada até 4x, nomes de planos que o Render já não
    aceita, plano gratuito com CPU errada). **Tratar estes números como indicativos, não como
    confirmados — verificar visualmente em `render.com/pricing` antes de orçamentar.**
  - **PostgreSQL — confirmado na documentação oficial** (`render.com/docs/postgresql-legacy-instance-types`):
    desde outubro de 2024 o Render separou compute de storage ("flexible plans", storage a
    $0,30/GB/mês); os planos "legacy" anteriores (ainda documentados) tinham `max_connections`
    97 (Starter/Standard/Pro) ou 197 (Pro Plus). **Nota relevante para o risco já identificado na
    Secção 6.2**: mesmo no plano Postgres mais barato, o limite de ligações do próprio Render
    (97) é **muito maior** do que o `HikariCP maximum-pool-size` da aplicação (8-10) — ou seja, o
    gargalo real de um teste de carga não é o plano de base de dados escolhido no Render, é a
    configuração do pool na própria app. Subir de plano Postgres não resolve o risco da Secção
    6.2; só alterar `DB_POOL_MAX` (ou isolar o teste da produção) resolve.
  - **Planos de workspace/equipa** (Hobby $0, Pro $25, Scale $499/mês) — mencionados por apenas
    uma fonte terceira, confiança baixa, não verificado.

  **Recomendação prática**: o custo do Cron Job em si (Secção 5.4) é provavelmente marginal
  (perto do mínimo de $1/mês) dada a cadência "várias vezes/dia" pedida — a decisão de custo que
  realmente importa é se/quando o `pt-operations-api` passa a ter um serviço web pago 24/7 (Secção
  9), não o Cron Job isolado. Confirmar o preço exato do tier de compute escolhido visualmente em
  `render.com/pricing` antes de aprovar o passo 5 do roadmap (Secção 13).
- **Custo de minutos GitHub Actions**: repositórios são privados — minutos não são ilimitados;
  confirmar o plano atual da organização/conta antes de depender disto como alternativa gratuita.
- **Risco de pool de ligações** (Secção 6.2) — o maior risco técnico identificado nesta auditoria.
  Testar carga contra produção sem resolver isto primeiro arrisca degradar o serviço para
  utilizadores reais.
- **Risco de rate limiter em memória, por instância** — se a API pública alguma vez escalar
  horizontalmente (hoje parece ser uma única instância, dado o Dockerfile co-localizar o OSRM),
  os limites de login deixam de ser globais, o que teria de ser revisto antes de confiar neles
  para proteger contra um teste de carga mal configurado.
- **Risco de contaminação de métricas** — já aconteceu uma vez (Achado #4 da auditoria de
  Analytics, ~500 mil eventos não-orgânicos não identificados). Sem `is_technical` desde o
  primeiro dia, Synthetic Monitoring e Load Testing repetem exatamente esse erro.
- **Risco de segurança do PT Operations online** — autenticação de conta única, sem MFA, sem
  modelo de papéis, é aceitável só enquanto `localhost`-only; online, é um risco a mitigar
  explicitamente (fora do âmbito desta auditoria decidir como, mas tem de estar na conversa antes
  do deploy).
- **Nenhum ambiente de staging/disposable existe** — todas as decisões de "onde testar carga" têm
  de escolher entre local (seguro, mas não mede a infraestrutura real) e produção (mede a
  infraestrutura real, mas arrisca utilizadores reais). Não há meio-termo hoje.

---

## 12. Recommended Architecture

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Render Cron Job               │        │  k6 (local, depois: executor   │
│  (Synthetic Runner)            │        │  remoto autorizado — fase 2+)  │
│  Node + Playwright (passos 1-2)│        │  perfis: anónimo/autenticado/  │
│  + cliente HTTP (passos 3-9)   │        │  território/escrita            │
│  conta técnica (is_technical)  │        │  pool pequeno de contas técnicas│
└───────────────┬────────────────┘        └───────────────┬────────────────┘
                │ X-Test-Run-Id + resultados                │ resumo JSON
                ▼                                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│  API pública (portugal-na-mao-api) — SEM alterações de comportamento,  │
│  só tráfego real contra endpoints já existentes; api_request_log/      │
│  user_activity_log continuam a gravar exatamente como hoje             │
└───────────────────────────────┬────────────────────────────────────────┘
                                  │ leitura/ingestão (EnvironmentService já existe)
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  pt-operations-api (precisa de deployment — hoje não existe)           │
│  pt.ptops.synthetic/  pt.ptops.loadtest/  (novos, mesmo padrão)         │
│  pt_operations: synthetic_run, synthetic_run_step, load_test_execution │
└───────────────────────────────┬────────────────────────────────────────┘
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  pt-operations-fe — novo separador "Testing" (Synthetic / Load),       │
│  reutilizando PeriodFilter/TimeSeriesChart/CategoryBarChart existentes  │
└──────────────────────────────────────────────────────────────────────┘
```

Princípios: (1) nenhuma das duas capacidades vive dentro da app monitorizada nem no frontend do
PT Operations; (2) `is_technical` separa, desde o primeiro dia, tráfego sintético de tráfego real;
(3) nenhuma tabela nova duplica `api_request_log`/`user_activity_log` — só correlaciona com elas;
(4) carga nunca corre contra produção sem decisão explícita, documentada, sobre o risco do pool de
ligações.

---

## 13. Phase 2 Implementation Roadmap

Sequência ajustada face aos achados (dependência de deployment do PT Operations antecipada para o
passo 4, não deixada para o fim).

**1. Preparação técnica**
Objetivo: resolver pré-requisitos antes de escrever código de teste. Componentes: migration
`is_technical` em `app_user` (API `.pt`); decisão de stack do Synthetic Runner (Node+Playwright
híbrido, Secção 5.5); confirmação de preços/tier atuais no Render. Dependências: nenhuma.
Riscos: nenhum (é só decisão/pesquisa). Critério de aceitação: decisões documentadas, migration
escrita e testada localmente. Validação: `mvn compile` + migration aplicada em local. Deployment
necessário: não. Esforço: pequeno.

**2. Infraestrutura de contas e identificação de testes**
Objetivo: criar (através do fluxo real, nunca de um bypass) 1 conta de Synthetic Monitoring + 2-4
contas de Load Testing, confirmar e-mails, marcar `is_technical=true`. Componentes: `app_user`
(API `.pt`). Dependências: passo 1. Riscos: confundir estas contas com utilizadores reais se
`is_technical` não for aplicado corretamente. Critério de aceitação: contas visíveis e marcadas,
excluídas por omissão dos dashboards de Product Analytics. Validação: consulta manual via PT
Operations (Base de Dados). Deployment: não. Esforço: pequeno.

**3. Primeiro Synthetic Runner local**
Objetivo: script Node+Playwright que executa os 10 passos do percurso contra local, manualmente.
Componentes: novo repositório/pasta (a decidir onde viver — sugestão: novo diretório no workspace,
não dentro de nenhum dos quatro repositórios existentes, para não acoplar o runner ao ciclo de
release de nenhum deles). Dependências: passo 2. Riscos: falsos positivos/negativos por
instabilidade do próprio script, não da app. Critério de aceitação: corre de ponta a ponta contra
local, grava um `X-Test-Run-Id`. Validação: execução manual, inspeção do `api_request_log`
filtrado por esse id. Deployment: não. Esforço: médio.

**4. Persistência e integração no PT Operations**
Objetivo: `pt.ptops.synthetic` (endpoint de ingestão + DTOs) + migrations `synthetic_run`/
`synthetic_run_step` em `pt_operations`; **decisão e execução do deployment mínimo do
`pt-operations-api`** (antecipado deste roadmap — é aqui que a dependência real aparece).
Componentes: `pt-operations-api`. Dependências: passo 3. Riscos: o próprio deployment do PT
Operations (reavaliação de segurança, Secção 11). Critério de aceitação: resultados do passo 3
chegam e aparecem numa vista mínima. Validação: execução manual do runner contra o PT Operations
deployed. Deployment: **sim, pela primeira vez neste roadmap**. Esforço: médio-grande.

**5. Agendamento automático**
Objetivo: Render Cron Job a correr o Synthetic Runner em horários distribuídos. Componentes:
Render (novo serviço). Dependências: passo 4. Riscos: custo recorrente, falhas silenciosas se o
Cron Job não notificar. Critério de aceitação: execuções aparecem automaticamente no PT Operations
sem intervenção manual, em pelo menos 3 horários/dia durante uma semana de observação. Validação:
histórico visível no PT Operations. Deployment: sim (o Cron Job em si). Esforço: médio.

**6. Alertas por e-mail**
Objetivo: `spring-boot-starter-mail` + `AlertService` (Caffeine cooldown/dedup) em
`pt-operations-api`. Componentes: `pt-operations-api` (novo). Dependências: passo 5. Riscos:
alertas excessivos sem cooldown bem calibrado. Critério de aceitação: uma falha simulada gera
exatamente um e-mail, não repetido dentro da janela de cooldown. Validação: teste manual com uma
falha forçada (ex. parar a API local temporariamente). Deployment: requer credenciais de mail no
ambiente do PT Operations deployed. Esforço: pequeno-médio.

**7. Primeiro teste de carga local**
Objetivo: scripts k6 para os perfis identificados (Secção 6.4), correndo **só contra local**, com
o pool de ligações monitorizado em paralelo. Componentes: novos ficheiros `.js` k6 (mesma pasta
sugerida no passo 3). Dependências: passo 2 (contas técnicas/pool de tokens). Riscos: o próprio
risco do pool (Secção 6.2) — mitigado por nunca apontar a produção nesta etapa. Critério de
aceitação: resumo JSON gerado com P50/P95/P99/taxa de erro para pelo menos 2 perfis. Validação:
inspeção manual do resumo + do `api_request_log` local durante a execução. Deployment: não.
Esforço: médio.

**8. Integração dos resultados de carga no PT Operations**
Objetivo: `pt.ptops.loadtest` + migration `load_test_execution` + endpoint de ingestão do resumo
k6. Componentes: `pt-operations-api`. Dependências: passo 4 (PT Operations já deployed) + passo 7.
Riscos: nenhum novo. Critério de aceitação: um resumo k6 real aparece no PT Operations. Validação:
execução manual de k6 → `curl`/script de upload → vista no PT Operations. Deployment: não (reaproveita
o do passo 4). Esforço: pequeno-médio.

**9. Interface de configuração e execução manual**
Objetivo: separador "Testing" em `pt-operations-fe` (Synthetic Tests + Load Tests), com histórico,
estado da última execução, comparação temporal (reutilizando `PeriodFilter`/`TimeSeriesChart`).
Componentes: `pt-operations-fe`. Dependências: passos 4 e 8. Riscos: nenhum novo. Critério de
aceitação: validação visual ao vivo no browser, ambas as secções com dados reais. Validação:
browser real, login no PT Operations deployed. Deployment: não (reaproveita o existente). Esforço:
médio.

**10. Validação final e documentação**
Objetivo: correr uma semana de Synthetic Monitoring real + pelo menos uma ronda de Load Testing
local documentada, atualizar este documento com decisões finais e números reais observados.
Componentes: todos. Dependências: todos os passos anteriores. Riscos: nenhum novo. Critério de
aceitação: André revisa e aprova o resultado como "fechado". Validação: revisão humana explícita.
Deployment: não (só observação). Esforço: pequeno (mas requer tempo de calendário, não só
esforço técnico).

---

## 14. Open Questions & Decisions

Decisões que precisam da aprovação explícita do André antes da Fase 2 arrancar:

1. **Onde vive o código do Synthetic Runner e dos scripts k6?** Proposta: pasta nova no
   workspace, independente dos 4 repositórios existentes — a confirmar.
2. **`is_technical` em `UserRole` vs. coluna nova?** Proposta: coluna nova booleana — a confirmar.
3. **Deploy do PT Operations**: quando, com que modelo de autenticação (continuar com conta
   única partilhada ou evoluir primeiro)? Este documento não decide isto, só assinala que é um
   pré-requisito real do passo 4 do roadmap.
4. **Render Cron Job vs. GitHub Actions** para o agendamento — mecânica de cobrança do Cron Job
   confirmada na documentação oficial (Secção 11: cobrado ao segundo, mínimo $1/mês, provavelmente
   marginal para esta cadência); os valores em $ dos *compute plans* (Starter/Standard/Pro/...)
   só têm confirmação de fontes terceiras, não da própria página do Render (JS-renderizada, não
   acessível à ferramenta de leitura usada) — **confirmar visualmente em `render.com/pricing`
   antes da aprovação final**, dado que esta pesquisa também encontrou registo de tabelas de
   preços/specs do Render erradas a circular a partir deste mesmo tipo de fonte terceira.
5. **Carga contra produção**: nunca, só local, ou com um limite explícito acordado (ex. "nunca
   acima de N VUs autenticados, nunca fora de uma janela de manutenção acordada")? O pool de
   ligações (Secção 6.2) torna isto uma decisão de risco real, não só técnica.
6. **Origem dos ~500 mil eventos não-orgânicos** já existentes em `user_activity_log` (Achado #4
   da auditoria de Analytics) — vale a pena investigar antes de adicionar mais tráfego sintético
   ao mesmo universo de dados, para não dificultar ainda mais a distinção entre uso real e teste.

---

## 15. Files Inspected

**`portugal-na-mao-api`**: `Dockerfile`, `src/main/resources/application.yml`, todos os 31
`@RestController` sob `src/main/java/pt/dot/application/api/` (listados por `find`),
`AuthController.java`, `JwtService.java`, `InternalApiKeyFilter.java`, `UserRole.java`,
`EmailService.java`, `PendingUserRegistrationCleanupJob.java`, `CalendarReminderJob.java`,
`ApplicationJava.java`, rate limiters sob `security/`, `SecurityConfig.java`, `NotificationController.java`,
`SearchController.java`, `TripController.java`, `DistrictController.java`,
`MunicipalityController.java`, migrations `V100`-`V103`, pacote `opendata/**` (34 Runners, grep de
`@ConditionalOnProperty`/`@Scheduled`/`@Controller`).

**`pt-operations-api`**: `SecurityConfig.java`, `ProductionGate.java`, `ProductionGateService.java`,
pacotes completos sob `src/main/java/pt/ptops/` (listagem de módulos), migrations `V1`-`V9` sob
`db/migration`, grep de `@Scheduled`/`@EnableScheduling` (zero resultados), ausência confirmada de
Dockerfile/`render.yaml`/`.github/workflows`.

**`pt-operations-fe`**: `App.jsx`, `Sidebar.jsx`, `DashboardSection.jsx`, `LogsSection.jsx`,
listagem completa de separadores/componentes.

**`PT-portugal-na-mao-fe`**: `render-worker/Dockerfile`, `render-worker/package.json`, ausência
confirmada de `.github/workflows`.

**Workspace raiz**: `PT_ANALYTICS_OBSERVABILITY_REPORT.md` (lido integralmente — base de toda a
Secção 2.3), `LAUNCH_1_0_REPORT.md` (grep de menções a "Render"/deploy, para confirmar
hospedagem e estado de sincronização), `MEMORY.md` (contexto de sessões anteriores, usado só para
orientar a investigação, nunca como fonte de facto sem confirmação no código — uma discrepância
foi encontrada e corrigida: `opendata/` está no branch `main`, não num branch separado).

Todos os factos acima foram obtidos por leitura direta de ficheiros, nunca por execução de código.

---

## 16. Final Git Status

```
portugal-na-mao-api (main): limpo, nenhuma alteração.

pt-operations-api (main): limpo, nenhuma alteração.

pt-operations-fe (main): limpo, nenhuma alteração.

PT-portugal-na-mao-fe (main): alterações pré-existentes de uma sessão concorrente, não tocadas
por esta auditoria (confirmado antes de começar, repetido aqui para registo):
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

portugal-workspace (raiz, main):
?? PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_ARCHITECTURE_PLAN.md
```

Nada staged, nada commitado, nada enviado, nenhuma base de dados ou produção tocada por esta
sessão. O único ficheiro novo em todo o workspace é este relatório.
