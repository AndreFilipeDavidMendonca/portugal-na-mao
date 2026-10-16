# Testes de Carga — Resultados, Causas e Recomendações (15/10/2026)

**Tipo:** testes de carga reais (local + produção, 10 e 20 agentes, perfil anónimo) + leitura ao vivo de HikariCP/CPU/JVM via `/api/internal/actuator` (ver `PT_OPERATIONS_OBSERVABILITY_COVERAGE_REPORT.md`). **Nenhuma alteração de código nesta sessão** — só execução e leitura.

**Achado principal, que revê a conclusão anterior:** com visibilidade real ao HikariCP pela primeira vez, **o CPU em produção está quase ocioso (3-14%) durante os testes** — a hipótese anterior ("1 vCPU é o limite") não está confirmada pelos dados agora disponíveis. O que está realmente a consumir o tempo é o **tempo de utilização de cada ligação à base de dados: 1,4 a 1,75 segundos em média**, por ligação, em todas as execuções medidas.

---

## 1. Resultados — tabela comparativa

| Ambiente | Agentes | Pedidos | Erros | Média | P50 | P95 | P99 | Máx |
|---|---|---|---|---|---|---|---|---|
| Local | 10 | 9.489 | 0 | 49 ms | 46 ms | 118 ms | 161 ms | 695 ms |
| Local | 20 | 11.346 | 0 | 80 ms | 72 ms | 194 ms | 250 ms | 510 ms |
| **Produção** | **10** | 177 | 0 | **2.679 ms** | **1.537 ms** | **8.570 ms** | **11.260 ms** | **13.293 ms** |
| **Produção** | **20** | 207 | 0 | **5.409 ms** | **3.785 ms** | **14.305 ms** | **17.458 ms** | **24.211 ms** |

**Zero erros em todos os testes** — mesmo a 20 agentes/24s de máximo, nenhum pedido falha, só fica lento. Confirma, mais uma vez, que não é esgotamento do pool a rejeitar pedidos (isso daria erros 500); é tudo a demorar mais tempo, de forma consistente.

### Endpoints mais lentos (produção, por execução)

| Endpoint | Prod 10 ag. (avg) | Prod 20 ag. (avg) |
|---|---|---|
| `GET /api/search` | 3.910 ms | 6.022 ms |
| `GET /api/pois/lite` | 3.445 ms | 6.215 ms |
| `GET /api/districts/16` | **682 ms** | 3.990 ms |

`/api/districts/16` continua a ser o mais rápido dos três a 10 agentes (682ms — a redução de round-trips aplicada ontem parece estar a ajudar aqui), mas converge com os outros dois a 20 agentes. Em local, os três endpoints ficam sempre abaixo de 120ms de média, em qualquer dos dois níveis de carga.

---

## 2. Uso de CPU e memória (medido ao vivo, durante os testes de produção)

| Momento | CPU processo | CPU sistema | Ligações ativas/máx | Espera média/ligação | Uso médio/ligação |
|---|---|---|---|---|---|
| Prod 10 ag., início | 14% | 14% | 0/10 | 1.541 ms | 1.755 ms |
| Prod 10 ag., meio | 6% | 6% | 4/10 | 1.102 ms | 1.435 ms |
| Prod 10 ag., pico | 6% | 6% | **10/10 (cheio, 1 pendente)** | 969 ms | 1.492 ms |
| Prod 20 ag., início | 3% | 3% | 0/10 | 854 ms | 1.460 ms |
| Prod 20 ag., meio | 4% | 4% | 4/10 | 771 ms | 1.371 ms |
| Prod 20 ag., pico | 4% | 4% | 9/10 | 697 ms | 1.396 ms |

**O CPU nunca passou de 14%, em nenhum dos dois testes.** O heap da JVM manteve-se sempre entre 84-128 MB de um máximo de 742 MB (a maioria da RAM atribuída nem está a ser usada) — a flag `-Xmx768m` aplicada ontem não está a ser o limite, nem perto disso.

**O que está a consumir o tempo é o "tempo de uso" de cada ligação HikariCP** — tempo entre a aplicação obter a ligação e a devolver ao pool, que inclui a execução real da query na base de dados + o tempo de rede entre a app e a BD. Esse valor ficou **sempre acima de 1,3 segundos**, em ambos os testes, em todos os momentos medidos — independente de quantos agentes estavam a correr.

---

## 3. Melhorias de ontem — ajudaram?

As três alterações de `5594bc5` (menos round-trips, `-Xmx768m`+`SerialGC`, `tomcat.threads.max=24`) partiam da hipótese de que o CPU era o limite. **Os dados de hoje contradizem essa hipótese** — o CPU nunca esteve perto de saturar. Por isso:

- **Não há como estas alterações terem corrigido o problema de fundo** — o tempo continua dominado por "uso da ligação", que estas mudanças não tocam.
- **Também não parecem ter piorado nada de forma clara.** O resultado que pareceu pior ontem (P50 5.1s, máx 19.4s) e os dois testes de hoje (P50 1.5s/3.8s a 10/20 agentes, máx 13.3s/24.2s) mostram **variação grande entre execuções sucessivas do mesmo código** — não há dados suficientes (N=1 por condição) para separar "a mudança piorou isto" de "isto varia muito de execução para execução".
- `/api/districts/16` a 10 agentes (682ms, claramente melhor que os outros dois endpoints) é o único sinal, ainda fraco, de que a redução de round-trips pode estar a ajudar especificamente esse endpoint — mas desaparece a 20 agentes.

---

## 4. Causa confirmada

**A base de dados de produção (`portugal-na-mao-db`, Render) está no plano `0.1c-256mb`: 0,1 CPU / 256 MB RAM, $6/mês.** Confirmado no dashboard do Render pelo André, 15/10/2026.

Isto explica por completo o padrão medido: um décimo de um núcleo satura quase instantaneamente com qualquer concorrência real, mesmo ligeira — por isso o tempo de uso de ligação (~1,4-1,75s) **não cresce proporcionalmente entre 10 e 20 agentes** (697-1541ms em ambos os testes, sem diferença clara): a BD já está no limite da sua capacidade de computação com poucos pedidos simultâneos, antes mesmo de qualquer esgotamento de pool ou de CPU da aplicação entrarem em jogo. É proporcionalmente **ainda mais pequena** do que o 1 CPU/2GB do serviço da aplicação (essa comparação, aliás, é o que tinha levado à hipótese errada de CPU da app como causa — a app tem 10x mais CPU do que a BD).

O teste direto por `psql` (~260-300ms por query simples, a partir desta máquina) fica agora só como contexto — não muda a conclusão, que está confirmada pelo plano em si, não por inferência.

---

## 5. Confirmado — upgrade da BD aplicado e remedido no mesmo dia

O André subiu o plano da base de dados gerida (Render) de `0.1c-256mb` para `0.5c-1g` (0,5 CPU / 1GB, $19/mês). Repeti os mesmos 2 testes imediatamente a seguir, mesmos agentes, mesmo perfil, contra o mesmo serviço:

| Agentes | Métrica | Antes (0,1 CPU) | Depois (0,5 CPU) | Ganho |
|---|---|---|---|---|
| 10 | Pedidos completos | 177 | **780** | 4,4× mais débito |
| 10 | P50 | 1.537 ms | **161 ms** | **9,5× mais rápido** |
| 10 | P95 | 8.570 ms | **899 ms** | 9,5× mais rápido |
| 10 | P99 | 11.260 ms | **1.238 ms** | 9,1× mais rápido |
| 20 | Pedidos completos | 207 | **936** | 4,5× mais débito |
| 20 | P50 | 3.785 ms | **442 ms** | **8,6× mais rápido** |
| 20 | P95 | 14.305 ms | **1.881 ms** | 7,6× mais rápido |
| 20 | P99 | 17.458 ms | **2.414 ms** | 7,2× mais rápido |
| 20 | Máximo | 24.211 ms | **4.142 ms** | sem outliers de 13-24s |

**Confirma, com dados de antes e depois do mesmo dia, que a causa estava mesmo identificada corretamente** — nenhuma alteração de código entre as duas rondas de testes, só o plano da BD. Zero erros em todas as execuções, em ambos os planos. $19/mês já trouxe um ganho de 7-9,5× em todos os percentis — fica em aberto se compensa subir mais (ver §5 original) depois de ver como isto se comporta com uso real.

### 5.1 Novo ponto de rutura, já com o plano `0.5c-1g`

Um teste adicional a **100 agentes** (produção, mesmo plano novo) mostra onde está o novo limite: 787 pedidos, **27 erros (3,4%)**, P50=1,4s (ainda razoável) mas P95=30,0s / P99=31,5s / máximo=32,7s — a mesma assinatura de sempre (perto do teto dos 30s do `connection-timeout`), confirmando que `DB_POOL_MAX=10` em produção (nunca alterado) continua a ser pequeno de mais para 100 agentes, mesmo com 5× mais CPU na BD.

### 5.2 `DB_POOL_MAX` 10→30 — resolvido

André subiu `DB_POOL_MAX` para 30 (env var nova no Render, nunca tinha sido definida — estava sempre no default `10` do `application.yml`). Repeti o teste de 100 agentes, mesmo plano de BD (`0.5c-1g`), só o pool mudou:

| Métrica (100 agentes) | Pool=10 | Pool=30 | Ganho |
|---|---|---|---|
| Pedidos completos | 787 | **1.194** | +52% |
| Pedidos com erro | 27 (3,4%) | **0 (0%)** | erros eliminados |
| P50 | 1,4 s | 1,86 s | ligeiramente pior |
| P95 | 30,0 s | **4,3 s** | ~7× melhor |
| P99 | 31,5 s | **4,9 s** | ~6,4× melhor |
| Máximo | 32,7 s | **6,0 s** | ~5,5× melhor, sem perto do teto |

**Resolvido.** O pool de 10 ligações era mesmo o limite a 100 agentes — subir para 30 eliminou os erros por completo e cortou a cauda longa (P95/P99/máximo) em 5,5-7×. O ligeiro aumento no P50 é o único efeito secundário, esperado (mais ligações concorrentes a disputar os mesmos 0,5 CPU da BD) — tradeoff claramente a favor, dado que elimina erros reais.

**Estado depois destas duas rondas:** BD `0.5c-1g` ($19/mês) + `DB_POOL_MAX=30` — 20 agentes muito rápido, 100 agentes sem erros e com cauda controlada. Próximo passo natural, se quiser mapear mais a fundo: testar entre 100 e 200+ para encontrar o novo teto com esta configuração.
