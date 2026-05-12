# 06 — Contrato WebSocket

Todos os eventos trafegam via Socket.io. O frontend conecta ao namespace raiz.

> O backend **nunca** espera confirmação do frontend para avançar estados — a simulação é autônoma.

---

## Eventos Servidor → Cliente

| Evento | Payload | Descrição |
|---|---|---|
| `train:state-changed` | `{ trainId, state, station, timestamp }` | Principal evento da FSM |
| `train:door-event` | `{ trainId, event, attempts, station }` | Eventos do sensor de porta |
| `train:arrived` | `{ trainId, station, dwellTime }` | Trem chegou na plataforma |
| `train:departed` | `{ trainId, fromStation, toStation }` | Trem saiu da estação |
| `simulation:tick` | `{ timestamp, trains[] }` | Snapshot completo a cada segundo |
| `operator:alert` | `{ trainId, alertType, station, message }` | Escalonamento para operador |

---

## Eventos Cliente → Servidor

| Evento | Payload | Ação |
|---|---|---|
| `simulation:set-speed` | `{ multiplier: 1\|2\|5\|10 }` | Altera velocidade da simulação |
| `door:block` | `{ trainId }` | Aciona sensor de porta (teste manual) |
| `door:unblock` | `{ trainId }` | Remove bloqueio do sensor |
| `operator:force-stop` | `{ trainId }` | Parada de emergência |
| `operator:release` | `{ trainId }` | Libera trem após intervenção manual |

---

## Endpoints REST

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/simulation/status` | Estado atual de todos os trens |
| `GET` | `/simulation/trains` | Lista todos os trens |
| `GET` | `/simulation/trains/:id` | Trem específico |
| `POST` | `/simulation/:trainId/door-event` | Evento de porta via REST (testes) |
| `POST` | `/simulation/:trainId/force-stop` | Parada de emergência via REST |
| `POST` | `/simulation/:trainId/release` | Libera trem via REST |
| `GET` | `/simulation/events` | Últimos 100 eventos do banco |
