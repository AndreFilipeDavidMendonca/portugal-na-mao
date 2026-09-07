# Relatório de Alterações — Preparação Launch 1.0

Nada commitado, nada em push, nada em deploy. `PT-portugal-na-mao-fe` e `portugal-na-mao-api`, ambos em `main`.

Trabalho da Van/Tour Guide preservado à parte em `feature/van-tour-guide` — não faz parte deste relatório.

---

## 1. Localização exata dos participantes na Trip

- **Tipo:** feature nova (backend + frontend).
- **Intenção:** mostrar no mapa da Trip onde estão os outros participantes, e o próprio utilizador.
- **Scope:** só dentro de "Ver no mapa" de uma Trip; autorização estrita (só membros, incluindo o próprio).
- **Ficheiros:**
  - Backend: `TripService.java`, `TripController.java`, `TripParticipantLocationDto.java` (novo)
  - Frontend: `api.js`, `TripParticipantMarkers.jsx` (novo), `MapExplorer.jsx`

## 2. Visual do marker de participante

- **Tipo:** redesign visual + correção de stacking (z-index).
- **Intenção:** avatar real do participante num pin (não ícone genérico); markers visíveis por cima do modal de POI.
- **Scope:** só o marker de participante na Trip; nada de POIs, Tour Guide ou Van.
- **Ficheiros:** `TripParticipantMarkers.jsx`, `categories.jsx`, `index.css`

## 3. Guide Profile

- **Tipo:** feature nova (backend + frontend + migration de BD).
- **Intenção:** identidade própria para contas GUIDE — territórios, línguas, especialidades, estilo, experiência/credenciais.
- **Scope:** perfil e Amigos→Guias; dados preservados ao trocar de tipo de conta.
- **Ficheiros:**
  - Backend: `GuideProfile.java`, `GuideLanguage.java`, `GuideLanguageLevel.java`, `GuideProfileRepository.java`, `GuideProfileService.java`, `GuideSpecialties.java`, `GuideStyles.java`, `GuideLanguages.java`, `GuideProfileController.java`, `GuideController.java`, `GuideService.java`, `GuideSummaryDto.java`, `V86__guide_profile.sql`
  - Frontend: `GuideProfileEditor.jsx`, `GuideProfileSummary.jsx`, `guideVocab.js`, `ProfilePanel.jsx`, `FriendsPanel.jsx`, `api.js`, `i18n.js`

## 4. Localização própria — atualização automática

- **Tipo:** correção de comportamento (frontend).
- **Intenção:** `lastLat/lastLon` atualiza sozinho a cada acesso/retoma da app, sem depender do botão "Localizar"; respeita os 3 estados de permissão (concedida / por decidir / negada).
- **Scope:** capacidade transversal da app; reutiliza o endpoint `POST /api/me/location` já existente, sem endpoint novo.
- **Ficheiros:** `AppContext.jsx`

## 5. Navegação — sair do "Ver no mapa"

- **Tipo:** correção de comportamento (frontend).
- **Intenção:** "Ver no mapa" (Trip ou Favoritos) fecha automaticamente ao navegar para outra secção ou ao clicar em "Explorar à Minha Volta", em vez de ficar ativo por trás.
- **Scope:** só o ciclo de vida do modo "Ver no mapa"; mapa normal e Trip/Favoritos inalterados.
- **Ficheiros:** `AppContext.jsx`, `MapControls.jsx`

## 6. Migração de imagens externas para R2 (Cloudflare)

- **Estado:** parcialmente **Sincronizado com produção** (ver detalhe abaixo — a migração R2 local + a correção dos 112 POIs estão em produção; os 4 atípicos e os 192 POIs do backlog histórico continuam pendentes).
- **Tipo:** operação de dados (BD local + storage), não código de produto.
- **Intenção:** reduzir dependência da CDN da Wikimedia Commons — `media_item.storage_key` passa a apontar para uma key R2 em vez de um URL externo; `original_url` preserva a proveniência.
- **Scope:** só providers `wikidata-gallery`/`commons-pipeline` (allowlist deliberado — `flickr` fica de fora até validação de licença por foto; `wikimedia` fica de fora pelo risco de erro já documentado). 318 URLs únicas (340 `media_item`) migradas em BD local + bucket `ptdot-media-dev`; 2 falhas genuínas e sem remédio automático (um `.webm` sem content-type de imagem, um 404 real na Commons).
- **Reconciliação (2026-09-06)**: universo real da correção de imagens de 2026-08-14 é **116 POIs** (não 107 — a query de candidatos dispara também para `SUSPECT`, não só `REMOVED`). Análise inicial classificou 55 seguros/57 órfãos/4 atípicos, mas os "57 órfãos" eram **falso positivo** de um bug de matching (confirmado manualmente no POI #51750 — as keys "órfãs" eram as próprias imagens antigas já migradas para R2, só com o `quality_status` por sincronizar). Corrigido e reverificado: **112 SAFE, 4 atípicos genuínos** (esses têm imagem antiga via `wikimedia` lazy-fetch, proveniência mista, precisam de revisão manual).
- **Aplicado em produção em 2026-09-06**: os 112 POIs seguros — **341 UPDATEs de status (7 REMOVED + 334 SUSPECT) + 328 INSERTs de imagem nova, 0 erros**, confirmado por amostragem direta pós-apply (POI #49703 e #51750 verificados). Confirmado também que produção usa o mesmo bucket R2 público (`REACT_APP_MEDIA_BASE_URL` de produção = mesmo `pub-f401bb...r2.dev` testado), por isso as keys já migradas localmente resolvem corretamente sem novo upload.
- **Investigação dos 4 atípicos (2026-09-06)**: a imagem antiga destes POIs (`provider='wikimedia'`) já tinha sido corrigida em produção por um script mais antigo (`wikimedia_suspect_production_sync.py`, sessão anterior a 2026-08-14) — por isso não batiam com a pré-condição do script principal ("antiga ainda VALID"). Reclassificados: **3 seguros** (#66226 Castelo Branco, #68547 Forno de Orca, #68966 Praia do Sul), **1 decisão de conteúdo pendente** (#65269 Almeirim — as "imagens novas" são as mesmas fotos já marcadas `SUSPECT`, só reinseridas via tier diferente do reenrich, sem resolver a ambiguidade original).
- **Aplicado em produção em 2026-09-06**: os 3 seguros — **11 INSERTs + 1 UPDATE extra** (POI #68547 tinha uma imagem cuja classificação em produção estava desatualizada: `SUSPECT`→`REMOVED`, para bater com a reclassificação mais forte já feita em local), 0 erros, confirmado por `SELECT` direto pós-apply nos 3 POIs.
- **Ainda pendente (decisão do André)**: só o POI #65269 (Almeirim); e o backlog histórico separado de **192 POIs / 370 registos** — produção mostra imagens que local já invalidou noutras rondas de correção anteriores a 2026-08-14, nunca sincronizadas, descoberto nesta reconciliação e ainda por investigar.
- **Ficheiros:** `r2_media_migration_runner.py`, `r2_media_migration_production_sync.py`, `wikimedia_r2_reconciliation.py`, `wikimedia_r2_safe_correction_production_sync.py`, `wikimedia_r2_atypical3_production_sync.py` (novo, aplica os 3 atípicos seguros), `WIKIMEDIA_R2_RECONCILIATION_REPORT.md`, `wikimedia_r2_reconciliation_raw.json`, `WIKIMEDIA_R2_SAFE_CORRECTION_PRECHECK.md`, `WIKIMEDIA_R2_SAFE_CORRECTION_REPORT.md`, `WIKIMEDIA_R2_ATYPICAL3_PRECHECK.md`, `WIKIMEDIA_R2_ATYPICAL3_REPORT.md`, `r2_media_migration_log.csv`, `R2_MEDIA_MIGRATION_PRODUCTION_SYNC_PRECHECK.md`.

## 7. Enrichment Flickr para Municípios (Fase 2: teste 100 → Fase 3: universo completo 308, aplicado em LOCAL)

- **Tipo:** operação de dados (BD local), aplicado. Produção NÃO tocada.
- **Intenção:** avaliar se a lógica de enrichment Flickr já validada para POIs (busca dupla geo+nome, classificação HERO/GALLERY/CONTEXT) também funciona para Municípios, adaptando raio de busca (proporcional à área, não fixo) e sinal de nome (nome direto do concelho em vez de "prefixo de tipo de lugar").
- **Scope:** amostra estratificada de 100/308 municípios (32%, proporcional por distrito/região). Resultado: **94% (94/100) HERO+GALLERY** (imagem válida), **95% cobertura total** incluindo CONTEXT, **5% NO_MATCH**. Spot-check visual a 8 fotos vencedoras confirmou boa correlação classificação↔qualidade real (6-7/8 claramente representativas), mas identificou um modo de falha real: nomes de concelho de um só token (ex. "Serpa") aceitam qualquer foto que só mencione o nome na legenda/tag, mesmo sem o conteúdo da foto ser o próprio local (exemplo confirmado: foto vencedora de Serpa era uma prateleira de vinhos num supermercado, geotagged em Serpa mas sem valor representativo). Auditoria à parte das imagens ATUAIS dos municípios (mesma amostra, fonte Wikimedia Commons) encontrou pelo menos 2 casos confirmados claramente inadequados (um ficheiro `.webm` em vez de imagem; uma foto de guitarras de uma feira NAMM sem relação com o município) e, por inspeção visual de 10 casos "URL sem sinal de nome", 7/10 eram imagens genuinamente inadequadas (mota com matrícula, furgão com matrícula, placa industrial EDP, brasão de futebol de outro concelho, gato, folha de árvore, escultura em osso de baleia).
- **Mitigação testada (nomes de 1 token distintivo, ex. Serpa)**: regra "só chega a HERO se `geo`/`geo+name`, nunca só `name`" testada contra o próprio Serpa (controlo) e contra os 5 NO_MATCH da amostra. No Serpa, a mitigação funciona — troca o vencedor pela prateleira de supermercado por um candidato confirmado por geo, mas o novo vencedor ainda é uma foto de interior (painel de museu sobre Cante Alentejano), não uma imagem do lugar — a mitigação reduz o pior tipo de falso positivo mas não garante qualidade "hero". Nos 5 NO_MATCH (Castro Marim, Constância, Almada, Ponte da Barca, Santa Cruz das Flores) **a mitigação não teve nenhum efeito** — confirmado que a causa é outra: para Castro Marim/Constância o candidato Flickr mais próximo fica 8-32% **fora** do raio de busca calculado (escassez real de fotos ali, não falta de sinal de nome); para Almada/Ponte da Barca/Santa Cruz das Flores há candidatos dentro do raio mas nenhum com sinal de nome no título. A validação de polígono não contribuiu para nenhum dos 5 NO_MATCH.
- **Fase 3 (2026-09-07) — universo completo aplicado em LOCAL**: precheck live nos 308 municípios (não reaproveitou o CSV da Fase 2 — refez a busca para ter URL da foto + um pipeline 100% uniforme), depois `--apply` real. Resultado: **182 HERO, 111 GALLERY, 1 CONTEXT, 14 NO_MATCH — 95,1% HERO+GALLERY, 95,5% cobertura total**, 616 chamadas API, 0 erros, 0 rate-limits. **294 imagens inseridas em `media_item`** (entity_type='MUNICIPALITY', provider='flickr'): 184 `VALID`, 110 `SUSPECT`. **`hero_image_url`/`gallery_images_json` NÃO foram tocados em nenhum município** (confirmado: continuam 306/308 preenchidos, exatamente como antes) — os candidatos Flickr ficam disponíveis como registos novos em `media_item` para curadoria futura, a promoção a "hero" é um passo manual separado (mesmo modelo já usado para POIs).
- **Achado que merece atenção**: a mitigação Serpa (só promove a HERO com confirmação `geo`/`geo+name`, nunca só `name`) afetou **109/308 municípios (35%)**, muito mais do que o único caso (Serpa) que a motivou — porque ~1/3 dos concelhos portugueses têm nome de 1 só token. Isto inclui casos já confirmados visualmente como boas imagens na Fase 2 (ex. Arouca, Estarreja, Ovar), que ficam marcados `SUSPECT` só por causa do nome do concelho, não por problema real na foto. A mitigação foi aplicada tal como validada (só despromove, nunca promove), mas o seu raio de ação é muito maior do que a amostra de 100 sugeria — decisão do André se compensa isto na curadoria (ex. tratar `SUSPECT`-por-mitigação como prioridade alta de revisão, não como "provavelmente mau").
- **NO_MATCH (14) inclui 2 casos notáveis**: Funchal e Ponta Delgada (as duas maiores cidades dos arquipélagos) ficaram sem match, apesar de serem muito fotografadas — diagnosticado: mesmo padrão já visto na Fase 2 (candidato mais próximo do Flickr fica ligeiramente fora do raio/threshold calculado a partir do centróide do polígono), agravado em municípios alongados onde o centróide geométrico cai longe do centro urbano real (ex. Madeira, costa↔serra). Não é bug de mitigação nem de polígono.
- **Estado:** Implementado. Validado localmente (precheck live + apply real em BD local, 0 erros). NÃO sincronizado com produção — aguarda validação do André antes de avançar.
- **Decisão pendente do André:** validar os 294 candidatos inseridos (sobretudo os 110 `SUSPECT`, dos quais 109 são só por causa do nome de 1 token, não por conteúdo suspeito); decidir sobre os 14 NO_MATCH (aceitar ou alargar tolerância de raio); só depois autorizar sync para produção.
- **Ficheiros (todos em `portugal-na-mao-api`, Fase 2 já commitada em `14aecf3`; Fase 3 nova, ainda não commitada nesta entrada)**: Fase 2 — `municipality_flickr_enrichment_test.py`, `municipality_current_image_url_audit.py`, `municipality_flickr_visual_spotcheck.py`, `municipality_flickr_no_match_diagnosis_and_serpa_mitigation.py`, `MUNICIPALITY_FLICKR_ENRICHMENT_TEST_REPORT.md`, `MUNICIPALITY_CURRENT_IMAGE_URL_AUDIT_REPORT.md`, `municipality_flickr_enrichment_test_results.csv`, `municipality_current_image_url_audit.csv`, `municipality_flickr_visual_spotcheck.csv`. Fase 3 — `municipality_flickr_full_enrichment.py` (precheck+apply), `MUNICIPALITY_FLICKR_FULL_ENRICHMENT_PRECHECK.md`, `MUNICIPALITY_FLICKR_FULL_ENRICHMENT_APPLY_REPORT.md`, `municipality_flickr_full_enrichment_results.csv`.
