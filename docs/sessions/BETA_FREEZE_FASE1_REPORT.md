# Operation Beta Freeze — Fase 1 (Performance & Limpeza)

Relatório da passagem de otimização pré-lançamento da **Portugal na Mão — Beta 1.0 (Stable)**.

Âmbito respeitado: nenhuma funcionalidade, UX, API, regra de negócio ou schema de base de dados foi alterada. Nenhum commit, push ou deploy foi efetuado — todas as alterações estão apenas no working tree local dos dois repositórios (`PT-portugal-na-mao-fe` e `portugal-na-mao-api`).

---

## 1. Frontend Performance

| Ficheiro | Alteração | Impacto |
|---|---|---|
| `MapExplorer.jsx` | Extraídos `PoiMarkerItem`/`TripPoiMarkerItem` como `React.memo` | Cada marker só re-renderiza quando os seus próprios props mudam, não a cada pan/zoom |
| `TripsPanel.jsx` | `TripListCard` memoizado, `coverImg` movido para `useMemo` | Evita recalcular a imagem de capa por cada viagem a cada render |
| `TripsPanel.jsx` | `TripChatMessage` memoizado | Reduz re-render das mensagens a cada poll de 5s |
| `GlobalInlineSearch.jsx` | `DistrictResultItem`/`PoiResultItem` memoizados | Menos trabalho por keystroke na pesquisa |
| `FriendsPanel.jsx` | `FriendListItem` memoizado | — |
| `NotificationsPanel.jsx` | `NotificationItem` memoizado | Reduz custo do poll de 15s |
| `AdminPanel.jsx` | `AdminPoiCard` memoizado | — |
| `FavoritesDrawer.jsx` | `FavoriteItem` memoizado | — |
| `App.js` | `TripsPanel`, `FriendsPanel`, `AdminPanel`, `ProfilePanel` convertidos para `React.lazy` + `Suspense fallback={null}` | Bundle principal −9.23 kB gzip; 4 chunks lazy confirmados no build |

**Não alterado (com justificação):**
- Linhas do itinerário (dias/POIs em `TripsPanel.jsx`) — fortemente acopladas ao estado de drag-and-drop (`drag`/`overCell`/`movingPoiId`); extrair arriscava alterar esse comportamento.
- Dependência `poiCache` no `useMemo` de POIs próximos (`PoiModal.jsx`) — entradas da cache podem ser atualizadas in-place (ex. enriquecimento de imagem) sem mudar o tamanho; qualquer redução barata da dependência arriscava resultados desatualizados.

Debounce da pesquisa (200ms) já estava correto — sem alterações necessárias.

## 2. Mapa

| Ficheiro | Problema | Correção |
|---|---|---|
| `MapExplorer.jsx` (`DistrictLayer`) | `layer.on(...)` sem `.off()` prévio nos handlers do GeoJSON | Adicionado `layer.off()` defensivo antes do bind. Nota: análise mais aprofundada indica que o remount total via `key` já limpa corretamente os listeners antigos — não era uma fuga acumulativa real, mas o fix é inofensivo e reforça a robustez a futuras refactorizações |
| `MapExplorer.jsx` (`FitBounds`) | Efeito não reajustava a câmara quando favoritos/POIs de viagem mudavam depois de já se estar em modo favoritos/viagem (faltavam `favPois`/`trips` nas deps) | Deps corrigidas — comportamento passa a corresponder à intenção original do código |

Clustering/incremental marker diffing, tooltips e guided tour foram revistos e estão corretos — sem loops de render nem listeners não removidos adicionais encontrados.

## 3. Backend Performance

7 correções de N+1 implementadas, todas via `JOIN FETCH`/queries batched — sem alterar contratos de API nem lógica de negócio:

| # | Serviço | Problema | Correção |
|---|---|---|---|
| 1 | `FriendshipService.getFriends()` | Query de mensagens não lidas por amigo, em loop | Query batched agrupada por remetente |
| 2 | `NotificationService` | `actor` lazy-loaded por notificação | `LEFT JOIN FETCH n.actor` |
| 3 | `TripService.getTripPois()` | `addedBy` lazy-loaded por POI guardado | `LEFT JOIN FETCH tsp.addedBy` |
| 4 | `TripService.getMyTrips()` | Contagem de participantes + `hasNews` por viagem, em loop (endpoint mais chamado — poll 5s) | Contagem batched (`countByTripIdIn`) + `computeHasNewsForTrips` com 3 queries totais em vez de 3×N |
| 5 | `ChatService.getMessages()` | `userA`/`userB` lazy-loaded na validação de membership | Novo `findByIdWithUsers` com `JOIN FETCH` |
| 6 | `ChatService.sendMessage()` | Entidade `Poi` completa carregada só para validação | Substituído por `existsById` |
| 7 | `TripService.addParticipant()` | `requester`/`receiver` lazy-loaded | `JOIN FETCH` na query de amizade |

**Fora de âmbito (reportado, não aplicado):** dois índices de base de dados foram identificados como benéficos (`trip_user(trip_id, created_at)`, `chat_message(sender_id, receiver_id, read_at)`) mas implicariam uma nova migração Flyway — excluído por instrução explícita de não alterar a base de dados.

`PoiService` foi identificado como um serviço grande com responsabilidades mistas (negócio, upload de media, enriquecimento) — recomendação de split para trabalho futuro, não executado nesta passagem por ser mais invasivo do que "apenas performance".

**Verificação:** `mvn compile` e `mvn test-compile` passam sem erros (não existe suite de testes em `src/test`).

## 4. Limpeza

**134 ficheiros `.md` obsoletos removidos** (relatórios de dry-run/apply/probe de operações já concluídas, todos rastreados em git e portanto recuperáveis via histórico caso necessário):
- 4 na raiz de `portugal-workspace`
- 26 na raiz de `portugal-na-mao-api`
- 102 em `portugal-na-mao-api/archive/reports/` (mantidos os 11 relatórios finais/consolidados: `NATURE_ENRICHMENT_CONSOLIDATED_REPORT.md`, `NATURE_GLOBAL_ENRICHMENT_ROADMAP_REPORT.md`, `NATURE_ENTITY_RESOLVER_DESIGN_REPORT.md`, entre outros)

**Mantidos:** README de cada repo, `ENRICHMENT_METHODOLOGY.md`, `ENRICHMENT_FINAL_HISTORY.md`, documentação de District Enrichment (Phase 2/3, Source Mapping, Wikidata Analysis), roadmaps, `ptdot-ops-template.md`, e os relatórios/diagnósticos ainda ativos na raiz do workspace.

**TODOs verificados:** apenas 1 encontrado (`AppContext.jsx:501`, sobre limitação da API para criação de viagens) — item arquitetural genuíno, não resolvido, mantido como está. Zero TODO/FIXME no backend Java.

**Não tocado (decisão do utilizador):** ~480MB de dumps/backups de base de dados (`*.dump`/`*.sql`/`*.backup`) na raiz da API — já excluídos do git via `.gitignore`, mas são dados e não código, deixados intactos por serem potencialmente o único backup local existente.

## 5. Runners

Todos os 5 runners Python de raiz (`nature_enrichment_runner.py`, `wikidata_id_enrichment_runner.py`, `nature_entity_resolver.py`, `shared_qid_analyzer.py`, `wrong_shared_qid_resolver.py`) e as bibliotecas partilhadas `common/` e `sources/` continuam ativos e reutilizados entre si — mantidos sem alteração.

**5 scripts já arquivados removidos** de `archive/scripts/` (confirmado sem qualquer referência no resto do código): `manual_source_probe.py`, `nature_enrichment_probe.py`, `nature_external_links_probe.py`, `osm_wikidata_bridge_probe.py`, `cipa_enrichment_test.py`.

**Mantido por ambiguidade:** o par `poi_category_dry_run.py` / `poi_category_apply.py` em `archive/scripts/` — interligados (um importa o outro), sem uso fora desse par; não foram removidos por não ter sido uma decisão explícita nesta passagem. Recomenda-se removê-los numa futura limpeza se a correção de categorias que suportavam já estiver concluída e aplicada.

Sem sobreposição real detetada entre os runners Python e o pipeline `opendata/` em Java — Python consome tabelas de staging que o Java popula (APA, ICNF), sem duplicar lógica de negócio.

## 6. Reutilização

A extração de componentes de lista memoizados (secção 1) já capturou a maior oportunidade de reutilização desta passagem — cada `*Item`/`*Card` extraído é agora uma unidade isolada e testável. Não foram identificadas outras oportunidades de hooks/helpers partilhados com benefício claro o suficiente para justificar extração nesta fase (o hook de polling centralizado, `usePollingManager`, já tinha sido extraído numa passagem anterior).

## Recomendações para pós-Beta 1.0

1. Adicionar os 2 índices de base de dados identificados (`trip_user`, `chat_message`) via migração Flyway dedicada.
2. Considerar split de `PoiService` em responsabilidades mais pequenas (media, enriquecimento, negócio).
3. Refatorar `AppContext.jsx` (frontend) em contexts mais pequenos — hoje qualquer consumidor de `useApp()` re-renderiza a cada mudança de estado global, mesmo que só use uma fração pequena do contexto.
4. Decidir o destino do par `poi_category_dry_run.py`/`poi_category_apply.py`.
5. Rever os ~480MB de dumps/backups na raiz da API para arquivo externo ou remoção manual, fora deste processo automatizado.
