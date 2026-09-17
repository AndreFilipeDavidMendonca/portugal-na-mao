# Permissions — Análise da Arquitetura Atual (Fase 0)

Data: 2026-09-07
Âmbito: `PT-portugal-na-mao-fe` (React/Vite) + `portugal-na-mao-api` (Spring Boot), investigação read-only, sem alterações de código.

---

## 1. Comportamento atual encontrado

Não existe nenhuma camada central de permissões. O padrão dominante, repetido em dezenas de sítios, é:

```js
const { user, setAuthOpen } = useApp();
onClick={() => { if (!user) { setAuthOpen(true); return; } fazAcaoReal(); }}
```

Cada componente decide por si próprio, inline, "isto exige sessão?" — não há nenhuma função, hook ou módulo partilhado que centralize a regra. A única fonte de verdade sobre a sessão é o valor `user` do `AppContext.jsx` (truthy/falsy); não existe conceito de "role" além de `user.role === "GUIDE"`/`isAdmin`.

Para Viagens, a distinção participante/host também é recalculada inline em cada sítio que precisa dela, a partir de dois campos do objeto trip:

```js
const isOwner = trip.ownerId === currentUserId;             // TripsPanel.jsx:68
const isMember = (trip.participants || []).some(p => p.userId === currentUserId); // TripsPanel.jsx:73
```

Estes dois booleanos são calculados uma vez em `TripsPanel.jsx` e passados como props para baixo (`TripHeroHeader`, etc.) — não são recalculados noutros ficheiros, mas também não existe nenhuma função reutilizável `isTripOwner()`/`isTripMember()`; é álgebra booleana repetida onde é preciso.

**Distinção "autenticado mas não participante" vs "participante" vs "host" vs "sem conta"**: hoje só existe de facto para Viagens (via `isOwner`/`isMember`), e mesmo aí de forma incompleta — ver secção 2.

---

## 2. Problemas encontrados

### 2.1 Bloqueio total do backend em áreas que o produto quer públicas

Este é o achado mais importante e afeta diretamente as Fases 3, 4 e 5 do plano:

- **Feed** — `SecurityConfig.java` não tem nenhuma entrada `permitAll()` para `/api/feed/**`; cai no catch-all `.anyRequest().authenticated()` (linha 130). O próprio `FeedController.listFeed` (GET, leitura) reforça isto manualmente: `getUserIdOrNull()` + `if (currentUserId == null) return 401`. **Hoje, um visitante sem sessão recebe 401 ao tentar simplesmente listar o Feed** — o requisito "Feed é público" não é possível só com alterações de frontend.
- **Viagens partilhadas** — `/api/trips/**` também cai no catch-all `.anyRequest().authenticated()`. Não existe hoje nenhum caminho, autenticado ou não, para servir uma trip "published" a um visitante sem sessão. `TripService.java` documenta a intenção ("a published trip is readable by any authenticated user") mas isto é literal: só *autenticado*, nunca anónimo. O requisito da Fase 5 ("pessoa sem conta pode abrir a viagem partilhada") exige uma alteração de arquitetura no backend, não só no frontend.
- **Guias** — `GuideController` (`GET /api/guides`, `GET /api/guides/{userId}`) exige sessão explicitamente (`getUserIdOrNull()` + 401 em ambos os endpoints). O requisito da Fase 3 ("Guias podem ser explorados publicamente") também não é alcançável só no frontend.
- Em contraste, **POIs, distritos, municípios, vilas, pesquisa e sugestões já são verdadeiramente públicos** (`SecurityConfig.java:88-96`, e `PoiController.getById` nem sequer chama `getUserIdOrNull()`) — é o padrão a replicar.

### 2.2 Inconsistências reais dentro do frontend (bugs, não só falta de arquitetura)

- **`PoiModal.jsx:456`** — `onFav` (botão de favoritos no modal de detalhe do POI) chama `toggleFav(poi.id)` **sem nenhum `if (!user)`**, ao contrário do botão vizinho `onTrip` no mesmo bloco de ações, que tem o gate. Consequência concreta: `toggleFav` em `AppContext.jsx:624-630` faz update otimista do estado local **antes** de verificar `user`, por isso um visitante sem sessão vê o coração ficar dourado e um toast "guardado" — mas nada é persistido (o early-return por falta de `user` acontece depois do update local), e desaparece ao recarregar a página. É uma falsa confirmação de sucesso.
- **`UserProfileModal.jsx`** (perfil de outro utilizador, aberto a partir de um post do Feed) — não lê `useApp().user` nem `setAuthOpen` em lado nenhum. O botão "Adicionar amigo" é sempre mostrado e `handleAddFriend` dispara `sendFriendRequestByUserId` sem qualquer gate — para um visitante, a chamada falha silenciosamente no backend (401) e mostra-se apenas um toast genérico de erro, nunca um convite para login. É o único ponto de escrita autenticada na app sem o padrão `if (!user) setAuthOpen(true)`.
- **Menu "Mais" da viagem (`TripHeroHeader.jsx`) — "Partilhar no Feed" está gated a `isMember`, não a `isOwner`**, o que já está correto face à Fase 7 ("Podem: participantes; host"), mas é preciso confirmar que fica assim de propósito e não por acidente, já que é a única ação do menu que trata dono e participante da mesma forma.
- **"Otimizar ordem" (`TripItineraryTab.jsx:267`) não tem nenhum gate de owner** — qualquer membro pode acionar, não só o host. Isto **contradiz diretamente a Fase 5** ("A otimização da ordem das paragens é exclusiva do host"). É uma mudança de comportamento real a fazer, não só reorganização de código.
- **Localização dos participantes no mapa (`TripParticipantMarkers.jsx`)** — não existe nenhum check `isMember` no frontend; a proteção é 100% backend (403 silencioso, `catch { setLocations([]) }`). Funciona hoje por acidente de "nada para mostrar", mas não há nenhuma camada no frontend que documente/garanta esta regra deliberadamente — se amanhã outro componente tentar mostrar estas localizações de forma diferente, não há nada que o impeça de o fazer incorretamente para um não-membro.
- **Guias é hoje uma sub-feature de Amigos, não uma área própria** — só existe como aba dentro de `FriendsPanel.jsx` (que só monta com sessão). Não há ecrã de listagem pública, nem entrada no Sidebar/MobileNav. O requisito da Fase 3 ("Guias podem ser explorados publicamente, sem conta") implica não só destravar o backend (2.1) como construir a própria área de navegação pública que hoje não existe.
- **Favoritos e Notificações** — sem gate de navegação (podem ser abertos por um visitante), mas também sem qualquer convite a fazer login — mostram apenas um estado vazio, silenciosamente. Não é "errado" face às fases descritas, mas é inconsistente com Amigos/Perfil/Viagens, que fazem `setAuthOpen(true)` de imediato ao tentar entrar.
- **Deep-link para uma viagem a partir do Feed (`AppContext.jsx:1631`, `openTripDetail`)** — `if (!tripId || !user) return;` — hoje, se um visitante sem sessão clicar no título de um post do tipo "viagem partilhada", o painel de Viagens abre mas fica vazio (nunca chama `api.fetchTrip`). Combinado com o bloqueio de 2.1, corrigir isto exige também alterações de backend.

### 2.3 Lógica duplicada / espalhada (o problema estrutural que a Fase 1 deve resolver)

Contagem aproximada de sítios com `if (!user) { ...; setAuthOpen(true); ... }` ou equivalente, cada um implementado de forma ligeiramente diferente (com/sem toast, com/sem `return` explícito, mensagens diferentes):

- `Sidebar.jsx` (3 itens de nav), `MobileNav.jsx` (1), `MobileHeader.jsx` (2)
- `FeedPanel.jsx` (like, save, comentar, criar publicação — 5 ocorrências, 2 delas duplicadas byte-a-byte entre mobile/desktop)
- `PoiModal.jsx` (`onTrip`, mas não `onFav` — inconsistência já descrita)
- `TripsPanel.jsx` (`openCreate`, `confirmCreateFromPreview`)
- `GeoEntitySections.jsx` (2), `SuggestionEventCard.jsx`, `SuggestionPoiCard.jsx`

Nenhum destes usa uma função/hook partilhado — é copy-paste do mesmo padrão com pequenas variações. É exatamente o "if/else de permissões espalhados por dezenas de componentes" que o pedido do utilizador identifica como o problema a resolver.

---

## 3. Regras de negócio pretendidas

(Resumo — a especificação completa está nas Fases 2-9 do pedido original; aqui só a estrutura de conceitos que a arquitetura precisa de suportar.)

Quatro "papéis" possíveis por contexto:
1. **Visitante** (sem sessão)
2. **Autenticado, não-participante** (tem conta, mas não pertence à viagem/entidade em causa)
3. **Participante** de uma viagem
4. **Host** de uma viagem (subconjunto de participante, com permissões adicionais)

Áreas com regras públicas (visitante pode ver, mas não agir): Feed, Sugestões, Guias, Viagens partilhadas/publicadas, mapa/POIs/pesquisa (já público hoje).

Áreas totalmente privadas para visitante (mas navegáveis para descobrir que existem): Amigos — nota de contradição, ver Secção 9.

Ações sempre exigem conta, independentemente da área: like, comentar, guardar/favoritar, criar publicação, criar viagem, enviar mensagem/pedido de amizade, convidar, partilhar no Feed, sair da viagem.

Ações exigem participante: chat, adicionar/reordenar paragens, tirar fotografias, ver localização de outros participantes, abrir perfil de participantes (a partir de dentro da trip).

Ações exigem host: editar viagem, despublicar, otimizar ordem das paragens.

---

## 4. Onde a lógica atual está espalhada (mapa completo)

| Domínio | Ficheiro(s) | O que faz hoje |
|---|---|---|
| Gate de navegação | `Sidebar.jsx`, `MobileNav.jsx`, `MobileHeader.jsx` | `user ? openMenu(x) : setAuthOpen(true)` inline, inconsistente por item (Feed/Favoritos/Notificações sem gate; Amigos/Perfil/Viagens com gate) |
| Feed — ações | `FeedPanel.jsx` (like, save, comment, create) | Gate inline repetido, 2 duplicações byte-a-byte |
| POI — favoritar/adicionar a viagem | `PoiModal.jsx` | `onTrip` gated, `onFav` não gated (bug) |
| POI — favoritar (outros contextos) | `GeoEntitySections.jsx`, `SuggestionEventCard.jsx`, `SuggestionPoiCard.jsx`, `FavoritesDrawer.jsx` | Gate inline (maioria correta) |
| Perfil de outro utilizador | `UserProfileModal.jsx` | Sem gate nenhum (bug) |
| Viagens — criação | `TripsPanel.jsx` (`openCreate`, `confirmCreateFromPreview`) | Gate inline + toast |
| Viagens — owner/member | `TripsPanel.jsx:68,73` (cálculo), `TripHeroHeader.jsx` (consumo para menu "Mais", editar, publicar, convidar, partilhar, sair, câmara), `TripOverviewTab.jsx` (eliminar), `TripItineraryTab.jsx` (`readOnly = !isMember`, sem distinção host para otimizar ordem) | `isOwner`/`isMember` recalculados/propagados por props, sem helper partilhado |
| Localização de participantes | `TripParticipantMarkers.jsx` | Nenhum check frontend, só reage a 403 do backend |
| Amigos | `FriendsPanel.jsx` | Só monta com sessão (gate no nav) |
| Guias | `FriendsPanel.jsx` (aba), `GuideProfileEditor.jsx`, `GuideProfileSummary.jsx` | Sub-feature de Amigos, sem área própria |
| Favoritos | `FavoritesDrawer.jsx` | Sem gate de nav, defesa só nos dados (`AppContext.jsx:424-434`) |
| Notificações | `NotificationsPanel.jsx` | Sem gate de nav, defesa só nos dados (`AppContext.jsx:1497-1503`) |
| Backend — trips/feed/guides/friendships/favorites | `SecurityConfig.java`, `TripController`/`TripService`, `FeedController`, `GuideController`, `FriendshipController`, `FavoriteController` | Catch-all `.anyRequest().authenticated()`; nenhum destes domínios tem leitura pública hoje |

---

## 5. Arquitetura proposta

Manter a app fiel ao padrão já existente (Context API + hooks), sem introduzir uma biblioteca de RBAC nem um novo sistema de estado. A proposta tem duas peças, deliberadamente pequenas:

**a) `src/lib/permissions.js`** — funções puras, sem dependência de React, que recebem os dados já disponíveis (`user`, `trip`, `currentUserId`) e devolvem booleanos. Ex.:

```js
export const isTripOwner = (trip, userId) => !!trip && trip.ownerId === userId;
export const isTripMember = (trip, userId) => !!trip && (trip.participants || []).some(p => p.userId === userId);
export const canEditTrip = (trip, userId) => isTripOwner(trip, userId);
export const canUnpublishTrip = (trip, userId) => isTripOwner(trip, userId);
export const canOptimizeTripOrder = (trip, userId) => isTripOwner(trip, userId); // corrige o bug da secção 2.2
export const canUseTripChat = (trip, userId) => isTripMember(trip, userId);
export const canEditTripStops = (trip, userId) => isTripMember(trip, userId);
export const canShareTripToFeed = (trip, userId) => isTripMember(trip, userId);
export const canInviteToTrip = (trip, userId) => isTripMember(trip, userId);
export const canLeaveTrip = (trip, userId) => isTripMember(trip, userId) && !isTripOwner(trip, userId);
export const canViewTripParticipantLocations = (trip, userId) => isTripMember(trip, userId);
```

Testável isoladamente, sem montar componentes — e se o backend um dia expuser as mesmas regras via DTO (ex.: `trip.viewerRole`), esta camada muda num único sítio.

**b) `src/hooks/usePermissions.js`** — dois hooks React finos, construídos sobre `useApp()` + `permissions.js`:

- `useTripPermissions(trip)` → `{ isOwner, isMember, can: { edit, unpublish, chat, addStop, reorderStops, optimizeOrder, photograph, shareToFeed, invite, leave, viewParticipantLocations } }`, memoizado por `[trip, currentUserId]`.
- `useRequireAuth()` → devolve uma função `requireAuth(messageKey)` que substitui **todos** os `if (!user) { toast(...); setAuthOpen(true); return; }` espalhados hoje: mostra o toast (se `messageKey` for passado) e abre o modal de login, devolvendo `true`/`false` para o chamador decidir se continua. Um único sítio a manter, uma única forma de "pedir login" em toda a app.

Nenhuma das duas peças exige mudar o `AppContext.jsx` nem a forma como o resto da app já consome `user`/`setAuthOpen` — são uma camada fina por cima do que já existe.

**Fora do âmbito desta camada (fica no backend):** as regras de "pode ver dados X" continuam a ser aplicadas pelo backend (é ele quem tem os dados reais); a camada de permissões do frontend serve para decidir o que **mostrar/permitir na UI**, nunca é a garantia de segurança — essa continua (e deve continuar) a ser sempre reforçada no backend, como já acontece hoje para trips/favoritos/amizades.

---

## 6. Ficheiros que serão criados

- `src/lib/permissions.js` (novo)
- `src/hooks/usePermissions.js` (novo)

Nenhum ficheiro existente precisa de ser reescrito para introduzir esta camada — a Fase 1 substitui os cálculos inline (`isOwner`/`isMember` em `TripsPanel.jsx`, os `if (!user)` espalhados) por chamadas a estes dois ficheiros, sem alterar comportamento.

---

## 7. Como os restantes componentes consomem esta lógica

Exemplo do padrão antes/depois (`TripHeroHeader.jsx`, botão "Despublicar"):

```jsx
// antes
{isOwner && <button onClick={onTogglePublish}>...</button>}

// depois
const { can } = useTripPermissions(trip);
{can.unpublish && <button onClick={onTogglePublish}>...</button>}
```

Exemplo do padrão antes/depois (`PoiModal.jsx`, `onFav` — corrige o bug 2.2 de caminho):

```jsx
// antes
const onFav = () => { toggleFav(poi.id); toast(...); };

// depois
const requireAuth = useRequireAuth();
const onFav = () => { if (!requireAuth()) return; toggleFav(poi.id); toast(...); };
```

`TripsPanel.jsx` deixa de calcular `isOwner`/`isMember` localmente e passa a chamar `useTripPermissions(trip)`, continuando a passar os booleanos herdados (`isOwner`, `isMember`) como props a `TripHeroHeader`/`TripOverviewTab` tal como hoje — só a origem do cálculo muda, não a interface entre componentes (minimiza o diff da Fase 1).

---

## 8. Plano de implementação faseado

Conforme já definido no pedido do utilizador (Fases 0-10). Nota adicional desta análise: as Fases 3, 4 e 5 têm uma dependência de backend que não estava explícita no plano original (ver Secção 9) — proponho tratar isso como sub-passos dentro dessas fases, não como uma fase nova, para não alterar a numeração já acordada:

- Fase 1 — infraestrutura (`permissions.js` + `usePermissions.js`), sem mudança funcional.
- Fase 2 — regras gerais (já maioritariamente satisfeitas hoje: mapa, pesquisa, POIs, sugestões já são públicos).
- Fase 3 — Amigos/Guias/Favoritos: para Guias, além do frontend, é preciso (a) destravar `GET /api/guides` e `GET /api/guides/{userId}` no backend, e (b) construir a área de navegação pública que hoje não existe.
- Fase 4 — Feed: além do frontend, é preciso remover o gate de autenticação obrigatória em `FeedController.listFeed` (GET) e na `SecurityConfig`, mantendo os endpoints de escrita (create/update/delete/like) autenticados como já estão.
- Fase 5 — Viagens: a mais complexa. Requer desenho de um endpoint (ou modo) de leitura pública para trips `published`, com a localização de participantes continuando estritamente `requireMember` (isto já está bem isolado hoje — não mexer). Esta fase provavelmente precisa da sua própria mini-análise de arquitetura backend antes de implementar, dada a sensibilidade (chat, itinerário, localização).
- Fases 6-9 — maioritariamente frontend puro, consumindo a camada de permissões já criada.
- Fase 10 — revisão transversal.

---

## 9. Riscos e casos ambíguos a validar antes de continuar

1. **Contradição direta entre instruções recentes sobre Amigos.** Numa correção anterior desta mesma sessão, disseste explicitamente "Amigos: comportamento atual está correto, não alterar" (ou seja, manter o bloqueio total no nav para visitantes). Este novo pedido (Fase 3) diz o oposto: "Utilizador não autenticado: pode entrar na área de Amigos; não deve ser bloqueado imediatamente só por abrir a área." Preciso que confirmes qual das duas prevalece — assumo que este pedido mais recente e mais completo substitui a instrução anterior, mas quero confirmação explícita antes de implementar, porque é uma mudança de comportamento visível, não um detalhe técnico.

2. **Viagens partilhadas para visitantes sem sessão exige mudança de arquitetura no backend, não só no frontend.** Hoje `SecurityConfig.java` bloqueia `/api/trips/**` a qualquer pedido não autenticado (`anyRequest().authenticated()`), e não existe nenhum caminho alternativo. Cumprir a Fase 5 literalmente ("pessoa sem conta pode abrir a viagem publicada e ver paragens/km/mapa/participantes") implica desenhar um endpoint (ou uma exceção de segurança) que sirva dados de uma trip `published` sem token — mantendo a localização dos participantes estritamente restrita a membros, como já é hoje. Isto é mais do que "wiring" de frontend; é uma decisão de arquitetura backend que prefiro validar contigo antes de a Fase 1 assumir que só vai mexer em React.

3. **O mesmo problema aplica-se ao Feed** (`FeedController.listFeed` exige sessão) **e aos Guias** (`GuideController` exige sessão em ambos os endpoints de leitura). São mudanças de backend relativamente simples (remover o `getUserIdOrNull()+401` da leitura, ou adicionar `permitAll()` no `SecurityConfig` para os GETs específicos), mas quero confirmar que concordas em incluir alterações de backend no âmbito deste trabalho — o pedido original descreve tudo em termos de componentes/frontend.

4. **Guias não tem hoje nenhuma área de navegação própria** — é uma aba dentro do painel de Amigos. A Fase 3 pede "ver Guias; abrir o perfil de um Guia" como se já existisse uma área explorável; hoje isso só é possível depois de já se ter entrado em Amigos. Construir uma área pública de Guias (fora de Amigos) é trabalho de UI novo, não uma correção de permissões — quero confirmar se isso está mesmo no âmbito desta fase ou se deve ficar para depois (mantendo Guias só acessível via Amigos, mas corrigindo a permissão de leitura no backend para não ser 401 quando chamado de um contexto sem sessão).

5. **"Otimizar ordem" hoje está aberto a qualquer participante, não só ao host** (`TripItineraryTab.jsx:267`, sem check de owner). A Fase 5 pede que seja exclusivo do host — isto é uma mudança de comportamento real (algo deixa de estar disponível para participantes não-host que hoje conseguem usá-lo), não só arrumação de código. Confirmo que quero mesmo restringir isto, e não apenas documentar o estado atual.

6. **Bug pré-existente em `PoiModal.jsx:456`** (`onFav` sem gate, favorito fica "guardado" localmente sem nunca persistir para visitantes) — não fazia parte do pedido original de Fases, mas é uma correção natural de se fazer durante a Fase 1/3 (mesma família de bug que a Fase 3 já pede para tratar em Favoritos). Vou corrigi-lo durante a Fase 1 salvo indicação em contrário.

7. **Bug pré-existente em `UserProfileModal.jsx`** (perfil de outro utilizador, "Adicionar amigo" sem gate para visitantes) — idem, proponho corrigir durante a Fase 3 (Amigos), já que a Fase 3 pede explicitamente que ações de amizade abram o modal de login para visitantes.

---

**Fim da Fase 0. A aguardar validação antes de avançar para a Fase 1.**
