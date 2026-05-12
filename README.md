<div align="center">

# 🚇 MetroRecife Simulator

**Simulador em tempo real do Metrô do Recife — CBTU**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)

*Desenvolvido por [Jonas Ferreira Silva](https://github.com/jonasferreira-silva1) — Recife, Pernambuco*

</div>

---

## A História Por Trás do Projeto

Todo dia útil, o metrô da CBTU corta Recife de ponta a ponta. Quem mora no Grande Recife conhece bem essa rotina: esperar na plataforma, ouvir o apito, sentir as portas fecharem com aquele peso metálico característico. Para a maioria das pessoas é apenas transporte. Para um desenvolvedor curioso, é um sistema de estados.

Este projeto nasceu de uma pergunta simples feita em um dia comum dentro de um vagão entre Camaragibe e Recife:

> *"Como eu simularia isso em código?"*

Não havia cliente pedindo, não havia prazo, não havia entrevista marcada. Era pura curiosidade técnica — a vontade de pegar algo do mundo real que todo pernambucano conhece e transformá-lo em software, com estados, regras, sensores e tempo real.

---

## Por Que Este Projeto Importa

Portfolios de desenvolvimento costumam ser iguais: um To-Do List, um e-commerce básico, um CRUD com autenticação. O MetroRecife Simulator conta uma história diferente. Ele demonstra três qualidades que todo time de engenharia valoriza:

- **Iniciativa** — o projeto existiu porque o desenvolvedor quis, não porque foi pedido
- **Pensamento de sistemas** — modelar uma FSM de trem exige entender transições, concorrência e condições de erro
- **Execução** — uma simulação visual funcionando é infinitamente mais convincente do que arquitetura documentada sem código rodando

---

## Sobre o Sistema Real — CBTU Recife

| | |
|---|---|
| **Operadora** | CBTU — Companhia Brasileira de Trens Urbanos |
| **Cidade** | Região Metropolitana do Recife — Pernambuco, Brasil |
| **Linhas simuladas** | Linha Centro (vermelha) e Linha Sul (azul) |
| **Total de estações** | 30 estações (15 por linha) |
| **Passageiros/dia** | ~350.000 usuários (dado público CBTU) |

---

## Arquitetura

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Next.js       │◄──────────────────►│   NestJS        │
│   Frontend      │                    │   Backend       │
│   :3000         │                    │   :3001         │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                │ TypeORM
                                                ▼
                                       ┌─────────────────┐
                                       │   PostgreSQL    │
                                       │   :5432         │
                                       └─────────────────┘
```

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Backend | NestJS + TypeScript | Motor da simulação, FSM, WebSocket Gateway, API REST |
| Frontend | Next.js + TypeScript | Painel de controle em tempo real, visualização das linhas |
| Banco de Dados | PostgreSQL | Histórico de eventos, estações, logs de sensor de porta |
| Comunicação RT | Socket.io | Emissão de eventos de estado em tempo real |
| Infraestrutura | Docker + Docker Compose | Orquestração de todos os serviços |

---

## Linhas Simuladas

### 🔴 Linha Centro — Camaragibe → Recife (15 estações)

`Camaragibe` → `Cosme e Damião` → `Rodoviária` → `Curado` → `Alto do Céu` → `Coqueiral` → `Tejipió` → `Barro` → `Werneck` → `Santa Luzia` → `Mangueira` → `Ipiranga` → `Afogados` → `Joana Bezerra` → `Recife`

### 🔵 Linha Sul — Jaboatão → Recife (15 estações)

`Jaboatão` → `Engenho Velho` → `Floriano` → `Cavaleiro` → `Cajueiro Seco` → `Prazeres` → `Monte dos Guararapes` → `Porta Larga` → `Aeroporto` → `Tancredo Neves` → `Shopping` → `Antônio Falcão` → `Imbiribeira` → `Largo da Paz` → `Recife`

---

## Máquina de Estados do Trem

O coração do sistema é a FSM (Finite State Machine) que governa o comportamento de cada trem. Cada instância possui um estado exclusivo e só pode transitar entre estados por eventos válidos.

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

| Estado | Descrição |
|---|---|
| `MOVING` | Trem se deslocando entre duas estações |
| `ARRIVING` | Trem desacelerando, a 500m da próxima estação |
| `STOPPED` | Trem parado na plataforma, portas ainda fechadas |
| `DOORS_OPEN` | Portas abertas, embarque e desembarque em curso |
| `DOOR_BLOCKED` | Sensor de porta acionado — objeto ou pessoa detectados |
| `DOORS_CLOSING` | Comando de fechar portas emitido |
| `DEPARTING` | Portas confirmadas fechadas, aguardando liberação da via |

### Lógica do Sensor de Porta

1. Simulado via botão no painel ou automaticamente com probabilidade configurável
2. Cada acionamento incrementa um contador de tentativas
3. Após 3 tentativas, o sistema emite alerta para o painel do operador
4. Após 30 segundos no estado `DOOR_BLOCKED`, escala para intervenção manual
5. Todos os eventos são persistidos no banco com timestamp e estação

---

## Como Executar

### Pré-requisitos

- Docker Desktop >= 24.x
- Node.js >= 20.x (para desenvolvimento local)
- Git

### Execução completa com Docker

```bash
git clone https://github.com/jonasferreira-silva1/metro-recife-simulator
cd metro-recife-simulator
cp .env.example .env
docker compose up --build
```

Acesse em: **http://localhost:3000**

### Desenvolvimento local

```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend (outro terminal)
cd frontend && npm install && npm run dev
```

### Testes

```bash
cd backend
npm run test        # testes unitários da FSM
npm run test:cov    # com cobertura
```

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://metro:metro@db:5432/metro_recife` | Conexão com PostgreSQL |
| `PORT` | `3001` | Porta do backend |
| `SIMULATION_TICK_MS` | `1000` | Intervalo do timer em ms |
| `DOOR_SENSOR_PROBABILITY` | `0.1` | Chance de bloqueio automático |
| `MAX_DOOR_ATTEMPTS` | `3` | Tentativas antes do alerta |
| `DOOR_BLOCK_TIMEOUT` | `30` | Segundos até escalonamento manual |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | URL do WebSocket para o frontend |

---

## Estrutura do Projeto

```
metro-recife-simulator/
├── backend/                    # NestJS API
│   └── src/
│       ├── simulation/         # Motor + FSM + WebSocket Gateway
│       ├── stations/           # Módulo de estações + seed automático
│       └── events/             # Log de eventos persistido no banco
├── frontend/                   # Next.js App Router
│   ├── app/
│   └── components/metro/       # Componentes do painel de controle
├── docs/                       # Documentação técnica completa
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Fases de Desenvolvimento

- [x] **Fase 1** — Fundação: monorepo, NestJS, FSM, WebSocket Gateway, seed das estações
- [ ] **Fase 2** — Painel em tempo real: hook `useSocket`, TrainMap, TrainCard, EventLog
- [ ] **Fase 3** — Sensor de porta e painel do operador com alertas
- [ ] **Fase 4** — Duas linhas simultâneas, CI/CD, deploy ao vivo

---

## Documentação Técnica

A pasta [`docs/`](./docs/) contém a documentação completa do projeto:

- [Visão Geral](./docs/01-visao-geral.md)
- [Arquitetura](./docs/02-arquitetura.md)
- [Estações](./docs/03-estacoes.md)
- [Máquina de Estados (FSM)](./docs/04-fsm.md)
- [Modelo de Dados](./docs/05-modelo-de-dados.md)
- [Contrato WebSocket](./docs/06-websocket.md)
- [Fases de Desenvolvimento](./docs/07-fases.md)
- [Guia de Commits](./docs/08-commits.md)
- [Como Executar](./docs/09-como-executar.md)

---

<div align="center">

**Jonas Ferreira Silva** — Full-Stack Developer | Recife, Pernambuco

[github.com/jonasferreira-silva1](https://github.com/jonasferreira-silva1)

*CBTU — Metrô do Recife Simulator*

</div>
