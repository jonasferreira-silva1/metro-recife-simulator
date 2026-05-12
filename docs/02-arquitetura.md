# 02 — Arquitetura do Sistema

## Visão Geral

O MetroRecife Simulator é uma aplicação full-stack composta por três camadas principais que se comunicam em tempo real via WebSocket.

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Backend | NestJS + TypeScript | Motor da simulação, máquina de estados, WebSocket Gateway, API REST |
| Frontend | Next.js + TypeScript | Painel de controle em tempo real, visualização das linhas, logs de eventos |
| Banco de Dados | PostgreSQL | Histórico de eventos, configuração de estações, logs de sensor de porta |
| Comunicação RT | Socket.io (WebSocket) | Emissão de eventos de estado do trem em tempo real para o frontend |
| Infraestrutura | Docker + Docker Compose | Orquestração de todos os serviços em ambiente isolado e reproduzível |

---

## Estrutura de Pastas

```
metro-recife-simulator/          ← raiz do monorepo
├── backend/                     ← NestJS API
│   └── src/
│       ├── simulation/          ← Módulo principal
│       │   ├── simulation.service.ts    ← Motor + FSM
│       │   ├── simulation.gateway.ts   ← WebSocket Gateway
│       │   └── simulation.controller.ts
│       ├── stations/            ← Módulo de estações + seed
│       │   ├── stations.service.ts
│       │   └── stations.entity.ts
│       ├── events/              ← Log de eventos persistido
│       │   └── events.service.ts
│       └── app.module.ts
├── frontend/                    ← Next.js App Router
│   ├── app/
│   └── components/metro/        ← Componentes do painel
├── docs/                        ← Esta pasta — documentação técnica
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Decisões Técnicas

| Decisão | Justificativa |
|---|---|
| NestJS como backend | Módulos, injeção de dependência e suporte nativo a WebSocket via Gateway tornam o NestJS ideal para um sistema orientado a eventos |
| FSM em TypeScript puro | Evitar bibliotecas externas (XState, etc.) demonstra domínio da lógica sem depender de abstrações |
| Socket.io em vez de WS nativo | Reconexão automática, namespaces e compatibilidade maior com diferentes clientes |
| PostgreSQL para eventos | Guardar histórico permite consultas, gráficos de uso e demonstração de queries em entrevistas |
| Docker Compose completo | Um recrutador deve conseguir rodar o projeto com um único comando |
| Seed de estações no startup | As 30 estações são inseridas automaticamente no primeiro boot — idempotente (sem passos manuais) |
