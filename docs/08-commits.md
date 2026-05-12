# 08 — Guia de Commits

## Convenção

Seguimos o padrão **Conventional Commits**:

```
<tipo>(<escopo>): <descrição curta em inglês>
```

### Tipos

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `test` | Adição ou correção de testes |
| `refactor` | Refatoração sem mudança de comportamento |
| `chore` | Configuração, setup, dependências |
| `docs` | Documentação |
| `style` | Formatação, sem mudança de lógica |

---

## Cadência por Fase

### FASE 1 — Fundação

```
chore: initialize monorepo with frontend, backend and docs structure
chore: add root .gitignore and .env.example
docs: add full technical documentation in docs/ folder
chore: add docker-compose with postgres and backend services
feat(backend): bootstrap NestJS app with ConfigModule
feat(backend): add TypeORM connection with PostgreSQL
feat(backend): add Station entity with line and order fields
feat(backend): add StationsService with seed of 30 CBTU stations
feat(backend): implement TrainState enum and FSM transitions
feat(backend): add SimulationService with tick loop
feat(backend): add WebSocket Gateway with Socket.io
feat(backend): add SimulationController with REST endpoints
test(backend): add FSM unit tests for all valid transitions
test(backend): add FSM unit tests for invalid transitions
docs: update README with phase 1 completion status
```

### FASE 2 — Painel em Tempo Real

```
feat(frontend): add useSocket hook connecting to backend WebSocket
feat(frontend): update simulation store to consume WebSocket events
feat(frontend): update TrainMap to reflect real backend state
feat(frontend): update TrainCard with live state from backend
feat(frontend): update EventLog with real-time backend events
feat(frontend): connect SpeedControl to backend set-speed event
docs: update README and phase checklist for phase 2
```

### FASE 3 — Sensor de Porta

```
feat(backend): add door sensor logic with attempt counter
feat(backend): persist door events to PostgreSQL
feat(backend): add operator alert emission on max attempts
feat(backend): add door timeout escalation after 30s
feat(frontend): update DoorSensor to emit door:block via WebSocket
feat(frontend): update OperatorPanel to emit operator:force-stop
feat(frontend): add visual alert when max door attempts reached
test(backend): add door sensor unit tests
docs: update README and phase checklist for phase 3
```

### FASE 4 — Polimento

```
feat: add Linha Sul with 15 stations to backend and frontend
feat(frontend): render both lines simultaneously on dashboard
feat(backend): add transfer logic at Joana Bezerra and Recife
chore: add GitHub Actions CI workflow
chore: add frontend Dockerfile for production build
docs: update README with demo GIF and deployment instructions
```

---

## Regras

1. **Um commit por entregável** — nunca agrupar coisas não relacionadas
2. **Mensagens em inglês** — padrão de mercado
3. **Descrição curta** — máximo 72 caracteres na primeira linha
4. **Corpo opcional** — use para explicar o "por quê", não o "o quê"
5. **Nunca commitar** arquivos `.env`, `node_modules/`, `dist/`, `.next/`
