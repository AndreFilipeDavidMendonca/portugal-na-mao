# Portugal na Mão — Observabilidade e Cobertura Funcional

**Data:** 2026-10-15. **Tipo:** melhoria de observabilidade + análise de cobertura, ambiente local. **Contexto:** testes de carga reais de 15/10/2026 revelaram 100 agentes/2,8min a dar 6.788 pedidos/88 erros em local vs. 324 pedidos/126 erros em produção (P50 local 129ms vs. prod 30s) — ver `PT_OPERATIONS_SYNTHETIC_LOAD_TESTING_STATUS_REPORT.md` e as correções de performance já aplicadas (`5594bc5`, `portugal-na-mao-api`). Este relatório não repete esse diagnóstico — foca-se em dar ferramentas para o próximo.

**Limites respeitados nesta ronda:** nenhuma fórmula de scoring tocada; nenhum serviço separado (OSRM continua co-localizado); nenhum recurso do Render aumentado; nenhum dado de produção modificado; **nada deployado** — tudo validado só localmente; nenhuma dependência nova adicionada ao `pom.xml`/`package.json`.

---

## 1. O que já existia

- **`api_request_log`/`user_activity_log`** (Analytics & Observability, Fase 1) — já davam tempo de resposta por pedido, código HTTP, erro, utilizador, e já alimentam a vista "App Health" do PT Operations e a vista de detalhe dos testes de carga (P50/P95/P99, ranking por endpoint — ver sessão anterior desta mesma conversa).
- **`spring-boot-starter-actuator`** já estava no `pom.xml` do `portugal-na-mao-api` — mas **sem nenhuma configuração**. Como o `DataSource` é criado pelo mecanismo padrão do Spring Boot (propriedades `spring.datasource.*`, não um `@Bean` manual), o Micrometer já vinha a recolher métricas de HikariCP/JVM/CPU em memória desde sempre — só não havia porta de saída.
- **Scripts k6** (`testing/synthetic.js`, `testing/load.js`) cobrem 6 passos: login, mapa (`/api/pois/lite`), pesquisa, detalhe de POI, distrito, viagem (GET).
- **Padrão de segurança server-to-server já estabelecido:** `/api/internal/**` protegido por `InternalApiKeyFilter` (segredo partilhado), já usado pelo `pt-operations-api` via `PtApiInternalClient` para envio de email.

---

## 2. O que foi melhorado

### 2.1 Observabilidade da API (`portugal-na-mao-api`, commit `82f6821`)

Exposto `health`+`metrics` do Actuator sob **`/api/internal/actuator`** — deliberadamente dentro do prefixo já protegido pela `SecurityFilterChain` existente (`@Order(1)`, `InternalApiKeyFilter`), não uma rota nova a proteger. Zero dependência nova (sem `micrometer-registry-prometheus` — o endpoint `metrics` genérico já chega para consulta ponto-a-ponto).

Validado localmente, com valores reais:

| Métrica | O que mede | Valor local observado |
|---|---|---|
| `hikaricp.connections.acquire` | Tempo **à espera** de uma ligação do pool | média ~1ms |
| `hikaricp.connections.usage` | Tempo **a usar** uma ligação já obtida | média ~39ms |
| `hikaricp.connections.active`/`.pending`/`.max` | Estado do pool agora | 0 ativas / 0 pendentes / 15 máx |
| `process.cpu.usage` / `system.cpu.usage` | CPU do processo Java vs. da máquina toda | funcionando |
| `jvm.memory.used`/`.max` (área heap) | Heap da JVM | funcionando |
| `http.server.requests` | Duração/contagem por `uri`+`method`+`status`, desde o arranque | funcionando (complementa, não substitui, o `api_request_log`) |

**`acquire` vs. `usage` é exatamente a distinção pedida** entre "tempo de espera por recursos" e "tempo de execução efetiva" — antes desta mudança não havia forma nenhuma de a ver.

**Limitação encontrada:** `tomcat.threads.busy`/`tomcat.threads.current` (threads Tomcat) **não aparecem** auto-expostos nesta configuração — confirmado por teste direto (404), não é uma question de exposição mas de o binder não estar a registar essas métricas específicas aqui. Não investigado mais a fundo nesta ronda (ver §7).

### 2.2 Integração com o PT Operations (`pt-operations-api` commit `a09ee6a`, `pt-operations-fe` commit `745993e`)

Novo endpoint `GET /api/local/testing/resources?targetEnv=local|prod`, servido por `ResourceSnapshotService`/`PtApiInternalClient` (reaproveita o cliente e o segredo já existentes, zero código de segurança novo). Novo painel **"Recursos agora"** na tab Testes e Diagnóstico, junto à secção de Teste de Carga — ligações BD ativas/máx, pedidos à espera, espera média vs. uso médio, CPU, heap. Auto-atualiza a cada 5s, pensado para se olhar **durante** um teste de carga em curso.

**Desenho deliberadamente simples:** é uma leitura pontual do momento do pedido, **não está ligada a nenhum `test_run_id`** nem é guardada — correlacionar automaticamente "este endpoint ficou lento porque o CPU estava a 95% nesse preciso segundo" exigiria persistir uma série temporal durante cada execução (nova tabela/coluna), o que ficou fora do âmbito desta ronda para não introduzir uma migração nova sem necessidade comprovada. Ver §7.

### 2.3 Análise do OSRM (sem alterações)

Confirmado por leitura de código: o `osrm-routed` só é chamado a partir de `TripRouteService` (propostas/materialização de viagem, otimização de rota do dia, Smart Suggestions) — **nenhum dos endpoints hoje testados** (`/api/search`, `/api/pois/lite`, `/api/districts/{id}`) o toca. O custo que os testes de carga mostraram é só o **baseline** do processo em repouso (RAM do grafo + CPU residual) — não há competição ativa por CPU durante os testes atuais, porque nenhum deles gera tráfego de rotas.

**Não foi possível medir o consumo real do contentor OSRM** (Docker CLI não disponível nesta máquina) — fica como limitação, não como decisão de não medir.

### 2.4 Cobertura funcional

Inventariados **70 padrões de endpoint distintos** chamados pelo frontend (`PT-portugal-na-mao-fe/src/lib/api.js`). Os cenários k6 atuais cobrem **6** — ver tabela.

| Área funcional | Cobertura atual | Exemplos não cobertos |
|---|---|---|
| Autenticação | Parcial (só login) | registo, verificação de email, reset de password, eliminação de conta |
| Mapa/Pesquisa/POIs | Coberto | — |
| Distritos | Coberto | — |
| **Municípios** | **Zero** | `/api/municipalities`, `/api/municipalities/{id}`, `/api/municipalities/geo`, permissões de edição |
| Localidades | Zero | `/api/localities`, `/api/localities/{id}` |
| **Viagens** | Só GET de uma viagem existente | criação, `/api/trips/materialize`, `/api/trips/proposals`, **`/api/trips/*/route-preview` (único caminho que toca o OSRM — nunca testado)** |
| **Social** | **Zero** | amizades, chat, notificações, feed, comentários, favoritos, utilizadores próximos |
| Perfil/conta | Zero | `/api/me`, avatar, localização, guia |
| Conteúdo | Zero | guias, calendário, eventos, sugestões |
| Media | Zero | upload |
| Admin | Zero | gestão de utilizadores |

---

## 3. Métricas disponíveis após deploy

Hoje, em produção, estas métricas **não existem** — `GET /api/local/testing/resources?targetEnv=prod` devolve tudo `null` (testado, comportamento correto/gracioso, não um erro). Assim que `portugal-na-mao-api` for deployado com o commit `82f6821`, ficam disponíveis em produção:

- Espera real por ligações HikariCP sob carga (vai confirmar ou refutar se os 10 slots de `DB_POOL_MAX` em produção chegam, algo que os testes de carga anteriores não conseguiam distinguir de lentidão por CPU).
- CPU do processo vs. CPU total do sistema — com 1 vCPU partilhado com o `osrm-routed`, isto devia mostrar claramente se a JVM está a saturar o core sozinha ou se há contenção com o OSRM.
- Heap JVM em uso vs. `-Xmx768m` recém-configurado (`5594bc5`) — para confirmar se o valor escolhido é generoso ou apertado de mais, sem ter sido medido ainda contra produção real.

---

## 4. Como interpretar os próximos testes

1. Antes de correr um teste de carga a sério contra produção, **abrir o painel "Recursos agora"** (ambiente Produção) numa aba à parte, e olhar para ele enquanto o teste decorre.
2. Se `CPU do processo` subir perto de 100% e `Pedidos à espera de ligação` ficar em 0 → confirma a hipótese já levantada (CPU é o limite, não o pool).
3. Se `Pedidos à espera de ligação` subir e `Espera média por ligação` disparar, mesmo com CPU não saturado → é mesmo o pool, não o CPU — conclusão diferente da que tínhamos.
4. Comparar `hikaricp.connections.usage` (tempo de uso) antes/depois de uma mudança de código no `DistrictService` é uma forma direta de medir se uma otimização de round-trips teve efeito real, sem depender só da duração ponta-a-ponta do pedido.

---

## 5. Limitações e próximos passos

- **`tomcat.threads.*` não exposto** — não investigado a fundo; próximo passo seria confirmar se precisa de um `TomcatMetricsBinder` explícito.
- **Sem medição real do OSRM** — Docker CLI indisponível nesta máquina; medir via `docker stats` (ou equivalente no Render) fica pendente.
- **Snapshot de recursos não persiste nem se liga a um `test_run_id`** — é "agora", não histórico. Ligar isto a cada execução de teste (guardar um snapshot no fim de cada run) é a iteração natural seguinte, mas precisa de uma migração nova — deixado de fora deliberadamente desta ronda.
- **Cobertura funcional:** inventário feito, mas **nenhum cenário k6 novo foi escrito** — por decisão de manter esta ronda a "preparar", não "implementar" otimizações/testes especulativos, como pedido. A prioridade mais clara para a próxima expansão, pela proximidade ao que já existe: um cenário de **municípios** (mesmo padrão que distritos) e um de **`route-preview`** (única forma de meter o OSRM sob medição real).
- **Nada disto está em produção** — os três commits (`82f6821`, `a09ee6a`, `745993e`) estão em `origin/main` dos respetivos repositórios, prontos a deployar quando decidires, mas nenhum deploy foi feito nesta ronda.
