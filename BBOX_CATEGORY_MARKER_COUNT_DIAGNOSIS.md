# BBOX_CATEGORY_MARKER_COUNT_DIAGNOSIS.md

> Gerado em: 2026-07-09  
> Objectivo: perceber porque o mapa mostra ~20/30 POIs mesmo depois de o endpoint bbox receber filtros de categoria.  
> **Nenhuma correção foi aplicada.** Os logs de diagnóstico foram adicionados para confirmar a causa antes de actuar.

---

## 1. Pipeline completo — percurso dos POIs

```
BboxLoader.load()
  → calcula bbox do viewport + categories string
  → setTimeout 250ms (debounce)
    → fetchPoisLiteBbox(bbox, { limit, categories, districtId })
      → GET /api/pois/lite?bbox=...&limit=100&categories=castle,church,...
        → PoiRepository.findLiteByBboxFiltered (SQL com ANY + string_to_array)
        → devolve N POIs ordenados por distribuição geográfica (rn)
      → api.js devolve { pois: N[], countsByCategory: {} }
    → AppContext.loadPoisForBbox → setMapPois(N pois)
    
React re-render:
  PoiMarkers.visible useMemo:
    base = [...mapPois (N), ...visibleUser (M)]
    pool = base                          (sem filtro de distrito)
         | base.filter(pointInPolygon)   (se activeDistrictId)
    → se activeCats.size > 0  → filter(cat in activeCats)
    → se filterGroup !== "all" → filter(cat in GROUPS[fg].items)
    → else                     → return pool
  
  visible.map() → render <Marker> para cada p com hasCoords(p)
  tooltipPoiIds = top 10 mais próximos do centro (só tooltips, NÃO markers)
```

---

## 2. Pontos de redução identificados

| # | Onde | Reduz? | Quando |
|---|---|---|---|
| 1 | `bbox BETWEEN` no SQL | Sim | Sempre — só POIs dentro do viewport |
| 2 | `category = ANY(string_to_array(...))` no SQL | Sim | Quando categories enviado |
| 3 | `publication_status / wikidata_id / description / media` no SQL | Sim | Sempre — só POIs com conteúdo |
| 4 | `LIMIT :limit` no SQL | Sim | Quando há mais POIs do que o limite |
| 5 | `activeDistrictGeo` polygon filter em PoiMarkers | Sim | Quando distrito activo |
| 6 | `activeCats` filter em PoiMarkers | Sim | Quando categorias específicas seleccionadas |
| 7 | `filterGroup !== "all"` filter em PoiMarkers | Sim | Quando grupo seleccionado (cultura/natureza/comercial) |
| 8 | `!hasCoords(p)` no render | Marginal | POIs sem lat/lon (raros, bbox exclui-os) |
| 9 | `tooltipPoiIds.slice(0, 10)` | NÃO | Só limita tooltips, NÃO markers |

**Ponto 9 é inofensivo** — os markers renderizam todos os `visible`, não apenas os 10 com tooltip.

---

## 3. Hipóteses identificadas e avaliação

### Hipótese A — ESTADO STALE durante debounce + rede (CONFIRMADA pelo código)

**Mecanismo:**
```
t=0ms   : utilizador muda filterGroup para "cultura"
           → React re-render imediato
           → PoiMarkers recalcula visible com:
               mapPois = OLD (100 genéricos)
               filterGroup = "cultura" (NOVO)
           → visible = OLD_POIS.filter(cat in GROUPS["cultura"].items)
           → talvez 20–30 dos 100 antigos são cultura
           → utilizador vê 20–30 ← HERE

t=250ms : BboxLoader timeout dispara → API call enviada

t=700ms : API responde → setMapPois(N cultura POIs)
           → React re-render
           → visible = N (todos passam o filtro cultura)
           → utilizador vê N
```

**Duração da janela visível**: 250ms (debounce) + latência de rede ≈ 500–1000ms.

**Conclusão**: é **real e visível ao utilizador**, especialmente se a rede for lenta ou se o utilizador observar rapidamente após mudar o filtro.

---

### Hipótese B — Backend devolve genuinamente menos de 100 (PROVÁVEL)

O SQL tem `LIMIT :limit` (100). Mas só devolve 100 **se existirem 100+ POIs correspondentes no viewport**.

A condição de qualidade do SQL:
```sql
AND (
  p.publication_status IN ('ACTIVE', 'PENDING')
  OR p.wikidata_id IS NOT NULL
  OR p.wikipedia_url IS NOT NULL
  OR (p.description IS NOT NULL AND length(p.description) > 80)
  OR EXISTS (SELECT 1 FROM media_item mi WHERE ...)
)
```

Cenário típico a zoom 10–11 (vista de uma região de Portugal):
- Viewport cobre talvez 3–5 distritos
- Para "natureza": muitos POIs (praias, miradouros, parques) → provável 100
- Para "cultura": castelos, igrejas, museus — menos densos — talvez 40–80
- Para "comercial": muito variável

**Este é comportamento correcto, não um bug.** Se o backend tem 40 cultura POIs na área, devolve 40, não 100.

---

### Hipótese C — Duplo filtro frontend (CONFIRMADA, geralmente inofensiva pós-API)

Após o API call retornar com N POIs de "cultura", `PoiMarkers.visible` aplica **novamente** o filtro:
```js
if (filterGroup !== "all") {
  const items = GROUPS[filterGroup]?.items || [];
  return pool.filter((p) => items.includes(p.category));
}
```

Se o backend filtrou correctamente, todos os N POIs têm category ∈ GROUPS["cultura"].items → o filtro frontend passa todos → não reduz.

**MAS** se algum POI devolvido pelo backend tiver uma categoria que está no CATEGORIES mas não no GROUPS (ver Hipótese D), seria aqui que seria removido.

---

### Hipótese D — Categorias no DB sem mapeamento em GROUPS (POTENCIAL)

Categorias que existem nos queries SIPA do backend mas NÃO existem no frontend GROUPS:

| Categoria DB | Nos GROUPS? | Comportamento |
|---|---|---|
| `historic` | ❌ | Aparece em "Tudo" mas nunca num grupo |
| `bridge` | ❌ | Idem |
| `windmill` | ❌ | Idem |
| `lighthouse` | ❌ | Idem |
| `event` | ❌ (está em CATEGORIES/comercial mas não em GROUPS.comercial.items) | Nunca aparece no filtro "Local" |

Se existirem muitos POIs com `category = 'historic'` ou `'bridge'`, eles aparecem em "Tudo" mas nunca em nenhum grupo → reduzem a contagem dos grupos.

No entanto, o backend **com categoria filter** nunca os devolve para pedidos de "cultura" (porque `historic/bridge` não estão na lista enviada). Por isso não afecta o count pós-API.

---

### Hipótese E — Distrito activo sem ser visível (DESCARTADA para caso padrão)

Se `activeDistrictId` estiver activo (chip de distrito visível no UI), o polygon filter remove POIs fora do polígono. Mas o utilizador saberia que o distrito está activo.

Se o distrito ficar preso depois de ser removido → reduz contagem. Ver secção 5.

---

### Hipótese F — Zoom logic limita markers (DESCARTADA)

`tooltipPoiIds` limita a 10 — só tooltips, não markers.  
`zoomLimit(z)` devolve `100` para z ≤ 12 e `5000` para z > 12.  
O render faz `visible.map()` sobre todos — não há `slice()` nem `limit` no render de markers.

---

## 4. Causa raiz mais provável

**Cenário mais provável que o utilizador está a ver:**

```
[1] Muda filtro → transient state (500–1000ms)
    → vê 20–30 (POIs antigos filtrados pela nova categoria)

[2] API retorna → vê N POIs de cultura
    → se N = 60–80: o filtro funcionou e aumentou
    → se N = 20–30: era esse o número genuíno no viewport

O utilizador pode estar a reportar o estado [1]
ou o estado [2] com N realmente baixo.
```

**Para confirmar qual é o caso: verificar os logs de diagnóstico na consola do browser.**

---

## 5. Logs de diagnóstico adicionados

Foram adicionados logs temporários em 3 pontos:

### 5a. BboxLoader (MapExplorer.jsx) — antes da API call
```
[BBOX] request → { bbox, zoom, limit, categories, districtId }
```

### 5b. AppContext.loadPoisForBbox — após API call
```
[BBOX] response → 87 POIs | com coords: 87 | categories: castle,church,palace,...
[BBOX] distribuição por categoria: { castle: 23, church: 41, museum: 12, monument: 11 }
```

### 5c. PoiMarkers.visible useMemo — step by step
```
[MARKERS] base 87 (mapPois: 82 + visibleUser: 5) | filterGroup: cultura | activeCats: []
[MARKERS] após filterGroup cultura (items: [...]) → 82
```

**O que observar na consola:**
1. Número de POIs que a API devolve (linha `[BBOX] response`)
2. Se a distribuição de categorias bate com o filtro pedido
3. Se há redução entre `[BBOX] response` e `[MARKERS] base`
4. Se há redução entre `[MARKERS] base` e o número final após os filtros

---

## 6. Cenários esperados nos logs

### Cenário A — Causa: estado stale (transient)
```
[MARKERS] base 100 | filterGroup: cultura
[MARKERS] após filterGroup cultura → 22       ← vê 22 aqui (stale)

[BBOX] response → 78 POIs | com coords: 78    ← API devolveu mais
[MARKERS] base 78 | filterGroup: cultura
[MARKERS] após filterGroup cultura → 78       ← agora vê 78
```
**Acção**: aceitar como transitório; ou corrigir o estado stale (ver secção 7B).

### Cenário B — Causa: backend devolve poucos
```
[BBOX] response → 28 POIs | com coords: 28
[MARKERS] base 28 | filterGroup: cultura
[MARKERS] após filterGroup cultura → 28
```
**Acção**: não é bug — há genuinamente 28 POIs de cultura enriquecidos nessa área.

### Cenário C — Causa: duplo filtro com mismatch de categorias
```
[BBOX] response → 80 POIs | com coords: 80
[BBOX] distribuição por categoria: { castle: 20, monument: 30, historic: 30 }
[MARKERS] base 80 | filterGroup: cultura
[MARKERS] após filterGroup cultura (items: [castle,church,...]) → 50
```
**Nota**: `historic` não está em GROUPS.cultura → remove 30 POIs.  
**Acção**: adicionar `historic` ao GROUPS.cultura se faz sentido, OU corrigir o backend para não enviar `historic` quando categories=`castle,church,...` (já não devia, porque `historic` não está na lista enviada).

### Cenário D — Causa: distrito activo sem querer
```
[MARKERS] base 80 | filterGroup: all
[MARKERS] após polígono distrito → 12
```
**Acção**: verificar se activeDistrictId tem valor quando o utilizador não tem distrito seleccionado.

---

## 7. Correcções recomendadas (só depois de confirmar causa)

### 7A — Se Cenário A (stale state): limpar mapPois ao mudar filtro

**Onde**: AppContext — quando `filterGroup` ou `activeCats` muda, limpar `mapPois` para que o utilizador não veja os POIs antigos filtrados.

**Mecanismo**: expor `clearMapPois` no context e chamar em `BboxLoader` antes da chamada API.

**Risco**: flash de mapa vazio (250ms + rede) antes dos novos POIs aparecerem.

### 7B — Se Cenário B (poucos no viewport): comportamento esperado

Nenhuma correcção necessária. O limite é a quantidade de POIs enriquecidos nessa categoria nessa área geográfica.

Pode-se considerar aumentar o `limit` para zoom menor, mas o utilizador pediu para manter 100.

### 7C — Se Cenário C (mismatch categorias): adicionar categorias ao grupo ou ao envio

Opção 1: Adicionar `'historic'`, `'bridge'` ao `GROUPS.cultura.items` (e ao BboxLoader)  
Opção 2: Verificar se o frontend está a enviar `categories` correctos e o backend está a retornar apenas os pedidos

### 7D — Se Cenário D (distrito preso): corrigir clearDistrictFilter

Verificar se ao clicar no X do chip de distrito, `setActiveDistrictId(null)` é chamado correctamente e `activeDistrictGeo` se torna null.

---

## 8. Ficheiros analisados

| Ficheiro | Relevância |
|---|---|
| `PT-portugal-na-mao-fe/src/components/MapExplorer.jsx` | Pipeline completo: BboxLoader, PoiMarkers, visible logic |
| `PT-portugal-na-mao-fe/src/context/AppContext.jsx` | loadPoisForBbox, filterGroup, activeCats, mapPois state |
| `PT-portugal-na-mao-fe/src/lib/api.js` | fetchPoisLiteBbox — params enviados ao backend |
| `PT-portugal-na-mao-fe/src/lib/categories.jsx` | GROUPS, CATEGORIES — mapeamento de categorias |
| `PT-portugal-na-mao-fe/src/lib/geo.js` | hasCoords — verificação de coordenadas |
| `portugal-na-mao-api/.../PoiRepository.java` | findLiteByBboxFiltered — SQL com ANY(string_to_array) |
| `portugal-na-mao-api/.../DistrictPoiQueryService.java` | findLiteWithFacets — lógica de serviço |
| `portugal-na-mao-api/.../DistrictPoiController.java` | /api/pois/lite — controller com categories param |
| `portugal-na-mao-api/.../PoiLiteView.java` | campos devolvidos (lat, lon, category confirmados) |

---

## 9. Ficheiros alterados nesta sessão (só logs)

| Ficheiro | Alteração |
|---|---|
| `MapExplorer.jsx` | +logs `[BBOX] request` e `[MARKERS] base/após filtros` |
| `AppContext.jsx` | +logs `[BBOX] response` e `[BBOX] distribuição por categoria` |

**Todos os logs estão marcados com `// [DIAG]` e devem ser removidos após o diagnóstico.**

---

## 10. Git status

```
PT-portugal-na-mao-fe (modified):
  src/components/MapExplorer.jsx  ← logs [DIAG] adicionados
  src/lib/api.js                  ← categories param (sessão anterior)
  src/index.css                   ← tooltip fix (sessão anterior)

portugal-na-mao-api (modified):
  src/.../DistrictPoiController.java   ← categories param (sessão anterior)
  src/.../DistrictPoiQueryService.java ← categories param (sessão anterior)
  src/.../PoiRepository.java           ← SQL ANY(string_to_array) (sessão anterior)
  
AppContext.jsx (modificado agora):
  src/context/AppContext.jsx       ← log [DIAG] adicionado
```

Nenhum commit foi feito.

---

## 11. Próximos passos

1. **Abrir o browser com DevTools → Console**
2. **Navegar ao mapa**
3. **Seleccionar filtro "Cultura"**
4. **Observar sequência de logs na consola**
5. **Reportar os números** (especialmente `[BBOX] response → X POIs` e `[MARKERS] após filterGroup → Y`)
6. **Comparar X vs Y** — se Y < X há duplo filtro com mismatch; se X = Y o problema é a quantidade real no viewport ou o estado stale

**Só depois actuar na correcção correspondente ao cenário observado.**
