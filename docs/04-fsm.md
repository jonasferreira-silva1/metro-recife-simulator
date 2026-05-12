# 04 — Máquina de Estados do Trem (FSM)

## Estados Definidos

| Estado | Enum | Descrição |
|---|---|---|
| Em Trânsito | `MOVING` | Trem se deslocando entre duas estações |
| Chegando | `ARRIVING` | Trem desacelerando, a 500m da próxima estação |
| Parado | `STOPPED` | Trem parado na plataforma, portas ainda fechadas |
| Portas Abertas | `DOORS_OPEN` | Portas abertas, embarque e desembarque em curso |
| Sensor Ativo | `DOOR_BLOCKED` | Sensor de porta acionado — objeto ou pessoa detectados |
| Portas Fechando | `DOORS_CLOSING` | Comando de fechar portas emitido, aguardando confirmação |
| Partindo | `DEPARTING` | Portas confirmadas fechadas, aguardando liberação da via |

---

## Fluxo de Transição

```
MOVING
  └─(distância < 500m)──► ARRIVING
                              └─(velocidade = 0)──► STOPPED
                                                       └─(automático)──► DOORS_OPEN
                                                                            │
                                                              ┌─────────────┴──────────────┐
                                                         (sensor OK)               (sensor BLOQUEADO)
                                                              │                            │
                                                        DOORS_CLOSING              DOOR_BLOCKED
                                                              │                            │
                                                    (portas confirmadas)       (obstáculo removido)
                                                              │                            │
                                                          DEPARTING                  DOORS_OPEN
                                                              │
                                                    (via liberada)
                                                              │
                                                           MOVING
```

---

## Transições Válidas

```typescript
MOVING        → [ARRIVING]
ARRIVING      → [STOPPED]
STOPPED       → [DOORS_OPEN]
DOORS_OPEN    → [DOORS_CLOSING, DOOR_BLOCKED]
DOOR_BLOCKED  → [DOORS_OPEN]
DOORS_CLOSING → [DEPARTING, DOOR_BLOCKED]
DEPARTING     → [MOVING]
```

---

## Lógica do Sensor de Porta

1. O sensor é simulado via evento WebSocket (botão "Bloquear Porta") ou automaticamente com probabilidade configurável (`DOOR_SENSOR_PROBABILITY`)
2. Cada acionamento incrementa um contador de tentativas (`doorAttempts`)
3. Após `MAX_DOOR_ATTEMPTS` tentativas, o sistema emite alerta para o painel do operador
4. Após `DOOR_BLOCK_TIMEOUT` segundos no estado `DOOR_BLOCKED`, o sistema escala para intervenção manual
5. Todos os eventos do sensor são persistidos no banco com timestamp, estação e número de tentativas

---

## Duração Padrão dos Estados (em ticks)

| Estado | Ticks | Observação |
|---|---|---|
| `MOVING` | 15 | ~15 segundos entre estações |
| `ARRIVING` | 3 | Desaceleração |
| `STOPPED` | 2 | Antes de abrir portas |
| `DOORS_OPEN` | dwellTime / 2 | Mínimo de 5 ticks |
| `DOORS_CLOSING` | 3 | Fechamento das portas |
| `DOOR_BLOCKED` | 3 | Antes de reabrir |
| `DEPARTING` | 2 | Antes de partir |

> 1 tick = 1 segundo base (ajustado pelo `speedMultiplier`)
