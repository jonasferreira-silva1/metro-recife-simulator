/**
 * Enum com todos os estados possíveis de um trem.
 * É a base da FSM (Finite State Machine).
 */
export enum TrainState {
  MOVING         = 'MOVING',         // Trem em movimento entre estações
  ARRIVING       = 'ARRIVING',       // Trem desacelerando, a ~500m da estação
  STOPPED        = 'STOPPED',        // Parado na plataforma, portas ainda fechadas
  DOORS_OPEN     = 'DOORS_OPEN',     // Portas abertas, embarque/desembarque em curso
  DOORS_CLOSING  = 'DOORS_CLOSING',  // Aviso sonoro ativo, portas fechando
  DOOR_BLOCKED   = 'DOOR_BLOCKED',   // Sensor acionado — algo obstruiu a porta
  DEPARTING      = 'DEPARTING',      // Portas confirmadas fechadas, aguardando via livre
}

export interface StationData {
  id: string;
  name: string;
  /** Tempo padrão (em segundos) que o trem permanece parado nesta estação */
  dwellTime: number;
}

export interface TrainContext {
  id: string;
  state: TrainState;
  currentStationIndex: number;
  /** Quantos ticks o trem já passou no estado atual */
  timeInState: number;
  /** Quantas vezes a porta foi bloqueada consecutivamente nesta parada */
  doorAttempts: number;
  /** Total de estações na linha — usado para detectar o terminal */
  lineLength: number;
  /** Multiplicador de velocidade (1x, 2x, 5x, 10x) para acelerar testes */
  speedMultiplier: number;
  /** true = sentido terminal final; false = sentido terminal inicial */
  isForward: boolean;
}

export interface TransitionResult {
  newState: TrainState;
  /** 0 = mesma estação | +1 = avança | -1 = recua */
  stationIndexDelta: number;
  /** Portas fecharam com sucesso — zera o contador de bloqueios */
  doorAttemptsReset: boolean;
  /** Evento WebSocket a disparar após a transição */
  eventToEmit?: 'train:arrived' | 'train:departed';
  /** true quando o trem chega ao terminal e inverte a direção */
  directionReversed?: boolean;
}

/**
 * Processa um tick da FSM e decide se o trem deve mudar de estado.
 *
 * Função pura: não tem efeitos colaterais, facilitando testes unitários.
 * Retorna null quando o tempo no estado atual ainda não é suficiente para transição.
 */
export function processTick(
  train: TrainContext,
  currentStation: StationData,
  doorSensorProbability = 0.0,
  maxDoorAttempts = 3,
): TransitionResult | null {
  const t = train.timeInState;

  // Garante que cada estado dure pelo menos 1 tick, mesmo em velocidade máxima
  const ticks = (base: number) => Math.max(1, Math.round(base / train.speedMultiplier));

  switch (train.state) {
    case TrainState.MOVING:
      // 15 ticks de viagem antes de começar a desacelerar
      if (t >= ticks(15)) {
        return { newState: TrainState.ARRIVING, stationIndexDelta: 0, doorAttemptsReset: false };
      }
      break;

    case TrainState.ARRIVING:
      // Ao parar, avança (ou recua) o índice para a estação de destino
      if (t >= ticks(3)) {
        const delta = train.isForward ? 1 : -1;
        return {
          newState: TrainState.STOPPED,
          stationIndexDelta: delta,
          doorAttemptsReset: false,
          eventToEmit: 'train:arrived',
        };
      }
      break;

    case TrainState.STOPPED:
      // Aguarda 2 ticks parado antes de abrir as portas
      if (t >= ticks(2)) {
        return { newState: TrainState.DOORS_OPEN, stationIndexDelta: 0, doorAttemptsReset: false };
      }
      break;

    case TrainState.DOORS_OPEN: {
      // Fica com portas abertas pela metade do dwell time (mínimo 5 ticks)
      const minDwell = Math.max(5, currentStation.dwellTime / 2);
      if (t >= ticks(minDwell)) {
        return { newState: TrainState.DOORS_CLOSING, stationIndexDelta: 0, doorAttemptsReset: false };
      }
      break;
    }

    case TrainState.DOORS_CLOSING:
      if (t >= ticks(3)) {
        // Probabilidade aleatória de bloqueio enquanto as portas fecham
        if (Math.random() < doorSensorProbability && train.doorAttempts < maxDoorAttempts) {
          return { newState: TrainState.DOOR_BLOCKED, stationIndexDelta: 0, doorAttemptsReset: false };
        }
        // Fechou com sucesso — reseta o contador de bloqueios
        return { newState: TrainState.DEPARTING, stationIndexDelta: 0, doorAttemptsReset: true };
      }
      break;

    case TrainState.DOOR_BLOCKED:
      // Após 3 ticks bloqueado, reabre as portas compulsoriamente
      if (t >= ticks(3)) {
        return { newState: TrainState.DOORS_OPEN, stationIndexDelta: 0, doorAttemptsReset: false };
      }
      break;

    case TrainState.DEPARTING:
      if (t >= ticks(2)) {
        // Verifica se chegou ao terminal para inverter a direção
        const atEndTerminal = train.isForward && train.currentStationIndex >= train.lineLength - 1;
        const atStartTerminal = !train.isForward && train.currentStationIndex <= 0;
        const reversed = atEndTerminal || atStartTerminal;

        return {
          newState: TrainState.MOVING,
          stationIndexDelta: 0,
          doorAttemptsReset: false,
          eventToEmit: 'train:departed',
          directionReversed: reversed,
        };
      }
      break;
  }

  // Tempo insuficiente para transição — mantém o estado atual
  return null;
}
