# 05 — Modelo de Dados

## Station

```sql
stations
  id           UUID PRIMARY KEY
  name         VARCHAR(100) NOT NULL
  line         ENUM('centro', 'sul') NOT NULL
  order_index  INTEGER NOT NULL           -- posição na linha (0-indexed)
  is_terminal  BOOLEAN DEFAULT false
  is_transfer  BOOLEAN DEFAULT false      -- integração entre linhas/modal
  dwell_time   INTEGER DEFAULT 30         -- tempo padrão de parada em segundos
  created_at   TIMESTAMP
```

## Train

```sql
trains
  id                UUID PRIMARY KEY
  name              VARCHAR(50)             -- ex: 'Trem Centro 01'
  line              ENUM('centro', 'sul')
  state             ENUM(TrainState)        -- estado atual da FSM
  current_station   UUID REFERENCES stations
  next_station      UUID REFERENCES stations
  direction         ENUM('forward', 'return')
  door_attempts     INTEGER DEFAULT 0
  speed_multiplier  FLOAT DEFAULT 1.0
  updated_at        TIMESTAMP
```

## SimulationEvent

```sql
simulation_events
  id          UUID PRIMARY KEY
  train_id    UUID REFERENCES trains
  station_id  UUID REFERENCES stations
  event_type  ENUM(EventType)
  payload     JSONB                        -- dados extras do evento
  occurred_at TIMESTAMP
```

---

## Tipos de Evento (EventType)

| Enum | Descrição |
|---|---|
| `TRAIN_DEPARTED` | Trem saiu da estação |
| `TRAIN_ARRIVED` | Trem chegou na estação |
| `DOORS_OPENED` | Portas abertas |
| `DOORS_CLOSED` | Portas confirmadas fechadas |
| `DOOR_BLOCKED` | Sensor de porta acionado |
| `DOOR_UNBLOCKED` | Obstáculo removido |
| `OPERATOR_ALERT` | Escalonamento para operador |
| `SPEED_CHANGED` | Multiplicador de velocidade alterado |
