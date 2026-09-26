# SEARCH_MAP_BBOX_PERFORMANCE_AUDIT

Data: 2026-09-26
Âmbito: **Fase 1 — diagnóstico read-only.** Nenhum código foi alterado. Nenhuma migration foi aplicada. Nada foi commitado. Todas as medições foram feitas contra o backend local (`localhost:8091`) e o código dos dois repositórios (`portugal-na-mao-api`, `PT-portugal-na-mao-fe`).

Convenção: todos os tempos são medições reais (`curl -w "%{time_total}"`, 3-5 repetições), nunca estimativas. Onde não foi possível medir, isso está dito explicitamente.

---

## 0. Resumo executivo

Há **dois bugs de causa-raiz concretos**, um em cada camada, que juntos explicam o sintoma reportado ("escreve, aparece Sem resultados, depois aparecem resultados"):

1. **Backend** — uma pesquisa (`/api/search`) sem nenhum resultado por substring é 5-15× mais lenta que uma pesquisa com resultados, porque cai num fallback de fuzzy-matching em Java sobre até 25 000 POIs. Uma pesquisa normal demora ~30-100ms; uma pesquisa "sem resultados" demora ~420-720ms.
2. **Frontend** — em `GlobalInlineSearch.jsx`, o `.finally(() => setLoading(false))` de cada pedido corre mesmo quando esse pedido foi cancelado (abortado) por uma keystroke mais recente. Isso limpa a flag `loading` **antes** do pedido atual (o que realmente importa) responder — e como o `results` ainda não foi atualizado, a UI mostra "Sem resultados" nesse intervalo, até a resposta certa chegar e substituir.

O bug #2 sozinho já causaria o sintoma ocasionalmente; o bug #1 torna-o muito mais provável, porque alarga a janela de corrida de poucos milissegundos para várias centenas de milissegundos sempre que um prefixo intermédio da pesquisa (ex. "ca", "cas" antes de "castelo") não bate com nada por substring.

Adicionalmente: **cada keystroke na search bar já dispara dois pedidos HTTP em paralelo** (o dropdown de resultados `/api/search` e um refresh do mapa `/api/pois/lite?...&search=`), com o mesmo debounce de 200ms — isto é uma escolha deliberada de design (documentada no código, "mapa nunca atrasado face à pesquisa"), não um bug, mas duplica a exposição ao fallback lento do ponto 1.

**Correção importante à premissa "bbox + limit=100":** essa regra **não corresponde ao código atual** — o mapa já calcula um `limit` dependente do zoom (`zoomLimit()` em `MapExplorer.jsx:93-104`, de 20 a zoom≤8 até 600 a zoom≥17), e só coincide com 100 quando o zoom está exatamente no nível 13. Isto não foi reintroduzido por nós nem por ninguém nesta sessão — já estava assim no código lido. Ver §5 e §10, corrigido face à primeira leitura.

**Achado adicional, cruzado com uma sessão concorrente (ver §9):** existe uma segunda instância de `GlobalInlineSearch` sempre montada (desktop `TopBar` + mobile `MobileHeader` — ambos renderizados incondicionalmente em `App.js:78,82`, só escondidos por CSS `hidden lg:flex`/`lg:hidden`, nunca desmontados). Cada uma corre o seu próprio debounce/estado/pedido — **toda pesquisa dispara `/api/search` duas vezes**, independentemente de qual layout está visível. Verificado por nós diretamente no código (`App.js`, `TopBar.jsx:69`, `MobileHeader.jsx:92`); verificado ao vivo (Network tab, 2 GETs idênticos por pesquisa) por uma sessão concorrente — ver §9.

Não foi encontrado nenhum índice em falta na query de bbox. A suspeita de zoom-based limit foi verificada e **confirmada como já existente** (não escondida/reintroduzida agora) — ver correção acima e §10.

---

## 1. Search Bar — estados e fluxo (frontend)

Ficheiro: `PT-portugal-na-mao-fe/src/components/shared/GlobalInlineSearch.jsx`

Estado: `results` (objeto com 4 arrays: districts/municipalities/localities/pois), `loading` (bool), `resultsOpen` (bool). Não há uma state machine explícita idle/searching/results — é inferida a partir de `loading` + `results`.

Fluxo por keystroke (`useEffect` nas linhas 104-145):
1. Query com menos de 2 caracteres → limpa tudo, sem pedido.
2. Query com 2+ caracteres → `setLoading(true)` **imediatamente**, síncrono, antes de qualquer debounce.
3. Agenda um `setTimeout` de 200ms. Se houver outra keystroke antes disso, o `clearTimeout` do cleanup cancela este timer sem nunca chegar a disparar (debounce clássico "reset por keystroke").
4. Quando o timer dispara: aborta o `AbortController` anterior (se existir), cria um novo, chama `fetchSearch(...)`.
5. `.then` → `setResults(...)`. `.catch` → só limpa resultados se `err.name !== "AbortError"` (correto: `apiFetch`/`jsonFetch` em `lib/api.js` usam `fetch` nativo sem engolir o `AbortError`, o `.name` chega intacto). `.finally` → `setLoading(false)`.

Render:
```
{loading ? "A procurar…" : `${resultCount} resultado(s)`}
...
{!loading && !hasResults && <p>Sem resultados "…"</p>}
```
Isto **parece** correto à primeira vista (o "sem resultados" só aparece quando `!loading`), mas o `.finally` do passo 5 é o problema: ver §4.

## 2. Mapa / BBOX — estados e fluxo (frontend)

Ficheiro: `PT-portugal-na-mao-fe/src/components/map/MapExplorer.jsx`, componente `BboxLoader` (linhas 209-323).

- Um único `timerRef` + `abortRef` partilhado entre **todas** as fontes de reload (moveend, zoomend, mudança de distrito/município/categoria/visibilidade/pesquisa) — implementação limpa, sem duplicação: qualquer novo `load()` cancela o timer pendente e aborta o pedido em voo antes de agendar o próximo. Zoom in/out repetido rapidamente só deve gerar **um** pedido HTTP por pausa de 200ms — não há bug de requests em cascata aqui.
- `limit` é sempre calculado no frontend (`zoomLimit(zoom)`, linha 239) e enviado explicitamente — nunca omitido.
- **Confirmado (linhas 267, 278, 315-320): o texto da search bar (`searchQuery`) é reenviado ao endpoint de bbox como parâmetro `search=`, com o mesmo debounce de 200ms.** Comentário no próprio código: *"Reload as the global search query changes — same debounce as the search box itself, so results and the map converge together instead of the map lagging behind."* — ou seja, cada keystroke que assenta dispara o dropdown **e** um refresh do mapa, em paralelo, ambos sujeitos ao mesmo custo de backend (incluindo o fallback lento do §3).
- Renderização de markers: `PoiMarkerItem` é `React.memo`. A lista `visible` é `useMemo` sobre `mapPois` (entre outras deps). Cada fetch novo produz um array de objetos JSON novo (novas referências), o que **provavelmente** invalida o memo de cada marker a cada fetch mesmo que o conteúdo não mude — isto **não foi medido** (precisaria de profiling React em runtime), fica registado como observação de código, não como facto medido.

## 3. Backend — `/api/search` (medido em `localhost:8091`)

Ficheiros: `SearchController.java`, `SearchService.java`, `FuzzyNameMatcher.java`.

| Cenário | Tempo médio (3-5 medições) |
|---|---:|
| `q=c` (1 char, guarda `length<2`) | ~1ms |
| `q=castelo` (com resultados) | 36-106ms |
| `q=ca` (prefixo, com resultados) | 235ms (1ª vez) / rápido depois |
| `q=xyzxyznotfound` (sem nenhum resultado) | **420-720ms** |
| `q=asdkjqweqwe` (sem nenhum resultado) | **445-528ms** |
| unscoped (POI+Locations) `q=castelo` | 36-264ms |
| scoped por categoria (só POI, sem Locations) `q=castelo&category=Castelos` | **6-10ms** |
| `q=mosteiro` (com resultados) | 26-29ms |

### Causa-raiz do custo "sem resultados" (`SearchService.java:105-118`, `304-316`)

Quando a pesquisa não escopada (sem `districtId`/`municipalityId`/`localityId`/`category`) não encontra nada por substring em distrito, município, localidade **e** POI, cai num fallback:
```java
FuzzyNameMatcher.fuzzyMatch(poiRepository.findActiveForFuzzy(FUZZY_POOL_LIMIT), q, this::poiName, limPois)
```
`FUZZY_POOL_LIMIT = 25_000` — busca até 25 000 POIs completos da BD e, **em Java**, calcula distância de Levenshtein entre a query e o nome completo **e cada palavra individual** de cada um (`FuzzyNameMatcher.java:50-58`), ordena por distância. Isto é o que os 420-720ms medidos representam. É o mesmo mecanismo reutilizado pelo endpoint de bbox (`fallbackSearchInBbox`, ver §5), com pool menor (5 000, limitado ao bbox).

Este fallback existe deliberadamente (tolerância a typos, comentado no código como "last resort") — não é um bug de lógica, mas o seu custo é uma ordem de grandeza acima do caminho normal, e é pago **sempre que um prefixo digitado ainda não corresponde a nada por substring**, o que acontece com frequência durante a digitação normal (ex. "ca", "cas" antes de bater com "castelo" ou qualquer nome real).

### Custo específico de "Locations" (distrito+município+localidade)

Comparação isolada (mesma query, mesmos resultados de POI, com e sem passar pelo ramo de Locations):
- Unscoped (POI + District + Municipality + Locality, 4 queries sequenciais): ~40-80ms
- Scoped por categoria (só POI): ~7-10ms

**Locations acrescenta ~30-70ms** ao tempo de resposta — real, mensurável, mas secundário face aos 400-700ms do fallback fuzzy. As 4 queries (district/municipality/locality/poi) correm **sequencialmente dentro do mesmo request HTTP** — não são pedidos HTTP separados nem paralelos; é uma única chamada de rede do frontend, com trabalho sequencial no backend.

A pesquisa de `Locality` (`LocalityRepository.searchByName`) inclui, além do `LIKE`, uma condição de deduplicação (`VISIBLE_CONDITION`) com 2 subqueries correlacionadas por linha candidata — uma delas calcula distância de haversine contra outras localities do mesmo município com nome igual, para esconder duplicados Vila/Freguesia (lógica documentada, decisão de produto de 2026-09-16, não um bug). Contribui para os ~30-70ms acima, mas não isoladamente medido à parte das outras 3 queries.

### Cache

Nenhum cache encontrado em `/api/search` (Spring Cache, Caffeine, etc.). Repetir a mesma query não mostra melhoria (não testado explicitamente aqui porque o efeito de connection/JIT warm-up já tinha estabilizado nas primeiras medições).

## 4. Race condition confirmada — causa-raiz do "Sem resultados" prematuro

Mecanismo exato (`GlobalInlineSearch.jsx:117-143`):

1. Utilizador digita, prefixo A dispara (após 200ms) um pedido cujo texto **não bate com nada por substring** → cai no fallback fuzzy do §3, ainda em voo (400-700ms).
2. ~200ms depois, outra keystroke assenta (prefixo B). O `setTimeout` de B dispara, e a primeira linha do seu corpo é `abortRef.current.abort()` — isto aborta o pedido A, que **ainda estava em voo**.
3. A promise de A rejeita com `AbortError`. O `.catch` corretamente ignora (não mexe em `results`). Mas o `.finally(() => setLoading(false))` de A **corre na mesma**, porque `finally` corre em qualquer resolução da promise, incluindo rejeição por abort.
4. Nesse instante: `loading = false`, mas `results` continua vazio (o pedido B, o que agora importa, ainda não respondeu). `hasResults` é `false`. A condição de render `{!loading && !hasResults && <Sem resultados>}` é verdadeira → **"Sem resultados" aparece na tela.**
5. Pouco depois (tipicamente 30-100ms, tempo de resposta normal de B), B resolve, `setResults(...)` e `setLoading(false)` (idempotente) — os resultados corretos substituem a mensagem.

Isto reproduz exatamente o sintoma descrito: "escreve, aparece Sem resultados, depois aparecem resultados". A janela de exposição depende inteiramente de quanto tempo A ainda tinha pela frente quando foi abortado — e como o §3 mostra, prefixos "sem match" (muito comuns a meio da digitação de palavras longas) são exatamente os que demoram mais (400-700ms), alargando essa janela em vez de a mantê-la nos poucos milissegundos que seriam inofensivos.

**Confirmado por leitura de código, com evidência de tempos reais (curl) para o mecanismo subjacente.** Não foi possível confirmar visualmente no browser ao vivo: a tab de Chrome disponível estava a ser pilotada em simultâneo por outra sessão (`portugal-workspace-e4`, ver nota no §8) — ao tentar reproduzir a corrida manualmente, uma ação minha colidiu com o estado dessa sessão (abriu-se um drawer de localidade inesperado). Parei a automação de browser nesse ponto para não continuar a interferir, e validei o mecanismo por leitura de código + medições isoladas de backend em vez de captura de ecrã ao vivo.

## 5. Backend — `/api/pois/lite` (bbox)

Ficheiros: `DistrictPoiController.java`, `DistrictPoiQueryService.java`, `PoiRepository.findLiteByBboxTiered`.

| Cenário | Tempo médio |
|---|---:|
| bbox pequeno (Lisboa centro) | 28-75ms |
| bbox médio (~1 distrito) | 33-36ms |
| bbox país inteiro | **270-410ms** |
| bbox país inteiro + `category=Natureza` | **19ms** |
| bbox país inteiro repetido 5× (mesma query) | 270-410ms sempre — **sem cache** |

Tamanho de resposta: bbox pequeno e bbox país inteiro devolvem praticamente o mesmo volume de bytes (~30-32KB) porque `limit=100` é sempre respeitado — a diferença de tempo **não é** o tamanho da resposta, é o trabalho feito antes do corte.

### Verificação explícita da regra "bbox + limit=100" (pedido do utilizador) — **premissa corrigida**

A leitura inicial (baseada só em `api.js`) levou-nos à conclusão errada de que `limit=100` é fixo. Ao confirmar contra o chamador real (`MapExplorer.jsx`), isso não se sustenta:

- `BboxLoader.load()` (`MapExplorer.jsx:239`) calcula `const limit = zoomLimit(zoom)` e passa-o explicitamente a `loadPoisForBbox`. `zoomLimit()` (linhas 93-104) devolve **20** a zoom≤8, 50 a zoom 9-11, 70 a zoom 12, **100 a zoom 13**, 140 a zoom 14, 200 a zoom 15, 350 a zoom 16, 600 a zoom≥17.
- `api.js:268` (`qs.set("limit", String(Math.min(opts.limit ?? 100, 800)))`) só cai no `?? 100` quando **nenhum** `opts.limit` é passado — o que não é o caso do mapa: o `100` aí é apenas um valor de segurança para outros chamadores de `fetchPoisLiteBbox` (se existirem), não o comportamento real do mapa.
- Backend (`DistrictPoiQueryService.java:81-84`): existe também uma tabela de zoom→limit própria (`resolvePrincipaisZoomCap`/`TODOS_ZOOM_POLICY`), usada como fallback só quando `limit` vem `null` — mas como o frontend **sempre** manda um `limit` (variável por zoom, não fixo), é a tabela do **frontend** (`zoomLimit()`) que decide o valor real na prática, não a de fallback do backend.
- **Conclusão corrigida: a app já tem lógica de zoom-based limit hoje, no frontend, ativa e em uso — não foi reintroduzida por ninguém nesta sessão, já estava lá.** Se a intenção do produto for mesmo um `limit=100` fixo independente de zoom, isso implica **simplificar** `zoomLimit()` para uma constante — uma decisão de produto/UX (quantos POIs aparecem a cada zoom), não uma otimização de performance; não alterámos nada disto nesta fase.
- As medições de bbox do início desta secção usaram `&limit=100` explícito via curl para isolar o comportamento de uma única query — **não replicam exatamente** o valor que o mapa real envia a cada zoom (que pode ser tão baixo como 20 ou tão alto como 600); a forma da curva custo-por-candidato descrita abaixo mantém-se válida, mas os números da tabela devem ser lidos como "para limit=100", não como "o que a app faz hoje a qualquer zoom".

### Porque é que o bbox país inteiro é 5-10× mais lento

A query (`PoiRepository.findLiteByBboxTiered`) filtra por `p.lat BETWEEN ... AND p.lon BETWEEN ...` — **comparação numérica simples sobre colunas `lat`/`lon`**, não PostGIS/geometry. Existe um índice composto `idx_poi_lat_lon (lat, lon)` (migration `V53__poi_lat_lon_index.sql`), por isso o filtro em si é indexado.

O custo extra vem de **subqueries correlacionadas por linha candidata**, antes do `ORDER BY score LIMIT`:
- uma subquery `SELECT storage_key FROM media_item ... LIMIT 1` (imagem de capa) por POI candidato;
- dois `EXISTS` (elegibilidade + imagem VALID) por POI candidato.

Estas usam índices existentes em `media_item` (`idx_media_item_entity(entity_type, entity_id)` e `idx_media_item_entity_position`, migration `V9`), portanto não há índice em falta — mas o custo destas subqueries escala com o **número de candidatos dentro do bbox antes do corte por `limit`**, não com os 100 devolvidos. Um bbox de país inteiro tem ordens de magnitude mais candidatos do que um bbox de cidade, daí os 270-410ms. Um filtro de categoria reduz drasticamente os candidatos logo na cláusula `WHERE`, e por isso derruba o tempo para 19ms mesmo com o mesmo bbox gigante — isto confirma o diagnóstico (não é um índice em falta, é volume de candidatos × custo por candidato).

Existe também uma segunda query por request (contagens por categoria para os chips de filtro, `countByCategoryInBboxMain`/`Filtered`), separada da query principal — não isolada nas medições acima (o tempo medido é o do endpoint completo, que inclui as duas).

### Fallback fuzzy no bbox (mesma família do §3)

`DistrictPoiQueryService.fallbackSearchInBbox` (linhas 283-316): quando um bbox+`search=` não encontra nada por substring dentro do viewport, faz o mesmo tipo de fallback Java/Levenshtein, mas com pool limitado a 5 000 POIs (dentro do bbox), não 25 000 — mais barato que o do dropdown, mas ainda a mesma classe de custo, e disparado pelo mesmo texto de pesquisa que o dropdown recebe (ver §2).

## 6. Interação Search ↔ Mapa

- Selecionar um resultado da dropdown (`pickPoi`/`pickDistrict`/`pickMunicipality`/`pickLocality`, linhas 157-214) chama diretamente funções do `AppContext` (`openPoi`, `openDistrict`, `flyTo`, etc.) e **limpa a query** (`setSearchQuery("")`). Isso por si só já vai disparar o `useEffect` de `BboxLoader` ligado a `searchQuery` (linha 317-320) — um reload de bbox sem texto de pesquisa. Não foi encontrada duplicação de pedidos além deste reload esperado (mudar de filtro/localização = recarregar POIs é o comportamento correto, não um bug).
- O ponto já identificado no §2/§5 — cada keystroke da pesquisa dispara **dois** pedidos HTTP em paralelo (dropdown + bbox) — é a principal fonte de "requests em cascata" pedida para investigar na secção 4/7 do pedido original. É comportamento **intencional e documentado no código**, não acidental; mas amplifica o impacto do bug do §3/§4 porque duplica a exposição ao caminho lento.

## 7. Cache — estado atual

- Backend: nenhum cache em `/api/search` nem em `/api/pois/lite`. Confirmado empiricamente (bbox país-inteiro repetido 5× não acelera).
- Frontend: existe `sessionCache`/`sessionFetch` (`lib/sessionCache.js`, usado para `/api/districts`, `/api/favorites`, `/api/calendar`) — cache de sessão em memória, não usado para search nem para bbox. Não avaliado se vale a pena estender (fora do âmbito de Fase 1 conforme pedido do utilizador — só reportar oportunidade, não implementar).

## 8. O que NÃO foi possível medir nesta fase

- **Tempo de render do mapa após a resposta chegar** (backend response → frontend parse → criação de markers → pintura no ecrã). Precisaria de instrumentação de performance no browser (Performance API / React Profiler) em execução ao vivo.
- **Reprodução visual, passo a passo, da corrida do §4** diretamente no browser. A única tab de Chrome disponível estava a ser ativamente pilotada por outra sessão concorrente (`portugal-workspace-e4`, um outro Claude Code a correr no mesmo Chrome) — uma tentativa minha de reproduzir a corrida (escrever texto, substituir rapidamente) colidiu com o estado dessa sessão e abriu inesperadamente um drawer de localidade. Parei imediatamente a automação de browser para não continuar a interferir com esse trabalho em curso. O mecanismo foi validado por leitura de código + medições isoladas de backend (curl), que são reproduzíveis e não dependem do estado da UI.
- **Contagem exata de linhas em `poi`/`locality`/`municipality`/`district`** — não consultado diretamente à BD nesta fase (evitar queries pesadas/ad-hoc fora do que os próprios endpoints já fazem); os tempos medidos já refletem o volume real de produção local.

---

## 9. Aviso: sessão concorrente a fazer o mesmo diagnóstico

A meio desta auditoria, `git status` ao repositório `portugal-na-mao-api` revelou alterações não feitas por nós:
um novo ficheiro `SEARCH_MAP_PERFORMANCE_DIAGNOSTIC_REPORT_2026-09-26.md` na raiz desse repo, e alterações
não relacionadas (`CategoryTextIndex.java`, remoção da categoria "mountain"; uma pasta `backups/` com dumps
e CSVs de "mountain_production_backup"). Isto foi causado por uma **sessão Claude Code diferente, a correr
em paralelo no mesmo Chrome e no mesmo checkout** (visível como `portugal-workspace-e4` em `ListAgents`) —
foi essa sessão, não nós, que causou a colisão descrita no §4 quando tentámos reproduzir a corrida no browser.

Essa sessão está a investigar **exatamente o mesmo pedido**, mas foi mais longe em dois pontos que esta
sessão não tinha coberto, e que decidimos verificar diretamente no código (confirmados por nós, não apenas
copiados do relatório deles):

1. **`GlobalInlineSearch` duplicado (`TopBar` + `MobileHeader`, sempre ambos montados)** — dobra literalmente
   `/api/search` em toda pesquisa. Ver correção incorporada no Resumo Executivo e no §10.
2. **`limit=100` não é fixo** — é `zoomLimit()`, variável por zoom. Ver correção incorporada no §5 e no §10.

O relatório deles refere ainda dois relatórios anteriores, de 16/09/2026, com 3 correções já commitadas
(`bebc392`, `86ba279` — cache do `GeoPlaceMatcher`, projeção mínima no pool fuzzy, índice trigram) — contexto
histórico que esta sessão não tinha, e que explica por que o custo do fallback fuzzy medido no §3 (420-720ms)
já é o valor **pós**-otimização, não o original.

**Não alterámos nem apagámos nada do trabalho dessa sessão.** As alterações não relacionadas com "mountain"
em `portugal-na-mao-api` e em `PT-portugal-na-mao-fe` (`categories.jsx`, `yarn.lock`) são de um trabalho à
parte, sem relação com este pedido — deixadas exatamente como estavam.

**Recomendação:** antes de avançar para a Fase 2 (otimizações), leia também
`portugal-na-mao-api/SEARCH_MAP_PERFORMANCE_DIAGNOSTIC_REPORT_2026-09-26.md` — tem verificação ao vivo via
Network tab (que esta sessão não conseguiu completar, ver §4/§8) e `EXPLAIN ANALYZE` direto à BD, que
complementam (nalguns pontos corrigem) o que está aqui.

---

## 10. Respostas diretas às suspeitas do pedido original

| Suspeita | Confirmado? | Evidência |
|---|---|---|
| "Sem resultados" aparece antes da resposta chegar | **Sim** | §4 — bug de `.finally` em pedido abortado |
| Locations tornam o Search mais lento | **Parcialmente** | §3 — +30-70ms real (medição HTTP end-to-end), mas 5-15× menor que o custo do fallback fuzzy. Nota: uma medição isolada de DB (`EXPLAIN ANALYZE`, ver §9) da query de `Locality` sozinha aponta 270-380ms — discrepância com a nossa medição de +30-70ms não reconciliada nesta sessão (ver §9) |
| Zoom-based limit foi reintroduzido escondido | **Não foi "reintroduzido" — mas já existe, ativo, hoje** | §5, corrigido — `zoomLimit()` no frontend varia 20-600 conforme o zoom; só é 100 a zoom 13. Não confirmámos que fosse fixo (erro da nossa primeira leitura, corrigido acima) |
| Bbox falta índice espacial | **Não** | §5 — `idx_poi_lat_lon` existe; custo é por-candidato, não falta de índice |
| Zoom in/out rápido causa requests em cascata | **Não** | §2 — debounce único bem implementado, 1 request por pausa de 200ms |
| Search e Mapa disparam requests duplicados/desnecessários | **Sim, e mais do que suspeitávamos** | §6 — 2 pedidos paralelos por keystroke (dropdown+mapa) é intencional/documentado; **mas §9 identifica que o próprio dropdown dispara 2× sozinho** (duas instâncias de `GlobalInlineSearch` sempre montadas, desktop+mobile), o que não tínhamos verificado até cruzar com a sessão concorrente |

---

## 11. Ficheiros lidos (sem alterações)

**Backend** (`portugal-na-mao-api`): `SearchController.java`, `SearchService.java`, `FuzzyNameMatcher.java`, `DistrictPoiController.java`, `DistrictPoiQueryService.java`, `PoiRepository.java` (queries `searchByName*`, `findLiteByBboxTiered`), `DistrictRepository.java`, `MunicipalityRepository.java`, `LocalityRepository.java`, migrations `V9`, `V53`, `V59`, `V90`, `V91`.

**Frontend** (`PT-portugal-na-mao-fe`): `GlobalInlineSearch.jsx`, `MapExplorer.jsx` (`BboxLoader`, `PoiMarkers`, `PoiMarkerItem`), `lib/api.js` (`fetchSearch`, `fetchPoisLiteBbox`, `jsonFetch`/`apiFetch`).

Nenhum ficheiro foi modificado. Nenhum commit foi feito. `git status` de ambos os repositórios inalterado por esta auditoria (ver secção seguinte no chat).
