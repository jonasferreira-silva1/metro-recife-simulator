'use client';

import { cn } from '@/lib/utils';
import { Train, TrainState, Line, Direction } from '@/lib/metro/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Train as TrainIcon,
  ArrowRight,
  ArrowLeft,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  Hand,
  Play,
  Square,
} from 'lucide-react';
import { blockDoor, unblockDoor, forceStop, releaseTrain } from '@/lib/metro/simulation-store';

const stateLabels: Record<TrainState, string> = {
  [TrainState.MOVING]:        'Em Trânsito',
  [TrainState.ARRIVING]:      'Chegando',
  [TrainState.STOPPED]:       'Parado',
  [TrainState.DOORS_OPEN]:    'Portas Abertas',
  [TrainState.DOOR_BLOCKED]:  'Porta Bloqueada',
  [TrainState.DOORS_CLOSING]: 'Portas Fechando',
  [TrainState.DEPARTING]:     'Partindo',
};

const stateIcons: Record<TrainState, React.ComponentType<{ className?: string }>> = {
  [TrainState.MOVING]:        TrainIcon,
  [TrainState.ARRIVING]:      TrainIcon,
  [TrainState.STOPPED]:       Square,
  [TrainState.DOORS_OPEN]:    DoorOpen,
  [TrainState.DOOR_BLOCKED]:  AlertTriangle,
  [TrainState.DOORS_CLOSING]: DoorClosed,
  [TrainState.DEPARTING]:     Play,
};

interface TrainCardProps {
  train: Train;
  showControls?: boolean;
}

export function TrainCard({ train, showControls = true }: TrainCardProps) {
  const lineColor = train.line === Line.CENTRO ? 'var(--metro-centro)' : 'var(--metro-sul)';
  const lineName = train.line === Line.CENTRO ? 'Linha Centro' : 'Linha Sul';
  const isBlocked = train.state === TrainState.DOOR_BLOCKED;
  const isMoving = train.state === TrainState.MOVING || train.state === TrainState.ARRIVING;
  const StateIcon = stateIcons[train.state];

  return (
    <Card className={cn('relative overflow-hidden transition-all', isBlocked && 'ring-2 ring-destructive')}>
      {/* Barra colorida lateral identifica a linha visualmente */}
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: lineColor }} />

      <CardHeader className="pb-2 pl-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrainIcon className="h-4 w-4" style={{ color: lineColor }} />
            <CardTitle className="text-sm font-semibold">{train.name}</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: lineColor, color: lineColor }}>
            {lineName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pl-4">
        {/* Estado atual com ícone correspondente */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StateIcon className={cn('h-4 w-4', isBlocked ? 'text-destructive' : 'text-muted-foreground')} />
            <span className={cn('text-sm font-medium', isBlocked && 'text-destructive')}>
              {stateLabels[train.state]}
            </span>
          </div>

          {train.doorAttempts > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {train.doorAttempts} bloqueio{train.doorAttempts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Barra de progresso só aparece quando o trem está em movimento */}
        {isMoving && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{Math.round(train.progress)}%</span>
            </div>
            <Progress value={train.progress} className="h-1" />
          </div>
        )}

        {/* Estação atual e próxima */}
        <div className="flex items-center justify-between rounded bg-muted/50 p-2">
          <div className="text-center">
            <div className="text-[10px] uppercase text-muted-foreground">Atual</div>
            <div className="text-xs font-medium">{train.currentStation.name}</div>
          </div>

          <div className="flex items-center">
            {train.direction === Direction.FORWARD ? (
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase text-muted-foreground">Próxima</div>
            <div className="text-xs font-medium">{train.nextStation?.name ?? 'Terminal'}</div>
          </div>
        </div>

        {/* Botões de controle do operador — aparecem conforme o estado do trem */}
        {showControls && (
          <div className="flex flex-wrap gap-2">
            {train.state === TrainState.DOORS_OPEN && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => blockDoor(train.id)}>
                <Hand className="mr-1 h-3 w-3" />
                Bloquear Porta
              </Button>
            )}

            {train.state === TrainState.DOOR_BLOCKED && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => unblockDoor(train.id)}
              >
                <DoorOpen className="mr-1 h-3 w-3" />
                Desbloquear
              </Button>
            )}

            {isMoving && (
              <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => forceStop(train.id)}>
                <Square className="mr-1 h-3 w-3" />
                Parar
              </Button>
            )}

            {(train.state === TrainState.STOPPED || train.state === TrainState.DOOR_BLOCKED) && (
              <Button variant="default" size="sm" className="h-7 text-xs" onClick={() => releaseTrain(train.id)}>
                <Play className="mr-1 h-3 w-3" />
                Liberar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
