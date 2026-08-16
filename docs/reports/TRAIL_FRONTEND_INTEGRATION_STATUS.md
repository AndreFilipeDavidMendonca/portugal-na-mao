# Trail (Trilhos) — Estado da Integração BD/API/Frontend

Data: 2026-07-23
Âmbito: apenas verificação e diagnóstico. Nenhum ficheiro de código foi alterado, nenhum commit/push/deploy foi feito, nenhum schema ou tabela foi criado/alterado. Modelo de dados mantido tal como está (trilho = categoria de POI, sem etapas/variantes/parent-child).

---

## TL;DR

**O código de frontend e de backend já suportam `category='trail'` de forma completa e simétrica a qualquer outra categoria de POI.** Não existe nenhum `if (category !== 'trail')`, nenhuma exclusão, nenhum bug de integração.

**O motivo pelo qual os trilhos não aparecem é 100% um problema de dados**: os 1.331 POIs `category='trail'` na BD real (verificado agora, ao vivo, via `psql`) estão **todos com `publication_status = 'INACTIVE'`**, e **todos os endpoints de listagem/mapa filtram explicitamente por `publication_status IN ('ACTIVE','PENDING')`**. Um trilho INACTIVE nunca é devolvido pela API de mapa/lista, por isso nunca chega ao frontend — independentemente de o frontend estar corretamente implementado.

Confirmação ao vivo (BD local, `pt_dot`):

```
category=trail, publication_status → count
INACTIVE | 1331
ACTIVE   | 0
PENDING  | 0
```

Comparando com as outras categorias, `trail` é a **única** categoria da base de dados com 0 POIs em `ACTIVE` ou `PENDING` — todas as outras têm pelo menos alguns em `ACTIVE`.

---

## 1. Backend — o que já funciona

**Categoria:** `category` é uma coluna `String` simples (não enum) em `Poi.java` (`portugal-na-mao-api/src/main/java/pt/dot/application/db/entity/Poi.java:43-44`). O valor `"trail"` é tratado como qualquer outra string de categoria — não há enum a validar/whitelist que pudesse excluir "trail". Está mapeado ao grupo `"natureza"` em `CategoryGroups.java:16`.

**Endpoints principais:**
- `GET /api/pois` (lista tudo) → `PoiController.java:29-32` → `PoiService.findAll()` → `PoiRepository.findAllVisible()`
- `GET /api/pois/{id}` (detalhe) → `PoiController.java:39-44` → **sem filtro de publication_status** (devolve qualquer POI por id, incluindo INACTIVE)
- `GET /api/pois/lite?bbox=...&categories=...` (endpoint principal do mapa) → `DistrictPoiController.java:21-35` → `PoiRepository.findLiteByBboxTiered()`

**DTOs — campos existentes:**
- `PoiLiteDto` (mapa/lista): `id, districtId, ownerId, name, namePt, category, lat, lon, imageUrl, tier`. Não inclui `description`, `geometry` nem galeria completa (por desenho — é o DTO "leve" para o mapa).
- `PoiDto` (detalhe, `GET /api/pois/{id}`): `id, districtId, ownerId, name, namePt, category, subcategory, description, lat, lon, architect, yearText, wikidataId, wikipediaUrl, osmId, osmType, source, image, images, sipaEnrichment, openingHours, phone, email, website`.
- **Não existe campo `geometry`** em nenhum dos dois DTOs, nem na entidade `Poi`. Os trilhos são armazenados apenas como um ponto (`lat`/`lon`) — não há LineString/Polygon/GeoJSON/WKT em lado nenhum do modelo atual. Isto é consistente com o pedido de "não alterar o modelo" — não há geometria de linha para "ligar", porque não existe na BD.

**Filtragem por categoria:** o parâmetro `categories` do endpoint `/api/pois/lite` aceita `trail` livremente (`PoiRepository.java:310`: `p.category = ANY(string_to_array(:categories, ','))`). Trilhos até recebem um **bónus de scoring** (+30 em vez de +15) quando têm imagem, junto com outras categorias de natureza (`PoiRepository.java:293-296`).

**Nenhuma exclusão de "trail" encontrada** em nenhum controller/service/repository (`grep -i "trail"` em todo o repo Java não revela nenhum `NOT IN`, blacklist, ou condição que exclua a categoria).

## 2. Backend — o que falta / bloqueia

**Bloqueio real: `publication_status`.**

- Enum: `PoiPublicationStatus { ACTIVE, PENDING, INACTIVE, DISABLED }` (`db/enums/PoiPublicationStatus.java`). Default para POIs novos: `INACTIVE` (`Poi.java:137`).
- **Todos** os endpoints de listagem (incluindo o endpoint de mapa usado pelo frontend) filtram `publication_status IN ('ACTIVE','PENDING')`: `PoiRepository.java` linhas 80, 131, 166, 183, 202, 221, 251, 313, 322, 388, 410, 426.
- A regra de promoção automática está em `PoiPublicationStatusService.java:35-42`:
  ```
  INACTIVE → se wikidata_id é NULL/vazio
  PENDING  → se tem wikidata_id mas images_status != 'done'
  ACTIVE   → se tem wikidata_id E images_status = 'done'
  ```
- Estado real dos 1.331 trilhos (query direta à BD, agora):
  - **1.308** não têm `wikidata_id` → ficam `INACTIVE` permanentemente até serem enriquecidos com Wikidata.
  - **13** têm `wikidata_id` mas `images_status` nulo → deveriam estar `PENDING` (já seriam visíveis, pois PENDING também passa o filtro).
  - **9** têm `wikidata_id` E `images_status='done'` → **já cumprem os critérios de `ACTIVE`**, mas continuam com `publication_status='INACTIVE'` porque o job de recálculo (`PoiPublicationStatusService.recalcAll()`) não foi corrido para estes registos desde que foram enriquecidos.
  - **1** tem `wikidata_id` e `images_status='no_data'` → ficaria `PENDING`.

  Exemplos dos 9 "prontos para ACTIVE mas presos em INACTIVE": *Passadiços do Paiva*, *Percurso dos Sete Vales Suspensos*, *PR 19 - Caminho Real do Paúl do Mar*, *Vereda Boca do Risco - Caniçal*, entre outros (ids 69817, 69558, 69583, 70474, 70569, 70725, 69641, 69724, 69859).

- O job de recálculo existe e está pronto a usar: `PoiPublicationStatusDataSource` (`opendata/source/publication/`), ativável via `--ptdot.opendata.publication-status.enabled=true --ptdot.opendata.publication-status.dry-run=false`. **Não foi executado neste diagnóstico** (é uma operação de escrita em dados — fora do âmbito de "apenas verificar" pedido).

**Conclusão backend:** não falta código. Falta (a) rodar o recálculo de `publication_status` (ativaria imediatamente os 23 trilhos com `wikidata_id`) e (b) correr o pipeline de enriquecimento Wikidata sobre a categoria `trail` para os restantes 1.308 (hoje o pipeline de nature-enrichment em `application.yml:278` nem sequer lista `trail` nas `categories:` — só `park,natural_park,beach,viewpoint,cave,waterfall,lake,mountain,geosite`).

## 3. Frontend — o que já funciona

Ficheiros/componentes envolvidos: `src/lib/categories.jsx`, `src/components/MapExplorer.jsx`, `src/components/FilterSheet.jsx`, `src/components/PoiModal.jsx`, `src/components/ShareCard.jsx`, `src/context/AppContext.jsx`, `src/lib/api.js`.

- **Filtros:** `trail` está definido em `categories.jsx:27` (`{ group: "natureza", icon: Footprints, pt: "Trilhos", en: "Trails" }`) e incluído no grupo `natureza` (`categories.jsx:43`). Aparece na `FilterSheet` como qualquer outra categoria, com contagem.
- **Mapa:** `MapExplorer.jsx` filtra por `activeCats`/`filterGroup` de forma genérica (`p.category`) — sem exceções para trail.
- **Cor do marcador:** definida (`#3E7044`, `categories.jsx:55`).
- **PoiModal:** lê os campos genéricos (`category`, `description`, `image/images`, `districtId`, `lat/lon`, `sipaEnrichment`, etc.) sem qualquer `if` dependente de categoria (exceto `event` vs `business` para o modo do formulário de horários, que não afeta trail).
- **Deep link `/poi/{id}`:** implementado em `AppContext.jsx:401-441`, chama `api.fetchPoiById(id)` (`lib/api.js:169-171` → `GET /api/pois/{id}`) e abre o POI — funciona para qualquer categoria, incluindo trail. **Nota:** como `GET /api/pois/{id}` não filtra por publication_status, um deep link direto a um trilho INACTIVE **já funciona hoje**, mesmo sem o trilho aparecer no mapa/pesquisa.
- **Favoritos:** `toggleFav()` em `AppContext.jsx:316-343` é genérico por `id`, sem dependência de categoria.
- **Partilha:** `ShareCard.jsx` gera `shareUrl = .../poi/{id}` e usa `catColor`/`catLabel` genéricos — sem exceção para trail.

## 4. Frontend — o que falta

- **Geometria:** não existe nenhum código que leia ou desenhe um campo `geometry` de POI. `MapExplorer.jsx` usa `<GeoJSON>` só para fronteiras de distrito e `<Polyline>` só para rotas de viagens (trips) — nenhum dos dois está ligado a POIs. Isto é consistente com o backend não ter geometria nenhuma para enviar — **não há nada para "ligar"**, porque a origem de dados (BD) não tem uma linha/polígono associada ao trilho, apenas um ponto lat/lon. Um trilho é hoje (e continuará a ser, dado que não vamos alterar o modelo) um marcador de ponto, tal como um miradouro ou uma praia.
- **api.js:** não existe (nem é necessário) nenhuma função dedicada a geometria/trilhos — todas as chamadas de POI são genéricas.

## 5. Bugs encontrados

**Nenhum bug de código foi encontrado no frontend nem no backend relacionado com a categoria trail.** O único "bug" latente é de dados/operacional:
- Os 9 trilhos com `wikidata_id` + `images_status='done'` deveriam estar `ACTIVE` mas estão presos em `INACTIVE` por falta de um recálculo — isto é uma inconsistência de dados (job não corrido), não um erro de lógica.

## 6. Estimativa de trabalho restante

Não é preciso escrever nenhum código novo de frontend ou backend para "terminar a integração" — ela já está terminada ao nível do código. O que resta é puramente operacional/dados:

| Ação | Esforço | Efeito |
|---|---|---|
| Correr `PoiPublicationStatusService.recalcAll(dryRun=false)` (via `PoiPublicationStatusDataSource`, flag `ptdot.opendata.publication-status.enabled=true` + `dry-run=false`) | minutos | Ativa imediatamente os 9 trilhos já prontos para `ACTIVE` e move 14 para `PENDING` (23 no total passam a aparecer no mapa) |
| Adicionar `trail` à lista `categories:` do `nature-enrichment` pipeline (`application.yml:278`) e correr o enriquecimento Wikidata para os 1.308 trilhos sem `wikidata_id` | horas a dias (depende do volume/rate-limit Wikidata, similar ao trabalho já feito para outras categorias de natureza) | Progressivamente move os restantes trilhos de INACTIVE → PENDING/ACTIVE |
| Nenhuma alteração de código é necessária em frontend nem backend | 0 | — |

**Se o objetivo for "ver trilhos aparecerem no site rapidamente para testar"**: bastaria correr o recálculo de `publication_status` (ação 1) — isso já tornaria 23 trilhos reais visíveis no mapa/filtros/partilha/favoritos hoje, sem qualquer alteração de código, schema ou modelo.

Esta operação de escrita em dados **não foi executada** neste diagnóstico, por estar fora do âmbito pedido ("apenas verificar"/"não alterar produção"). Fica aqui documentada para decisão do utilizador.
