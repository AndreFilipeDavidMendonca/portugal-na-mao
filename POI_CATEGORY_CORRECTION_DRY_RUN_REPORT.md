# POI_CATEGORY_CORRECTION_DRY_RUN_REPORT

**Data:** 2026-07-03  
**Tipo:** Dry-run — sem alterações na BD  
**Categorias alvo:** archaeology, beach, castle, cave, church, geosite, lake, monument, mountain, museum, natural_park, palace, park, trail, viewpoint, waterfall  

---

## Sumário

| Métrica | Valor |
|---|---|
| POIs analisados | 15,185 |
| HIGH_CONFIDENCE (CHANGE) | 170 |
| REVIEW_NEEDED | 991 |
| NO_CHANGE | 14,024 |

## Matriz de Transição (categoria actual → categoria sugerida)

| Actual | Sugerida | HIGH | REVIEW |
|---|---|---|---|
| `palace` | `castle` | 6 | 164 |
| `natural_park` | `archaeology` | 60 | 83 |
| `park` | `church` | 1 | 84 |
| `monument` | `castle` | 1 | 82 |
| `natural_park` | `castle` | 57 | 16 |
| `mountain` | `castle` | 0 | 61 |
| `viewpoint` | `castle` | 2 | 40 |
| `archaeology` | `castle` | 24 | 10 |
| `cave` | `archaeology` | 1 | 30 |
| `park` | `palace` | 0 | 26 |
| `park` | `beach` | 0 | 23 |
| `viewpoint` | `church` | 0 | 18 |
| `park` | `castle` | 0 | 18 |
| `park` | `monument` | 0 | 18 |
| `park` | `viewpoint` | 0 | 16 |
| `beach` | `castle` | 0 | 15 |
| `natural_park` | `church` | 4 | 9 |
| `viewpoint` | `lake` | 0 | 13 |
| `viewpoint` | `beach` | 0 | 13 |
| `viewpoint` | `waterfall` | 0 | 13 |
| `park` | `archaeology` | 0 | 13 |
| `archaeology` | `church` | 1 | 10 |
| `palace` | `museum` | 2 | 8 |
| `viewpoint` | `cave` | 0 | 10 |
| `park` | `museum` | 0 | 10 |
| `natural_park` | `lake` | 0 | 10 |
| `castle` | `palace` | 1 | 8 |
| `mountain` | `cave` | 0 | 9 |
| `beach` | `lake` | 0 | 9 |
| `geosite` | `beach` | 0 | 8 |
| `mountain` | `archaeology` | 0 | 8 |
| `viewpoint` | `archaeology` | 0 | 7 |
| `park` | `cave` | 0 | 7 |
| `natural_park` | `palace` | 1 | 5 |
| `natural_park` | `cave` | 1 | 5 |
| `monument` | `church` | 0 | 6 |
| `castle` | `church` | 1 | 4 |
| `archaeology` | `museum` | 3 | 2 |
| `viewpoint` | `monument` | 0 | 5 |
| `geosite` | `archaeology` | 0 | 5 |
| `park` | `lake` | 0 | 5 |
| `natural_park` | `beach` | 0 | 5 |
| `mountain` | `monument` | 0 | 4 |
| `archaeology` | `monument` | 0 | 4 |
| `mountain` | `viewpoint` | 0 | 4 |
| `mountain` | `church` | 0 | 4 |
| `geosite` | `lake` | 0 | 4 |
| `museum` | `church` | 1 | 2 |
| `museum` | `palace` | 0 | 3 |
| `geosite` | `castle` | 0 | 3 |
| `geosite` | `viewpoint` | 0 | 3 |
| `mountain` | `lake` | 0 | 3 |
| `lake` | `monument` | 0 | 3 |
| `lake` | `beach` | 0 | 3 |
| `lake` | `waterfall` | 0 | 3 |
| `church` | `palace` | 1 | 1 |
| `natural_park` | `museum` | 1 | 1 |
| `church` | `museum` | 1 | 1 |
| `viewpoint` | `museum` | 0 | 2 |
| `monument` | `lake` | 0 | 2 |
| `palace` | `park` | 0 | 2 |
| `cave` | `beach` | 0 | 2 |
| `waterfall` | `beach` | 0 | 2 |
| `beach` | `palace` | 0 | 2 |
| `lake` | `palace` | 0 | 2 |
| `beach` | `cave` | 0 | 2 |
| `viewpoint` | `park` | 0 | 1 |
| `viewpoint` | `geosite` | 0 | 1 |
| `monument` | `palace` | 0 | 1 |
| `monument` | `museum` | 0 | 1 |
| `palace` | `monument` | 0 | 1 |
| `archaeology` | `palace` | 0 | 1 |
| `park` | `waterfall` | 0 | 1 |
| `lake` | `archaeology` | 0 | 1 |
| `waterfall` | `lake` | 0 | 1 |
| `waterfall` | `cave` | 0 | 1 |
| `cave` | `monument` | 0 | 1 |
| `geosite` | `cave` | 0 | 1 |
| `beach` | `waterfall` | 0 | 1 |
| `natural_park` | `monument` | 0 | 1 |
| `beach` | `church` | 0 | 1 |
| `lake` | `church` | 0 | 1 |
| `lake` | `castle` | 0 | 1 |
| `cave` | `church` | 0 | 1 |

## Casos Prioritários: `park` → categoria patrimonial

Fortes, igrejas, palácios e monumentos classificados como parques.

| poi_id | Nome | Sugerida | Confiança | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|---|---|
| 62169 | Santuário de Nossa Senhora da Conceição da Rocha | `church` | **HIGH** | — | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0) |
| 52830 | Jardim da Igreja de São José | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 53040 | Jardim do Castelo de São Jorge | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 53474 | Paraíso de Anta | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54340 | Padrão de Homenagem aos Expedicionários da 1ª Grande Gu | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56634 | Chafariz do Povo | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 57054 | Jardim da Vila de Castro Daire | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 57288 | Jardim do Solar D'Areia | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57335 | Jardim do Senhor do Padrão | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 57346 | Parque Manuel António de Castro | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 57526 | Parque Ferreira de Castro | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 57549 | Jardim do Palácio Marquês de Fronteira | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57769 | Jardim do Paço | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57779 | Largo do Paço | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57863 | Quinta da Regaleira | `palace` | **LOW** | manor | Residencial unifamiliar | signals suggest palace (w=2, sources=1:name=0,osm=1,sipa=0) |
| 57878 | Jardim do Largo do Pelourinho | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 57890 | Parque do Convento dos Capuchos | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57911 | Parque Infantil da Quinta do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58008 | Jardins do Museu do Mar | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58076 | Parque da igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58079 | Jardim Municipal de Paço de Arcos | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58086 | Largo Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58094 | Parque da Praceta Camilo Castelo Branco | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58231 | Jardim do Museu do Abade de Baçal | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58357 | Jardim do Cruzeiro | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 58415 | Jardim do Paço | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58431 | Jardins do Palácio de Cristal | `palace` | **LOW** | landmark | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58521 | Cruzeiro de Cristelo | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58566 | Santuário de Nossa Senhora da Saúde | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58612 | Jardim Conselheiro José Luciano de Castro | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 58629 | Parque do Museu | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58642 | Parque de Viana do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58643 | Parque Ecológico Urbano de Viana do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58801 | Jardim Fernanda de Castro | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 58849 | Jardim do Cruzeiro | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 58952 | Parque Urbano de Castro Daire | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 58964 | Quinta do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59146 | Jardim do Solar dos Zagallos | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59172 | Jardim do Castelo de Santiago do Cacém | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59174 | Parque Verde da Quinta do Chafariz | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 59233 | Jardim do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59257 | Quinta do Convento da Franqueira | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59508 | Adro da Igreja de Sever | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59530 | Jardim do Palácio do Freixo | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59557 | Cerca do Convento de Sant'Ana da Ordem do Carmo | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59654 | Parque da Anta das Pedras Grandes | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 59666 | Parque do Solar dos Condes de Resende | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59723 | Parque Conde Castro Guimarães | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 59798 | Jardim do Chafariz | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 59820 | Adro da Igreja de Galafura | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59850 | Jardim Mosteiro de Arnoia | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59872 | Jardim do Largo Camilo Castelo Branco | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59874 | Santuário de Nossa Senhora da Conceição | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59971 | Jardim do Palácio Ventura Terra | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59972 | Mosteiro Santa Maria do Lumiar | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60078 | Jardim do Palácio dos Arcos | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60094 | Parque Largo do Cruzeiro | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60099 | Parque do Salão Paroquial | `church` | **LOW** | — | — | signals suggest church (w=3, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60116 | Parque do Chafariz da Curva | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60279 | Parque do Pelourinho | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60300 | Santuário do Monte da Virgem | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60310 | Jardim do Palácio | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60327 | Arraial da Igreja de Mozelos | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60328 | Parque Chafariz do Penedo | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60336 | Parque do Cruzeiro | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60359 | Jardim da Igreja do Senhor dos Aflitos | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60374 | Jardim do Museu Regional de Beja | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60377 | Parque da Torre de Vilar | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60421 | Jardim do Museu Verdades Faria | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60430 | Parque do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60485 | Praça Doutor Albano de Castro | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60606 | Parque da Igreja de São Miguel do Mato | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60626 | Jardim do Palácio do Contador-Mor | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60703 | Parque Urbano das Colinas do Cruzeiro | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60719 | Arraial da Igreja de Fiães | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60736 | Jardins do Museu Romântico | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60742 | Centro de Interpretação da Serra d'Arga | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60774 | Parque do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60860 | Rua Eugénio de Castro | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60925 | Parque da igreja de Santa Maria | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60944 | Parque da Igreja de Oliveira São Mateus | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61011 | Jardim da Igreja de Real | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61048 | Parque do Sub-Paço | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61106 | Largo da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61189 | Largo da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61302 | Jardim da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61313 | Jardim da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61314 | Praçinha da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61440 | Parque da Igreja de Riba de Ave | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61493 | Parque do Convento | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61565 | Adro da Igreja de Constantim | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61573 | Jardim do Chafariz d'El Rei | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 61638 | Jardim do Seminário | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61670 | Praça da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61695 | Jardim do Terreiro do Paço | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61720 | largo da igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61827 | Adro da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61916 | Santuário de Nossa Senhora do Monte | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61924 | Jardim do Palácio da Flor da Murta | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61976 | Jardim da Quinta do Mosteiro | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61977 | Santuário de São Caetano | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61992 | Santuário do Monte do Clamor | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62004 | Santuário de Nossa Senhora da Ouvida | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62102 | Jardim do Museu Nogueira da Silva | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62152 | Largo do Chafariz | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 62187 | Jardim da Quinta do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62284 | Santuário de Nossa Senhora de La Salette | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62297 | Área de proteção da Anta de Santa Marta | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62314 | Jardim do Museu de Etnologia | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62335 | Jardins da Casa do Paço | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62340 | Jardim da Igreja dos Pastorinhos | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62351 | Jardim do Paço Episcopal | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62366 | Parque da Matriz | `church` | **LOW** | — | — | signals suggest church (w=3, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62377 | Jardim de Paço de Sousa | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62379 | Santuário de Nossa Senhora da Saúde | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62384 | Largo da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62385 | Jardim do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62393 | Quinta do Castelo da Dona Chica | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62409 | Parque Botânico do Castelo | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62532 | Jardim Da Muralha Dos Muros | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62555 | Jardim do Cruzeiro | `monument` | **LOW** | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 62585 | Parque da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62605 | Parque da Igreja de Gamil | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62611 | Santuário de Nossa Senhora da Aparecida | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62612 | Santuário de Nossa Senhora das Neves | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62646 | Santuário de Santa Rita das Ermidas | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62680 | Santuário de Nossa Senhora da Guia | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62792 | Parque do Santuário do Senhor Jesus da Piedade | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62819 | Santuário de Nossa Senhora de La Salette | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62838 | Jardim do adro da igreja velha | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62849 | Palácio e Parque Biester | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62965 | Santuário de Nossa Senhora de Lourdes | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62969 | Mata do Convento | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62980 | Adro da Igreja de São Pedro | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63005 | Jardins do Palácio de Mateus | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63057 | Jardim do Convento do Carmo | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63063 | Jardim Camilo Castelo Branco | `castle` | **LOW** | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63073 | Santuário do Senhor dos Aflitos | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63121 | Jardim Interior do Palácio de São Bento | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63154 | Santuário de Nossa Senhora de Lourdes | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63161 | Jardim do Museu | `museum` | **LOW** | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63260 | Santuário de Santa Bárbara | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63320 | Parque da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63349 | Jardim da Quinta Municipal do Palácio do Sobralinho | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63443 | Santuário de Nossa Senhora da Saúde | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63485 | Santuário do Senhor Jesus do Calvário | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63497 | Santuário de Nossa Senhora da Graça | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63498 | Santuário de Nossa Senhora do Viso | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63499 | Santuário do Senhor do Monte | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63500 | Santuário de São Bento do Castelo | `church` | **MEDIUM** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 63501 | Santuário de Nossa Senhora da Azinheira | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63502 | Santuário de Nossa Senhora da Boa Morte | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63503 | Santuário de Nossa Senhora da Cunha | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63504 | Santuário de Nossa Senhora da Guia | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63505 | Santuário de Nossa Senhora da Piedade | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63506 | Santuário de Nossa Senhora da Vila de Abril | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63507 | Santuário de Nossa Senhora das Necessidades | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63508 | Santuário de São Domingos | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63509 | Santuário de Nosso Senhor da Piedade | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63527 | Adro da Igreja de Mouçós | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63587 | Santuário do Imaculado Coração de Maria dos Cerejais | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63588 | Santuário de Nossa Senhora das Neves | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63598 | Santuário de Nosso Senhor dos Milagres | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63619 | Santuário de São Salvador do Mundo | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63628 | Largo da Igreja da Campeã | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63655 | Santuário do Senhor dos Aflitos | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63684 | Jardim Daniel Edmundo Fonseca de Castro | `archaeology` | **LOW** | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 63695 | Santuário de Nossa Senhora da Saúde | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63699 | Jardim do Palácio dos Viscondes de Portalegre | `palace` | **LOW** | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 69534 | Parque da Igreja | `church` | **LOW** | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |

## Casos HIGH_CONFIDENCE (recomendado CHANGE)

Total: **170**

| poi_id | Nome | Actual | Sugerida | OSM | SIPA | Sinais nome |
|---|---|---|---|---|---|---|
| 51107 | Bateria da Cachada | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | bateria |
| 51110 | Bateria da Oliveira | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | bateria |
| 51115 | Bateria do Penedo | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | bateria |
| 51108 | Bateria do Viso da Serra | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | bateria |
| 51111 | Bateria à barba do Picoto | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | bateria |
| 52034 | Castelo de Albufeira | `archaeology` | `castle` | historic=ruins | sipa_typology_1=Militar | castelo; albufeira |
| 53861 | Castelo de Rebordãos | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | castelo |
| 61059 | Castelo de Seda | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | castelo |
| 52276 | Forte da Alagoa | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 51112 | Forte da Estacada | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 52272 | Forte da Murgeira | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 51114 | Forte da Ribeira Alva | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 51212 | Forte da Vinha | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 57084 | Forte de Almádena | `archaeology` | `castle` | historic=ruins | sipa_typology_1=Militar | forte |
| 51072 | Forte de Bragandelo | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 52274 | Forte de Penegache | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 51217 | Forte do Canto do Muro da Tapada Nacional de Mafra | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 51117 | Forte do Mogo | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 51214 | Forte do Outeiro do Lobo | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 50094 | Forte do Outeiro do Vale | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 50369 | Forte do Tuído | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 53648 | Igreja de Nossa Senhora do Rosário da Tróia | `archaeology` | `church` | historic=archaeological_site | sipa_typology_1=Religioso | igreja |
| 58907 | Museu Termas Romanas de Chaves | `archaeology` | `museum` | historic=archaeological_site; tourism=museum | — | museu |
| 58757 | Núcleo Museológico Fenício | `archaeology` | `museum` | historic=archaeological_site; tourism=museum | — | núcleo museológico |
| 57842 | Núcleo Museológico do Castelo de São Jorge | `archaeology` | `museum` | historic=archaeological_site; tourism=museum | — | castelo; núcleo museológico |
| 53025 | Reduto da Foz do Rio Sizandro | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 61210 | Ruínas do Forte de Modorra | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 61259 | Torre de Redondos | `archaeology` | `castle` | historic=ruins | sipa_typology_1=Militar | Torre de |
| 57100 | Igreja de Santa Clara | `castle` | `church` | historic=castle; building=church | sipa_typology_1=Religioso | igreja |
| 62374 | Paço de Dona Loba | `castle` | `palace` | historic=castle | sipa_typology_1=Residencial senhorial | paço |
| 52540 | Abrigo Rupestre da Pala Pinta | `cave` | `archaeology` | historic=archaeological_site | sipa_typology_1=Abrigo rupestre | — |
| 54330 | Capela do Paço Real de Salvaterra de Magos | `church` | `palace` | historic=chapel | sipa_typology_1=Residencial senhorial | paço |
| 63516 | Museu Nacional do Azulejo | `church` | `museum` | historic=monastery; tourism=museum | — | museu |
| 62806 | Porta da Barbacã | `monument` | `castle` | historic=city_gate | — | barbacã |
| 61990 | Antiga Paroquial de Mira de Aire | `museum` | `church` | building=church; tourism=gallery | — | paroquial |
| 59624 | Anta da Estria | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | anta |
| 59623 | Anta da Pedra dos Mouros | `natural_park` | `archaeology` | historic=archaeological_site | — | anta |
| 59625 | Anta do Monte Abraão | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | anta |
| 61418 | Bateria dos Melros | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | bateria |
| 61116 | Carrascal | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | — |
| 60904 | Castelo de Germanelo | `natural_park` | `castle` | historic=castle | sipa_typology_1=Militar | castelo |
| 59596 | Castelo de Torrejão | `natural_park` | `castle` | historic=castle | — | castelo |
| 60698 | Castro da Cárcoda | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | castro |
| 60011 | Castro de Carvalhelhos | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | castro |
| 59615 | Castro de Chibanes | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | castro |
| 57121 | Castro de Leceia | `natural_park` | `archaeology` | historic=archaeological_site | — | castro |
| 58896 | Castro de Monte Padrão | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | castro; padrão |
| 61248 | Castro de São João das Arribas | `natural_park` | `archaeology` | historic=archaeological_site | — | castro |
| 57469 | Castro de São Lourenço | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | castro |
| 59943 | Castro de Vila Nova de São Pedro | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | castro |
| 61834 | Castro do Crastoeiro | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | castro |
| 58018 | Citânia de Briteiros | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 57300 | Citânia de Sanfins | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 59994 | Estação Arqueológica do Alto da Fonte do Milho | `natural_park` | `archaeology` | historic=archaeological_site | — | estação arqueológica |
| 61176 | Estação Arqueológica do Prazo | `natural_park` | `archaeology` | historic=archaeological_site | — | estação arqueológica |
| 59860 | Estação arqueológica da Quinta da Goucha | `natural_park` | `archaeology` | historic=archaeological_site | — | estação arqueológica |
| 62820 | Estação arqueológica de Ferragial d'El Rei | `natural_park` | `archaeology` | historic=archaeological_site | — | estação arqueológica |
| 60806 | Estação arqueológica de Mogueira-São Martinho de M | `natural_park` | `archaeology` | historic=archaeological_site | — | estação arqueológica |
| 58789 | Estação arqueológica de São João de Perrelos | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | estação arqueológica |
| 58056 | Forte Grande da Senhora da Ajuda | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59025 | Forte Novo do Cabo da Serra da Albueira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59027 | Forte Pequeno da Senhora da Ajuda | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59010 | Forte Primeiro da Subserra | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59024 | Forte Reentrante da Serra de Albueira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 58333 | Forte da Archeira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59055 | Forte da Calhandriz | `natural_park` | `castle` | historic=fort | sipa_typology_1=Militar | forte |
| 59015 | Forte da Carvalha | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59039 | Forte da Carvoeira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59249 | Forte da Coutada | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 57645 | Forte da Malveira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59035 | Forte da Milhariça | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 57630 | Forte da Portela Pequeno | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59028 | Forte da Queijada | `natural_park` | `castle` | historic=fort | — | forte |
| 59032 | Forte da Quinta do Estrangeiro | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59022 | Forte da Quintela Grande | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59021 | Forte da Quintela Pequeno | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 61438 | Forte da Retaguarda | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 57745 | Forte de Lovelhe | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59046 | Forte de Os Dois Moinhos de Sarnadas | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 61422 | Forte de Santa Maria | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59611 | Forte de Santiago | `natural_park` | `castle` | historic=castle | sipa_typology_1=Militar | forte |
| 59040 | Forte de São Julião da Ericeira | `natural_park` | `castle` | historic=fort | sipa_typology_1=Militar | forte |
| 57000 | Forte de São Vicente | `natural_park` | `castle` | historic=castle | sipa_typology_1=Militar | forte |
| 59034 | Forte do Cabeço da Acheira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59567 | Forte do Cabeço do Neto | `natural_park` | `castle` | historic=fort | sipa_typology_1=Militar | forte |
| 61424 | Forte do Carrascal | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59033 | Forte do Casal da Serra | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 57690 | Forte do Cavalo | `natural_park` | `castle` | historic=castle | sipa_typology_1=Militar | forte |
| 58320 | Forte do Cego | `natural_park` | `castle` | historic=fort | sipa_typology_1=Militar | forte |
| 59566 | Forte do Juncal | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59041 | Forte do Machado | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59248 | Forte do Matoutinho | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59026 | Forte do Moinho da Boca da Lapa | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte; lapa |
| 59016 | Forte do Moinho do Céu | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59030 | Forte do Mosqueiro | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59031 | Forte do Outeiro da Quinta da Atraca | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59037 | Forte do Samoco | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 58334 | Forte do Simplício | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59036 | Forte do Sonivel | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59051 | Forte do Trinta | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 61425 | Forte do Zambujal | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 59573 | Igreja Paroquial de Cheleiros | `natural_park` | `church` | historic=church | sipa_typology_1=Religioso | igreja |
| 58367 | Igreja do Santíssimo Nome de Jesus | `natural_park` | `church` | historic=church | sipa_typology_1=Religioso | igreja |
| 59735 | Lapa da Bugalheira | `natural_park` | `cave` | historic=archaeological_site | sipa_typology_1=Gruta | lapa |
| 62970 | Monte da Tumba | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 57215 | Museu Miguel Bombarda | `natural_park` | `museum` | tourism=museum | — | museu |
| 62761 | Necrópole de Arnadelo | `natural_park` | `archaeology` | historic=archaeological_site | — | necrópole |
| 58779 | Necrópole de Carenque | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | necrópole |
| 62872 | Necrópole de São Miguel da Pena | `natural_park` | `archaeology` | historic=archaeological_site | — | necrópole |
| 55525 | Necrópole do Couto | `natural_park` | `archaeology` | historic=archaeological_site | — | necrópole |
| 60966 | Necrópole do Pardieiro | `natural_park` | `archaeology` | historic=archaeological_site | — | necrópole |
| 59606 | Palácio do Farrobo (restos) | `natural_park` | `palace` | historic=palace | — | palácio |
| 63720 | Povoado das Mesas do Castelinho | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 64119 | Povoado e Estação Arqueológica de Lovelhe | `natural_park` | `archaeology` | historic=archaeological_site | — | estação arqueológica |
| 63901 | Quinta do Almaraz | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 61312 | Recinto Megalítico de São Cristóvão | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | — |
| 58330 | Reduto Novo da Ordasqueira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 59018 | Reduto da Alquiteira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 59020 | Reduto da Bececaria | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 58323 | Reduto da Milharosa | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 59053 | Reduto da Patameira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 59017 | Reduto da Portela da Ribaldeira | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 59019 | Reduto de Belmonte | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 58331 | Reduto de Catefica | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 59054 | Reduto de Mouguelas | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 61421 | Reduto de Palheiros | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 58341 | Reduto do Formigal | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 59563 | Reduto do Outeiro da Forca | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 62589 | Ruínas Romanas da Quinta do Ervedal | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | ruínas romanas |
| 61476 | Ruínas Romanas de Alcolobre | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 61300 | Ruínas Romanas de Bobadela | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | ruínas romanas |
| 58570 | Ruínas Romanas de Milreu | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 57663 | Ruínas Romanas de Miróbriga | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 57381 | Ruínas de Conímbriga | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 60360 | Ruínas do Castelo de Faria e da estação arqueológi | `natural_park` | `archaeology` | historic=archaeological_site | — | castelo; estação arqueológica |
| 58582 | Ruínas do Convento de Penafirme | `natural_park` | `church` | historic=monastery | sipa_typology_1=Religioso | convento |
| 57873 | Ruínas romanas das Carvalheiras | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 64084 | Ruínas romanas de Tróia | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 58149 | Sabugal Velho | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 60014 | Santuário de Panóias | `natural_park` | `church` | historic=archaeological_site | sipa_typology_1=Religioso | santuário |
| 58633 | Vila Romana de Freiria | `natural_park` | `archaeology` | historic=archaeological_site | — | vila romana |
| 61495 | Villa Romana da Horta da Torre | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 58043 | Villa Romana de Cardilio | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 61786 | Villa Romana de Miroiços | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 58702 | Villa Romana de Nossa Senhora da Tourega | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 61111 | Villa Romana de Oeiras | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 58630 | Villa Romana de Pisões | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 70754 | Villa Romana de Rio Maior | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 58356 | Villa Romana de Sendim | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 57329 | Villa Romana de São Cucufate | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 58700 | Villa Romana do Monte da Chaminé | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 58701 | Villa Romana do Montinho das Laranjeiras | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 61934 | Villa Romana dos Casais Velhos | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 59933 | Villa romana de Fonte de Frades | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 59748 | Villa romana de Miroiço | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 61061 | Villa romana de Outeiro de Polima | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 61572 | Villa romana de Santo André de Almoçageme | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 63751 | Villa romana do Alto do Cidreira | `natural_park` | `archaeology` | historic=archaeological_site | — | villa romana |
| 64085 | Área Arqueológica do Freixo | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 57914 | Casa da Torre de Alvite | `palace` | `castle` | historic=castle | sipa_typology_1=Residencial senhorial | Torre de |
| 58921 | Casa do Castelo | `palace` | `castle` | historic=castle | — | castelo |
| 58022 | Castelo da Dona Chica | `palace` | `castle` | historic=castle | — | castelo |
| 59197 | Castelo de Castelo Rodrigo | `palace` | `castle` | historic=castle | — | castelo |
| 61684 | Castelo de Portuzelo | `palace` | `castle` | historic=castle | — | castelo |
| 57234 | Museu Nacional de Arte Antiga | `palace` | `museum` | historic=castle; tourism=museum | — | museu |
| 58522 | Museu do Romântico | `palace` | `museum` | historic=castle; tourism=museum | — | museu |
| 61058 | Torre de Nevões | `palace` | `castle` | historic=castle | — | Torre de |
| 62169 | Santuário de Nossa Senhora da Conceição da Rocha | `park` | `church` | amenity=place_of_worship | — | santuário |
| 51002 | Castelo da Nóbrega | `viewpoint` | `castle` | — | sipa_typology_1=Militar | castelo |
| 49795 | Torre de São Lourenço | `viewpoint` | `castle` | — | sipa_typology_1=Militar | Torre de |

## Casos REVIEW_NEEDED

Total: **991**. Ordenados por transição.

### palace → castle (164)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58905 | Antigo Externato Marista | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57918 | Ateneu Comercial de Lisboa | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57583 | Casa Italiana | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57229 | Casa Lambertini | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61955 | Casa Primo Madeira | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57196 | Casa Veva de Lima | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57237 | Casa da Carapeteira | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58175 | Casa da Torre da Lagariça | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 62205 | Casa da Viscondenssa de Santiago de Lobão | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61958 | Casa de Margarida Rosa Pereira Machado | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60951 | Casa de Santa Eufémia | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 62984 | Casa do Conde São Salvador | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60350 | Casa dos Almadas | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57193 | Casa dos Bicos | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60347 | Casa dos Marqueses de Cantagallo | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60225 | Casa e Jardim do Campo Pequeno | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57232 | Centro de Estudos Judiciários | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58351 | Centro de Reabilitação Nossa Senhora dos Anjos | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60097 | Chalet Barros | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57244 | Clube Militar Naval | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59202 | Comissão de Coordenação da Região Norte | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58350 | Companhia Olga Roriz | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61660 | Cottolengo do Padre Alegre - Casa da Divina Provideênci | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57902 | Câmara Municipal de Benavente | castle | Político e administrativo regional e local | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59749 | Edifício Mendia | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58262 | Edifício da Liga dos Combatentes | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57219 | Edifício na Rua do Arco da Graça, esquina com a Calçada | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57194 | Embaixada da República Federal da Alemanha | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58403 | Hospital Saint Louis | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60349 | Hotel Albatroz Cascais - VillaCascais | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57616 | Imprensa Nacional - Casa da Moeda | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57195 | Instituto Camões-Casa da Lusofonia | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57603 | Junta de Freguesia de Carnide | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60190 | Junta de Freguesia do Bonfim | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59338 | Liga dos Bombeiros Portugueses | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57203 | Massimo Dutti | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57450 | Monte Palace | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59986 | Olissippo Lapa Palace Hotel | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57179 | Palacete Alenquer | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57212 | Palacete Alves Machado | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58427 | Palacete Andrade Bastos | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57211 | Palacete Anjos | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57184 | Palacete António Ferreira de Carvalho | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57168 | Palacete Bessone | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58205 | Palacete Campos Navarro | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57251 | Palacete Conceição e Silva | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 62026 | Palacete Conde Dias Gracia | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57208 | Palacete Falcarreira | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 62703 | Palacete Gramaxo de Oliveira | castle | — | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |
| 63204 | Palacete Guerreirinho | castle | Residencial unifamiliar | signals suggest castle (w=3, sources=1:name=0,osm=1,sipa=0) |

*… e mais 114 casos*

### park → church (84)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 61827 | Adro da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61565 | Adro da Igreja de Constantim | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59820 | Adro da Igreja de Galafura | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63527 | Adro da Igreja de Mouçós | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59508 | Adro da Igreja de Sever | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62980 | Adro da Igreja de São Pedro | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60719 | Arraial da Igreja de Fiães | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60327 | Arraial da Igreja de Mozelos | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59557 | Cerca do Convento de Sant'Ana da Ordem do Carmo | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59850 | Jardim Mosteiro de Arnoia | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61302 | Jardim da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61313 | Jardim da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61011 | Jardim da Igreja de Real | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 52830 | Jardim da Igreja de São José | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60359 | Jardim da Igreja do Senhor dos Aflitos | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62340 | Jardim da Igreja dos Pastorinhos | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61976 | Jardim da Quinta do Mosteiro | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63057 | Jardim do Convento do Carmo | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61638 | Jardim do Seminário | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62838 | Jardim do adro da igreja velha | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58086 | Largo Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61106 | Largo da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61189 | Largo da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62384 | Largo da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63628 | Largo da Igreja da Campeã | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62969 | Mata do Convento | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59972 | Mosteiro Santa Maria do Lumiar | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62585 | Parque da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63320 | Parque da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 69534 | Parque da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62605 | Parque da Igreja de Gamil | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60944 | Parque da Igreja de Oliveira São Mateus | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61440 | Parque da Igreja de Riba de Ave | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60606 | Parque da Igreja de São Miguel do Mato | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62366 | Parque da Matriz | — | — | signals suggest church (w=3, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58076 | Parque da igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60925 | Parque da igreja de Santa Maria | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61493 | Parque do Convento | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57890 | Parque do Convento dos Capuchos | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60099 | Parque do Salão Paroquial | — | — | signals suggest church (w=3, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62792 | Parque do Santuário do Senhor Jesus da Piedade | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61670 | Praça da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61314 | Praçinha da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59257 | Quinta do Convento da Franqueira | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62611 | Santuário de Nossa Senhora da Aparecida | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63501 | Santuário de Nossa Senhora da Azinheira | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63502 | Santuário de Nossa Senhora da Boa Morte | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59874 | Santuário de Nossa Senhora da Conceição | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63503 | Santuário de Nossa Senhora da Cunha | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63497 | Santuário de Nossa Senhora da Graça | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |

*… e mais 34 casos*

### natural_park → archaeology (83)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 59616 | Alapraia Eneolithic Necropolis | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58016 | Alcáçova | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61708 | Aqueduto de Alcabideque | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61496 | Barragem Romana do Muro dos Mouros | archaeological_site | Hidráulica de contenção | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61417 | Bateria 1.ª de Pombal | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59409 | Bateria Nova de Subserra | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 62691 | Buracas de Armês | archaeological_site | Extração, produção e transformação | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 62257 | Cabeço de Alfarela | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57037 | Cacela Velha | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59747 | Cemitério visigótico de Alcoitão | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58607 | Cerro da Vila | archaeological_site | Agrícola e florestal | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58628 | Cidade Romana de Eburobrittium | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61830 | Cidade romana de Ammaia | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61703 | Citânia da Raposeira | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58078 | Citânia de Santa Luzia | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60689 | Cividade de Bagunte | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59252 | Estação Romana da Quinta da Abicada | archaeological_site | Agrícola e florestal | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59890 | Estação arqueólogica de São Gens | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61002 | Feitoria Fenícia de Abul | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61112 | Ferrarias del Rey | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61478 | Fonte dos Frades 12 | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61110 | Fornos da Cal | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59049 | Forte 1.º da Calhandriz | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59564 | Forte 1.º da Prezinheira | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59014 | Forte 2.º da Calhandriz | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59247 | Forte 2.º da Prezinheira | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59047 | Forte 3.º da Calhandriz | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61448 | Forte 3.º da Serra de Chipre | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59048 | Forte 4.º da Calhandriz | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59410 | Forte da Boa Vista | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59052 | Forte da Caneira | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59023 | Forte da Casa | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57629 | Forte da Portela Grande | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58047 | Forte da Raposeira Grande | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58338 | Forte da Serra da Aguieira | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58834 | Forte de Santo António da Enxara dos Cavaleiros (Norte) | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58835 | Forte de São Sebastião da Enxara dos Cavaleiros (Sul) | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59050 | Forte de Trancoso | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58337 | Forte do Arpim | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59011 | Forte do Moinho Branco | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59562 | Forte do Passo | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59029 | Forte do Picoto | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59038 | Forte do Picoto | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59246 | Forte do Tojal | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60787 | Fábrica de Salga de Peixe do Creiro | archaeological_site | Extração, produção e transformação | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58686 | Fórum romano de Tomar | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 59330 | Leira Longa | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61115 | Leião I | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 67930 | Mamoa de Lamas | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 57804 | Mamoas do Mezio | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |

*… e mais 33 casos*

### monument → castle (82)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 55049 | Arco Romano de Beja | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 52725 | Arco Romano de Dona Isabel | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49665 | Arco da Porta Nova | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 56243 | Arco da Torre Sineira da Sé | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 57142 | Arco da Vila | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54218 | Arco das Portas de Avis | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49858 | Arco de Jesus | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 60813 | Arco de Macau | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 53962 | Arco de Nossa Senhora da Conceição | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 58189 | Arco de São Sebastião | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 62997 | Arco de São Sebastião | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 50937 | Arco do Cego | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 62720 | Arco do Miradeiro | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 50072 | Arco do Rosário | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49771 | Arco/Porta de São Gonçalo | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 61227 | Arcos da Porta de Loulé | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 53466 | Boeirinho | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 50963 | Porta Férrea da Universidade de Coimbra | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 50203 | Porta da Armadura | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49889 | Porta da Coroada | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 56119 | Porta da Nossa Senhora do Amparo | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54060 | Porta da Peste | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 56105 | Porta da Ponte Velha | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 51030 | Porta da Ravessa | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49971 | Porta da Rua do Carvalho | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 52987 | Porta da Tapada | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54046 | Porta da Traição | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54092 | Porta da Traição | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 59883 | Porta da Traição | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 50429 | Porta da Vila | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54090 | Porta da Vila | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54091 | Porta da Vila | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 62180 | Porta da Vila | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 52874 | Porta de Albacara | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 55966 | Porta de Alconchel | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 62158 | Porta de Alegrete | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54682 | Porta de Alvacar | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 50492 | Porta de Aviz | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49973 | Porta de Baixo | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 55958 | Porta de Machede | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 50102 | Porta de Marialva | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54681 | Porta de Marrocos | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49766 | Porta de Moura | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54052 | Porta de Nossa Senhora do Rosário | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54684 | Porta de Santiago | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 55657 | Porta de Santiago | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49863 | Porta de Santo António | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 50343 | Porta de Santo António | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 62786 | Porta de Santo António | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |
| 54683 | Porta de São João | city_gate | — | signals suggest castle (w=2, sources=1:name=0,osm=1,sipa=0) |

*… e mais 32 casos*

### mountain → castle (61)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 66078 | Cabeço da Muralha | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64127 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64790 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65020 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65156 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65350 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65677 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65759 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65864 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65879 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66358 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66362 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66369 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66527 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66597 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66686 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66701 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66721 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66808 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66923 | Castelo Belinho | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64392 | Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64665 | Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65909 | Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66226 | Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66286 | Castelo Melhor | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65507 | Castelo Rodrigo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65305 | Castelo Velho | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65159 | Castelo Ventoso | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66137 | Castelo da Nóbrega | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65863 | Castelo de Ansiães | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66282 | Castelo de Monforte | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64795 | Castelo de Numão | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66438 | Castelo de Torres Vedras | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66445 | Castelo de Vide | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66064 | Castelo do Neiva | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64869 | Castelo do Rabaçal | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66294 | Castelo do Resinal | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64868 | Castelo do Sobral | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66426 | Castelo dos Mouros | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66463 | Castelo dos Mouros | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65168 | Fortaleza | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64886 | Forte | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65649 | Forte Velho | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67535 | Forte Velho | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66178 | Forte da Cidade | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64722 | Forte da Graça | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66213 | Forte de São Vicente | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65918 | Monte do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65781 | Monte do Forte | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67634 | Monte do Forte | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |

*… e mais 11 casos*

### viewpoint → castle (40)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 50207 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 51044 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54559 | Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49686 | Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55098 | Castelo Velho | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49778 | Forte São José | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50027 | Forte da Boa Vontade | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50028 | Forte da Boa Vontade | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50030 | Forte da Boa Vontade | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50042 | Forte do Faial | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54102 | Fortim do Caneiro | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49750 | Fortim do Faial | — | Cultural e recreativo | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52165 | Jardins da Fortaleza | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55443 | Miradouro Do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56008 | Miradouro Do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55020 | Miradouro da Cidadela | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54495 | Miradouro da Fortaleza de Segura | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50498 | Miradouro da Muralha Fernandina | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55270 | Miradouro da Senhora do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56437 | Miradouro da Torre de Belém | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62302 | Miradouro de Nossa Senhora do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50355 | Miradouro do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 53877 | Miradouro do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54161 | Miradouro do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54654 | Miradouro do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55551 | Miradouro do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50247 | Miradouro do Castelo de São Jorge | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 53033 | Miradouro do Castelo de São Jorge | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61907 | Miradouro do Castelo dos Mouros | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54555 | Miradouro do Forte da Carvalha | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52793 | Miradouro para o Morro de Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54444 | Miradouro para o Morro de Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55462 | Mirante de Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55891 | Observatório de Natureza de Nossa Senhora do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55954 | Pico Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50581 | Pico do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55915 | Pico do Fortim | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52224 | Ponta do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54613 | Torre de Aspa | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63538 | Torre de Observação Panorâmica de Belinho | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |

### cave → archaeology (30)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 55845 | Abrigo da Carrasca | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 52414 | Abrigo da Lapa Larga | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 55358 | Abrigo da Senhora das Lapas | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 55078 | Abrigo do Alecrim | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 54843 | Abrigo do Ninho do Bufo | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 54513 | Abrigo do Vale do Poio Novo | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 56298 | Abrigo do Vale dos Furos | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 55760 | Buraco da Pala | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 61338 | Casa da Moura | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 54303 | Fraga da Letra | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 52412 | Gruta Nova da Columbeira | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 55847 | Gruta Pequena da Serra da Carva | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 54317 | Gruta da Aroeira | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 54892 | Gruta da Ermida de Nossa Senhora da Lapa | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 51873 | Gruta da Furninha | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 52415 | Gruta da Lapa do Suão | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 56524 | Gruta da Ponte da Laje | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 52416 | Gruta das Pulgas | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 49751 | Gruta de Alcobertas | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 50407 | Gruta de Colaride | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 52413 | Gruta do Caixão | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 51206 | Gruta do Pego do Diabo | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 52732 | Gruta dos Bolhos - Gruta Casal da Lebre | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 56472 | Gruta em Nossa Senhora da Luz | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 50344 | Grutas do Poço Velho | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 55846 | Lapa da Figueira | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 52473 | Lapa do Repilau | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 56297 | Lapa dos Furos | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 52731 | Pedreiras Velhas | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 56316 | Verdelha dos Ruivos | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |

### park → palace (26)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 63121 | Jardim Interior do Palácio de São Bento | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58079 | Jardim Municipal de Paço de Arcos | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63349 | Jardim da Quinta Municipal do Palácio do Sobralinho | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62377 | Jardim de Paço de Sousa | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60310 | Jardim do Palácio | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57549 | Jardim do Palácio Marquês de Fronteira | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59971 | Jardim do Palácio Ventura Terra | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61924 | Jardim do Palácio da Flor da Murta | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60626 | Jardim do Palácio do Contador-Mor | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59530 | Jardim do Palácio do Freixo | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60078 | Jardim do Palácio dos Arcos | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 63699 | Jardim do Palácio dos Viscondes de Portalegre | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57769 | Jardim do Paço | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58415 | Jardim do Paço | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62351 | Jardim do Paço Episcopal | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57288 | Jardim do Solar D'Areia | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59146 | Jardim do Solar dos Zagallos | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61695 | Jardim do Terreiro do Paço | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62335 | Jardins da Casa do Paço | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58431 | Jardins do Palácio de Cristal | landmark | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63005 | Jardins do Palácio de Mateus | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 57779 | Largo do Paço | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62849 | Palácio e Parque Biester | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59666 | Parque do Solar dos Condes de Resende | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 61048 | Parque do Sub-Paço | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57863 | Quinta da Regaleira | manor | Residencial unifamiliar | signals suggest palace (w=2, sources=1:name=0,osm=1,sipa=0) |

### park → beach (23)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 60004 | Jardim da Avenida da Praia | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jar |
| 60252 | Jardins da Praia de Gondarém | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60251 | Jardins da Praia do Molhe | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 57833 | Parque da Praia Fluvial | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jar |
| 58122 | Parque da Praia Fluvial da Mamoa | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2; name s |
| 58418 | Parque da Praia Fluvial do Rego | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jar |
| 59473 | Parque da Praia dos Pescadores | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jar |
| 59700 | Parque da praia fluvial | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jar |
| 63314 | Parque de Lazer e Praia Fluvial do Rio Maçãs | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jar |
| 62769 | Parque de merendas - Praia da Falésia | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jar |
| 62960 | Parque e Praia Fluvial de Corvos à Nogueira | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jar |
| 59065 | Praia Fluvial Luzim | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60471 | Praia Fluvial Senhora da Ribeira | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60470 | Praia Fluvial da Peneda | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62201 | Praia Fluvial da Quinta do Barco | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56939 | Praia Fluvial da freguesia do Dominguiso. | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61096 | Praia Fluvial de Alvega | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63237 | Praia Fluvial de França | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62929 | Praia Fluvial de Pé Rodrigo | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63238 | Praia Fluvial de Rabal | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60731 | Praia Fluvial de Unhais da Serra | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61938 | Praia Fluvial de Virela | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61931 | Quinta da Praia das Fontes | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |

### viewpoint → church (18)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58885 | Capela de Nossa Senhora da Boa Viagem | — | — | signals suggest church (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49675 | Cristo Rei | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 53029 | Miradouro da Basílica da Estrela | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56229 | Miradouro da Baía do Mosteiro | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62466 | Miradouro da Ermida | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49875 | Miradouro da Senhora do Viso | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 50974 | Miradouro de Nossa Senhora das Neves | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 50975 | Miradouro de Nossa Senhora de Lurdes | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 49981 | Miradouro de Santa Bárbara | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 50803 | Miradouro de Santo António | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 52223 | Miradouro de Santo António | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 49982 | Miradouro de São Martinho | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 52403 | Miradouro de São Salvador do Mundo | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 52849 | Miradouro do Adro da Igreja | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50075 | Miradouro do Adro da Igreja de S. Martinho | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49696 | Senhora da Graça | — | — | signals suggest church (w=2, sources=1:name=0,osm=1,sipa=0) |
| 49661 | São Lourenço | — | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |
| 52172 | Torre da Igreja do Colégio | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |

### park → castle (18)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 63063 | Jardim Camilo Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62532 | Jardim Da Muralha Dos Muros | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62187 | Jardim da Quinta do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59233 | Jardim do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62385 | Jardim do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59172 | Jardim do Castelo de Santiago do Cacém | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 53040 | Jardim do Castelo de São Jorge | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 59872 | Jardim do Largo Camilo Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62409 | Parque Botânico do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58643 | Parque Ecológico Urbano de Viana do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 57911 | Parque Infantil da Quinta do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58094 | Parque da Praceta Camilo Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60377 | Parque da Torre de Vilar | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58642 | Parque de Viana do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60430 | Parque do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60774 | Parque do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58964 | Quinta do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62393 | Quinta do Castelo da Dona Chica | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |

### park → monument (18)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 56634 | Chafariz do Povo | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58521 | Cruzeiro de Cristelo | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59798 | Jardim do Chafariz | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 61573 | Jardim do Chafariz d'El Rei | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 58357 | Jardim do Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 58849 | Jardim do Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 62555 | Jardim do Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 57878 | Jardim do Largo do Pelourinho | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 57335 | Jardim do Senhor do Padrão | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 62152 | Largo do Chafariz | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 54340 | Padrão de Homenagem aos Expedicionários da 1ª Grande Gu | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60328 | Parque Chafariz do Penedo | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60094 | Parque Largo do Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60703 | Parque Urbano das Colinas do Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 59174 | Parque Verde da Quinta do Chafariz | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60116 | Parque do Chafariz da Curva | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60336 | Parque do Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |
| 60279 | Parque do Pelourinho | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); name starts with  |

### park → viewpoint (16)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 57843 | Jardim Júlio de Castilho-Miradouro de Santa Luzia | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0); name starts with |
| 59083 | Jardim Miradouro Penedo Monteiro | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0); name starts with |
| 62531 | Jardim do Miradouro da Ponta da Madrugada | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0); name starts with |
| 62530 | Jardim do Miradouro da Ponta do Sossego | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0); name starts with |
| 62448 | Jardim do Miradouro da Santa Bárbara | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0); name starts with |
| 53042 | Miradouro Eduardo Noronha | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 60001 | Miradouro Nossa Senhora do Monte | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 60948 | Miradouro Pablo Neruda | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 58557 | Miradouro Senhora da Piedade | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 56436 | Miradouro da Cabroeira | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 52206 | Miradouro da Quinta da Fidalga | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 62650 | Miradouro de Cabeço de Mouro | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 62066 | Miradouro de Porto Covo | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 62845 | Miradouro de Santa Catarina | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 61828 | Miradouro de Seda | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 62479 | Miradouro do Regueirão | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |

### natural_park → castle (16)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 69053 | Castelo de Sesimbra | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63752 | Cava de Viriato | archaeological_site | Militar | signals suggest castle (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 63746 | Conjunto das cinco fontes de Caneças (Fontaínhas, Piçar | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68602 | Fonte de Castelo de Vide | spring | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68606 | Fortaleza de Setúbal | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58051 | Forte de São Filipe | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68573 | Forte e Capela de Nossa Senhora da Rocha | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68254 | Ilha do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63793 | Reserva Natural do Morro de Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63988 | Zona Especial de Conservação da Ponta do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63972 | Zona Especial de Conservação do Morro de Castelo Branco | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63878 | Zona Especial de Proteção da Fortaleza da Torre Velha | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63794 | Área Marinha Protegida de Gestão de Recursos do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64103 | Área Protegida Privada Fraga Viva — Reduto do Batráquio | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63853 | Área Protegida para a Gestão de Habitats ou Espécies da | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63792 | Área Protegida para a Gestão de Habitats ou Espécies do | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |

### beach → castle (15)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 68572 | Praia Fluvial de Castelo do Neiva | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68350 | Praia Fluvial de Viana do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68253 | Praia Fluvial do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 69507 | Praia de Castelo do Neiva | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 69508 | Praia de Castelo do Neiva | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 67712 | Praia do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68246 | Praia do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68485 | Praia do Castelo do Queijo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 67792 | Praia do Forte | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68203 | Praia do Forte | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68230 | Praia do Forte | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68836 | Praia do Forte Novo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 69992 | Praia do Forte da Bandeira | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 67756 | Praia do Forte da Barra | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 69792 | Praia do Forte do Cão | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### viewpoint → lake (13)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 49955 | Barragem | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49996 | Barragem da Talisca | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52183 | Lagoa de São Brás | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49783 | Lagoa do Vento | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50644 | Miradouro Norte da Barragem de Santa Luzia | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49721 | Miradouro Sul da Barragem de Santa Luzia | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56190 | Miradouro da Barragem de Foz Tua | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56710 | Miradouro da Barragem de Foz-Tua | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54409 | Miradouro da Barragem do Fratel | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 53196 | Miradouro da Lagoa Seca | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54514 | Miradouro da Lagoa de Midões de Baixo | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49740 | Miradouro da Lagoa de Santiago | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49757 | Miradouro da Lagoa do Fogo | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |

### viewpoint → beach (13)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 53048 | Ilhéu da Praia Formosa | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54289 | Miradouro Praia da Barriga | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50309 | Miradouro Praia da Peralta | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54115 | Miradouro da Praia da Galé | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56715 | Miradouro da Praia do Canto Mosqueiro | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59784 | Miradouro da Praia do Homem do Leme | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50308 | Praia Dona Ana | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49747 | Praia Norte | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49803 | Praia da Alagoa | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52739 | Praia das Salemas | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52169 | Praia de Afife | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54288 | Praia do Porto das Barcas | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55970 | Praia dos Reis Magos | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |

### viewpoint → waterfall (13)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 49957 | Cascata | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52750 | Cascata Emília das Neves | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49956 | Cascata Salto Cabrito | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54981 | Cascata de Fragas de Pena Má | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56165 | Cascata do Agueirinho | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 51144 | Cascata do Folhadal | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55147 | Miradouro Cascata | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50119 | Miradouro da Cascata de Pitões das Júnias (Norte) | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49901 | Miradouro da Cascata do Arado | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55145 | Miradouro da Cascata do Caldeirão | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 53357 | Miradouro das Cascata de Fisgas de Ermelo | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52822 | Panorâmica das Cascata das Aguieiras | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50422 | Queda de Água | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |

### park → archaeology (13)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58612 | Jardim Conselheiro José Luciano de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 63684 | Jardim Daniel Edmundo Fonseca de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 58801 | Jardim Fernanda de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 57054 | Jardim da Vila de Castro Daire | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 53474 | Paraíso de Anta | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59723 | Parque Conde Castro Guimarães | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 57526 | Parque Ferreira de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 57346 | Parque Manuel António de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 58952 | Parque Urbano de Castro Daire | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 59654 | Parque da Anta das Pedras Grandes | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0); name starts wi |
| 60485 | Praça Doutor Albano de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60860 | Rua Eugénio de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62297 | Área de proteção da Anta de Santa Marta | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |

### viewpoint → cave (10)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 54234 | Boca do Buraco | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49905 | Furna | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50634 | Furna das Pombas | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 56646 | Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50523 | Lapa do Galho | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52774 | Miradouro da Furna da Pedrinha | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49854 | Miradouro da Senhora da Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 52032 | Miradouro da Senhora da Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49855 | Miradouro da Senhora da Lapa 2 | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50370 | Miradouro da Senhora da Lapa 2 | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |

### archaeology → church (10)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58026 | Capela de Nossa Senhora das Vitórias | ruins | — | signals suggest church (w=2, sources=1:name=0,osm=1,sipa=0); conflict w=2 |
| 56840 | Complexo Arqueológico dos Perdigões | archaeological_site | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 53737 | Convento de São João de Tarouca | ruins | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 53867 | Eremitério Os Santos | archaeological_site | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 50810 | Igreja Santa Maria | ruins | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 50114 | Igreja da Trindade | ruins | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 60613 | Igreja de São Gião | archaeological_site | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 51941 | Rocha dos Namorados | archaeological_site | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 61351 | Sítio Arqueológico do Alto da Vigia | archaeological_site | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 52428 | Templo Romano de Scallabis | archaeological_site | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |

### archaeology → castle (10)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 54747 | Castelo da Nave | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 51968 | Castelo de Fornos | archaeological_site | — | signals suggest castle (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 58281 | Forte de Santa Catarina | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 62495 | Forte do Pesqueiro dos Meninos | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 62111 | Fábrica da Baleia do Castelo | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 52168 | Ruínas do Forte de São Filipe | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 59426 | Ruínas do Forte de São Filipe | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 60492 | Ruínas do Forte de São Filipe | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 59882 | Vestígios Arqueológicos do Castelo Medieval de Torre de | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 60750 | Vestígios Arqueológicos do Castelo Medieval de Torre de | ruins | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### park → museum (10)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 60742 | Centro de Interpretação da Serra d'Arga | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63161 | Jardim do Museu | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62102 | Jardim do Museu Nogueira da Silva | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60374 | Jardim do Museu Regional de Beja | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60421 | Jardim do Museu Verdades Faria | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 62314 | Jardim do Museu de Etnologia | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 58231 | Jardim do Museu do Abade de Baçal | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |
| 60736 | Jardins do Museu Romântico | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58008 | Jardins do Museu do Mar | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0) |
| 58629 | Parque do Museu | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Ja |

### natural_park → lake (10)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 63964 | Fernão Ferro/Lagoa de Albufeira | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63288 | Lagoa dos Salgados: área protegida de âmbito nacional | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63917 | Paisagem Protegida da Albufeira do Azibo | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64069 | Reserva Florestal de Recreio da Lagoa das Patas | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63844 | Reserva Natural da Lagoa do Fogo | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63984 | Zona Especial de Conservação da Lagoa do Fogo | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64023 | Zona de Proteção Especial da Lagoa da Sancha | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64024 | Zona de Proteção Especial da Lagoa de Santo André | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63764 | Área Protegida para a Gestão de Habitats ou Espécies da | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63829 | Área Protegida para a Gestão de Habitats ou Espécies da | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |

### natural_park → church (9)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 59620 | Cerca do Convento de Cristo | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63747 | Conjunto da Igreja de Nossa Senhora do Cabo, casa dos c | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68638 | Convento e Igreja de Nossa Senhora do Carmo | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 69048 | Mosteiro de Santa Cruz (Sofia) | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 69020 | Mosteiro dos Jerónimos | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59788 | Ribat da Arrifana | archaeological_site | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 62573 | Santuário de Endovélico de São Miguel da Mota | archaeological_site | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 68634 | Santuário do Senhor Jesus da Pedra | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68609 | Sinagoga de Tomar | — | — | signals suggest church (w=2, sources=1:name=0,osm=1,sipa=0) |

### mountain → cave (9)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 66266 | Algar | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67570 | Buraco | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64387 | Cabeço da Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64428 | Cabeço da Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65002 | Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65517 | Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66506 | Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64491 | Lapa da Cadela | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66000 | Penedo da Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |

### beach → lake (9)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67912 | Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67671 | Lagoa de Albufeira | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67524 | Praia Fluvial da Albufeira de Montargil | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 69465 | Praia Fluvial da Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 69104 | Praia Gerês Albufeira | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68721 | Praia da Foz do Arelho-Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68838 | Praia da Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68998 | Praia de Lagoa I | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68990 | Praia de Lagoa II | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### palace → museum (8)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58408 | Associação Nacional das Farmácias | castle | Residencial unifamiliar | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0); conflict w=3 |
| 57827 | Casa Andresen | castle | Residencial unifamiliar | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0); conflict w=3 |
| 58525 | Casa Tait | castle | — | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0); conflict w=3 |
| 62998 | Casa do Corpo Santo | castle | Assistencial | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0); conflict w=3 |
| 57230 | Fundação Ricardo do Espírito Santo Silva | castle | — | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0); conflict w=3 |
| 57965 | Palacete Belmarço | manor | Residencial unifamiliar | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0) |
| 58798 | Palacete dos Condes de Sampayo | manor | — | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0) |
| 57163 | Palácio Foz | castle | — | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0); conflict w=3 |

### castle → palace (8)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58143 | Torre da Silva | tower | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1) |
| 61009 | Torre das Vidigueiras | castle | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 60084 | Torre das Águias | tower | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1) |
| 62023 | Torre do Carvalhal | tower | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1) |
| 62122 | Torre do Esporão | tower | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1) |
| 60450 | Torre do Palácio dos Terenas | tower | Residencial unifamiliar | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 61583 | Torre dos Alcoforados | tower | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1) |
| 57916 | Torre e Casa de Gomariz | tower | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1) |

### geosite → beach (8)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67025 | Discordância Angular da Praia do Telheiro | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 60379 | Duna Consolidada da Praia do Magoito | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64460 | Jazida de Icnofósseis da Praia da Salema | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64461 | Jazida de Icnofósseis da Praia da Salema | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64462 | Jazida de icnofósseis da Praia Grande do Rodizio | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64573 | Jazida de icnofósseis da Praia Santa | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64570 | Jazida de icnofósseis da Praia do Salgado | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67480 | Livraria da Praia dos Arrifes | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |

### mountain → archaeology (8)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 66124 | Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65682 | Castro Daire | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64337 | Castro Laboreiro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65826 | Castro Vicente | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65938 | Castro de Sobreira | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65528 | Chã de Anta | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67670 | Monte do Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66875 | Senhora do Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |

### viewpoint → archaeology (7)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 56653 | Castro de Bruçó (Castelo dos Mouros) | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 54156 | Miradouro Maria Augusta de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 57879 | Miradouro da Luneta dos Quartéis | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60552 | Miradouro de Montes Claros | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 62173 | Miradouro do Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50863 | Miradouro do Castro de Nossa Senhora da Graça | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50426 | Penedo de Castro | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |

### park → cave (7)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58153 | Gruta de Nossa Senhora de Lurdes | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 61754 | Jardim Público da Lapa do Lobo | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jard |
| 58714 | Lapa dos Esteios | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62774 | Parque Professor António Lucas Rodrigues Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jard |
| 63702 | Parque da Gruta da Lomba | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jard |
| 61925 | Parque de Merendas de Nossa Senhora da Lapa | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jard |
| 57952 | Quinta da Gruta | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |

### monument → church (6)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58941 | Igreja de Santa Clara | monument | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 62596 | Igreja de Santa Maria de Airães | monument | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 59219 | Igreja de Santa Maria do Castelo | monument | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 62909 | Igreja de São Mamede de Vila Verde | monument | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 58752 | Mosteiro de Santa Maria de Pombeiro | monument | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 54249 | Santuário de Nossa Senhora da Paz | wayside_cross | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |

### viewpoint → monument (5)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 62590 | Cristo Rei | monument | — | signals suggest monument (w=3, sources=1:name=0,osm=1,sipa=0) |
| 50142 | Cruz da Penha | wayside_cross | — | signals suggest monument (w=3, sources=1:name=0,osm=1,sipa=0) |
| 50020 | Cruzeiro - Sítio das Cruzinhas | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 55069 | Miradouro Pelourinho | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 51059 | Ribeira de Pena | — | Judicial | signals suggest monument (w=3, sources=1:name=0,osm=0,sipa=1) |

### geosite → archaeology (5)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 56599 | Gesseira de Santana | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 64371 | Mamoa | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |
| 50917 | Minas de Rio de Frades | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 60005 | Praia Jurássica de São Bento | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |
| 67053 | Sedimentos de Castro Roupal | — | — | signals suggest archaeology (w=2, sources=1:name=1,osm=0,sipa=0) |

### park → lake (5)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 57942 | Jardim Municipal de Albufeira | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jard |
| 60481 | Parque da Casa Da Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jard |
| 58586 | Parque da Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jard |
| 62196 | Parque de Merendas da Lagoa de Mira | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); name starts with Jard |
| 60113 | Rotunda da Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |

### natural_park → cave (5)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 59610 | Estação arqueológica da Lapa do Fumo | archaeological_site | Gruta | signals suggest cave (w=5, sources=2:name=1,osm=0,sipa=1); conflict w=5 |
| 63766 | Monumento Natural da Gruta das Torres | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63841 | Monumento Natural da Gruta do Carvão | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63820 | Monumento Natural do Algar do Carvão | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59366 | Sitio classificado Gruta do Zambujal | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |

### natural_park → palace (5)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 68636 | Palácio Fialho | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59614 | Palácio e Quinta da Bacalhoa | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 69049 | Porta Férrea, Paço das Escolas (Alta) | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62688 | Quinta do Paço | farm | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59920 | Termas Romanas de Évora | archaeological_site | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |

### natural_park → beach (5)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 62634 | Dunas Norte Praia da Tocha | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 62633 | Dunas Sul Praia da Tocha | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63967 | Maceda-Praia da Vieira | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 63805 | Reserva Natural Marinha do Ilhéu da Praia | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64043 | Zona de Proteção Especial do Ilhéu da Praia | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |

### mountain → monument (4)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 66109 | Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67014 | Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65972 | Monte Padrão | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 49862 | Vigia (João Moura) | memorial | — | signals suggest monument (w=3, sources=1:name=0,osm=1,sipa=0) |

### archaeology → monument (4)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 60840 | Aqueduto | ruins | Hidráulica de condução | signals suggest monument (w=2, sources=1:name=0,osm=0,sipa=1); conflict w=2 |
| 50226 | Aqueduto de Machico | ruins | Hidráulica de condução | signals suggest monument (w=2, sources=1:name=0,osm=0,sipa=1); conflict w=2 |
| 54061 | Fonte das Mentiras | ruins | Hidráulica de elevação, extração e distribuição | signals suggest monument (w=2, sources=1:name=0,osm=0,sipa=1); conflict w=2 |
| 52819 | Penedo de Lamas | archaeological_site | Comemorativo | signals suggest monument (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |

### mountain → viewpoint (4)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 65907 | Miradouro | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 50976 | Miradouro Monte Gordo | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 65213 | Miradouro de Monte Gordo | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 50977 | Miradouro do Morro dos Homens | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |

### castle → church (4)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 59418 | Igreja da Sé tower | tower | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 60706 | Palácio Nacional da Pena | castle | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 53258 | Torre do antigo Convento do Salvador | tower | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 58464 | Torre dos Clérigos | tower | Religioso | signals suggest church (w=3, sources=1:name=0,osm=0,sipa=1) |

### mountain → church (4)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67528 | A Catedral | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66880 | Ermida | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 65883 | Fraga da Ermida | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |
| 64147 | Mosteiro | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |

### geosite → lake (4)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67561 | Circo Glaciário da Lagoa Redonda | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67079 | Descontinuidades de Conrad e Moho em Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67078 | Gnaisses de Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67085 | Micaxistos de Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |

### museum → palace (3)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 49932 | Casa do Curro | — | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |
| 55774 | Galeria Artes Solar Sto António | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 49670 | Museu Paço dos Duques de Bragança | — | Residencial senhorial | signals suggest palace (w=5, sources=2:name=1,osm=0,sipa=1); conflict w=5 |

### geosite → castle (3)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67082 | Carreamento do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 59486 | Geomonumento do Forte de Santa Apolónia | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67083 | Peridotitos do Castelo | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |

### geosite → viewpoint (3)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 62231 | Miradouro da Livraria do Mondego | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 67064 | Miradouro da Nossa Senhora do Campo | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |
| 67061 | Miradouro da Serra do Cubo | — | — | signals suggest viewpoint (w=1, sources=1:name=1,osm=0,sipa=0) |

### mountain → lake (3)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 65313 | Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 66630 | Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67436 | Lagoa | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |

### lake → monument (3)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 68942 | Chafariz Maria da Fonte | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68758 | Chafariz de água | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |
| 69530 | Chafariz do Salvador | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0) |

### lake → beach (3)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 68817 | Praia Fluvial de Leomil | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68815 | Praia Fluvial do Cadoiço | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 70717 | Praia do Vau | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |

### lake → waterfall (3)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 69134 | Cascata de Água Cai d`Alto | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68971 | Reservatório da Cascata | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |
| 68853 | Tanque da Cascata | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |

### archaeology → museum (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 52193 | Núcleo Arqueológico da Rua dos Correeiros (BCP) | archaeological_site | — | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0); conflict w=3 |
| 56648 | Núcleo Museológico do Forte de São Filipe | ruins | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### viewpoint → museum (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 61401 | Centro de Interpretação de Aves | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0) |
| 53873 | Miradouro do Centro de Interpretação Turistico e Ambien | — | — | signals suggest museum (w=2, sources=1:name=1,osm=0,sipa=0) |

### monument → lake (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 54499 | Porta Velha da Lagoa | city_gate | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 55965 | Porta da Lagoa | city_gate | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### museum → church (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 57334 | Igreja de Santa Maria do Castelo | — | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |
| 57508 | Igreja de São João de Alporão | — | — | signals suggest church (w=4, sources=2:name=1,osm=1,sipa=0); conflict w=3 |

### palace → park (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 62814 | Casa da Gandarela | manor | Jardim | signals suggest park (w=2, sources=1:name=0,osm=0,sipa=1); conflict w=2 |
| 62675 | Quinta da Boa Viagem | manor | Jardim | signals suggest park (w=2, sources=1:name=0,osm=0,sipa=1); conflict w=2 |

### cave → beach (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67532 | Fenda da Praia do Gastão | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67035 | Grutas da Praia do Cavalo | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |

### waterfall → beach (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67562 | Açude da Praia | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |
| 67108 | Praia de Cidões | — | — | signals suggest beach (w=2, sources=1:name=1,osm=0,sipa=0) |

### beach → palace (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 68744 | Praia Fluvial de Paço de Mato | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 67797 | Praia de Paço de Arcos | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### lake → palace (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67825 | Albufeira do Paço | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 69672 | Lago do Palácio de Cristal | — | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0) |

### beach → cave (2)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 68672 | Praia Fluvial de Lapa dos Dinheiros | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |
| 68278 | Praia do Buraco | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### viewpoint → park (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 49717 | Miradouro de São Pedro de Alcântara | — | Jardim | signals suggest park (w=2, sources=1:name=0,osm=0,sipa=1) |

### viewpoint → geosite (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 50061 | Pedra Furada | — | Afloramento rochoso | signals suggest geosite (w=2, sources=1:name=0,osm=0,sipa=1) |

### church → museum (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 50592 | Convento da Graça Museu de Arte Sacra | monastery | — | signals suggest museum (w=5, sources=2:name=1,osm=1,sipa=0); conflict w=5 |

### monument → palace (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 50999 | Império Espírito Santo ou Casa do Espirito Santo | monument | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |

### monument → museum (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 57149 | Reservatório da Mãe d'Água das Amoreiras | aqueduct | — | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0) |

### natural_park → museum (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 57588 | Fonte do Ídolo | archaeological_site | — | signals suggest museum (w=3, sources=1:name=0,osm=1,sipa=0); conflict w=3 |

### palace → monument (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 57773 | Palácio da Inquisição | castle | Judicial | signals suggest monument (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |

### archaeology → palace (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58500 | Solar da Quinta da Torre do Carvalhal | ruins | — | signals suggest palace (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### park → waterfall (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 58600 | Cascata da Cabreia | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |

### lake → archaeology (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 59220 | Poço de Freitas | archaeological_site | — | signals suggest archaeology (w=3, sources=1:name=0,osm=1,sipa=0) |

### church → palace (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 59745 | Capela de Nossa Senhora da Nazaré | church | Residencial senhorial | signals suggest palace (w=3, sources=1:name=0,osm=0,sipa=1); conflict w=3 |

### waterfall → lake (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 64243 | Lagoa do Lajeado | — | — | signals suggest lake (w=2, sources=1:name=1,osm=0,sipa=0) |

### waterfall → cave (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 64370 | Córrego da Furna | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |

### cave → monument (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67237 | Gruta do Cruzeiro | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### geosite → cave (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67287 | Algar do Carvão | — | — | signals suggest cave (w=2, sources=1:name=1,osm=0,sipa=0) |

### beach → waterfall (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 67504 | Cascata da Cabroeira | — | — | signals suggest waterfall (w=2, sources=1:name=1,osm=0,sipa=0) |

### natural_park → monument (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 68510 | Padrão do Senhor Roubado | — | — | signals suggest monument (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### beach → church (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 68546 | Praia do Carreiro do Mosteiro | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0); conflict w=2 |

### lake → church (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 69046 | Tanque do Convento de Nossa Senhora da Boa Viagem | — | — | signals suggest church (w=2, sources=1:name=1,osm=0,sipa=0) |

### lake → castle (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 69077 | Lago Do Jardim dentro da Muralha | — | — | signals suggest castle (w=2, sources=1:name=1,osm=0,sipa=0) |

### cave → church (1)

| poi_id | Nome | OSM historic | SIPA tipologia | Motivo |
|---|---|---|---|---|
| 69116 | Gruta de Nossa Senhora do Minho | wayside_shrine | — | signals suggest church (w=2, sources=1:name=0,osm=1,sipa=0); conflict w=2 |

## SQL de Actualização — HIGH_CONFIDENCE (não executar sem revisão)

```sql
-- Preview: contagem por transição HIGH_CONFIDENCE
SELECT category, 'SUGGESTED' AS suggested, COUNT(*) FROM poi WHERE id IN (
-- archaeology → castle: 24 POIs
-- UPDATE poi SET category = 'castle' WHERE id IN (50094, 50369, 51072, 51107, 51108, 51110, 51111, 51112, 51114, 51115, ...);
-- archaeology → church: 1 POIs
-- UPDATE poi SET category = 'church' WHERE id IN (53648);
-- archaeology → museum: 3 POIs
-- UPDATE poi SET category = 'museum' WHERE id IN (57842, 58757, 58907);
-- castle → church: 1 POIs
-- UPDATE poi SET category = 'church' WHERE id IN (57100);
-- castle → palace: 1 POIs
-- UPDATE poi SET category = 'palace' WHERE id IN (62374);
-- cave → archaeology: 1 POIs
-- UPDATE poi SET category = 'archaeology' WHERE id IN (52540);
-- church → museum: 1 POIs
-- UPDATE poi SET category = 'museum' WHERE id IN (63516);
-- church → palace: 1 POIs
-- UPDATE poi SET category = 'palace' WHERE id IN (54330);
-- monument → castle: 1 POIs
-- UPDATE poi SET category = 'castle' WHERE id IN (62806);
-- museum → church: 1 POIs
-- UPDATE poi SET category = 'church' WHERE id IN (61990);
-- natural_park → archaeology: 60 POIs
-- UPDATE poi SET category = 'archaeology' WHERE id IN (55525, 57121, 57300, 57329, 57381, 57469, 57663, 57873, 58018, 58043, ...);
-- natural_park → castle: 57 POIs
-- UPDATE poi SET category = 'castle' WHERE id IN (57000, 57630, 57645, 57690, 57745, 58056, 58320, 58323, 58330, 58331, ...);
-- natural_park → cave: 1 POIs
-- UPDATE poi SET category = 'cave' WHERE id IN (59735);
-- natural_park → church: 4 POIs
-- UPDATE poi SET category = 'church' WHERE id IN (58367, 58582, 59573, 60014);
-- natural_park → museum: 1 POIs
-- UPDATE poi SET category = 'museum' WHERE id IN (57215);
-- natural_park → palace: 1 POIs
-- UPDATE poi SET category = 'palace' WHERE id IN (59606);
-- palace → castle: 6 POIs
-- UPDATE poi SET category = 'castle' WHERE id IN (57914, 58022, 58921, 59197, 61058, 61684);
-- palace → museum: 2 POIs
-- UPDATE poi SET category = 'museum' WHERE id IN (57234, 58522);
-- park → church: 1 POIs
-- UPDATE poi SET category = 'church' WHERE id IN (62169);
-- viewpoint → castle: 2 POIs
-- UPDATE poi SET category = 'castle' WHERE id IN (49795, 51002);
```

---

**Status:** Dry-run. Nenhuma alteração foi feita na BD.  
Para executar as correcções HIGH_CONFIDENCE, aprovar e correr o UPDATE em transacção.
