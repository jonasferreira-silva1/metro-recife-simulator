"use client";

import { cn } from "@/lib/utils";
import { SimulationEvent, EventType } from "@/lib/metro/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Train,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  CheckCircle,
  Gauge,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Configuração de cada tipo de evento
const eventConfig: Record<
  EventType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
  }
> = {
  [EventType.TRAIN_DEPARTED]: {
    icon: ArrowRight,
    label: "Partiu",
    color: "text-primary",
  },
  [EventType.TRAIN_ARRIVED]: {
    icon: Train,
    label: "Chegou",
    color: "text-[var(--metro-success)]",
  },
  [EventType.DOORS_OPENED]: {
    icon: DoorOpen,
    label: "Portas abertas",
    color: "text-muted-foreground",
  },
  [EventType.DOORS_CLOSED]: {
    icon: DoorClosed,
    label: "Portas fechadas",
    color: "text-muted-foreground",
  },
  [EventType.DOOR_BLOCKED]: {
    icon: AlertTriangle,
    label: "Porta bloqueada",
    color: "text-[var(--metro-warning)]",
  },
  [EventType.DOOR_UNBLOCKED]: {
    icon: CheckCircle,
    label: "Porta liberada",
    color: "text-[var(--metro-success)]",
  },
  [EventType.OPERATOR_ALERT]: {
    icon: AlertTriangle,
    label: "Alerta operador",
    color: "text-destructive",
  },
  [EventType.SPEED_CHANGED]: {
    icon: Gauge,
    label: "Velocidade alterada",
    color: "text-primary",
  },
};

interface EventLogProps {
  events: SimulationEvent[];
  maxItems?: number;
}

export function EventLog({ events, maxItems = 50 }: EventLogProps) {
  const displayEvents = events.slice(-maxItems).reverse();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Log de Eventos</h3>
        <span className="text-xs text-muted-foreground">
          {events.length} evento{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-1 p-2">
          {displayEvents.length === 0 ? (
            <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
              Nenhum evento registrado
            </div>
          ) : (
            displayEvents.map((event) => {
              const config = eventConfig[event.eventType];
              const Icon = config.icon;
              const time = formatDistanceToNow(new Date(event.occurredAt), {
                addSuffix: true,
                locale: ptBR,
              });

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/50"
                >
                  <Icon className={cn("mt-0.5 h-3 w-3 shrink-0", config.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className={cn("font-medium", config.color)}>
                        {config.label}
                      </span>
                      {event.stationName && (
                        <>
                          <span className="text-muted-foreground">em</span>
                          <span className="truncate font-medium">
                            {event.stationName}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{time}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
