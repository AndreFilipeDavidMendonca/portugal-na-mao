# Auditoria — Remoção de Curadoria/Gestão de Municípios do Perfil .PT

**Data:** 2026-08-20
**Âmbito:** apenas frontend `.PT` (PT-portugal-na-mao-fe). Nenhuma alteração a backend, BD, APIs ou produção.

## 1. Auditoria

| Funcionalidade | .PT | PT Operations | Estado | Decisão |
|---|---|---|---|---|
| Painel de Curadoria (rever POIs PENDING) | `AdminPanel.jsx`, botão no Perfil | "Revisão de Conteúdo" — `ContentReviewSection.jsx` + `ReviewController`/`ReviewService` (Fase E) | ✓ existe e funciona no PT Operations — e é **mais correto**: a versão .PT usava `/api/pois/mine` (`findByOwner_Id`), que só mostra os POIs PENDING do próprio admin, nunca uma fila global real | **Removido do Perfil .PT** |
| Atribuir utilizador a município (admin global) | `MunicipalityManagementPanel.jsx`, sub-vista "assign", `/api/admin/users/{id}/municipalities/**` | Não encontrado (`UsersSection.jsx` só edita role; sem endpoint `/api/admin/users/*/municipalities` nem equivalente) | ❌ não existe no PT Operations | **Mantido no .PT** — remover deixaria o Admin sem forma de atribuir municípios a ninguém |
| Gestão de equipa por município (managers) | mesmo painel, vista "municipalities" por omissão, `/api/municipality-users/**` | Não aplicável — PT Operations tem login próprio (`authCredentials.js`), separado do login .PT; um gestor municipal (utilizador comum do .PT) não tem, nem pode ter, acesso a PT Operations | ❌ não pode existir lá, por desenho | **Mantido no .PT** — é a única via de acesso para gestores municipais |
| Os meus locais (POIs próprios do utilizador) | `ProfilePanel.jsx`, `myPlaces = userPois.filter(ownerId===currentUserId)` | N/A — feature pública, não administrativa | ✓ já correta, não relacionada com esta tarefa | **Não tocada** |
| Gestão global de utilizadores (roles) | — (já removida numa fase anterior, comentário `PT_OPERATIONS_ROADMAP Fase 1`) | `UsersSection.jsx` | ✓ já migrada | Confirmado, nada a fazer |

## 2. O que ainda merece ser transferido

- **Atribuir utilizador a município** (`/api/admin/users/{id}/municipalities/**`, backend em `portugal-na-mao-api`, `AdminMunicipalityPermissionController`) é claramente administração global e deveria, no futuro, mudar-se para PT Operations. Não migrado nesta tarefa por não ter equivalente pronto — mover isto exigiria replicar o endpoint (ou apontar PT Operations à mesma BD/serviço) e não foi pedido nem construído aqui.

## 3. O que já está corretamente no PT Operations

- "Revisão de Conteúdo" (Fase E) — fila global real de POIs PENDING, decide diretamente sobre a BD "Local" (a mesma que o .PT lê), com histórico de decisões (`/api/review/decisions`). Confirmado como substituto funcional e superior ao antigo Painel de Curadoria.
- Gestão de utilizadores/roles — já migrada em fase anterior.

## 4. O que foi removido do Perfil .PT

- Botão "Painel de curadoria" (`profile-admin-btn`) em `ProfilePanel.jsx`.
- Componente `AdminPanel.jsx` (apagado — sem outros consumidores).
- Montagem `<AdminPanel />` e o seu `lazy import` em `App.js`.
- Estado `adminOpen`/`setAdminOpen` (derivado de `activeMenu === "admin"`) em `AppContext.jsx`, incluindo as duas listas de export do context.
- Funções `approvePoi`/`rejectPoi` em `AppContext.jsx` — órfãs, único consumidor era o `AdminPanel` removido (chamavam os mesmos endpoints genéricos `PUT/DELETE /api/pois/{id}` já usados pelo dono normal do POI).
- Import não usado (`Shield`) em `ProfilePanel.jsx`.

## 5. O que foi deliberadamente mantido

- Botão "Gestão de Municípios" (`profile-municipality-management-btn`) e todo o `MunicipalityManagementPanel.jsx` — intacto, zero alterações. Ver secção 1: nenhuma das duas capacidades que ele agrupa (assign global / gestão de equipa municipal) tem hoje um destino seguro fora do .PT.
- `isAdmin`, `managedMunicipalities`, `setMunicipalityManagementOpen` — continuam exportados e usados exatamente como antes.
- "Os meus locais" — intacto.

## 6. Confirmação — "Os meus locais"

Permanece em `ProfilePanel.jsx` (linha ~130, `myPlaces`), sem qualquer alteração. É uma feature diferente (POIs submetidos pelo próprio utilizador), não confundida com a "Gestão de Municípios" removida/mantida acima. A evolução futura descrita na tarefa (mostrar municípios com permissão) não foi implementada nesta tarefa — não foi pedida como implementação, apenas como contexto para não partir a feature atual.

## 7. Permissões / segurança

Backend `PoiService.requireOwnerOrAdmin` (usado por `approvePoi`/`rejectPoi` via `PUT`/`DELETE /api/pois/{id}`) já exige `UserRole.ADMIN`, ownership, ou permissão municipal — independente do frontend. Remover o botão do Perfil não abre nenhuma via nova: quem já não passava nesse `requireOwnerOrAdmin` também não conseguia usar o botão de forma útil (o próprio botão só listava os PENDING do próprio admin).

`AdminMunicipalityPermissionController` (`/api/admin/users/**`) tem três camadas independentes: filtro em `SecurityConfig` (`/api/admin/**` exige `ROLE_ADMIN`), `@PreAuthorize("hasRole('ADMIN')")` a nível de classe, e verificação adicional dentro de `MunicipalityPermissionService`. Nenhuma alteração feita aqui — mantido como estava, já seguro.

`MunicipalityUserManagementController` (`/api/municipality-users/**`) não tem regra dedicada no `SecurityConfig` — cai no `authenticated()` genérico; a autorização real (só municípios que o chamador gere) está dentro de `MunicipalityPermissionService`, chamada em cada método. Nenhuma alteração feita.

Nenhuma rota antiga (`/admin`, `/api/pois/mine` como base do painel) foi eliminada do backend — apenas o consumo frontend específico do Painel de Curadoria. Não havia vulnerabilidade a corrigir; nada alterado a nível de autorização.

## 8. Ficheiros alterados (frontend .PT apenas)

```
 src/App.js                                 |   2 -
 src/components/admin/AdminPanel.jsx        | 101 ---------------------------- (apagado)
 src/components/social/ProfilePanel.jsx     |  20 ++++-----
 src/context/AppContext.jsx                 |  33 +++++-----  (parte destas 33 linhas é da tarefa dos overlays mobile, ver abaixo)
```

Nota: `AppContext.jsx`, `FriendsPanel.jsx`, `PrivateChatPanel.jsx`, `SmartTripWizard.jsx` e `src/index.css` têm também alterações de uma tarefa anterior na mesma sessão (overlays/modais mobile — backdrop opaco + fecho ao mudar de menu). Essas não fazem parte desta auditoria e não foram tocadas de novo aqui.

`MobileHeader.jsx`, `MobileNav.jsx`, `TopBar.jsx` mostram alterações no `git status` (glass → bg-sidebar nas barras de pesquisa) que **não foram feitas nesta tarefa nem na anterior** — já estavam no working tree antes desta auditoria começar.

## 9. Testes realizados

- `npm run build` (via `craco build`) — compila sem erros, sem warnings novos, em ambos os pontos (antes e depois da remoção).
- Confirmado por grep que não há mais nenhuma referência a `AdminPanel`, `adminOpen`, `setAdminOpen`, `approvePoi`, `rejectPoi` no código fonte.
- Não foi feito teste em browser desta remoção específica nesta sessão (a verificação em browser da tarefa anterior, de overlays, foi interrompida a pedido do utilizador antes desta tarefa começar).

## 10. Pontos fora de alcance / por implementação no PT Operations

- Migrar "Atribuir utilizador a município" para PT Operations (endpoint + UI) — não implementado, feature ainda vive só no .PT.
- "Os meus locais" mostrar municípios com permissão — descrito na tarefa como visão futura, não implementado (fora do pedido desta tarefa).
