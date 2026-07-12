# Codebase Cleanup Audit — Portugal na Mão
> Gerado em 2026-07-08. Auditoria estática; sem alterações de código.

---

## Sumário Executivo

O codebase está funcional e bem estruturado para a sua escala. As principais preocupações são:

1. **Bug real** em `DistrictDrawer` — `flyTo` não está no destructuring mas é chamado.
2. **Duplicação de utilitários** em 3 lugares (`tripPoiIds`, `hasCoords`, `toastStyle`).
3. **`AppContext` muito grande** (700 linhas, 40+ exports) — funciona mas é frágil de manter.
4. **`PoiModal` muito grande** (789 linhas) — mistura exibição, edição, upload, comentários, SIPA.
5. **DTOs órfãos no backend** — pasta `/api/dto/` raiz duplica subpastas sem ser usada.
6. **Importações de `mockData.js`** em componentes de produção.

---

## 1. Componentes Grandes / Responsabilidades Múltiplas

### Frontend

| Ficheiro | Linhas | Problema |
|---|---|---|
| `AppContext.jsx` | 700 | Auth + districts + POIs + favorites + trips + friends + 17 UI panels + tour + lang — tudo num único Provider |
| `PoiModal.jsx` | 789 | Loading + gallery + SIPA display + edit form + photo upload + comments + nearby POIs |
| `TripsPanel.jsx` | 640 | Lista de viagens + detalhe + chat + itinerário com drag-and-drop |
| `AuthModal.jsx` | 408 | Login + registo + reset password + verify email — 4 fluxos distintos num componente |
| `FriendsPanel.jsx` | 317 | Lista de amigos + pedidos pendentes + pesquisa + aceitar/rejeitar |

**Análise AppContext:** O `useMemo` final tem 70+ dependências. Se uma for adicionada ao `value` e esquecida no array de deps, é um bug silencioso. O context re-renderiza qualquer consumidor que mude **qualquer** um destes valores, o que pode causar renders desnecessários.

### Backend

| Ficheiro | Linhas | Problema |
|---|---|---|
| `TripService.java` | 416 | Create + list + participants + POIs + messages + cover upload — cresceu muito |
| `PoiService.java` | 379 | CRUD + media + SIPA enrichment + permissão logic |
| `MediaItemService.java` | 334 | OK — responsabilidade única e bem delimitada |

---

## 2. Código Duplicado

### 2a. `tripPoiIds` — definida em 3 lugares

```
MapExplorer.jsx:161    function tripPoiIds(trip) { ... }        ← sem fallback trip.poiIds
TripsPanel.jsx:23      function tripPoiIds(trip) { ... }        ← sem fallback trip.poiIds
mockData.js:348        export function tripPoiIds(trip) { ... } ← COM fallback trip.poiIds
```

Piora: `FavMapBanner.jsx`, `TourPlayer.jsx` e `TripPicker.jsx` importam de `mockData.js` (ficheiro de dados de teste em produção).

**Solução sugerida:** Mover `tripPoiIds` para `src/lib/tripUtils.js` e importar de lá em todo o lado.

### 2b. `hasCoords` — definida em 2 lugares com interfaces diferentes

```
MapExplorer.jsx:10   function hasCoords(p) — checa p.lat / p.lon diretamente (não é importada de geo.js)
geo.js:29            export function hasCoords(poi) — usa getCoords() com fallbacks lat/latitude/lng
```

A `geo.js` já existe e é mais robusta. `MapExplorer` reimplementa a lógica em vez de importar.

**Solução sugerida:** `MapExplorer` deve importar `hasCoords` de `geo.js`.

### 2c. `toastStyle` — definida em 5 lugares

```
CreatePoiModal.jsx:9    const toastStyle = { background: "#0A1A12", color: "#F4F4EE", border: "1px solid #1F3826" };
AdminPanel.jsx:8        const toastStyle = { ... };   (idêntico)
FriendsPanel.jsx:9      const toastStyle = { ... };   (idêntico)
PoiModal.jsx:273        const toastStyle = { ... };   (idêntico, dentro do componente)
PoiModal.jsx:339        { style: { background: "#0A1A12", ... } }  (inline, idêntico)
```

**Solução sugerida:** Extrair para `src/lib/ui.js` como `export const TOAST_STYLE = { ... }`.

### 2d. Photo upload UI duplicada

`CreatePoiModal.jsx` (linhas 186-203) e `PoiModal.jsx` (linhas 573-588) têm uma grelha de pré-visualização de fotos estruturalmente idêntica:
- botão de upload com ícone `ImagePlus`
- grelha de miniaturas `w-20 h-20`
- botão de remover foto com hover-overlay

**Solução sugerida:** Extrair para componente `<ImageUploadGrid>`.

### 2e. Category picker duplicado

`CreatePoiModal.jsx` (linhas 153-164) e `PoiModal.jsx` (linhas 533-547) têm o seletor de categoria para `GROUPS.comercial.items` com lógica e markup quase idênticos.

**Solução sugerida:** Extrair para componente `<CategoryPicker categories={items} value={...} onChange={...}>`.

---

## 3. Bugs Encontrados

### 🔴 BUG REAL: `flyTo` não destruturado em `DistrictDrawer`

**Ficheiro:** `DistrictDrawer.jsx:22` e `:217`

```js
// Linha 22 — destructuring:
const { selectedDistrictId, closeDistrict, lang, t, textOf, openPoi, districtById, viewDistrictOnMap } = useApp();
//                                                                                     ↑ flyTo NÃO ESTÁ AQUI

// Linha 217 — uso:
onClick={() => { if (p.lat != null && p.lon != null) flyTo(p.lat, p.lon, 13); openPoi(p.id); }}
//                                                    ↑ ReferenceError silencioso
```

Clicar num POI dentro do DistrictDrawer não faz `flyTo` — lança `ReferenceError: flyTo is not defined`. O comportamento varia: pode simplesmente abrir o modal sem centrar o mapa.

**Fix imediato (1 linha):** Adicionar `flyTo` ao destructuring na linha 22.

---

## 4. useEffect / Hooks Frágeis

### 4a. `eslint-disable-line react-hooks/exhaustive-deps` — 10 ocorrências

| Ficheiro | Linha | Deps omitidas | Risco |
|---|---|---|---|
| `MapExplorer.jsx:94` | `BboxLoader` mount | `load` (estável, é `useCallback`) | Baixo — intencional |
| `MapExplorer.jsx:100` | district filter reload | `load`, `map` | Baixo — `map` de `useMapEvents` é estável |
| `MapExplorer.jsx:185` | `PoiMarkers` mount | `updateMapState` | Baixo — mount-only correto |
| `MapExplorer.jsx:272` | `FitBounds` | `favPois`, `trips`, `resolvePoi` | **MÉDIO** — se POIs mudarem com `favMapMode` ativo, os bounds não atualizam |
| `TripsPanel.jsx:290` | `tripsOpen` effect | `resolvePoi`, `cacheOnePoi`, `trips`, `fetchPoiById` | Baixo — mount-on-open intencional |
| `DistrictDrawer.jsx:78` | district load | `district` (objeto completo) | Baixo — `selectedDistrictId` como chave é correto |
| `PoiModal.jsx:269` | POI load | `resolvePoi` | Baixo — `selectedPoiId` como chave é correto |
| `TourPlayer.jsx:16` | tour fly | `poi`, `flyTo` | Baixo — deps são stale mas `tourIndex`/`tourTripId` mudam quando necessário |
| `TourPlayer.jsx:25` | auto-advance | múltiplos | Baixo — intervalo é rebuild correto |
| `PrivateChatPanel.jsx:31` | chat load | múltiplos | Baixo — `friend?.id` como chave é correto |

### 4b. `FitBounds` não reage a mudanças de POIs

`MapExplorer.jsx:260-273`: O effect dispara ao mudar `favMapMode`/`tripMapId`. Se os POIs favoritos ainda estiverem a carregar quando `favMapMode` ativa, os bounds podem ser calculados com lista parcial.

### 4c. `SearchOverlay` — shadowing do `t` translation

`SearchOverlay.jsx:49`:
```js
const t = setTimeout(() => search(q), 300);
```
A variável local `t` (timeout handle) faz shadow da função `t` (translate) importada do contexto. Não causa bug porque `t` translation não é usada nesse bloco, mas é confuso.

### 4d. `BboxLoader` usa `districtRef` para evitar stale closure

`MapExplorer.jsx:74-101`: Padrão correto — ref updated via useEffect. Sem problema.

---

## 5. Estado Duplicado ou Confuso

### 5a. `favorites` Set + `favoriteDtos` Array em sync manual

`AppContext.jsx:58-59`:
```js
const [favorites, setFavorites] = useState(() => new Set());
const [favoriteDtos, setFavoriteDtos] = useState([]);
```
Os dois representam os mesmos dados. Numa operação de `toggleFav` (erro), o `Set` é revertido mas os DTOs podem não ser. Na operação de adição, faz `fetchFavorites()` completo para atualizar os DTOs mas atualiza o Set otimisticamente. Se o fetch falhar depois do Set estar atualizado, ficam dessincronizados.

### 5b. Trips hybrid (API + localStorage) — extras podem divergir

`AppContext.jsx:18-40`: O sistema de "extras" locais (days, itinerary, messages) é explícito e documentado. O risco é a função `saveTripExtras` que depende de `trips.length > 0` para disparar — se `trips` esvaziar por erro de API, os extras são perdidos do localStorage.

### 5c. `AppContext` tem 17+ estados UI booleanos

```js
searchOpen, authOpen, favOpen, tripsOpen, profileOpen, friendsOpen,
adminOpen, favMapMode, notifOpen, filterSheetOpen, layerSheetOpen,
createPoiOpen, tripsInitialId, plannerTripId, tripMapId, shareId, tripPickerId
```
Cada um destes é um `useState` separado. Com um único context, qualquer mudança de qualquer um re-renderiza todos os consumidores. Dependendo de como os componentes consomem o context, isto pode ser ineficiente (embora React memo possa mitigar).

---

## 6. Lógica de Mapa — Análise Específica

### 6a. Arquitetura do Map — bem estruturada

`MapExplorer.jsx` usa corretamente sub-componentes do react-leaflet:
- `MapBridge` — expõe instância ao context ✓
- `CameraController` — consome `flyTarget` com timestamp anti-repetição ✓
- `BboxLoader` — debounced, com AbortController ✓
- `DistrictLayer` — usa refs para evitar remount em cada render ✓
- `PoiMarkers` — filtros in-memory, tooltips dinâmicos ✓
- `FitBounds` — reage a mudanças de modo ✓
- `TripRoute` — polyline ✓

### 6b. `BASE_TILES` — todos os layers têm o mesmo URL

`MapExplorer.jsx:37-41`:
```js
const BASE_TILES = {
  exploracao: "https://server.arcgisonline.com/...World_Imagery...",
  imersivo:   "https://server.arcgisonline.com/...World_Imagery...",   // ← IGUAL
  satelite:   "https://server.arcgisonline.com/...World_Imagery...",   // ← IGUAL
};
```
Os três são idênticos. A diferença `imersivo` vs `exploracao` é cosmética (vinheta CSS no overlay), não de tile. O layer `historico` é tratado como alias de `exploracao` (linha 288). Podia ser simplificado.

### 6c. `DistrictLayer` faz remount forçado via `key`

`MapExplorer.jsx:151`:
```jsx
key={`${districtsReady ? "ready" : "init"}-${activeDistrictId ?? "none"}`}
```
Correto e intencional — remonta para refletir estilos de distrito ativo. A alternativa seria `resetStyle()` manual em cada feature, mas a abordagem de key é mais simples e segura.

### 6d. `PoiMarkers` acumula `mapPois + visibleUser` sem deduplicação

`MapExplorer.jsx:205`:
```js
const base = [...mapPois, ...visibleUser];
```
Se um POI de negócio do utilizador também aparecer no bbox load (status ACTIVE), pode aparecer em duplicado. Há uma guarda em `visibleUser` (filtra por status/admin/owner) mas não evita o merge duplicado.

### 6e. Point-in-polygon no frontend — aceitável mas pode ser lento

O filtro de distrito aplica `pointInGeo` a todos os POIs visíveis. Com 5000 POIs e polígonos MultiPolygon complexos, pode ser lento. O backend já filtra por `districtId` no bbox, pelo que o filtro frontend é só para a malha do polígono — risco baixo no uso normal.

---

## 7. Lógica de Filtros

### 7a. Filtros frontend são claros

`PoiMarkers.jsx`:
- `activeTrip` → mostra só POIs da viagem (numbered markers)
- `favMapMode` → mostra só favoritos
- `activeCats.size > 0` → filtra por categorias específicas
- `filterGroup === "none"` → oculta tudo
- `filterGroup !== "all"` → filtra por grupo

A lógica está centralizada num `useMemo` e é legível. Sem duplicação.

### 7b. `CategoryChips` — medição de chips com `useLayoutEffect`

`CategoryChips.jsx:31-71`: Implementação sofisticada de measurement. Funciona corretamente. O padrão de `opacity: 0` durante medição evita flash.

---

## 8. Upload / Media — Análise Específica

### 8a. Três funções de upload separadas com FormData idêntico

`api.js`:
```js
uploadPoiMedia(poiId, file)     // POST /api/media/upload com entityType=POI
uploadTripCover(tripId, file)   // POST /api/trips/:id/cover
uploadAvatar(file)              // POST /api/me/avatar
uploadMedia(file)               // POST /api/media/upload genérico (não usado?)
```

As três primeiras têm implementação similar: `new FormData()`, `form.set("file", file)`, `apiFetch(..., POST)`. `uploadPoiMedia` difere por adicionar `entityType`, `entityId`, `mediaType`.

`uploadMedia` (genérico) existe mas não parece ser usado nos componentes principais. Pode ser dead code.

### 8b. Photo preview UI duplicada (já listado em §2d)

### 8c. `CreatePoiModal` faz upload sequencial de fotos

`CreatePoiModal.jsx:87-91`:
```js
for (const { file } of pendingPhotos) {
  try { await uploadPoiMedia(Number(created.id), file); } catch { /* noop */ }
}
```
Upload sequencial. Para muitas fotos, pode ser lento. Poderia usar `Promise.allSettled`. Risco baixo — o caso normal é 1-3 fotos.

---

## 9. CSS / Classes Repetidas

### 9a. Classes Tailwind repetidas em botões de action

O padrão `h-11 w-11 rounded-full glass flex items-center justify-center text-parchment hover:text-gold transition-colors` aparece dezenas de vezes em `PoiModal`, `TripsPanel`, `DistrictDrawer`, `ProfilePanel`, etc.

**Sugestão:** Definir `.btn-icon-glass` no CSS global como variante.

### 9b. Padrão de drawer/modal repetido

`TripsPanel`, `ProfilePanel`, `DistrictDrawer`, `FriendsPanel` partilham estrutura:
- `motion.div` backdrop overlay
- `motion.aside` `fixed top-0 right-0 bottom-... z-[14xx] w-full sm:w-[4xx]px glass border-l`
- `spring, damping: 30, stiffness: 260`

Candidato a componente `<SideDrawer>`. Mas só se houver múltiplos drawers a criar — atualmente já existem todos.

### 9c. `pn-scroll` class

A classe `.pn-scroll` é usada em todos os containers de scroll. Definida em CSS global. OK — uso consistente.

---

## 10. Backend — DTOs Orphãos

### 10a. `/api/dto/` raiz vs subpastas

A pasta raiz `/api/dto/` contém 20 ficheiros Java (DTOs antigos). As subpastas `/api/dto/auth/`, `/api/dto/poi/`, `/api/dto/trip/`, etc. contêm os DTOs ativos usados pelos controllers modernos.

**Verificação:** Apenas `UserProfileDto` da pasta raiz é importado ativamente (por `UserProfileController` e `UserProfileService`). Os outros DTOs raiz (`PoiDto`, `AuthResponseDto`, `FavoriteDto`, etc.) parecem estar duplicados pelas versões nas subpastas.

**Risco:** Se um controller importar acidentalmente `pt.dot.application.api.dto.PoiDto` em vez de `pt.dot.application.api.dto.poi.PoiDto`, compilará mas com tipo errado. O IDE pode auto-completar o errado.

### 10b. `PoiService.toDtoList` vs `toDtoDetail` — duplicação de mapeamento

Os dois métodos copiam os mesmos 17 campos. A única diferença é:
- `toDtoDetail` carrega media (imagens) e SIPA enrichment
- `toDtoList` passa `null` e `List.of()` para esses campos

Sugere um método `toBaseDto(Poi p)` com os campos comuns + parâmetros opcionais.

### 10c. `requireOwnerOrAdmin` vs `requireDeletePermission` — lógica idêntica

`PoiService.java:301-328`: Os dois métodos verificam `isAdmin || isOwner`. A única diferença é a mensagem de erro. Podia ser unificado.

### 10d. `MediaItemService.getResolvedUrls` vs `getStorageKeys` — estrutura 95% idêntica

Linhas 49-93: Dois métodos com o mesmo loop, mesma filtragem, mesma normalização. Diferem apenas em `resolved = mediaUrlService.resolve(...)` vs `key = item.getStorageKey()`. Poderia ser um método privado parametrizado.

---

## 11. Importações de `mockData.js` em Produção

Os seguintes componentes de produção importam de `src/data/mockData.js`:

| Componente | Import |
|---|---|
| `FavMapBanner.jsx` | `tripPoiIds` |
| `TourPlayer.jsx` | `tripPoiIds` |
| `TripPicker.jsx` | `getPoiById`, `tripPoiIds` |
| `ShareCard.jsx` | `getPoiById` |

`getPoiById` busca num array de POIs de teste hardcoded — em produção, sempre retorna `undefined` porque os POIs reais não estão em `POIS`. Isto significa que `ShareCard` e `TripPicker` podem estar a usar uma versão de `getPoiById` que nunca encontra nada.

**Verificar:** Como `TripPicker` usa `getPoiById` na linha 51: se retornar `undefined`, a flag `has` será `false` mesmo quando o POI já está na viagem.

---

## 12. Riscos Atuais (por prioridade)

| # | Risco | Severidade | Ficheiro | Impacto |
|---|---|---|---|---|
| 1 | **TripPicker nunca aparece em produção** | **BUG CRÍTICO** | `TripPicker.jsx:13` | Botão "Adicionar à viagem" não funciona — modal nunca renderiza |
| 2 | **ShareCard nunca aparece em produção** | **BUG CRÍTICO** | `ShareCard.jsx:13` | Botão "Partilhar" não funciona — modal nunca renderiza |
| 3 | `flyTo` não destruturado em `DistrictDrawer` | **BUG** | `DistrictDrawer.jsx:217` | Clique em POI de distrito não centra mapa |
| 4 | `favoriteDtos` e `favorites` podem divergir | MÉDIO | `AppContext.jsx:296-321` | UI pode mostrar estado de favorito errado |
| 5 | `FitBounds` com deps incompletas | MÉDIO | `MapExplorer.jsx:272` | Bounds não atualizam se POIs chegarem depois do modo ativo |
| 6 | DTOs raiz duplicados no backend | MÉDIO | `/api/dto/*.java` | Ambiguidade de importação pode criar bugs futuros |
| 7 | `AppContext` 70+ deps no useMemo | BAIXO | `AppContext.jsx:673-697` | Dep esquecida = value stale silencioso |
| 8 | Upload sequencial de fotos | BAIXO | `CreatePoiModal.jsx:87-91` | Lento com muitas fotos |

### Detalhe dos 2 bugs críticos

**Bug #1 e #2 — `getPoiById` de mockData em produção:**

`TripPicker.jsx:13` e `ShareCard.jsx:13`:
```js
const poi = tripPickerId ? getPoiById(tripPickerId) : null;
// getPoiById pesquisa no array POIS do mockData.js (POIs de teste hardcoded)
// Em produção, tripPickerId é um ID real (ex: 12345) — nunca existe em POIS
// → poi === undefined → o AnimatePresence {poi && ...} nunca renderiza o modal
```

O utilizador clica "Adicionar à viagem" ou "Partilhar" — o `tripPickerId`/`shareId` é definido no context, mas como `poi` é sempre `undefined`, o modal não aparece. A funcionalidade está **silenciosamente quebrada**.

**Fix correto:** Usar `resolvePoi(tripPickerId)` do AppContext (que pesquisa em `poiCache` + `userPois`) em vez de `getPoiById` do mockData.

---

## 13. Sugestões de Refactor — por Prioridade

### Prioridade Alta (bugs confirmados)

1. **🔴 Corrigir `TripPicker` e `ShareCard`** — substituir `getPoiById(id)` de mockData por `resolvePoi(id)` do AppContext. Estes modais estão silenciosamente quebrados em produção.
2. **🔴 Corrigir `flyTo` no `DistrictDrawer`** — adicionar `flyTo` ao destructuring (1 linha).
3. **Mover `tripPoiIds` para `src/lib/tripUtils.js`** — eliminar as 3 definições e as importações de `mockData.js`.
4. **Extrair `toastStyle`** para `src/lib/ui.js` — eliminar 5+ definições.

### Prioridade Média (duplicação real, sem bug)

5. **`MapExplorer` importar `hasCoords` de `geo.js`** — remover definição local.
6. **Limpar DTOs raiz no backend** — mover `UserProfileDto` para `/api/dto/profile/` e eliminar os orphãos.
7. **Extrair `<ImageUploadGrid>`** — reutilizar em `CreatePoiModal` e `PoiModal`.
8. **Extrair `<CategoryPicker>`** — reutilizar em `CreatePoiModal` e `PoiModal`.
9. **Backend: unificar `requireOwnerOrAdmin` e `requireDeletePermission`.**

### Prioridade Baixa (limpeza / qualidade)

10. **Simplificar `BASE_TILES`** — remover keys duplicadas, manter só o URL base.
11. **`uploadMedia` genérico no api.js** — verificar se é dead code e remover se sim.
12. **Renomear `mockData.js`** → `src/lib/localData.js` e mover só as funções utilitárias puras.
13. **Backend: refatorar `toDtoList`/`toDtoDetail` num único método com parâmetro `boolean detail`.**
14. **Backend: `MediaItemService.getResolvedUrls` vs `getStorageKeys`** — extrair loop comum.
15. **CSS: definir `.btn-icon-glass`** para reduzir repetição de classes Tailwind.
16. **Corrigir shadowing `t` em `SearchOverlay.jsx:49`** — renomear para `tid`.

### Não fazer agora (architecturais, alto risco)

- Partir `AppContext` em múltiplos contexts / Zustand — impacto total, benefício marginal nesta escala
- Reescrever `PoiModal` como componentes separados — alto risco, funciona corretamente
- Adicionar MapStruct ao backend — mudança de dependência desnecessária agora

---

## 14. Refactors Propostos (a aplicar só após aprovação)

Candidatos confirmados para refactors seguros:

```
src/lib/tripUtils.js         ← NOVO: tripPoiIds() movida de 3 lugares
src/lib/ui.js                ← NOVO: TOAST_STYLE constante
src/lib/geo.js               ← EXISTENTE: já tem hasCoords, MapExplorer deve importar daqui
src/components/DistrictDrawer.jsx  ← ADD flyTo ao destructuring (1 linha)
src/components/SearchOverlay.jsx   ← RENAME t = setTimeout → tid
src/lib/api.js               ← VERIFICAR uploadMedia é dead code
```

---

## Apêndice — Ficheiros Lidos

**Frontend (PT-portugal-na-mao-fe):**
- `src/App.js` (81 linhas)
- `src/context/AppContext.jsx` (700 linhas)
- `src/components/MapExplorer.jsx` (326 linhas)
- `src/components/PoiModal.jsx` (789 linhas)
- `src/components/TripsPanel.jsx` (640 linhas)
- `src/components/ProfilePanel.jsx` (253 linhas)
- `src/components/CreatePoiModal.jsx` (216 linhas)
- `src/components/CategoryChips.jsx` (156 linhas)
- `src/components/SearchOverlay.jsx` (157 linhas)
- `src/components/DistrictDrawer.jsx` (250 linhas)
- `src/lib/api.js` (411 linhas)
- `src/lib/categories.jsx` (95 linhas)
- `src/lib/geo.js` (39 linhas)
- `src/lib/sessionCache.js` (16 linhas)
- `src/data/mockData.js` (parcial — funções exportadas)

**Backend (portugal-na-mao-api):**
- `service/poi/PoiService.java` (379 linhas)
- `service/media/MediaItemService.java` (334 linhas)
- `service/trip/TripService.java` (416 linhas — parcial)
- `service/district/DistrictPoiQueryService.java` (parcial)
- `api/poi/PoiController.java` (68 linhas)
- Estrutura de DTOs: `/api/dto/` raiz + subpastas