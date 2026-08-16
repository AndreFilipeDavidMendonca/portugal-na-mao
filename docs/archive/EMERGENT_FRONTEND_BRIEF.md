# Portugal na Mão — Frontend Brief para Emergent

**Versão:** Julho 2026  
**Produto:** Portugal na Mão  
**Destinatário:** Emergent (geração de frontend premium)  
**Scope:** UI/UX completo. O backend real já existe e está operacional.

---

## 1. Visão do Produto

**Portugal na Mão** é uma plataforma de descoberta e curadoria do património português — castelos, palácios, igrejas, museus, miradouros, parques, trilhos e negócios locais (gastronomia, artesanato, alojamento, eventos).

A experiência centra-se num mapa interativo de Portugal como tela principal. O utilizador explora o país distrito a distrito, descobre pontos de interesse (POIs) com contexto histórico, imagens e dados de fontes abertas (OpenStreetMap, Wikidata, Wikimedia), guarda favoritos, planeia viagens colaborativas com amigos e partilha descobertas.

A ambição estética é de uma **experiência editorial premium**: não uma app de turismo de massas, mas um guia artístico e narrativo de Portugal — elegante, imersivo, com storytelling visual.

---

## 2. Público-Alvo

| Perfil | Descrição |
|---|---|
| Explorador curioso | Português ou estrangeiro que quer descobrir Portugal para além dos roteiros comuns |
| Viajante planeador | Organiza viagens detalhadas, guarda locais, coordena com amigos |
| Apaixonado por história | Interessa-se por arquitetura, arqueologia, heranças culturais |
| Criador de conteúdo local | Regista e partilha lugares (conta BUSINESS) |
| Curador / Admin | Modera POIs, valida dados, enriquece fichas |

---

## 3. Principais Áreas / Páginas

1. Mapa explorador (ecrã principal)
2. Detalhe de Distrito
3. Detalhe de POI
4. Pesquisa global
5. Favoritos
6. Viagens colaborativas (Trips)
7. Perfil de utilizador
8. Autenticação (Login / Registo / Reset)
9. Dashboard Admin/Curador (se existir área separada)

---

## 4. Páginas em Detalhe

### 4.1 Mapa Explorador (Home)

**Objetivo:** Ponto de entrada único. O utilizador vê Portugal no mapa, explora distritos e POIs visualmente.

**Dados necessários:**
- GeoJSON dos contornos de Portugal continental + ilhas
- GeoJSON das fronteiras dos 18 distritos
- Lista lite de POIs dentro da área visível (`bbox`), com categoria e coordenadas

**Endpoints:**
```
GET /api/pois/lite?bbox={minLon,minLat,maxLon,maxLat}&category={cat}&limit=2000
  → { pois: [{id, name, namePt, category, lat, lon, districtId, ownerId}], countsByCategory: {"castle": 42, ...} }

GET /api/search?q={texto}&limit=10&category={cat}
  → [{id, name, kind:"poi"|"district", category, lat, lon}]

GET /api/districts
  → [{id, code, name, namePt, lat, lon, ...}]
```

**Interações principais:**
- Hover sobre distrito: highlight visual do contorno
- Click em distrito: abre painel de detalhe do distrito
- Click em pin de POI: abre modal de detalhe do POI
- Barra de pesquisa global: autocomplete de POIs e distritos; ao selecionar, câmera voa para o local
- Filtro por categoria: chips filtráveis que mostram/escondem pins por tipo
- Filtro por distrito: colapsa o mapa para o distrito selecionado
- Botão "Favoritos": ativa modo mapa de favoritos
- Botão "Viagem": ativa modo mapa de viagem ativa

**Estados:**
- Loading: splash screen com vídeo de intro enquanto GeoJSON e dados carregam
- Vazio (sem POIs no bbox): mensagem "Sem locais nesta área"
- Erro de rede: toast de erro

---

### 4.2 Detalhe de Distrito

**Objetivo:** Contextualizar o distrito — história, estatísticas, galeria de imagens, lista de POIs internos com mapa dedicado.

**Dados necessários:**
- Metadata do distrito (nome, história, fundação, população, municípios, parishes)
- Ficheiros de media do distrito (imagens, vídeos)
- POIs lite dentro do bbox do distrito

**Endpoints:**
```
GET /api/districts/{id}
  → {id, code, name, namePt, population, foundedYear, lat, lon,
     description, inhabitedSince, history, municipalitiesCount,
     parishesCount, files: ["https://..."], sources: ["..."]}

GET /api/pois/lite?bbox={districtBbox}&category={cat}&limit=2000
  → {pois, countsByCategory}

PUT /api/districts/{id}  [ADMIN]
  → atualiza metadata do distrito
```

**Interações principais:**
- Galeria de imagens do distrito (slideshow / grid)
- Mini-mapa do distrito com pins de POI filtráveis por categoria
- Chips de categoria com contagem (`countsByCategory`)
- Click num POI do mini-mapa: abre modal de detalhe do POI
- Admin: editar metadata do distrito inline

**Estados:**
- Loading: skeleton do painel lateral + mapa a carregar pins
- Sem imagens: placeholder ilustrativo do distrito
- Sem POIs: "Ainda sem locais registados neste distrito"

---

### 4.3 Detalhe de POI

**Objetivo:** Ficha completa e imersiva de um ponto de interesse — identidade visual forte, história, dados técnicos, galeria de imagens, ações sociais.

**Dados necessários:**
- Dados completos do POI
- Lista de imagens associadas
- Comentários dos utilizadores
- Estado de favorito do utilizador atual

**Endpoints:**
```
GET /api/pois/{id}
  → {id, name, namePt, category, subcategory, description,
     lat, lon, architect, yearText, wikidataId, wikipediaUrl,
     osmId, osmType, source, image, images: ["https://..."],
     districtId, ownerId}

GET /api/pois/{id}/comments
  → [{id, poiId, userId, displayName, avatarUrl, text, createdAt}]

POST /api/pois/{id}/comments
  → {text}

DELETE /api/comments/{commentId}

GET /api/favorites/{poiId}
  → {isFavorite: true|false}

POST /api/favorites/{poiId}/toggle
  → {isFavorite: true|false}

PUT /api/pois/{id}  [OWNER ou ADMIN]
  → atualiza nome, descrição, imagens

DELETE /api/pois/{id}  [OWNER ou ADMIN]
```

**Dados do POI (campos relevantes para UI):**
| Campo | Descrição |
|---|---|
| `name` / `namePt` | Nome (PT prioritário na UI) |
| `category` | castle, palace, monument, museum, archaeology, church, viewpoint, park, trail, gastronomy, crafts, accommodation, event |
| `subcategory` | subcategoria textual livre |
| `description` | texto descritivo (pode ser longo) |
| `yearText` | ex: "séc. XII", "1147", "c. 1500" |
| `architect` | nome do arquiteto |
| `wikidataId` | identificador Wikidata (ex: Q12345) |
| `wikipediaUrl` | link para Wikipedia |
| `image` / `images[]` | URLs de imagens (CDN Cloudflare R2) |
| `sipaId` / `sipaUrl` | referência ao Sistema de Informação do Património Arquitetónico (Portugal) |
| `osmId` / `osmType` | referência OpenStreetMap |

**Interações principais:**
- Galeria de imagens em fullscreen / swipe
- Toggle favorito (coração)
- Partilhar com amigo (abre lista de amigos, envia via chat)
- Adicionar a viagem (seleciona trip existente ou cria nova)
- Secção de comentários com texto livre
- Link para Wikipedia / Wikidata / SIPA
- Coordenadas com link para abrir no Maps externo
- Admin/Owner: editar título, descrição, imagens

**Estados:**
- Loading: skeleton da ficha enquanto dados chegam
- Sem imagens: imagem placeholder por categoria
- Sem descrição: "Sem descrição disponível"
- Sem comentários: "Sê o primeiro a comentar"
- Erro ao favoritar: toast de erro

---

### 4.4 Pesquisa Global

**Objetivo:** Encontrar qualquer POI ou distrito por nome, com filtros por categoria.

**Endpoints:**
```
GET /api/search?q={texto}&limit=10&category={cat}
  → [{id, name, kind:"poi"|"district", category, lat, lon}]
```

**Interações:**
- Campo de pesquisa com autocomplete instantâneo
- Resultados agrupados por tipo (distritos / POIs) ou por categoria
- Click num resultado: voa o mapa para o local e abre o detalhe
- Filtro de categoria junto à barra de pesquisa

**Estados:**
- Loading: spinner inline no campo
- Sem resultados: "Sem resultados para '{query}'"
- Erro: toast

---

### 4.5 Favoritos

**Objetivo:** Coleção pessoal de POIs guardados, visualizável em modo lista ou mapa.

**Endpoints:**
```
GET /api/favorites
  → [{poiId, poiName, category, lat, lon, image, savedAt}]

DELETE /api/favorites/{poiId}

POST /api/favorites/{poiId}/toggle
```

**Interações:**
- Modo lista: cards com imagem, nome, categoria, botão de remover
- Modo mapa: pins dos favoritos sobre o mapa de Portugal
- Click num favorito: abre detalhe do POI
- Remover favorito direto da lista

**Estados:**
- Lista vazia: ilustração + CTA "Explora o mapa e guarda os teus locais favoritos"
- Loading: skeletons de cards

---

### 4.6 Viagens (Trips)

**Objetivo:** Planear e gerir viagens colaborativas com amigos — lista de locais a visitar, chat de grupo, membros.

**Endpoints:**
```
GET /api/trips
  → [{id, name, createdAt, participantCount, poiCount}]

POST /api/trips
  → {name}

GET /api/trips/{tripId}
  → {id, name, participants: [...], pois: [...], messages: [...]}

POST /api/trips/{tripId}/pois
  → {poiId}

DELETE /api/trips/{tripId}/pois/{poiId}

GET /api/trips/{tripId}/messages
POST /api/trips/{tripId}/messages
  → {text}

POST /api/trips/{tripId}/participants
  → {userId}

DELETE /api/trips/{tripId}/leave
DELETE /api/trips/{tripId}/participants/{userId}

DELETE /api/trips/{tripId}
```

**Estrutura de uma Trip:**
- Nome da viagem
- Lista de participantes (com avatar e displayName)
- Lista de POIs guardados (com imagem, nome, categoria)
- Chat de grupo com histórico de mensagens

**Interações:**
- Dashboard de viagens: lista de viagens do utilizador
- Criar nova viagem com nome
- Abrir viagem: ver POIs no mapa + chat lateral + gestão de membros
- Adicionar POI à viagem a partir da ficha de um POI
- Remover POI da viagem
- Enviar mensagem no chat da viagem
- Convidar amigo para a viagem (da lista de amigos)
- Sair ou apagar viagem

**Estados:**
- Sem viagens: "Ainda não tens viagens. Cria a tua primeira!"
- Viagem sem POIs: "Adiciona locais enquanto exploras o mapa"
- Chat vazio: "Começa a conversa com os teus companheiros"

---

### 4.7 Perfil de Utilizador

**Objetivo:** Identidade do utilizador, estatísticas de exploração, amigos.

**Endpoints:**
```
GET /api/profile/me
GET /api/profile/{userId}
  → {id, displayName, avatarUrl, explorerTitle, explorerTagline,
     friendCount, tripCount, favouriteCount,
     categoryPercentages: {"castle": 42.0, "museum": 18.5, ...},
     topCategories: ["castle", "museum", "viewpoint"]}

GET /api/me
  → {id, email, displayName, avatarUrl, role, firstName, lastName, age, nationality, phone}

PATCH /api/me
  → {displayName?, avatarUrl?, firstName?, lastName?, age?, nationality?, phone?, newPassword?}

POST /api/me/avatar  [multipart]
  → atualiza avatar

GET /api/friendships
  → [{friendId, displayName, avatarUrl, friendshipId, status}]

GET /api/friendships/pending
POST /api/friendships/request  → {targetUserId}
POST /api/friendships/{id}/accept
POST /api/friendships/{id}/reject
DELETE /api/friendships/{id}
```

**Interações:**
- Avatar e nome editáveis
- Título de explorador automático (gerado pelo backend com base nos favoritos, ex: "Caçador de Castelos")
- Tagline automático ("Explorei 14 locais em 3 distritos")
- Gráfico ou visual de categorias preferidas (percentagens)
- Lista de amigos com estado (pendente / aceite)
- Enviar pedido de amizade por ID ou pesquisa
- Ver perfil público de outro utilizador

**Estados:**
- Perfil próprio: modo de edição disponível
- Perfil alheio: apenas leitura + opção de adicionar amigo
- Sem favoritos: estatísticas zeradas

---

### 4.8 Autenticação

**Fluxo:** Registo → verificação de email → login → JWT token armazenado localmente.

**Endpoints:**
```
POST /api/register   → {email, password, firstName, lastName, age, nationality, phone, role}
POST /api/login      → {email, password}  →  {token, user}
GET  /api/auth/verify-email?token={token}
POST /api/auth/resend-verification   → {email}
POST /api/auth/password-reset/request   → {email}
POST /api/auth/password-reset/confirm   → {token, newPassword}
```

**Roles:**
- `USER`: utilizador padrão
- `BUSINESS`: pode criar POIs comerciais (gastronomia, alojamento, artesanato, evento)
- `ADMIN`: acesso total, edição de qualquer POI e distrito

**Interações:**
- Modal de login/registo integrado no fluxo do mapa (não redireciona para página separada)
- Verificação de email com página dedicada (`/verify-email?token=...`)
- Reset de password com página dedicada (`/reset-password?token=...`)

---

### 4.9 Chat entre Amigos

**Objetivo:** Partilha direta de POIs e mensagens entre utilizadores.

**Endpoints:**
```
POST /api/chat/with/{friendUserId}   → {conversationId}
GET  /api/chat/{conversationId}/messages
POST /api/chat/{conversationId}/messages  → {text, type:"TEXT"|"POI_SHARE", poiId?}
```

**Interações:**
- Aceder ao chat a partir do perfil de um amigo
- Partilhar POI diretamente de uma ficha de POI
- Mensagem com preview do POI partilhado (imagem, nome, categoria)

---

### 4.10 Criação de POI (Conta BUSINESS)

**Objetivo:** Utilizador com role BUSINESS pode registar o seu negócio ou local como POI.

**Endpoints:**
```
POST /api/pois   → {name, description, category, lat, lon, image, images[]}
POST /api/media/upload  [multipart]  → {url, storageKey, contentType, sizeBytes}
GET  /api/geocode  → {lat, lon}  (via endereço)
```

**Fluxo:**
1. Inserir nome e categoria (comercial obrigatório)
2. Inserir morada (geocoding automático para coordenadas)
3. Fazer upload de imagens
4. Submeter (status inicial: `PENDING` → aguarda aprovação ADMIN)

---

## 5. Entidades Principais

### POI
```json
{
  "id": 1234,
  "name": "Castelo de Guimarães",
  "namePt": "Castelo de Guimarães",
  "category": "castle",
  "subcategory": "Medieval Castle",
  "description": "Castelo medieval do século X...",
  "lat": 41.4425,
  "lon": -8.2944,
  "architect": null,
  "yearText": "séc. X",
  "wikidataId": "Q901827",
  "wikipediaUrl": "https://pt.wikipedia.org/wiki/Castelo_de_Guimarães",
  "osmId": 123456,
  "osmType": "way",
  "sipaId": "PT031306010001",
  "sipaUrl": "http://www.monumentos.gov.pt/...",
  "source": "osm",
  "image": "https://cdn.ptdot.app/poi/1234/main.jpg",
  "images": ["https://..."],
  "districtId": 8,
  "ownerId": null
}
```

**Categorias disponíveis:**
| Grupo | Categorias |
|---|---|
| Cultura | `castle`, `palace`, `monument`, `museum`, `archaeology`, `church` |
| Natureza | `viewpoint`, `park`, `trail` |
| Comercial | `gastronomy`, `crafts`, `accommodation`, `event` |

**Publication Status:** `ACTIVE` (visível), `PENDING` (aguarda aprovação), `INACTIVE`, `DISABLED`

---

### Distrito
```json
{
  "id": 8,
  "code": "PT-03",
  "name": "Braga",
  "namePt": "Braga",
  "population": 848185,
  "foundedYear": 1835,
  "lat": 41.5510,
  "lon": -8.4260,
  "description": "Distrito do noroeste português...",
  "inhabitedSince": "séculos antes de Cristo",
  "history": "Texto histórico longo...",
  "municipalitiesCount": 14,
  "parishesCount": 519,
  "files": ["https://cdn.ptdot.app/districts/braga_1.jpg"],
  "sources": ["Wikipedia", "INE"]
}
```

---

### Utilizador (AppUser)
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "displayName": "Ana Silva",
  "avatarUrl": "https://cdn.ptdot.app/user/uuid/avatar.jpg",
  "role": "USER",
  "firstName": "Ana",
  "lastName": "Silva",
  "age": 32,
  "nationality": "Portuguesa",
  "phone": "+351 912 345 678"
}
```

**Perfil público (UserProfileDto):**
```json
{
  "id": "uuid",
  "displayName": "Ana Silva",
  "avatarUrl": "https://...",
  "explorerTitle": "Caçadora de Castelos",
  "explorerTagline": "Explorei 23 locais em 6 distritos",
  "friendCount": 12,
  "tripCount": 3,
  "favouriteCount": 23,
  "categoryPercentages": {"castle": 52.1, "museum": 21.7},
  "topCategories": ["castle", "museum", "viewpoint"]
}
```

---

### Favorito
```json
{
  "poiId": 1234,
  "poiName": "Castelo de Guimarães",
  "category": "castle",
  "lat": 41.4425,
  "lon": -8.2944,
  "image": "https://...",
  "savedAt": "2026-06-15T10:30:00Z"
}
```

---

### Trip (Viagem)
```json
{
  "id": "uuid",
  "name": "Norte de Portugal — Agosto",
  "createdAt": "2026-07-01T08:00:00Z",
  "participants": [
    {"userId": "uuid", "displayName": "Ana", "avatarUrl": "https://..."}
  ],
  "pois": [
    {"poiId": 1234, "poiName": "Castelo de Guimarães", "category": "castle", "image": "https://..."}
  ],
  "messages": [
    {"id": "uuid", "userId": "uuid", "displayName": "Ana", "text": "Vamos aqui primeiro!", "createdAt": "..."}
  ]
}
```

---

### MediaItem (imagem/vídeo)
- Armazenado em Cloudflare R2 (CDN)
- URLs públicas diretas (`https://cdn.ptdot.app/...`)
- Upload via `POST /api/media/upload` (multipart)
- Tipos: imagem (jpg/png/webp), vídeo

---

## 6. Fluxos Principais

### 6.1 Explorar o Mapa
1. App carrega: splash screen com vídeo de intro enquanto GeoJSON e dados inicializam
2. Mapa de Portugal aparece com distritos clicáveis (contornos hoverable)
3. Utilizador faz zoom → pins de POIs aparecem no viewport
4. Utilizador pode filtrar por categoria (chips no topo ou lateral)
5. Utilizador clica num distrito → painel lateral com história e mini-mapa do distrito
6. Utilizador clica num pin → modal de detalhe do POI

### 6.2 Pesquisar Património
1. Utilizador clica na barra de pesquisa
2. Escreve nome (ex: "Jerónimos")
3. Autocomplete mostra resultados em tempo real (misto POIs + distritos)
4. Utilizador seleciona resultado → câmera voa para coordenadas
5. Modal de detalhe do POI ou distrito abre automaticamente

### 6.3 Abrir Detalhe de POI
1. Click num pin de mapa ou num resultado de pesquisa
2. Loading spinner com nome do POI
3. Modal abre com: galeria de imagens, nome, categoria, descrição, dados históricos
4. Secções: Arquitetura, História, Localização, Comentários, Ações (favoritar, partilhar, adicionar à viagem)
5. Links externos: Wikipedia, Wikidata, SIPA, OpenStreetMap

### 6.4 Filtrar por Categoria
1. Utilizador clica num chip de categoria (ex: "Castelos")
2. Pins no mapa filtram para mostrar apenas essa categoria
3. Contador de resultados atualiza
4. Múltiplas categorias podem ser selecionadas simultaneamente

### 6.5 Ver Locais Próximos
1. A partir de um POI aberto, secção "Próximo daqui"
2. Sistema usa `bbox` centrado nas coordenadas do POI atual
3. Lista ou mini-mapa com pins próximos
4. Click abre novo detalhe de POI (stack de navegação)

### 6.6 Favoritos
1. Utilizador clica no coração em qualquer POI → toggle instantâneo (otimista)
2. Acede à área de Favoritos via menu do utilizador
3. Vê lista de POIs guardados com imagem e categoria
4. Pode ativar "Modo Mapa de Favoritos" → pinos dos favoritos sobre mapa de Portugal
5. Clica num pino → abre detalhe do POI

### 6.7 Viagens Colaborativas
1. Utilizador cria nova viagem com nome
2. Ao explorar o mapa, em cada POI pode clicar "Adicionar à Viagem"
3. Seleciona a viagem (ou cria nova)
4. Convida amigos para a viagem (da sua lista de amigos)
5. Dashboard da viagem: lista de POIs, chat de grupo, membros
6. "Ver no Mapa" mostra pins da viagem sobre o mapa de Portugal

### 6.8 Dashboard Admin/Curador
1. Utilizador com role ADMIN tem acesso a funcionalidades extra:
   - Editar metadata de qualquer POI (nome, descrição, imagens)
   - Editar metadata de qualquer distrito (história, imagens, fontes)
   - Aprovar/rejeitar POIs submetidos por utilizadores BUSINESS (status PENDING → ACTIVE)
   - Ver POIs por status de publicação
2. Não existe rota separada de admin na versão atual — as ações admin aparecem inline nas fichas existentes quando o utilizador tem role ADMIN

---

## 7. Dados para Mock (Protótipo Emergent)

O Emergent pode usar mock data / fake API para demonstração. Estes são os dados mínimos a mockar:

### Mock POIs (20–30 exemplos representativos)
```json
[
  {"id":1, "name":"Castelo de Guimarães", "category":"castle", "lat":41.4425, "lon":-8.2944, "image":"https://upload.wikimedia.org/...", "description":"Castelo medieval..."},
  {"id":2, "name":"Torre de Belém", "category":"monument", "lat":38.6916, "lon":-9.2160, "image":"..."},
  {"id":3, "name":"Mosteiro dos Jerónimos", "category":"church", "lat":38.6975, "lon":-9.2065, "image":"..."},
  {"id":4, "name":"Palácio da Pena", "category":"palace", "lat":38.7877, "lon":-9.3908, "image":"..."},
  {"id":5, "name":"Museu Nacional de Arte Antiga", "category":"museum", "lat":38.7047, "lon":-9.1571, "image":"..."},
  {"id":6, "name":"Miradouro da Serra do Pilar", "category":"viewpoint", "lat":41.1407, "lon":-8.6093, "image":"..."},
  {"id":7, "name":"Parque Nacional Peneda-Gerês", "category":"park", "lat":41.7472, "lon":-8.1555, "image":"..."},
  {"id":8, "name":"Adega Cooperativa de Palmela", "category":"gastronomy", "lat":38.5691, "lon":-8.9015, "image":"..."}
]
```

### Mock Distritos (18 distritos com coordenadas)
Lisboa (38.72, -9.14), Porto (41.15, -8.61), Braga (41.55, -8.42), Évora (38.57, -7.91), Faro (37.02, -7.93), Coimbra (40.20, -8.41), Setúbal (38.52, -8.89), Santarém (39.23, -8.68), Leiria (39.74, -8.80), Viseu (40.66, -7.91), Aveiro (40.64, -8.65), Castelo Branco (39.82, -7.49), Bragança (41.81, -6.76), Viana do Castelo (41.69, -8.83), Vila Real (41.30, -7.74), Guarda (40.54, -7.27), Beja (38.01, -7.86), Portalegre (39.29, -7.43)

### Mock Utilizador Autenticado
```json
{"id":"usr-001","displayName":"Ana Exploradora","avatarUrl":"...","role":"USER","explorerTitle":"Caçadora de Castelos","explorerTagline":"Explorei 23 locais em 6 distritos","favouriteCount":23,"tripCount":2,"friendCount":8}
```

### Mock Favoritos
Array com 5–10 POIs da lista acima.

### Mock Trip
```json
{"id":"trip-001","name":"Norte — Verão 2026","participants":[{"displayName":"Ana"},{"displayName":"João"}],"pois":[POI#1, POI#6, POI#7],"messages":[{"displayName":"Ana","text":"Partimos na sexta!"}]}
```

### Mock Categorias com Counts
```json
{"castle":248,"church":512,"monument":143,"museum":87,"palace":34,"viewpoint":201,"park":156,"trail":89,"archaeology":63,"gastronomy":312,"accommodation":178,"crafts":94,"event":27}
```

---

## 8. Limites Importantes

| Limite | Detalhe |
|---|---|
| **Backend real já existe** | API Spring Boot operacional em produção. Não recriar lógica de negócio. |
| **Autenticação é JWT** | Token enviado em `Authorization: Bearer {token}`. Sem sessions. |
| **Imagens são CDN externo** | URLs diretas (Cloudflare R2). Não é necessário servidor de imagens próprio. |
| **GeoJSON vem de ficheiros locais** | Os contornos de Portugal e distritos são ficheiros estáticos — não existe endpoint de API para eles. |
| **Mapa usa Leaflet** | A implementação real usa Leaflet + React-Leaflet. O Emergent pode usar qualquer lib (Mapbox, MapLibre, Leaflet) para o protótipo. |
| **Sem SSR obrigatório** | A app atual é SPA (Vite + React). O novo frontend pode ser Next.js ou SPA. |
| **CORS** | O backend aceita pedidos do domínio front autorizado. |
| **Rate limiting no login** | `/api/login` tem proteção contra brute-force. |
| **Email verificado obrigatório** | Login falha com `403 EMAIL_NOT_VERIFIED` se email não foi confirmado. |
| **Roles** | `USER` (explorador), `BUSINESS` (cria POIs comerciais), `ADMIN` (curadoria total). |
| **POI Publication Status** | Apenas POIs com `ACTIVE` são visíveis ao público. `PENDING` aguarda aprovação ADMIN. |

---

## 9. Liberdade Criativa

O Emergent **não deve** copiar a UI atual. O objetivo é criar algo premium e distinto.

### Direção Estética
- **Não é uma app de turismo.** É um atlas artístico digital de Portugal.
- Tipografia editorial: serifa elegante para títulos, sans-serif clean para body
- Paleta sugerida: tons de pedra e pergaminho, ouro antigo, verde-escuro, fundos muito escuros (quase preto azulado)
- Fotografias como protagonistas — imagens devem dominar, texto é complemento
- Animações cinematográficas: transições de mapa suaves, parallax, zoom com easing
- Pins de mapa com design próprio por categoria (não pins genéricos)

### Mobile-First
- O mapa ocupa o ecrã inteiro em mobile
- Navegação via bottom sheet / drawer em vez de sidebar
- Swipe-up para abrir detalhe de POI
- Swipe para navegar galeria de imagens
- Barra de pesquisa integrada no topo do mapa

### Mapa como Elemento Central
- O mapa nunca desaparece — é a tela de fundo da experiência
- Detalhes de POI e distrito abrem como overlays sobre o mapa
- Transições de câmera suaves ao navegar entre locais
- Layers visuais: contornos de distritos, relevo, pins com ícones

### Storytelling
- Ficha de POI não é uma lista de dados — é uma narrativa
- "Construído no século XII por..." / "Palco de..." / "Classificado como..."
- Dados de Wikidata e SIPA enriquecem a narrativa automaticamente
- Campo `yearText` e `description` são a base do storytelling

### Visão Futura (informação para o Emergent antecipar)
- Módulo de reconstrução histórica 3D (vista de como o local era no séc. XII)
- Camadas de mapas históricos sobrepostos
- Tours guiados (sequências de POIs com narração)
- Modo offline (PWA)
- Realidade aumentada em mobile (câmera aponta para monumento → info sobreposta)

---

## 10. Resumo Técnico da API

**Base URL:** `https://api.ptdot.app` (ou variável de ambiente)

**Autenticação:** `Authorization: Bearer {jwt_token}`

**Endpoints principais:**

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/pois/lite?bbox=&category=` | POIs lite para mapa |
| `GET` | `/api/pois/{id}` | Detalhe completo de POI |
| `GET` | `/api/pois/mine` | POIs do utilizador atual |
| `POST` | `/api/pois` | Criar POI (BUSINESS) |
| `PUT` | `/api/pois/{id}` | Atualizar POI |
| `DELETE` | `/api/pois/{id}` | Apagar POI |
| `GET` | `/api/pois/{id}/comments` | Comentários do POI |
| `POST` | `/api/pois/{id}/comments` | Adicionar comentário |
| `DELETE` | `/api/comments/{id}` | Apagar comentário |
| `GET` | `/api/districts` | Lista de distritos |
| `GET` | `/api/districts/{id}` | Detalhe de distrito |
| `PUT` | `/api/districts/{id}` | Atualizar distrito (ADMIN) |
| `GET` | `/api/search?q=&limit=&category=` | Pesquisa global |
| `GET` | `/api/favorites` | Lista de favoritos |
| `POST` | `/api/favorites/{poiId}/toggle` | Toggle favorito |
| `GET` | `/api/trips` | Minhas viagens |
| `POST` | `/api/trips` | Criar viagem |
| `GET` | `/api/trips/{id}` | Detalhe de viagem |
| `POST` | `/api/trips/{id}/pois` | Adicionar POI à viagem |
| `GET` | `/api/trips/{id}/messages` | Mensagens da viagem |
| `POST` | `/api/trips/{id}/messages` | Enviar mensagem na viagem |
| `GET` | `/api/friendships` | Lista de amigos |
| `POST` | `/api/friendships/request` | Enviar pedido de amizade |
| `POST` | `/api/chat/with/{userId}` | Iniciar chat direto |
| `GET` | `/api/profile/{userId}` | Perfil público |
| `GET` | `/api/me` | Utilizador atual |
| `PATCH` | `/api/me` | Atualizar perfil |
| `POST` | `/api/me/avatar` | Upload de avatar |
| `POST` | `/api/login` | Login |
| `POST` | `/api/register` | Registo |
| `POST` | `/api/media/upload` | Upload de media |
| `POST` | `/api/geocode` | Geocodificação por morada |

---

## Prompt Resumido para Emergent

```
Create a premium, cinematic web app called "Portugal na Mão" — a cultural heritage discovery platform for Portugal.

CONCEPT: An artistic, editorial-quality atlas of Portuguese heritage. Not a tourist app. Think of it as a luxury travel magazine transformed into an interactive map experience.

VISUAL DIRECTION:
- Dark, dramatic aesthetic: near-black backgrounds (#0D1117 or similar), gold accents (#C9A84C), deep stone grays, muted emerald greens
- Editorial typography: elegant serif for headings (Playfair Display, Cormorant Garant, or similar), clean sans-serif for body
- Full-bleed photography as protagonist — images dominate, text complements
- Cinematic transitions: smooth map camera movements, parallax, easing animations
- Custom map markers per heritage category (not generic pins)

CORE EXPERIENCE:
- Mobile-first
- The map IS the interface — it never disappears, always in the background
- POI and district details open as overlays/drawers over the map
- Swipe gestures on mobile (swipe-up to open POI, swipe left/right for gallery)

PAGES TO BUILD:
1. HOME (Map Explorer): Full-screen map of Portugal. Districts as clickable regions with hover highlights. POI pins grouped by category. Search bar overlaid on top. Category filter chips. 
2. DISTRICT DETAIL: Slide-in panel with district name, history, statistics (population, municipalities, founded year), photo gallery, mini-map with filtered POI pins.
3. POI DETAIL: Full-screen modal. Large image header, POI name, category badge, historical description, year/architect, gallery swipe, external links (Wikipedia, SIPA), favorite button, share button, add-to-trip button, comments section.
4. SEARCH: Full-screen overlay, instant autocomplete, results grouped as districts / heritage / nature / commercial.
5. FAVORITES: Personal collection — list view and map view (pins on Portugal map).
6. TRIPS: Collaborative trip planning — dashboard of trips, trip detail with POI list, group chat, members.
7. PROFILE: User avatar, explorer title (auto-generated, e.g., "Castle Hunter"), stats (favorites count, trip count, friends count), category breakdown visual, friends list.
8. AUTH: Login/Register modal (not full page redirect), email verification page, password reset page.

ENTITIES (mock these for prototype):
- POI: {id, name, category (castle|palace|monument|museum|archaeology|church|viewpoint|park|trail|gastronomy|crafts|accommodation|event), description, lat, lon, yearText, architect, wikidataId, image, images[], wikidataId, wikipediaUrl}
- District: {id, name, population, foundedYear, history, description, files[]}
- User: {id, displayName, avatarUrl, explorerTitle, favouriteCount, tripCount, friendCount, categoryPercentages}
- Favorite: {poiId, poiName, category, image}
- Trip: {id, name, participants[], pois[], messages[]}

FAKE API ENDPOINTS (mock):
- GET /api/pois/lite?bbox=... → {pois: [...], countsByCategory: {...}}
- GET /api/pois/:id → full POI detail
- GET /api/districts → list
- GET /api/districts/:id → detail with history and photos
- GET /api/search?q= → mixed results
- GET /api/favorites → list
- GET /api/trips → list
- GET /api/profile/me → user profile

IMPORTANT CONSTRAINTS:
- A real Spring Boot backend already exists — the Emergent prototype uses mock data only; the final product will connect to the real API
- Authentication uses JWT (Authorization: Bearer token)
- Images come from a CDN (direct URLs)
- Map tiles: use OpenStreetMap, CartoDB, or Mapbox (whichever looks most premium)
- No admin UI needed in prototype — focus on the end-user experience

FUTURE MODULES TO VISUALLY HINT AT:
- 3D historical reconstruction view
- Historical map overlays
- Guided tours (sequence of POIs with narration)
- AR camera mode

Make it feel like a world-class travel editorial app. Prioritize visual impact, smooth animations, and a storytelling-first approach to heritage content.
```
