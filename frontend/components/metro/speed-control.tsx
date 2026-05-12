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
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Velocidade
        </span>
      </div>

      <div className="flex gap-1">
        {speedOptions.map((s) => (
          <Button
            key={s}
            variant={speed === s ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-7 w-10 text-xs",
              speed === s && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSpeedChange(s)}
          >
            {s}x
          </Button>
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      <Button
        variant={isRunning ? "default" : "outline"}
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={onToggleRunning}
      >
        {isRunning ? (
          <>
            <Pause className="h-3 w-3" />
            Pausar
          </>
        ) : (
          <>
            <Play className="h-3 w-3" />
            Iniciar
          </>
        )}
      </Button>
    </div>
  );
}
