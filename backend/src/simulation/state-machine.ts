/**
 * Enum que representa todos os estados possíveis que um trem pode assumir.
 * Esta é a base da FSM (Finite State Machine).
 */
export enum TrainState {
  MOVING = 'MOVING',               // Trem em movimento entre estações
  ARRIVING = 'ARRIVING',           // Trem a 500m da estação, desacelerando
  STOPPED = 'STOPPED',             // Trem parado na plataforma, portas ainda fechadas
  DOORS_OPEN = 'DOORS_OPEN',       // Portas abertas, passageiros embarcando/desembarcando
  DOORS_CLOSING = 'DOORS_CLOSING', // Aviso sonoro tocando, portas fechando
  DOOR_BLOCKED = 'DOOR_BLOCKED',   // Sensor ativado (alguém/algo bloqueou a porta)
  DEPARTING = 'DEPARTING',         // Portas fechadas confirmadas, aguardando liberação da via
}

export interface StationData {
  id: string;
  name: string;
  dwellTime: number; // Tempo padrão em que o trem deve ficar parado nesta estação
}

export interface TrainContext {
  id: string;
  state: TrainState;
  currentStationIndex: number;
  timeInState: number; // Quantos "ticks" (segundos simulados) o trem já passou neste estado
  doorAttempts: number; // Quantas vezes a porta foi bloqueada consecutivamente
  lineLength: number; // Total de estações na linha (usado para saber quando retornar)
  speedMultiplier: number; // Acelerador de tempo (ex: 2x, 5x) para testes mais rápidos
  isForward: boolean; // Direção: true = sentido Camaragibe->Recife, false = sentido Recife->Camaragibe
}

export interface TransitionResult {
  newState: TrainState;
  stationIndexDelta: number; // 0 = mesma estação, 1 = avança, -1 = volta
  doorAttemptsReset: boolean; // Se as portas fecharam com sucesso, resetamos o contador de falhas
  eventToEmit?: 'train:arrived' | 'train:departed'; // Gatilho de eventos para o WebSocket
  directionReversed?: boolean; // Verdadeiro quando o trem bate no final da linha e inverte a direção
}

/**
 * Função Pura: Processa um "tick" de tempo do trem e decide se ele deve mudar de estado.
 * Por ser uma função pura, é extremamente fácil de testar unitariamente.
 * 
 * @returns {TransitionResult | null} Retorna o novo estado ou null se não houve mudança.
 */
export function processTick(
  train: TrainContext,
  currentStation: StationData,
  doorSensorProbability: number = 0.0,
  maxDoorAttempts: number = 3
): TransitionResult | null {
  const t = train.timeInState;
  
  // Função auxiliar para calcular os ticks baseados no multiplicador de velocidade
  // Math.max(1, ...) garante que um estado dure pelo menos 1 tick, mesmo em velocidade 10x
  const ticks = (base: number) => Math.max(1, Math.round(base / train.speedMultiplier));

  switch (train.state) {
    case TrainState.MOVING:
      // O trem leva 15 ticks viajando entre as estações (antes de começar a chegar)
      if (t >= ticks(15)) {
        return { newState: TrainState.ARRIVING, stationIndexDelta: 0, doorAttemptsReset: false };
      }
      break;

    case TrainState.ARRIVING:
      // Ao parar na plataforma, o índice da estação avança (ou recua no sentido return).
      // Durante MOVING/ARRIVING o trem permanece indexado na estação de ORIGEM do trecho.
      if (t >= ticks(3)) {
        const arrivalDelta = train.isForward ? 1 : -1;
        return {
          newState: TrainState.STOPPED,
          stationIndexDelta: arrivalDelta,
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
      // Fica de portas abertas pela metade do tempo de parada estipulado da estação (mínimo de 5 ticks)
      const minDwell = Math.max(5, currentStation.dwellTime / 2);
      if (t >= ticks(minDwell)) {
        return { newState: TrainState.DOORS_CLOSING, stationIndexDelta: 0, doorAttemptsReset: false };
      }
      break;
    }

    case TrainState.DOORS_CLOSING:
      if (t >= ticks(3)) {
        // LÓGICA DE SENSOR DE PORTA:
        // Há uma probabilidade aleatória da porta ser bloqueada enquanto fecha.
        if (Math.random() < doorSensorProbability && train.doorAttempts < maxDoorAttempts) {
          // Bloqueou! Vai para o estado DOOR_BLOCKED
          return { newState: TrainState.DOOR_BLOCKED, stationIndexDelta: 0, doorAttemptsReset: false };
        }
        // Fechou com sucesso! Vai para DEPARTING e reseta o contador de falhas
        return { newState: TrainState.DEPARTING, stationIndexDelta: 0, doorAttemptsReset: true };
      }
      break;

    case TrainState.DOOR_BLOCKED:
      // Fica bloqueado por 3 ticks (aviso visual/sonoro), depois reabre a porta compulsoriamente
      if (t >= ticks(3)) { 
        return { newState: TrainState.DOORS_OPEN, stationIndexDelta: 0, doorAttemptsReset: false };
      }
      break;

    case TrainState.DEPARTING:
      if (t >= ticks(2)) {
        let reversed = false;

        // Terminal: inverte sentido; o índice só muda na chegada (ARRIVING → STOPPED)
        if (train.isForward && train.currentStationIndex >= train.lineLength - 1) {
          reversed = true;
        } else if (!train.isForward && train.currentStationIndex <= 0) {
          reversed = true;
        }

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

  // Se o tempo no estado atual ainda não foi suficiente para a transição, retorna null
  return null;
}
