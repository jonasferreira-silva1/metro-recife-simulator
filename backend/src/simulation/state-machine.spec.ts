import { TrainState, processTick, TrainContext, StationData } from './state-machine';

/**
 * SUÍTE DE TESTES UNITÁRIOS DA MÁQUINA DE ESTADOS
 * Como a FSM foi escrita como uma função pura (sem dependência de banco de dados ou NestJS),
 * os testes rodam quase instantaneamente. Eles garantem que as regras de negócio
 * da FSM nunca quebrem no futuro.
 */
describe('State Machine FSM', () => {
  const stationMock: StationData = {
    id: 's1',
    name: 'Station 1',
    dwellTime: 30, // mindwell will be 15
  };

  const createBaseContext = (state: TrainState, timeInState: number = 0): TrainContext => ({
    id: 't1',
    state,
    currentStationIndex: 0,
    timeInState,
    doorAttempts: 0,
    lineLength: 15,
    speedMultiplier: 1.0,
    isForward: true,
  });

  it('should transition from MOVING to ARRIVING after 15 ticks', () => {
    // Cenário: Trem está viajando há 14 segundos. Não deve acontecer nada ainda.
    const ctx = createBaseContext(TrainState.MOVING, 14);
    const resultNoOp = processTick(ctx, stationMock, 0, 3);
    expect(resultNoOp).toBeNull();

    // Cenário: Trem atingiu 15 segundos de viagem. Deve começar a chegar na estação.
    const ctxDone = createBaseContext(TrainState.MOVING, 15);
    const result = processTick(ctxDone, stationMock, 0, 3);
    
    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.ARRIVING);
  });

  it('should transition from ARRIVING to STOPPED after 3 ticks and emit train:arrived', () => {
    const ctx = createBaseContext(TrainState.ARRIVING, 3);
    const result = processTick(ctx, stationMock, 0, 3);

    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.STOPPED);
    expect(result!.eventToEmit).toBe('train:arrived');
    expect(result!.stationIndexDelta).toBe(1);
  });

  it('should retreat station index on arrival when moving return', () => {
    const ctx = createBaseContext(TrainState.ARRIVING, 3);
    ctx.isForward = false;
    ctx.currentStationIndex = 5;
    const result = processTick(ctx, stationMock, 0, 3);

    expect(result!.stationIndexDelta).toBe(-1);
  });

  it('should transition from STOPPED to DOORS_OPEN after 2 ticks', () => {
    const ctx = createBaseContext(TrainState.STOPPED, 2);
    const result = processTick(ctx, stationMock, 0, 3);
    
    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.DOORS_OPEN);
  });

  it('should wait half dwellTime in DOORS_OPEN before CLOSING', () => {
    // Cenário: dwellTime é 30, então a porta deve ficar aberta por 15 ticks.
    // Com 14 ticks, a porta continua aberta.
    const ctx = createBaseContext(TrainState.DOORS_OPEN, 14);
    expect(processTick(ctx, stationMock, 0, 3)).toBeNull();

    // Com 15 ticks, ela finalmente começa a fechar.
    const ctxDone = createBaseContext(TrainState.DOORS_OPEN, 15); // 30 / 2 = 15
    const result = processTick(ctxDone, stationMock, 0, 3);
    
    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.DOORS_CLOSING);
  });

  it('should transition from DOORS_CLOSING to DEPARTING if no door block', () => {
    const ctx = createBaseContext(TrainState.DOORS_CLOSING, 3);
    const result = processTick(ctx, stationMock, 0, 3); // 0 prob
    
    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.DEPARTING);
    expect(result!.doorAttemptsReset).toBe(true);
  });

  it('should block door if probability triggers', () => {
    // Cenário: Forçamos a probabilidade do sensor para 100% (1.0).
    const ctx = createBaseContext(TrainState.DOORS_CLOSING, 3);
    const result = processTick(ctx, stationMock, 1.0, 3); // 1.0 = 100% chance de falha
    
    // O trem é barrado de partir e entra no estado DOOR_BLOCKED
    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.DOOR_BLOCKED);
  });

  it('should reopen doors from DOOR_BLOCKED after 3 ticks', () => {
    const ctx = createBaseContext(TrainState.DOOR_BLOCKED, 3);
    const result = processTick(ctx, stationMock, 0, 3); 
    
    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.DOORS_OPEN);
  });

  it('should transition DEPARTING to MOVING without advancing station (trecho inicia na origem)', () => {
    const ctx = createBaseContext(TrainState.DEPARTING, 2);
    const result = processTick(ctx, stationMock, 0, 3);

    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.MOVING);
    expect(result!.eventToEmit).toBe('train:departed');
    expect(result!.stationIndexDelta).toBe(0);
  });

  it('should reverse direction at terminal', () => {
    const ctx = createBaseContext(TrainState.DEPARTING, 2);
    ctx.currentStationIndex = 14; // end of line (length 15)
    
    const result = processTick(ctx, stationMock, 0, 3);
    
    expect(result).not.toBeNull();
    expect(result!.newState).toBe(TrainState.MOVING);
    expect(result!.stationIndexDelta).toBe(0); // stay at terminal but start going back
    expect(result!.directionReversed).toBe(true);
  });
});
