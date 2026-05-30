'use client';

import { cn } from '@/lib/utils';
import { Train, TrainState, Line, Direction } from '@/lib/metro/types';
import { Station } from '@/lib/metro/types';
import { getMapPosition } from '@/lib/metro/train-position';
import { Train as TrainIcon, AlertTriangle } from 'lucide-react';

interface TrainMapProps {
  stations: Station[];
  trains: Train[];
  line: Line;
  title: string;
}

const stateLabels: Record<TrainState, string> = {
  [TrainState.MOVING]:        'Em Trânsito',
  [TrainState.ARRIVING]:      'Chegando',
  [TrainState.STOPPED]:       'Parado',
  [TrainState.DOORS_OPEN]:    'Portas Abertas',
  [TrainState.DOOR_BLOCKED]:  'Porta Bloqueada',
  [TrainState.DOORS_CLOSING]: 'Portas Fechando',
  [TrainState.DEPARTING]:     'Partindo',
};

export function TrainMap({ stations, trains, line, title }: TrainMapProps) {
  const lineTrains = trains.filter((t) => t.line === line);
  const lineColor = line === Line.CENTRO ? 'var(--metro-centro)' : 'var(--metro-sul)';

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      {/* Cabeçalho: título pode quebrar em mobile sem comprimir o contador */}
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: lineColor }} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <div className="pl-5 text-xs text-muted-foreground sm:pl-0">
          {lineTrains.length} trem(ns) ativos
        </div>
      </div>

      {/* Mapa com scroll horizontal no mobile para não comprimir as estações */}
      <div className="relative">
        <div className="overflow-x-auto pb-2">
          <div className="relative min-w-[600px] py-8">
            {/* Trilho */}
            <div
              className="absolute left-4 right-4 top-1/2 h-2 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: lineColor }}
            />

            {/* Marcadores das estações */}
            <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
              {stations.map((station, index) => (
                <div key={station.id} className="group relative flex flex-col items-center">
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center rounded-full border-2 border-background bg-background transition-all',
                      station.isTerminal ? 'h-5 w-5' : 'h-4 w-4',
                      station.isTransfer && 'ring-2 ring-primary/50',
                    )}
                  >
                    <div
                      className={cn('rounded-full', station.isTerminal ? 'h-3 w-3' : 'h-2 w-2')}
                      style={{ backgroundColor: lineColor }}
                    />
                  </div>

                  {/* Nome alterna acima/abaixo para evitar sobreposição */}
                  <div
                    className={cn(
                      'absolute whitespace-nowrap text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground',
                      index % 2 === 0 ? 'bottom-full mb-2' : 'top-full mt-2',
                    )}
                  >
                    {station.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Ícones dos trens com animação de posição */}
            {lineTrains.map((train) => {
              const pos = getMapPosition(train);
              const percentage = (pos / (stations.length - 1)) * 100;
              const isBlocked = train.state === TrainState.DOOR_BLOCKED;
              const leftOffset = 16;
              const rightOffset = 16;

              return (
                <div
                  key={train.id}
                  className="absolute top-1/2 z-20 -translate-y-1/2 transition-all duration-500 ease-out"
                  style={{
                    left: `calc(${leftOffset}px + (100% - ${leftOffset + rightOffset}px) * ${percentage / 100})`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className={cn(
                      'group relative flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-lg transition-all',
                      isBlocked
                        ? 'animate-pulse border-destructive bg-destructive'
                        : 'border-background bg-card',
                    )}
                    style={{ boxShadow: isBlocked ? undefined : `0 0 12px ${lineColor}` }}
                  >
                    {isBlocked ? (
                      <AlertTriangle className="h-4 w-4 text-white" />
                    ) : (
                      <TrainIcon className="h-4 w-4" style={{ color: lineColor }} />
                    )}

                    {/* Seta indicando a direção do trem */}
                    <div
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2',
                        train.direction === Direction.FORWARD ? 'right-[-6px]' : 'left-[-6px]',
                      )}
                    >
                      <div
                        className={cn(
                          'h-0 w-0 border-y-4 border-y-transparent',
                          train.direction === Direction.FORWARD ? 'border-l-4' : 'border-r-4',
                        )}
                        style={{
                          borderLeftColor:
                            train.direction === Direction.FORWARD
                              ? isBlocked ? 'var(--destructive)' : lineColor
                              : 'transparent',
                          borderRightColor:
                            train.direction === Direction.RETURN
                              ? isBlocked ? 'var(--destructive)' : lineColor
                              : 'transparent',
                        }}
                      />
                    </div>

                    {/* Tooltip com detalhes do trem */}
                    <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover px-3 py-2 text-xs opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                      <div className="font-bold text-foreground">{train.name}</div>
                      <div className="text-muted-foreground">{train.currentStation.name}</div>
                      <div className={cn('mt-1 text-[10px] font-semibold', isBlocked ? 'text-destructive' : 'text-primary')}>
                        {stateLabels[train.state]}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full border-2 border-background bg-muted" />
            <span>Terminal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full border-2 border-background bg-muted ring-2 ring-primary/50" />
            <span>Integração</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          <span>Porta bloqueada</span>
        </div>
      </div>
    </div>
  );
}
