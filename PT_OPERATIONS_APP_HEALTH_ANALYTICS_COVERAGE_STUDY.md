# App Health & Product Analytics — Estudo de Cobertura e Apresentação de Dados

**Data:** 2026-10-16. **Tipo:** estudo, read-only — nenhum código alterado nesta sessão (os achados de hoje sobre tráfego de teste já foram corrigidos antes deste documento, ver `2631137`). **Pergunta:** como aumentar a cobertura de performance/teste/logging, e como mostrar melhor os dados já existentes.

---

## 1. Resumo executivo

A infraestrutura de observabilidade (actuator, `api_request_log`, scripts k6, PT Operations) está sólida e já corrigida de um bug real (tráfego de teste a poluir Analytics, `2631137`). **O maior ganho disponível agora não é recolher mais dados — é apresentar melhor os que já existem.** Confirmei um problema concreto, com números reais: as tabelas de ranking do App Health agrupam por `path` literal, sem normalizar IDs — isso **fragmenta cada funcionalidade em dezenas de linhas invisíveis**, escondendo exatamente a informação que essas tabelas deviam mostrar.

---

## 2. Achado principal — fragmentação de endpoints por ID

Medido agora em produção (48h, só tráfego real, já sem testes):

- **`GET /api/pois/{id}`** aparece como **108 linhas distintas** na BD (`/api/pois/49992`, `/api/pois/68887`, …), somando **244 pedidos reais** — mas nenhuma dessas linhas, isolada, chega perto do "top 8" do ranking. A funcionalidade "ver detalhe de um POI" é provavelmente uma das mais usadas da app, e está **invisível** nas tabelas atuais.
- No total, só nas últimas 48h, há **321 paths distintos** para **3.099 pedidos** — a maioria dessa variedade são IDs (POIs, conversas de chat, utilizadores), não funcionalidades diferentes.
- O mesmo problema afeta `/api/chat/{conversationId}/messages`, `/api/trips/{id}`, `/api/districts/{id}` (menos grave aqui, só 20 distritos), `/api/municipalities/{id}`, `/api/localities/{id}`.

**Porque isto importa para as duas coisas que pediste:** em performance, "qual endpoint é mais lento" fica errado se os pedidos de um endpoint estão espalhados por 100 linhas em vez de agregados numa só. Em Product Analytics, "o que é mais usado" está a subestimar sistematicamente qualquer funcionalidade identificada por ID.

**Correção recomendada (não implementada, por ser um estudo):** normalizar o `path` para um template antes de agrupar — `/api/pois/49992` → `/api/pois/{id}`, `/api/chat/<uuid>/messages` → `/api/chat/{id}/messages`, etc. Duas formas de o fazer:
1. **Na leitura** (SQL, `regexp_replace` no `GROUP BY`) — zero migração, aplica-se também a dados já gravados. Mais simples, recomendo começar aqui.
2. **Na escrita** (`RequestLoggingFilter` grava o template em vez do path literal, ex. via `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` do Spring, que já sabe o padrão da rota Spring MVC que respondeu) — mais robusto a longo prazo, mas é mudança de schema/comportamento de escrita, mais peso para uma primeira correção.

---

## 3. Cobertura de performance/teste — ponto da situação

| Área | Estado |
|---|---|
| HikariCP (espera vs. uso) | ✅ exposto, testado, por execução (`test_run_resource_sample`) |
| CPU/JVM | ✅ exposto, testado |
| Threads Tomcat | ❌ não exposto pelo binder do Actuator nesta configuração (achado de 15/10, não investigado a fundo) |
| Endpoints testados por k6 | 14 de ~70 no frontend — mapa, pesquisa, POI, distrito, município, localidade, viagem (GET), route-preview (OSRM), 5× social (leitura) |
| Por cobrir | chat (precisa de 2º utilizador técnico), criação real de viagem, perfil/conta, guias/calendário/eventos, admin |

**Prioridade sugerida para a próxima ronda de cobertura**, por impacto vs. esforço:
1. **Perfil/conta** (`/api/me`, `/api/me/location`) — já tem tráfego real visível (83 pedidos a `POST /api/me/location` nas últimas 48h), zero esforço de seed, só autenticação já existente.
2. **Criação de viagem** (`POST /api/trips`, `/api/trips/materialize`) — fecha o ciclo "ver proposta → criar viagem a sério", mas precisa de limpar o que cria (ou aceitar que deixa viagens de teste reais na BD — decisão a tomar, não assumir).
3. Chat/guias/admin — menor prioridade, mais esforço de seed (2º utilizador, conteúdo de guia, permissões admin).

---

## 4. O que já existe para apresentar dados (não repetir)

- **App Health** (`ApiPerformanceSection.jsx`): série temporal, rankings mais-usado/mais-lento/mais-rápido, distribuição de erros, histograma de duração, tabela de pedidos recentes com filtros. Já bastante completo — o problema não é falta de gráficos, é os dados que alimentam os rankings estarem fragmentados (§2).
- **Product Analytics** (`LogsDashboardSection.jsx`): eventos de UX (`user_activity_log`, `trackEvent`), utilizadores ativos, pesquisas mais populares, POIs mais vistos, por tipo de evento/categoria/utilizador. Sistema de eventos deliberado, diferente do `api_request_log` — já funciona bem para o que foi desenhado.
- **Testes e Diagnóstico** (`TestingSection.jsx`): "Recursos agora" (ao vivo) + "Recursos durante o teste" (por execução, desde 15/10).

---

## 5. Recomendações concretas de apresentação (novo, a considerar)

Por ordem de valor esperado:

1. **Corrigir a fragmentação (§2)** — maior impacto, menor esforço. Sem isto, qualquer gráfico novo construído sobre `endpointStats` herda o mesmo problema.
2. **"Funcionalidades mais usadas" como vista de produto, não só de endpoint técnico** — depois de normalizar paths, uma tradução simples path→nome legível ("ver POI", "ver viagem", "pesquisar") dá uma tabela que faz sentido para alguém que não é a pessoa a programar, reaproveitando a mesma técnica que `SyntheticStepsChart`/`JOURNEY_STEPS` já usa para a Verificação da Aplicação.
3. **Gráfico de P95 ao longo do tempo** (não só agora) — o App Health já tem série temporal de `avg_ms`/erros; falta P95/P99 na mesma série, que é o que mais interessou nos achados de performance desta semana (a média escondia os problemas reais de cauda).
4. **Correlacionar recursos com volume real** — sobrepor `hikaricp.connections.active`/CPU (já recolhidos para testes) com o volume de pedidos REAIS ao longo do dia, não só durante testes — dá visibilidade a picos de uso real antes de se tornarem incidentes, sem esperar pelo próximo teste de carga.
5. **"Taxa de conclusão" de percursos de utilizador** — ex. quantos `SEARCH` (evento) terminam em `POI_DETAIL` terminam em `TRIP_CREATED` — um funil, não só contagens isoladas. Dados já existem em `user_activity_log`, falta só a vista.

---

## 6. O que não fazer agora

Por coerência com o resto desta sessão (baixo risco, incremental): não propor nova infraestrutura (sem Prometheus/Grafana, sem outro serviço) — tudo acima é ou SQL sobre dados já existentes, ou composição de componentes de frontend já existentes (`TimeSeriesChart`, `CategoryBarChart`). Não mexer em `user_activity_log`/scoring. A correção de fragmentação (§2) é a única coisa aqui com uma recomendação suficientemente concreta para avançar diretamente para implementação, se quiseres.
