# 03 — Mapeamento das Estações

Dados reais extraídos do mapa oficial da CBTU Recife.

---

## Linha Centro — Vermelha

Sentido Camaragibe → Recife. 15 estações, trajeto de aproximadamente 28 km.

| # | Estação | Observação |
|---|---|---|
| 01 | Camaragibe | Terminal — início da linha |
| 02 | Cosme e Damião | Integração metrô-ônibus |
| 03 | Rodoviária | Hub rodoviário |
| 04 | Curado | — |
| 05 | Alto do Céu | — |
| 06 | Coqueiral | Integração metrô-ônibus |
| 07 | Tejipió | — |
| 08 | Barro | — |
| 09 | Werneck | — |
| 10 | Santa Luzia | — |
| 11 | Mangueira | — |
| 12 | Ipiranga | — |
| 13 | Afogados | — |
| 14 | Joana Bezerra | Integração Linha Sul |
| 15 | Recife | Terminal Central — fim da linha |

---

## Linha Sul — Azul

Sentido Jaboatão → Recife. 15 estações.

| # | Estação | Observação |
|---|---|---|
| 01 | Jaboatão | Terminal — início da linha |
| 02 | Engenho Velho | — |
| 03 | Floriano | — |
| 04 | Cavaleiro | — |
| 05 | Cajueiro Seco | — |
| 06 | Prazeres | — |
| 07 | Monte dos Guararapes | Integração Metrô-Aeroporto |
| 08 | Porta Larga | — |
| 09 | Aeroporto | Integração Aeroporto Internacional |
| 10 | Tancredo Neves | — |
| 11 | Shopping | — |
| 12 | Antônio Falcão | — |
| 13 | Imbiribeira | — |
| 14 | Largo da Paz | Integração Linha Centro |
| 15 | Recife | Terminal Central — fim da linha |

---

## Regras de Negócio das Estações

- **Terminais** (`isTerminal: true`): Camaragibe, Recife (Centro), Jaboatão, Recife (Sul)
- **Integração** (`isTransfer: true`): estações com conexão entre linhas ou modal
- **dwellTime**: tempo padrão de parada em segundos (terminais = 60s, integração = 35-45s, demais = 30s)
- O trem inverte a direção automaticamente ao chegar em um terminal
