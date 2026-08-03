# Portugal na Mão — Ideias Futuras e Melhoramentos

> Backlog de ideias aprovadas conceptualmente mas ainda não agendadas.
> Não implementar sem decisão explícita do André. Referência completa:
> `.PT - Portugal na mão/Roadmap 2.0 - Ideias Produto UX e Descoberta.md`

## Produto / Descoberta

- **História Viva MVP** — "história em 60 segundos" nos POIs principais; estrutura da página POI: hero → porquê visitar → história curta → história completa → contexto → prática
- **Teias de história** — relações entre POIs via QIDs Wikidata (arquiteto, época, estilo, ordem religiosa); links "relacionados" no fim de cada POI
- **Camadas temáticas narrativas** — Portugal Romano, Medieval, Descobrimentos, Linhas de Torres, Megalítico, Judaico, Azulejo (reutiliza infra de filtros)
- **Slider temporal** — filtrar mapa por época histórica (requer campo `periodo` no enrichment)
- **"Surpreende-me"** — POI notável nunca visto; v1 heurística (classificação + imagem + descrição), v2 com scores
- **Explorar à Minha Volta → "que não conheço"** — excluir visitados/favoritos, priorizar notável desconhecido
- **POI do dia** — destaque editorial diário, sazonal, com notificação opcional
- **Pesquisa por intenção** — semântica/embeddings sobre descrições ("castelos com vista para pôr do sol")
- **Hierarquia visual por score** — Display Score controla destaque dos marcadores (v1: classificação oficial como proxy)
- **Modo "Portugal Secreto"** — toggle que esconde o óbvio

## História Viva (fases seguintes)

- Áudio-histórias 2 min (TTS sobre enrichment; integrar no Guided Tour)
- "Aqui aconteceu" — micro-narrativas georreferenciadas no mapa
- Antes e depois — fotos antigas com slider (arquivos municipais; começar por 2–3 cidades)
- Personagens — fichas históricas ligadas a POIs (D. Dinis → castelos)

## Gamificação / Comunidade

- **Passaporte Patrimonial** — check-in por proximidade; coleções (Monumentos Nacionais, castelos, 308 municípios); preparar modelo de dados "visitado" já no Perfil
- **% de Portugal descoberto** no perfil
- **Desafios municipais** — coleções criadas pelos municípios no dashboard (argumento de venda B2B)

## Viagem

- Trip Memories partilháveis como página pública bonita (aquisição orgânica)
- Modo "estou aqui, tenho 3 horas" — plano instantâneo
- Road trips com narrativa (planeador IA, Fase 4)
- Modo offline por região

## UX transversal

- Onboarding por curiosidade (1 pergunta de interesses; alimenta IA futura)
- Cartões de partilha bonitos para redes sociais (POI/coleção/memória)
- Acessibilidade como campo estruturado por POI (incluir no enrichment)
- Widget de ecrã inicial (POI do dia / perto de ti)

## ⚠️ Nota para o enrichment (evitar retrabalho)

Fixar já os formatos de dados que estas features vão precisar: campo `periodo` histórico, campo `acessibilidade`, relações Wikidata preservadas, textos no formato "porquê visitar + 60 segundos + completo".
