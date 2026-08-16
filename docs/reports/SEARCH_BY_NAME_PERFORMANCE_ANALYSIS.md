# SEARCH_BY_NAME_PERFORMANCE_ANALYSIS

Data: 2026-07-07  
Âmbito: diagnóstico read-only — sem alterações ao código, BD ou infraestrutura  

---

## 1. Onde está implementado o search

| Camada | Ficheiro | Papel |
|---|---|---|
| Frontend — overlay | `PT-portugal-na-mao-fe/src/components/SearchOverlay.jsx` | Input, disparo do pedido, renderização de resultados |
| Frontend — API client | `PT-portugal-na-mao-fe/src/lib/api.js` · `fetchSearch()` | Constrói URL `GET /api/search?q=...&limit=...` |
| Backend — controller | `api/search/SearchController.java` | Recebe `GET /api/search` com params `q`, `limit`, `category` |
| Backend — service | `service/search/SearchService.java` | Valida input, split de limite, chama repositórios |
| Backend — repo POI | `db/repo/PoiRepository.java` · `searchByName()` | Query nativa SQL com ILIKE/unaccent/subquery correlacionada |
| Backend — repo district | `db/repo/DistrictRepository.java` · `searchByName()` | Query nativa SQL simples sobre 18 distritos |
| DTO de resposta | `api/dto/search/SearchItemDto.java` | Projecção final: 7 campos |

O search **não filtra em memória** no frontend. Faz sempre uma chamada de rede ao backend.  
O mapa (`PoiMarkers`) usa um contexto separado (`mapPois`) carregado por bbox — **não é afectado pelo search**.

---

## 2. Fluxo actual: Frontend → Backend → BD

```
Utilizador tecla um caracter
        │
        ▼
useEffect([q, search])             ← sem debounce, dispara a cada caracter
        │
        ▼
fetchSearch(q, 20, signal)         ← AbortController cancela pedido anterior (mitigação parcial)
        │
GET /api/search?q=<q>&limit=20
        │
        ▼
SearchController.search(q, 20, null)
        │
        ▼
SearchService.search()
  ├── q.length < 2 → return []     ← único guarda (bloqueia só 1 caracter)
  ├── limDistricts = 10
  ├── limPois = 10
  ├── districtRepository.searchByName(q, 10)   → trivial, 18 linhas, ~4ms
  └── poiRepository.searchByName(q, 10)        → query lenta (ver §3)
        │
        ▼
List<Poi> entidade completa (38 colunas) → map para SearchItemDto (7 campos)
        │
        ▼
JSON response: array de até 20 objectos
        │
        ▼
Frontend renderiza lista de resultados (não actualiza markers do mapa)
```

**Nenhum debounce no frontend.** Cada caracter digitado → 1 request HTTP (cancelado se chegar novo antes de terminar).

---

## 3. Query SQL actual

### 3a. Pesquisa de POIs — `PoiRepository.searchByName`

```sql
SELECT *
FROM poi p
WHERE p.publication_status IN ('ACTIVE', 'PENDING')
  AND (
    SELECT bool_and(
      unaccent(lower(coalesce(p.name_pt, '') || ' ' || coalesce(p.name, '')))
        LIKE '%' || unaccent(lower(t)) || '%'
    )
    FROM unnest(string_to_array(:q, ' ')) AS t
    WHERE t <> ''
  )
ORDER BY coalesce(p.name_pt, p.name) ASC
LIMIT :limit
```

Pontos críticos desta query:

- `SELECT *` — carrega todas as 38 colunas da tabela `poi`, incluindo `description` (text), `osm_tags` (jsonb), `sipa_url`, `sipa_name`, `review_*`, `wikidata_*`, etc.
- A condição é uma **subquery correlacionada**: para cada linha de `poi` (15 185 linhas visíveis), executa-se um agregado sobre `unnest` — a subquery é avaliada **15 185 vezes por pedido**
- Padrão `LIKE '%termo%'` com wildcard à esquerda → não pode usar índice BTree
- `pg_trgm` **não está instalado** → sem suporte a índice GIN/trigram
- O custo **cresce linearmente com o número de palavras** na query (mais palavras = mais iterações no `unnest`)

### 3b. Pesquisa de distritos — `DistrictRepository.searchByName`

```sql
SELECT *
FROM district d
WHERE unaccent(lower(coalesce(d.name_pt, d.name))) LIKE concat('%%', unaccent(lower(:q)), '%%')
   OR unaccent(lower(coalesce(d.name, ''))) LIKE concat('%%', unaccent(lower(:q)), '%%')
ORDER BY coalesce(d.name_pt, d.name) ASC
LIMIT :limit
```

Benigna: apenas 18 linhas, executa em ~3.8ms. Não é o problema.

---

## 4. EXPLAIN ANALYZE da query actual

### Cenário A — palavra simples: `"castelo"`

```
Limit  (cost=2022.70..2022.72 rows=10) (actual time=54.119..54.204 rows=10 loops=1)
  -> Sort  (actual time=53.958..53.962 rows=10 loops=1)
       Sort Key: COALESCE(p.name_pt, p.name)
       Sort Method: top-N heapsort  Memory: 33kB
       -> Bitmap Heap Scan on poi p  (actual time=9.855..52.262 rows=294 loops=1)
            Recheck Cond: publication_status IN ('ACTIVE','PENDING')
            Filter: (SubPlan 1)
            Rows Removed by Filter: 14891
            Heap Blocks: exact=714
            -> Bitmap Index Scan on idx_poi_publication_status
                 (actual time=1.037..1.039 rows=16444 loops=1)
            SubPlan 1
              -> Aggregate  (actual time=0.003..0.003 rows=1 loops=15185)
                   -> Function Scan on unnest t  (rows=1 loops=15185)
                        Filter: t <> ''

Planning Time:  26.377 ms
Execution Time: 66.701 ms
Total latência BD: ~93ms
```

### Cenário B — multi-palavra: `"castelo de guimaraes"`

```
Limit  (cost=2798.15..2798.17 rows=10) (actual time=108.438..108.523 rows=1 loops=1)
  -> Sort  (actual time=108.291..108.295 rows=1 loops=1)
       Sort Method: quicksort  Memory: 25kB
       -> Bitmap Heap Scan on poi p  (actual time=10.607..107.431 rows=1 loops=1)
            Recheck Cond: publication_status IN ('ACTIVE','PENDING')
            Filter: (SubPlan 1)
            Rows Removed by Filter: 15184
            SubPlan 1
              -> Aggregate  (actual time=0.006..0.006 rows=1 loops=15185)
                   -> Function Scan on unnest t  (rows=3 loops=15185)

Planning Time:  25.024 ms
Execution Time: 114.691 ms
Total latência BD: ~140ms
```

O planning time (~26ms) é quase tão caro quanto o início da execução. Em produção, com latência de rede acrescida (+20–50ms), o utilizador sente **160–250ms por caracter digitado** — e sem debounce, sente isto 5–10 vezes enquanto escreve uma palavra.

---

## 5. Índices existentes na tabela `poi`

| Índice | Tipo | Coluna(s) | Usos observados |
|---|---|---|---|
| `poi_pkey` | BTree UNIQUE | `id` | 18 527 |
| `idx_poi_osm` | BTree UNIQUE parcial | `osm_id, osm_type` | 12 642 |
| `idx_poi_publication_status` | BTree | `publication_status` | 4 989 |
| `idx_poi_category` | BTree | `category` | 892 |
| `idx_poi_sipa_id` | BTree parcial | `sipa_id` | 141 |
| `idx_poi_district_id` | BTree | `district_id` | 2 |
| `idx_poi_rnap_type` | BTree | `rnap_type` | 0 |
| `idx_poi_rnap_sigla` | BTree | `rnap_sigla` | 0 |

**Não existe nenhum índice em `name`, `name_pt`, `lower(name)` ou expressão trigram.**

Na query de search, o único índice usado é `idx_poi_publication_status` — que apenas filtra de 21 475 para 15 185 linhas. Depois disso, todas as 15 185 linhas passam pela subquery correlacionada.

---

## 6. Estado das extensões PostgreSQL

| Extensão | Instalada | Notas |
|---|---|---|
| `unaccent` | ✅ 1.1 | Usada pela query actual |
| `postgis` | ✅ 3.4.3 | Disponível para índices espaciais se necessário |
| `pg_trgm` | ❌ não instalada | Necessária para índice GIN trigram em `LIKE '%..%'` |

---

## 7. Dados da BD

| Métrica | Valor |
|---|---|
| Total de POIs | 21 475 |
| POIs ACTIVE | 14 105 |
| POIs PENDING | 1 080 |
| POIs visíveis ao search (ACTIVE + PENDING) | **15 185** |
| POIs INACTIVE | 6 290 |
| Tamanho médio da linha completa (`SELECT *`) | ~254 bytes |
| Tamanho médio dos campos necessários ao search | ~84 bytes |
| Rácio de desperdício de payload | **~3×** |

---

## 8. Gargalo provável

O tempo de resposta percepcionado pelo utilizador é a soma de:

```
Latência total ≈ Planning (~26ms) + Execution (~67–115ms) + Network (≥20ms) + render
              ≈ 120–165ms por keystroke (local)
              ≈ 160–250ms+ em produção
```

Sem debounce, o utilizador dispara 5–10 requests enquanto escreve uma palavra. O `AbortController` cancela os anteriores **no cliente**, mas o backend já começou a executar a query SQL em cada um deles.

### Ranking de gargalos por impacto:

| # | Gargalo | Onde | Impacto |
|---|---|---|---|
| 1 | **Ausência de debounce** | Frontend | Multiplica requests por 5–10× por palavra digitada |
| 2 | **Subquery correlacionada executada 15 185× por request** | SQL | Custo base inevitável sem índice trigram |
| 3 | **Ausência de índice trigram** | BD | `LIKE '%termo%'` não é acelerado; full scan obrigatório |
| 4 | **`SELECT *` com 38 colunas** | Backend/ORM | Hibernate carrega entidade completa; search usa 7 campos (~3× I/O desnecessário) |
| 5 | **Planning time elevado (~26ms/query)** | BD | Incomum para query simples; possivelmente parâmetros não cacheados |

---

## 9. Riscos

| Risco | Gravidade | Descrição |
|---|---|---|
| Flood de queries simultâneas | Alto | Utilizador que escreve rápido dispara 8–10 requests/segundo |
| Degradação linear com crescimento do catálogo | Alto | A cada +1 000 POIs ACTIVE, a query fica ~4–5ms mais lenta |
| Carga no backend sem retorno | Médio | Queries canceladas pelo AbortController no cliente chegam ao backend e executam na BD antes do cancelamento TCP |
| Payload Hibernate desnecessário | Médio | 38 colunas deserializadas para apenas 7 usadas — mais pressão no GC da JVM |
| Ausência de cache de resultados | Baixo | Queries repetidas (ex: "Lisboa") fazem full scan todas as vezes |

---

## 10. Recomendações

> Sugestões para avaliação futura. Nenhuma alteração foi feita.

---

### 10.1 Quick Wins — Frontend

**F1. Debounce de 300ms no input**

`SearchOverlay.jsx` linha 43 — substituir o `useEffect` directo:

```js
// Actual (dispara a cada caracter):
useEffect(() => { search(q); }, [q, search]);

// Proposta:
useEffect(() => {
  const t = setTimeout(() => search(q), 300);
  return () => clearTimeout(t);
}, [q, search]);
```

Reduz imediatamente o número de requests de 8–10 para 1 por intenção de pesquisa. É o fix de maior impacto com menor risco.

**F2. Guarda de mínimo de 2 caracteres no frontend**

O backend já rejeita `q.length < 2` e devolve lista vazia, mas o request HTTP é sempre feito. Adicionar no frontend:

```js
if (!query.trim() || query.trim().length < 2) {
  setResults({ districts: [], pois: [] });
  return;
}
```

**F3. Manter o `AbortController` actual**

Já existe e está correcto — cancela a fetch anterior quando chega novo input. Não alterar.

---

### 10.2 Quick Wins — Backend

**B1. Substituir `SELECT *` por projecção de 7 campos**

A query nativa devolve a entidade `Poi` completa (38 colunas, ~254 bytes médios). O `SearchItemDto` apenas usa: `id`, `name_pt`, `name`, `category`, `lat`, `lon`, `district_id`. Mudar para SELECT com apenas esses campos reduz I/O em ~3× e elimina deserialização Hibernate dos campos pesados (`description`, `osm_tags`, `sipa_url`, `review_*`).

**B2. Criar interface de projecção Spring Data**

Alternativa ao B1 com menos impacto no código: criar interface `SearchPoiProjection` com os 7 getters e usar `@Query` JPQL tipado em vez de nativeQuery com `SELECT *`.

**B3. Considerar guarda de comprimento mínimo também no controller**

Actualmente o guarda `q.length < 2` está apenas no `SearchService`. Mover ou duplicar para o controller permite rejeitar o request mais cedo, sem entrar no serviço.

---

### 10.3 Optimização BD

**DB1. Instalar extensão `pg_trgm`**

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Não tem impacto operacional. É o pré-requisito para todos os índices abaixo.

**DB2. Criar índice GIN trigram em expressão combinada**

```sql
CREATE INDEX idx_poi_name_trgm
  ON poi
  USING GIN (
    unaccent(lower(coalesce(name_pt, '') || ' ' || coalesce(name, '')))
    gin_trgm_ops
  )
  WHERE publication_status IN ('ACTIVE', 'PENDING');
```

Este índice parcial (só POIs visíveis) permite que o `LIKE '%termo%'` seja resolvido via bitmap lookup em vez de full scan. Estimativa de ganho: 67ms → 3–8ms para palavras simples.

**DB3. Alternativa: dois índices GIN separados por coluna**

Se a expressão combinada criar problemas de manutenção:

```sql
CREATE INDEX idx_poi_name_pt_trgm ON poi USING GIN (unaccent(lower(name_pt)) gin_trgm_ops)
  WHERE publication_status IN ('ACTIVE', 'PENDING') AND name_pt IS NOT NULL;

CREATE INDEX idx_poi_name_trgm ON poi USING GIN (unaccent(lower(name)) gin_trgm_ops)
  WHERE publication_status IN ('ACTIVE', 'PENDING');
```

E ajustar a query para usar `OR` em vez de concatenação.

**DB4. Índice espacial PostGIS** (apenas se search vier a combinar com bounds do mapa)

Actualmente o search não filtra por bounds geográficos. Se no futuro for adicionado um filtro por área visível do mapa, um índice `GIST` em `(lat, lon)` ou em geometria PostGIS será relevante. Para já, não é necessário.

---

### 10.4 Melhorias Estruturais Futuras

**E1. Simplificar a subquery correlacionada com trigram similarity**

Uma vez instalado `pg_trgm`, a query pode ser simplificada para:

```sql
WHERE unaccent(lower(coalesce(name_pt,'') || ' ' || coalesce(name,'')))
      ILIKE '%' || unaccent(lower(:q)) || '%'
```

(para query single-token) ou usar `similarity()` / `word_similarity()` para ranking por relevância.

**E2. Full-text search com `tsvector`**

Para pesquisa com suporte a stemming português e ranking de relevância, criar coluna gerada:

```sql
ALTER TABLE poi ADD COLUMN search_vec tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce(name_pt,'') || ' ' || coalesce(name,''))
  ) STORED;

CREATE INDEX idx_poi_search_vec ON poi USING GIN (search_vec)
  WHERE publication_status IN ('ACTIVE','PENDING');
```

Queries com `@@ to_tsquery('portuguese', :q)` em <5ms mesmo com 100K POIs, com suporte a "castelo" encontrar "castelos".

**E3. Cache de resultados no `SearchService`**

Adicionar `@Cacheable` no Spring para queries frequentes (ex: "Lisboa", "Porto", "Sintra", "Castelo"). TTL de 60s. Elimina carga da BD para pesquisas populares repetidas.

**E4. Endpoint dedicado `/api/pois/search`**

Actualmente o endpoint mistura POIs e distritos num único `/api/search`. Um endpoint dedicado permitiria: payload diferente (só campos de search), rate limit separado, cache dedicado, e evolução independente.

---

## 11. Sumário executivo

```
┌───────────────────────────────────────────────────────────────────┐
│           DIAGNÓSTICO DE PERFORMANCE — SEARCH POR NOME            │
├───────────────────────────────────────────────────────────────────┤
│  BD local: 15 185 POIs visíveis (ACTIVE + PENDING)                │
│  Latência BD por query: 67–115ms (+ 26ms planning)               │
│  Latência estimada em produção: 160–250ms por caracter            │
│  Sem debounce → 5–10 requests por palavra digitada               │
│  pg_trgm não instalada → LIKE '%x%' sempre full scan             │
│  SELECT * → Hibernate carrega 38 colunas, search usa 7           │
├───────────────────────────────────────────────────────────────────┤
│  FIX MAIS RÁPIDO (frontend, 5 min):                               │
│    → debounce 300ms + guarda ≥2 chars no frontend                │
│    → elimina 80–90% dos requests sem tocar no backend             │
├───────────────────────────────────────────────────────────────────┤
│  FIX DE MAIOR IMPACTO (BD):                                       │
│    → CREATE EXTENSION pg_trgm                                     │
│    → CREATE INDEX GIN trigram em name_pt+name (parcial ACTIVE)   │
│    → Estimativa: 67ms → 3–8ms por query                          │
├───────────────────────────────────────────────────────────────────┤
│  FIX DE CORRECTUDE (backend):                                     │
│    → substituir SELECT * por projecção de 7 campos               │
│    → reduz I/O e pressão no GC em ~3×                            │
└───────────────────────────────────────────────────────────────────┘
```
