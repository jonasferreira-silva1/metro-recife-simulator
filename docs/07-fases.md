# 07 — Fases de Desenvolvimento

Cada fase entrega valor visível e pode ser demonstrada independentemente.

---

## FASE 1 — Fundação e Motor da Simulação

**Objetivo:** Backend rodando com a FSM funcional, estações no banco e WebSocket emitindo eventos.

**Entregáveis:**
- [ ] Setup do monorepo (backend + frontend + docs)
- [ ] Docker Compose com backend + PostgreSQL
- [ ] Módulo `stations` com seed das 30 estações
- [ ] Entidade `Station` com TypeORM
- [ ] FSM implementada em TypeScript puro (`state-machine.ts`)
- [ ] `SimulationService` com loop de tick e processamento de estados
- [ ] WebSocket Gateway emitindo `train:state-changed` a cada transição
- [ ] Endpoint REST `GET /simulation/status`
- [ ] Testes unitários da FSM cobrindo todas as transições válidas e inválidas

**Critério de Conclusão:**
> A FSM deve completar um ciclo completo de 15 estações sem erros, com eventos WebSocket logados no terminal.

---

## FASE 2 — Painel em Tempo Real

**Objetivo:** Frontend Next.js com painel visual mostrando os trens se movendo pelas estações em tempo real.

**Entregáveis:**
- [ ] Hook `useSocket` para conexão com o WebSocket do backend
- [ ] Componente `TrainMap` — linha visual com posição atual do trem
- [ ] Componente `TrainCard` — estado atual, estação, próxima estação
- [ ] Componente `EventLog` — feed em tempo real de todos os eventos
- [ ] Modo de aceleração — controle de velocidade (1x, 2x, 5x, 10x)

**Critério de Conclusão:**
> O painel deve estar acessível em `localhost:3000` e mostrar o trem avançando de estação em estação em tempo real, sem atualização manual de página.

---

## FASE 3 — Sensor de Porta e Operador

**Objetivo:** Sensor de porta com lógica completa de bloqueio, re-abertura e escalonamento.

**Entregáveis:**
- [ ] Lógica completa do sensor de porta no `SimulationService`
- [ ] Persistência de todos os eventos de sensor no PostgreSQL
- [ ] Componente `DoorSensor` — botão de bloqueio, contador, status visual
- [ ] Painel do Operador — força parada, libera via, reset de sensor
- [ ] Alertas visuais quando sensor atinge limite de tentativas
- [ ] Endpoint REST `POST /simulation/:trainId/door-event`

**Critério de Conclusão:**
> Deve ser possível simular um bloqueio de porta, ver o alerta no painel e resolver via botão do operador, tudo com eventos logados no banco.

---

## FASE 4 — Polimento, Duas Linhas e Portfolio

**Objetivo:** Adicionar Linha Sul, polir UI, README completo e preparar para publicação.

**Entregáveis:**
- [ ] Suporte completo à Linha Sul (azul) com 15 estações
- [ ] Visualização das duas linhas simultâneas no painel
- [ ] Lógica de integração na estação Joana Bezerra / Recife
- [ ] README profissional com GIF de demonstração e badges
- [ ] GitHub Actions — CI rodando testes automaticamente
- [ ] `.env.example` documentado
- [ ] Deploy opcional — Railway ou Render

**Critério de Conclusão:**
> O projeto deve ser executável com um único comando (`docker compose up`) e ter uma URL de demonstração ao vivo ou GIF animado no README.
