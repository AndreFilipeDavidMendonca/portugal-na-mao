# POI_CATEGORY_CORRECTION_APPLIED_REPORT

**Data:** 2026-07-03  
**Tipo:** Correcção HIGH_CONFIDENCE aplicada  
**Base:** POI_CATEGORY_CORRECTION_DRY_RUN_REPORT.md  

---

## Sumário

| Métrica | Valor |
|---|---|
| POIs corrigidos | 170 |
| Transições | 20 |
| Critério | HIGH_CONFIDENCE apenas |
| REVIEW/LOW aplicados | 0 |
| poi_sipa_enrichment alterada | NÃO |
| sipa_id alterado | NÃO |
| wikidata_id alterado | NÃO |
| publication_status alterado | NÃO |

## Transições Aplicadas

| actual | nova | POIs |
|---|---|---|
| `natural_park` | `archaeology` | 60 |
| `natural_park` | `castle` | 57 |
| `archaeology` | `castle` | 24 |
| `palace` | `castle` | 6 |
| `natural_park` | `church` | 4 |
| `archaeology` | `museum` | 3 |
| `viewpoint` | `castle` | 2 |
| `palace` | `museum` | 2 |
| `cave` | `archaeology` | 1 |
| `archaeology` | `church` | 1 |
| `church` | `palace` | 1 |
| `castle` | `church` | 1 |
| `natural_park` | `museum` | 1 |
| `natural_park` | `palace` | 1 |
| `natural_park` | `cave` | 1 |
| `museum` | `church` | 1 |
| `park` | `church` | 1 |
| `castle` | `palace` | 1 |
| `monument` | `castle` | 1 |
| `church` | `museum` | 1 |

## Critérios de Correcção

Apenas casos com **action=CHANGE** e **confidence=HIGH** foram aplicados:

- 2+ fontes concordantes (nome + OSM, nome + SIPA, OSM + SIPA)
- OU SIPA AUTO_ACCEPTED com sinal forte (w≥3) + nome concorda
- OU OSM historic (w=3) + nome concorda
- Sem conflito entre sinais (segunda melhor categoria < 70% do melhor)
- Sem miradouro no nome quando sugestão é herança/religiosa
- SIPA apenas de registos com review_status = AUTO_ACCEPTED

## Lista Completa de POIs Alterados

| poi_id | Nome | Anterior | Nova | OSM | SIPA | Sinais nome |
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
| 53025 | Reduto da Foz do Rio Sizandro | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | reduto |
| 61210 | Ruínas do Forte de Modorra | `archaeology` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | forte |
| 61259 | Torre de Redondos | `archaeology` | `castle` | historic=ruins | sipa_typology_1=Militar | Torre de |
| 53648 | Igreja de Nossa Senhora do Rosário da Tróia | `archaeology` | `church` | historic=archaeological_site | sipa_typology_1=Religioso | igreja |
| 58907 | Museu Termas Romanas de Chaves | `archaeology` | `museum` | historic=archaeological_site; tourism=museum | — | museu |
| 58757 | Núcleo Museológico Fenício | `archaeology` | `museum` | historic=archaeological_site; tourism=museum | — | núcleo museológico |
| 57842 | Núcleo Museológico do Castelo de São Jorge | `archaeology` | `museum` | historic=archaeological_site; tourism=museum | — | castelo; núcleo museológico |
| 57100 | Igreja de Santa Clara | `castle` | `church` | historic=castle; building=church | sipa_typology_1=Religioso | igreja |
| 62374 | Paço de Dona Loba | `castle` | `palace` | historic=castle | sipa_typology_1=Residencial senhorial | paço |
| 52540 | Abrigo Rupestre da Pala Pinta | `cave` | `archaeology` | historic=archaeological_site | sipa_typology_1=Abrigo rupestre | — |
| 63516 | Museu Nacional do Azulejo | `church` | `museum` | historic=monastery; tourism=museum | — | museu |
| 54330 | Capela do Paço Real de Salvaterra de Magos | `church` | `palace` | historic=chapel | sipa_typology_1=Residencial senhorial | paço |
| 62806 | Porta da Barbacã | `monument` | `castle` | historic=city_gate | — | barbacã |
| 61990 | Antiga Paroquial de Mira de Aire | `museum` | `church` | building=church; tourism=gallery | — | paroquial |
| 59624 | Anta da Estria | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | anta |
| 59623 | Anta da Pedra dos Mouros | `natural_park` | `archaeology` | historic=archaeological_site | — | anta |
| 59625 | Anta do Monte Abraão | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | anta |
| 61116 | Carrascal | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | — |
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
| 60806 | Estação arqueológica de Mogueira-São Martinho de Mouros | `natural_park` | `archaeology` | historic=archaeological_site | — | estação arqueológica |
| 58789 | Estação arqueológica de São João de Perrelos | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | estação arqueológica |
| 62970 | Monte da Tumba | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 62761 | Necrópole de Arnadelo | `natural_park` | `archaeology` | historic=archaeological_site | — | necrópole |
| 58779 | Necrópole de Carenque | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | necrópole |
| 62872 | Necrópole de São Miguel da Pena | `natural_park` | `archaeology` | historic=archaeological_site | — | necrópole |
| 55525 | Necrópole do Couto | `natural_park` | `archaeology` | historic=archaeological_site | — | necrópole |
| 60966 | Necrópole do Pardieiro | `natural_park` | `archaeology` | historic=archaeological_site | — | necrópole |
| 63720 | Povoado das Mesas do Castelinho | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 64119 | Povoado e Estação Arqueológica de Lovelhe | `natural_park` | `archaeology` | historic=archaeological_site | — | estação arqueológica |
| 63901 | Quinta do Almaraz | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 61312 | Recinto Megalítico de São Cristóvão | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Funerário | — |
| 62589 | Ruínas Romanas da Quinta do Ervedal | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | ruínas romanas |
| 61476 | Ruínas Romanas de Alcolobre | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 61300 | Ruínas Romanas de Bobadela | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | ruínas romanas |
| 58570 | Ruínas Romanas de Milreu | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 57663 | Ruínas Romanas de Miróbriga | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 57381 | Ruínas de Conímbriga | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
| 60360 | Ruínas do Castelo de Faria e da estação arqueológica su | `natural_park` | `archaeology` | historic=archaeological_site | — | castelo; estação arqueológica |
| 57873 | Ruínas romanas das Carvalheiras | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 64084 | Ruínas romanas de Tróia | `natural_park` | `archaeology` | historic=archaeological_site | — | ruínas romanas |
| 58149 | Sabugal Velho | `natural_park` | `archaeology` | historic=archaeological_site | sipa_typology_1=Povoado | — |
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
| 61418 | Bateria dos Melros | `natural_park` | `castle` | historic=archaeological_site | sipa_typology_1=Militar | bateria |
| 60904 | Castelo de Germanelo | `natural_park` | `castle` | historic=castle | sipa_typology_1=Militar | castelo |
| 59596 | Castelo de Torrejão | `natural_park` | `castle` | historic=castle | — | castelo |
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
| 59735 | Lapa da Bugalheira | `natural_park` | `cave` | historic=archaeological_site | sipa_typology_1=Gruta | lapa |
| 59573 | Igreja Paroquial de Cheleiros | `natural_park` | `church` | historic=church | sipa_typology_1=Religioso | igreja |
| 58367 | Igreja do Santíssimo Nome de Jesus | `natural_park` | `church` | historic=church | sipa_typology_1=Religioso | igreja |
| 58582 | Ruínas do Convento de Penafirme | `natural_park` | `church` | historic=monastery | sipa_typology_1=Religioso | convento |
| 60014 | Santuário de Panóias | `natural_park` | `church` | historic=archaeological_site | sipa_typology_1=Religioso | santuário |
| 57215 | Museu Miguel Bombarda | `natural_park` | `museum` | tourism=museum | — | museu |
| 59606 | Palácio do Farrobo (restos) | `natural_park` | `palace` | historic=palace | — | palácio |
| 57914 | Casa da Torre de Alvite | `palace` | `castle` | historic=castle | sipa_typology_1=Residencial senhorial | Torre de |
| 58921 | Casa do Castelo | `palace` | `castle` | historic=castle | — | castelo |
| 58022 | Castelo da Dona Chica | `palace` | `castle` | historic=castle | — | castelo |
| 59197 | Castelo de Castelo Rodrigo | `palace` | `castle` | historic=castle | — | castelo |
| 61684 | Castelo de Portuzelo | `palace` | `castle` | historic=castle | — | castelo |
| 61058 | Torre de Nevões | `palace` | `castle` | historic=castle | — | Torre de |
| 57234 | Museu Nacional de Arte Antiga | `palace` | `museum` | historic=castle; tourism=museum | — | museu |
| 58522 | Museu do Romântico | `palace` | `museum` | historic=castle; tourism=museum | — | museu |
| 62169 | Santuário de Nossa Senhora da Conceição da Rocha | `park` | `church` | amenity=place_of_worship | — | santuário |
| 51002 | Castelo da Nóbrega | `viewpoint` | `castle` | — | sipa_typology_1=Militar | castelo |
| 49795 | Torre de São Lourenço | `viewpoint` | `castle` | — | sipa_typology_1=Militar | Torre de |

## Contagem de Categorias — Antes vs Depois

| Categoria | Antes | Depois | Diferença |
|---|---|---|---|
| `archaeology` | 666 | 699 | **+33** |
| `beach` | 1041 | 1041 | 0 |
| `castle` | 249 | 337 | **+88** |
| `cave` | 278 | 278 | 0 |
| `church` | 266 | 272 | **+6** |
| `geosite` | 222 | 222 | 0 |
| `lake` | 1000 | 1000 | 0 |
| `monument` | 1647 | 1646 | **-1** |
| `mountain` | 2898 | 2898 | 0 |
| `museum` | 645 | 651 | **+6** |
| `natural_park` | 772 | 648 | **-124** |
| `palace` | 396 | 391 | **-5** |
| `park` | 3470 | 3469 | **-1** |
| `viewpoint` | 1393 | 1391 | **-2** |
| `waterfall` | 242 | 242 | 0 |

## Confirmações de Integridade

| Verificação | Resultado |
|---|---|
| REVIEW/LOW incluídos | ✅ 0 |
| poi_sipa_enrichment inalterada | ✅ 1656 registos |
| poi.sipa_id inalterado | ✅ 1656 POIs com sipa_id |
| wikidata_id inalterado | ✅ não tocado |
| publication_status inalterado | ✅ não tocado |
| imagens/media inalteradas | ✅ não tocadas |

## SQL Executado

```sql
BEGIN;

-- archaeology → castle: 24 rows
UPDATE poi SET category = 'castle' WHERE id = ANY(ARRAY[50094,50369,51072,51107,51108,51110,51111,51112,51114,51115,51117,51212,51214,51217,52034,52272,52274,52276,53025,53861,57084,61059,61210,61259]) AND category = 'archaeology';

-- archaeology → church: 1 rows
UPDATE poi SET category = 'church' WHERE id = ANY(ARRAY[53648]) AND category = 'archaeology';

-- archaeology → museum: 3 rows
UPDATE poi SET category = 'museum' WHERE id = ANY(ARRAY[57842,58757,58907]) AND category = 'archaeology';

-- castle → church: 1 rows
UPDATE poi SET category = 'church' WHERE id = ANY(ARRAY[57100]) AND category = 'castle';

-- castle → palace: 1 rows
UPDATE poi SET category = 'palace' WHERE id = ANY(ARRAY[62374]) AND category = 'castle';

-- cave → archaeology: 1 rows
UPDATE poi SET category = 'archaeology' WHERE id = ANY(ARRAY[52540]) AND category = 'cave';

-- church → museum: 1 rows
UPDATE poi SET category = 'museum' WHERE id = ANY(ARRAY[63516]) AND category = 'church';

-- church → palace: 1 rows
UPDATE poi SET category = 'palace' WHERE id = ANY(ARRAY[54330]) AND category = 'church';

-- monument → castle: 1 rows
UPDATE poi SET category = 'castle' WHERE id = ANY(ARRAY[62806]) AND category = 'monument';

-- museum → church: 1 rows
UPDATE poi SET category = 'church' WHERE id = ANY(ARRAY[61990]) AND category = 'museum';

-- natural_park → archaeology: 60 rows
UPDATE poi SET category = 'archaeology' WHERE id = ANY(ARRAY[55525,57121,57300,57329,57381,57469,57663,57873,58018,58043,58149,58356,58570,58630,58633,58700,58701,58702,58779,58789,58896,59615,59623,59624,59625,59748,59860,59933,59943,59994,60011,60360,60698,60806,60966,61061,61111,61116,61176,61248,61300,61312,61476,61495,61572,61786,61834,61934,62589,62761,62820,62872,62970,63720,63751,63901,64084,64085,64119,70754]) AND category = 'natural_park';

-- natural_park → castle: 57 rows
UPDATE poi SET category = 'castle' WHERE id = ANY(ARRAY[57000,57630,57645,57690,57745,58056,58320,58323,58330,58331,58333,58334,58341,59010,59015,59016,59017,59018,59019,59020,59021,59022,59024,59025,59026,59027,59028,59030,59031,59032,59033,59034,59035,59036,59037,59039,59040,59041,59046,59051,59053,59054,59055,59248,59249,59563,59566,59567,59596,59611,60904,61418,61421,61422,61424,61425,61438]) AND category = 'natural_park';

-- natural_park → cave: 1 rows
UPDATE poi SET category = 'cave' WHERE id = ANY(ARRAY[59735]) AND category = 'natural_park';

-- natural_park → church: 4 rows
UPDATE poi SET category = 'church' WHERE id = ANY(ARRAY[58367,58582,59573,60014]) AND category = 'natural_park';

-- natural_park → museum: 1 rows
UPDATE poi SET category = 'museum' WHERE id = ANY(ARRAY[57215]) AND category = 'natural_park';

-- natural_park → palace: 1 rows
UPDATE poi SET category = 'palace' WHERE id = ANY(ARRAY[59606]) AND category = 'natural_park';

-- palace → castle: 6 rows
UPDATE poi SET category = 'castle' WHERE id = ANY(ARRAY[57914,58022,58921,59197,61058,61684]) AND category = 'palace';

-- palace → museum: 2 rows
UPDATE poi SET category = 'museum' WHERE id = ANY(ARRAY[57234,58522]) AND category = 'palace';

-- park → church: 1 rows
UPDATE poi SET category = 'church' WHERE id = ANY(ARRAY[62169]) AND category = 'park';

-- viewpoint → castle: 2 rows
UPDATE poi SET category = 'castle' WHERE id = ANY(ARRAY[49795,51002]) AND category = 'viewpoint';

COMMIT;
```

---

**Status:** ✅ Aplicado e confirmado com COMMIT.
