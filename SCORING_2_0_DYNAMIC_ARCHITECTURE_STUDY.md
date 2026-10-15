# Scoring 2.0 — Reavaliação Estratégica da Arquitetura (Scoring Dinâmico)

**Data:** 2026-10-14. **Tipo:** estudo de arquitetura, read-only. **Nenhum código, dado, migration ou dependência foi alterado.**

**Legenda:** 🔵 FACTO CONFIRMADO (lido no código/BD nesta sessão) · 🟡 HIPÓTESE (inferência razoável, não totalmente verificada) · 🟢 SIMULAÇÃO (calculado neste estudo, nunca persistido) · 🔴 RECOMENDAÇÃO (proposta, não implementada).

**Relação com os outros dois estudos desta sessão:** este documento NÃO substitui nem interrompe `SCORING_2_0_ARCHITECTURE_STUDY.md` (o estudo das fórmulas/pesos, "Modelo B2" e afins) — trata de uma pergunta ortogonal: *quando* e *como* os scores são (re)calculados, não que fórmula usam. As duas decisões podem avançar em paralelo.

---

## 1. Resumo executivo

🔵 O sistema atual é **100% estático e manual**: `compute_confidence_score.py` + `compute_public_scores.py` correm uma vez, gravam 5 colunas em `poi`, e nada mais os reexecuta. Confirmado nesta sessão, independentemente do estudo anterior: `poi.scores_computed_at` tem **uma única data em toda a BD, 2026-07-29**, e **621 POIs nunca foram pontuados** (`scores_computed_at IS NULL`) em 19.409 POIs totais.

🔵 **Achado central deste estudo:** a causa da desatualização não é só "ninguém reexecutou o script". É estrutural — **pelo menos 8 scripts Python escrevem diretamente em `poi` fora do runtime Java** (`poi_fields_production_sync.py`, `trail_production_sync.py`, `municipality_id_production_sync.py`, `production_sync_final_apply.py`, `locality_production_data_sync.py`, `nature_enrichment_runner.py`, `wrong_shared_qid_resolver.py`, `poi_duplicate_cleanup.py`), e **nenhum mecanismo de evento existe hoje em todo o código Java** (confirmado: zero `@EventListener`, zero `ApplicationEventPublisher`, zero outbox table, zero trigger SQL de dados — só dois `@Scheduled` já existentes para outras funcionalidades e as triggers internas de foreign-key do Postgres). Qualquer arquitetura baseada só em eventos do backend Spring **nunca vai ver** estas escritas. Isto, por si, invalida qualquer proposta de "Fase A" que assuma que os eventos da API chegam a todos os sítios.

🔵 Pior ainda: mesmo dentro desses 8 scripts, **2 não atualizam `poi.updated_at`** quando escrevem (`locality_production_data_sync.py`, `wrong_shared_qid_resolver.py`) — ou seja, nem o sinal de "staleness" mais barato possível (`updated_at > scores_computed_at`) é hoje fiável em 100% dos casos, sem corrigir esses scripts um a um.

🔵 **Os sinais comunitários existem mas têm volume residual**, confirmado nesta sessão por contagem real: `favorite`=22, `trip`=27, `trip_saved_poi`=121, `feed_post`=13, `feed_comment`=1, `feed_post_like`=2, `poi_comment`=1, `trip_poi_event`=771 (visitas reais durante o Tour Guiado — o sinal com mais volume, de longe). Nenhum destes é hoje lido por nenhum eixo de scoring.

🔴 **Recomendação em uma frase:** nem tempo-real (demasiado caro para o mapa) nem o status quo (fica sempre desatualizado) — um modelo **híbrido materializado com deteção de staleness ao nível da base de dados** (não ao nível da aplicação), porque é o único ponto por onde passam TODAS as escritas, incluindo as dos scripts Python. Ver secção 13.

---

## 2. Diagnóstico do scoring atual

🔵 Fluxo real, confirmado por leitura de `compute_confidence_score.py`/`compute_public_scores.py`:

```
operador corre manualmente, por esta ordem obrigatória:
  1. compute_confidence_score.py   → escreve confidence_score, confidence_flags, confidence_computed_at
  2. compute_public_scores.py      → lê confidence_score (teto do Quality), escreve
                                      quality_score, heritage_score, tourism_score,
                                      display_score, display_percentile, scores_computed_at
```

🔵 `compute_public_scores.py::load_rows()` faz, por POI, 2 subqueries correlacionadas contra `media_item` (contagem de imagens VALID + existência de REMOVED) — aceitável num batch job que corre uma vez sobre toda a tabela, mas é exatamente o tipo de custo que um cálculo "por pedido" multiplicaria por centena de POIs visíveis no mapa (ver secção 8).

🔵 Nada neste fluxo é acionado por nada — é sempre um operador humano a decidir correr os dois scripts. Não há cron, não há hook de deploy, não há trigger.

🔵 `display_score`/`display_percentile` são lidos diretamente por `PoiService.toBaseDto` (cache pura, nunca recalculado em runtime — confirmado no estudo B2 e reconfirmado aqui por leitura do mesmo código) e pela query de bbox do mapa (`PoiRepository`/`DistrictPoiQueryService`).

---

## 3. Limitações da arquitetura estática

1. **Staleness sem deteção:** não existe nenhuma coluna, view ou alerta que diga "este POI tem dados mais recentes do que o seu score" — descobri isto só correndo `SELECT` manuais nesta sessão (e nas duas anteriores). Ninguém no sistema sabe disto automaticamente hoje.
2. **Staleness sem reconciliação:** mesmo que alguém notasse, a única ação possível é recorrer o pipeline inteiro (`main()` em `compute_public_scores.py` processa todos os POIs, não há modo incremental).
3. **Acoplamento a uma única ordem manual:** `compute_public_scores.py` recusa-se a correr sem `confidence_score` já preenchido (guard explícito no código) — correto para consistência, mas significa que qualquer futura automação tem de respeitar esta mesma ordem de dependência, não só "disparar os dois scripts em paralelo quando algo muda".
4. **Invisibilidade para quem escreve dados:** quem corre `nature_enrichment_runner.py` hoje não tem nenhuma pista de que acabou de tornar `display_score` desse POI obsoleto.
5. **Sem versionamento de fórmula:** `scores_computed_at` diz *quando*, nunca *com que versão da fórmula*. Se o Modelo B2 (ou A/C) for adotado, não há forma de distinguir "score antigo, fórmula antiga" de "score antigo, fórmula nova mas por calcular" sem adicionar isso agora.

---

## 4. Inventário da infraestrutura existente

| Peça | Estado confirmado |
|---|---|
| `@Scheduled` jobs | 2 existem: `PendingUserRegistrationCleanupJob`, `CalendarReminderJob` (secção calendar, V101) — convenção já estabelecida: sweep periódico + um "catch-up" ao arrancar, para não perder execuções por reinícios. **Reutilizável como padrão**, não inventar um mecanismo novo. |
| `@EventListener`/`ApplicationEventPublisher` | 🔵 Zero ocorrências em todo `src/main/java`. |
| Outbox table / CDC | 🔵 Não existe. |
| Triggers SQL em `poi` | 🔵 Só as triggers internas de FK do Postgres (`RI_ConstraintTrigger_*`) — nenhuma trigger de dados/aplicação. |
| `poi.updated_at` | 🔵 Existe, `NOT NULL`. Mantido por **6 de 8** scripts identificados; **2 não o mantêm** (ver secção 1). Não há trigger `BEFORE UPDATE` a garanti-lo — depende de cada script "lembrar-se". |
| `media_item` | 🔵 Tem `created_at`, **não tem `updated_at`**. `quality_status` (VALID/SUSPECT/REMOVED/HIDDEN) é o campo que a Quality lê via subquery — uma alteração aqui só chega a `poi.updated_at` se o script que a fez também tocar explicitamente em `poi` (confirmado que `nature_enrichment_runner.py` faz isso para `images_status`, mas não é garantido para todo o caminho de escrita de media). |
| Favoritos/Comunidade | `favorite`=22, `trip`=27, `trip_saved_poi`=121, `feed_post`=13, `feed_comment`=1, `feed_post_like`=2, `poi_comment`=1, `trip_poi_event`=771 (contagens reais, 2026-10-14). |
| `PoiScoring.java` | Vazio, isolado deliberadamente (confirmado no estudo anterior) — ponto de extensão já preparado para perfis de ranking, não para atualização dinâmica em si. |
| `scoring.yml` | Config centralizada, lida por Java (`ScoringProperties`, subconjunto) e Python (`scoring_config.py`, tudo). Qualquer mecanismo de versionamento de fórmula teria de viver aqui ou ao lado. |
| Performance real de bbox | 🔵 Medido nesta sessão (`EXPLAIN ANALYZE`, região de Évora, ~450 POIs candidatos, limit 300): **12,8ms** de execução, usando `idx_poi_publication_status` + `idx_poi_lat_lon`, ordenando por `display_score` já materializado. |

---

## 5. Comparação das arquiteturas possíveis

### A. Tempo real

🔴 **Desaconselhado para o caminho do mapa.** A query medida na secção 4 já lê uma coluna pré-computada em 12,8ms; recalcular `quality_score` em tempo real repetiria, por cada um dos até ~450-800 POIs candidatos por viewport (ver limites de `DistrictPoiQueryService`, secção 2 do estudo anterior), as 2 subqueries correlacionadas contra `media_item` (49.855 linhas) que hoje só correm uma vez em lote. Isto não escala com utilizadores concorrentes a mover o mapa — cada pan/zoom dispararia centenas de subqueries por pedido, multiplicadas pelo número de utilizadores simultâneos.
- Vantagem real: zero staleness, por definição.
- Seria viável **só** para pontos de leitura de baixo volume e sem restrição de latência (ex. uma página de detalhe de 1 POI, não uma lista de centenas) — mas mesmo aí, duplicaria lógica que já existe e está testada em Python.

### B. Materializado com atualização automática

🔴 **Base da recomendação.** Mantém a leitura do mapa exatamente como está hoje (rápida, já medida). A diferença para o sistema atual é SÓ no mecanismo de "quando recalcular" — passa de "nunca, a menos que um humano se lembre" para "automaticamente, pouco depois de uma alteração relevante".
- Precisa de: (1) deteção de que algo mudou, (2) uma fila/lista de "por rever", (3) um processo que a esvazia.
- Risco principal: se a deteção (1) for feita só ao nível da aplicação Java, fica tão incompleta quanto hoje (ver secção 1) — tem de ser ao nível da BD.

### C. Híbrido (persistido + dinâmico + cache)

🔴 **Variante escolhida, ver secção 13.** Divide os 3 eixos atuais por "velocidade de mudança esperada": Heritage/Tourism (dimensão A da secção 6, "valor intrínseco") mudam raramente — reclassificação SIPA, correção de categoria; Quality (dimensão B, "qualidade da informação") muda sempre que há enriquecimento — é o eixo mais frequentemente desatualizado hoje; Comunidade (dimensão C) muda constantemente mas em volume ainda baixo. Os três continuam **persistidos** (a leitura do mapa não pode depender de cálculo síncrono), mas com latências de atualização diferentes e aceitáveis para cada um.

### D. Outras alternativas consideradas

- **Materialized view do Postgres com `REFRESH ... CONCURRENTLY`:** resolveria a leitura, mas o "quando fazer refresh" tem exatamente o mesmo problema de deteção de staleness que a opção B — não é uma alternativa à pergunta central, é só outro sítio para guardar o resultado. 🟡 Não traz vantagem clara sobre colunas na própria `poi` dado que já há índices dedicados.
- **Denormalização total num documento (ex. Elasticsearch/similar):** resolveria pesquisa full-text melhor que hoje, mas introduz um novo serviço a manter sincronizado — contraria explicitamente a regra da secção 7 do pedido ("não introduzir filas, workers ou novos serviços sem demonstrar necessidade"). 🔴 Não recomendado nesta fase.
- **Trigger SQL que chama a fórmula completa em PL/pgSQL:** tecnicamente possível, mas duplicaria a lógica de `compute_public_scores.py` numa segunda linguagem/sítio — contraria a lição já aprendida e documentada no estudo B2 original ("Python e Java já partilharam esta doença uma vez"). 🔴 Não recomendado — ver secção 13 para a alternativa que evita isto.

---

## 6. Modelo conceptual de scoring dinâmico (3 dimensões)

🟡 As 3 dimensões pedidas (Valor Intrínseco / Qualidade & Atualização da Informação / Interesse da Comunidade) mapeiam de forma quase direta para o sistema atual, o que é uma vantagem prática — não exige reinventar os eixos, só mudar a cadência:

| Dimensão pedida | Eixo(s) atual(is) mais próximo(s) | Frequência de mudança esperada |
|---|---|---|
| A. Valor intrínseco | Heritage + Tourism | Baixa — muda com reclassificação patrimonial/ambiental, correção de categoria |
| B. Qualidade da informação | Quality | Média/alta — muda a cada foto/descrição nova |
| C. Interesse da comunidade | **Não existe hoje** — novo eixo | Alta em volume de eventos, baixa em volume absoluto de dados (secção 4) |

🔴 Recomendação: **não criar um 4º score público agora.** Expor C como um sinal interno/visível separadamente (ex. "N viajantes guardaram este local"), nunca fundido no `display_score` enquanto o volume for o atual (22-771 registos totais, a nível nacional, contra 19.409 POIs) — fundir agora significaria que um único favorito desequilibraria um POI face a outro sem nenhum, puro ruído estatístico. Ver secção 7 para o mecanismo de proteção.

---

## 7. Integração com comunidade e social

🔵 Tabelas confirmadas e volumes reais (2026-10-14): ver secção 4. `trip_poi_event` (771, tipos `OFFICIAL`/`MEMORY` — confirmado no enum `TripPoiEventType`) representa uma **visita real durante um Tour Guiado**, não uma intenção — é o sinal comunitário mais forte disponível hoje, muito acima de favoritos (22) em volume e em qualidade de sinal (um favorito é 1 clique; um `trip_poi_event` implica o utilizador ter estado fisicamente numa sessão de tour ativa nesse POI).

🟢 Simulação (dados reais, não hipotéticos): os POIs com mais `trip_saved_poi` na BD local não são os de maior `display_score` — são `Açude do Vale da Torre` (lake, display=48, 5 saves) e `Albufeira de Castelo do Bode` (lake, display=50, 5 saves), ambos muito abaixo da média. Isto já demonstra, com dados reais e não um exemplo inventado, que a comunidade pode apontar para sítios que a fórmula atual subvaloriza — exatamente o argumento a favor de ter o eixo C, desde que não domine o resultado.

🔴 **Proteções contra manipulação (recomendação, não implementadas):**
- Um utilizador = um voto por POI por tipo de interação (já é estruturalmente garantido por `trip_saved_poi`/`favorite` serem tabelas de associação com chave única utilizador+POI — confirmar isto no schema antes de implementar, não assumido aqui).
- Retorno decrescente/logarítmico, nunca linear — 100 saves não deve valer 100× mais que 1 save.
- Piso de volume mínimo antes do sinal contar sequer (ex. <5 interações a nível nacional = eixo C fica a 0/neutro para todos, exatamente a situação atual).
- Nunca usar C para GATE de elegibilidade de "Principais" — só para desempate dentro do que já é elegível pelos outros eixos. Isto cumpre literalmente o pedido ("interesse comunitário não deve substituir o valor intrínseco").
- Fotografias: já são lidas pela Quality via `media_item` — não voltar a contá-las em C só porque vieram de um utilizador, conforme o aviso explícito do pedido ("não deve contar simultaneamente").

---

## 8. Estratégia de atualização automática

🔴 Recomendação central: **o gatilho vive na base de dados (trigger), não na aplicação Java.** É a única camada por onde passam as escritas da API, dos 8 scripts Python, e de qualquer processo futuro do PT Operations.

Mecanismo proposto (não implementado):
```
1. Nova coluna poi.scores_dirty_at (timestamp, nullable).
2. Trigger AFTER UPDATE/INSERT em `poi`:
     SET scores_dirty_at = now() se qualquer coluna relevante mudou
     (category, subcategory, description, wikidata_id, images_status, ...)
3. Trigger AFTER INSERT/UPDATE em `media_item`:
     SET poi.scores_dirty_at = now() WHERE poi.id = NEW.entity_id AND NEW.entity_type='POI'
     (cobre o caminho que hoje só é coberto se o script também tocar poi.images_status)
4. @Scheduled (mesmo padrão de PendingUserRegistrationCleanupJob) corre periodicamente,
   invoca compute_confidence_score.py + compute_public_scores.py SÓ para os POIs com
   scores_dirty_at mais recente que scores_computed_at, limpa scores_dirty_at ao terminar.
```
Isto não introduz fila nova nem serviço novo — reusa o padrão `@Scheduled` já existente, só adiciona 1 coluna + 2 triggers finas (que só marcam um timestamp, não recalculam nada dentro do Postgres — evita a duplicação de lógica mencionada na secção 5.D).

🟡 Cadência do scheduled job: dado o volume de escrita atual (enriquecimento é feito em sessões pontuais, não contínuas), de hora a hora é provavelmente suficiente — muito mais frequente do que os 77 dias atuais, sem custo de infraestrutura nova.

---

## 9. Estratégia de persistência/cache

🔵 Confirmado: 100% dos consumidores atuais (`PoiService.toBaseDto`, query de bbox, `display_percentile`) já leem colunas persistidas, nunca recalculam. **Esta parte não precisa de mudar.** A recomendação da secção 8 preserva isto integralmente — só muda a frequência de escrita, não o padrão de leitura.

🔴 Acrescentar, sem mexer no resto: `scores_formula_version` (string/int) ao lado de `scores_computed_at`, gravado pelos próprios scripts Python a cada corrida — resolve a limitação 5 da secção 3 (distinguir "desatualizado" de "fórmula diferente") a custo de uma coluna.

---

## 10. Impacto na performance

🔵 Baseline real medido: 12,8ms para a query de bbox sobre ~450 candidatos. A proposta da secção 8 não toca nesta query — o trigger só escreve 1 timestamp numa tabela já indexada, e o job de recálculo corre fora do caminho de pedidos do utilizador (background, não bloqueia nenhum pedido ao mapa). Custo adicional ao mapa: **zero**, por desenho.

🟡 Custo do job de recálculo em si: hoje o pipeline completo sobre 19.409 POIs não foi cronometrado nesta sessão (seria preciso correr o script, fora do âmbito read-only deste estudo) — mas como o job passa a correr só sobre POIs *dirty* (tipicamente uma fração pequena, não os 19.409), o custo por execução deve ser proporcionalmente menor do que uma corrida completa. Assinalado como estimativa, não medido.

---

## 11. Compatibilidade com o Modelo B2

🔵 Por desenho: a arquitetura da secção 8 é agnóstica à fórmula. `compute_public_scores.py` pode mudar de pesos/baselines (Modelo A/B/C do estudo anterior) sem que nada na deteção de staleness/trigger precise de mudar — são as "3 camadas" pedidas na secção 10 do pedido (avaliação / atualização / apresentação) já desacopladas por construção.

🔴 Recomendação de sequenciamento: implementar primeiro a Fase A deste estudo (deteção de staleness) com a fórmula ATUAL, sem esperar pela decisão do Modelo B2 — resolve já o problema dos 77 dias/621 POIs sem depender de nenhuma decisão de fórmula. Quando o B2 for decidido, é só uma alteração dentro de `compute_public_scores.py`, que o mecanismo de atualização já dispara automaticamente a partir daí.

---

## 12. Simulações com dados reais

🔵 Dados reais, mesma sessão, POIs nomeados no pedido (verificados na BD, sem substituições):

| ID | Nome | Categoria | Atual (Quality/Heritage/Tourism/Confidence/Display) | Favoritos | Trip saves |
|---|---|---|---|---|---|
| 49707 | Castelo de Marvão | castle | 70/100/100/60/**94** | 0 | 0 |
| 66426 | Castelo dos Mouros (Sintra) | castle | 74/100/100/100/**95** | 0 | 0 |
| 60706 | Palácio Nacional da Pena | castle (não `palace`, achado colateral) | —/—/—/—/**100** | 0 | 0 |
| 62107 | Torre da Portagem (Marvão) | castle | 65/100/100/100/**93** | 0 | 0 |

🟢 Comparação dos 4 cenários pedidos:
1. **Scoring atual** — valores acima, calculados em 2026-07-29, nunca revistos desde então para nenhum destes 4.
2. **Modelo B2** (do estudo paralelo): para Torre da Portagem, o Modelo B (evidência-primeiro) fazia cair o Display de 93→52 e **perdia elegibilidade para "Principais"**, só por não ter classificação SIPA formal registada na BD apesar de ter 15 fotos reais — achado já documentado no outro estudo, reconfirmado aqui como o caso mais ilustrativo de risco de fórmula, não de arquitetura.
3. **Dinâmico sem comunidade** — mecanicamente idêntico ao ponto 1 ou 2 (dependendo de qual fórmula se escolher), já corrigido para os 77 dias de atraso: nenhum dos 4 POIs desta amostra tem alterações pendentes de imagem/descrição não refletidas (todos com `scores_computed_at`=2026-07-29 e sem evidência de enriquecimento posterior encontrada nesta sessão), por isso o valor seria igual ao atual — a vantagem do mecanismo só se manifesta nos 621 POIs nunca pontuados ou nos que tiverem enriquecimento futuro, não retroativamente nestes 4.
4. **Dinâmico com comunidade** — todos os 4 têm **0 favoritos e 0 trip_saved_poi**, confirmado na BD. Mesmo com um eixo C a existir, não mudaria nada para estes 4 landmarks específicos hoje — o efeito real da comunidade aparece noutros POIs, como os 2 lagos da secção 7, que têm sinal comunitário mas score intrínseco modesto.

🟡 Interpretação: esta amostra prova um ponto importante por omissão — **os POIs mais "óbvios" (castelos nacionais famosos) têm zero rasto de utilização na BD local**, o que é esperado (BD de desenvolvimento, poucos utilizadores reais) mas significa que qualquer simulação de "impacto da comunidade" com estes 4 POIs específicos seria, por definição, nula. Os casos onde a comunidade already faz diferença (secção 7) são POIs menos óbvios — o que é exatamente o comportamento desejável do eixo C (não entra em consenso com o óbvio, acrescenta o que a fórmula não vê).

---

## 13. Arquitetura recomendada

Respondendo diretamente às 12 perguntas da secção 12 do pedido:

1. **Continuam armazenados na BD?** 🔴 Sim — a leitura do mapa depende disto, confirmado pela medição da secção 4/10.
2. **Calculados em tempo real?** 🔴 Não, para o caminho do mapa/listas. Pontualmente aceitável para 1 POI de cada vez (página de detalhe), mas não é necessário — reaproveitar o valor persistido é mais simples e já suficientemente fresco com o mecanismo da secção 8.
3. **Cache?** 🔴 O que já existe (`display_score` como coluna) já É o cache. Não precisa de uma segunda camada de cache por cima.
4. **Híbrida?** 🔴 Sim — persistência com atualização automática disparada ao nível da BD (trigger), não ao nível da aplicação. Esta é a decisão central deste estudo.
5. **Atualização automática?** 🔴 Trigger (marca "dirty") + `@Scheduled` existente que recalcula só os dirty — secção 8.
6. **Favoritos/comentários/viagens?** 🔴 Expostos como eixo C separado, nunca fundido no Display enquanto o volume for o atual (secção 6/7), com proteções contra manipulação já listadas.
7. **Fotografias/descrições futuras?** 🔴 Já cobertas pelo trigger em `media_item`/`poi` da secção 8 — sem mecanismo novo dedicado a isto especificamente.
8. **Impedir que popularidade domine?** 🔴 Piso de volume + log-scale + nunca gate de elegibilidade (secção 7).
9. **Manter o mapa rápido?** 🔴 Já é rápido (12,8ms medido) e a proposta não toca nesse caminho de leitura.
10. **Evitar nova desatualização?** 🔴 O trigger cobre TODAS as escritas (API, scripts Python, futuro PT Operations) porque vive na BD, não no Java — é a resposta direta ao achado da secção 1.
11. **Infraestrutura reutilizável?** 🔴 Padrão `@Scheduled` já em produção (`PendingUserRegistrationCleanupJob`), `scoring.yml` já centralizado, colunas `poi.updated_at`/`scores_computed_at` já existem.
12. **Solução mais simples que satisfaz os requisitos?** 🔴 1 coluna nova (`scores_dirty_at`) + 2 triggers finas + 1 job scheduled reaproveitado — nenhum serviço novo, nenhuma fila nova, nenhuma fórmula nova.

---

## 14. Roadmap de implementação

### Fase A — Fundação do Scoring Dinâmico
- **Objetivo:** fechar o gap da secção 1 (staleness sem deteção) sem tocar em nenhuma fórmula.
- **Componentes:** migration nova (`scores_dirty_at` em `poi`), 2 triggers SQL, 1 `@Scheduled` novo seguindo o padrão existente.
- **Dependências:** nenhuma — pode avançar independentemente da decisão do Modelo B2.
- **Riscos:** (a) trigger mal escrita pode marcar dirty em excesso se disparar em colunas irrelevantes (ex. `updated_at` do próprio trigger causaria um loop) — tem de listar explicitamente as colunas relevantes, não `FOR EACH ROW` genérico; (b) picos de escrita em lote (um runner de enriquecimento a processar 1000 POIs de uma vez) podem marcar 1000 dirty de repente — o job scheduled tem de aguentar isso sem bloquear a BD (processar em lotes pequenos, não tudo numa transação).
- **Critério de aceitação:** correr um script de enriquecimento de teste, confirmar que `scores_dirty_at` é marcado, confirmar que o job seguinte recalcula só esse POI.
- **Rollback:** reverter a migration (remover coluna+triggers) não afeta os scores já persistidos — é aditivo, sem risco de perda de dados.

### Fase B — Integração com Enriquecimento
- **Objetivo:** eficiência — hoje `compute_public_scores.py::main()` só sabe processar "todos". Acrescentar um modo "só estes IDs" para o job da Fase A não ter de reprocessar a BD inteira a cada corrida.
- **Dependências:** Fase A.
- **Riscos:** manter a ordem Confidence→Quality (dependência real documentada na arquitetura) mesmo em modo incremental.

### Fase C — Integração Comunitária
- **Objetivo:** materializar o eixo C (secção 6/7) como coluna/tabela separada, alimentada pelos mesmos triggers (em `favorite`, `trip_saved_poi`, `trip_poi_event`).
- **Dependências:** Fase A (mesmo mecanismo de trigger+dirty, reaproveitado).
- **Riscos:** volume ainda baixo (secção 4) — lançar isto antes de ter uma massa crítica de dados arrisca criar uma métrica ruidosa visível antes de ser útil. 🔴 Recomendação: implementar a coluna/cálculo, mas não a expor na UI até o volume nacional de interações ultrapassar uma ordem de grandeza acima do atual (ex. >1000 `trip_saved_poi`, hoje em 121).

### Fase D — Modelo de Ranking
- **Objetivo:** decidir e implementar a fórmula do Display Score que incorpora C (se decidido) e a fórmula do Modelo B2 (decisão separada, já em estudo).
- **Dependências:** Fase C para C; decisão humana do estudo B2 para a fórmula.
- **Riscos:** o maior risco de todo o roadmap — é aqui que entra a recalibração de pesos, com todo o potencial de efeitos colaterais já documentado no estudo B2 (ex. Torre da Portagem perder elegibilidade). Requer validação humana explícita antes de ativar em produção, idealmente com um modo de comparação lado-a-lado (A/B) antes de substituir o valor visível.

### Fase E — Validação e Observabilidade
- **Objetivo:** dashboard/métrica simples — quantos POIs estão `dirty` neste momento, há quanto tempo, quantos falharam a última tentativa de recálculo.
- **Dependências:** Fases A-D.
- **Riscos:** nenhum risco técnico novo — é só visibilidade sobre o que já existe.

---

## 15. Riscos e decisões pendentes

1. **Decisão pendente (humana):** aceitar que o gatilho vive na BD (trigger SQL), não no Java — é a decisão arquitetural central deste estudo e tem de ser validada antes da Fase A, porque é mais difícil de reverter depois de outras partes dependerem dela.
2. **Decisão pendente:** cadência do `@Scheduled` (secção 8) — proposto "de hora a hora" como ponto de partida, não medido contra volume real de escrita em produção.
3. **Risco aceite conscientemente:** os 2 scripts sem `updated_at` fiável (secção 1) continuam a escrever sem o marcar explicitamente — mas como a Fase A propõe um trigger (não depender de `updated_at`), este risco **deixa de importar** depois da Fase A, o que é uma vantagem adicional da escolha de mecanismo.
4. **Questão em aberto:** se/quando o `pt-operations-api` ganhar escrita direta a `poi` (hoje não confirmado nesta sessão se já escreve ou só lê — fora do âmbito desta auditoria, que se focou em `portugal-na-mao-api`), o trigger da Fase A já o cobre automaticamente por estar na BD, não no serviço — mas vale confirmar isto explicitamente antes de fechar a Fase A como "completa".
5. **Risco de produto, não técnico:** nenhum dos 4 POIs simulados (secção 12) tem qualquer sinal comunitário — a Fase C corre o risco de ser construída antes de haver dados suficientes para a validar com confiança. Recomenda-se tratar a Fase C como infraestrutura "pronta mas desligada" (ver secção 14), não como lançamento imediato.

---

## Git status

**Início da sessão (herdado dos dois estudos anteriores, mesma sessão):**
```
portugal-workspace:        ?? MAP_BBOX_ZOOM_SCORING_DIVERSIFICATION_STUDY.md
portugal-na-mao-api:        M src/main/java/.../search/SearchService.java (sessão concorrente, preservado)
                            ?? SCORING_2_0_ARCHITECTURE_STUDY.md
                            ?? SEARCH_SCORE_CATEGORY_DIVERSITY_STUDY.md
PT-portugal-na-mao-fe:      (alterações de design/feed de outra sessão, não relacionadas, preservadas)
```

**Fim desta sessão:** idêntico, mais `?? SCORING_2_0_DYNAMIC_ARCHITECTURE_STUDY.md` na raiz do workspace (este ficheiro). Nenhum ficheiro de código, configuração ou BD foi alterado. Nenhum script existente foi modificado. Nenhuma migration foi criada. Nenhum commit/push foi feito.
