# TODO - MetroRecife Simulator

## Fase 3 — Concluída

- [x] Handlers `@SubscribeMessage` no `SimulationGateway`
- [x] Métodos no `SimulationService` (block, unblock, force-stop, release, set-speed)
- [x] Eventos `train:door-event` e `operator:alert`
- [x] `DOOR_BLOCK_TIMEOUT` e `MAX_DOOR_ATTEMPTS` no motor
- [x] Frontend: `socket-client` + `emit` no `simulation-store`
- [x] REST: `POST /simulation/:trainId/door-event`, `force-stop`, `release`
- [x] README atualizado (storytelling + fases)

## Fase 4 — Próximos passos

- [x] GitHub Actions (CI com testes)
- [ ] GIF de demonstração no README
- [x] Deploy (Railway/Render)
- [x] Pausar simulação global
- [ ] Pacote `shared` para tipos front/back
- [x] Remover `frontend/lib/metro/simulation.ts` (legado)
