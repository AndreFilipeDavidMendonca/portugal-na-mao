# Operation Beta Freeze — Fase 2 (Dados)

Plano de sincronização Local ↔ Produção para a **Portugal na Mão — Beta 1.0 (Stable)**.

Âmbito respeitado: análise 100% read-only. Nenhuma migration, insert, update, commit, push ou deploy foi executado. Todas as queries contra produção foram `SELECT` (schema introspection + `count(*)`).

---

## ⚠️ Achado mais importante (condiciona todo o plano)

**Local e Produção divergiram em dados gerados por utilizadores — isto NÃO é um simples "prod está atrasada".** Ver secção 3. A base local acumulou dados de teste (mais viagens, mais mensagens) que não existem em produção, e produção acumulou atividade real independente (mais utilizadores, mais favoritos, mais imagens) que não existe localmente. Uma sincronização de dados em qualquer direção nas tabelas de utilizador **causaria perda de dados**. O único conteúdo verdadeiramente sincronizado entre as duas bases é o conteúdo "editorial" (POIs, districts) — esse já está idêntico.

**Conclusão prática:** a Fase 2 (Dados) desta operação deve ser **apenas schema** (aplicar as 4 migrations pendentes). Não há inserts/updates de dados de utilizador a fazer local→prod nem prod→local.

---

## 1. Comparação de Schema

### 1.1 Migrations
- **Local:** 48 migrations aplicadas (V2–V48, `flyway_schema_history` limpo, sem falhas).
- **Produção:** 44 migrations aplicadas (V2–V44).
- **Pendentes:** `V45__create_notification_table.sql`, `V46__trip_user_last_seen_at.sql`, `V47__backfill_trip_owner_as_participant.sql`, `V48__trip_days.sql` — todas **não commitadas** (`git status` confirma `??` — untracked), correspondem à feature de Notificações + Trip Days ainda em desenvolvimento.
- **Duplicadas:** nenhuma.
- **Órfãs (ficheiro sem correspondência em histórico, ou vice-versa):** nenhuma nos dois lados — o histórico de cada BD corresponde exatamente aos ficheiros `V*` presentes até à sua versão mais recente.
- **Conflitos de numeração:** nenhum. Nota histórica: existe um registo `DELETE` para a versão 3 ("friendship") em ambas as bases, de 2026-03-25 — migration removida e reparada (`flyway repair`) há muito tempo, consistente nas duas bases, sem ação necessária.

### 1.2 Diferenças estruturais (para além do gap de migrations V45–V48)

| Objeto | Local | Produção | Origem |
|---|---|---|---|
| Tabela `notification` | existe | não existe | V45 pendente |
| Coluna `trip.days` | existe | não existe | V48 pendente |
| Coluna `trip_user.last_seen_at` | existe | não existe | V46 pendente |
| Tabela `poi_entity_candidate` | existe | não existe | **Não é Flyway** — staging table do pipeline Python de resolução de entidades (`common/candidate_store.py`), intencionalmente local-only (já documentado como "frozen for production" numa análise anterior). Nenhuma ação necessária. |
| Tabela `poi_description_promotion_backup_20260719` | não existe | existe | **Não é Flyway** — tabela de backup ad-hoc criada diretamente em produção hoje (2026-07-19), fora do fluxo de migrations. Provável salvaguarda manual antes de uma operação de promoção de descrições. **Recomendação:** confirmar se ainda é necessária; se não, remover manualmente (fora desta operação) ou formalizar como migration se for para persistir. |

Todas as restantes diferenças de `information_schema` (nomes de constraints `NOT NULL`) são **cosméticas**, causadas pela diferença de versão do PostgreSQL (ver 1.3) — não representam divergência de schema real.

### 1.3 Ambiente — divergência de versão (fora do âmbito do Flyway, mas relevante)

| | Local | Produção |
|---|---|---|
| PostgreSQL | 16.4 | **18.3** |
| PostGIS | 3.4.3 | 3.6.2 |
| Extensão `pgcrypto` | instalada (via V47) | **não instalada** |

O ambiente local (`docker-compose.yml`, imagem `postgis/postgis:16-3.4`) está 2 major versions atrás da produção. Não bloqueia esta sincronização, mas é uma divergência de infraestrutura a considerar — recomenda-se alinhar a imagem local à mesma major version do Render para eliminar esta fonte de "funciona local, falha em prod" (ou vice-versa) no futuro.

---

## 2 & 3. Comparação de Dados / Counts

| Entidade | Local | Produção | Diferença | Observações |
|---|---:|---:|---:|---|
| Users (`app_user`) | 8 | 12 | −4 | Prod tem mais utilizadores reais que local não tem |
| POIs (`poi`) | 21.475 | 21.475 | 0 | **Perfeitamente sincronizado** |
| Districts (`district`) | 18 | 18 | 0 | **Perfeitamente sincronizado** |
| Trips (`trip`) | 18 | 3 | +15 | Local tem 15 viagens de teste que não existem em prod |
| Trip Users (`trip_user`) | 22 | 3 | +19 | Consequente das viagens de teste locais |
| Chat Conversations (`chat_conversation`) | 3 | 3 | 0 | Coincidência de contagem — não implica serem as mesmas conversas |
| Chat Messages (`chat_message`) | 54 | 33 | +21 | Mensagens de teste local |
| Notifications (`notification`) | 14 | N/A | — | Tabela não existe em prod (V45 pendente) |
| Favorites (`favorite`) | 4 | 7 | −3 | Prod tem favoritos reais que local não tem |
| Comments (`poi_comment`) | 0 | 0 | 0 | Sem dados em nenhum dos lados |
| Events | N/A | N/A | — | **Não existe entidade/tabela "Event" no schema atual** — não aplicável a este projeto |
| Images (`media_item`) | 47.865 | 48.319 | −454 | Prod recebeu enriquecimento de imagens aplicado diretamente lá, não replicado para local |

**Contagens adicionais relevantes:**

| Entidade | Local | Produção |
|---|---:|---:|
| Friendship | 4 | 3 |
| Trip Message | 3 | 5 |
| Trip Saved POI | 23 | 2 |
| Trip Accommodation | 0 | 0 |
| Pending User Registration | 0 | 0 |
| **Trips sem `trip_user` do owner** (impacto do V47) | 0 (já corrigido) | **3 (todas as viagens de prod)** |

---

## 4. Migrations — Ordem, Dependências, Risco, Tempo

| # | Migration | Depende de | Tipo | Risco | Tempo estimado |
|---|---|---|---|---|---|
| 1 | V45 `create_notification_table` | — | DDL aditivo (nova tabela + 2 índices) | 🟢 LOW | < 1s |
| 2 | V46 `trip_user_last_seen_at` | — | DDL aditivo (coluna nullable) | 🟢 LOW | < 1s |
| 3 | V47 `backfill_trip_owner_as_participant` | V46 (usa `trip_user`), requer `CREATE EXTENSION pgcrypto` | DML (INSERT idempotente, guardado por `WHERE NOT EXISTS`) | 🟡 MEDIUM | < 1s (apenas 3 linhas afetadas em prod) |
| 4 | V48 `trip_days` | — | DDL aditivo (coluna `NOT NULL DEFAULT 1`) | 🟢 LOW | < 1s (PG 11+ não reescreve a tabela para defaults constantes; `trip` tem só 3 linhas em prod) |

**Ordem de execução:** V45 → V46 → V47 → V48 (ordem natural do Flyway, sem necessidade de reordenar — a única dependência real é V47 depois de V46, já respeitada pela numeração).

**Confirmações:**
- ✅ Zero conflitos de versão.
- ✅ Zero versões duplicadas.
- ✅ Zero problemas de rollback previsíveis — todas as 4 migrations são aditivas ou backfills idempotentes; nenhuma reescreve/apaga dados existentes. Rollback manual (se necessário) seria: `DROP TABLE notification`, `ALTER TABLE trip_user DROP COLUMN last_seen_at`, `DELETE FROM trip_user WHERE friendship_id IS NULL AND ...` (reverter backfill é possível mas exige cuidado para não apagar owners genuínos — recomenda-se não reverter V47 sem necessidade), `ALTER TABLE trip DROP COLUMN days`.
- ⚠️ **Verificar antes de aplicar V47:** confirmar que a role de BD usada em produção (`RENDER_PG_USER`) tem permissão para `CREATE EXTENSION pgcrypto`. Nas instâncias geridas do Render isto costuma ser permitido para o owner da BD, mas não foi testado nesta análise (seria uma operação de escrita, fora do âmbito read-only desta fase).

---

## 5. Plano de Release (proposto — nada disto foi executado)

| Fase | Ação | Pré-condição |
|---|---|---|
| 1. Migrations | Aplicar V45 → V46 → V47 → V48 em produção | Backup de produção recente confirmado |
| 2. Updates | **Nenhum** — não há updates de dados de utilizador a propagar (ver achado principal) | — |
| 3. Inserts | **Nenhum além do que V47 já faz** — não há inserts de dados de utilizador local→prod a propagar | — |
| 4. Commit | Commitar V45–V48 (atualmente untracked) + o código Java associado (Notification feature, trip days) já presente no working tree | Fase 1 validada em produção |
| 5. Push | Push do branch para o remoto | Fase 4 concluída |
| 6. Deploy API | Deploy do backend Spring Boot (Render executa as migrations automaticamente no arranque, ou correr manualmente antes se preferido) | Fase 5 concluída |
| 7. Deploy Frontend | Deploy do `PT-portugal-na-mao-fe` | Fase 6 validada (health check + smoke test dos endpoints de notificações/trips) |

Nenhuma destas fases foi executada — ficam aqui como sequência recomendada para quando o utilizador decidir avançar.

---

## 6. Riscos

| Alteração | Risco | Justificação |
|---|---|---|
| V45 — criar tabela `notification` | 🟢 LOW | Aditivo puro, sem dependências de dados existentes |
| V46 — coluna `trip_user.last_seen_at` | 🟢 LOW | Coluna nullable, sem default a calcular |
| V47 — backfill trip owners | 🟡 MEDIUM | É a única migration que escreve dados; idempotente e afeta só 3 linhas em prod, mas depende de `CREATE EXTENSION pgcrypto` ter permissões suficientes — validar antes |
| V48 — coluna `trip.days` | 🟢 LOW | Aditivo com default constante, tabela pequena (3 linhas) em prod |
| Divergência de versão PostgreSQL (16 vs 18) | 🟡 MEDIUM | Não bloqueia esta sincronização, mas é risco silencioso para o futuro — testar sempre contra uma versão de PG mais próxima da de produção |
| Tabela órfã `poi_description_promotion_backup_20260719` em prod | 🟢 LOW | Não interfere com a aplicação; apenas "sujidade" de schema não rastreada |
| Qualquer sincronização de dados de utilizador (trips/chat/users/favorites) entre local e prod | 🔴 HIGH | **Não recomendado** — as duas bases divergiram com dados reais/de teste próprios; qualquer sync bidirecional ou unidirecional causaria perda de dados genuínos de um dos lados |

---

## 7. Recomendações

1. **Aplicar apenas as 4 migrations de schema (V45–V48) a produção** — não copiar dados de utilizador em nenhuma direção.
2. Antes de aplicar V47, confirmar permissões de `CREATE EXTENSION` na role de produção (verificação rápida, não destrutiva).
3. Fazer backup de produção imediatamente antes da Fase 1, como já é prática habitual neste projeto (visto pelos relatórios `PROD_BACKUP_*` no histórico).
4. Decidir o destino da tabela órfã `poi_description_promotion_backup_20260719` em produção — confirmar se ainda é necessária antes de a remover.
5. Considerar alinhar a versão do PostgreSQL local (`docker-compose.yml`, atualmente `postgis/postgis:16-3.4`) com a versão de produção (PG 18.3) para reduzir divergência de ambiente.
6. Depois do deploy, correr novamente esta mesma comparação de counts para confirmar que V47 backfillou exatamente as 3 linhas esperadas em `trip_user` e que a contagem de `notification`/`trip.days` está coerente.
7. Não existe entidade "Events" neste schema — se for um requisito futuro da Beta 1.0, precisa de ser desenhado e planeado à parte (fora do âmbito desta sincronização).

---

## Ordem exata da operação (resumo executável, quando autorizado)

```
1. pg_dump de produção (backup de segurança)
2. Confirmar permissão CREATE EXTENSION na role de produção
3. flyway migrate (ou aplicar V45.sql → V46.sql → V47.sql → V48.sql manualmente, por esta ordem)
4. Validar: SELECT count(*) FROM notification; SELECT count(*) FROM trip_user WHERE last_seen_at IS NOT NULL; SELECT count(*) FROM trip WHERE days IS NOT NULL;
5. git add + commit dos 4 ficheiros de migration + código associado
6. git push
7. Deploy API (Render)
8. Health check da API
9. Deploy Frontend
10. Smoke test: login, abrir painel de notificações, abrir painel de viagens
```
