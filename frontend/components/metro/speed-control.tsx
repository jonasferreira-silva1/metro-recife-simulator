"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Gauge, Play, Pause } from "lucide-react";

interface SpeedControlProps {
  speed: number;
  isRunning: boolean;
  onSpeedChange: (speed: number) => void;
  onToggleRunning: () => void;
}

const speedOptions = [1, 2, 5, 10];

export function SpeedControl({
  speed,
  isRunning,
  onSpeedChange,
  onToggleRunning,
}: SpeedControlProps) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:w-auto sm:gap-4 sm:px-4">
      <div className="hidden items-center gap-2 sm:flex">
        <Gauge className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Velocidade
        </span>
      </div>
      <Gauge className="h-4 w-4 shrink-0 text-muted-foreground sm:hidden" />

      <div className="flex flex-1 gap-1 sm:flex-none">
        {speedOptions.map((s) => (
          <Button
            key={s}
            variant={speed === s ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-7 flex-1 text-xs sm:w-10 sm:flex-none",
              speed === s && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSpeedChange(s)}
          >
            {s}x
          </Button>
        ))}
      </div>

      <div className="h-4 w-px shrink-0 bg-border" />

      <Button
        variant={isRunning ? "default" : "outline"}
        size="sm"
        className="h-7 shrink-0 gap-1 text-xs"
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
