# Git Main Sync Report — 2026-07-02

## Resumo

Todos os repositórios do workspace alinhados para `main` e pushed para origin.

---

## Estado por Repositório

### 1. `portugal-na-mao-api`
| Campo | Valor |
|---|---|
| Remote | `github.com/AndreFilipeDavidMendonca/portugal-na-mao-api` |
| Branch inicial | `main` |
| Branch final | `main` ✅ |
| Commits criados | 0 (já estava em main) |
| Merges feitos | 0 (merge feito anteriormente — ver MERGE_MAIN_REPORT.md) |
| Push feito | ✅ (já estava em sync: `ee735a4`) |
| Build/teste | `mvn clean package -DskipTests` → OK (70 MB JAR) |
| Pendências | Nenhuma |

---

### 2. `portugal-na-palma-da-mao` (antigo frontend React/TypeScript)
| Campo | Valor |
|---|---|
| Remote | `github.com/AndreFilipeDavidMendonca/portugal-na-palma-da-mao` |
| Branch inicial | `implentation-OSM-wikidata-ai-bd` |
| Branch final | `main` ✅ |
| Commits mergeados | 1 (`c3e40d3 New architecture for OSM`) |
| Merge | fast-forward, sem conflitos |
| Push feito | ✅ `e2235e5..c3e40d3` |
| Build/teste | Não executado (frontend antigo, sem deploy ativo) |
| Pendências | Não substitui o novo frontend; mantido para referência |

**Ficheiros alterados no merge:**
- `src/components/PoiSide/PoiSide.tsx` / `.scss`
- `src/lib/api.ts`, `src/lib/poiInfo.ts`
- `src/pages/poi/PoiModal.tsx`, `src/pages/profile/ProfilePage.tsx`
- `src/utils/constants.ts`, `src/utils/icons.ts`, `src/utils/poiGeo.ts`
- `src/features/filters/PoiFilter/*.tsx`

---

### 3. `PT-portugal-na-mao-fe` (novo frontend React/Vite/Craco)
| Campo | Valor |
|---|---|
| Remote | `github.com/AndreFilipeDavidMendonca/PT-Portugal-na-mao` |
| Branch inicial | `main` |
| Branch final | `main` ✅ |
| Commits criados | 1 (`85fdff9`) |
| Merges feitos | 0 |
| Push feito | ✅ `3a31ec8..85fdff9` |
| Build | `npx craco build` → OK; `onrender.com` no bundle |
| Pendências | Nenhuma |

**Commit criado (`85fdff9`):**
```
Guard all flyTo/Marker calls against invalid LatLng; add .env.production

- AppContext.flyTo: guard (lat == null || !isFinite) antes de setFlyTarget
- AppContext.openPoi/openDistrict: guard coords fly antes de setFlyTarget
- TourPlayer: guard poi.lat/lon antes de flyTo
- AdminPanel: guard p.lat/lon antes de flyTo
- DistrictDrawer: guard p.lat/lon antes de flyTo
- Add frontend/.env.production com URLs de produção (sem secrets)
```

**Ficheiros alterados:**
- `frontend/.env.production` (novo — URLs de produção Render/R2)
- `frontend/src/context/AppContext.jsx` (flyTo + openPoi + openDistrict guards)
- `frontend/src/components/TourPlayer.jsx`
- `frontend/src/components/AdminPanel.jsx`
- `frontend/src/components/DistrictDrawer.jsx`

---

### 4. `portugal-workspace` (raiz / monorepo de documentação)
| Campo | Valor |
|---|---|
| Remote | `github.com/AndreFilipeDavidMendonca/portugal-na-mao` |
| Branch inicial | `implentation-OSM-wikidata-ai-bd` |
| Branch final | `main` ✅ |
| Commits mergeados | 5 (4 da feature branch + 1 criado agora) |
| Merge | fast-forward, sem conflitos |
| Push feito | ✅ `d4e4a7e..9b37cd0` |
| Build/teste | N/A (documentação e assets) |
| Pendências | Nenhuma |

**Commits mergeados:**
```
9b37cd0 Add .gitignore: exclude PT-portugal-na-mao-fe nested repo and artifacts
b5b1c7a New style implementation
549d11c Match sipa by coordinates
caa2f03 Get sipa id by name
f5b1f4c New architecture for OSM - wiki - images - data New DB
```

**Ficheiros adicionados no merge:**
- `.gitignore` (novo — exclui `PT-portugal-na-mao-fe/` e artifacts)
- `EMERGENT_FRONTEND_BRIEF.md`
- `new design.png`, `new_design.png`, `new_style_mobile.png`
- `.idea/vcs.xml`

---

## Conflitos Resolvidos

Nenhum. Todos os merges foram fast-forward.

---

## Builds Executados

| Repo | Comando | Resultado |
|---|---|---|
| `portugal-na-mao-api` | `mvn clean package -DskipTests` | ✅ JAR 70 MB |
| `PT-portugal-na-mao-fe` | `npx craco build` | ✅ Bundle com `onrender.com` |

---

## Segurança

- Nenhum password ou secret commitado
- `frontend/.env.production` contém apenas URLs públicas (já presentes no bundle JS)
- Dumps de BD excluídos via `.gitignore`
- `PT-portugal-na-mao-fe/` excluído do repo raiz via `.gitignore` (era untracked, pode causar commits acidentais)

---

## Estado Final

| Repo | Branch | Pushed | Em sync com origin |
|---|---|---|---|
| `portugal-na-mao-api` | `main` | ✅ | ✅ |
| `portugal-na-palma-da-mao` | `main` | ✅ | ✅ |
| `PT-portugal-na-mao-fe` | `main` | ✅ | ✅ |
| `portugal-workspace` | `main` | ✅ | ✅ |

---

## Próximos Passos para Deploy

1. **Render (backend):** deploy automático já ativo via push para `main` em `portugal-na-mao-api`. Confirmar no painel Render.
2. **Vercel (novo frontend):** deploy automático via push para `main` em `PT-Portugal-na-mao`. Confirmar URL e que `REACT_APP_API_BASE` aponta para Render.
3. **SIPA:** se API `arquivos.patrimoniocultural.gov.pt` estiver acessível, correr `SipaImportRunner` em local com `--spring.profiles.active=sipa`.
4. **Antigo frontend (`portugal-na-palma-da-mao`):** não está em deploy ativo. Decisão sobre substituição ou manutenção pendente.
5. **BD produção:** não foi tocada neste processo. Migrações Flyway V14-V27 já aplicadas.
