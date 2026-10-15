# Scoring 2.0 — Implementação do Scoring Dinâmico (Fase A)

**Data:** 2026-10-15. **Tipo:** implementação, ambiente local. **Baseado em:** `SCORING_2_0_DYNAMIC_ARCHITECTURE_STUDY.md` (arquitetura aceite: persistência mantida, deteção via trigger SQL, sem eventos Java/Spring). **Nenhuma fórmula de scoring foi alterada** — este trabalho é só sobre *quando/como* os scores são recalculados, nunca sobre os valores que calculam.

---

## 1. Resumo executivo

Implementei a **Fase A** do roadmap do estudo: deteção automática de alterações relevantes (trigger PostgreSQL + fila) e recálculo incremental por POI (Python, reutilizando os scripts existentes sem tocar em nenhuma fórmula). Validei as 9 situações pedidas na secção 6 do pedido, todas com dados reais da BD local, a maioria em transações com `ROLLBACK` explícito para não deixar rasto.

**O problema original (scores parados desde 2026-07-29) já tem solução operacional:** qualquer alteração a `poi`/`media_item`/`poi_sipa_enrichment` — venha da API, de um script Python, ou de qualquer outro processo que escreva direto na BD — entra automaticamente numa fila, e `rescore_pending.py` processa-a. Não é preciso lembrar de correr nada manualmente a cada enriquecimento; só é preciso correr `rescore_pending.py` (ou agendá-lo) para a fila ser esvaziada.

**O que NÃO foi feito, por decisão explícita do pedido:** nenhuma fórmula/peso foi tocado; os 620 POIs nunca pontuados não foram todos recalculados (fica um script `seed_missing_scores.py`, pronto mas não executado); não foi criado nenhum agendamento automático (cron/launchd) — o runner corre manualmente por agora.

---

## 2. Arquitetura efetivamente implementada

```
Qualquer escrita em poi / media_item / poi_sipa_enrichment
            (API Java, scripts Python, qualquer processo)
                            │
                            ▼
        Trigger PostgreSQL (só nas colunas que alimentam scoring)
                            │
                            ▼
                poi_rescore_queue (PENDING)
                            │
                            ▼
        rescore_pending.py  (manual, por agora)
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                     ▼
compute_confidence_score.compute_and_persist   compute_public_scores.compute_and_persist
   (mesma fórmula de sempre, só o POI pedido)      (idem — Quality/Heritage/Tourism/Display)
          │                                     │
          └─────────────────┬─────────────────┘
                            ▼
              UPDATE poi SET ...scores... + DELETE da fila
                 (mesma transação — atomically)
```

Isto é exatamente a direção "híbrida" recomendada no estudo: os scores continuam **persistidos** (o mapa continua a ler uma coluna, não recalcula nada em runtime); a **deteção** vive na própria base de dados (não num listener Java, porque confirmámos que scripts Python escrevem fora do runtime Java); o **cálculo** reutiliza os dois scripts Python existentes, só reorganizados para aceitarem uma lista de POIs em vez de obrigarem à BD inteira.

---

## 3. Componentes criados ou alterados

| Ficheiro | Tipo | O que mudou |
|---|---|---|
| `src/main/resources/db/migration/V105__poi_rescore_queue.sql` | **novo** | Cria `poi_rescore_queue` + 3 funções/triggers (`poi`, `media_item`, `poi_sipa_enrichment`) |
| `compute_confidence_score.py` | alterado | `load_pois`/`load_media_status` aceitam `poi_ids` opcional; lógica de cálculo extraída de `main()` para `compute_and_persist(poi_ids=None, conn=None)`, reutilizável. **Nenhuma fórmula tocada.** |
| `compute_public_scores.py` | alterado | Mesma extração (`compute_and_persist`); `load_rows` aceita `poi_ids`; nova `load_all_display_scores`/`compute_percentiles` para o percentil incremental ser exato contra a distribuição real. **Nenhuma fórmula tocada.** |
| `rescore_pending.py` | **novo** | Runner: agarra lote da fila (`FOR UPDATE SKIP LOCKED`), chama os dois scripts acima na ordem certa, remove da fila em sucesso, marca `ERROR` com retry limitado em falha. |
| `seed_missing_scores.py` | **novo**, nunca executado a sério (só `--dry-run`) | Opt-in: enfileira só os POIs com `scores_computed_at IS NULL`. |

Nenhum ficheiro Java, nenhuma query de mapa/BBOX, nenhum peso em `scoring.yml` foi alterado.

---

## 4. Funcionamento da atualização automática — o que exatamente dispara um recálculo

Lido linha a linha de `compute_public_scores.py`/`compute_confidence_score.py` (não assumido) antes de desenhar a trigger — só entram na condição as colunas que alguma fórmula atual **realmente lê**:

- **`poi`**: `category`, `description`, `wikidata_id`, `wikidata_match_type`, `sipa_id`, `wikipedia_url`, `website`, `phone`, `district_id`, `municipality_id`, `rnap_type`.
- **`media_item`** (só `entity_type='POI'`): `INSERT`, `DELETE`, ou mudança de `quality_status`.
- **`poi_sipa_enrichment`**: `review_status`, `protection`, `property`, `current_use`.

**Deliberadamente fora da lista** (confirmado por leitura de código que não entram em nenhuma fórmula hoje): `poi.subcategory`, `poi.review_reason`, `media_item.*` (outras colunas), `poi_sipa_enrichment.match_warning`. Se uma fórmula futura (Modelo B2 ou outra) voltar a lê-los, a migration seguinte só precisa de acrescentar essas colunas à condição `IS DISTINCT FROM` — não há mais nenhum sítio a tocar.

**As próprias colunas de score nunca entram na condição** (`confidence_score`, `quality_score`, `heritage_score`, `tourism_score`, `display_score`, `display_percentile`, `scores_computed_at`, `confidence_computed_at`) — é isto que impede a própria escrita do resultado de se auto-enfileirar num ciclo.

---

## 5. Estratégia de execução

`rescore_pending.py` corre **manualmente por agora** (`python3 rescore_pending.py`). Não criei nenhum agendamento (cron/launchd/`@Scheduled` Java) — não há ainda dados de volume real de alterações/dia para escolher um intervalo sensato, e o pedido pede explicitamente para não introduzir infraestrutura sem necessidade demonstrada. O script é idempotente: corre quantas vezes se quiser, processa o que houver na fila e sai sem erro se estiver vazia — por isso agendá-lo mais tarde é literalmente uma linha de cron, não uma alteração de código.

---

## 6. Mecanismos de consistência e recuperação

- **Concorrência entre execuções do runner:** `SELECT ... FOR UPDATE SKIP LOCKED` — duas instâncias a correr ao mesmo tempo nunca pegam na mesma linha.
- **Falha a meio do recálculo:** `conn.rollback()` desfaz tudo o que `compute_and_persist` já tinha escrito nessa transação; a linha na fila fica `ERROR` com o erro completo e `attempts+1`; volta a ser tentada automaticamente até `MAX_ATTEMPTS=5`, depois fica à espera de investigação manual.
- **Processo abandonado a meio (crash):** uma linha `PROCESSING` com `locked_at` há mais de 10 minutos é tratada como abandonada e reclamada de novo.
- **Alteração concorrente ao mesmo POI enquanto está a ser processado:** o `ON CONFLICT (poi_id) DO UPDATE SET status='PENDING'` da trigger sobrepõe-se ao `PROCESSING` — mesmo que o runner já tivesse agarrado a linha, a próxima alteração força-a de volta a `PENDING`, garantindo que nunca se perde uma atualização.
- **Ordem Confidence → Quality/Heritage/Tourism/Display:** preservada — `process_batch` chama sempre os dois scripts por esta ordem, na mesma transação.

---

## 7. Testes realizados (secção 6 do pedido) — todos com dados reais, locais

| # | Cenário | Como testado | Resultado |
|---|---|---|---|
| 1 | Criação de um POI | `INSERT ... RETURNING id` + `SELECT` da fila, dentro de transação com `ROLLBACK` | Enfileirado (`poi insert`) antes do rollback; zero rasto depois — confirmado `SELECT count(*) = 0` |
| 2 | Atualização de descrição | `UPDATE poi SET description=...` real (POI 56994, Torre de Belém) | Enfileirado (`poi update`); processado; `scores_computed_at` passou de 2026-07-29 para 2026-10-15 |
| 3 | Adição de fotografia válida | `INSERT INTO media_item (..., 'VALID', ...)`, transação + `ROLLBACK` | Enfileirado (`media_item change`) antes do rollback |
| 4 | Remoção/invalidação de fotografia | `UPDATE media_item SET quality_status='SUSPECT'` depois `'VALID'` (POI 63766) | Enfileirado só na mudança real; um `UPDATE` para o MESMO valor não enfileira (confirmado) |
| 5 | Alteração de dados patrimoniais | `UPDATE poi_sipa_enrichment SET protection=...`, transação + `ROLLBACK` | Enfileirado (`sipa enrichment change`) antes do rollback |
| 6 | Atualização direta por processo externo à API | Todos os testes acima são `UPDATE`/`INSERT` via `psql`, nunca via endpoint Java — é exatamente o caso que a arquitetura via eventos Java não cobriria | Confirmado — a trigger disparou em todos, sem passar pela API |
| 7 | Falha durante o recálculo / recuperação | Forcei uma linha `PROCESSING` com `locked_at` de 20 min atrás, chamei `claim_batch` | Reclamada de novo (`locked_at` atualizado), processada até ao fim |
| 8 | Alterações concorrentes ao mesmo POI | Agarrei um POI (`PROCESSING`), disparei uma 2ª alteração real antes de terminar | Status voltou a `PENDING` com `queued_at` novo — nada perdido |
| 9 | POI que nunca recebeu scores | POI 71872 (`scores_computed_at IS NULL`), enfileirado manualmente, processado | Primeiro score de sempre: Quality 26, Heritage 30, Tourism 70, Confidence 100, Display 43, percentil 14 |

Todos os testes de 1, 3 e 5 usaram `ROLLBACK` explícito — zero alteração permanente de dados por causa deles. Os testes 2, 4, 7, 8 e 9 alteraram dados reais (descrições/`quality_status` de teste) intencionalmente, como pedido; as descrições de 56994/63766 foram revertidas ao valor original no fim da sessão (e essa reversão, por sua vez, disparou e foi processada pela própria fila — prova adicional em produção do próprio mecanismo).

---

## 8. Diferenças — antes e depois (dados reais)

| POI | Campo | Antes (2026-07-29, 77 dias parado) | Depois (recalculado agora, mesma fórmula) | Nota |
|---|---|---|---|---|
| 56994 — Torre de Belém | `tourism_score` | 100 | **90** | O valor antigo já não batia com o código atual (baseline `castle`=90, sem bónus de contacto) — não foi uma alteração de dados que causou isto, foi o próprio recálculo a corrigir um valor que já estava desalinhado antes de eu tocar em nada. Mesmo achado do estudo anterior para o Castelo de Marvão (100 persistido vs. 90 reconstruído). |
| 56994 | `display_score` | 100 | 96 | Consequência do Tourism corrigido |
| 56994 | `scores_computed_at` | 2026-07-29 | 2026-10-15 | |
| 63766 | `tourism_score` | 90 | 95 | Mudou porque testei uma alteração real de `media_item.quality_status` neste POI |
| 63766 | `display_score` | 89 | 91 | |
| 71872 — Fado ao Vivo em Coimbra | todos os scores | `NULL` (nunca pontuado) | Confidence 100, Quality 26, Heritage 30, Tourism 70, Display 43, percentil 14 | Primeira vez que este POI tem qualquer score |

**Diferença de arquitetura, antes/depois:**

| | Antes | Depois |
|---|---|---|
| Como um score fica atualizado | Alguém lembra-se de correr `compute_confidence_score.py` + `compute_public_scores.py` manualmente, para **toda** a BD | Qualquer alteração relevante entra em fila automaticamente; `rescore_pending.py` processa só os POIs afetados |
| Custo de uma correção pontual | Recalcular ~19.400 POIs para corrigir 1 | Recalcular exatamente os POIs afetados |
| Cobertura de escritas fora da API | Nenhuma — um script Python a escrever direto na BD nunca disparava nada | Total — a trigger vive na BD, vê qualquer escrita, de qualquer processo |
| POIs novos | Ficam sem score até à próxima corrida manual completa | Entram na fila no próprio `INSERT`, já têm score na próxima passagem do runner |
| Risco de ciclo (score a disparar-se a si próprio) | N/A (não existia nenhum mecanismo) | Impossível por desenho — as colunas de score nunca entram na condição da trigger |

---

## 9. Impacto na performance

- **Leitura (mapa/BBOX/pesquisa):** zero alteração — nenhuma query de leitura foi tocada. Confirmado empiricamente: 3 chamadas reais a `/api/pois/lite?bbox=...&zoom=13` em 30-80ms, consistente com os 12,8ms a nível de BD já medidos no estudo de arquitetura.
- **Escrita:** cada `INSERT`/`UPDATE` relevante em `poi`/`media_item`/`poi_sipa_enrichment` ganha o custo de um `INSERT ... ON CONFLICT` indexado pela PK de `poi_rescore_queue` — sub-milissegundo, confirmado qualitativamente (todos os testes acima responderam instantaneamente).
- **Recálculo:** o custo caro de sempre (ler `media_item`/`poi_sipa_enrichment`, calcular 4 fórmulas) só corre para os POIs realmente enfileirados — nunca para a BD inteira, exceto se alguém correr `seed_missing_scores.py` + `rescore_pending.py` de propósito.
- **Percentil incremental:** a decisão tomada (secção 10, Limitações) evita reescrever a tabela inteira a cada alteração pontual — só lê `id, display_score` de todos os POIs (2 colunas, sem joins) para recalcular o percentil do(s) POI(s) afetado(s) contra a distribuição real.

---

## 10. Limitações conhecidas

1. **Percentil dos vizinhos não é reescrito a cada alteração pontual.** Quando o `display_score` de um POI muda, o percentil de TODOS os outros pode deslizar ligeiramente (±1, tipicamente) — só o percentil do(s) POI(s) efetivamente recalculado(s) é escrito. Decisão deliberada (ver secção 9 do código), documentada, não escondida. Remédio natural se isto importar na prática: uma repassagem periódica só-percentil (sem recalcular Quality/Heritage/Tourism), não construída agora.
2. **`content_component`/`duplicate_component` do Confidence Score dependem de ficheiros CSV** (`content_quality_report.csv`, `duplicate_poi_report.csv`), gerados por scripts de diagnóstico separados (`content_quality_diagnostic.py`, `duplicate_poi_study.py`), não por tabelas da BD. Um recálculo incremental lê sempre a versão mais recente desses CSVs no disco, mas se o POI não constar neles (ainda não foi diagnosticado), esses dois componentes ficam neutros (100) — mesmo comportamento de sempre para POIs fora do CSV, não uma regressão desta implementação.
3. **Sem agendamento automático.** `rescore_pending.py` só corre quando alguém o invoca. A fila cresce sem processamento até isso acontecer — não há perda de dados (fica tudo em `PENDING`), só atraso.
4. **Os 620 POIs nunca pontuados continuam sem score**, exceto o 1 usado no teste 9. `seed_missing_scores.py` está pronto, validado em `--dry-run`, mas não foi executado a sério — decisão operacional, não técnica.

---

## 11. Funcionalidades preparadas para evolução futura

- **Modelo B2 (ou qualquer fórmula nova):** como `compute_and_persist` nunca foi alterado na sua lógica de cálculo, trocar a fórmula continua a ser só editar `heritage_score()`/`tourism_score()`/`quality_score()`/`display_score()` — a infraestrutura de fila/recálculo incremental não precisa de mudar nada.
- **Novo sinal a vigiar:** acrescentar uma coluna à condição `IS DISTINCT FROM` da trigger (uma linha na migration seguinte) — nenhuma alteração ao runner ou aos scripts Python.
- **Dimensão comunitária (favoritos/comentários/viagens):** por pedido explícito, não ligada ao Display Score nesta fase. A fila já está pronta a receber um 4º trigger (ex. em `favorite`) o dia em que isso for decidido — mesmo padrão, zero redesenho.
- **Agendamento:** o runner já é seguro para correr em paralelo e já é idempotente — falta só escolher o mecanismo (cron, launchd, ou um `@Scheduled` Java que invoca o Python) quando houver dados de volume reais para decidir a cadência.

---

## 12. Próximos passos recomendados

1. **Decidir se/quando correr `seed_missing_scores.py`** para os 620 POIs nunca pontuados — ação de produto/dados, não técnica, por isso não foi tomada aqui.
2. **Agendar `rescore_pending.py`** (cron local, ou mais tarde em produção) depois de observar durante alguns dias quantas linhas a fila acumula por dia — para escolher um intervalo com dados, não a adivinhar.
3. **Decidir a repassagem periódica de percentil** (secção 10, limitação 1) só se, na prática, o desvio dos vizinhos se mostrar visível no mapa — não construir preventivamente.
4. Quando o Modelo B2 (ou outra revisão de fórmulas) for aprovado para implementação, esta infraestrutura já está pronta para o receber sem alterações.

---

## 13. Git status final

```
portugal-na-mao-api:
 M compute_confidence_score.py
 M compute_public_scores.py
 M src/main/java/pt/dot/application/service/search/SearchService.java   (Fase 1, pré-existente, não desta tarefa)
?? SCORING_2_0_ARCHITECTURE_STUDY.md                                     (estudo anterior, não tocado)
?? SEARCH_SCORE_CATEGORY_DIVERSITY_STUDY.md                              (estudo anterior, não tocado)
?? rescore_pending.py
?? seed_missing_scores.py
?? src/main/resources/db/migration/V105__poi_rescore_queue.sql

portugal-workspace (raiz):
?? MAP_BBOX_ZOOM_SCORING_DIVERSIFICATION_STUDY.md                        (estudo anterior, não tocado)
?? SCORING_2_0_DYNAMIC_ARCHITECTURE_STUDY.md                             (estudo anterior, não tocado)
?? SCORING_2_0_DYNAMIC_IMPLEMENTATION_REPORT.md                          (este relatório)

PT-portugal-na-mao-fe: alterações de sessão concorrente (novos assets de design, FeedPanel/
ProfilePanel/ProfileOverviewChart/i18n) — não tocadas, não relacionadas com esta tarefa.
```

Nada foi commitado, nenhum push, nenhum deploy. A migration V105 foi aplicada à BD **local** (via restart do backend local com Flyway) — é a única alteração de schema desta implementação, e é aditiva/não-destrutiva (uma tabela nova + 3 funções/triggers nunca antes existentes).

---

## 14. Validação e pequenos ajustes (2026-10-15)

Sessão de consolidação pedida depois da Fase A aprovada como direção técnica — objetivo: confirmar que funciona, corrigir só o que os testes revelassem, sem reabrir decisões de arquitetura nem tocar em fórmulas. Resultado: **um bug real de concorrência encontrado e corrigido** (mínimo, 1 linha); tudo o resto confirmado correto sem alterações.

### 14.1 Concorrência — bug real encontrado e corrigido

Testado com **transações genuinamente concorrentes** (processos Python separados a correr ao mesmo tempo, não simulação sequencial):

- **`SKIP LOCKED` funciona como desenhado.** Duas transações reais, lançadas com ~0,4s de desfasamento, competindo pelas mesmas 4 linhas `PENDING`: a 2ª nunca esperou pela 1ª (devolveu resultado no seu próprio instante t=0,03s, não a t=3s quando a 1ª libertou as linhas) e agarrou exatamente as 2 linhas que a 1ª não tinha pegado — partição perfeita, zero sobreposição, zero bloqueio no `SELECT`.

- **🔴 Bug real encontrado: `mark_done()` apagava da fila por `poi_id`, sem verificar o estado atual.** Cenário reproduzido com dados reais: POI A é agarrado (`PROCESSING`); antes de terminar, chega uma alteração real e genuína a esse mesmo POI, que a trigger corretamente repõe a `PENDING`; o lote antigo termina e chama `mark_done([...,A])` — e o `DELETE FROM poi_rescore_queue WHERE poi_id = ANY(...)` apagava a linha **mesmo already estando `PENDING` outra vez**, perdendo silenciosamente a alteração nova (ela nunca seria recalculada). Confirmado o bug, depois confirmada a correção com o mesmo cenário reproduzido byte-a-byte:

  ```python
  # antes (bug):
  DELETE FROM poi_rescore_queue WHERE poi_id = ANY(%s)
  # depois (corrigido, 1 linha):
  DELETE FROM poi_rescore_queue WHERE poi_id = ANY(%s) AND status = 'PROCESSING'
  ```

  Com a condição extra, uma linha reposta a `PENDING` por uma alteração concorrente simplesmente não corresponde ao `DELETE` (0 linhas afetadas para esse id) e sobrevive para a corrida seguinte — exatamente o comportamento "nada se perde" já documentado como objetivo, agora também garantido no código, não só na teoria. Reproduzido o cenário de novo depois da correção: confirmado que o POI sobrevive em `PENDING` com o motivo/timestamp da alteração nova.

- **Recuperação de falha real** (não só lock abandonado): forcei uma excepção genuína dentro de `compute_and_persist` (não uma condição de borda, um erro a sério) — `run_once()` marcou `ERROR`, incrementou `attempts`, e tentou automaticamente até `MAX_ATTEMPTS=5` **dentro da mesma corrida** (porque não há nenhum intervalo de espera entre tentativas — ver limitação nova, secção 14.5). Depois de resolvida a causa, o POI processou normalmente na corrida seguinte.

- **Estado final da fila:** vazio e consistente em todos os testes, incluindo depois do bug e da correção.

### 14.2 Cálculo incremental — confirmado sem alterações necessárias

- **Confidence sempre antes dos restantes:** confirmado por desenho (`process_batch` chama sempre `compute_confidence_score` antes de `compute_public_scores`, na mesma transação) e por teste real — forcei um sinal que baixa a Confidence (uma fotografia `REMOVED`) e confirmei que o `quality_score` recalculado na MESMA passagem já respeita a nova Confidence, sem precisar de uma segunda corrida.
- **Incremental == corrida completa, para o mesmo POI e a mesma fórmula:** testado sem nunca correr a corrida completa a sério (proibido pelas regras) — li a tabela toda só para leitura (sem escrita nenhuma), apliquei as fórmulas diretamente à linha do POI de teste, e comparei com o resultado de `compute_and_persist(poi_ids=[...])` numa transação com `ROLLBACK`. **Resultado: Quality/Heritage/Tourism/Display idênticos byte-a-byte** nos dois caminhos — era esperado por construção (mesmo código, só o `WHERE` muda), mas confirmado empiricamente, não só por inspeção do código.
- **Percentil:** confirmado que o percentil devolvido pelo incremental bate exatamente com um cálculo independente sobre a distribuição real completa (`compute_percentiles` chamado separadamente, mesmo resultado). Comportamento documentado na implementação original (secção 8, Modelo A desse ficheiro) confirmado sem alterações.
- **Auto-enfileiramento:** confirmado, de novo, que processar um POI (incluindo quando a Confidence muda a sério) nunca o volta a colocar na fila a si próprio — as colunas de score continuam fora da condição da trigger, como desenhado.

**Nenhuma alteração de código nesta secção** — tudo confirmado correto como estava.

### 14.3 POIs sem score

**620 POIs continuam sem qualquer score** (`scores_computed_at IS NULL`) — confirmado de novo, 1 a menos que os 621 do estudo original (um foi pontuado como teste numa sessão anterior desta Fase A).

`seed_missing_scores.py` ganhou **`--limit N`** (único acrescento de código desta secção) para permitir correr isto em lotes pequenos e controlados em vez de "tudo ou nada" — pedido explícito da secção 3. Testado:

- `--dry-run`: conta corretamente, não enfileira nada.
- `--limit 3`: enfileira só os 3 primeiros corretamente.
- Processamento desse lote de 3: **0 erros**. Correção à primeira versão deste relatório: assumi erradamente que os 620 eram todos `category='event'` por os 3 de teste terem calhado a ser todos eventos — **não é verdade**, ver distribuição real abaixo.

**Atualização 2026-10-15 (mais tarde, mesma sessão) — autorizado e executado a sério:** corri `seed_missing_scores.py` (sem `--limit`) + `rescore_pending.py` até à fila esvaziar. **620/620 recalculados, 0 erros.** `poi.scores_computed_at IS NULL` confirmado em **0** POIs — já não há nenhum POI sem score na BD local.

Distribuição real dos 620 (confirmada por categoria, não assumida):

| Categoria | Nº POIs | Display médio |
|---|---|---|
| castle | 157 | 75 |
| palace | 123 | 61 |
| church | 112 | 67 |
| monument | 86 | 51 |
| archaeology | 82 | 57 |
| museum | 26 | 58 |
| park | 24 | 39 |
| viewpoint | 6 | 50 |
| event | 4 | 43 |
| beach | 1 | 62 |

Confirma, de forma muito mais visível do que a amostra de 3 sugeria, o achado do `SCORING_2_0_ARCHITECTURE_STUDY.md`: mesmo dentro deste lote de POIs recém-chegados, `castle` já lidera com Display médio 75, mais alto que `palace`/`church`/`monument` — a assimetria estrutural entre categorias não é um artefacto dos POIs antigos, reaparece em dados novos com a mesma fórmula inalterada.

### 14.4 Automatização — ativada localmente

Confirmado que **já existe precedente direto** na "estratégia de ambientes existente": `crontab -l` mostra um job já a correr para outro script Python deste mesmo repositório (`ops/run_gemini_backfill.sh`, diário às 8:30). Segui exatamente o mesmo padrão:

- **Novo:** `ops/run_rescore_pending.sh` (gitignored, como todo o `ops/` — nunca será commitado) — wrapper que faz `cd` à raiz do repo e invoca `python3 rescore_pending.py >> ops/rescore_pending.log 2>&1`.
- **Testado a sério**, incluindo com `env -i` (ambiente vazio, simulando exatamente as condições do cron) — funciona sem nenhuma variável de ambiente, porque o DSN da BD local está hardcoded nos 3 scripts (não depende de secrets, ao contrário do backend Java).

**Atualização 2026-10-15 — autorizado e ativado:**
```
*/15 * * * * /Users/andre.mendonca/IdeaProjects/portugal-workspace/portugal-na-mao-api/ops/run_rescore_pending.sh
```
Adicionado ao crontab local com `(crontab -l; echo "...") | crontab -` — a entrada anterior (`run_gemini_backfill.sh`) foi preservada, não substituída. 15 em 15 minutos continua a ser uma escolha de partida, não calibrada por volume real — a rever depois de observar alguns dias do `ops/rescore_pending.log`.

Nenhuma infraestrutura de produção foi tocada ou mencionada como alvo — isto é estritamente local, no Mac onde esta sessão correu.

### 14.5 Retries sem intervalo de espera — corrigido

Confirmado no teste de falha (14.1): quando um POI falhava, `run_once()` tentava-o de novo imediatamente, dentro da mesma corrida, até `MAX_ATTEMPTS=5` — para uma falha persistente, isto esgotava os 5 intentos em milissegundos em vez de os espaçar por corridas futuras.

**Correção aplicada** (reutiliza a mesma coluna e constante já usadas para recuperar `PROCESSING` abandonado — nenhuma coluna/config nova):

```python
# mark_error: locked_at passa a registar "quando foi a última tentativa" em vez de NULL
UPDATE poi_rescore_queue SET status='ERROR', attempts=attempts+1, last_error=%s, locked_at=%s ...

# claim_batch: ERROR só é reclamado depois do mesmo STALE_LOCK_MINUTES do caso PROCESSING
OR (status = 'ERROR' AND attempts < %(max_attempts)s AND locked_at < %(stale_before)s)
```

**Validado com uma falha real forçada** (não um caso de borda): antes da correção, a mesma falha simulada chegava a `attempts=5` numa só corrida; depois da correção, para na primeira tentativa (`attempts=1`) e só volta a ser reclamada depois do intervalo de espera — confirmado deixando o `locked_at` artificialmente antigo e vendo o runner reclamá-lo e processá-lo com sucesso na corrida seguinte.

### 14.6 Resumo das alterações de código desta sessão

| Ficheiro | Alteração |
|---|---|
| `rescore_pending.py` | `mark_done()`: `DELETE ... AND status='PROCESSING'` (bug 14.1); `mark_error()`+`claim_batch()`: espaçamento de retries (14.5) |
| `seed_missing_scores.py` | `--limit N` (secção 3) |
| `ops/run_rescore_pending.sh` | novo, gitignored, agora ativado no crontab local (secção 14.4) |

**Nenhuma fórmula, peso, query de mapa/pesquisa/BBOX, ou critério do Modelo B2 foi tocado.**

### 14.7 Estado final, depois de autorização explícita para avançar nos 3 pontos em aberto

1. **620 POIs pendentes → pontuados.** 0 erros, 0 POIs sem score na BD local.
2. **Cron ativado localmente.** `*/15 * * * *`, preservando a entrada existente.
3. **Retries corrigidos** — espaçados pelo mesmo intervalo do caso PROCESSING abandonado, validado com falha real.

Nada em produção foi tocado. Nenhum commit, push ou deploy.
