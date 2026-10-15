# Estudo — Mapa, BBOX, Zoom, Scoring e Diversificação entre Categorias

**Data:** 2026-10-14
**Tipo:** auditoria técnica e funcional — exclusivamente análise, sem alterações de código, scores, dados ou produção.
**Método:** leitura de código (`DistrictPoiQueryService`, `PoiRepository`, `MapExplorer.jsx`, `compute_public_scores.py`, `scoring.yml`) + chamadas reais a `/api/pois/lite` contra o backend local (porta 8091) + consultas diretas à BD local (`pt_dot`) + verificação visual no browser (frontend local, porta 3000) + uma consulta externa (Wikipédia/SIPA/Turismo de Portugal) para o Castelo de Marvão. Reaproveita o inventário de categorias já levantado em `portugal-na-mao-api/SEARCH_SCORE_CATEGORY_DIVERSITY_STUDY.md` (confirmado ainda válido).

**Nota sobre sessão concorrente:** detetaram-se alterações em curso noutra sessão/IDE em `portugal-na-mao-api` (suporte multilingue — `nameEn` em `SearchItemDto`/`PoiFuzzySearchView`/`SearchService`) e em `PT-portugal-na-mao-fe` (novos assets de design, `GlobalInlineSearch.jsx`, `ProfilePanel.jsx`). Nada disso foi tocado por este estudo. `git status` final de cada repositório está na secção 13.

---

## 1. Resumo executivo

**A suspeita "aparecem muitos castelos" confirma-se, e a causa real é mais profunda do que `applyCategoryQuota()`.** Em três camadas, por ordem de impacto:

1. **`display_score` não está calibrado de forma comparável entre categorias.** `castle` é a ÚNICA categoria do país com POIs a atingir o teto de 100 (102 castelos em 100, média 93) — todas as outras categorias culturais e naturais ficam estruturalmente abaixo (`church` média 78, `natural_park` 69, `beach` 65, `monument` 61, `viewpoint` 57, `park`/`trail`/`lake` ~45-50). Quando a query SQL ordena por `score DESC` e corta no `poolLimit` ANTES de `applyCategoryQuota()` sequer correr, um bbox nacional ou regional fica preenchido quase só por castelos antes da diversificação ter qualquer hipótese de atuar.
2. **Categorias inteiras ficam estruturalmente fora de "Principais" por um portão fixo.** `monument` (1649 POIs ativos/pendentes): **0** passam os 4 portões simultâneos (heritage≥65, tourism≥60, quality≥50, display≥70) — o baseline de tourism de `monument` em `scoring.yml` é 55, sempre abaixo do mínimo de 60. `museum` (647 POIs): só 5 passam, por o baseline de heritage (60) ficar abaixo do mínimo de 65. Isto não é um problema de ordenação — estas categorias nunca chegam a `applyCategoryQuota()`.
3. **`applyCategoryQuota()` em si funciona como desenhado** (piso de 3 por categoria + round-robin por score) — confirmado a atuar corretamente nos testes de zoom 9/11/13. O problema não está aqui; está a montante.

**Achado adicional, fora do pedido original mas relevante:** o `zoomLimit()` do frontend (`MapExplorer.jsx`) **diverge do `scoring.yml map.maxPois` do backend** em quase todos os níveis de zoom (ex. zoom 12: frontend pede 70, backend por omissão daria 50; zoom 16: frontend pede 350, backend daria 100). Como o frontend envia sempre `limit` explícito, o valor do backend nunca é realmente usado na aplicação real — só nos meus testes diretos à API sem esse parâmetro. Ver secção 9.

**Castelo de Marvão:** Display=94 (percentil 99 nacional), aparece corretamente nos zooms de concelho/vila, mas **desaparece num zoom regional intermédio** (testado) porque outros castelos distantes, também a 100, ocupam os 8 lugares de castelo disponíveis nesse bbox mais amplo antes dele. Não é um bug — é a mesma causa da secção 1 aplicada a um caso concreto.

---

## 2. Funcionamento atual — confirmado por código, não por documentação

`DistrictPoiQueryService.findLiteWithFacets()` é o único ponto de entrada do mapa (`/api/pois/lite`). Dois modos:

- **`visibility=MAIN` ("Principais")**: `score = COALESCE(display_score, 0)`. Tier = 1 (elegível) ou 99 (excluído) — não há escala graduada. `confidence_score < 50` → tier 99 sempre. Categorias de natureza (`beach, viewpoint, waterfall, natural_park, trail, park, lake, geosite, mountain, cave`) passam automaticamente para tier 1 (só o portão de confidence se aplica). Categorias culturais só chegam a tier 1 se **heritage≥65 E tourism≥60 E quality≥50 E display≥70 simultaneamente** (`scoring.yml visibility.principais.cultural.minimum`).
- **`visibility=ALL` ("Todos")**: fórmula legacy separada (pontos fixos por sinal: SIPA auto-aceite, Wikidata, imagens, descrição), 4 tiers graduados, zoom→tier/limit fixos em `DistrictPoiQueryService.TODOS_ZOOM_POLICY` (não vem de `scoring.yml` — foi deliberadamente congelado assim em 2026-07-29, confirmado no próprio comentário do código). Este modo não foi o foco do estudo (a app usa `MAIN` por omissão, `scoring.yml map.defaultLayer: MAIN`).

**Pipeline real por pedido** (`fetchPrincipais`):
1. SQL `findLiteByBboxTiered` filtra por bbox+categoria+tier, ordena por `score DESC, rn, id`, corta em `poolLimit = min(limit*6, 2000)`. **Este corte acontece ANTES de qualquer diversificação.**
2. Se o resultado tiver menos de `minimumVisibleMainPois` (20), preenche com os melhores POIs da camada "Todos" por `display_score`, só se `display_score ≥ minimumFillDisplayScore` (70) — tiers sintéticos 2-9.
3. `applyCategoryQuota(combined, limit)` — piso de `min(3, tamanho_da_categoria)` por categoria individual, depois round-robin por score até ao `limit` do zoom.

**Mecanismo de anti-clustering espacial** (`ROW_NUMBER() OVER (PARTITION BY grelha ~0.6°, ORDER BY score DESC)`): existe no SQL mas só desempata POIs com o MESMO score — como `castle` tem uma massa enorme de empates exatos em 100, este mecanismo tem mais efeito prático em castelos do que noutras categorias, mas não resolve o problema de fundo (não filtra por categoria, só por célula geográfica).

**Frontend — sem filtragem adicional de categoria/score**, confirmado por leitura de `MapExplorer.jsx`: os marcadores recebidos da API são todos renderizados; a única coisa que o frontend faz é esconder gradualmente por **opacidade** (`opacityForTier`/`densityOpacityFloor`), nunca remove POIs da lista. Com densidade baixa (≤20 POIs visíveis) `densityOpacityFloor` devolve sempre opacidade 100% — confirmado visualmente: na vista nacional inicial, os 20 marcadores visíveis no browser correspondem exatamente aos 20 POIs devolvidos pela API (castelo×17, palácio×2, parque natural×1), sem nenhum escondido.

---

## 3. Primeiro carregamento do mapa

Capturado via DevTools de rede no browser local (não estimado): `GET /api/pois/lite?bbox=-16.5015,36.0136,0.1099,43.0127&limit=20&zoom=7&visibility=MAIN` (centro `[39.6,-8.2]`, zoom `7`, `MapExplorer.jsx` linhas 16/930-932).

Resultado real (20 POIs, 20/20 tier=1):

| Categoria | Contagem |
|---|---|
| castle | 17 |
| palace | 2 |
| natural_park | 1 |

**Porquê tantos castelos — testado, não assumido:** não é a quota (`applyCategoryQuota` só entra em ação se `pool.size() > limit`, e aqui o pool pré-quota já é quase todo castelo); não é o zoom (o `poolLimit` a este zoom é `20*6=120`, generoso); é o **score em si**. Verificado diretamente na BD: dentro deste bbox nacional, há 102 castelos com `display_score=100` exato — nenhuma outra categoria tem sequer um POI a 100. A SQL ordena só por score; com um ponto de "empate no topo" massivo e exclusivo de `castle`, o `poolLimit` de 120 fica preenchido quase inteiramente por castelos antes de `applyCategoryQuota` correr — e mesmo o piso de 3 por categoria não ajuda categorias que nem chegaram a entrar no pool de 120.

Confirmado visualmente no browser — screenshot da vista inicial mostra marcadores quase todos com o ícone de castelo/coroa, consistente 1:1 com a resposta da API.

---

## 4. Tabelas por zoom — Portalegre/Marvão

**Metodologia:** centro fixo em Castelo de Marvão (39.397, -7.380); bboxes calculados por escala geométrica a partir do bbox real capturado no zoom 7 (ver secção 3), dobrando a área a cada 2 níveis de zoom — aproximação padrão, não os bboxes exatos que o Leaflet geraria pixel-a-pixel nesta sessão (não consegui automatizar o arrasto/zoom do mapa de forma fiável via browser — ver limitações, secção 13). O `limit` usado em cada chamada é o valor que o **frontend realmente envia** (`zoomLimit()` em `MapExplorer.jsx`, não o `scoring.yml map.maxPois` do backend — são diferentes, ver secção 9).

### Zoom 9 — vista regional (Alentejo/Centro), bbox `-9.4564,38.5221,-5.3036,40.2719`, limit=50

50 POIs devolvidos. **Castelo de Marvão NÃO aparece.**

| # | ID | Nome | Categoria | Quality | Heritage | Tourism | Confidence | Display | Estado |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 50132 | Castelo de Ouguela | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 2 | 52226 | Castelo de Vila Verde dos Francos | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 3 | 53834 | Castelo de Castelo Branco | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 4 | 55068 | Castelo da Sertã | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 5 | 55323 | Muralhas Seiscentistas | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 6 | 56986 | Fortaleza de Nossa Senhora da Luz | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 7 | 56994 | Tower of Belém | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 8 | 57406 | Castelo de Torres Novas | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 9 | 59009 | Salinas de Rio Maior | natural_park | 100 | 85 | 90 | 100 | 93 | Apresentado |
| 10 | 63704 | Serras de Aire e Candeeiros Nature Park | natural_park | 100 | 85 | 90 | 100 | 93 | Apresentado |
| 11 | 63705 | Serra de São Mamede Nature Park | natural_park | 100 | 85 | 90 | 100 | 93 | Apresentado |
| — | 49707 | **Castelo de Marvão** | castle | 70 | 100 | 100 | 60 | **94** | **Devolvido pela API noutros zooms, NÃO selecionado neste bbox — perde para os 8 castelos a 100 listados acima** |

Os 8 lugares de `castle` (piso 3 + round-robin já esgotado pelos de maior score) ficaram todos preenchidos por castelos de **fora do distrito de Portalegre** que atingem o teto 100 — Marvão (94) fica de fora apesar de estar no percentil 99 nacional. Isto é o caso concreto pedido: um local importante desaparece ao afastar o zoom, não por estar mal classificado, mas por perder uma disputa de empate no topo contra castelos de outras regiões.

### Zoom 11 — vista distrital (Portalegre), bbox `-7.8991,39.1783,-6.8609,39.6157`, limit=50

50 POIs devolvidos. **Castelo de Marvão reaparece**, em #5.

| # | ID | Nome | Categoria | Quality | Heritage | Tourism | Confidence | Display | Estado |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 58443 | Castelo de Portalegre | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 2 | 58976 | Castelo de Montalvão | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 3 | 61669 | Castelo do Alegrete | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 4 | 62051 | Castelo de Amieira | castle | 100 | 100 | 100 | 100 | 100 | Apresentado |
| 5 | **49707** | **Castelo de Marvão** | castle | 70 | 100 | 100 | 60 | **94** | **Apresentado** |
| 6 | 57020 | Forte de São Roque | castle | 70 | 100 | 100 | 60 | 94 | Apresentado |
| 7 | 62107 | Torre da Portagem | castle | 65 | 100 | 100 | 100 | 93 | Apresentado |
| 8 | 63705 | Serra de São Mamede Nature Park | natural_park | 100 | 85 | 90 | 100 | 93 | Apresentado |
| 9 | 59596 | Castelo de Torrejão | castle | 60 | 100 | 100 | 100 | 92 | Apresentado |
| 10 | 61059 | Castelo de Seda | castle | 60 | 100 | 100 | 50 | 92 | Apresentado |
| 11 | 63933 | Site of Community Importance São Mamede | natural_park | 95 | 85 | 90 | 100 | 91 | Apresentado |
| 12 | 51273 | Anta da Aldeia da Mata | archaeology | — | — | — | — | 88* | Apresentado |
| 13 | 51272 | Anta da Nave do Grou | archaeology | 68 | 100 | 65 | 100 | 81 | Apresentado |
| 14 | 53292 | Anta dos Pombais | archaeology | 68 | 100 | 65 | 100 | 81 | Apresentado |
| 15 | 51913 | Menir do Patalou | archaeology | 100 | 70 | 65 | 100 | 74 | Apresentado |
| 16 | 54843 | Abrigo do Ninho do Bufo | cave | 70 | 85 | 75 | 60 | 74 | Apresentado |
| 17 | 50502 | Fonte dos Carvoeiros | viewpoint | 35 | 85 | 95 | 75 | 70 | Apresentado |
| 18 | 54709 | Miradouro da Senhora da Penha | viewpoint | 34 | 85 | 95 | 100 | 69 | Apresentado |
| 19 | 55012 | Miradouro de Santo António das Areias | viewpoint | 34 | 85 | 95 | 100 | 69 | Apresentado |
| 20 | 67504 | Cascata da Cabroeira | beach | 28 | 85 | 100 | 100 | 69 | Apresentado |

*linha 12: `display` lido da resposta da API (coluna `score`); os 4 eixos individuais não constavam do lookup feito — não reconstruído, assinalado em aberto.

Aqui o distrito tem 7 castelos próprios suficientemente bons para encher o piso+round-robin (incluindo Marvão), e ainda sobra espaço para `natural_park`, `archaeology`, `cave`, `viewpoint`, `beach` — a diversificação por categoria está claramente a funcionar neste zoom.

### Zoom 13 — vista concelhia (Marvão), bbox `-7.5098,39.3423,-7.2502,39.4517`, limit=100

26 POIs devolvidos (pool pequeno, `applyCategoryQuota` nem chega a cortar — `pool.size() ≤ limit`).

| # | ID | Nome | Categoria | Quality | Heritage | Tourism | Confidence | Display | Estado |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **49707** | **Castelo de Marvão** | castle | 70 | 100 | 100 | 60 | **94** | **Apresentado** |
| 2 | 57020 | Forte de São Roque | castle | 70 | 100 | 100 | 60 | 94 | Apresentado |
| 3 | 62107 | Torre da Portagem | castle | 65 | 100 | 100 | 100 | 93 | Apresentado |
| 4 | 63705 | Serra de São Mamede Nature Park | natural_park | 100 | 85 | 90 | 100 | 93 | Apresentado |
| 5 | 51272 | Anta da Nave do Grou | archaeology | 68 | 100 | 65 | 100 | 81 | Apresentado |
| 6 | 53292 | Anta dos Pombais | archaeology | 68 | 100 | 65 | 100 | 81 | Apresentado |
| 7 | 54843 | Abrigo do Ninho do Bufo | cave | 70 | 85 | 75 | 60 | 74 | Apresentado |
| 8 | 50502 | Fonte dos Carvoeiros | viewpoint | 35 | 85 | 95 | 75 | 70 | Apresentado |
| 9 | 54709 | Miradouro da Senhora da Penha | viewpoint | 34 | 85 | 95 | 100 | 69 | Apresentado |
| 10 | 55012 | Miradouro de Santo António das Areias | viewpoint | 34 | 85 | 95 | 100 | 69 | Apresentado |
| 11 | 49708 | Praça Alta | viewpoint | 26 | 85 | 95 | 100 | 66 | Apresentado |
| 12 | 51044 | Castelo (miradouro) | viewpoint | 26 | 85 | 95 | 100 | 66 | Apresentado |
| 13 | 61830 | Cidade romana de Ammaia | natural_park | 28 | 85 | 90 | 100 | 64 | Apresentado |
| 14 | 71071 | Albufeira da Apartadura | lake | 28 | 85 | 80 | 100 | 60 | Apresentado |
| 15 | 58764 | Jardim Gonçalo Eanes de Abreu | park | 34 | 85 | 70 | 100 | 58 | Apresentado |
| 16 | 59080 | Parque João José da Luz | park | 34 | 85 | 70 | 100 | 58 | Apresentado |
| 17 | 55617 | Pego Ferreiro | park | 26 | 85 | 70 | 100 | 55 | Apresentado |
| 18 | 59081 | Parque 25 de Abril | park | 26 | 85 | 70 | 100 | 55 | Apresentado |
| 19 | 59082 | Parque Malato Beliz | park | 26 | 85 | 70 | 100 | 55 | Apresentado |
| 20 | 59083 | Jardim Miradouro Penedo Monteiro | park | 26 | 85 | 70 | 100 | 55 | Apresentado |

### Zoom 15 — vista da vila (Marvão), bbox `-7.4124,39.3833,-7.3476,39.4107`, limit=200

Só 4 POIs no bbox — pool demasiado pequeno para `applyCategoryQuota` ter qualquer efeito (`pool.size() ≤ limit`).

| # | ID | Nome | Categoria | Quality | Heritage | Tourism | Confidence | Display | Score/prioridade usado | Estado |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **49707** | **Castelo de Marvão** | castle | 70 | 100 | 100 | 60 | **94** | tier=1 (gate cultural passado) | Apresentado |
| 2 | 62107 | Torre da Portagem | castle | 65 | 100 | 100 | 100 | 93 | tier=1 | Apresentado |
| 3 | 70077 | Percurso Pedestre de Marvão | trail | 18 | 30 | 85 | 100 | 50 | tier=1 (natureza, sem portão H/T/Q) | Apresentado |
| 4 | 51666 | Pelourinho de Marvão | monument | 90 | 85 | **55** | 100 | 76 | **tier=2 (preenchimento por display≥70, NÃO passou o portão cultural — tourism 55<60)** | Apresentado (via mecanismo de preenchimento, não Principais real) |

Caso concreto do portão de `monument`: o Pelourinho de Marvão tem Heritage=85 e Quality=90 — melhor que a maioria dos castelos nacionais nesses dois eixos — mas fica de fora de "Principais" (tier 1) só por Tourism=55 < 60. Só aparece aqui porque a zona é esparsa (pool<20) e o mecanismo de preenchimento (secção 2, passo 2) o resgata pelo Display Score (76≥70).

---

## 5. Decomposição dos cálculos — e um achado sobre a própria documentação

**Achado prévio a tudo o resto:** `SCORING_ARCHITECTURE.md` (datado de 2026-07-27, "fecha a Arquitetura 1.0") **já não descreve o código que está realmente em produção.** `compute_public_scores.py` foi reescrito 2 dias depois (comentário no próprio ficheiro: *"Tourism v3 (2026-07-29 simplification)"*, *"Quality... (v3, 2026-07-29 simplification)"*) — uma simplificação estrutural, não só valores:

| Eixo | Doc (`SCORING_ARCHITECTURE.md`) | Código real (`compute_public_scores.py`, confirmado) |
|---|---|---|
| Heritage | `SUBCATEGORY_HERITAGE_BASELINE[categoria,subcategoria]` (25-75) **+** bónus de proteção (aditivo, 0-40) | `max(baseline_categoria, protection_tier_score, rnap_tier_score)` — **máximo, não soma**, e só por categoria (sem subcategoria) |
| Tourism | baseline categoria + delta por subcategoria × fator visitabilidade + bónus contacto | baseline categoria (sem delta de subcategoria) × fator visitabilidade + bónus contacto |
| Quality | pontos por imagens (até 25/45) + descrição (15/10 ou 8/4) + fonte + wikipedia + localização | orçamento fixo por sinal lido de `scoring.yml quality.cultural/nature` (imagens 40/60, descrição 25/10, fonte 15/15, wikipedia 10/5, localização 10/10) |
| Display (pesos cultural) | Quality 0.20 / Heritage 0.42 / Tourism 0.38 | `scoring.yml display.cultural`: Quality 20 / Heritage 45 / Tourism 35 |
| Display (pesos natureza) | Quality 0.45 / Heritage 0.15 / Tourism 0.40 | `scoring.yml display.nature`: Quality 40 / Heritage 15 / Tourism **45** (tourism e quality trocados face ao documento) |

Isto não invalida o estudo (os valores persistidos na BD são os que o mapa realmente usa), mas significa que **qualquer raciocínio sobre "porque é que X tem este score" tem de partir do código/`scoring.yml`, nunca do documento**, que está desatualizado desde 2026-07-29. Recomendo atualizar `SCORING_ARCHITECTURE.md` como item separado (secção 11).

### Reconstrução manual — Castelo de Marvão (id 49707)

Dados de origem (BD, `poi` + `poi_sipa_enrichment`): categoria `castle`, subcategoria `Castle`, descrição 540 caracteres, 20 imagens `VALID`, `wikidata_id` presente, `wikipedia_url` presente, `district_id`+`municipality_id` ambos presentes, `poi_sipa_enrichment.protection` = *"Categoria: MN - Monumento Nacional..."*, `property` = *"Pública: estatal"*, `current_use` = *"Cultural e recreativa: marco histórico-cultural"*, `review_status` = `AUTO_ACCEPTED`, sem `website`/`phone`.

**Quality** (reconstruído com o código v3 atual — **bate certo** com o valor persistido):
- imagens: `min(20,5)/5 × 40 = 40` (cap cultural = 5 imagens)
- descrição ≥120 car.: `+25`
- fonte confiável (SIPA `AUTO_ACCEPTED`): `+15`
- wikipedia: `+10`
- localização completa (distrito+município): `+10`
- soma = 100 → mas `confidence_score=60` está na faixa `<80` → teto `confidencePenalty.below80=70`
- **Quality = 70** ✓ (igual ao persistido)

**Heritage** (reconstruído — **bate certo**):
- baseline categoria `castle` = 90
- `protection_tier_score("MN - Monumento Nacional")` = 100 (`heritage.protection.monumentoNacional`)
- `max(90, 100, …) = 100`
- **Heritage = 100** ✓ (igual ao persistido; confirmado externamente — ver secção 7, classificado Monumento Nacional desde 1922)

**Tourism** (reconstruído — **NÃO bate certo, discrepância assinalada**):
- baseline categoria `castle` = 90
- `property`="Pública: estatal" (não começa por "privada"), `current_use` ≠ "devoluto" → `visitability_score` = `public` = 100
- `90 × (100/100) = 90`; sem website/phone → sem bónus de contacto
- Reconstrução dá **Tourism = 90**, mas o valor persistido na BD é **100**.
- `scores_computed_at` deste POI = 2026-07-29 22:39:55 — a mesma data do comentário "v3 simplification" no código, por isso não consigo confirmar com segurança se este POI foi calculado pela fórmula atual ou por uma versão anterior do mesmo dia. **Não consegui reconstruir este valor com os dados disponíveis — fica assinalado como gap, não inventado.**

**Display** (perfil cultural, pesos `scoring.yml`: Q20/H45/T35):
- com os valores persistidos: `(70×20 + 100×45 + 100×35)/100 = (1400+4500+3500)/100 = 94` → **Display = 94** ✓ bate certo com o persistido, usando os eixos persistidos (não os reconstruídos) — confirma que a fórmula de blend está correta, o gap está só na origem do Tourism.

**Confidence = 60**: não reconstruído em detalhe (fórmula em `compute_confidence_score.py`, fora do foco deste estudo, min de 6 componentes) — fica como limitação.

---

## 6. Castelo de Marvão — análise dedicada

- **Scores:** Quality 70, Heritage 100, Tourism 100 (ver gap acima), Confidence 60, Display 94, percentil 99.
- **Classificação externa confirmada:** Monumento Nacional desde 4 de julho de 1922 (Decreto n.º 8228), registo DGPC 70363 / SIPA 3234, integrado no Parque Natural da Serra de São Mamede, uma das "Fortalezas de Fronteira" classificadas pelo Turismo de Portugal — consistente com o Heritage=100 e com o facto de passar confortavelmente todos os portões culturais.
- **Aparece:** zoom 11 (distrital), zoom 13 (concelhio), zoom 15 (vila) — sempre tier 1, nunca via mecanismo de preenchimento.
- **Desaparece:** zoom 9 (regional) — não por score baixo, mas por perder a disputa pelos 8 lugares de `castle` contra 8 castelos de outras regiões também a 100 (ver tabela da secção 4). A região de Portalegre tem 7 castelos fortes (todos entre 92-100), mas numa vista regional mais ampla eles competem com castelos de todo o país.
- **Comparação direta:** `Forte de São Roque` (também em Marvão) tem exatamente os mesmos 4 eixos (70/100/100/60) e o mesmo Display (94) — os dois sobem e descem juntos em qualquer zoom. `Torre da Portagem` (93) e os castelos de Portalegre/Montalvão/Alegrete/Amieira (100) formam o resto do grupo local forte.
- **Pelourinho de Marvão** (monument, Heritage 85, Quality 90) nunca chega a tier 1 "real" — só aparece via preenchimento em zonas esparsas, por causa do portão fixo de Tourism≥60 que a categoria `monument` falha estruturalmente (secção 1).

---

## 7. Distribuição por categoria (nacional, confirmado na BD)

Reaproveitado + ampliado do estudo anterior — médias e teto de `display_score`:

| Categoria | Ativos+Pendentes | Média Display | Máx Display | Nº a 100 |
|---|---|---|---|---|
| castle | 334 | 93 | 100 | **102** |
| natural_park | 647 | 69 | 96 | 0 |
| church | 272 | 78 | 88 | 0 |
| museum | 647 | 66 | 87 | 0 |
| beach | 1040 | 65 | 95 | 0 |
| monument | 1649 | 61 | 86 | 0 |
| viewpoint | 1387 | 57 | 94 | 0 |
| trail | 1686 | 50 | 59 | 0 |
| lake | 854 | 50 | 84 | 0 |
| park | 3462 | 45 | 82 | 0 |

**Quantos passam o portão de elegibilidade "Principais" cultural (heritage≥65 E tourism≥60 E quality≥50 E display≥70 E confidence≥50), por categoria:**

| Categoria | Total | Passa tourism≥60 | Passa heritage≥65 | Passa TODOS os portões |
|---|---|---|---|---|
| castle | 334 | 312 (93%) | 333 (99%) | **300 (90%)** |
| archaeology | 701 | 592 | 699 | 184 (26%) |
| church | 272 | 202 | 271 | 178 (65%) |
| palace | 398 | 270 | 395 | 153 (38%) |
| natural_park | 647 | 646 | 647 | 196 (30%, bottleneck: quality) |
| geosite | 222 | 222 | 222 | 11 (5%) |
| museum | 647 | 646 | **11 (2%)** | **5 (0,8%)** |
| monument | 1649 | **4 (0,2%)** | 1646 | **0 (0%)** |

---

## 8. Causas identificadas — explícitas, por mecanismo

1. **Saturação do teto de score em `castle`** (secção 1/3) — causa principal do "muitos castelos", independente de quota.
2. **Portão fixo de Tourism≥60 exclui `monument` por inteiro** — baseline de categoria (55) abaixo do mínimo.
3. **Portão fixo de Heritage≥65 quase exclui `museum`** — baseline de categoria (60) abaixo do mínimo.
4. **Corte por `poolLimit` acontece antes de `applyCategoryQuota`** — a quota só pode diversificar o que já sobreviveu a um corte ordenado só por score; não pode "resgatar" uma categoria que nem entrou no pool.
5. **`applyCategoryQuota` em si está correto** — confirmado funcional nos zooms 11/13 (ver tabelas). Não é preciso mexer aqui.
6. **Divergência frontend/backend no limite por zoom** (secção 9) — afeta quantos POIs entram em cada pedido real, isto é, afeta indiretamente quão "apertada" fica a disputa dentro de cada categoria.
7. **Confidence<50/80 penaliza Quality mesmo quando os outros eixos são excelentes** (ex. Marvão: Quality capado em 70 apesar de 100 pontos de completude) — não impede elegibilidade aqui (display ainda fica em 94), mas é um fator a ter em conta ao comparar POIs.

---

## 9. Achado adicional — `zoomLimit()` (frontend) vs `scoring.yml map.maxPois` (backend)

`PT-portugal-na-mao-fe/src/components/map/MapExplorer.jsx` linhas 95-106:

```js
function zoomLimit(z) {
  const floor = Math.floor(z);
  if (floor <= 8) return 20;
  if (floor <= 10) return 50;  // backend: 35
  if (floor === 11) return 50;
  if (floor === 12) return 70;  // backend: 50
  if (floor === 13) return 100;
  if (floor === 14) return 140; // backend: 80
  if (floor === 15) return 200;
  if (floor === 16) return 350; // backend: 100
  return 600;
}
```

vs `scoring.yml map.maxPois`: zoom8=20, zoom10=35, zoom12=50, zoom14=80, zoom16=100, zoom18=200.

O comentário no próprio `MapExplorer.jsx` (linha 90-94) já assume isto: *"this local table is only a client-side estimate... the real request sends raw zoom and lets the server decide"* — **mas isso está errado**: `fetchPoisLiteBbox()` (`lib/api.js`) sempre define `qs.set("limit", ...)` a partir do valor passado, e `BboxLoader` sempre passa `limit: zoomLimit(zoom)` explicitamente. O backend só usaria o seu próprio `scoring.yml map.maxPois` se `limit` viesse `null` — o que nunca acontece na aplicação real. Confirmado pela captura de rede real da secção 3 (`limit=20` explícito no pedido inicial, que por coincidência é igual nos dois lados só neste zoom específico).

Isto não foi pedido para corrigir nesta fase (é só diagnóstico), mas é relevante: a app real mostra sempre MAIS POIs por zoom do que `scoring.yml` sozinho sugeriria, o que estreita ainda mais a janela disponível para diversificação em zooms intermédios.

---

## 10. Avaliação conceptual — seleção inicial predefinida (não implementado)

Só análise de viabilidade, conforme pedido.

**A favor:**
- Resolveria o problema da secção 3 (primeira impressão dominada por castelos) sem tocar no scoring real.
- Zero custo de computação em runtime — uma lista fixa ou uma tabela pequena em cache.
- Compatível com desktop e mobile sem alterações de layout (os marcadores já renderizam da mesma forma, venham de onde vierem).

**Contra / riscos técnicos a validar antes de avançar:**
- **Não resolve o problema de fundo** (secção 1): assim que o utilizador interage (zoom/pan), volta ao mecanismo normal de BBOX, e o mesmo desaparecimento de Marvão em zoom intermédio continua a acontecer — só a primeira impressão fica mais bonita.
- **Risco de voltar a ficar dominado por castelos**, exatamente como o André identificou: Pena, Castelo dos Mouros, São Jorge, Guimarães, Marvão são todos castelos/palácios. Uma seleção de ~20 com maioria cultural-castelo repetiria o mesmo viés visual só que "a dedo" em vez de por score.
- **Zoom/posição inicial variável**: a lista de 20 só faz sentido no zoom/bbox nacional de arranque (zoom 7, `PORTUGAL_CENTER`). Se o utilizador recarrega a app já zoomado numa região (ex. após abrir um link direto para um distrito), a lista fixa não é aplicável — precisa de uma condição clara de "quando usar" (ex. só no primeiro render com bbox/zoom == default).
- **Cache**: trivial (lista estática ou tabela nova de ~20 linhas), não é um problema técnico significativo.
- **Curadoria vs cálculo**: uma lista manual precisa de manutenção editorial contínua (e decisão de quem a mantém); uma lista calculada (ex. top-2-3 por categoria por `display_score`, com piso de diversidade por categoria aplicado UMA VEZ, offline) seria mais robusta a longo prazo e mais fácil de justificar objetivamente.

---

## 11. Propostas de melhoria — por impacto/esforço (sem implementar)

| # | Proposta | Tipo | Impacto | Esforço | Risco |
|---|---|---|---|---|---|
| 1 | Recalibrar `tourism.category.monument` e `heritage.category.museum` em `scoring.yml` para não ficarem estruturalmente abaixo dos mínimos de "Principais" | Ajuste de scoring | Alto — desbloqueia 2 categorias inteiras | Baixo (1 ficheiro de config + recorrer `compute_public_scores.py`) | Médio — muda quem é elegível para "Principais" em todo o país, precisa de validação ampla antes de aplicar |
| 2 | Mover o corte "só por score" para DEPOIS de uma primeira passagem de diversificação por categoria (ex. reservar uma fração do `poolLimit` por categoria antes do corte, não só depois) | Ajuste de quotas/seleção por zoom | Alto — ataca a causa raiz da secção 1 | Médio — requer repensar a query SQL ou o `poolLimit`, com testes de regressão no mapa | Médio |
| 3 | Alinhar `zoomLimit()` (frontend) com `scoring.yml map.maxPois` (backend) — ou um só, ou documentar a divergência como intencional | Ajuste de frontend | Médio — afeta densidade real por zoom | Baixo | Baixo |
| 4 | Atualizar `SCORING_ARCHITECTURE.md` para refletir o código v3 real (secção 5) | Documentação | Médio (evita mais confusão em estudos futuros) | Baixo | Nenhum |
| 5 | Investigar porque `tourism_score` de Marvão (100 persistido) não bate com a fórmula v3 atual (90 reconstruído) — correr um diff amostral entre persistido e recalculado para ver se é sistémico | Scoring (investigação) | Desconhecido até investigar | Baixo (script de diff) | Nenhum — só leitura |
| 6 | Seleção inicial predefinida (secção 10) | Frontend + dados | Médio (primeira impressão) | Médio | Baixo, mas não resolve o problema de fundo sozinho |

**Não recomendado sem mais evidência:** subir/descer o piso de `applyCategoryQuota()` (hoje 3) — o mecanismo já está a funcionar corretamente onde chega a atuar; o problema está a montante.

---

## 12. Riscos e efeitos secundários

- Qualquer alteração aos mínimos de `scoring.yml` (proposta 1) muda a composição de "Principais" em todo o país, não só em Portalegre — precisa de validação com amostras de várias regiões antes de aplicar.
- Mudar a ordem corte→quota (proposta 2) pode alterar performance da query (mais trabalho antes do `LIMIT`) — precisa de medição.
- Alinhar os limites de zoom (proposta 3) muda a densidade visual que os utilizadores já conhecem — mudança de UX, não só técnica.

---

## 13. Limitações e plano recomendado

**Limitações honestas desta sessão:**
- Os bboxes de zoom 9/11/13/15 foram calculados por escalagem geométrica a partir de um bbox real capturado (zoom 7), não arrastados/aproximados pixel-a-pixel no browser real — não consegui automatizar de forma fiável o zoom/pan do Leaflet via browser nesta sessão (interações de clique no droplist de pesquisa desviaram-se do alvo a meio da tarefa). A vista nacional inicial FOI confirmada visualmente 1:1 contra a API; as restantes não foram verificadas marcador-a-marcador no browser — tratadas aqui como "devolvido pela API", não "confirmado visualmente".
- `Tourism_score` de Marvão não foi totalmente reconstruído (secção 5) — falta confirmar se os scores persistidos refletem mesmo a versão v3 do código ou uma versão anterior do mesmo dia.
- Linha 12 da tabela de zoom 11 (Anta da Aldeia da Mata) não tem os 4 eixos individuais no lookup feito — só o Display via resposta da API.
- Não foi avaliada a camada "Todos" (`visibility=ALL`) em profundidade — fora do âmbito pedido (a app usa `MAIN` por omissão).

**Plano recomendado (ordem):**
1. Validar a proposta 5 (diff sistemático persistido vs recalculado) — é só leitura, esclarece se há um problema de dados maior antes de mexer em scoring.
2. Decidir sobre as propostas 1+2 em conjunto (são a mesma causa raiz, duas camadas) — com amostragem multi-região antes de aplicar a produção.
3. Proposta 3 (alinhar limites) e 4 (atualizar documentação) — baixo risco, podem avançar em paralelo, independentes do resto.
4. Só depois disto estabilizado, revisitar a proposta 6 (seleção inicial) com uma base de scoring já mais justa — caso contrário a lista fixa só esconde o problema.

---

## 14. `git status` — início e fim da sessão

**Início e fim foram idênticos** (nenhuma escrita feita por este estudo, exceto este ficheiro):

```
portugal-workspace:
 M LAUNCH_1_0_REPORT.md   (fora do âmbito desta sessão — não investigado)

portugal-na-mao-api:
M  src/main/java/pt/dot/application/api/dto/search/SearchItemDto.java      (sessão concorrente)
M  src/main/java/pt/dot/application/db/repo/PoiFuzzySearchView.java        (sessão concorrente)
M  src/main/java/pt/dot/application/db/repo/PoiRepository.java             (fase anterior, não desta sessão)
MM src/main/java/pt/dot/application/service/search/SearchService.java     (fase anterior + sessão concorrente)
?? SEARCH_SCORE_CATEGORY_DIVERSITY_STUDY.md

PT-portugal-na-mao-fe:
 M src/components/shared/GlobalInlineSearch.jsx   (sessão concorrente)
 M src/components/social/ProfilePanel.jsx          (sessão concorrente)
 A  public/profile-hero-bg.png                     (sessão concorrente)
AM assets/reference-screenshots/... (vários)        (sessão concorrente)
```

Nada foi tocado, alterado ou commitado por este estudo.
