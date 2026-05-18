<div align="center">

# MetroRecife Simulator

**Simulador em tempo real do Metrô do Recife — CBTU**

*Documentação Técnica & Guia de Desenvolvimento · Versão 1.0 · Recife, 2026*

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)

**Jonas Ferreira Silva** — [github.com/jonasferreira-silva1](https://github.com/jonasferreira-silva1)

</div>

---

## Uma curiosidade que virou código

Desde criança, toda vez que entrava no metrô eu olhava para aquelas portas, para o apito, para o painel do maquinista e pensava: *como isso funciona por dentro?* Não era vaidade técnica — era curiosidade mesmo. O metrô da CBTU faz parte da rotina de quem vive no Grande Recife: esperar na plataforma, sentir o peso das portas fechando, ver o trem sumir no túnel. Para quase todo mundo é só transporte. Para quem desenvolve software, é um **sistema de estados**.

Um dia, entre Camaragibe e Recife, a pergunta ficou impossível de ignorar:

> *"Como eu simularia isso em código?"*

Não havia cliente, prazo ou entrevista. Só a vontade de pegar algo que todo pernambucano conhece — o Metrô do Recife — e traduzir em TypeScript: estados, regras, sensores, tempo real. O **MetroRecife Simulator** é essa tradução.

---

## Por que este projeto existe

Portfólios costumam repetir os mesmos padrões: to-do list, e-commerce, CRUD com login. Nada de errado com isso — mas raramente contam uma história. Este projeto conta a de alguém que **não esperou um requisito aparecer**: olhou para a cidade, modelou as regras do zero e entregou algo que qualquer pessoa pode abrir no navegador e ver funcionando.

Três qualidades que times de engenharia valorizam:

| Qualidade | O que o projeto demonstra |
|-----------|---------------------------|
| **Iniciativa** | Existiu porque houve curiosidade, não porque alguém pediu |
| **Pensamento de sistemas** | FSM de trem, concorrência, falhas de sensor, escalonamento ao operador |
| **Execução** | Painel ao vivo > diagrama sem código rodando |

---

## O sistema real — CBTU Recife

| | |
|---|---|
| **Operadora** | CBTU — Companhia Brasileira de Trens Urbanos |
| **Região** | Grande Recife — Pernambuco, Brasil |
| **Linhas** | Centro (vermelha) e Sul (azul) |
| **Estações** | 30 (15 por linha) — dados reais do mapa oficial |
| **Passageiros/dia** | ~350.000 (dado público CBTU) |

### Linha Centro — Camaragibe → Recife

`Camaragibe` → `Cosme e Damião` → `Rodoviária` → `Curado` → `Alto do Céu` → `Coqueiral` → `Tejipió` → `Barro` → `Werneck` → `Santa Luzia` → `Mangueira` → `Ipiranga` → `Afogados` → `Joana Bezerra` → `Recife`

### Linha Sul — Jaboatão → Recife

`Jaboatão` → `Engenho Velho` → `Floriano` → `Cavaleiro` → `Cajueiro Seco` → `Prazeres` → `Monte dos Guararapes` → `Porta Larga` → `Aeroporto` → `Tancredo Neves` → `Shopping` → `Antônio Falcão` → `Imbiribeira` → `Largo da Paz` → `Recife`

---

## Arquitetura

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Next.js       │◄──────────────────►│   NestJS        │
│   :3000         │                    │   :3001         │
└─────────────────┘                    └────────┬────────┘
                                                │ TypeORM
                                                ▼
                                       ┌─────────────────┐
                                       │   PostgreSQL    │
                                       │   :5432         │
                                       └─────────────────┘
```

| Camada | Stack | Papel |
|--------|-------|-------|
| Backend | NestJS + TypeScript | Motor da simulação, FSM, WebSocket, API REST |
| Frontend | Next.js + TypeScript | Painel em tempo real, mapa, operador, log |
| Banco | PostgreSQL | Estações, trens, histórico de eventos |
| RT | Socket.io | Estado do trem e comandos do operador |
| Infra | Docker Compose | Um comando sobe tudo |

---

## Máquina de estados do trem

```
MOVING ──► ARRIVING ──► STOPPED ──► DOORS_OPEN
                                         │
                              ┌──────────┴──────────┐
                         (sensor OK)         (sensor BLOQUEADO)
                              │                     │
                        DOORS_CLOSING         DOOR_BLOCKED
                              │                     │
                          DEPARTING ◄── DOORS_OPEN ◄┘
                              │
                           MOVING
```

**Sensor de porta (Fase 3):**

- Bloqueio manual (painel) ou automático (`DOOR_SENSOR_PROBABILITY`)
- Contador de tentativas; após `MAX_DOOR_ATTEMPTS` → alerta ao operador
- Após `DOOR_BLOCK_TIMEOUT` segundos em `DOOR_BLOCKED` → escalonamento manual
- Eventos persistidos no PostgreSQL

**Comandos do operador (WebSocket):** `door:block`, `door:unblock`, `operator:force-stop`, `operator:release`, `simulation:set-speed`

---

## Como executar (Docker)

### Pré-requisitos

- Docker Desktop >= 24.x  
- Git  

### Subir tudo

```bash
git clone https://github.com/jonasferreira-silva1/metro-recife-simulator
cd metro-recife-simulator
cp .env.example .env
docker compose up --build
```

Abra **http://localhost:3000**

### Testes (backend — FSM)

```bash
cd backend
npm install
npm run test
```

### Desenvolvimento local (sem Docker)

```bash
# Terminal 1 — backend
cd backend && npm install && npm run start:dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | `postgresql://metro:metro@db:5432/metro_recife` | PostgreSQL |
| `PORT` | `3001` | Backend |
| `FRONTEND_URL` | `http://localhost:3000` | CORS |
| `SIMULATION_TICK_MS` | `1000` | Intervalo do tick |
| `DOOR_SENSOR_PROBABILITY` | `0.1` | Bloqueio automático |
| `MAX_DOOR_ATTEMPTS` | `3` | Tentativas antes do alerta |
| `DOOR_BLOCK_TIMEOUT` | `30` | Segundos até escalonamento |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | WebSocket no frontend |

---

## Fases de desenvolvimento

| Fase | Status | Entrega |
|------|--------|---------|
| **1 — Fundação** | Concluída | NestJS, FSM, seed 30 estações, WS, testes unitários |
| **2 — Painel RT** | Concluída | Next.js, `useSocket`, mapa, cards, log, velocidade |
| **3 — Sensor & operador** | Concluída | Comandos WS, alertas, REST de teste, persistência |
| **4 — Polimento** | Em andamento | CI/CD, deploy, GIF no README, integração Joana Bezerra |

---

## Estrutura do repositório

```
metro-recife-simulator/
├── backend/src/
│   ├── simulation/     # FSM, service, gateway, controller
│   ├── stations/       # Seed idempotente das 30 estações
│   └── events/         # Log no PostgreSQL
├── frontend/
│   ├── components/metro/   # Dashboard, mapa, operador, sensor
│   ├── hooks/use-socket.ts
│   └── lib/metro/          # Store, tipos, cliente WS
├── docs/               # Documentação técnica detalhada
├── docker-compose.yml
└── .env.example
```

---

## Documentação técnica

- [Visão geral](./docs/01-visao-geral.md) · [Arquitetura](./docs/02-arquitetura.md) · [Estações](./docs/03-estacoes.md)
- [FSM](./docs/04-fsm.md) · [Modelo de dados](./docs/05-modelo-de-dados.md) · [WebSocket](./docs/06-websocket.md)
- [Fases](./docs/07-fases.md) · [Commits](./docs/08-commits.md) · [Como executar](./docs/09-como-executar.md)

---

## Decisões técnicas (resumo)

| Decisão | Motivo |
|---------|--------|
| NestJS | Módulos, DI e Gateway WebSocket nativos |
| FSM em TS puro | Domínio explícito, testável, sem biblioteca extra |
| Socket.io | Reconexão e integração simples com Next.js |
| PostgreSQL | Histórico consultável em entrevistas |
| Docker Compose | Um comando para quem avalia o portfólio |

---

<div align="center">

**Jonas Ferreira Silva** — Full-Stack Developer · Recife, Pernambuco

[github.com/jonasferreira-silva1](https://github.com/jonasferreira-silva1)

*CBTU — Metrô do Recife Simulator*

</div>
