'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Gauge, Play, Pause } from 'lucide-react';

interface SpeedControlProps {
  speed: number;
  isRunning: boolean;
  onSpeedChange: (speed: number) => void;
  onToggleRunning: () => void;
}

const speedOptions = [1, 2, 5, 10];

export function SpeedControl({ speed, isRunning, onSpeedChange, onToggleRunning }: SpeedControlProps) {
  return (
    <div className="flex w-full min-w-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">
      {/* Ícone de velocidade */}
      <Gauge className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

      {/* Botões de velocidade: tamanho fixo pequeno para caber em 375px */}
      <div className="flex gap-1 shrink-0">
        {speedOptions.map((s) => (
          <Button
            key={s}
            variant={speed === s ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 w-9 p-0 text-xs',
              speed === s && 'bg-primary text-primary-foreground',
            )}
            onClick={() => onSpeedChange(s)}
          >
            {s}x
          </Button>
        ))}
      </div>

      <div className="h-4 w-px shrink-0 bg-border mx-0.5" />

      {/* Botão pausar/iniciar — só ícone no mobile */}
      <Button
        variant={isRunning ? 'default' : 'outline'}
        size="sm"
        className="h-7 shrink-0 gap-1 px-2 text-xs"
        onClick={onToggleRunning}
      >
        {isRunning ? (
          <>
            <Pause className="h-3 w-3" />
            <span className="hidden sm:inline">Pausar</span>
          </>
        ) : (
          <>
            <Play className="h-3 w-3" />
            <span className="hidden sm:inline">Iniciar</span>
          </>
        )}
      </Button>
    </div>
  );
}
