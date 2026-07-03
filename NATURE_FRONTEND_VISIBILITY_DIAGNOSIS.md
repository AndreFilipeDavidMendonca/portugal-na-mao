# NATURE_FRONTEND_VISIBILITY_DIAGNOSIS

**Data:** 2026-07-03  
**Estado:** ✅ RESOLVIDO — SQL executado, naturais promovidos a ACTIVE

---

## Causa Principal (diagnóstico)

**`publication_status = 'INACTIVE'`** em 99%+ dos naturais importados.

O `OsmNaturalImportRunner` importa todos os POIs com `INACTIVE` por design. O backend (`findAllVisible()` e `findLiteByBbox()`) filtra apenas `ACTIVE` e `PENDING`. Com 10 335 naturais invisíveis, o mapa mostrava virtualmente zero praias, montanhas, cascatas, grutas ou parques.

Causa secundária: 5 categorias (`waterfall`, `lake`, `mountain`, `geosite`, `natural_park`) não tinham entrada no `categories.jsx` do frontend — mostrariam como raw strings mesmo que fossem ACTIVE.

---

## SQL Executado

```sql
UPDATE poi
SET publication_status = 'ACTIVE'
WHERE source = 'osm'
  AND publication_status = 'INACTIVE'
  AND category IN (
    'beach', 'cave', 'waterfall', 'lake', 'mountain',
    'geosite', 'natural_park', 'viewpoint', 'park'
  )
  AND lat IS NOT NULL
  AND lon IS NOT NULL
  AND COALESCE(name_pt, name) IS NOT NULL;

-- Resultado: UPDATE 10335
```

---

## POIs Promovidos por Categoria

| Categoria      | Promovidos |
|----------------|------------|
| `park`         | 3 158      |
| `mountain`     | 2 893      |
| `viewpoint`    | 1 338      |
| `beach`        | 1 040      |
| `lake`         | 999        |
| `cave`         | 267        |
| `waterfall`    | 241        |
| `geosite`      | 213        |
| `natural_park` | 186        |
| **Total**      | **10 335** |

---

## Estado Final por Categoria

| Categoria      | ACTIVE | PENDING | INACTIVE | Total |
|----------------|--------|---------|----------|-------|
| `park`         | 3 423  | 47      | 0        | 3 470 |
| `mountain`     | 2 897  | 1       | 0        | 2 898 |
| `viewpoint`    | 1 386  | 7       | 0        | 1 393 |
| `beach`        | 1 041  | 0       | 0        | 1 041 |
| `lake`         | 999    | 1       | 0        | 1 000 |
| `natural_park` | 461    | 311     | 0        | 772   |
| `cave`         | 276    | 2       | 0        | 278   |
| `waterfall`    | 241    | 1       | 0        | 242   |
| `geosite`      | 219    | 3       | 0        | 222   |
| **trail**      | **0**  | **0**   | **1 331** | 1 331 |

---

## Verificações de Integridade

| Verificação | Antes | Depois | Estado |
|---|---|---|---|
| `poi_sipa_enrichment` total | 1 656 | 1 656 | ✅ intacta |
| `poi.sipa_id IS NOT NULL` | 1 656 | 1 656 | ✅ intacto |
| `trail` INACTIVE | 1 331 | 1 331 | ✅ não promovidos |
| `trail` ACTIVE | 0 | 0 | ✅ correcto |

---

## Alterações Frontend (sem commit)

### `PT-portugal-na-mao-fe/src/lib/categories.jsx`

5 categorias adicionadas ao `CATEGORIES` e ao `GROUPS.natureza`:

| Categoria      | Label PT              | Ícone     | Cor marcador |
|----------------|-----------------------|-----------|--------------|
| `natural_park` | Parques Naturais      | Leaf      | `#2E6B40`    |
| `waterfall`    | Cascatas              | Droplets  | `#2B7BC4`    |
| `lake`         | Lagoas e Albufeiras   | Droplets  | `#1A6B9E`    |
| `mountain`     | Serras e Picos        | Mountain  | `#6B7F6E`    |
| `geosite`      | Geossítios            | Pickaxe   | `#7A5C43`    |

`GROUPS.natureza.items` actualizado para todas as 10 categorias:
```js
["viewpoint", "park", "natural_park", "beach", "waterfall", "lake", "mountain", "cave", "geosite", "trail"]
```

Build: ✅ `Compiled successfully`

---

## Pendente (não feito)

- **DistrictAssignmentRunner** — 2 247 naturais ainda com `district_id IS NULL` (principalmente viewpoints e montanhas costeiras). Correr após validar visibilidade no mapa:
  ```
  ptdot.opendata.district-assignment.enabled=true
  ptdot.opendata.district-assignment.dry-run=false
  ```
- **`trail`** — mantido INACTIVE. Trilhos OSM podem ser relações/centróides de qualidade variável. Revisão manual recomendada antes de promover.

---

## Git Status

```
M  PT-portugal-na-mao-fe/src/components/PoiModal.jsx
M  PT-portugal-na-mao-fe/src/lib/categories.jsx
?? PT-portugal-na-mao-fe/SIPA_FRONTEND_INTEGRATION_REPORT.md
?? PT-portugal-na-mao-fe/src/lib/location.js
?? NATURE_FRONTEND_VISIBILITY_DIAGNOSIS.md
```

Sem commits, sem push, sem deploy.

---

## Como Testar

```bash
# Backend local (porta 8085)
cd PT-portugal-na-mao-fe
REACT_APP_API_BASE=http://localhost:8085 npm start
```

| Caso de teste | Esperado |
|---|---|
| Zoom em qualquer zona costeira | Praias aparecem no mapa |
| Zoom na Serra da Estrela ou Gerês | Montanhas e parques naturais visíveis |
| Filtro "Natureza" no painel | Mostra todas as 10 categorias incluindo Cascatas, Lagoas, Serras |
| Clicar numa praia | Ficha abre, label "Praias" correcto, sem raw string |
| Clicar numa montanha | Label "Serras e Picos", ícone Mountain |
| Trilhos | Continuam invisíveis (INACTIVE) |
