'use client';

import { cn } from '@/lib/utils';
import { Train, TrainState } from '@/lib/metro/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, DoorClosed, AlertTriangle, Hand, CheckCircle, Wifi } from 'lucide-react';
import { blockDoor, unblockDoor } from '@/lib/metro/simulation-store';

interface DoorSensorProps {
  train: Train;
}

/** Limite de tentativas antes de escalar para o operador */
const MAX_ATTEMPTS = 3;

export function DoorSensor({ train }: DoorSensorProps) {
  const isBlocked  = train.state === TrainState.DOOR_BLOCKED;
  const isOpen     = train.state === TrainState.DOORS_OPEN;
  const isClosing  = train.state === TrainState.DOORS_CLOSING;
  const canInteract = isOpen || isClosing || isBlocked;
  const attemptsProgress = (train.doorAttempts / MAX_ATTEMPTS) * 100;

  return (
    <Card className={cn('relative overflow-hidden transition-all', isBlocked && 'border-destructive ring-2 ring-destructive/20')}>
      {/* Indicador de status no canto superior direito */}
      <div
        className={cn(
          'absolute right-3 top-3 h-2 w-2 rounded-full',
          isBlocked ? 'animate-pulse bg-destructive' : canInteract ? 'bg-[var(--metro-success)]' : 'bg-muted-foreground',
        )}
      />

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Sensor de Porta</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{train.name}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estado atual da porta com ícone e badge */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isBlocked ? 'bg-destructive/20' : isOpen ? 'bg-[var(--metro-success)]/20' : 'bg-muted',
              )}
            >
              {isBlocked ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : isOpen ? (
                <DoorOpen className="h-5 w-5 text-[var(--metro-success)]" />
              ) : (
                <DoorClosed className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div>
              <div className="text-sm font-medium">
                {isBlocked ? 'Obstrução Detectada' : isOpen ? 'Portas Abertas' : isClosing ? 'Fechando...' : 'Portas Fechadas'}
              </div>
              <div className="text-xs text-muted-foreground">{train.currentStation.name}</div>
            </div>
          </div>

          <Badge variant={isBlocked ? 'destructive' : 'outline'} className="text-[10px]">
            {isBlocked ? 'BLOQUEADO' : canInteract ? 'ATIVO' : 'INATIVO'}
          </Badge>
        </div>

        {/* Contador de tentativas com barra de progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tentativas de bloqueio</span>
            <span className={cn('font-medium', train.doorAttempts >= MAX_ATTEMPTS && 'text-destructive')}>
              {train.doorAttempts}/{MAX_ATTEMPTS}
            </span>
          </div>
          <Progress
            value={attemptsProgress}
            className={cn('h-1.5', train.doorAttempts >= MAX_ATTEMPTS && '[&>div]:bg-destructive')}
          />
          {train.doorAttempts >= MAX_ATTEMPTS && (
            <p className="flex items-center gap-1 text-[10px] text-destructive">
              <AlertTriangle className="h-3 w-3" />
              Alerta enviado ao operador
            </p>
          )}
        </div>

        {/* Visualização animada do sensor infravermelho */}
        <div className="relative h-16 overflow-hidden rounded-lg border border-border bg-muted/30">
          <div className="absolute inset-0 flex">
            {/* Porta esquerda */}
            <div className={cn('h-full bg-secondary transition-all duration-500', isOpen || isBlocked ? 'w-1/4' : 'w-1/2')}>
              <div className="flex h-full items-center justify-end pr-1">
                <div className="h-8 w-0.5 rounded bg-muted-foreground/30" />
              </div>
            </div>

            {/* Área central do sensor */}
            <div className={cn('flex flex-1 items-center justify-center transition-all', isBlocked && 'bg-destructive/20')}>
              {isBlocked && (
                <div className="flex flex-col items-center gap-1">
                  <Hand className="h-4 w-4 animate-pulse text-destructive" />
                  <span className="text-[8px] uppercase text-destructive">Obstrução</span>
                </div>
              )}
              {!isBlocked && (isOpen || isClosing) && (
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-[var(--metro-success)]" />
                  <span className="text-[8px] uppercase text-muted-foreground">Livre</span>
                </div>
              )}
            </div>

            {/* Porta direita */}
            <div className={cn('h-full bg-secondary transition-all duration-500', isOpen || isBlocked ? 'w-1/4' : 'w-1/2')}>
              <div className="flex h-full items-center pl-1">
                <div className="h-8 w-0.5 rounded bg-muted-foreground/30" />
              </div>
            </div>
          </div>

          {/* Linha do feixe infravermelho — só aparece com portas ativas */}
          {(isOpen || isClosing || isBlocked) && (
            <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center">
              <div
                className={cn(
                  'h-0.5 transition-all',
                  isBlocked ? 'w-full animate-pulse bg-destructive' : 'w-1/2 bg-primary/50',
                )}
              />
            </div>
          )}
        </div>

        {/* Controles de interação com o sensor */}
        <div className="flex gap-2">
          {isOpen && (
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => blockDoor(train.id)}>
              <Hand className="mr-1 h-3 w-3" />
              Simular Bloqueio
            </Button>
          )}

          {isBlocked && (
            <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={() => unblockDoor(train.id)}>
              <CheckCircle className="mr-1 h-3 w-3" />
              Remover Obstrução
            </Button>
          )}

          {!canInteract && (
            <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
              Sensor inativo — trem em movimento
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
