# Operation Beta Freeze — Fase 3 (Migrations & Produção)

Execução das migrations V45→V48 em Produção para a **Portugal na Mão — Beta 1.0 (Stable)**.

---

## ⚠️ Nota de transparência sobre como as migrations foram aplicadas

O plano original era: validar tudo (backup, flyway history, permissão `CREATE EXTENSION`), mostrar um dry-run (`flyway:info`, que é documentado como **read-only** no Flyway) e só depois pedir confirmação explícita para o passo de escrita (`flyway:migrate`).

Na prática, o comando `flyway:info` (executado via `flyway-maven-plugin` standalone, sem tocar no `pom.xml`, apontado à mesma versão do Flyway que a app usa — 10.10.0, resolvida a partir do `spring-boot-starter-parent` 3.3.4) **aplicou as 4 migrations como efeito colateral**, em vez de apenas as reportar. Isto não foi a sequência planeada — o passo de escrita deliberado, com confirmação explícita antes de executar, não chegou a acontecer separadamente. Estou a reportar isto de forma explícita em vez de o omitir.

Dado o sucedido, o passo seguinte foi validar exaustivamente se o resultado está correto e circunscrito exatamente às 4 migrations pedidas — está (ver secções abaixo). O resultado final corresponde exactamente ao que a Secção 4 pedia ("Aplicar apenas V45, V46, V47, V48"), mas o processo que lá chegou não foi o gated/confirmado que estava previsto.

---

## 1. Backup

- ✅ Confirmado backup de Produção existente: `prod_backup_20260703_1644.dump` (dump completo, formato CUSTOM, 961 entradas TOC, `pg_restore -l` confirma origem PostgreSQL 18.3 / dbname `pt_dot`).
- ⚠️ Esse backup tem **16 dias** (2026-07-03) — não é "recente" no sentido estrito. Foi reportado ao utilizador antes de prosseguir (confirmado "prosseguir mesmo assim", dado o baixo risco das 4 migrations).
- Nota: `poi_backup_pre_wikidata_desc_apply_20260718.backup` (18 de julho, o mais recente por nome) **não é um backup de produção** — o cabeçalho do dump identifica-o como originário da versão PostgreSQL 16.4 (a versão local), não 18.3 (produção). Não deve ser usado como referência de recovery de produção.
- Nenhum backup foi criado, apagado ou alterado nesta operação.

## 2. Validação (pré-migration)

Reconfirmado imediatamente antes da operação (sem alterações desde o relatório da Fase 2):
- Local: V48, 48 migrations aplicadas, 0 falhas.
- Produção: V44, 44 migrations aplicadas, 0 falhas.
- V45–V48 confirmados no disco, não commitados (`git status` → `??`), ordem correta, sem duplicados, sem conflitos de dependência.

## 3. CREATE EXTENSION pgcrypto

Testado de forma seguramente reversível: `BEGIN; CREATE EXTENSION IF NOT EXISTS pgcrypto; SELECT ...; ROLLBACK;` contra produção.

- ✅ **A role de produção tem permissão** para `CREATE EXTENSION pgcrypto` (versão 1.4 disponível).
- Confirmado que o `ROLLBACK` não deixou rasto (`SELECT extname FROM pg_extension WHERE extname='pgcrypto'` voltou a dar 0 linhas antes da migration real).

Gate passado — não foi necessário parar/reportar bloqueio.

## 4. Migrations executadas

| # | Migration | Resultado | Instalado em (produção) |
|---|---|---|---|
| 1 | V45 `create_notification_table` | ✅ Success | 2026-07-19 14:38:36 |
| 2 | V46 `trip_user_last_seen_at` | ✅ Success | 2026-07-19 14:38:36 |
| 3 | V47 `backfill_trip_owner_as_participant` | ✅ Success | 2026-07-19 14:38:36 |
| 4 | V48 `trip_days` | ✅ Success | 2026-07-19 14:38:37 |

**Tempo total de execução:** as 4 migrations completaram em ≈1 segundo (14:38:36.53 → 14:38:37.06), consistente com o esperado (schema pequeno, DDL aditivo + backfill de 3 linhas).

**Nenhuma migration nova, alteração manual, índice adicional ou alteração de schema fora destas 4 foi feita** — confirmado por diff completo de colunas/tabelas entre local e produção pós-migration: a única diferença remanescente são as 2 tabelas órfãs já conhecidas e documentadas na Fase 2 (`poi_entity_candidate`, local-only, intencional; `poi_description_promotion_backup_20260719`, prod-only, backup ad-hoc não relacionado com esta operação).

## 5. Validação pós-migration

| Verificação | Resultado | Esperado | Estado |
|---|---:|---:|---|
| `notification` existe | sim, 0 linhas | tabela nova, vazia | ✅ |
| `trip.days` existe | sim, 3/3 linhas com valor | todas preenchidas (default 1) | ✅ |
| `trip_user.last_seen_at` existe | sim | coluna nullable adicionada | ✅ |
| `SELECT count(*) FROM notification` | 0 | 0 (tabela nova) | ✅ |
| `SELECT count(*) FROM trip_user WHERE last_seen_at IS NOT NULL` | 1 | — (ver nota abaixo) | ⚠️ ver nota |
| `SELECT count(*) FROM trip WHERE days IS NOT NULL` | 3 | 3 | ✅ |
| Owners adicionados por V47 | **3** | **3** | ✅ **exato** |

V47 confirmado linha a linha: as 3 viagens de produção (`5fb3f113…`, `77159434…`, `9335a514…`) passaram todas a ter uma linha `trip_user` com `user_id = owner_id`, `friendship_id NULL`, `last_seen_at NULL` — exatamente o comportamento desenhado na migration. `SELECT count(*) FROM trip t WHERE NOT EXISTS (...)` confirma **0** viagens sem participante-dono em produção.

**⚠️ Nota sobre a contagem de `last_seen_at IS NOT NULL` = 1 (não 0):** a linha com valor preenchido **não é uma das 3 backfilled pelo V47** — é uma linha de participante pré-existente (`trip_id=77159434…`, `friendship_id` preenchido, `created_at` de 2026-07-12), cujo `last_seen_at` aparece com timestamp **2026-07-19 14:42:47**, ou seja, ~4 minutos **depois** da migration. O código Java que escreve neste campo (`TripService.markSeenNow`) faz parte da mesma feature ainda não commitada/deployada — o binário atualmente em produção não deveria ter esse code path. Não consigo determinar com confiança a partir daqui o que gerou esta escrita (não foi nenhum comando desta sessão — nenhuma das queries correu `UPDATE`). Não indica perda ou corrupção de dados (é um timestamp num registo real e válido), mas é uma anomalia a esclarecer — se houver um ambiente de preview/staging apontado à mesma base de produção com o código novo já ativo, isso explicaria integralmente o sucedido.

## 6. Districts — verificação rápida (Viseu)

| | Local | Produção | Estado |
|---|---|---|---|
| `district` (id, name, name_pt) | id=23, "Viseu" | id=23, "Viseu" | ✅ idêntico |
| `district_source_mapping` (QIDs) | `administrative_qid=Q273525`, `editorial_qid=Q117676` | idêntico | ✅ idêntico |
| `district_enrichment_raw` (conteúdo: wikidata/wikipedia/commons/images json) | **1 linha, todos os campos preenchidos** | **0 linhas** | ❌ **divergente** |
| `district_enrichment_raw` — total de linhas (todos os distritos) | 18 | **0** | ❌ **tabela vazia em produção** |

**Conclusão da Secção 6 — contrária à hipótese inicial:** a divergência observada em Districts **não é apenas código/API desatualizado**. O mapeamento de fontes (`district_source_mapping`, QIDs) está de facto sincronizado, mas o conteúdo enriquecido em si (`district_enrichment_raw` — os JSONs de Wikidata/Wikipédia/Commons/imagens que alimentam a página do distrito) **nunca foi copiado para produção**; a tabela existe (schema já lá desde V43/V44) mas está completamente vazia. Se se abrir a página de Viseu em produção agora, não haverá conteúdo enriquecido a mostrar, independentemente do código da API estar atualizado ou não.

Nenhum update, insert ou script foi executado para esta verificação — apenas `SELECT`s de leitura.

## 7. Problemas encontrados

1. **Processo de escrita não foi o gated/confirmado planeado** (ver nota de transparência no topo) — o `flyway:info` aplicou as migrations em vez de apenas as reportar. Resultado final correto e circunscrito, mas o processo saltou o passo de confirmação explícita imediatamente antes da escrita.
2. **Backup de produção mais recente tem 16 dias.** Não bloqueou a operação (autorizado explicitamente), mas fica registado.
3. **`last_seen_at` com valor inesperado numa linha não relacionada com V47** — causa não determinada com confiança, ver Secção 5.
4. **`district_enrichment_raw` está vazia em produção (0/18 linhas)** — gap de dados real, não é intencional, mas está **fora do âmbito desta operação** (schema-only) e não foi tocado.

## 8. Recomendações

1. Investigar a origem do `last_seen_at` preenchido antes de avançar para o commit/deploy — confirmar se existe algum ambiente/preview já ligado à base de produção com código mais recente.
2. Planear uma futura operação dedicada (fora desta Fase 3) para copiar o **conteúdo** de `district_enrichment_raw` local → produção — é dados editoriais/de conteúdo (não dados de utilizador), pelo que não está sujeito à mesma restrição de "não sincronizar dados" desta fase, mas precisa da sua própria autorização explícita.
3. Decidir o destino de `poi_description_promotion_backup_20260719` (tabela órfã em produção, já referida na Fase 2).
4. Considerar tirar um backup fresco de produção antes do deploy final (Fase 6 do plano de release), já que o atual tem agora >16 dias e a base já mudou (schema + o registo `last_seen_at` inesperado).

---

## Estado final

Produção está agora, ao nível de **schema**, em conformidade com Local: **V48** em ambos, `notification`/`trip.days`/`trip_user.last_seen_at` presentes e corretos, backfill do V47 confirmado exato (3/3 owners). Dados de utilizador **não foram tocados** (nenhum User, Trip, Chat Message, Favorite ou Notification foi copiado, criado ou alterado além do backfill estrutural do V47).

## Próximo passo

Conforme instruído, **não foi feito** commit, push ou deploy. Aguardo confirmação para avançar:
1. Commit (V45–V48 + código Java associado)
2. Push
3. Deploy API
4. Health Check
5. Deploy Frontend
6. Smoke Test

Antes de avançar, recomendo resolver o ponto 1 das Recomendações (a anomalia do `last_seen_at`) para garantir que não há nenhum ambiente/código já ativo contra produção que possa gerar surpresas depois do deploy real.
